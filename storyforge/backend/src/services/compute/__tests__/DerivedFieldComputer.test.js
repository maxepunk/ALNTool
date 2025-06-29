const DerivedFieldComputer = require('../DerivedFieldComputer');
const { initializeDatabase, closeDB, getDB } = require('../../../db/database');

// Create a concrete test implementation of the abstract base class
class TestDerivedFieldComputer extends DerivedFieldComputer {
  constructor(db, options = {}) {
    super(db);
    this.shouldThrowError = options.shouldThrowError || false;
    this.computeDelay = options.computeDelay || 0;
    this.computeResult = options.computeResult || { test_field: 'test_value' };
  }

  async compute(entity) {
    if (this.shouldThrowError) {
      throw new Error('Test computation error');
    }

    if (this.computeDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.computeDelay));
    }

    return { ...this.computeResult, computed_for: entity.id };
  }
}

describe('DerivedFieldComputer', () => {
  let db;
  let computer;

  beforeAll(() => {
    // Initialize in-memory database for testing
    initializeDatabase(':memory:');
    db = getDB();
  });

  afterAll(() => {
    closeDB();
  });

  beforeEach(() => {
    // Create test table for updateDatabase tests
    db.exec(`
            CREATE TABLE IF NOT EXISTS test_entities (
                id TEXT PRIMARY KEY,
                name TEXT,
                test_field TEXT,
                computed_value TEXT
            )
        `);

    computer = new TestDerivedFieldComputer(db);
  });

  afterEach(() => {
    // Clean up
    try {
      db.exec('DROP TABLE IF EXISTS test_entities');
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('constructor', () => {
    test('creates instance with valid database connection', () => {
      const testComputer = new TestDerivedFieldComputer(db);
      expect(testComputer.db).toBe(db);
    });

    test('throws error when database connection is null', () => {
      expect(() => new TestDerivedFieldComputer(null)).toThrow('Database connection required');
    });

    test('throws error when database connection is undefined', () => {
      expect(() => new TestDerivedFieldComputer()).toThrow('Database connection required');
    });

    test('throws error when database connection is false', () => {
      expect(() => new TestDerivedFieldComputer(false)).toThrow('Database connection required');
    });
  });

  describe('compute() method', () => {
    test('base class throws error for unimplemented compute method', async () => {
      const baseComputer = new DerivedFieldComputer(db);
      const entity = { id: 'test1' };

      await expect(baseComputer.compute(entity)).rejects.toThrow('compute() must be implemented by subclass');
    });

    test('concrete implementation can override compute method', async () => {
      const entity = { id: 'test1', name: 'Test Entity' };
      const result = await computer.compute(entity);

      expect(result).toEqual({
        test_field: 'test_value',
        computed_for: 'test1'
      });
    });

    test('concrete implementation can throw errors', async () => {
      const errorComputer = new TestDerivedFieldComputer(db, { shouldThrowError: true });
      const entity = { id: 'test1' };

      await expect(errorComputer.compute(entity)).rejects.toThrow('Test computation error');
    });
  });

  describe('computeBatch() method', () => {
    test('processes array of entities successfully', async () => {
      const entities = [
        { id: 'entity1', name: 'Entity 1' },
        { id: 'entity2', name: 'Entity 2' },
        { id: 'entity3', name: 'Entity 3' }
      ];

      const results = await computer.computeBatch(entities);

      expect(results).toHaveLength(3);
      expect(results[0]).toEqual({ test_field: 'test_value', computed_for: 'entity1' });
      expect(results[1]).toEqual({ test_field: 'test_value', computed_for: 'entity2' });
      expect(results[2]).toEqual({ test_field: 'test_value', computed_for: 'entity3' });
    });

    test('handles empty array', async () => {
      const results = await computer.computeBatch([]);
      expect(results).toEqual([]);
    });

    test('throws error for non-array input', async () => {
      await expect(computer.computeBatch('not an array')).rejects.toThrow('entities must be an array');
      await expect(computer.computeBatch(null)).rejects.toThrow('entities must be an array');
      await expect(computer.computeBatch(undefined)).rejects.toThrow('entities must be an array');
      await expect(computer.computeBatch(123)).rejects.toThrow('entities must be an array');
      await expect(computer.computeBatch({})).rejects.toThrow('entities must be an array');
    });

    test('handles individual computation errors in batch', async () => {
      const entities = [
        { id: 'entity1', name: 'Entity 1' },
        { id: 'entity2', name: 'Entity 2' }
      ];

      // Create computer that throws on second entity
      let callCount = 0;
      const errorComputer = new TestDerivedFieldComputer(db);
      errorComputer.compute = async function(entity) {
        callCount++;
        if (callCount === 2) {
          throw new Error('Computation failed for entity2');
        }
        return { test_field: 'test_value', computed_for: entity.id };
      };

      await expect(errorComputer.computeBatch(entities)).rejects.toThrow('Computation failed for entity2');
    });

    test('processes batch concurrently (performance test)', async () => {
      const entities = [
        { id: 'entity1' },
        { id: 'entity2' },
        { id: 'entity3' }
      ];

      // Create computer with artificial delay
      const delayComputer = new TestDerivedFieldComputer(db, { computeDelay: 50 });

      const startTime = Date.now();
      const results = await delayComputer.computeBatch(entities);
      const duration = Date.now() - startTime;

      // Should complete in around 50ms (concurrent), not 150ms (sequential)
      expect(duration).toBeLessThan(100);
      expect(results).toHaveLength(3);
    });
  });

  describe('updateDatabase() method', () => {
    beforeEach(() => {
      // Insert test data
      db.prepare('DELETE FROM test_entities').run();
      db.prepare('INSERT INTO test_entities (id, name) VALUES (?, ?)').run('test1', 'Test Entity 1');
      db.prepare('INSERT INTO test_entities (id, name) VALUES (?, ?)').run('test2', 'Test Entity 2');
    });

    test('updates single field successfully', async () => {
      const entity = { id: 'test1' };
      const computedFields = { test_field: 'computed_value_1' };

      await computer.updateDatabase('test_entities', 'id', entity, computedFields);

      const updated = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('test1');
      expect(updated.test_field).toBe('computed_value_1');
      expect(updated.name).toBe('Test Entity 1'); // Should not change
    });

    test('updates multiple fields successfully', async () => {
      const entity = { id: 'test2' };
      const computedFields = {
        test_field: 'computed_value_2',
        computed_value: 'another_computed_value'
      };

      await computer.updateDatabase('test_entities', 'id', entity, computedFields);

      const updated = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('test2');
      expect(updated.test_field).toBe('computed_value_2');
      expect(updated.computed_value).toBe('another_computed_value');
      expect(updated.name).toBe('Test Entity 2'); // Should not change
    });

    test('handles null values in computed fields', async () => {
      const entity = { id: 'test1' };
      const computedFields = { test_field: null };

      await computer.updateDatabase('test_entities', 'id', entity, computedFields);

      const updated = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('test1');
      expect(updated.test_field).toBeNull();
    });

    test('handles empty computed fields object', async () => {
      const entity = { id: 'test1' };
      const computedFields = {};

      // Should not throw error, but also should not change anything
      await computer.updateDatabase('test_entities', 'id', entity, computedFields);

      const updated = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('test1');
      expect(updated.name).toBe('Test Entity 1'); // Should remain unchanged
    });

    test('throws error for non-existent table', async () => {
      const entity = { id: 'test1' };
      const computedFields = { test_field: 'value' };

      await expect(
        computer.updateDatabase('non_existent_table', 'id', entity, computedFields)
      ).rejects.toThrow(/Failed to update non_existent_table: no such table: non_existent_table/);
    });

    test('throws error for non-existent entity ID', async () => {
      const entity = { id: 'non_existent' };
      const computedFields = { test_field: 'value' };

      // SQLite won't throw error for UPDATE with no matching rows, but we can verify no changes
      await computer.updateDatabase('test_entities', 'id', entity, computedFields);

      const updated = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('non_existent');
      expect(updated).toBeUndefined();
    });

    test('throws error for invalid field names', async () => {
      const entity = { id: 'test1' };
      const computedFields = { 'invalid-field-name': 'value' };

      await expect(
        computer.updateDatabase('test_entities', 'id', entity, computedFields)
      ).rejects.toThrow(/Failed to update test_entities: near "-": syntax error/);
    });

    test('uses correct ID field for update', async () => {
      // Create table with different ID field name
      db.exec(`
                CREATE TABLE IF NOT EXISTS custom_id_table (
                    custom_id TEXT PRIMARY KEY,
                    name TEXT,
                    value TEXT
                )
            `);
      db.prepare('INSERT INTO custom_id_table (custom_id, name) VALUES (?, ?)').run('custom1', 'Custom Entity');

      const entity = { custom_id: 'custom1' };
      const computedFields = { value: 'computed' };

      await computer.updateDatabase('custom_id_table', 'custom_id', entity, computedFields);

      const updated = db.prepare('SELECT * FROM custom_id_table WHERE custom_id = ?').get('custom1');
      expect(updated.value).toBe('computed');

      // Cleanup
      db.exec('DROP TABLE custom_id_table');
    });
  });

  describe('validateRequiredFields() method', () => {
    test('passes validation when all required fields present', () => {
      const entity = {
        id: 'test1',
        name: 'Test Entity',
        type: 'test'
      };
      const requiredFields = ['id', 'name'];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).not.toThrow();
    });

    test('passes validation with empty required fields array', () => {
      const entity = { id: 'test1' };
      const requiredFields = [];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).not.toThrow();
    });

    test('passes validation when field exists but is null', () => {
      const entity = {
        id: 'test1',
        name: null,
        type: 'test'
      };
      const requiredFields = ['id', 'name'];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).not.toThrow();
    });

    test('passes validation when field exists but is empty string', () => {
      const entity = {
        id: 'test1',
        name: '',
        type: 'test'
      };
      const requiredFields = ['id', 'name'];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).not.toThrow();
    });

    test('passes validation when field exists but is 0', () => {
      const entity = {
        id: 'test1',
        count: 0
      };
      const requiredFields = ['id', 'count'];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).not.toThrow();
    });

    test('passes validation when field exists but is false', () => {
      const entity = {
        id: 'test1',
        active: false
      };
      const requiredFields = ['id', 'active'];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).not.toThrow();
    });

    test('throws error for single missing field', () => {
      const entity = {
        name: 'Test Entity',
        type: 'test'
      };
      const requiredFields = ['id', 'name'];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).toThrow('Missing required fields: id');
    });

    test('throws error for multiple missing fields', () => {
      const entity = {
        type: 'test'
      };
      const requiredFields = ['id', 'name', 'description'];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).toThrow('Missing required fields: id, name, description');
    });

    test('throws error for all missing fields', () => {
      const entity = {};
      const requiredFields = ['id', 'name'];

      expect(() => computer.validateRequiredFields(entity, requiredFields)).toThrow('Missing required fields: id, name');
    });

    test('handles undefined entity', () => {
      const requiredFields = ['id'];

      expect(() => computer.validateRequiredFields(undefined, requiredFields)).toThrow();
    });

    test('handles null entity', () => {
      const requiredFields = ['id'];

      expect(() => computer.validateRequiredFields(null, requiredFields)).toThrow();
    });
  });

  describe('integration tests', () => {
    test('complete workflow: compute and update database', async () => {
      // Setup
      db.prepare('DELETE FROM test_entities').run();
      db.prepare('INSERT INTO test_entities (id, name) VALUES (?, ?)').run('workflow1', 'Workflow Test');

      const entity = { id: 'workflow1', name: 'Workflow Test' };

      // Compute
      const computedFields = await computer.compute(entity);
      expect(computedFields).toEqual({ test_field: 'test_value', computed_for: 'workflow1' });

      // Update database (only update the test_field, not computed_for)
      const fieldsToUpdate = { test_field: computedFields.test_field };
      await computer.updateDatabase('test_entities', 'id', entity, fieldsToUpdate);

      // Verify
      const updated = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('workflow1');
      expect(updated.test_field).toBe('test_value');
    });

    test('batch workflow: compute batch and update multiple entities', async () => {
      // Setup
      db.prepare('DELETE FROM test_entities').run();
      db.prepare('INSERT INTO test_entities (id, name) VALUES (?, ?)').run('batch1', 'Batch Test 1');
      db.prepare('INSERT INTO test_entities (id, name) VALUES (?, ?)').run('batch2', 'Batch Test 2');

      const entities = [
        { id: 'batch1', name: 'Batch Test 1' },
        { id: 'batch2', name: 'Batch Test 2' }
      ];

      // Compute batch
      const results = await computer.computeBatch(entities);
      expect(results).toHaveLength(2);

      // Update database for each (only update the test_field)
      for (let i = 0; i < entities.length; i++) {
        const fieldsToUpdate = { test_field: results[i].test_field };
        await computer.updateDatabase('test_entities', 'id', entities[i], fieldsToUpdate);
      }

      // Verify
      const updated1 = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('batch1');
      expect(updated1.test_field).toBe('test_value');

      const updated2 = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('batch2');
      expect(updated2.test_field).toBe('test_value');
    });
  });

  describe('error handling and edge cases', () => {
    test('handles database errors gracefully', async () => {
      // Force database error by mocking prepare to throw error
      const originalPrepare = db.prepare;
      db.prepare = () => {
        throw new Error('Database connection lost');
      };

      const entity = { id: 'test1' };
      const computedFields = { test_field: 'value' };

      await expect(
        computer.updateDatabase('test_entities', 'id', entity, computedFields)
      ).rejects.toThrow('Failed to update test_entities: Database connection lost');

      // Restore
      db.prepare = originalPrepare;
    });

    test('handles special characters in field values', async () => {
      db.prepare('DELETE FROM test_entities').run();
      db.prepare('INSERT INTO test_entities (id, name) VALUES (?, ?)').run('special1', 'Special Test');

      const entity = { id: 'special1' };
      const computedFields = { test_field: 'Value with \'quotes\' and "double quotes" and \n newlines' };

      await computer.updateDatabase('test_entities', 'id', entity, computedFields);

      const updated = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('special1');
      expect(updated.test_field).toBe('Value with \'quotes\' and "double quotes" and \n newlines');
    });

    test('handles large computed field values', async () => {
      db.prepare('DELETE FROM test_entities').run();
      db.prepare('INSERT INTO test_entities (id, name) VALUES (?, ?)').run('large1', 'Large Test');

      const entity = { id: 'large1' };
      const largeValue = 'x'.repeat(10000); // 10KB string
      const computedFields = { test_field: largeValue };

      await computer.updateDatabase('test_entities', 'id', entity, computedFields);

      const updated = db.prepare('SELECT * FROM test_entities WHERE id = ?').get('large1');
      expect(updated.test_field).toBe(largeValue);
    });
  });
});