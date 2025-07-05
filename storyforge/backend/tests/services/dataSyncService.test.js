const { initializeDatabase, getDB } = require('../../src/db/database');
const path = require('path');

// Mock dependencies before requiring dataSyncService
jest.mock('../../src/services/notionService');
jest.mock('../../src/services/sync/SyncOrchestrator');
jest.mock('../../src/services/compute/ComputeOrchestrator');
jest.mock('../../src/services/sync/SyncLogger');

// Get mocked dependencies
const SyncOrchestrator = require('../../src/services/sync/SyncOrchestrator');
const ComputeOrchestrator = require('../../src/services/compute/ComputeOrchestrator');
const SyncLogger = require('../../src/services/sync/SyncLogger');

describe('DataSyncService', () => {
  let dataSyncService;
  let mockDb;
  let mockSyncOrchestrator;
  let mockComputeOrchestrator;
  
  beforeAll(async () => {
    // Initialize test database
    const testDbPath = path.join(__dirname, '..', 'utils', 'test.db');
    await initializeDatabase(testDbPath);
    mockDb = getDB();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset module cache to get fresh instance
    jest.resetModules();
    
    // Mock SyncLogger
    SyncLogger.mockImplementation(() => ({
      startSync: jest.fn().mockReturnValue('sync-1'),
      completeSync: jest.fn(),
      failSync: jest.fn(),
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }));
    
    // Mock SyncOrchestrator
    mockSyncOrchestrator = {
      syncAll: jest.fn().mockResolvedValue({
        stats: {
          characters: { synced: 5, errors: 0 },
          elements: { synced: 10, errors: 0 },
          puzzles: { synced: 3, errors: 0 },
          timeline_events: { synced: 8, errors: 0 }
        }
      })
    };
    SyncOrchestrator.mockImplementation(() => mockSyncOrchestrator);
    
    // Mock ComputeOrchestrator
    mockComputeOrchestrator = {
      computeAll: jest.fn().mockResolvedValue({
        act_focus: 42,
        memory_values: 35,
        narrative_threads: 22,
        resolution_paths: 18
      })
    };
    ComputeOrchestrator.mockImplementation(() => mockComputeOrchestrator);
    
    // Now require the service after mocks are set up
    dataSyncService = require('../../src/services/dataSyncService');
  });

  describe('syncFromNotion', () => {
    it('should perform full sync successfully', async () => {
      const result = await dataSyncService.syncFromNotion();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('stats');
      expect(result.stats).toHaveProperty('characters');
      expect(result.stats).toHaveProperty('elements');
    });

    it('should handle sync errors gracefully', async () => {
      // Update the mock to throw error
      mockSyncOrchestrator.syncAll.mockRejectedValue(new Error('Sync failed'));
      
      await expect(dataSyncService.syncFromNotion()).rejects.toThrow('Sync failed');
    });
  });

  describe('syncEntityType', () => {
    it('should sync specific entity type', async () => {
      const result = await dataSyncService.syncEntityType('characters');
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('synced');
      expect(result).toHaveProperty('errors');
    });

    it('should reject invalid entity types', async () => {
      await expect(dataSyncService.syncEntityType('invalid')).rejects.toThrow();
    });
  });

  describe('updateComputedFields', () => {
    it('should update all computed fields', async () => {
      const result = await dataSyncService.updateComputedFields();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('updated');
      expect(result.updated).toHaveProperty('act_focus', 42);
      expect(result.updated).toHaveProperty('memory_values', 35);
    });

    it('should handle compute errors', async () => {
      // Update the mock to throw error
      mockComputeOrchestrator.computeAll.mockRejectedValue(new Error('Compute failed'));
      
      await expect(dataSyncService.updateComputedFields()).rejects.toThrow('Compute failed');
    });
  });

  describe('clearCache', () => {
    it('should clear cache successfully', async () => {
      // Insert test data into cache
      const stmt = mockDb.prepare('INSERT INTO cached_journey_graphs (character_id, cache_key, graph_data) VALUES (?, ?, ?)');
      stmt.run('char1', 'test-key', JSON.stringify({ test: 'data' }));
      
      const result = await dataSyncService.clearCache();
      
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('cleared');
      expect(result.cleared).toHaveProperty('journey_graphs');
      
      // Verify cache was cleared
      const count = mockDb.prepare('SELECT COUNT(*) as count FROM cached_journey_graphs').get();
      expect(count.count).toBe(0);
    });
  });

  describe('getSyncStatus', () => {
    it('should return current sync status', async () => {
      const status = await dataSyncService.getSyncStatus();
      
      expect(status).toHaveProperty('status');
      expect(status).toHaveProperty('database_status');
      expect(status).toHaveProperty('entity_counts');
      expect(status.entity_counts).toHaveProperty('characters');
      expect(status.entity_counts).toHaveProperty('elements');
      expect(status.entity_counts).toHaveProperty('puzzles');
      expect(status.entity_counts).toHaveProperty('timeline_events');
    });
  });

  describe('getSyncHistory', () => {
    it('should return sync history', async () => {
      // Insert test sync log
      const stmt = mockDb.prepare(`
        INSERT INTO sync_log (timestamp, entity_type, status, records_synced, errors, duration_ms, details)
        VALUES (datetime('now'), ?, ?, ?, ?, ?, ?)
      `);
      stmt.run('characters', 'completed', 5, 0, 1000, '{}');
      
      const history = await dataSyncService.getSyncHistory(10);
      
      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty('entity_type', 'characters');
      expect(history[0]).toHaveProperty('status', 'completed');
    });

    it('should respect limit parameter', async () => {
      // Insert multiple sync logs
      const stmt = mockDb.prepare(`
        INSERT INTO sync_log (timestamp, entity_type, status, records_synced, errors, duration_ms, details)
        VALUES (datetime('now', ? || ' seconds'), ?, ?, ?, ?, ?, ?)
      `);
      
      for (let i = 0; i < 10; i++) {
        stmt.run(-i, 'test', 'completed', 1, 0, 100, '{}');
      }
      
      const history = await dataSyncService.getSyncHistory(5);
      expect(history.length).toBe(5);
    });
  });
});