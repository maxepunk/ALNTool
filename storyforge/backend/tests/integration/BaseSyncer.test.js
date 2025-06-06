const BaseSyncer = require('../../src/services/sync/entitySyncers/BaseSyncer');
const TestDbSetup = require('../utils/testDbSetup');
const { mockNotionService } = require('../mocks/notionService');

// Create a concrete test class that extends BaseSyncer
class TestSyncer extends BaseSyncer {
  constructor() {
    super('test', mockNotionService);
  }

  async mapEntity(notionEntity) {
    return {
      id: notionEntity.id,
      name: notionEntity.name,
      type: notionEntity.type
    };
  }

  async validateEntity(mappedEntity) {
    return true;
  }

  async clearExistingData() {
    // No-op for testing
  }

  async processEntity(entity) {
    return entity;
  }
}

describe('BaseSyncer', () => {
  let dbSetup;
  let testSyncer;

  beforeAll(async () => {
    // Initialize test database with migrations
    dbSetup = new TestDbSetup();
    await dbSetup.initialize();
  });

  beforeEach(async () => {
    // Clear any existing data
    await dbSetup.clearData();
    
    // Reset mocks
    mockNotionService.fetchEntities.mockReset();
    mockNotionService.fetchEntityRelationships.mockReset();
    
    // Create new test syncer instance
    testSyncer = new TestSyncer();
  });

  afterAll(async () => {
    await dbSetup.close();
  });

  describe('sync', () => {
    it('should sync entities successfully', async () => {
      // Mock Notion data
      const notionEntities = [
        { id: 'test1', name: 'Test Entity 1', type: 'Test' },
        { id: 'test2', name: 'Test Entity 2', type: 'Test' }
      ];

      mockNotionService.fetchEntities.mockResolvedValue(notionEntities);

      // Perform sync
      const result = await testSyncer.sync();

      // Verify results
      expect(result.success).toBe(true);
      expect(result.synced).toBe(2);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify database state
      const db = dbSetup.getDb();
      const entities = db.prepare('SELECT * FROM test_entities').all();
      expect(entities).toHaveLength(2);
      expect(entities[0].id).toBe('test1');
      expect(entities[1].id).toBe('test2');
    });

    it('should handle validation failures', async () => {
      // Override validateEntity to fail for specific entity
      testSyncer.validateEntity = async (entity) => {
        return entity.id !== 'test2';
      };

      // Mock Notion data
      const notionEntities = [
        { id: 'test1', name: 'Test Entity 1', type: 'Test' },
        { id: 'test2', name: 'Test Entity 2', type: 'Test' }
      ];

      mockNotionService.fetchEntities.mockResolvedValue(notionEntities);

      // Perform sync
      const result = await testSyncer.sync();

      // Verify results
      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].entityId).toBe('test2');

      // Verify database state
      const db = dbSetup.getDb();
      const entities = db.prepare('SELECT * FROM test_entities').all();
      expect(entities).toHaveLength(1);
      expect(entities[0].id).toBe('test1');
    });

    it('should handle Notion API errors', async () => {
      // Mock Notion API error
      mockNotionService.fetchEntities.mockRejectedValue(new Error('Notion API error'));

      // Perform sync
      const result = await testSyncer.sync();

      // Verify results
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Notion API error');

      // Verify database state
      const db = dbSetup.getDb();
      const entities = db.prepare('SELECT * FROM test_entities').all();
      expect(entities).toHaveLength(0);
    });

    it('should handle database errors', async () => {
      // Mock Notion data
      const notionEntities = [
        { id: 'test1', name: 'Test Entity 1', type: 'Test' }
      ];

      mockNotionService.fetchEntities.mockResolvedValue(notionEntities);

      // Force database error by dropping table
      const db = dbSetup.getDb();
      db.prepare('DROP TABLE test_entities').run();

      // Perform sync
      const result = await testSyncer.sync();

      // Verify results
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('no such table');
    });
  });

  describe('syncRelationships', () => {
    it('should sync relationships successfully', async () => {
      // Insert test entities first
      const db = dbSetup.getDb();
      db.prepare('INSERT INTO test_entities (id, name, type) VALUES (?, ?, ?)').run('test1', 'Test Entity 1', 'Test');
      db.prepare('INSERT INTO test_entities (id, name, type) VALUES (?, ?, ?)').run('test2', 'Test Entity 2', 'Test');

      // Mock Notion relationships
      const notionRelationships = [
        { source_id: 'test1', target_id: 'test2', type: 'RELATED_TO' }
      ];

      mockNotionService.fetchEntityRelationships.mockResolvedValue(notionRelationships);

      // Perform relationship sync
      const result = await testSyncer.syncRelationships();

      // Verify results
      expect(result.success).toBe(true);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(0);

      // Verify database state
      const relationships = db.prepare('SELECT * FROM test_relationships').all();
      expect(relationships).toHaveLength(1);
      expect(relationships[0].source_id).toBe('test1');
      expect(relationships[0].target_id).toBe('test2');
    });

    it('should handle missing entities in relationships', async () => {
      // Mock Notion relationships with non-existent entity
      const notionRelationships = [
        { source_id: 'test1', target_id: 'nonexistent', type: 'RELATED_TO' }
      ];

      mockNotionService.fetchEntityRelationships.mockResolvedValue(notionRelationships);

      // Perform relationship sync
      const result = await testSyncer.syncRelationships();

      // Verify results
      expect(result.success).toBe(true);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('foreign key constraint failed');

      // Verify database state
      const db = dbSetup.getDb();
      const relationships = db.prepare('SELECT * FROM test_relationships').all();
      expect(relationships).toHaveLength(0);
    });

    it('should handle Notion API errors during relationship sync', async () => {
      // Mock Notion API error
      mockNotionService.fetchEntityRelationships.mockRejectedValue(new Error('Notion API error'));

      // Perform relationship sync
      const result = await testSyncer.syncRelationships();

      // Verify results
      expect(result.success).toBe(false);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('Notion API error');

      // Verify database state
      const db = dbSetup.getDb();
      const relationships = db.prepare('SELECT * FROM test_relationships').all();
      expect(relationships).toHaveLength(0);
    });
  });
}); 