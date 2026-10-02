'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const root = path.resolve(__dirname, '..');
const source = process.env.ZIPAI_DB_PATH
  ? path.resolve(process.env.ZIPAI_DB_PATH)
  : path.join(root, 'data', 'zipai.sqlite');
const backupDirectory = process.env.ZIPAI_BACKUP_DIR
  ? path.resolve(process.env.ZIPAI_BACKUP_DIR)
  : path.join(root, 'data', 'backups');

if (!fs.existsSync(source)) {
  console.error(`데이터베이스를 찾을 수 없습니다: ${source}`);
  process.exit(1);
}

fs.mkdirSync(backupDirectory, { recursive: true });
const database = new DatabaseSync(source);
database.exec('PRAGMA wal_checkpoint(FULL)');
database.close();

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const destination = path.join(backupDirectory, `zipai-${timestamp}.sqlite`);
fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL);
console.log(destination);
