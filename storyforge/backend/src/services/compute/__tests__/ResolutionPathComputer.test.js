const ResolutionPathComputer = require('../ResolutionPathComputer');
const { initializeDatabase, closeDB, getDB } = require('../../../db/database');

describe('ResolutionPathComputer', () => {
    let computer;
    let db;

    beforeAll(() => {
        // Initialize in-memory database for testing
        initializeDatabase(':memory:');
        db = getDB();
        computer = new ResolutionPathComputer(db);
    });

    afterAll(() => {
        closeDB();
    });

    beforeEach(() => {
        // Create test tables
        db.exec(`
            CREATE TABLE IF NOT EXISTS characters (
                id TEXT PRIMARY KEY,
                name TEXT,
                connections INTEGER DEFAULT 0,
                resolution_paths TEXT
            )
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS elements (
                id TEXT PRIMARY KEY,
                name TEXT,
                type TEXT,
                resolution_paths TEXT
            )
        `);

        db.exec(`
            CREATE TABLE IF NOT EXISTS puzzles (
                id TEXT PRIMARY KEY,
                name TEXT,
                computed_narrative_threads TEXT,
                resolution_paths TEXT
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
    });

    afterEach(() => {
        // Clean up tables in correct order (foreign keys first)
        try {
            db.exec('DROP TABLE IF EXISTS character_owned_elements');
            db.exec('DROP TABLE IF EXISTS characters');
            db.exec('DROP TABLE IF EXISTS elements');
            db.exec('DROP TABLE IF EXISTS puzzles');
        } catch (error) {
            // Ignore errors during cleanup
        }
    });

    describe('compute() method', () => {
        describe('character resolution paths', () => {
            beforeEach(() => {
                // Clear existing data
                db.exec('DELETE FROM character_owned_elements');
                db.exec('DELETE FROM characters');
                db.exec('DELETE FROM elements');
                
                // Insert test characters
                db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
                    'char1', 'Test Character 1', 3
                );
                db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
                    'char2', 'Test Character 2', 7
                );

                // Insert test elements
                db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
                    'elem1', 'Black Market Card', 'Trading Card'
                );
                db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
                    'elem2', 'Memory Token', 'Memory Item'
                );
                db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
                    'elem3', 'Investigation Clue', 'Evidence'
                );
                db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
                    'elem4', 'Regular Item', 'Regular'
                );
            });

            test('identifies Black Market path from owned elements', async () => {
                // Link character to black market element
                db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
                    'char1', 'elem1'
                );

                const character = { id: 'char1', connections: 3 };
                const result = await computer.compute(character, 'character');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
            });

            test('identifies Black Market path from memory type elements', async () => {
                // Link character to memory element
                db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
                    'char1', 'elem2'
                );

                const character = { id: 'char1', connections: 3 };
                const result = await computer.compute(character, 'character');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
            });

            test('identifies Detective path from evidence elements', async () => {
                // Link character to evidence element
                db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
                    'char1', 'elem3'
                );

                const character = { id: 'char1', connections: 3 };
                const result = await computer.compute(character, 'character');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Detective');
            });

            test('identifies Third Path from high connections', async () => {
                const character = { id: 'char2', connections: 7 };
                const result = await computer.compute(character, 'character');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Third Path');
            });

            test('returns multiple paths when applicable', async () => {
                // Link character to both black market and evidence elements
                db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
                    'char2', 'elem1'
                );
                db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
                    'char2', 'elem3'
                );

                const character = { id: 'char2', connections: 7 };
                const result = await computer.compute(character, 'character');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
                expect(paths).toContain('Detective');
                expect(paths).toContain('Third Path');
                expect(paths).toHaveLength(3);
            });

            test('returns Unassigned when no paths match', async () => {
                // Link character to regular element only
                db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
                    'char1', 'elem4'
                );

                const character = { id: 'char1', connections: 3 };
                const result = await computer.compute(character, 'character');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toEqual(['Unassigned']);
            });

            test('handles character with no owned elements', async () => {
                const character = { id: 'char1', connections: 3 };
                const result = await computer.compute(character, 'character');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toEqual(['Unassigned']);
            });
        });

        describe('puzzle resolution paths', () => {
            test('identifies Black Market path from Underground Parties thread', async () => {
                const puzzle = {
                    id: 'puzzle1',
                    computed_narrative_threads: JSON.stringify(['Underground Parties', 'Other Thread'])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
            });

            test('identifies Black Market path from Memory Drug thread', async () => {
                const puzzle = {
                    id: 'puzzle2',
                    computed_narrative_threads: JSON.stringify(['Memory Drug'])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
            });

            test('identifies Detective path from Corp. Espionage thread', async () => {
                const puzzle = {
                    id: 'puzzle3',
                    computed_narrative_threads: JSON.stringify(['Corp. Espionage'])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Detective');
            });

            test('identifies Detective path from Corporate Espionage thread', async () => {
                const puzzle = {
                    id: 'puzzle4',
                    computed_narrative_threads: JSON.stringify(['Corporate Espionage'])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Detective');
            });

            test('identifies Third Path from Marriage Troubles thread', async () => {
                const puzzle = {
                    id: 'puzzle5',
                    computed_narrative_threads: JSON.stringify(['Marriage Troubles'])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Third Path');
            });

            test('identifies Third Path from Community thread', async () => {
                const puzzle = {
                    id: 'puzzle6',
                    computed_narrative_threads: JSON.stringify(['Community'])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Third Path');
            });

            test('handles multiple matching threads', async () => {
                const puzzle = {
                    id: 'puzzle7',
                    computed_narrative_threads: JSON.stringify([
                        'Underground Parties', 
                        'Corp. Espionage', 
                        'Marriage Troubles'
                    ])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
                expect(paths).toContain('Detective');
                expect(paths).toContain('Third Path');
                expect(paths).toHaveLength(3);
            });

            test('returns Unassigned for non-matching threads', async () => {
                const puzzle = {
                    id: 'puzzle8',
                    computed_narrative_threads: JSON.stringify(['Random Thread', 'Another Thread'])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toEqual(['Unassigned']);
            });

            test('handles empty narrative threads', async () => {
                const puzzle = {
                    id: 'puzzle9',
                    computed_narrative_threads: JSON.stringify([])
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toEqual(['Unassigned']);
            });

            test('handles null narrative threads', async () => {
                const puzzle = {
                    id: 'puzzle10',
                    computed_narrative_threads: null
                };

                const result = await computer.compute(puzzle, 'puzzle');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toEqual(['Unassigned']);
            });
        });

        describe('element resolution paths', () => {
            test('identifies Black Market path from memory type', async () => {
                const element = {
                    id: 'elem1',
                    name: 'Memory Token',
                    type: 'Memory Item'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
            });

            test('identifies Black Market path from black market name', async () => {
                const element = {
                    id: 'elem2',
                    name: 'Black Market Business Card',
                    type: 'Card'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
            });

            test('identifies Black Market path from trade name', async () => {
                const element = {
                    id: 'elem3',
                    name: 'Trade Agreement',
                    type: 'Document'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
            });

            test('identifies Detective path from evidence type', async () => {
                const element = {
                    id: 'elem4',
                    name: 'DNA Sample',
                    type: 'Evidence'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Detective');
            });

            test('identifies Detective path from clue name', async () => {
                const element = {
                    id: 'elem5',
                    name: 'Investigation Clue Sheet',
                    type: 'Document'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Detective');
            });

            test('identifies Third Path from community name', async () => {
                const element = {
                    id: 'elem6',
                    name: 'Community Meeting Notes',
                    type: 'Document'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Third Path');
            });

            test('identifies Third Path from rejection name', async () => {
                const element = {
                    id: 'elem7',
                    name: 'Rejection Letter',
                    type: 'Document'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Third Path');
            });

            test('identifies Third Path from authority name', async () => {
                const element = {
                    id: 'elem8',
                    name: 'Authority Figure Contact',
                    type: 'Contact'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Third Path');
            });

            test('handles multiple matching patterns', async () => {
                const element = {
                    id: 'elem9',
                    name: 'Black Market Investigation Clue', // Matches both black market and detective
                    type: 'Evidence'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
                expect(paths).toContain('Detective');
                expect(paths).toHaveLength(2);
            });

            test('returns Unassigned for non-matching element', async () => {
                const element = {
                    id: 'elem10',
                    name: 'Regular Item',
                    type: 'Generic'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toEqual(['Unassigned']);
            });

            test('handles null name and type', async () => {
                const element = {
                    id: 'elem11',
                    name: null,
                    type: null
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toEqual(['Unassigned']);
            });

            test('case insensitive matching', async () => {
                const element = {
                    id: 'elem12',
                    name: 'BLACK MARKET EVIDENCE',
                    type: 'MEMORY'
                };

                const result = await computer.compute(element, 'element');

                const paths = JSON.parse(result.resolution_paths);
                expect(paths).toContain('Black Market');
                expect(paths).toContain('Detective');
                expect(paths).toHaveLength(2);
            });
        });

        describe('error handling', () => {
            test('throws error for missing required fields', async () => {
                const entity = {
                    name: 'Test Entity'
                    // missing id field
                };

                await expect(computer.compute(entity, 'character')).rejects.toThrow('Missing required fields: id');
            });

            test('throws error for unsupported entity type', async () => {
                const entity = { id: 'test1' };

                await expect(computer.compute(entity, 'invalid_type')).rejects.toThrow('Unsupported entity type: invalid_type');
            });

            test('throws error with entity context on failure', async () => {
                // Force a database error by dropping character_owned_elements table
                db.exec('DROP TABLE character_owned_elements');

                const entity = { id: 'char1' };

                await expect(computer.compute(entity, 'character')).rejects.toThrow(/Failed to compute resolution paths for character char1/);
            });
        });
    });

    describe('computeAll() method', () => {
        beforeEach(() => {
            // Clear existing data
            db.exec('DELETE FROM character_owned_elements');
            db.exec('DELETE FROM characters');
            db.exec('DELETE FROM elements');
            db.exec('DELETE FROM puzzles');
            
            // Insert test data for all entity types
            db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
                'char1', 'Character 1', 3
            );
            db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
                'char2', 'Character 2', 7
            );
            db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
                'char3', 'Character 3', 5
            );

            db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
                'elem1', 'Memory Token', 'Memory'
            );
            db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
                'elem2', 'Regular Item', 'Item'
            );

            db.prepare('INSERT INTO puzzles (id, name, computed_narrative_threads) VALUES (?, ?, ?)').run(
                'puzzle1', 'Puzzle 1', JSON.stringify(['Underground Parties'])
            );
            db.prepare('INSERT INTO puzzles (id, name, computed_narrative_threads) VALUES (?, ?, ?)').run(
                'puzzle2', 'Puzzle 2', JSON.stringify(['Random Thread'])
            );
        });

        test('computes resolution paths for all characters', async () => {
            const result = await computer.computeAll('character');

            expect(result.processed).toBe(3);
            expect(result.errors).toBe(0);

            // Verify database updates
            const char1 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
            expect(char1.resolution_paths).toBeDefined();
            
            const char2 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char2');
            expect(char2.resolution_paths).toBeDefined();
            const char2Paths = JSON.parse(char2.resolution_paths);
            expect(char2Paths).toContain('Third Path');
        });

        test('computes resolution paths for all elements', async () => {
            const result = await computer.computeAll('element');

            expect(result.processed).toBe(2);
            expect(result.errors).toBe(0);

            // Verify database updates
            const elem1 = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem1');
            expect(elem1.resolution_paths).toBeDefined();
            const elem1Paths = JSON.parse(elem1.resolution_paths);
            expect(elem1Paths).toContain('Black Market');

            const elem2 = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem2');
            expect(elem2.resolution_paths).toBeDefined();
            const elem2Paths = JSON.parse(elem2.resolution_paths);
            expect(elem2Paths).toEqual(['Unassigned']);
        });

        test('computes resolution paths for all puzzles', async () => {
            const result = await computer.computeAll('puzzle');

            expect(result.processed).toBe(2);
            expect(result.errors).toBe(0);

            // Verify database updates
            const puzzle1 = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle1');
            expect(puzzle1.resolution_paths).toBeDefined();
            const puzzle1Paths = JSON.parse(puzzle1.resolution_paths);
            expect(puzzle1Paths).toContain('Black Market');

            const puzzle2 = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle2');
            expect(puzzle2.resolution_paths).toBeDefined();
            const puzzle2Paths = JSON.parse(puzzle2.resolution_paths);
            expect(puzzle2Paths).toEqual(['Unassigned']);
        });

        test('handles empty tables', async () => {
            db.exec('DELETE FROM characters');

            const result = await computer.computeAll('character');

            expect(result.processed).toBe(0);
            expect(result.errors).toBe(0);
        });

        test('continues processing after individual errors', async () => {
            // Override the computeAll method to manually inject error by temporarily replacing compute
            const originalCompute = computer.compute;
            let callCount = 0;
            computer.compute = async function(entity, entityType) {
                callCount++;
                if (callCount === 3) { // Fail on third call
                    throw new Error('Simulated error for testing');
                }
                return originalCompute.call(this, entity, entityType);
            };

            const result = await computer.computeAll('character');
            
            // Restore original method
            computer.compute = originalCompute;

            // Should process 2 good characters and encounter 1 error
            expect(result.processed).toBe(2);
            expect(result.errors).toBe(1);
        });

        test('throws error for unsupported entity type', async () => {
            await expect(computer.computeAll('invalid_type')).rejects.toThrow('Unsupported entity type: invalid_type');
        });

        test('throws error on database failure', async () => {
            // Drop characters table to cause error
            db.exec('DROP TABLE characters');

            await expect(computer.computeAll('character')).rejects.toThrow(/Failed to compute all resolution paths for character/);
        });
    });

    describe('performance benchmarks', () => {
        test('computes resolution paths for 100 entities in under 2 seconds', async () => {
            // Clear existing data
            db.exec('DELETE FROM elements');
            
            // Create 100 test elements with various patterns
            const elements = [];
            for (let i = 1; i <= 100; i++) {
                const type = i % 3 === 0 ? 'Memory' : i % 3 === 1 ? 'Evidence' : 'Regular';
                const name = i % 4 === 0 ? 'Black Market Item' : 
                            i % 4 === 1 ? 'Investigation Clue' : 
                            i % 4 === 2 ? 'Community Document' : 'Regular Item';
                
                elements.push([`elem_${i}`, `${name} ${i}`, type]);
            }

            // Insert elements
            const insertElement = db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)');
            elements.forEach(element => insertElement.run(...element));

            // Performance test
            const startTime = Date.now();
            const result = await computer.computeAll('element');
            const duration = Date.now() - startTime;

            // Verify results
            expect(result.processed).toBe(100);
            expect(result.errors).toBe(0);
            expect(duration).toBeLessThan(2000); // Should complete in under 2 seconds

            console.log(`✅ Performance test: Computed resolution paths for 100 elements in ${duration}ms`);
        });
    });

    describe('database integration', () => {
        test('updateDatabase method works correctly', async () => {
            // Clear existing data and insert test element
            db.exec('DELETE FROM elements');
            db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
                'test_element', 'Test Element', 'Test Type'
            );

            const element = { id: 'test_element' };
            const computedFields = { resolution_paths: JSON.stringify(['Test Path']) };

            await computer.updateDatabase('elements', 'id', element, computedFields);

            // Verify update
            const updatedElement = db.prepare('SELECT * FROM elements WHERE id = ?').get('test_element');
            expect(updatedElement.resolution_paths).toBe(JSON.stringify(['Test Path']));
        });

        test('validateRequiredFields method works correctly', () => {
            const validEntity = { id: 'test' };
            const invalidEntity = { name: 'test' }; // missing id

            expect(() => computer.validateRequiredFields(validEntity, ['id'])).not.toThrow();
            expect(() => computer.validateRequiredFields(invalidEntity, ['id'])).toThrow('Missing required fields: id');
        });
    });
});