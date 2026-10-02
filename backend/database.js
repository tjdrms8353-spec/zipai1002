'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const projectRoot = path.resolve(__dirname, '..');
const databasePath = process.env.ZIPAI_DB_PATH
  ? path.resolve(process.env.ZIPAI_DB_PATH)
  : path.join(projectRoot, 'data', 'zipai.sqlite');

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

const database = new DatabaseSync(databasePath);
database.exec('PRAGMA foreign_keys = ON');
database.exec('PRAGMA journal_mode = WAL');
database.exec('PRAGMA busy_timeout = 5000');

database.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL COLLATE NOCASE UNIQUE,
    email TEXT NOT NULL COLLATE NOCASE UNIQUE,
    phone TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('member', 'agent', 'admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    last_seen_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);
  CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions(expires_at);

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'closed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    property_id TEXT NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_id, property_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS properties_owner_id_idx ON properties(owner_id);
  CREATE INDEX IF NOT EXISTS properties_status_idx ON properties(status);

  CREATE TABLE IF NOT EXISTS visit_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    room_id TEXT NOT NULL,
    room_title TEXT NOT NULL,
    visit_date TEXT NOT NULL,
    visit_time TEXT NOT NULL,
    phone TEXT NOT NULL,
    question TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE UNIQUE INDEX IF NOT EXISTS visit_approved_slot_idx
  ON visit_requests(room_id, visit_date, visit_time)
  WHERE status = 'approved';

  CREATE INDEX IF NOT EXISTS visit_requester_idx ON visit_requests(requester_id);

  CREATE TABLE IF NOT EXISTS room_offers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    owner_id INTEGER NOT NULL,
    payload_json TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'connected', 'closed')),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS community_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    author_id INTEGER NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('review', 'tip', 'question', 'free')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    area TEXT NOT NULL DEFAULT '',
    rating INTEGER NOT NULL DEFAULT 0 CHECK (rating BETWEEN 0 AND 5),
    views INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS community_post_likes (
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    PRIMARY KEY (post_id, user_id),
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS community_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    author_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS community_posts_created_idx ON community_posts(created_at DESC);
  CREATE INDEX IF NOT EXISTS community_comments_post_idx ON community_comments(post_id, created_at);

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    contact_email TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'in_progress', 'answered')),
    answer TEXT NOT NULL DEFAULT '',
    answered_by INTEGER,
    answered_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (answered_by) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS inquiries_user_idx ON inquiries(user_id, created_at DESC);
  CREATE INDEX IF NOT EXISTS inquiries_status_idx ON inquiries(status, created_at DESC);

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    related_type TEXT NOT NULL DEFAULT '',
    related_id TEXT NOT NULL DEFAULT '',
    read_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications(user_id, created_at DESC);
`);

function cleanupExpiredSessions() {
  database.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date().toISOString());
}

cleanupExpiredSessions();

module.exports = {
  database,
  databasePath,
  cleanupExpiredSessions
};
