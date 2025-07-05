const BaseSyncer = require('../../../../src/services/sync/entitySyncers/BaseSyncer');
const { getDB } = require('../../../../src/db/database');

// Mock the database module
jest.mock('../../../../src/db/database');

// Create a concrete test implementation
class TestSyncer extends BaseSyncer {
  constructor(dependencies) {
    super({ ...dependencies, entityType: 'test' });
  }

  async fetchFromNotion() {
    return this.mockFetchFromNotion();
  }

  async mapFromNotion(data) {
    return data;
  }

  async insertIntoDatabase(data) {
    return data;
  }

  async clearExistingData() {
    return this.mockClearExistingData();
  }

  async mapData(notionItem) {
    return this.mockMapData(notionItem);
  }

  async insertData(mappedData) {
    return this.mockInsertData(mappedData);
  }

  async getCurrentRecordCount() {
    return this.mockGetCurrentRecordCount();
  }

  // Mock methods to be defined in tests
  mockFetchFromNotion = jest.fn();
  mockClearExistingData = jest.fn();
  mockMapData = jest.fn();
  mockInsertData = jest.fn();
  mockGetCurrentRecordCount = jest.fn().mockResolvedValue(0);
}

describe('BaseSyncer', () => {
  let mockDB;
  let mockLogger;
  let mockNotionService;
  let mockPropertyMapper;
  let testSyncer;

  beforeEach(() => {
    // Setup mock database
    mockDB = {
      exec: jest.fn(),
      inTransaction: false
    };
    getDB.mockReturnValue(mockDB);

    // Setup mock dependencies
    mockLogger = {
      startSync: jest.fn().mockReturnValue(456),
      completeSync: jest.fn(),
      failSync: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    mockNotionService = {};
    mockPropertyMapper = {};

    // Create test syncer instance
    testSyncer = new TestSyncer({
      notionService: mockNotionService,
      propertyMapper: mockPropertyMapper,
      logger: mockLogger
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should prevent direct instantiation of BaseSyncer', () => {
      expect(() => {
        new BaseSyncer({
          notionService: {},
          propertyMapper: {},
          logger: {}
        });
      }).toThrow('BaseSyncer is an abstract class and cannot be instantiated directly');
    });

    it('should require entityType to be defined', () => {
      class InvalidSyncer extends BaseSyncer {
        constructor(dependencies) {
          // Don't pass entityType to super
          super({ ...dependencies });
        }
      }

      expect(() => {
        new InvalidSyncer({
          notionService: {},
          propertyMapper: {},
          logger: {}
        });
      }).toThrow('entityType is required in BaseSyncer constructor');
    });

    it('should store dependencies correctly', () => {
      expect(testSyncer.notionService).toBe(mockNotionService);
      expect(testSyncer.propertyMapper).toBe(mockPropertyMapper);
      expect(testSyncer.logger).toBe(mockLogger);
      expect(testSyncer.entityType).toBe('test');
    });
  });

  describe('sync', () => {
    it('should execute full sync workflow successfully', async () => {
      const mockNotionData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];
      
      const mockMappedData = [
        { id: '1', mapped_name: 'Mapped Item 1' },
        { id: '2', mapped_name: 'Mapped Item 2' }
      ];

      testSyncer.mockFetchFromNotion.mockResolvedValue(mockNotionData);
      testSyncer.mockClearExistingData.mockResolvedValue();
      testSyncer.mockMapData
        .mockResolvedValueOnce(mockMappedData[0])
        .mockResolvedValueOnce(mockMappedData[1]);
      testSyncer.mockInsertData.mockResolvedValue();

      const result = await testSyncer.sync();

      // Verify workflow steps
      expect(mockLogger.startSync).toHaveBeenCalledWith('test');
      expect(testSyncer.mockFetchFromNotion).toHaveBeenCalled();
      expect(mockDB.exec).toHaveBeenCalledWith('BEGIN');
      expect(testSyncer.mockClearExistingData).toHaveBeenCalled();
      expect(testSyncer.mockMapData).toHaveBeenCalledTimes(2);
      expect(testSyncer.mockInsertData).toHaveBeenCalledTimes(2);
      expect(mockDB.exec).toHaveBeenCalledWith('COMMIT');
      expect(mockLogger.completeSync).toHaveBeenCalledWith(456, {
        fetched: 2,
        synced: 2,
        errors: 0
      });

      expect(result).toEqual({
        fetched: 2,
        synced: 2,
        errors: 0
      });
    });

    it('should handle empty data from Notion', async () => {
      testSyncer.mockFetchFromNotion.mockResolvedValue([]);

      const result = await testSyncer.sync();

      expect(mockLogger.warn).toHaveBeenCalledWith('No test found in Notion.');
      expect(mockDB.exec).not.toHaveBeenCalled(); // No transaction needed
      expect(result).toEqual({
        fetched: 0,
        synced: 0,
        errors: 0
      });
    });

    it('should handle mapping errors with continueOnError=true', async () => {
      const mockNotionData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
        { id: '3', name: 'Item 3' }
      ];

      testSyncer.mockFetchFromNotion.mockResolvedValue(mockNotionData);
      testSyncer.mockMapData
        .mockResolvedValueOnce({ id: '1', mapped_name: 'Item 1' })
        .mockResolvedValueOnce({ error: 'Mapping failed' })
        .mockResolvedValueOnce({ id: '3', mapped_name: 'Item 3' });
      testSyncer.mockInsertData.mockResolvedValue();

      const result = await testSyncer.sync({ continueOnError: true });

      expect(testSyncer.mockInsertData).toHaveBeenCalledTimes(2); // Only successful mappings
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing test 2',
        'Mapping failed'
      );
      expect(result).toEqual({
        fetched: 3,
        synced: 2,
        errors: 1
      });
    });

    it('should stop on error when continueOnError=false', async () => {
      const mockNotionData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];

      testSyncer.mockFetchFromNotion.mockResolvedValue(mockNotionData);
      testSyncer.mockMapData
        .mockResolvedValueOnce({ id: '1', mapped_name: 'Item 1' })
        .mockRejectedValueOnce(new Error('Critical mapping error'));
      testSyncer.mockInsertData.mockResolvedValue();

      mockDB.inTransaction = true; // Simulate active transaction

      await expect(testSyncer.sync({ continueOnError: false }))
        .rejects.toThrow('Critical mapping error');

      expect(mockDB.exec).toHaveBeenCalledWith('ROLLBACK');
      expect(mockLogger.failSync).toHaveBeenCalled();
    });

    it('should process data in batches', async () => {
      const mockNotionData = Array(25).fill(null).map((_, i) => ({ id: String(i) }));
      
      testSyncer.mockFetchFromNotion.mockResolvedValue(mockNotionData);
      testSyncer.mockMapData.mockResolvedValue({ mapped: true });
      testSyncer.mockInsertData.mockResolvedValue();

      await testSyncer.sync({ batchSize: 10 });

      // Should process in 3 batches (10, 10, 5)
      expect(testSyncer.mockMapData).toHaveBeenCalledTimes(25);
      expect(testSyncer.mockInsertData).toHaveBeenCalledTimes(25);
    });

    it('should call postProcess hook', async () => {
      testSyncer.postProcess = jest.fn();
      testSyncer.mockFetchFromNotion.mockResolvedValue([{ id: '1' }]);
      testSyncer.mockMapData.mockResolvedValue({ id: '1' });
      testSyncer.mockInsertData.mockResolvedValue();

      await testSyncer.sync();

      expect(testSyncer.postProcess).toHaveBeenCalled();
    });
  });

  describe('dryRun', () => {
    it('should preview changes without making them', async () => {
      const mockNotionData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' }
      ];

      testSyncer.mockFetchFromNotion.mockResolvedValue(mockNotionData);
      testSyncer.mockGetCurrentRecordCount.mockResolvedValue(3);
      testSyncer.mockMapData
        .mockResolvedValueOnce({ id: '1', mapped: true })
        .mockResolvedValueOnce({ error: 'Mapping error' });

      const result = await testSyncer.dryRun();

      expect(mockDB.exec).not.toHaveBeenCalled(); // No transaction
      expect(testSyncer.mockClearExistingData).not.toHaveBeenCalled();
      expect(testSyncer.mockInsertData).not.toHaveBeenCalled();
      
      expect(result).toEqual({
        fetched: 2,
        toDelete: 3,
        toAdd: 1,
        errors: 1,
        wouldSync: 1,
        wouldDelete: 3,
        wouldError: 1
      });
    });

    it('should handle dry run errors', async () => {
      testSyncer.mockFetchFromNotion.mockRejectedValue(new Error('Notion API error'));

      await expect(testSyncer.dryRun())
        .rejects.toThrow('Dry run failed: Notion API error');
    });
  });

  describe('abstract method enforcement', () => {
    class IncompleteSubclass extends BaseSyncer {
      constructor(services) {
        super({ ...services, entityType: 'incomplete' });
      }
      // Missing required method implementations
    }

    it('should throw error when fetchFromNotion not implemented', async () => {
      const incomplete = new IncompleteSubclass({
        notionService: {},
        propertyMapper: {},
        logger: mockLogger
      });

      await expect(incomplete.sync())
        .rejects.toThrow('IncompleteSubclass must implement fetchFromNotion()');
    });
  });
});