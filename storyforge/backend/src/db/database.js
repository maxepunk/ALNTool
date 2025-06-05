// This file will export a function to get the database instance and an initialization function.
// The initialization function will:
// - Create a new SQLite database file (e.g., production.db in a data/ directory at the backend root, or use the DATABASE_PATH environment variable).
// - Create the tables: journey_segments, gaps, characters, elements, puzzles, and timeline_events as defined in the PRD (Section 5: Target Architecture - Local Database Schema).
// - Ensure foreign key support is enabled (PRAGMA foreign_keys = ON;).

const Database = require('better-sqlite3');
const path = require('path');

// Determine the database path
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'production.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
const fs = require('fs');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

let db;

function getDB() {
  if (!db) {
    db = new Database(dbPath, { verbose: console.log });
    // Enable foreign key support
    db.exec('PRAGMA foreign_keys = ON;');
  }
  return db;
}

function initializeDatabase() {
  const currentDb = getDB();

  // Create tables
  currentDb.exec(`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      tier TEXT,
      logline TEXT
    );

    CREATE TABLE IF NOT EXISTS journey_segments (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      start_minute INTEGER NOT NULL,
      end_minute INTEGER NOT NULL,
      activities TEXT,
      interactions TEXT,
      discoveries TEXT,
      gap_status TEXT,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    CREATE TABLE IF NOT EXISTS gaps (
      id TEXT PRIMARY KEY,
      character_id TEXT NOT NULL,
      start_minute INTEGER NOT NULL,
      end_minute INTEGER NOT NULL,
      severity TEXT,
      suggested_solutions TEXT,
      FOREIGN KEY (character_id) REFERENCES characters(id)
    );

    CREATE TABLE IF NOT EXISTS elements (
      id TEXT PRIMARY KEY,
      name TEXT,
      type TEXT,
      description TEXT
    );

    CREATE TABLE IF NOT IF EXISTS puzzles (
      id TEXT PRIMARY KEY,
      name TEXT,
      timing TEXT
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      description TEXT,
      date TEXT
    );

    CREATE TABLE IF NOT EXISTS interactions (
      id TEXT PRIMARY KEY,
      character_a_id TEXT,
      character_b_id TEXT,
      minute INTEGER,
      type TEXT,
      element_id TEXT,
      FOREIGN KEY (character_a_id) REFERENCES characters(id),
      FOREIGN KEY (character_b_id) REFERENCES characters(id),
      FOREIGN KEY (element_id) REFERENCES elements(id)
    );

    CREATE TABLE IF NOT EXISTS path_metrics (
      timestamp INTEGER PRIMARY KEY,
      black_market_value INTEGER,
      detective_progress INTEGER,
      third_path_engagement INTEGER
    );
  `);

  console.log('Database initialized successfully.');
}

module.exports = {
  getDB,
  initializeDatabase,
};
