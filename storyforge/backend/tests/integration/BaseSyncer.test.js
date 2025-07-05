const BaseSyncer = require('../../src/services/sync/entitySyncers/BaseSyncer');
const TestDbSetup = require('../utils/testDbSetup');
const SyncLogger = require('../../src/services/sync/SyncLogger');

// Create a concrete test class that extends BaseSyncer
class TestSyncer extends BaseSyncer {
  constructor(dependencies) {
    super({ ...dependencies, entityType: 'test' });
  }

  async fetchFromNotion() {
    // Override in tests
    return [];
  }

  async clearExistingData() {
    // Clear test table
    const db = this.initDB();
    
    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS test_entities (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT
      )
    `);
    
    db.prepare('DELETE FROM test_entities').run();
  }

  async mapData(notionItem) {
    return {
      id: notionItem.id,
      name: notionItem.properties?.name?.title?.[0]?.text?.content || notionItem.name,
      type: notionItem.properties?.type?.select?.name || notionItem.type
    };
  }

  async insertData(mappedData) {
    const db = this.initDB();
    
    // Insert data
    const stmt = db.prepare('INSERT INTO test_entities (id, name, type) VALUES (?, ?, ?)');
    stmt.run(mappedData.id, mappedData.name, mappedData.type);
  }

  async getCurrentRecordCount() {
    const db = this.initDB();
    
    // Create table if it doesn't exist
    db.exec(`
      CREATE TABLE IF NOT EXISTS test_entities (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT
      )
    `);
    
    const result = db.prepare('SELECT COUNT(*) as count FROM test_entities').get();
    return result.count;
  }
}

describe('BaseSyncer Integration', () => {
  let dbSetup;
  let testSyncer;
  let mockNotionService;
  let logger;

  beforeAll(async () => {
    // Initialize test database with migrations
    dbSetup = new TestDbSetup();
    await dbSetup.initialize();
  });

  beforeEach(async () => {
    // Clear any existing data
    await dbSetup.clearData();
    
    // Create mock Notion service
    mockNotionService = {
      getDatabaseId: jest.fn().mockReturnValue('test-db-id'),
      queryDatabase: jest.fn()
    };
    
    // Create logger
    logger = new SyncLogger(dbSetup.getDb());
    
    // Create new test syncer instance
    testSyncer = new TestSyncer({
      notionService: mockNotionService,
      propertyMapper: {},
      logger
    });
  });

  afterAll(async () => {
    await dbSetup.close();
  });

  describe('sync', () => {
    it('should sync entities successfully', async () => {
      // Mock Notion data
      const notionData = [
        { 
          id: 'test1', 
          properties: {
            name: { title: [{ text: { content: 'Test Entity 1' } }] },
            type: { select: { name: 'Test' } }
          }
        },
        { 
          id: 'test2',
          properties: {
            name: { title: [{ text: { content: 'Test Entity 2' } }] },
            type: { select: { name: 'Test' } }
          }
        }
      ];

      // Override fetchFromNotion
      testSyncer.fetchFromNotion = jest.fn().mockResolvedValue(notionData);

      // Perform sync
      const result = await testSyncer.sync();

      // Verify results
      expect(result.fetched).toBe(2);
      expect(result.synced).toBe(2);
      expect(result.errors).toBe(0);

      // Verify database state
      const count = await testSyncer.getCurrentRecordCount();
      expect(count).toBe(2);
    });

    it('should handle mapping errors with continueOnError=true', async () => {
      // Mock Notion data with one bad entity
      const notionData = [
        { 
          id: 'test1', 
          properties: {
            name: { title: [{ text: { content: 'Test Entity 1' } }] },
            type: { select: { name: 'Test' } }
          }
        },
        { 
          id: 'test2',
          // Missing properties - will cause mapping error
        }
      ];

      // Override fetchFromNotion
      testSyncer.fetchFromNotion = jest.fn().mockResolvedValue(notionData);
      
      // Override mapData to throw on bad data
      const originalMapData = testSyncer.mapData.bind(testSyncer);
      testSyncer.mapData = jest.fn().mockImplementation(async (item) => {
        if (!item.properties) {
          throw new Error('Missing properties');
        }
        return originalMapData(item);
      });

      // Perform sync with continueOnError
      const result = await testSyncer.sync({ continueOnError: true });

      // Verify results
      expect(result.fetched).toBe(2);
      expect(result.synced).toBe(1);
      expect(result.errors).toBe(1);

      // Verify database state - only good entity should be saved
      const count = await testSyncer.getCurrentRecordCount();
      expect(count).toBe(1);
    });

    it('should handle dry run without modifying database', async () => {
      // Clear any existing data first
      await testSyncer.clearExistingData();
      
      // Mock Notion data
      const notionData = [
        { 
          id: 'test1', 
          properties: {
            name: { title: [{ text: { content: 'Test Entity 1' } }] },
            type: { select: { name: 'Test' } }
          }
        }
      ];

      // Override fetchFromNotion
      testSyncer.fetchFromNotion = jest.fn().mockResolvedValue(notionData);

      // Perform dry run
      const result = await testSyncer.dryRun();

      // Verify results
      expect(result.fetched).toBe(1);
      expect(result.wouldSync).toBe(1);
      expect(result.wouldDelete).toBe(0);
      expect(result.wouldError).toBe(0);

      // Verify database was not modified
      const count = await testSyncer.getCurrentRecordCount();
      expect(count).toBe(0);
    });
  });
});