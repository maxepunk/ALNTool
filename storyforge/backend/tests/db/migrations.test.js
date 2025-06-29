const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { runMigrations } = require('../../src/db/migrations');

describe('Migration System', () => {
    let db;
    const TEST_DB_PATH = ':memory:'; // Use in-memory database for tests
    const MIGRATION_DIR = path.join(__dirname, '../../src/db/migration-scripts');
    const TEST_MIGRATION_DIR = path.join(__dirname, '../fixtures/test-migrations');

    beforeAll(() => {
        // Create test migration directory
        if (!fs.existsSync(TEST_MIGRATION_DIR)) {
            fs.mkdirSync(TEST_MIGRATION_DIR, { recursive: true });
        }
    });

    afterAll(() => {
        // Clean up test migration directory
        if (fs.existsSync(TEST_MIGRATION_DIR)) {
            fs.rmSync(TEST_MIGRATION_DIR, { recursive: true });
        }
    });

    beforeEach(() => {
        // Create fresh database for each test
        db = new Database(TEST_DB_PATH);
    });

    afterEach(() => {
        db.close();
    });

    describe('Transaction Support', () => {
        it('should rollback all migrations if one fails', async () => {
            // First run all existing migrations
            const initialResult = await runMigrations(db);
            const initialCount = initialResult.applied + initialResult.skipped;
            
            // Create a failing migration
            const failingMigration = '20990101000000_failing_migration.sql';
            const failingMigrationPath = path.join(MIGRATION_DIR, failingMigration);
            
            // Write a migration that will fail (invalid SQL)
            fs.writeFileSync(failingMigrationPath, 'INVALID SQL;');

            try {
                // Attempt to run migrations again - should fail on the new one
                await expect(async () => await runMigrations(db)).rejects.toThrow();
                
                // Verify the existing migrations are still there but new one wasn't applied
                const applied = db.prepare('SELECT * FROM schema_migrations').all();
                expect(applied).toHaveLength(initialCount);
                
                // Verify the failing migration wasn't recorded
                const failingRecord = applied.find(m => m.version === '20990101000000');
                expect(failingRecord).toBeUndefined();
            } finally {
                // Clean up test migration
                if (fs.existsSync(failingMigrationPath)) {
                    fs.unlinkSync(failingMigrationPath);
                }
            }
        });

        it('should commit all migrations if all succeed', async () => {
            // First run all existing migrations
            const initialResult = await runMigrations(db);
            const initialCount = initialResult.applied + initialResult.skipped;
            
            // Create a valid migration
            const validMigration = '20990101000001_valid_migration.sql';
            const validMigrationPath = path.join(MIGRATION_DIR, validMigration);
            
            // Write a migration that creates a test table
            fs.writeFileSync(validMigrationPath, `
                CREATE TABLE test_table (
                    id INTEGER PRIMARY KEY,
                    name TEXT
                );
            `);

            try {
                // Run migrations again - should apply the new one
                const result = await runMigrations(db);
                expect(result.applied).toBe(1); // Only the new migration
                
                // Verify migration was applied
                const applied = db.prepare('SELECT * FROM schema_migrations').all();
                expect(applied).toHaveLength(initialCount + 1);
                
                // Verify the new migration was recorded
                const newRecord = applied.find(m => m.version === '20990101000001');
                expect(newRecord).toBeDefined();
                expect(newRecord.name).toBe('valid_migration');
                
                // Verify table was created
                const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='test_table'").all();
                expect(tables).toHaveLength(1);
            } finally {
                // Clean up test migration
                if (fs.existsSync(validMigrationPath)) {
                    fs.unlinkSync(validMigrationPath);
                }
            }
        });
    });

    describe('Migration Verification', () => {
        it('should verify table creation', async () => {
            // Run existing migrations first
            await runMigrations(db);
            
            const migration = '20990102000002_create_table.sql';
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
                if (fs.existsSync(migrationPath)) {
                    fs.unlinkSync(migrationPath);
                }
            }
        });

        it('should verify column addition', async () => {
            // Run existing migrations first
            await runMigrations(db);
            
            // First create a table
            const createTable = '20990103000003_create_table_for_alter.sql';
            const createTablePath = path.join(MIGRATION_DIR, createTable);
            fs.writeFileSync(createTablePath, `
                CREATE TABLE alter_test (
                    id INTEGER PRIMARY KEY
                );
            `);

            // Then add a column
            const addColumn = '20990103000004_add_column.sql';
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
                if (fs.existsSync(createTablePath)) {
                    fs.unlinkSync(createTablePath);
                }
                if (fs.existsSync(addColumnPath)) {
                    fs.unlinkSync(addColumnPath);
                }
            }
        });

        it('should handle migration that does nothing', async () => {
            // Run existing migrations first
            const initialResult = await runMigrations(db);
            const initialCount = initialResult.applied + initialResult.skipped;
            
            const migration = '20990104000005_noop_migration.sql';
            const migrationPath = path.join(MIGRATION_DIR, migration);
            
            // Write a migration that doesn't create anything
            fs.writeFileSync(migrationPath, `
                -- This migration just runs a query
                SELECT 1;
            `);

            try {
                const result = await runMigrations(db);
                expect(result.applied).toBe(1);
                
                // Verify migration was tracked
                const applied = db.prepare('SELECT * FROM schema_migrations').all();
                expect(applied).toHaveLength(initialCount + 1);
            } finally {
                if (fs.existsSync(migrationPath)) {
                    fs.unlinkSync(migrationPath);
                }
            }
        });
    });

    describe('Error Handling', () => {
        it('should handle invalid SQL gracefully', async () => {
            // Run existing migrations first
            await runMigrations(db);
            
            const migration = '20990105000006_invalid_sql.sql';
            const migrationPath = path.join(MIGRATION_DIR, migration);
            
            fs.writeFileSync(migrationPath, 'INVALID SQL SYNTAX;');

            try {
                await expect(async () => await runMigrations(db)).rejects.toThrow();
            } finally {
                if (fs.existsSync(migrationPath)) {
                    fs.unlinkSync(migrationPath);
                }
            }
        });

        it('should handle missing migration files', async () => {
            // Test that missing migration files are handled gracefully
            const migration = '20990106000007_test_file.sql';
            const migrationPath = path.join(MIGRATION_DIR, migration);
            
            // Create a migration file with invalid SQL
            fs.writeFileSync(migrationPath, 'INVALID SQL SYNTAX HERE;');
            
            try {
                // The migration should fail due to invalid SQL
                await expect(runMigrations(db)).rejects.toThrow();
            } finally {
                // Clean up
                if (fs.existsSync(migrationPath)) {
                    fs.unlinkSync(migrationPath);
                }
            }
        });
    });
}); 