import sqlite3 from 'sqlite3';
import { promisify } from 'util';

const db = new sqlite3.Database('./database.sqlite');

// Promisify database methods
const dbRun = (sql: string, params: any[] = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ lastID: this.lastID, changes: this.changes });
  });
});

const dbGet = (sql: string, params: any[] = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

const dbAll = (sql: string, params: any[] = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

export const initDatabase = async () => {
  // Create hosts table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS hosts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create events table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      host_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      host_name TEXT NOT NULL,
      date_time TEXT NOT NULL,
      location TEXT NOT NULL,
      dress_code TEXT,
      event_type TEXT NOT NULL,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (host_id) REFERENCES hosts (id)
    )
  `);

  // Create guests table
  await dbRun(`
    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      response TEXT CHECK(response IN ('yes', 'no', 'pending')) DEFAULT 'pending',
      plus_ones TEXT DEFAULT '[]',
      responded_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (event_id) REFERENCES events (id)
    )
  `);

  // Add image_url column to existing events table if it doesn't exist
  try {
    await dbRun(`ALTER TABLE events ADD COLUMN image_url TEXT`);
  } catch (error) {
    // Column already exists, ignore error
  }

  console.log('Database initialized successfully');
};

export { dbRun, dbGet, dbAll };
export default db;
