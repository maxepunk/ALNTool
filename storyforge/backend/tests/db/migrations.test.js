const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { runMigrations } = require('../../src/db/migrations');

describe('Migration System', () => {
    let db;
    const TEST_DB_PATH = ':memory:'; // Use in-memory database for tests
    const MIGRATION_DIR = path.join(__dirname, '../../src/db/migration-scripts');

    beforeEach(() => {
        // Create fresh database for each test
        db = new Database(TEST_DB_PATH);
    });

    afterEach(() => {
        db.close();
    });

    describe('Transaction Support', () => {
        it('should rollback all migrations if one fails', async () => {
            // Create a failing migration
            const failingMigration = '20250610000000_failing_migration.sql';
            const failingMigrationPath = path.join(MIGRATION_DIR, failingMigration);
            
            // Write a migration that will fail (invalid SQL)
            fs.writeFileSync(failingMigrationPath, 'INVALID SQL;');

            try {
                // Attempt to run migrations
                await expect(runMigrations(db)).rejects.toThrow();
                
                // Verify no migrations were applied
                const applied = db.prepare('SELECT * FROM schema_migrations').all();
                expect(applied).toHaveLength(0);
                
                // Verify no tables were created
                const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
                expect(tables).toHaveLength(0); // Only schema_migrations should exist
            } finally {
                // Clean up test migration
                fs.unlinkSync(failingMigrationPath);
            }
        });

        it('should commit all migrations if all succeed', async () => {
            // Create a valid migration
            const validMigration = '20250610000001_valid_migration.sql';
            const validMigrationPath = path.join(MIGRATION_DIR, validMigration);
            
            // Write a migration that creates a test table
            fs.writeFileSync(validMigrationPath, `
                CREATE TABLE test_table (
                    id INTEGER PRIMARY KEY,
                    name TEXT
                );
            `);

            try {
                // Run migrations
                await runMigrations(db);
                
                // Verify migration was applied
                const applied = db.prepare('SELECT * FROM schema_migrations').all();
                expect(applied).toHaveLength(1);
                expect(applied[0].version).toBe('20250610000001');
                
                // Verify table was created
                const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
                expect(tables).toHaveLength(2); // schema_migrations + test_table
                expect(tables.some(t => t.name === 'test_table')).toBe(true);
            } finally {
                // Clean up test migration
                fs.unlinkSync(validMigrationPath);
            }
        });
    });

    describe('Migration Verification', () => {
        it('should verify table creation', async () => {
            const migration = '20250610000002_create_table.sql';
            const migrationPath = path.join(MIGRATION_DIR, migration);
            
            fs.writeFileSync(migrationPath, `
                CREATE TABLE verification_test (
                    id INTEGER PRIMARY KEY,
                    name TEXT
                );
            `);

            try {
                await runMigrations(db);
                
                // Verify table exists
                const table = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='verification_test'").get();
                expect(table).toBeTruthy();
            } finally {
                fs.unlinkSync(migrationPath);
            }
        });

        it('should verify column addition', async () => {
            // First create a table
            const createTable = '20250610000003_create_table_for_alter.sql';
            const createTablePath = path.join(MIGRATION_DIR, createTable);
            fs.writeFileSync(createTablePath, `
                CREATE TABLE alter_test (
                    id INTEGER PRIMARY KEY
                );
            `);

            // Then add a column
            const addColumn = '20250610000004_add_column.sql';
            const addColumnPath = path.join(MIGRATION_DIR, addColumn);
            fs.writeFileSync(addColumnPath, `
                ALTER TABLE alter_test ADD COLUMN name TEXT;
            `);

            try {
                await runMigrations(db);
                
                // Verify column was added
                const columns = db.prepare("PRAGMA table_info(alter_test)").all();
                expect(columns.some(col => col.name === 'name')).toBe(true);
            } finally {
                fs.unlinkSync(createTablePath);
                fs.unlinkSync(addColumnPath);
            }
        });

        it('should fail if verification fails', async () => {
            const migration = '20250610000005_failed_verification.sql';
            const migrationPath = path.join(MIGRATION_DIR, migration);
            
            // Write a migration that claims to create a table but doesn't
            fs.writeFileSync(migrationPath, `
                -- This migration claims to create a table but doesn't
                -- The verification should catch this
                SELECT 1;
            `);

            try {
                await expect(runMigrations(db)).rejects.toThrow('Table verification_test was not created');
                
                // Verify no migrations were applied
                const applied = db.prepare('SELECT * FROM schema_migrations').all();
                expect(applied).toHaveLength(0);
            } finally {
                fs.unlinkSync(migrationPath);
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid SQL gracefully', async () => {
            const migration = '20250610000006_invalid_sql.sql';
            const migrationPath = path.join(MIGRATION_DIR, migration);
            
            fs.writeFileSync(migrationPath, 'INVALID SQL SYNTAX;');

            try {
                await expect(runMigrations(db)).rejects.toThrow();
                
                // Verify no migrations were applied
                const applied = db.prepare('SELECT * FROM schema_migrations').all();
                expect(applied).toHaveLength(0);
            } finally {
                fs.unlinkSync(migrationPath);
            }
        });

        it('should handle missing migration files', async () => {
            // Create a migration record but delete the file
            const migration = '20250610000007_missing_file.sql';
            const migrationPath = path.join(MIGRATION_DIR, migration);
            
            fs.writeFileSync(migrationPath, 'CREATE TABLE test (id INTEGER);');
            db.prepare('INSERT INTO schema_migrations (version, name) VALUES (?, ?)')
                .run('20250610000007', 'missing_file');

            try {
                fs.unlinkSync(migrationPath);
                await expect(runMigrations(db)).rejects.toThrow('ENOENT');
            } catch (error) {
                // Clean up if test fails
                if (fs.existsSync(migrationPath)) {
                    fs.unlinkSync(migrationPath);
                }
                throw error;
            }
        });
    });
}); 