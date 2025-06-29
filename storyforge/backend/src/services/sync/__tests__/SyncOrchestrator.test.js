const SyncOrchestrator = require('../SyncOrchestrator');
const TestDbSetup = require('../../../../tests/utils/testDbSetup');

// Mock all the dependencies that SyncOrchestrator creates internally
jest.mock('../SyncLogger');
jest.mock('../entitySyncers/CharacterSyncer');
jest.mock('../entitySyncers/ElementSyncer');
jest.mock('../entitySyncers/PuzzleSyncer');
jest.mock('../entitySyncers/TimelineEventSyncer');
jest.mock('../RelationshipSyncer');
jest.mock('../../compute/ComputeOrchestrator');
jest.mock('../../notionService');
jest.mock('../../../utils/notionPropertyMapper');
jest.mock('../../../db/queries');

const SyncLogger = require('../SyncLogger');
const CharacterSyncer = require('../entitySyncers/CharacterSyncer');
const ElementSyncer = require('../entitySyncers/ElementSyncer');
const PuzzleSyncer = require('../entitySyncers/PuzzleSyncer');
const TimelineEventSyncer = require('../entitySyncers/TimelineEventSyncer');
const RelationshipSyncer = require('../RelationshipSyncer');
const ComputeOrchestrator = require('../../compute/ComputeOrchestrator');
const { invalidateJourneyCache, clearExpiredJourneyCache } = require('../../../db/queries');

