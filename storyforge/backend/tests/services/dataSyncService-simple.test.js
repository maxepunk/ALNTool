const { initializeDatabase, getDB } = require('../../src/db/database');
const path = require('path');

describe('DataSyncService Simple Tests', () => {
  let dataSyncService;
  let mockDb;
  
  beforeAll(async () => {
    // Initialize test database
    const testDbPath = path.join(__dirname, '..', 'utils', 'test-simple.db');
    await initializeDatabase(testDbPath);
    mockDb = getDB();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Core Methods', () => {
    it('should have all required methods', () => {
      dataSyncService = require('../../src/services/dataSyncService');
      
      expect(typeof dataSyncService.syncFromNotion).toBe('function');
      expect(typeof dataSyncService.syncEntityType).toBe('function');
      expect(typeof dataSyncService.updateComputedFields).toBe('function');
      expect(typeof dataSyncService.clearCache).toBe('function');
      expect(typeof dataSyncService.getSyncStatus).toBe('function');
      expect(typeof dataSyncService.getSyncHistory).toBe('function');
    });

    it('should get sync status', async () => {
      dataSyncService = require('../../src/services/dataSyncService');
      
      const status = await dataSyncService.getSyncStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('database_status');
      expect(status).toHaveProperty('entity_counts');
      expect(status.entity_counts).toHaveProperty('characters');
      expect(status.entity_counts).toHaveProperty('elements');
      expect(status.entity_counts).toHaveProperty('puzzles');
      expect(status.entity_counts).toHaveProperty('timeline_events');
    });

    it('should get sync history', async () => {
      dataSyncService = require('../../src/services/dataSyncService');
      
      // Insert test sync log
      const stmt = mockDb.prepare(`
        INSERT INTO sync_log (timestamp, entity_type, status, records_synced, errors, duration_ms, details)
        VALUES (datetime('now'), ?, ?, ?, ?, ?, ?)
      `);
      stmt.run('test', 'completed', 5, 0, 1000, '{}');
      
      const history = await dataSyncService.getSyncHistory(10);
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
    });

    it('should clear cache', async () => {
      dataSyncService = require('../../src/services/dataSyncService');
      
      // Insert test data into cache
      const stmt = mockDb.prepare('INSERT INTO cached_journey_graphs (character_id, cache_key, graph_data) VALUES (?, ?, ?)');
      stmt.run('char1', 'test-key', JSON.stringify({ test: 'data' }));
      
      const result = await dataSyncService.clearCache();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('cleared');
      
      // Verify cache was cleared
      const count = mockDb.prepare('SELECT COUNT(*) as count FROM cached_journey_graphs').get();
      expect(count.count).toBe(0);
    });

    it('should validate entity types', async () => {
      dataSyncService = require('../../src/services/dataSyncService');
      
      // Test invalid entity type
      await expect(dataSyncService.syncEntityType('invalid_type')).rejects.toThrow();
    });
  });
});