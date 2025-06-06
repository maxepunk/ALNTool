const fs = require('fs');
// This file will export a function to get the database instance and an initialization function.
// The initialization function will:
// - Create a new SQLite database file (e.g., production.db in a data/ directory at the backend root, or use the DATABASE_PATH environment variable).
// - Create the tables: journey_segments, gaps, characters, elements, puzzles, and timeline_events as defined in the PRD (Section 5: Target Architecture - Local Database Schema).
// - Ensure foreign key support is enabled (PRAGMA foreign_keys = ON;).
// - Run database migrations.

const Database = require('better-sqlite3');
const { runMigrations } = require('./migrations');
const path = require('path');

let db; // Singleton instance

// Function to determine the database path, defaults to production path
function getProductionDbPath() {
  return process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'data', 'production.db');
}

// Ensure the data directory exists for the production database
function ensureDataDirectoryExists(filePath) {
  const dataDir = path.dirname(filePath);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function connect(dbPathOverride) {
  let pathToUse = dbPathOverride;
  if (!pathToUse) {
    pathToUse = getProductionDbPath();
    ensureDataDirectoryExists(pathToUse); // Only ensure for file-based DBs
    console.log(`Connecting to database at: ${pathToUse}`);
  } else if (pathToUse !== ':memory:') {
    ensureDataDirectoryExists(pathToUse); // Ensure dir if custom file path
    console.log(`Connecting to database at: ${pathToUse}`);
  } else {
    console.log('Connecting to in-memory database.');
  }

  db = new Database(pathToUse, { verbose: process.env.NODE_ENV !== 'test' ? console.log : undefined });
  db.exec('PRAGMA foreign_keys = ON;');

  return db;
}

function getDB() {
  if (!db) {
    // This case should ideally not be hit if initializeDatabase is called first,
    // especially in production. For tests, initializeDatabase will set the in-memory DB.
    // If running app directly and initializeDatabase hasn't been called by startServer yet,
    // this will connect to production DB.
    console.warn("getDB() called before initializeDatabase or outside of test setup. Connecting to default production DB.");
    connect();
  }
  return db;
}

function initializeDatabase(dbPathOverride = null) {
  if (db) {
    console.log('Database already initialized. Closing existing connection before re-initializing.');
    db.close();
    db = null;
  }

  const effectivePath = dbPathOverride || (process.env.NODE_ENV === 'test' ? ':memory:' : getProductionDbPath());

  console.log(`Initializing database with path: ${effectivePath}`);
  connect(effectivePath); // `connect` now sets the global `db` instance

  console.log('Running migrations...');
  try {
    runMigrations(db); // Pass the already connected db instance
    console.log('Database initialization and migrations complete.');
  } catch (error) {
    console.error('Failed to initialize database or run migrations:', error);
    throw error;
  }
  return db; // Return the instance for convenience, though getDB() will also work
}

function closeDB() {
  if (db) {
    db.close();
    db = null; // Reset the singleton instance
    console.log('Database connection closed.');
  } else {
    console.log('No active database connection to close.');
  }
}

module.exports = {
  getDB,
  initializeDatabase, // For explicit initialization, e.g. in tests or at app start
  closeDB, // For tearing down in tests
};
