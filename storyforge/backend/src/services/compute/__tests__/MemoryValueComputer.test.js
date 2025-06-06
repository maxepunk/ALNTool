const MemoryValueComputer = require('../MemoryValueComputer');
const { initializeDatabase, closeDB, getDB } = require('../../../db/database');

// Mock console methods to avoid noise in tests
const originalConsole = {
    log: console.log,
    error: console.error
};

describe('MemoryValueComputer', () => {
    let computer;
    let db;

    beforeAll(() => {
        // Mock console methods
        console.log = jest.fn();
        console.error = jest.fn();
        
        // Initialize in-memory database for testing
        initializeDatabase(':memory:');
        db = getDB();
    });

    afterAll(() => {
        // Restore console methods
        console.log = originalConsole.log;
        console.error = originalConsole.error;
        closeDB();
    });

    beforeEach(() => {
        // Create test tables
        db.exec(`
            CREATE TABLE IF NOT EXISTS characters (
                id TEXT PRIMARY KEY,
                name TEXT,
                total_memory_value INTEGER DEFAULT 0
            )
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS elements (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT,
                rfid_tag TEXT,
                value_rating INTEGER,
                memory_type TEXT,
                memory_group TEXT,
                group_multiplier INTEGER,
                calculated_memory_value INTEGER DEFAULT 0,
                description TEXT
            )
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS character_owned_elements (
                character_id TEXT,
                element_id TEXT,
                PRIMARY KEY (character_id, element_id),
                FOREIGN KEY (character_id) REFERENCES characters(id),
                FOREIGN KEY (element_id) REFERENCES elements(id)
            )
        `);

        computer = new MemoryValueComputer(db);
    });

    afterEach(() => {
        // Clean up tables
        try {
            db.exec('DROP TABLE IF EXISTS character_owned_elements');
            db.exec('DROP TABLE IF EXISTS characters');
            db.exec('DROP TABLE IF EXISTS elements');
        } catch (error) {
            // Ignore cleanup errors
        }
    });

    describe('constructor', () => {
        test('creates instance with valid database connection', () => {
            const testComputer = new MemoryValueComputer(db);
            expect(testComputer.db).toBe(db);
            expect(testComputer.name).toBe('MemoryValueComputer');
        });

        test('inherits from DerivedFieldComputer', () => {
            expect(computer).toBeInstanceOf(require('../DerivedFieldComputer'));
        });
    });

    describe('logging methods', () => {
        test('debug method logs in non-test environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            
            computer.debug('test debug message');
            expect(console.log).toHaveBeenCalledWith('[DEBUG] MemoryValueComputer: test debug message');
            
            process.env.NODE_ENV = originalEnv;
        });

        test('debug method does not log in test environment', () => {
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'test';
            console.log.mockClear();
            
            computer.debug('test debug message');
            expect(console.log).not.toHaveBeenCalled();
            
            process.env.NODE_ENV = originalEnv;
        });

        test('info method logs messages', () => {
            computer.info('test info message');
            expect(console.log).toHaveBeenCalledWith('[INFO] MemoryValueComputer: test info message');
        });

        test('error method logs error messages', () => {
            const testError = new Error('test error');
            computer.error('test error message', testError);
            expect(console.error).toHaveBeenCalledWith('[ERROR] MemoryValueComputer: test error message', testError);
        });
    });

    describe('computeAllCharacterMemoryValues() method', () => {
        beforeEach(() => {
            // Clear existing data
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            // Insert test characters
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char1', 'Character 1');
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char2', 'Character 2');
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char3', 'Character 3');

            // Insert test elements with memory values
            db.prepare(`
                INSERT INTO elements (id, name, type, rfid_tag, value_rating, memory_type, memory_group, group_multiplier, calculated_memory_value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run('elem1', 'Memory Token 1', 'Memory', 'TAG001', 5, 'Personal', 'Group A', 2, 100);
            
            db.prepare(`
                INSERT INTO elements (id, name, type, rfid_tag, value_rating, memory_type, memory_group, group_multiplier, calculated_memory_value)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run('elem2', 'Memory Token 2', 'Memory', 'TAG002', 3, 'Professional', 'Group A', 2, 50);
            
            db.prepare(`
                INSERT INTO elements (id, name, type, calculated_memory_value)
                VALUES (?, ?, ?, ?)
            `).run('elem3', 'Memory Token 3', 'Memory', 75);

            db.prepare(`
                INSERT INTO elements (id, name, type, calculated_memory_value)
                VALUES (?, ?, ?, ?)
            `).run('elem4', 'Regular Item', 'Item', 0);

            // Link characters to elements
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem1');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem2');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char2', 'elem3');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char3', 'elem4');
        });

        test('computes memory values for all characters', async () => {
            const result = await computer.computeAllCharacterMemoryValues();

            expect(result).toBe(3); // 3 characters updated

            // Verify database updates
            const char1 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
            expect(char1.total_memory_value).toBe(150); // 100 + 50

            const char2 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char2');
            expect(char2.total_memory_value).toBe(75);

            const char3 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char3');
            expect(char3.total_memory_value).toBe(0); // Regular item has 0 memory value
        });

        test('handles characters with no owned elements', async () => {
            // Add character with no elements
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char_empty', 'Empty Character');

            const result = await computer.computeAllCharacterMemoryValues();

            expect(result).toBe(4); // 4 characters updated

            const emptyChar = db.prepare('SELECT * FROM characters WHERE id = ?').get('char_empty');
            expect(emptyChar.total_memory_value).toBe(0);
        });

        test('handles empty characters table', async () => {
            // Delete in correct order to avoid foreign key constraints
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');

            const result = await computer.computeAllCharacterMemoryValues();

            expect(result).toBe(0);
        });

        test('logs computation details', async () => {
            await computer.computeAllCharacterMemoryValues();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO] MemoryValueComputer: Memory value computation completed'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO] MemoryValueComputer: Updated 3 characters'));
        });

        test('throws error on database failure', async () => {
            // Force database error by corrupting the query
            const originalPrepare = computer.db.prepare;
            computer.db.prepare = () => {
                throw new Error('Database connection lost');
            };

            await expect(computer.computeAllCharacterMemoryValues()).rejects.toThrow();
            
            // Restore
            computer.db.prepare = originalPrepare;
        });
    });

    describe('computeCharacterMemoryValue() method', () => {
        beforeEach(() => {
            // Clear existing data and set up test data
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char1', 'Test Character');
            db.prepare(`
                INSERT INTO elements (id, name, calculated_memory_value)
                VALUES (?, ?, ?)
            `).run('elem1', 'Memory Token 1', 100);
            db.prepare(`
                INSERT INTO elements (id, name, calculated_memory_value)
                VALUES (?, ?, ?)
            `).run('elem2', 'Memory Token 2', 50);
            
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem1');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem2');
        });

        test('computes memory value for specific character', async () => {
            const result = await computer.computeCharacterMemoryValue('char1');

            expect(result).toBe(150);

            // Verify database update
            const character = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
            expect(character.total_memory_value).toBe(150);
        });

        test('returns 0 for character with no memory elements', async () => {
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char_empty', 'Empty Character');

            const result = await computer.computeCharacterMemoryValue('char_empty');

            expect(result).toBe(0);
        });

        test('throws error for non-existent character', async () => {
            await expect(
                computer.computeCharacterMemoryValue('non_existent')
            ).rejects.toThrow('Character not found: non_existent');
        });

        test('logs computation details', async () => {
            // Temporarily set NODE_ENV to development to enable debug logging
            const originalEnv = process.env.NODE_ENV;
            process.env.NODE_ENV = 'development';
            console.log.mockClear();

            await computer.computeCharacterMemoryValue('char1');

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('computed total memory value = $150'));
            
            // Restore original environment
            process.env.NODE_ENV = originalEnv;
        });
    });

    describe('getMemoryValueDistribution() method', () => {
        beforeEach(() => {
            // Setup test data
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            db.prepare('INSERT INTO characters (id, name, total_memory_value) VALUES (?, ?, ?)').run('char1', 'Rich Character', 200);
            db.prepare('INSERT INTO characters (id, name, total_memory_value) VALUES (?, ?, ?)').run('char2', 'Poor Character', 50);
            db.prepare('INSERT INTO characters (id, name, total_memory_value) VALUES (?, ?, ?)').run('char3', 'Empty Character', 0);

            db.prepare(`
                INSERT INTO elements (id, name, calculated_memory_value)
                VALUES (?, ?, ?)
            `).run('elem1', 'High Value Token', 200);
            db.prepare(`
                INSERT INTO elements (id, name, calculated_memory_value)
                VALUES (?, ?, ?)
            `).run('elem2', 'Low Value Token', 50);
            db.prepare(`
                INSERT INTO elements (id, name, calculated_memory_value)
                VALUES (?, ?, ?)
            `).run('elem3', 'No Value Item', 0);

            // Link characters to elements
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem1');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char2', 'elem2');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char3', 'elem3');
        });

        test('returns characters ordered by memory value descending', () => {
            const distribution = computer.getMemoryValueDistribution();

            expect(distribution).toHaveLength(3);
            expect(distribution[0].name).toBe('Rich Character');
            expect(distribution[0].total_memory_value).toBe(200);
            expect(distribution[0].owned_elements_count).toBe(1);
            expect(distribution[0].memory_elements_count).toBe(1);

            expect(distribution[1].name).toBe('Poor Character');
            expect(distribution[1].total_memory_value).toBe(50);

            expect(distribution[2].name).toBe('Empty Character');
            expect(distribution[2].total_memory_value).toBe(0);
            expect(distribution[2].memory_elements_count).toBe(0);
        });

        test('handles characters with no elements', () => {
            db.prepare('INSERT INTO characters (id, name, total_memory_value) VALUES (?, ?, ?)').run('char_no_elements', 'No Elements', 0);

            const distribution = computer.getMemoryValueDistribution();

            const noElementsChar = distribution.find(c => c.name === 'No Elements');
            expect(noElementsChar.owned_elements_count).toBe(0);
            expect(noElementsChar.memory_elements_count).toBe(0);
        });
    });

    describe('getMemoryValueStats() method', () => {
        beforeEach(() => {
            // Setup test data with known values
            db.exec('DELETE FROM characters');
            
            db.prepare('INSERT INTO characters (id, name, total_memory_value) VALUES (?, ?, ?)').run('char1', 'Character 1', 100);
            db.prepare('INSERT INTO characters (id, name, total_memory_value) VALUES (?, ?, ?)').run('char2', 'Character 2', 200);
            db.prepare('INSERT INTO characters (id, name, total_memory_value) VALUES (?, ?, ?)').run('char3', 'Character 3', 0);
            db.prepare('INSERT INTO characters (id, name, total_memory_value) VALUES (?, ?, ?)').run('char4', 'Character 4', 50);
        });

        test('calculates correct statistics', () => {
            const stats = computer.getMemoryValueStats();

            expect(stats.totalCharacters).toBe(4);
            expect(stats.charactersWithMemory).toBe(3);
            expect(stats.charactersWithoutMemory).toBe(1);
            expect(stats.totalMemoryValue).toBe(350); // 100 + 200 + 0 + 50
            expect(stats.averageMemoryValue).toBe(116.67); // (100 + 200 + 50) / 3, rounded
            expect(stats.maxMemoryValue).toBe(200);
            expect(stats.minMemoryValue).toBe(50);
        });

        test('handles all characters with zero memory value', () => {
            db.exec('UPDATE characters SET total_memory_value = 0');

            const stats = computer.getMemoryValueStats();

            expect(stats.totalCharacters).toBe(4);
            expect(stats.charactersWithMemory).toBe(0);
            expect(stats.charactersWithoutMemory).toBe(4);
            expect(stats.totalMemoryValue).toBe(0);
            expect(stats.averageMemoryValue).toBe(0);
            expect(stats.maxMemoryValue).toBe(0);
            expect(stats.minMemoryValue).toBe(0);
        });

        test('handles empty characters table', () => {
            db.exec('DELETE FROM characters');

            const stats = computer.getMemoryValueStats();

            expect(stats.totalCharacters).toBe(0);
            expect(stats.charactersWithMemory).toBe(0);
            expect(stats.charactersWithoutMemory).toBe(0);
            expect(stats.totalMemoryValue).toBe(0);
        });
    });

    describe('getCharacterMemoryElements() method', () => {
        beforeEach(() => {
            // Setup test data
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char1', 'Test Character');

            db.prepare(`
                INSERT INTO elements (id, name, rfid_tag, value_rating, memory_type, memory_group, 
                                    group_multiplier, calculated_memory_value, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run('elem1', 'High Value Memory', 'TAG001', 5, 'Personal', 'Group A', 2, 200, 'A valuable personal memory');
            
            db.prepare(`
                INSERT INTO elements (id, name, rfid_tag, value_rating, memory_type, memory_group, 
                                    group_multiplier, calculated_memory_value, description)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).run('elem2', 'Low Value Memory', 'TAG002', 2, 'Professional', 'Group B', 1, 50, 'A work-related memory');
            
            db.prepare(`
                INSERT INTO elements (id, name, calculated_memory_value)
                VALUES (?, ?, ?)
            `).run('elem3', 'No Value Item', 0);

            // Link character to elements
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem1');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem2');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem3');
        });

        test('returns only elements with memory value > 0', () => {
            const elements = computer.getCharacterMemoryElements('char1');

            expect(elements).toHaveLength(2);
            expect(elements[0].name).toBe('High Value Memory');
            expect(elements[0].calculated_memory_value).toBe(200);
            expect(elements[1].name).toBe('Low Value Memory');
            expect(elements[1].calculated_memory_value).toBe(50);
        });

        test('orders elements by memory value descending', () => {
            const elements = computer.getCharacterMemoryElements('char1');

            expect(elements[0].calculated_memory_value).toBeGreaterThan(elements[1].calculated_memory_value);
        });

        test('returns empty array for character with no memory elements', () => {
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char_empty', 'Empty Character');

            const elements = computer.getCharacterMemoryElements('char_empty');

            expect(elements).toEqual([]);
        });

        test('includes all memory-related fields', () => {
            const elements = computer.getCharacterMemoryElements('char1');

            const element = elements[0];
            expect(element).toHaveProperty('id');
            expect(element).toHaveProperty('name');
            expect(element).toHaveProperty('rfid_tag');
            expect(element).toHaveProperty('value_rating');
            expect(element).toHaveProperty('memory_type');
            expect(element).toHaveProperty('memory_group');
            expect(element).toHaveProperty('group_multiplier');
            expect(element).toHaveProperty('calculated_memory_value');
            expect(element).toHaveProperty('description');
        });
    });

    describe('getMemoryTokensByGroup() method', () => {
        beforeEach(() => {
            // Setup test data with memory groups
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char1', 'Character 1');

            // Group A tokens
            db.prepare(`
                INSERT INTO elements (id, name, memory_type, memory_group, group_multiplier, calculated_memory_value)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('elem1', 'Group A Token 1', 'Personal', 'Group A', 2, 100);
            
            db.prepare(`
                INSERT INTO elements (id, name, memory_type, memory_group, group_multiplier, calculated_memory_value)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('elem2', 'Group A Token 2', 'Personal', 'Group A', 2, 50);

            // Group B tokens
            db.prepare(`
                INSERT INTO elements (id, name, memory_type, memory_group, group_multiplier, calculated_memory_value)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('elem3', 'Group B Token 1', 'Professional', 'Group B', 3, 75);

            // No group token
            db.prepare(`
                INSERT INTO elements (id, name, memory_type, calculated_memory_value)
                VALUES (?, ?, ?, ?)
            `).run('elem4', 'Ungrouped Token', 'Other', 25);

            // Link one token to character
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem1');
        });

        test('groups tokens by memory_group', () => {
            const grouped = computer.getMemoryTokensByGroup();

            expect(Object.keys(grouped)).toHaveLength(2);
            expect(grouped['Group A']).toBeDefined();
            expect(grouped['Group B']).toBeDefined();
            expect(grouped['Group A'].tokens).toHaveLength(2);
            expect(grouped['Group B'].tokens).toHaveLength(1);
        });

        test('includes group metadata', () => {
            const grouped = computer.getMemoryTokensByGroup();

            expect(grouped['Group A'].groupName).toBe('Group A');
            expect(grouped['Group A'].groupMultiplier).toBe(2);
            expect(grouped['Group B'].groupName).toBe('Group B');
            expect(grouped['Group B'].groupMultiplier).toBe(3);
        });

        test('includes current owner information', () => {
            const grouped = computer.getMemoryTokensByGroup();

            const ownedToken = grouped['Group A'].tokens.find(t => t.id === 'elem1');
            expect(ownedToken.current_owner).toBe('char1');

            const unownedToken = grouped['Group A'].tokens.find(t => t.id === 'elem2');
            expect(unownedToken.current_owner).toBeNull();
        });

        test('excludes tokens without memory_group', () => {
            const grouped = computer.getMemoryTokensByGroup();

            const allTokens = Object.values(grouped).flatMap(group => group.tokens);
            const ungroupedToken = allTokens.find(t => t.name === 'Ungrouped Token');
            expect(ungroupedToken).toBeUndefined();
        });
    });

    describe('runComputePipeline() method', () => {
        beforeEach(() => {
            // Setup comprehensive test data
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char1', 'Character 1');
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char2', 'Character 2');

            db.prepare(`
                INSERT INTO elements (id, name, memory_type, memory_group, group_multiplier, calculated_memory_value)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('elem1', 'Memory Token 1', 'Personal', 'Group A', 2, 100);
            
            db.prepare(`
                INSERT INTO elements (id, name, memory_type, memory_group, group_multiplier, calculated_memory_value)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run('elem2', 'Memory Token 2', 'Professional', 'Group B', 1, 50);

            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem1');
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char2', 'elem2');
        });

        test('runs complete computation pipeline successfully', async () => {
            const result = await computer.runComputePipeline();

            expect(result.success).toBe(true);
            expect(result.duration).toBeGreaterThanOrEqual(0); // Duration might be 0 on fast machines
            expect(result.updatedCharacters).toBe(2);
            expect(result.stats).toBeDefined();
            expect(result.topCharacters).toBeDefined();
            expect(result.memoryGroups).toEqual(['Group A', 'Group B']);
        });

        test('includes statistics in pipeline results', async () => {
            const result = await computer.runComputePipeline();

            expect(result.stats.totalCharacters).toBe(2);
            expect(result.stats.charactersWithMemory).toBe(2);
            expect(result.stats.totalMemoryValue).toBe(150);
        });

        test('includes top characters by memory value', async () => {
            const result = await computer.runComputePipeline();

            expect(result.topCharacters).toHaveLength(2);
            expect(result.topCharacters[0].total_memory_value).toBe(100);
            expect(result.topCharacters[1].total_memory_value).toBe(50);
        });

        test('logs pipeline completion details', async () => {
            await computer.runComputePipeline();

            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO] MemoryValueComputer: Starting memory value computation pipeline'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[INFO] MemoryValueComputer: Memory value computation pipeline completed'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Total memory value across all characters: $150'));
            expect(console.log).toHaveBeenCalledWith(expect.stringContaining('Memory groups found: Group A, Group B'));
        });

        test('handles errors in pipeline gracefully', async () => {
            // Force database error by mocking the computeAllCharacterMemoryValues method
            const originalMethod = computer.computeAllCharacterMemoryValues;
            computer.computeAllCharacterMemoryValues = async () => {
                throw new Error('Simulated pipeline error');
            };

            await expect(computer.runComputePipeline()).rejects.toThrow();
            expect(console.error).toHaveBeenCalledWith(
                expect.stringContaining('[ERROR] MemoryValueComputer: Error in memory value computation pipeline:'),
                expect.any(Error)
            );
            
            // Restore
            computer.computeAllCharacterMemoryValues = originalMethod;
        });
    });

    describe('integration and edge cases', () => {
        test('handles null and undefined values gracefully', async () => {
            // Insert characters and elements with null values
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char1', 'Test Character');
            db.prepare(`
                INSERT INTO elements (id, name, calculated_memory_value)
                VALUES (?, ?, ?)
            `).run('elem1', 'Null Memory Token', null);

            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem1');

            const result = await computer.computeCharacterMemoryValue('char1');
            expect(result).toBe(0); // null memory value should be treated as 0
        });

        test('handles large numbers of characters and elements', async () => {
            // Setup large dataset
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            // Create 100 characters and 100 elements
            for (let i = 1; i <= 100; i++) {
                db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run(`char${i}`, `Character ${i}`);
                db.prepare(`
                    INSERT INTO elements (id, name, calculated_memory_value)
                    VALUES (?, ?, ?)
                `).run(`elem${i}`, `Element ${i}`, i * 10);
                
                // Link each character to their corresponding element
                db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(`char${i}`, `elem${i}`);
            }

            const startTime = Date.now();
            const result = await computer.computeAllCharacterMemoryValues();
            const duration = Date.now() - startTime;

            expect(result).toBe(100);
            expect(duration).toBeLessThan(1000); // Should complete in under 1 second

            // Verify a few sample calculations
            const char1 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
            expect(char1.total_memory_value).toBe(10);

            const char100 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char100');
            expect(char100.total_memory_value).toBe(1000);
        });

        test('maintains data consistency across multiple operations', async () => {
            // Setup test data
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            
            db.prepare('INSERT INTO characters (id, name) VALUES (?, ?)').run('char1', 'Consistent Character');
            db.prepare(`
                INSERT INTO elements (id, name, calculated_memory_value)
                VALUES (?, ?, ?)
            `).run('elem1', 'Memory Token', 100);
            
            db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run('char1', 'elem1');

            // Run individual computation
            const individualResult = await computer.computeCharacterMemoryValue('char1');
            
            // Run full computation
            await computer.computeAllCharacterMemoryValues();
            
            // Run pipeline
            const pipelineResult = await computer.runComputePipeline();

            // All should give consistent results
            const character = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
            expect(individualResult).toBe(100);
            expect(character.total_memory_value).toBe(100);
            expect(pipelineResult.stats.totalMemoryValue).toBe(100);
        });
    });
});