// This file will export a function that checks the database schema version and applies necessary migrations.
// For Phase 1, this can be a simple setup: if tables don't exist, call the initialization function from database.js.

const { getDB, initializeDatabase } = require('./database');

function runMigrations() {
  const db = getDB();

  // Check if tables exist (using characters table as an example)
  const tableCheck = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='characters';").get();

  if (!tableCheck) {
    console.log('Tables not found, running initial database setup...');
    initializeDatabase();
  } else {
    console.log('Database schema is up to date.');
    // Later, add more sophisticated migration logic here
    // For example, checking a schema_version table and applying incremental migration scripts
  }
}

module.exports = {
  runMigrations,
};
