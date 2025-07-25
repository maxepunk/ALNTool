const ElementSyncer = require('../ElementSyncer');
const { getDB } = require('../../../../db/database');

// Mock the database module
jest.mock('../../../../db/database');

describe('ElementSyncer Integration Tests', () => {
  let syncer;
  let mockDB;
  let mockNotionService;
  let mockPropertyMapper;
  let mockLogger;
  let mockStmts;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock database
    mockDB = {
      prepare: jest.fn(),
      exec: jest.fn(),
      inTransaction: false
    };

    mockStmts = {
      insertElem: { run: jest.fn() },
      insertCharOwned: { run: jest.fn() },
      insertCharAssoc: { run: jest.fn() },
      insertPuzzleElem: { run: jest.fn() },
      deleteCharOwned: { run: jest.fn() },
      deleteCharAssoc: { run: jest.fn() },
      deletePuzzleElem: { run: jest.fn() },
      deleteElem: { run: jest.fn() }
    };

    // Mock all expected SQL statements
    mockDB.prepare.mockImplementation((sql) => {
      if (sql.includes('DELETE FROM character_owned_elements')) {
        return mockStmts.deleteCharOwned;
      }
      if (sql.includes('DELETE FROM character_associated_elements')) {
        return mockStmts.deleteCharAssoc;
      }
      if (sql.includes('DELETE FROM puzzle_elements')) {
        return mockStmts.deletePuzzleElem;
      }
      if (sql.includes('DELETE FROM elements')) {
        return mockStmts.deleteElem;
      }
      if (sql.includes('INSERT OR REPLACE INTO elements')) {
        return mockStmts.insertElem;
      }
      if (sql.includes('INSERT OR IGNORE INTO character_owned_elements')) {
        return mockStmts.insertCharOwned;
      }
      if (sql.includes('INSERT OR IGNORE INTO character_associated_elements')) {
        return mockStmts.insertCharAssoc;
      }
      if (sql.includes('INSERT OR IGNORE INTO puzzle_elements')) {
        return mockStmts.insertPuzzleElem;
      }
      if (sql.includes('BEGIN') || sql.includes('COMMIT') || sql.includes('ROLLBACK')) {
        return { run: jest.fn() };
      }
      return { run: jest.fn() };
    });

    // Create mock services
    mockNotionService = {
      getElements: jest.fn()
    };

    mockPropertyMapper = {
      mapElementWithNames: jest.fn()
    };

    mockLogger = {
      startSync: jest.fn().mockReturnValue(1),
      completeSync: jest.fn(),
      failSync: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Mock getDB to return our mock database
    getDB.mockReturnValue(mockDB);

    // Create syncer instance
    syncer = new ElementSyncer({
      notionService: mockNotionService,
      propertyMapper: mockPropertyMapper,
      logger: mockLogger,
      db: mockDB
    });
  });

  describe('sync()', () => {
    it('should successfully sync elements with relationships', async () => {
      // Setup mock data
      const mockNotionElements = [
        { id: 'elem1', properties: { Name: { title: [{ plain_text: 'Key Card' }] } } },
        { id: 'elem2', properties: { Name: { title: [{ plain_text: 'Evidence File' }] } } }
      ];

      const mockMappedElements = [
        {
          id: 'elem1',
          name: 'Key Card',
          basicType: 'Prop',
          description: 'Access card for secure areas',
          status: 'Ready',
          owner: [{ id: 'char1', name: 'Sarah' }],
          container: null,
          productionNotes: 'Print on RFID card',
          firstAvailable: 'Act 1',
          timelineEvent: [{ id: 'event1', name: 'Theft' }]
        },
        {
          id: 'elem2',
          name: 'Evidence File',
          basicType: 'Document',
          description: 'Contains crucial information',
          status: 'To Build',
          owner: null,
          container: [{ id: 'elem1', name: 'Key Card' }],
          productionNotes: '',
          firstAvailable: 'Act 2',
          timelineEvent: null
        }
      ];

      // Mock Notion service responses
      mockNotionService.getElements.mockResolvedValue(mockNotionElements);
      mockPropertyMapper.mapElementWithNames
        .mockResolvedValueOnce(mockMappedElements[0])
        .mockResolvedValueOnce(mockMappedElements[1]);

      // Mock database statements
      const mockStmts = {
        updatePuzzles: { run: jest.fn() },
        deleteCharOwned: { run: jest.fn() },
        deleteCharAssoc: { run: jest.fn() },
        deleteElements: { run: jest.fn() },
        insertElement: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('UPDATE puzzles SET locked_item_id = NULL')) {
          return mockStmts.updatePuzzles;
        }
        if (sql.includes('DELETE FROM interactions')) {
          return mockStmts.deleteInteractions;
        }
        if (sql.includes('DELETE FROM character_owned_elements')) {
          return mockStmts.deleteCharOwned;
        }
        if (sql.includes('DELETE FROM character_associated_elements')) {
          return mockStmts.deleteCharAssoc;
        }
        if (sql.includes('DELETE FROM elements')) {
          return mockStmts.deleteElements;
        }
        if (sql.includes('INSERT INTO elements')) {
          return mockStmts.insertElement;
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      });

      // Execute sync
      const result = await syncer.sync();

      // Verify results
      expect(result).toEqual({
        fetched: 2,
        synced: 2,
        errors: 0
      });

      // Verify transaction management
      expect(mockDB.exec).toHaveBeenCalledWith('BEGIN');
      expect(mockDB.exec).toHaveBeenCalledWith('COMMIT');

      // Verify data clearing
      expect(mockStmts.updatePuzzles.run).toHaveBeenCalled();
      expect(mockStmts.deleteCharOwned.run).toHaveBeenCalled();
      expect(mockStmts.deleteCharAssoc.run).toHaveBeenCalled();
      expect(mockStmts.deleteElements.run).toHaveBeenCalled();

      // Verify element insertion
      expect(mockStmts.insertElement.run).toHaveBeenCalledTimes(2);
      expect(mockStmts.insertElement.run).toHaveBeenCalledWith(
        'elem1', 'Key Card', 'Prop', 'Access card for secure areas', 'Ready',
        'char1', null, 'Print on RFID card', 'Act 1', 'event1',
        null, null, null, null, 1, null  // Memory value fields
      );
      expect(mockStmts.insertElement.run).toHaveBeenCalledWith(
        'elem2', 'Evidence File', 'Document', 'Contains crucial information', 'To Build',
        null, 'elem1', '', 'Act 2', null,
        null, null, null, null, 1, null  // Memory value fields
      );

      // Verify logging
      expect(mockLogger.startSync).toHaveBeenCalledWith('elements');
      expect(mockLogger.completeSync).toHaveBeenCalledWith(1, result);
    });

    it('should handle empty element list', async () => {
      mockNotionService.getElements.mockResolvedValue([]);

      const result = await syncer.sync();

      expect(result).toEqual({
        fetched: 0,
        synced: 0,
        errors: 0
      });
      expect(mockLogger.warn).toHaveBeenCalledWith('No elements found in Notion.');
      expect(mockDB.exec).not.toHaveBeenCalled(); // No transaction needed
    });

    it('should handle mapping errors and continue by default', async () => {
      const mockNotionElements = [
        { id: 'elem1', properties: {} },
        { id: 'elem2', properties: {} },
        { id: 'elem3', properties: {} }
      ];

      mockNotionService.getElements.mockResolvedValue(mockNotionElements);
      mockPropertyMapper.mapElementWithNames
        .mockResolvedValueOnce({ id: 'elem1', name: 'Knife', type: 'Item' })
        .mockResolvedValueOnce({ error: 'Mapping failed' })
        .mockResolvedValueOnce({ id: 'elem3', name: 'Gun', type: 'Item' });

      // Mock database statements
      const mockStmts = {
        updatePuzzles: { run: jest.fn() },
        deleteInteractions: { run: jest.fn() },
        deleteCharOwnedElems: { run: jest.fn() },
        deleteCharAssocElems: { run: jest.fn() },
        deleteElements: { run: jest.fn() },
        insertElement: { run: jest.fn() },
        insertCharOwned: { run: jest.fn() },
        insertCharAssoc: { run: jest.fn() },
        insertPuzzleElem: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('UPDATE puzzles SET locked_item_id = NULL')) {
          return mockStmts.updatePuzzles;
        }
        if (sql.includes('DELETE FROM character_owned_elements')) {
          return mockStmts.deleteCharOwnedElems;
        }
        if (sql.includes('DELETE FROM character_associated_elements')) {
          return mockStmts.deleteCharAssocElems;
        }
        if (sql.includes('DELETE FROM elements')) {
          return mockStmts.deleteElements;
        }
        if (sql.includes('INSERT INTO elements')) {
          return mockStmts.insertElement;
        }
        if (sql.includes('INSERT OR IGNORE INTO character_owned_elements')) {
          return mockStmts.insertCharOwned;
        }
        if (sql.includes('INSERT OR IGNORE INTO character_associated_elements')) {
          return mockStmts.insertCharAssoc;
        }
        if (sql.includes('INSERT OR IGNORE INTO puzzle_elements')) {
          return mockStmts.insertPuzzleElem;
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      });

      const result = await syncer.sync();

      expect(result).toEqual({
        fetched: 3,
        synced: 2,
        errors: 1
      });
      expect(mockStmts.insertElement.run).toHaveBeenCalledTimes(2); // Only successful mappings
      expect(mockStmts.insertElement.run).toHaveBeenCalledWith('elem1', 'Knife', '', '', '', null, null, '', '', null, null, null, null, null, 1, null);
      expect(mockStmts.insertElement.run).toHaveBeenCalledWith('elem3', 'Gun', '', '', '', null, null, '', '', null, null, null, null, null, 1, null);
    });

    it('should handle null relationships gracefully', async () => {
      const mockNotionElements = [{ id: 'elem1' }];
      const mockMappedElement = {
        id: 'elem1',
        name: 'Standalone Element',
        basicType: 'Prop',
        owner: null,
        container: null,
        timelineEvent: null
      };

      mockNotionService.getElements.mockResolvedValue(mockNotionElements);
      mockPropertyMapper.mapElementWithNames.mockResolvedValue(mockMappedElement);

      const mockInsertStmt = { run: jest.fn() };
      mockDB.prepare.mockReturnValue(mockInsertStmt);

      const result = await syncer.sync();

      expect(result.synced).toBe(1);
      expect(mockInsertStmt.run).toHaveBeenCalledWith(
        'elem1', 'Standalone Element', 'Prop', '', '',
        null, null, '', '', null,
        null, null, null, null, 1, null  // Memory value fields
      );
    });

    it('should rollback on error when continueOnError is false', async () => {
      const mockNotionElements = [
        { id: 'elem1', properties: {} },
        { id: 'elem2', properties: {} }
      ];

      mockNotionService.getElements.mockResolvedValue(mockNotionElements);
      mockPropertyMapper.mapElementWithNames
        .mockResolvedValueOnce({ id: 'elem1', name: 'Knife', type: 'Item' })
        .mockResolvedValueOnce({ error: 'Mapping failed' });

      // Mock database statements
      const mockStmts = {
        updatePuzzles: { run: jest.fn() },
        deleteInteractions: { run: jest.fn() },
        deleteCharOwnedElems: { run: jest.fn() },
        deleteCharAssocElems: { run: jest.fn() },
        deleteElements: { run: jest.fn() },
        insertElement: { run: jest.fn() },
        insertCharOwned: { run: jest.fn() },
        insertCharAssoc: { run: jest.fn() },
        insertPuzzleElem: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('UPDATE puzzles SET locked_item_id = NULL')) {
          return mockStmts.updatePuzzles;
        }
        if (sql.includes('DELETE FROM element_interactions')) {
          return mockStmts.deleteInteractions;
        }
        if (sql.includes('DELETE FROM character_owned_elements')) {
          return mockStmts.deleteCharOwnedElems;
        }
        if (sql.includes('DELETE FROM character_associated_elements')) {
          return mockStmts.deleteCharAssocElems;
        }
        if (sql.includes('DELETE FROM elements')) {
          return mockStmts.deleteElements;
        }
        if (sql.includes('INSERT INTO elements')) {
          return mockStmts.insertElement;
        }
        if (sql.includes('INSERT OR IGNORE INTO character_owned_elements')) {
          return mockStmts.insertCharOwned;
        }
        if (sql.includes('INSERT OR IGNORE INTO character_associated_elements')) {
          return mockStmts.insertCharAssoc;
        }
        if (sql.includes('INSERT OR IGNORE INTO puzzle_elements')) {
          return mockStmts.insertPuzzleElem;
        }
        throw new Error(`Unexpected SQL: ${sql}`);
      });

      mockDB.inTransaction = true;
      mockDB.exec = jest.fn();

      await expect(syncer.sync({ continueOnError: false })).rejects.toThrow('Failed to sync elements item: elem2');
      expect(mockDB.exec).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('dryRun()', () => {
    it('should preview changes without committing', async () => {
      const mockNotionElements = [
        { id: 'elem1' },
        { id: 'elem2' }
      ];

      mockNotionService.getElements.mockResolvedValue(mockNotionElements);
      mockPropertyMapper.mapElementWithNames
        .mockResolvedValueOnce({ id: 'elem1', name: 'Key Card' })
        .mockResolvedValueOnce({ id: 'elem2', name: 'Document' });

      const mockCountStmt = { get: jest.fn().mockReturnValue({ count: 10 }) };
      mockDB.prepare.mockReturnValue(mockCountStmt);

      const result = await syncer.dryRun();

      expect(result).toEqual({
        fetched: 2,
        toDelete: 10,
        toAdd: 2,
        errors: 0,
        wouldSync: 2,
        wouldDelete: 10,
        wouldError: 0
      });

      // Verify no actual database changes
      expect(mockDB.exec).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockNotionService.getElements.mockResolvedValue([{ id: 'elem1' }]);
      mockPropertyMapper.mapElementWithNames.mockResolvedValue({ id: 'elem1', name: 'Key Card' });

      // Simulate database error
      mockDB.prepare.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(syncer.sync()).rejects.toThrow('Database connection lost');
      expect(mockLogger.failSync).toHaveBeenCalled();
    });
  });
});
