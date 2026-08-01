const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', '..', 'data', 'conquest-assistant.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    panel_channel_id TEXT,
    category_id TEXT,
    transcript_channel_id TEXT,
    support_role_id TEXT,
    admin_role_id TEXT,
    panel_message_id TEXT,
    last_ticket_number INTEGER DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS ticket_categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guild_id TEXT NOT NULL,
    ticket_number INTEGER NOT NULL,
    channel_id TEXT NOT NULL,
    creator_id TEXT NOT NULL,
    category_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    closed_at TEXT,
    UNIQUE(guild_id, ticket_number)
  );

  CREATE TABLE IF NOT EXISTS ticket_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id INTEGER NOT NULL,
    user_id TEXT NOT NULL,
    UNIQUE(ticket_id, user_id)
  );
`);

const guildColumns = db.prepare('PRAGMA table_info(guild_settings)').all();
if (!guildColumns.some((column) => column.name === 'last_ticket_number')) {
  db.exec('ALTER TABLE guild_settings ADD COLUMN last_ticket_number INTEGER DEFAULT 0');
}

db.exec(`
  CREATE UNIQUE INDEX IF NOT EXISTS idx_ticket_categories_guild_name
  ON ticket_categories (guild_id, name);
`);

module.exports = db;
