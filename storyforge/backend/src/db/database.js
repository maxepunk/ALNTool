// This file will export a function to get the database instance and an initialization function.
// The initialization function will:
// - Create a new SQLite database file (e.g., production.db in a data/ directory at the backend root, or use the DATABASE_PATH environment variable).
// - Create the tables: journey_segments, gaps, characters, elements, puzzles, and timeline_events as defined in the PRD (Section 5: Target Architecture - Local Database Schema).
// - Ensure foreign key support is enabled (PRAGMA foreign_keys = ON;).
// - Run database migrations.

const Database = require('better-sqlite3');
const { runMigrations } = require('./migrations');
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

  console.log('Initializing database and running migrations...');
  try {
    runMigrations(currentDb); // Pass the db instance
    console.log('Database initialization and migrations complete.');
  } catch (error) {
    console.error('Failed to initialize database or run migrations:', error);
    // It's important to decide if this error is fatal.
    // For a core system like DB init, it often should be.
    throw error;
  }
}

// getDB remains the same, it's called by initializeDatabase.
// The actual database connection is established in getDB.
// initializeDatabase then uses this connection to run migrations.

module.exports = {
  getDB,
  initializeDatabase,
};
