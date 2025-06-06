const SyncLogger = require('../../../src/services/sync/SyncLogger');
const { getDB } = require('../../../src/db/database');

// Mock the database module
jest.mock('../../../src/db/database');

describe('SyncLogger', () => {
  let syncLogger;
  let mockDB;
  let mockPrepare;
  let mockRun;
  let mockGet;
  let mockAll;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup mock database
    mockRun = jest.fn().mockReturnValue({ lastInsertRowid: 123 });
    mockGet = jest.fn();
    mockAll = jest.fn();
    mockPrepare = jest.fn().mockReturnValue({ 
      run: mockRun,
      get: mockGet,
      all: mockAll
    });
    
    mockDB = {
      prepare: mockPrepare
    };
    
    getDB.mockReturnValue(mockDB);
    
    // Create new instance for each test
    syncLogger = new SyncLogger();
    
    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.warn.mockRestore();
    console.error.mockRestore();
  });

  describe('startSync', () => {
    it('should insert a new sync log entry and return the log ID', () => {
      const entityType = 'characters';
      const logId = syncLogger.startSync(entityType);

      expect(mockPrepare).toHaveBeenCalledWith(
        'INSERT INTO sync_log (start_time, status, entity_type) VALUES (?, ?, ?)'
      );
      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String), // timestamp
        'started',
        entityType
      );
      expect(logId).toBe(123);
      expect(console.log).toHaveBeenCalledWith('🔄 Starting sync for characters...');
    });
  });

  describe('completeSync', () => {
    it('should update sync log with success status and stats', () => {
      const logId = 123;
      const stats = { fetched: 10, synced: 9, errors: 1 };
      
      mockGet.mockReturnValue({ entity_type: 'characters' });
      
      syncLogger.completeSync(logId, stats);

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE sync_log'));
      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String), // end_time
        10, // fetched
        9,  // synced
        1,  // errors
        123 // logId
      );
      expect(console.log).toHaveBeenCalledWith('✅ characters: 9/10 synced successfully (1 errors)');
    });

    it('should handle zero errors gracefully', () => {
      const logId = 123;
      const stats = { fetched: 5, synced: 5, errors: 0 };
      
      mockGet.mockReturnValue({ entity_type: 'elements' });
      
      syncLogger.completeSync(logId, stats);

      expect(console.log).toHaveBeenCalledWith('✅ elements: 5/5 synced successfully');
    });

    it('should use default stats if none provided', () => {
      const logId = 123;
      
      mockGet.mockReturnValue({ entity_type: 'puzzles' });
      
      syncLogger.completeSync(logId);

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        0, // default fetched
        0, // default synced
        0, // default errors
        123
      );
    });
  });

  describe('failSync', () => {
    it('should update sync log with failed status and error details', () => {
      const logId = 123;
      const error = new Error('Connection failed');
      const stats = { fetched: 5, synced: 2 };
      
      mockGet.mockReturnValue({ entity_type: 'timeline_events' });
      
      syncLogger.failSync(logId, error, stats);

      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE sync_log'));
      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String), // end_time
        'Connection failed', // error message
        5, // fetched
        2, // synced
        123 // logId
      );
      expect(console.error).toHaveBeenCalledWith('❌ timeline_events sync failed:', 'Connection failed');
    });

    it('should handle non-Error objects', () => {
      const logId = 123;
      const error = 'String error';
      
      mockGet.mockReturnValue({ entity_type: 'characters' });
      
      syncLogger.failSync(logId, error);

      expect(mockRun).toHaveBeenCalledWith(
        expect.any(String),
        'String error',
        0,
        0,
        123
      );
    });
  });

  describe('logging methods', () => {
    it('should log warning messages', () => {
      syncLogger.warn('Test warning', { detail: 'test' });
      
      expect(console.warn).toHaveBeenCalledWith('⚠️  Test warning', { detail: 'test' });
    });

    it('should log error messages with Error objects', () => {
      const error = new Error('Test error');
      syncLogger.error('Operation failed', error);
      
      expect(console.error).toHaveBeenCalledWith('❌ Operation failed:', 'Test error');
    });

    it('should log error messages with non-Error objects', () => {
      syncLogger.error('Operation failed', 'String error');
      
      expect(console.error).toHaveBeenCalledWith('❌ Operation failed', 'String error');
    });

    it('should log info messages', () => {
      syncLogger.info('Test info');
      
      expect(console.log).toHaveBeenCalledWith('📝 Test info');
    });
  });

  describe('getRecentSyncHistory', () => {
    it('should retrieve recent sync history', () => {
      const mockHistory = [
        { id: 1, entity_type: 'characters', status: 'completed' },
        { id: 2, entity_type: 'elements', status: 'failed' }
      ];
      
      mockAll.mockReturnValue(mockHistory);
      
      const history = syncLogger.getRecentSyncHistory(5);
      
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM sync_log'));
      expect(mockAll).toHaveBeenCalledWith(5);
      expect(history).toEqual(mockHistory);
    });

    it('should use default limit of 10', () => {
      syncLogger.getRecentSyncHistory();
      
      expect(mockAll).toHaveBeenCalledWith(10);
    });
  });

  describe('getSyncStats', () => {
    it('should retrieve sync statistics for entity type', () => {
      const mockStats = {
        total_syncs: 10,
        successful_syncs: 8,
        failed_syncs: 2,
        avg_records_synced: 45.5,
        last_sync_time: '2025-06-09T10:00:00Z'
      };
      
      mockGet.mockReturnValue(mockStats);
      
      const stats = syncLogger.getSyncStats('characters');
      
      expect(mockPrepare).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
      expect(mockGet).toHaveBeenCalledWith('characters');
      expect(stats).toEqual(mockStats);
    });
  });
});