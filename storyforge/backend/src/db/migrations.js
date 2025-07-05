// backend/src/db/migrations.js
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');
// const Database = require('better-sqlite3'); // Or get db instance passed in

// const db = new Database(process.env.DATABASE_PATH || './data/production.db'); // Manage DB instance carefully

const MIGRATION_DIR = path.join(__dirname, 'migration-scripts');

function ensureSchemaMigrationsTable(db) {
  db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT NOT NULL UNIQUE,
            name TEXT NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

function getAppliedMigrations(db) {
  const stmt = db.prepare('SELECT version FROM schema_migrations ORDER BY version');
  return stmt.all().map(row => row.version);
}

function readMigrationScripts() {
  if (!fs.existsSync(MIGRATION_DIR)) {
    fs.mkdirSync(MIGRATION_DIR, { recursive: true });
  }
  const files = fs.readdirSync(MIGRATION_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort();

  return files.map(file => {
    const [version, ...nameParts] = file.replace('.sql', '').split('_');
    return {
      version,
      name: nameParts.join('_'),
      filePath: path.join(MIGRATION_DIR, file)
    };
  });
}

function runMigrations(db, options = {}) { // Expect db instance to be passed
  const { useTransaction = true } = options;

  ensureSchemaMigrationsTable(db);
  const appliedVersions = getAppliedMigrations(db);
  const allScripts = readMigrationScripts();

  const pendingMigrations = allScripts.filter(script => !appliedVersions.includes(script.version));

  if (pendingMigrations.length === 0) {
    logger.debug('Database is up to date. No migrations to apply.');
    return { applied: 0, skipped: appliedVersions.length };
  }

  logger.debug(`Found ${pendingMigrations.length} pending migrations.`);

  // Start transaction if requested
  if (useTransaction) {
    db.prepare('BEGIN').run();
  }

  try {
    for (const migration of pendingMigrations) {
      logger.debug(`Applying migration ${migration.version}_${migration.name}...`);
      const sql = fs.readFileSync(migration.filePath, 'utf8');

      // Handle migrations that might fail if column already exists
      try {
        db.exec(sql); // Use exec for potentially multi-statement SQL files
      } catch (error) {
        // Check if it's a column already exists error
        if (error.message.includes('duplicate column name') ||
                    error.message.includes('already exists')) {
          logger.debug(`Warning: ${error.message} - continuing...`);
        } else {
          throw error;
        }
      }

      const stmt = db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)');
      stmt.run(migration.version, migration.name);
      logger.debug(`Applied migration ${migration.version}_${migration.name}.`);
    }

    // Commit transaction if we started one
    if (useTransaction) {
      db.prepare('COMMIT').run();
    }

    logger.debug('All pending migrations applied successfully.');
    return { applied: pendingMigrations.length, skipped: appliedVersions.length };
  } catch (error) {
    // Rollback transaction if we started one
    if (useTransaction) {
      db.prepare('ROLLBACK').run();
    }
    throw error;
  }
}

module.exports = { runMigrations };
