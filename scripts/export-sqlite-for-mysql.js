'use strict';

// 기존 SQLite 데이터를 MySQL용 INSERT 문으로 내보냅니다.
// 실행: node scripts/export-sqlite-for-mysql.js

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');
const source = path.join(root, 'data', 'zipai.sqlite');
const output = path.join(root, 'data', 'zipai.mysql.sql');
const db = new DatabaseSync(source, { readOnly: true });

const tables = [
  ['users', ['id','username','email','phone','password_hash','role','status','created_at','updated_at']],
  ['properties', ['id','owner_id','payload_json','status','created_at','updated_at']],
  ['favorites', ['user_id','property_id','created_at']],
  ['visit_requests', ['id','requester_id','room_id','room_title','visit_date','visit_time','phone','question','status','created_at','updated_at']],
  ['room_offers', ['id','owner_id','payload_json','status','created_at','updated_at']],
  ['community_posts', ['id','author_id','category','title','content','area','rating','views','created_at','updated_at']],
  ['community_post_likes', ['post_id','user_id','created_at']],
  ['community_comments', ['id','post_id','author_id','content','created_at','updated_at']],
  ['inquiries', ['id','user_id','category','title','content','contact_email','status','answer','answered_by','answered_at','created_at','updated_at']],
  ['notifications', ['id','user_id','type','title','message','related_type','related_id','read_at','created_at']]
];

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return `'${String(value).replaceAll('\\', '\\\\').replaceAll("'", "''")}'`;
}

const lines = [
  '-- ZipAI SQLite -> MySQL data migration',
  'SET NAMES utf8mb4;',
  'SET FOREIGN_KEY_CHECKS=0;'
];

for (const [table, columns] of tables) {
  let rows;
  try { rows = db.prepare(`SELECT * FROM ${table}`).all(); } catch { continue; }
  for (const row of rows) {
    if (table === 'users') row.password_hash = `$scrypt$${row.password_salt}$${row.password_hash}`;
    const values = columns.map((column) => sql(row[column]));
    lines.push(`INSERT INTO ${table} (${columns.join(',')}) VALUES (${values.join(',')});`);
  }
}
lines.push('SET FOREIGN_KEY_CHECKS=1;', '');
fs.writeFileSync(output, lines.join('\n'), 'utf8');
console.log(`MySQL 가져오기 파일 생성: ${output}`);
