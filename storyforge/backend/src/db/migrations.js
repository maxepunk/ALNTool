// backend/src/db/migrations.js
const fs = require('fs');
const path = require('path');
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

function runMigrations(db) { // Expect db instance to be passed
    ensureSchemaMigrationsTable(db);
    const appliedVersions = getAppliedMigrations(db);
    const allScripts = readMigrationScripts();

    const pendingMigrations = allScripts.filter(script => !appliedVersions.includes(script.version));

    if (pendingMigrations.length === 0) {
        console.log('Database is up to date. No migrations to apply.');
        return;
    }

    console.log(`Found ${pendingMigrations.length} pending migrations.`);

    for (const migration of pendingMigrations) {
        console.log(`Applying migration ${migration.version}_${migration.name}...`);
        const sql = fs.readFileSync(migration.filePath, 'utf8');
        db.exec(sql); // Use exec for potentially multi-statement SQL files
        const stmt = db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)');
        stmt.run(migration.version, migration.name);
        console.log(`Applied migration ${migration.version}_${migration.name}.`);
    }
    console.log('All pending migrations applied successfully.');
}

module.exports = { runMigrations };
