// subtask_verify_migrations.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3'); // This will be installed by the subtask if not present

// const baseDir = './storyforge/backend'; // Adjusted base directory
// const dbPath = path.join(baseDir, 'data/production.db');
// const migrationsDir = path.join(baseDir, 'src/db/migration-scripts');
// const databaseServicePath = path.join(baseDir, 'src/db/database.js');

// Let's use direct relative paths from the script location (/app)
const dbPath = './storyforge/backend/data/production.db';
const migrationsDir = './storyforge/backend/src/db/migration-scripts';
const databaseServicePath = './storyforge/backend/src/db/database.js';

function deleteDbFile() {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('Deleted existing database file.');
    }
}

async function runTest() {
    try {
        console.log('Starting migration test...');

        // Step 1: Delete existing DB for clean run
        deleteDbFile();
        // Ensure data directory exists
        if (!fs.existsSync(path.dirname(dbPath))) {
            fs.mkdirSync(path.dirname(dbPath), { recursive: true });
        }

        // Step 2: Test Initial Migration
        console.log('--- Testing Initial Migration ---');
        delete require.cache[require.resolve(databaseServicePath)]; // Clear cache for fresh import
        const DatabaseService = require(databaseServicePath);
        // Instantiation should trigger migrations via initializeDatabase()
        // Correction: database.js exports functions, need to call one.
        DatabaseService.initializeDatabase(); // Explicitly call initialization

        if (!fs.existsSync(dbPath)) {
            throw new Error('Database file was not created.');
        }
        console.log('Database file created successfully.');

        let db = new Database(dbPath);
        let rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='schema_migrations'").all();
        if (rows.length !== 1) throw new Error('schema_migrations table not found after initial migration.');
        console.log('schema_migrations table found.');

        rows = db.prepare("SELECT version, name FROM schema_migrations").all();
        if (rows.length !== 1 || !rows[0].version.startsWith('20240726000000') || rows[0].name !== 'initial_schema') {
            throw new Error(`Initial migration record incorrect: ${JSON.stringify(rows)}`);
        }
        console.log('Initial migration recorded correctly in schema_migrations.');

        const expectedTables = ['characters', 'elements', 'puzzles', 'timeline_events', 'journey_segments', 'gaps', 'interactions', 'path_metrics'];
        for (const tableName of expectedTables) {
            rows = db.prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`).all();
            if (rows.length !== 1) throw new Error(`Table ${tableName} not created by initial migration.`);
        }
        console.log('All initial schema tables created successfully.');
        db.close();

        // Step 3: Test Applying a New Migration
        console.log('--- Testing New Migration ---');
        const newMigrationName = '20240726010000_add_dummy_table.sql';
        const newMigrationPath = path.join(migrationsDir, newMigrationName);
        fs.writeFileSync(newMigrationPath, "CREATE TABLE IF NOT EXISTS dummy_table (id INTEGER PRIMARY KEY, description TEXT); INSERT INTO dummy_table (description) VALUES ('This is a test');");
        console.log(`Created new migration: ${newMigrationName}`);

        delete require.cache[require.resolve(databaseServicePath)]; // Clear cache
        const DatabaseService2 = require(databaseServicePath); // Re-instantiate
        DatabaseService2.initializeDatabase(); // Explicitly call initialization

        db = new Database(dbPath);
        rows = db.prepare("SELECT version, name FROM schema_migrations ORDER BY version").all();
        if (rows.length !== 2) throw new Error(`Expected 2 migrations, found ${rows.length}: ${JSON.stringify(rows)}`);
        if (rows[1].version !== '20240726010000' || rows[1].name !== 'add_dummy_table') {
            throw new Error(`Second migration record incorrect: ${JSON.stringify(rows[1])}`);
        }
        console.log('New migration recorded correctly.');

        rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='dummy_table'").all();
        if (rows.length !== 1) throw new Error('dummy_table not created by new migration.');
        console.log('dummy_table created successfully.');

        rows = db.prepare("SELECT description FROM dummy_table").all();
        if (rows.length !== 1 || rows[0].description !== 'This is a test') {
            throw new Error(`Data in dummy_table incorrect: ${JSON.stringify(rows)}`);
        }
        console.log('Data in dummy_table inserted correctly.');
        db.close();
        fs.unlinkSync(newMigrationPath); // Clean up dummy migration file
        console.log('Cleaned up dummy migration file.');

        // Step 4: Test Idempotency
        console.log('--- Testing Idempotency ---');
        delete require.cache[require.resolve(databaseServicePath)]; // Clear cache
        const DatabaseService3 = require(databaseServicePath); // Re-instantiate
        DatabaseService3.initializeDatabase(); // Explicitly call initialization

        db = new Database(dbPath);
        rows = db.prepare("SELECT version, name FROM schema_migrations ORDER BY version").all();
        if (rows.length !== 2) { // Should still be 2
            throw new Error(`Idempotency test failed: Expected 2 migrations, found ${rows.length}: ${JSON.stringify(rows)}`);
        }
        console.log('Idempotency test passed. No new migrations applied.');
        db.close();

        console.log('All migration tests passed successfully!');

    } catch (error) {
        console.error('Migration test failed:', error.message);
        console.error(error.stack); // Print stack for better debugging
        process.exitCode = 1; // Indicate failure to the subtask runner
    } finally {
        // Final cleanup
        deleteDbFile();
        console.log('Cleaned up database file after test.');
    }
}

runTest();
