const path = require('path');
const fs = require('fs');
const { initializeDB, getDB } = require('../../src/db/database');

describe('Database Module', () => {
    const testDbPath = path.join(__dirname, '../../test-database.db');
    let originalEnv;

    beforeEach(() => {
        // Save original environment
        originalEnv = process.env.DATABASE_PATH;
        
        // Clean up any existing test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        // Set test database path
        process.env.DATABASE_PATH = testDbPath;
    });

    afterEach(() => {
        // Close any open connections
        const db = getDB();
        if (db) {
            db.close();
        }
        
        // Clean up test database
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        // Restore original environment
        process.env.DATABASE_PATH = originalEnv;
    });

    describe('initializeDB', () => {
        it('should create database file if it does not exist', () => {
            expect(fs.existsSync(testDbPath)).toBe(false);
            
            initializeDB();
            
            expect(fs.existsSync(testDbPath)).toBe(true);
        });

        it('should create all required tables', () => {
            initializeDB();
            const db = getDB();
            
            // Check that all tables exist
            const tables = db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
                ORDER BY name
            `).all();
            
            const tableNames = tables.map(t => t.name);
            
            // Core entity tables
            expect(tableNames).toContain('characters');
            expect(tableNames).toContain('elements');
            expect(tableNames).toContain('puzzles');
            expect(tableNames).toContain('timeline_events');
            
            // Relationship tables
            expect(tableNames).toContain('character_timeline_events');
            expect(tableNames).toContain('character_puzzles');
            expect(tableNames).toContain('character_owned_elements');
            expect(tableNames).toContain('character_associated_elements');
            expect(tableNames).toContain('character_links');
            expect(tableNames).toContain('element_relationships');
            expect(tableNames).toContain('puzzle_relationships');
            
            // System tables
            expect(tableNames).toContain('migrations');
            expect(tableNames).toContain('sync_log');
            expect(tableNames).toContain('cached_journey_graphs');
        });

        it('should enable foreign keys', () => {
            initializeDB();
            const db = getDB();
            
            const result = db.prepare('PRAGMA foreign_keys').get();
            expect(result.foreign_keys).toBe(1);
        });

        it('should set WAL mode', () => {
            initializeDB();
            const db = getDB();
            
            const result = db.prepare('PRAGMA journal_mode').get();
            expect(result.journal_mode).toBe('wal');
        });

        it('should handle existing database', () => {
            // Initialize once
            initializeDB();
            const db1 = getDB();
            
            // Insert test data
            db1.prepare(`
                INSERT INTO characters (id, name) VALUES ('test', 'Test Character')
            `).run();
            
            // Close and reinitialize
            db1.close();
            initializeDB();
            const db2 = getDB();
            
            // Data should still exist
            const character = db2.prepare('SELECT * FROM characters WHERE id = ?').get('test');
            expect(character).toBeDefined();
            expect(character.name).toBe('Test Character');
        });

        it('should create indexes', () => {
            initializeDB();
            const db = getDB();
            
            // Check for some key indexes
            const indexes = db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='index' AND name NOT LIKE 'sqlite_%'
            `).all();
            
            const indexNames = indexes.map(i => i.name);
            
            // Check for some expected indexes (based on migration files)
            expect(indexNames.length).toBeGreaterThan(0);
        });
    });

    describe('getDB', () => {
        it('should return database instance', () => {
            initializeDB();
            const db = getDB();
            
            expect(db).toBeDefined();
            expect(db.prepare).toBeDefined();
            expect(db.exec).toBeDefined();
        });

        it('should return the same instance on multiple calls', () => {
            initializeDB();
            const db1 = getDB();
            const db2 = getDB();
            
            expect(db1).toBe(db2);
        });

        it('should handle database not initialized', () => {
            // Don't initialize, just try to get
            const db = getDB();
            
            // Should auto-initialize
            expect(db).toBeDefined();
            expect(fs.existsSync(testDbPath)).toBe(true);
        });
    });

    describe('Database constraints', () => {
        beforeEach(() => {
            initializeDB();
        });

        it('should enforce foreign key constraints', () => {
            const db = getDB();
            
            // Try to insert an element with non-existent owner
            expect(() => {
                db.prepare(`
                    INSERT INTO elements (id, name, owner_id) 
                    VALUES ('elem1', 'Test Element', 'non-existent-character')
                `).run();
            }).toThrow(/FOREIGN KEY constraint failed/);
        });

        it('should allow NULL foreign keys', () => {
            const db = getDB();
            
            // Should be able to insert element with no owner
            expect(() => {
                db.prepare(`
                    INSERT INTO elements (id, name, owner_id) 
                    VALUES ('elem1', 'Test Element', NULL)
                `).run();
            }).not.toThrow();
        });

        it('should enforce unique constraints', () => {
            const db = getDB();
            
            // Insert a character
            db.prepare(`
                INSERT INTO characters (id, name) VALUES ('char1', 'Character 1')
            `).run();
            
            // Try to insert another with same ID
            expect(() => {
                db.prepare(`
                    INSERT INTO characters (id, name) VALUES ('char1', 'Character 2')
                `).run();
            }).toThrow(/UNIQUE constraint failed/);
        });
    });

    describe('Transaction support', () => {
        beforeEach(() => {
            initializeDB();
        });

        it('should support transactions', () => {
            const db = getDB();
            
            // Start transaction
            const insertChar = db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)');
            const insertMany = db.transaction((characters) => {
                for (const char of characters) {
                    insertChar.run(char.id, char.name);
                }
            });
            
            // Execute transaction
            insertMany([
                { id: 'char1', name: 'Character 1' },
                { id: 'char2', name: 'Character 2' }
            ]);
            
            // Verify both were inserted
            const count = db.prepare('SELECT COUNT(*) as count FROM characters').get();
            expect(count.count).toBe(2);
        });

        it('should rollback transaction on error', () => {
            const db = getDB();
            
            // Insert one character first
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char1', 'Character 1');
            
            // Create transaction that will fail
            const insertChar = db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)');
            const insertMany = db.transaction((characters) => {
                for (const char of characters) {
                    insertChar.run(char.id, char.name);
                }
            });
            
            // Try to insert with duplicate ID
            expect(() => {
                insertMany([
                    { id: 'char2', name: 'Character 2' },
                    { id: 'char1', name: 'Duplicate' } // This will fail
                ]);
            }).toThrow();
            
            // Verify char2 was NOT inserted (transaction rolled back)
            const char2 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char2');
            expect(char2).toBeUndefined();
            
            // Original char1 should still exist
            const char1 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
            expect(char1).toBeDefined();
        });
    });

    describe('Performance settings', () => {
        beforeEach(() => {
            initializeDB();
        });

        it('should have appropriate cache size', () => {
            const db = getDB();
            const result = db.prepare('PRAGMA cache_size').get();
            
            // Default is usually -2000 (2MB)
            expect(Math.abs(result.cache_size)).toBeGreaterThan(0);
        });

        it('should have synchronous mode set appropriately', () => {
            const db = getDB();
            const result = db.prepare('PRAGMA synchronous').get();
            
            // Should be NORMAL (1) or FULL (2) for data safety
            expect(result.synchronous).toBeGreaterThanOrEqual(1);
        });
    });

    describe('Error handling', () => {
        it('should handle invalid database path gracefully', () => {
            process.env.DATABASE_PATH = '/invalid/path/that/does/not/exist/database.db';
            
            expect(() => initializeDB()).toThrow();
        });

        it('should handle corrupted database file', () => {
            // Create a corrupted file
            fs.writeFileSync(testDbPath, 'This is not a valid SQLite database');
            
            expect(() => initializeDB()).toThrow();
        });
    });
});