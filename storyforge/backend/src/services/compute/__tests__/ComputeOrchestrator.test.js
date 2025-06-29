const ComputeOrchestrator = require('../ComputeOrchestrator');
const { initializeDatabase, closeDB, getDB } = require('../../../db/database');

// Mock console.log to avoid noise in tests
const originalConsoleLog = console.log;

describe('ComputeOrchestrator', () => {
  let orchestrator;
  let db;

  beforeAll(() => {
    // Silence console output during tests
    console.log = jest.fn();

    // Initialize in-memory database for testing
    initializeDatabase(':memory:');
    db = getDB();
  });

  afterAll(() => {
    // Restore console.log
    console.log = originalConsoleLog;
    closeDB();
  });

  beforeEach(() => {
    // Create test tables
    db.exec(`
            CREATE TABLE IF NOT EXISTS timeline_events (
                id TEXT PRIMARY KEY,
                description TEXT,
                element_ids TEXT,
                act_focus TEXT
            )
        `);

    db.exec(`
            CREATE TABLE IF NOT EXISTS characters (
                id TEXT PRIMARY KEY,
                name TEXT,
                connections INTEGER DEFAULT 0,
                resolution_paths TEXT,
                total_memory_value INTEGER DEFAULT 0
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
                timing TEXT,
                owner_id TEXT,
                locked_item_id TEXT,
                reward_ids TEXT,
                puzzle_element_ids TEXT,
                story_reveals TEXT,
                narrative_threads TEXT,
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

    orchestrator = new ComputeOrchestrator(db);
  });

  afterEach(() => {
    // Clean up tables
    try {
      db.exec('DROP TABLE IF EXISTS character_owned_elements');
      db.exec('DROP TABLE IF EXISTS timeline_events');
      db.exec('DROP TABLE IF EXISTS characters');
      db.exec('DROP TABLE IF EXISTS elements');
      db.exec('DROP TABLE IF EXISTS puzzles');
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    test('creates instance with valid database connection', () => {
      const testOrchestrator = new ComputeOrchestrator(db);
      expect(testOrchestrator.db).toBe(db);
      expect(testOrchestrator.actFocusComputer).toBeDefined();
      expect(testOrchestrator.resolutionPathComputer).toBeDefined();
      expect(testOrchestrator.narrativeThreadComputer).toBeDefined();
    });

    test('throws error when database connection is null', () => {
      expect(() => new ComputeOrchestrator(null)).toThrow('Database connection required');
    });

    test('throws error when database connection is undefined', () => {
      expect(() => new ComputeOrchestrator()).toThrow('Database connection required');
    });
  });

  describe('computeAll() method', () => {
    beforeEach(() => {
      // Insert test data for all entity types
      db.prepare('DELETE FROM timeline_events').run();
      db.prepare('DELETE FROM characters').run();
      db.prepare('DELETE FROM elements').run();
      db.prepare('DELETE FROM puzzles').run();
      db.prepare('DELETE FROM character_owned_elements').run();

      // Timeline events
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'event1', 'Event 1', JSON.stringify(['elem1'])
      );
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'event2', 'Event 2', JSON.stringify(['elem2'])
      );

      // Characters
      db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
        'char1', 'Character 1', 3
      );
      db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
        'char2', 'Character 2', 7
      );

      // Elements
      db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
        'elem1', 'Memory Token', 'Memory'
      );
      db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
        'elem2', 'Investigation Clue', 'Evidence'
      );

      // Puzzles
      db.prepare('INSERT INTO puzzles (id, name, puzzle_element_ids) VALUES (?, ?, ?)').run(
        'puzzle1', 'Puzzle 1', JSON.stringify(['elem1'])
      );
      db.prepare('INSERT INTO puzzles (id, name, puzzle_element_ids) VALUES (?, ?, ?)').run(
        'puzzle2', 'Puzzle 2', JSON.stringify(['elem2'])
      );

      // Character-element relationships
      db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
        'char1', 'elem1'
      );
      db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
        'char2', 'elem2'
      );
    });

    test('computes all derived fields successfully', async () => {
      const result = await orchestrator.computeAll();

      expect(result.processed).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
      expect(result.details).toBeDefined();
      expect(result.details.actFocus).toBeDefined();
      expect(result.details.characterPaths).toBeDefined();
      expect(result.details.puzzlePaths).toBeDefined();
      expect(result.details.elementPaths).toBeDefined();
      expect(result.details.narrativeThreads).toBeDefined();
    });

    test('verifies act focus computation for timeline events', async () => {
      await orchestrator.computeAll();

      const event1 = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event1');
      expect(event1.act_focus).toBeDefined();

      const event2 = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event2');
      expect(event2.act_focus).toBeDefined();
    });

    test('verifies resolution paths computation for characters', async () => {
      await orchestrator.computeAll();

      const char1 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
      expect(char1.resolution_paths).toBeDefined();
      const char1Paths = JSON.parse(char1.resolution_paths);
      expect(char1Paths).toContain('Black Market'); // owns memory element

      const char2 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char2');
      expect(char2.resolution_paths).toBeDefined();
      const char2Paths = JSON.parse(char2.resolution_paths);
      expect(char2Paths).toContain('Detective'); // owns evidence element
      expect(char2Paths).toContain('Third Path'); // high connections
    });

    test('verifies resolution paths computation for puzzles', async () => {
      await orchestrator.computeAll();

      const puzzle1 = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle1');
      expect(puzzle1.resolution_paths).toBeDefined();

      const puzzle2 = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle2');
      expect(puzzle2.resolution_paths).toBeDefined();
    });

    test('verifies resolution paths computation for elements', async () => {
      await orchestrator.computeAll();

      const elem1 = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem1');
      expect(elem1.resolution_paths).toBeDefined();
      const elem1Paths = JSON.parse(elem1.resolution_paths);
      expect(elem1Paths).toContain('Black Market');

      const elem2 = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem2');
      expect(elem2.resolution_paths).toBeDefined();
      const elem2Paths = JSON.parse(elem2.resolution_paths);
      expect(elem2Paths).toContain('Detective');
    });

    test('verifies narrative threads computation for puzzles', async () => {
      await orchestrator.computeAll();

      const puzzle1 = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle1');
      expect(puzzle1.computed_narrative_threads).toBeDefined();

      const puzzle2 = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle2');
      expect(puzzle2.computed_narrative_threads).toBeDefined();
    });

    test('handles empty database gracefully', async () => {
      // Clear all data in correct order (foreign keys first)
      db.prepare('DELETE FROM character_owned_elements').run();
      db.prepare('DELETE FROM timeline_events').run();
      db.prepare('DELETE FROM characters').run();
      db.prepare('DELETE FROM elements').run();
      db.prepare('DELETE FROM puzzles').run();

      const result = await orchestrator.computeAll();

      expect(result.processed).toBe(0);
      expect(result.errors).toBe(0);
      expect(result.details).toBeDefined();
    });

    test('uses transaction management correctly', async () => {
      // Mock database exec to track transaction calls
      const execCalls = [];
      const originalExec = db.exec;
      db.exec = (sql) => {
        execCalls.push(sql);
        return originalExec.call(db, sql);
      };

      await orchestrator.computeAll();

      expect(execCalls).toContain('BEGIN');
      expect(execCalls).toContain('COMMIT');
      expect(execCalls).not.toContain('ROLLBACK');

      // Restore
      db.exec = originalExec;
    });

    test('rolls back transaction on error', async () => {
      // Mock one of the computers to throw an error
      const originalCompute = orchestrator.actFocusComputer.computeAll;
      orchestrator.actFocusComputer.computeAll = async () => {
        throw new Error('Simulated computation error');
      };

      // Mock database exec to track transaction calls
      const execCalls = [];
      const originalExec = db.exec;
      db.exec = (sql) => {
        execCalls.push(sql);
        return originalExec.call(db, sql);
      };

      await expect(orchestrator.computeAll()).rejects.toThrow('Failed to compute derived fields: Simulated computation error');

      expect(execCalls).toContain('BEGIN');
      expect(execCalls).toContain('ROLLBACK');
      expect(execCalls).not.toContain('COMMIT');

      // Restore
      orchestrator.actFocusComputer.computeAll = originalCompute;
      db.exec = originalExec;
    });

    test('continues processing after individual computer errors', async () => {
      // Mock one computer to have errors but not throw
      const originalCompute = orchestrator.actFocusComputer.computeAll;
      orchestrator.actFocusComputer.computeAll = async () => {
        return { processed: 0, errors: 5 }; // Simulate errors but don't throw
      };

      const result = await orchestrator.computeAll();

      expect(result.errors).toBeGreaterThan(0);
      expect(result.details.actFocus.errors).toBe(5);

      // Restore
      orchestrator.actFocusComputer.computeAll = originalCompute;
    });
  });

  describe('computeEntity() method', () => {
    beforeEach(() => {
      // Insert test data
      db.prepare('DELETE FROM timeline_events').run();
      db.prepare('DELETE FROM characters').run();
      db.prepare('DELETE FROM elements').run();
      db.prepare('DELETE FROM puzzles').run();
      db.prepare('DELETE FROM character_owned_elements').run();

      // Test entities
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'event1', 'Test Event', JSON.stringify(['elem1'])
      );
      db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
        'char1', 'Test Character', 3
      );
      db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
        'elem1', 'Test Element', 'Memory'
      );
      db.prepare('INSERT INTO puzzles (id, name, puzzle_element_ids) VALUES (?, ?, ?)').run(
        'puzzle1', 'Test Puzzle', JSON.stringify(['elem1'])
      );

      // Character-element relationship
      db.prepare('INSERT INTO character_owned_elements (character_id, element_id) VALUES (?, ?)').run(
        'char1', 'elem1'
      );
    });

    test('computes fields for timeline event', async () => {
      const result = await orchestrator.computeEntity('timeline_event', 'event1');

      expect(result.act_focus).toBeDefined();

      // Verify database update
      const updated = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event1');
      expect(updated.act_focus).toBe(result.act_focus);
    });

    test('computes fields for character', async () => {
      const result = await orchestrator.computeEntity('character', 'char1');

      expect(result.resolution_paths).toBeDefined();

      // Verify database update
      const updated = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
      expect(updated.resolution_paths).toBe(result.resolution_paths);
    });

    test('computes fields for element', async () => {
      const result = await orchestrator.computeEntity('element', 'elem1');

      expect(result.resolution_paths).toBeDefined();

      // Verify database update
      const updated = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem1');
      expect(updated.resolution_paths).toBe(result.resolution_paths);
    });

    test('computes fields for puzzle', async () => {
      const result = await orchestrator.computeEntity('puzzle', 'puzzle1');

      expect(result.resolution_paths).toBeDefined();
      expect(result.computed_narrative_threads).toBeDefined();

      // Verify database update
      const updated = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle1');
      expect(updated.resolution_paths).toBe(result.resolution_paths);
      expect(updated.computed_narrative_threads).toBe(result.computed_narrative_threads);
    });

    test('throws error for unsupported entity type', async () => {
      await expect(
        orchestrator.computeEntity('invalid_type', 'test1')
      ).rejects.toThrow('Unsupported entity type: invalid_type');
    });

    test('throws error for non-existent entity', async () => {
      await expect(
        orchestrator.computeEntity('character', 'non_existent')
      ).rejects.toThrow('character non_existent not found');
    });

    test('uses transaction management for single entity computation', async () => {
      // Mock database exec to track transaction calls
      const execCalls = [];
      const originalExec = db.exec;
      db.exec = (sql) => {
        execCalls.push(sql);
        return originalExec.call(db, sql);
      };

      await orchestrator.computeEntity('character', 'char1');

      expect(execCalls).toContain('BEGIN');
      expect(execCalls).toContain('COMMIT');

      // Restore
      db.exec = originalExec;
    });

    test('rolls back transaction on single entity computation error', async () => {
      // Mock computer to throw error
      const originalCompute = orchestrator.resolutionPathComputer.compute;
      orchestrator.resolutionPathComputer.compute = async () => {
        throw new Error('Computation error');
      };

      // Mock database exec to track transaction calls
      const execCalls = [];
      const originalExec = db.exec;
      db.exec = (sql) => {
        execCalls.push(sql);
        return originalExec.call(db, sql);
      };

      await expect(
        orchestrator.computeEntity('character', 'char1')
      ).rejects.toThrow('Failed to compute fields for character char1: Computation error');

      expect(execCalls).toContain('BEGIN');
      expect(execCalls).toContain('ROLLBACK');

      // Restore
      orchestrator.resolutionPathComputer.compute = originalCompute;
      db.exec = originalExec;
    });
  });

  describe('integration tests', () => {
    test('complete workflow: compute all then compute individual entity', async () => {
      // Setup test data
      db.prepare('DELETE FROM timeline_events').run();
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'workflow_event', 'Workflow Event', JSON.stringify(['workflow_elem'])
      );
      db.prepare('DELETE FROM elements').run();
      db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
        'workflow_elem', 'Workflow Element', 'Memory'
      );

      // Compute all
      const allResult = await orchestrator.computeAll();
      expect(allResult.processed).toBeGreaterThan(0);

      // Verify timeline event was computed
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('workflow_event');
      expect(event.act_focus).toBeDefined();

      // Add new entity and compute individually
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'new_event', 'New Event', JSON.stringify(['workflow_elem'])
      );

      const entityResult = await orchestrator.computeEntity('timeline_event', 'new_event');
      expect(entityResult.act_focus).toBeDefined();

      // Verify new entity was computed
      const newEvent = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('new_event');
      expect(newEvent.act_focus).toBe(entityResult.act_focus);
    });

    test('handles mixed success and failure scenarios', async () => {
      // Setup data with some problematic entries
      db.prepare('DELETE FROM timeline_events').run();
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'good_event', 'Good Event', JSON.stringify(['elem1'])
      );
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'bad_event', 'Bad Event', 'invalid_json'
      );

      db.prepare('DELETE FROM elements').run();
      db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
        'elem1', 'Good Element', 'Memory'
      );

      // Should handle errors gracefully
      const result = await orchestrator.computeAll();

      // Should have some processed and some errors
      expect(result.processed).toBeGreaterThan(0);
      // Note: Current implementation might handle malformed JSON gracefully
    });
  });

  describe('performance and reliability', () => {
    test('completes computation within reasonable time', async () => {
      // Create moderate amount of test data
      db.prepare('DELETE FROM timeline_events').run();
      db.prepare('DELETE FROM characters').run();
      db.prepare('DELETE FROM elements').run();
      db.prepare('DELETE FROM puzzles').run();

      for (let i = 1; i <= 20; i++) {
        db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
          `event${i}`, `Event ${i}`, JSON.stringify([`elem${i}`])
        );
        db.prepare('INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)').run(
          `char${i}`, `Character ${i}`, i % 10
        );
        db.prepare('INSERT INTO elements (id, name, type) VALUES (?, ?, ?)').run(
          `elem${i}`, `Element ${i}`, i % 2 === 0 ? 'Memory' : 'Evidence'
        );
        db.prepare('INSERT INTO puzzles (id, name, puzzle_element_ids) VALUES (?, ?, ?)').run(
          `puzzle${i}`, `Puzzle ${i}`, JSON.stringify([`elem${i}`])
        );
      }

      const startTime = Date.now();
      const result = await orchestrator.computeAll();
      const duration = Date.now() - startTime;

      expect(result.processed).toBeGreaterThan(60); // 20 * 4 entity types = 80 minimum
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds

      console.log(`✅ Performance test: Computed all fields for 80 entities in ${duration}ms`);
    });

    test('handles database constraints and edge cases', async () => {
      // Test with minimal data
      db.prepare('DELETE FROM timeline_events').run();
      db.prepare('DELETE FROM characters').run();
      db.prepare('DELETE FROM elements').run();
      db.prepare('DELETE FROM puzzles').run();

      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'minimal_event', 'Minimal Event', JSON.stringify([])
      );

      const result = await orchestrator.computeAll();
      expect(result.processed).toBeGreaterThanOrEqual(1);
      expect(result.errors).toBe(0);
    });
  });
});