const CharacterSyncer = require('../CharacterSyncer');
const { getDB } = require('../../../../db/database');
const SyncLogger = require('../../SyncLogger');

// Mock the database module
jest.mock('../../../../db/database');

describe('CharacterSyncer Integration Tests', () => {
  let syncer;
  let mockDB;
  let mockNotionService;
  let mockPropertyMapper;
  let mockLogger;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock database
    mockDB = {
      prepare: jest.fn(),
      exec: jest.fn(),
      inTransaction: false,
      transaction: jest.fn((callback) => {
        mockDB.inTransaction = true;
        try {
          const result = callback();
          mockDB.inTransaction = false;
          return result;
        } catch (error) {
          mockDB.inTransaction = false;
          throw error;
        }
      })
    };
    getDB.mockReturnValue(mockDB);

    // Create mock services
    mockNotionService = {
      getCharacters: jest.fn(),
      getPagesByIds: jest.fn()
    };

    mockPropertyMapper = {
      mapCharacterWithNames: jest.fn()
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
    syncer = new CharacterSyncer({
      notionService: mockNotionService,
      propertyMapper: mockPropertyMapper,
      logger: mockLogger,
      db: mockDB
    });
  });

  describe('sync()', () => {
    it('should successfully sync characters with relationships', async () => {
      // Setup mock data
      const mockNotionCharacters = [
        { id: 'char1', properties: { Name: { title: [{ plain_text: 'Sarah' }] } } },
        { id: 'char2', properties: { Name: { title: [{ plain_text: 'Alex' }] } } }
      ];

      const mockMappedCharacters = [
        {
          id: 'char1',
          name: 'Sarah',
          type: 'Player',
          tier: 'Core',
          logline: 'Driven entrepreneur',
          connections: 5,
          events: [{ id: 'event1', name: 'Event 1' }],
          puzzles: [{ id: 'puzzle1', name: 'Puzzle 1' }],
          ownedElements: [{ id: 'elem1', name: 'Element 1' }],
          associatedElements: [{ id: 'elem2', name: 'Element 2' }]
        },
        {
          id: 'char2',
          name: 'Alex',
          type: 'Player',
          tier: 'Core',
          logline: 'Tech genius',
          connections: 3,
          events: [],
          puzzles: [],
          ownedElements: [],
          associatedElements: []
        }
      ];

      // Mock Notion service responses
      mockNotionService.getCharacters.mockResolvedValue(mockNotionCharacters);
      mockPropertyMapper.mapCharacterWithNames
        .mockResolvedValueOnce(mockMappedCharacters[0])
        .mockResolvedValueOnce(mockMappedCharacters[1]);

      // Mock database statements
      const mockStmts = {
        deleteCharLinks: { run: jest.fn() },
        deleteCharEvents: { run: jest.fn() },
        deleteCharOwnedElems: { run: jest.fn() },
        deleteCharAssocElems: { run: jest.fn() },
        deleteCharPuzzles: { run: jest.fn() },
        deleteCharacters: { run: jest.fn() },
        insertCharacter: { run: jest.fn() },
        insertEventRel: { run: jest.fn() },
        insertOwnedElem: { run: jest.fn() },
        insertAssocElem: { run: jest.fn() },
        insertPuzzleRel: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('DELETE FROM character_links')) return mockStmts.deleteCharLinks;
        if (sql.includes('DELETE FROM character_timeline_events')) return mockStmts.deleteCharEvents;
        if (sql.includes('DELETE FROM character_owned_elements')) return mockStmts.deleteCharOwnedElems;
        if (sql.includes('DELETE FROM character_associated_elements')) return mockStmts.deleteCharAssocElems;
        if (sql.includes('DELETE FROM character_puzzles')) return mockStmts.deleteCharPuzzles;
        if (sql.includes('DELETE FROM characters')) return mockStmts.deleteCharacters;
        if (sql.includes('INSERT INTO characters')) return mockStmts.insertCharacter;
        if (sql.includes('INSERT OR IGNORE INTO character_timeline_events')) return mockStmts.insertEventRel;
        if (sql.includes('INSERT OR IGNORE INTO character_owned_elements')) return mockStmts.insertOwnedElem;
        if (sql.includes('INSERT OR IGNORE INTO character_associated_elements')) return mockStmts.insertAssocElem;
        if (sql.includes('INSERT OR IGNORE INTO character_puzzles')) return mockStmts.insertPuzzleRel;
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
      expect(mockStmts.deleteCharLinks.run).toHaveBeenCalled();
      expect(mockStmts.deleteCharEvents.run).toHaveBeenCalled();
      expect(mockStmts.deleteCharOwnedElems.run).toHaveBeenCalled();
      expect(mockStmts.deleteCharAssocElems.run).toHaveBeenCalled();
      expect(mockStmts.deleteCharPuzzles.run).toHaveBeenCalled();
      expect(mockStmts.deleteCharacters.run).toHaveBeenCalled();

      // Verify character insertion
      expect(mockStmts.insertCharacter.run).toHaveBeenCalledTimes(2);
      expect(mockStmts.insertCharacter.run).toHaveBeenCalledWith(
        'char1', 'Sarah', 'Player', 'Core', 'Driven entrepreneur', 5
      );
      expect(mockStmts.insertCharacter.run).toHaveBeenCalledWith(
        'char2', 'Alex', 'Player', 'Core', 'Tech genius', 3
      );

      // Verify relationship insertion (only char1 has relationships)
      expect(mockStmts.insertEventRel.run).toHaveBeenCalledWith('char1', 'event1');
      expect(mockStmts.insertPuzzleRel.run).toHaveBeenCalledWith('char1', 'puzzle1');
      expect(mockStmts.insertOwnedElem.run).toHaveBeenCalledWith('char1', 'elem1');
      expect(mockStmts.insertAssocElem.run).toHaveBeenCalledWith('char1', 'elem2');

      // Verify logging
      expect(mockLogger.startSync).toHaveBeenCalledWith('characters');
      expect(mockLogger.completeSync).toHaveBeenCalledWith(1, result);
    });

    it('should handle empty character list', async () => {
      mockNotionService.getCharacters.mockResolvedValue([]);

      const result = await syncer.sync();

      expect(result).toEqual({
        fetched: 0,
        synced: 0,
        errors: 0
      });
      expect(mockLogger.warn).toHaveBeenCalledWith('No characters found in Notion.');
      expect(mockDB.exec).not.toHaveBeenCalled(); // No transaction needed
    });

    it('should handle mapping errors and continue by default', async () => {
      const mockNotionCharacters = [
        { id: 'char1', properties: {} },
        { id: 'char2', properties: {} },
        { id: 'char3', properties: {} }
      ];

      mockNotionService.getCharacters.mockResolvedValue(mockNotionCharacters);
      mockPropertyMapper.mapCharacterWithNames
        .mockResolvedValueOnce({ id: 'char1', name: 'Sarah', type: 'Player', description: '', themes: '', act_focus: 0 })
        .mockResolvedValueOnce({ error: 'Mapping failed' })
        .mockResolvedValueOnce({ id: 'char3', name: 'Marcus', type: 'Player', description: '', themes: '', act_focus: 0 });

      // Mock database statements
      const mockStmts = {
        deleteCharLinks: { run: jest.fn() },
        deleteCharEvents: { run: jest.fn() },
        deleteCharOwnedElems: { run: jest.fn() },
        deleteCharAssocElems: { run: jest.fn() },
        deleteCharPuzzles: { run: jest.fn() },
        deleteCharacters: { run: jest.fn() },
        insertCharacter: { run: jest.fn() },
        insertEventRel: { run: jest.fn() },
        insertOwnedElem: { run: jest.fn() },
        insertAssocElem: { run: jest.fn() },
        insertPuzzleRel: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('DELETE FROM character_links')) return mockStmts.deleteCharLinks;
        if (sql.includes('DELETE FROM character_timeline_events')) return mockStmts.deleteCharEvents;
        if (sql.includes('DELETE FROM character_owned_elements')) return mockStmts.deleteCharOwnedElems;
        if (sql.includes('DELETE FROM character_associated_elements')) return mockStmts.deleteCharAssocElems;
        if (sql.includes('DELETE FROM character_puzzles')) return mockStmts.deleteCharPuzzles;
        if (sql.includes('DELETE FROM characters')) return mockStmts.deleteCharacters;
        if (sql.includes('INSERT INTO characters')) return mockStmts.insertCharacter;
        if (sql.includes('INSERT OR IGNORE INTO character_timeline_events')) return mockStmts.insertEventRel;
        if (sql.includes('INSERT OR IGNORE INTO character_owned_elements')) return mockStmts.insertOwnedElem;
        if (sql.includes('INSERT OR IGNORE INTO character_associated_elements')) return mockStmts.insertAssocElem;
        if (sql.includes('INSERT OR IGNORE INTO character_puzzles')) return mockStmts.insertPuzzleRel;
        throw new Error(`Unexpected SQL: ${sql}`);
      });

      const result = await syncer.sync();

      expect(result).toEqual({
        fetched: 3,
        synced: 2,
        errors: 1
      });
      expect(mockStmts.insertCharacter.run).toHaveBeenCalledTimes(2); // Only successful mappings
      expect(mockStmts.insertCharacter.run).toHaveBeenCalledWith('char1', 'Sarah', 'Player', '', '', 0);
      expect(mockStmts.insertCharacter.run).toHaveBeenCalledWith('char3', 'Marcus', 'Player', '', '', 0);
    });

    it('should rollback on error when continueOnError is false', async () => {
      const mockNotionCharacters = [{ id: 'char1' }];
      mockNotionService.getCharacters.mockResolvedValue(mockNotionCharacters);
      mockPropertyMapper.mapCharacterWithNames.mockResolvedValue({ error: 'Critical error' });

      // Mock database statements
      const mockStmts = {
        deleteCharLinks: { run: jest.fn() },
        deleteCharEvents: { run: jest.fn() },
        deleteCharOwnedElems: { run: jest.fn() },
        deleteCharAssocElems: { run: jest.fn() },
        deleteCharPuzzles: { run: jest.fn() },
        deleteCharacters: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('DELETE FROM character_links')) return mockStmts.deleteCharLinks;
        if (sql.includes('DELETE FROM character_timeline_events')) return mockStmts.deleteCharEvents;
        if (sql.includes('DELETE FROM character_owned_elements')) return mockStmts.deleteCharOwnedElems;
        if (sql.includes('DELETE FROM character_associated_elements')) return mockStmts.deleteCharAssocElems;
        if (sql.includes('DELETE FROM character_puzzles')) return mockStmts.deleteCharPuzzles;
        if (sql.includes('DELETE FROM characters')) return mockStmts.deleteCharacters;
        throw new Error(`Unexpected SQL: ${sql}`);
      });

      mockDB.inTransaction = true;

      await expect(
        syncer.sync({ continueOnError: false })
      ).rejects.toThrow('Failed to sync characters item: char1');

      expect(mockDB.exec).toHaveBeenCalledWith('ROLLBACK');
      expect(mockLogger.failSync).toHaveBeenCalled();
    });
  });

  describe('dryRun()', () => {
    it('should preview changes without committing', async () => {
      const mockNotionCharacters = [
        { id: 'char1' },
        { id: 'char2' }
      ];

      mockNotionService.getCharacters.mockResolvedValue(mockNotionCharacters);
      mockPropertyMapper.mapCharacterWithNames
        .mockResolvedValueOnce({ id: 'char1', name: 'Sarah' })
        .mockResolvedValueOnce({ id: 'char2', name: 'Alex' });

      const mockCountStmt = { get: jest.fn().mockReturnValue({ count: 5 }) };
      mockDB.prepare.mockReturnValue(mockCountStmt);

      const result = await syncer.dryRun();

      expect(result).toEqual({
        fetched: 2,
        toDelete: 5,
        toAdd: 2,
        errors: 0,
        wouldSync: 2,
        wouldDelete: 5,
        wouldError: 0
      });

      // Verify no actual database changes
      expect(mockDB.exec).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockNotionService.getCharacters.mockResolvedValue([{ id: 'char1' }]);
      mockPropertyMapper.mapCharacterWithNames.mockResolvedValue({ id: 'char1', name: 'Sarah' });
      
      // Simulate database error
      mockDB.prepare.mockImplementation(() => {
        throw new Error('Database connection lost');
      });

      await expect(syncer.sync()).rejects.toThrow('Database connection lost');
      expect(mockLogger.failSync).toHaveBeenCalled();
    });

    it('should handle Notion API errors', async () => {
      mockNotionService.getCharacters.mockRejectedValue(
        new Error('Notion API rate limit exceeded')
      );

      await expect(syncer.sync()).rejects.toThrow('Notion API rate limit exceeded');
      expect(mockLogger.failSync).toHaveBeenCalled();
    });
  });
});