describe('SyncOrchestrator', () => {
  let orchestrator;
  let testDb;
  let mockDb;

  beforeAll(async () => {
    testDb = new TestDbSetup();
    await testDb.initialize();
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create a mock database with the methods SyncOrchestrator uses
    mockDb = {
      prepare: jest.fn().mockReturnValue({
        run: jest.fn().mockReturnValue({ changes: 5 })
      })
    };

    // Setup mocks for all the dependencies
    SyncLogger.mockImplementation(() => ({
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn()
    }));

    const mockSync = jest.fn().mockResolvedValue({
      success: true,
      recordsProcessed: 10,
      errors: 0
    });

    CharacterSyncer.mockImplementation(() => ({ sync: mockSync }));
    ElementSyncer.mockImplementation(() => ({ sync: mockSync }));
    PuzzleSyncer.mockImplementation(() => ({ sync: mockSync }));
    TimelineEventSyncer.mockImplementation(() => ({ sync: mockSync }));
    RelationshipSyncer.mockImplementation(() => ({
      sync: jest.fn().mockResolvedValue({ success: true })
    }));
    ComputeOrchestrator.mockImplementation(() => ({
      computeAll: jest.fn().mockResolvedValue({ success: true })
    }));

    clearExpiredJourneyCache.mockReturnValue({ changes: 2 });

    // Create orchestrator with mock database
    orchestrator = new SyncOrchestrator(mockDb);
  });

  describe('constructor', () => {
    it('should throw error if database is not provided', () => {
      expect(() => new SyncOrchestrator()).toThrow('Database connection required');
      expect(() => new SyncOrchestrator(null)).toThrow('Database connection required');
    });

    it('should initialize all dependencies when given a database', () => {
      const orchestrator = new SyncOrchestrator(mockDb);
      expect(orchestrator.db).toBe(mockDb);
      expect(SyncLogger).toHaveBeenCalledWith(mockDb);
      expect(CharacterSyncer).toHaveBeenCalled();
      expect(ElementSyncer).toHaveBeenCalled();
      expect(PuzzleSyncer).toHaveBeenCalled();
      expect(TimelineEventSyncer).toHaveBeenCalled();
      expect(RelationshipSyncer).toHaveBeenCalled();
      expect(ComputeOrchestrator).toHaveBeenCalledWith(mockDb);
    });
  });

  describe('syncAll', () => {
    it('should execute all sync phases in order', async () => {
      const result = await orchestrator.syncAll();

      expect(result).toEqual({
        success: true,
        status: 'completed',
        totalDuration: expect.any(Number),
        phases: {
          entities: {
            characters: { success: true, recordsProcessed: 10, errors: 0 },
            elements: { success: true, recordsProcessed: 10, errors: 0 },
            timeline_events: { success: true, recordsProcessed: 10, errors: 0 },
            puzzles: { success: true, recordsProcessed: 10, errors: 0 },
            totalRecords: 40,
            totalErrors: 0,
            duration: expect.any(Number)
          },
          relationships: {
            success: true,
            duration: expect.any(Number)
          },
          compute: {
            success: true,
            duration: expect.any(Number)
          },
          cache: {
            cacheInvalidated: 5,
            expiredEntriesCleared: 2,
            duration: expect.any(Number)
          }
        },
        startTime: expect.any(String),
        endTime: expect.any(String)
      });

      // Verify all syncers were called
      expect(orchestrator.characterSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.elementSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.timelineEventSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.puzzleSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.relationshipSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.computeOrchestrator.computeAll).toHaveBeenCalled();
      expect(mockDb.prepare).toHaveBeenCalledWith('DELETE FROM cached_journey_graphs');
      expect(clearExpiredJourneyCache).toHaveBeenCalled();
    });

    it('should skip compute phase when skipCompute option is set', async () => {
      const result = await orchestrator.syncAll({ skipCompute: true });

      expect(result.phases.compute).toEqual({ skipped: true });
      expect(orchestrator.computeOrchestrator.computeAll).not.toHaveBeenCalled();
    });

    it('should skip cache phase when skipCache option is set', async () => {
      const result = await orchestrator.syncAll({ skipCache: true });

      expect(result.phases.cache).toEqual({ skipped: true });
      expect(mockDb.prepare).not.toHaveBeenCalledWith('DELETE FROM cached_journey_graphs');
      expect(clearExpiredJourneyCache).not.toHaveBeenCalled();
    });

    it('should handle errors and return failed status', async () => {
      orchestrator.characterSyncer.sync.mockRejectedValue(new Error('Sync failed'));

      const result = await orchestrator.syncAll();

      expect(result).toEqual({
        success: false,
        status: 'failed',
        error: 'Entity sync failed: Sync failed',
        totalDuration: expect.any(Number),
        phases: {},
        startTime: expect.any(String),
        endTime: expect.any(String)
      });
    });
  });

  describe('getStatus', () => {
    it('should return current sync status', () => {
      expect(orchestrator.getStatus()).toEqual({
        isRunning: false,
        progress: 0,
        startTime: null
      });
    });
  });

  describe('cancel', () => {
    it('should return false as cancellation is not implemented', () => {
      expect(orchestrator.cancel()).toBe(false);
    });
  });

  describe('individual sync methods', () => {
    it('should run syncEntitiesOnly', async () => {
      const result = await orchestrator.syncEntitiesOnly();

      expect(result).toHaveProperty('characters');
      expect(result).toHaveProperty('elements');
      expect(result).toHaveProperty('timeline_events');
      expect(result).toHaveProperty('puzzles');
      expect(result).toHaveProperty('totalRecords', 40);
      expect(result).toHaveProperty('totalErrors', 0);

      // Verify only entity syncers were called
      expect(orchestrator.characterSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.elementSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.timelineEventSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.puzzleSyncer.sync).toHaveBeenCalled();
      expect(orchestrator.relationshipSyncer.sync).not.toHaveBeenCalled();
      expect(orchestrator.computeOrchestrator.computeAll).not.toHaveBeenCalled();
    });

    it('should run computeOnly', async () => {
      const result = await orchestrator.computeOnly();

      expect(result).toEqual({ success: true });
      expect(orchestrator.computeOrchestrator.computeAll).toHaveBeenCalled();

      // Verify no syncers were called
      expect(orchestrator.characterSyncer.sync).not.toHaveBeenCalled();
      expect(orchestrator.relationshipSyncer.sync).not.toHaveBeenCalled();
    });

    it('should run syncRelationshipsOnly', async () => {
      const result = await orchestrator.syncRelationshipsOnly();

      expect(result).toEqual({ success: true });
      expect(orchestrator.relationshipSyncer.sync).toHaveBeenCalled();

      // Verify no other syncers were called
      expect(orchestrator.characterSyncer.sync).not.toHaveBeenCalled();
      expect(orchestrator.computeOrchestrator.computeAll).not.toHaveBeenCalled();
    });
  });
});