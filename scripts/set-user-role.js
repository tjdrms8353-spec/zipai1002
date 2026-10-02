'use strict';

const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const username = String(process.argv[2] || '').trim();
const role = String(process.argv[3] || '').trim();

if (!username || !['member', 'agent', 'admin'].includes(role)) {
  console.error('사용법: node scripts/set-user-role.js <아이디> <member|agent|admin>');
  process.exit(1);
}

const databasePath = process.env.ZIPAI_DB_PATH
  ? path.resolve(process.env.ZIPAI_DB_PATH)
  : path.resolve(__dirname, '..', 'data', 'zipai.sqlite');
const database = new DatabaseSync(databasePath);
const now = new Date().toISOString();
const result = database.prepare(`
  UPDATE users SET role = ?, updated_at = ?
  WHERE username = ? COLLATE NOCASE AND status = 'active'
`).run(role, now, username);
const user = database.prepare(`
  SELECT id, username, email, role, status
  FROM users WHERE username = ? COLLATE NOCASE
`).get(username);
database.close();

if (!result.changes) {
  console.error(user ? '활성 상태의 계정만 역할을 변경할 수 있습니다.' : '계정을 찾을 수 없습니다.');
  process.exit(1);
}

console.log(JSON.stringify(user, null, 2));
