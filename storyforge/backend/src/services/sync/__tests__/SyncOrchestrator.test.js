const SyncOrchestrator = require('../SyncOrchestrator');
const SyncLogger = require('../SyncLogger');
const { getDB } = require('../../../db/database');

// Mock dependencies
const mockEntitySyncers = [
  { sync: jest.fn().mockResolvedValue({ success: true }) },
  { sync: jest.fn().mockResolvedValue({ success: true }) }
];

const mockRelationshipSyncer = {
  sync: jest.fn().mockResolvedValue({ success: true })
};

const mockComputeServices = {
  computeAll: jest.fn().mockResolvedValue({ success: true })
};

const mockCacheManager = {
  clearAll: jest.fn().mockResolvedValue(true)
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('SyncOrchestrator', () => {
  let orchestrator;
  let mockExec;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create new orchestrator instance for each test
    orchestrator = new SyncOrchestrator({
      entitySyncers: mockEntitySyncers,
      relationshipSyncer: mockRelationshipSyncer,
      computeServices: mockComputeServices,
      cacheManager: mockCacheManager,
      logger: mockLogger
    });

    // Mock database transaction methods
    orchestrator.db = {
      exec: mockExec,
      prepare: jest.fn().mockReturnValue({ run: jest.fn() })
    };
  });

  describe('constructor', () => {
    it('should throw error if required dependencies are missing', () => {
      expect(() => new SyncOrchestrator({})).toThrow('entitySyncers array is required');
      expect(() => new SyncOrchestrator({ entitySyncers: [] })).toThrow('entitySyncers array is required');
      expect(() => new SyncOrchestrator({ entitySyncers: mockEntitySyncers })).toThrow('relationshipSyncer is required');
    });
  });

  describe('syncAll', () => {
    it('should execute all sync phases in order', async () => {
      const syncPromises = [];
      mockEntitySyncers[0].sync.mockImplementation(() => {
        syncPromises.push('entity1');
        return Promise.resolve({ success: true });
      });
      mockEntitySyncers[1].sync.mockImplementation(() => {
        syncPromises.push('entity2');
        return Promise.resolve({ success: true });
      });
      mockRelationshipSyncer.sync.mockImplementation(() => {
        syncPromises.push('relationships');
        return Promise.resolve({ success: true });
      });
      mockComputeServices.computeAll.mockImplementation(() => {
        syncPromises.push('compute');
        return Promise.resolve({ success: true });
      });
      mockCacheManager.clearAll.mockImplementation(() => {
        syncPromises.push('cache');
        return Promise.resolve({ success: true });
      });

      await orchestrator.syncAll();

      expect(syncPromises).toEqual(['entity1', 'entity2', 'relationships', 'compute', 'cache']);
    });

    it('should handle sync cancellation', async () => {
      mockEntitySyncers[0].sync.mockImplementation(() => {
        orchestrator.cancelSync();
        return Promise.reject(new Error('Sync cancelled'));
      });

      await expect(orchestrator.syncAll()).rejects.toThrow('Sync cancelled by user');
      expect(mockLogger.warn).toHaveBeenCalledWith('Sync cancelled during entities phase');
    });

    it('should rollback transaction on error', async () => {
      mockEntitySyncers[0].sync.mockRejectedValue(new Error('Sync failed'));

      await expect(orchestrator.syncAll()).rejects.toThrow('Sync failed');
      expect(mockExec).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('getStatus', () => {
    it('should return current sync status', async () => {
      expect(orchestrator.getStatus()).toEqual({
        isRunning: false,
        currentPhase: null,
        cancelled: false
      });

      const syncPromise = orchestrator.syncAll();
      expect(orchestrator.getStatus()).toEqual({
        isRunning: true,
        currentPhase: 'entities',
        cancelled: false
      });

      await syncPromise;
      expect(orchestrator.getStatus()).toEqual({
        isRunning: false,
        currentPhase: null,
        cancelled: false
      });
    });
  });

  describe('cancel', () => {
    it('should return false if no sync is running', () => {
      expect(orchestrator.cancel()).toBe(false);
    });

    it('should cancel running sync and return true', async () => {
      const syncPromise = orchestrator.syncAll();
      expect(orchestrator.cancel()).toBe(true);
      await expect(syncPromise).rejects.toThrow('Sync cancelled by user');
    });
  });
}); 