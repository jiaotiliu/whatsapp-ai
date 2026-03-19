const fs = require("node:fs");
const path = require("node:path");
const sqlite3 = require("sqlite3").verbose();
const config = require("./config");

fs.mkdirSync(path.dirname(config.databasePath), { recursive: true });

const db = new sqlite3.Database(config.databasePath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(error) {
      if (error) {
        reject(error);
        return;
      }

      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (error, row) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(row || null);
    });
  });
}

async function initialize() {
  await run("PRAGMA journal_mode = WAL");
  await run(`CREATE TABLE IF NOT EXISTS processed_messages (
    message_id TEXT PRIMARY KEY,
    whatsapp_from TEXT NOT NULL,
    message_type TEXT NOT NULL,
    processed_at TEXT NOT NULL
  )`);
  await run(`CREATE TABLE IF NOT EXISTS message_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT,
    whatsapp_from TEXT NOT NULL,
    direction TEXT NOT NULL,
    message_type TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`);
}

async function hasProcessedMessage(messageId) {
  const row = await get(
    "SELECT message_id FROM processed_messages WHERE message_id = ? LIMIT 1",
    [messageId]
  );

  return Boolean(row);
}

async function markMessageProcessed({ messageId, from, type }) {
  await run(
    `INSERT OR IGNORE INTO processed_messages (message_id, whatsapp_from, message_type, processed_at)
     VALUES (?, ?, ?, ?)`,
    [messageId, from, type, new Date().toISOString()]
  );
}

async function logMessage({ messageId = null, from, direction, type, content }) {
  await run(
    `INSERT INTO message_log (message_id, whatsapp_from, direction, message_type, content, created_at)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [messageId, from, direction, type, content, new Date().toISOString()]
  );
}

module.exports = {
  db,
  initialize,
  hasProcessedMessage,
  markMessageProcessed,
  logMessage
};
