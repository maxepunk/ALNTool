const PuzzleSyncer = require('../PuzzleSyncer');
const { getDB } = require('../../../../db/database');

// Mock the database module
jest.mock('../../../../db/database');

describe('PuzzleSyncer Integration Tests', () => {
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
      getPuzzles: jest.fn()
    };

    mockPropertyMapper = {
      mapPuzzleWithNames: jest.fn()
    };

    mockLogger = {
      startSync: jest.fn().mockReturnValue(1),
      completeSync: jest.fn(),
      failSync: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };

    // Create syncer instance
    syncer = new PuzzleSyncer({
      notionService: mockNotionService,
      propertyMapper: mockPropertyMapper,
      logger: mockLogger,
      db: mockDB
    });
  });

  describe('sync()', () => {
    it('should successfully sync puzzles with complex relationships', async () => {
      // Setup mock data
      const mockNotionPuzzles = [
        { id: 'puzzle1', properties: { Puzzle: { title: [{ plain_text: 'Safe Combination' }] } } },
        { id: 'puzzle2', properties: { Name: { title: [{ plain_text: 'Door Lock' }] } } }
      ];

      const mockMappedPuzzles = [
        {
          id: 'puzzle1',
          puzzle: 'Safe Combination',
          timing: 'Act 1',
          owner: [{ id: 'char1', name: 'Sarah' }],
          lockedItem: [{ id: 'elem1', name: 'Safe' }],
          rewards: [
            { id: 'elem2', name: 'Evidence' },
            { id: 'elem3', name: 'Money' }
          ],
          puzzleElements: [
            { id: 'elem4', name: 'Clue 1' },
            { id: 'elem5', name: 'Clue 2' }
          ],
          storyReveals: 'Marcus was involved',
          narrativeThreads: ['Murder Mystery', 'Corporate Espionage']
        },
        {
          id: 'puzzle2',
          name: 'Door Lock',
          timing: 'Act 2',
          owner: null,
          lockedItem: null,
          rewards: [],
          puzzleElements: [{ id: 'elem6', name: 'Key Card' }],
          storyReveals: '',
          narrativeThreads: []
        }
      ];

      // Mock Notion service responses
      mockNotionService.getPuzzles.mockResolvedValue(mockNotionPuzzles);
      mockPropertyMapper.mapPuzzleWithNames
        .mockResolvedValueOnce(mockMappedPuzzles[0])
        .mockResolvedValueOnce(mockMappedPuzzles[1]);

      // Mock database statements
      const mockStmts = {
        deleteCharPuzzles: { run: jest.fn() },
        deletePuzzles: { run: jest.fn() },
        insertPuzzle: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('DELETE FROM character_puzzles')) return mockStmts.deleteCharPuzzles;
        if (sql.includes('DELETE FROM puzzles')) return mockStmts.deletePuzzles;
        if (sql.includes('INSERT INTO puzzles')) return mockStmts.insertPuzzle;
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
      expect(mockStmts.deleteCharPuzzles.run).toHaveBeenCalled();
      expect(mockStmts.deletePuzzles.run).toHaveBeenCalled();

      // Verify puzzle insertion with JSON arrays
      expect(mockStmts.insertPuzzle.run).toHaveBeenCalledTimes(2);
      expect(mockStmts.insertPuzzle.run).toHaveBeenCalledWith(
        'puzzle1', 
        'Safe Combination', 
        'Act 1', 
        'char1', 
        'elem1',
        JSON.stringify(['elem2', 'elem3']), // reward_ids
        JSON.stringify(['elem4', 'elem5']), // puzzle_element_ids
        'Marcus was involved',
        JSON.stringify(['Murder Mystery', 'Corporate Espionage']) // narrative_threads
      );
      expect(mockStmts.insertPuzzle.run).toHaveBeenCalledWith(
        'puzzle2',
        'Door Lock',
        'Act 2',
        null,
        null,
        '[]', // empty rewards
        JSON.stringify(['elem6']), // puzzle_element_ids
        '',
        '[]' // empty narrative threads
      );

      // Verify logging
      expect(mockLogger.startSync).toHaveBeenCalledWith('puzzles');
      expect(mockLogger.completeSync).toHaveBeenCalledWith(1, result);
    });

    it('should handle puzzles with missing name gracefully', async () => {
      const mockNotionPuzzles = [
        { id: 'puzzle1', properties: {} } // No name or puzzle property
      ];

      mockNotionService.getPuzzles.mockResolvedValue(mockNotionPuzzles);
      mockPropertyMapper.mapPuzzleWithNames.mockResolvedValue({
        id: 'puzzle1',
        // No puzzle or name property
        timing: 'Act 1'
      });

      const mockInsertStmt = { run: jest.fn() };
      mockDB.prepare.mockReturnValue(mockInsertStmt);

      const result = await syncer.sync();

      expect(result.synced).toBe(1);
      // Should generate default name
      expect(mockInsertStmt.run).toHaveBeenCalledWith(
        'puzzle1',
        'Untitled Puzzle (puzzle1)', // Generated name
        'Act 1',
        null,
        null,
        '[]',
        '[]',
        '',
        '[]'
      );
    });

    it('should handle empty puzzle list', async () => {
      mockNotionService.getPuzzles.mockResolvedValue([]);

      const result = await syncer.sync();

      expect(result).toEqual({
        fetched: 0,
        synced: 0,
        errors: 0
      });
      expect(mockLogger.warn).toHaveBeenCalledWith('No puzzles found in Notion.');
      expect(mockDB.exec).not.toHaveBeenCalled(); // No transaction needed
    });

    it('should log raw Notion data for failed puzzles', async () => {
      const mockNotionPuzzle = {
        id: 'puzzle1',
        properties: {
          Puzzle: { title: [{ plain_text: 'Test Puzzle' }] },
          Timing: { select: { name: 'Act 1' } }
        }
      };

      mockNotionService.getPuzzles.mockResolvedValue([mockNotionPuzzle]);
      mockPropertyMapper.mapPuzzleWithNames.mockResolvedValue({ error: 'Missing required field' });

      const mockStmt = { run: jest.fn() };
      mockDB.prepare.mockReturnValue(mockStmt);

      await syncer.sync();

      // Verify error logging includes raw Notion data
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing puzzles puzzle1',
        'Missing required field'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Raw Notion data for failed puzzle puzzle1:',
        expect.stringContaining('Test Puzzle')
      );
    });

    it('should handle puzzles with default timing', async () => {
      const mockNotionPuzzles = [{ id: 'puzzle1' }];
      const mockMappedPuzzle = {
        id: 'puzzle1',
        name: 'Test Puzzle',
        // No timing specified
      };

      mockNotionService.getPuzzles.mockResolvedValue(mockNotionPuzzles);
      mockPropertyMapper.mapPuzzleWithNames.mockResolvedValue(mockMappedPuzzle);

      const mockInsertStmt = { run: jest.fn() };
      mockDB.prepare.mockReturnValue(mockInsertStmt);

      const result = await syncer.sync();

      expect(result.synced).toBe(1);
      expect(mockInsertStmt.run).toHaveBeenCalledWith(
        'puzzle1',
        'Test Puzzle',
        'Unknown', // Default timing
        null,
        null,
        '[]',
        '[]',
        '',
        '[]'
      );
    });

    it('should handle database errors during puzzle insertion', async () => {
      const mockNotionPuzzles = [
        { id: 'puzzle1', properties: {} }
      ];

      mockNotionService.getPuzzles.mockResolvedValue(mockNotionPuzzles);
      mockPropertyMapper.mapPuzzleWithNames.mockResolvedValue({
        id: 'puzzle1',
        name: 'Test Puzzle',
        type: 'Investigation',
        timing: 'Act 1',
        story_reveals: ['reveal1'],
        narrative_threads: ['thread1']
      });

      // Mock database statements
      const mockStmts = {
        deletePuzzleElements: { run: jest.fn() },
        deletePuzzleRewards: { run: jest.fn() },
        deletePuzzleCharacters: { run: jest.fn() },
        deletePuzzles: { run: jest.fn() },
        insertPuzzle: { 
          run: jest.fn().mockImplementation(() => {
            const error = new Error('FOREIGN KEY constraint failed');
            error.code = 'SQLITE_CONSTRAINT_FOREIGNKEY';
            throw error;
          })
        },
        insertPuzzleElement: { run: jest.fn() },
        insertPuzzleReward: { run: jest.fn() },
        insertPuzzleCharacter: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('DELETE FROM puzzle_elements')) return mockStmts.deletePuzzleElements;
        if (sql.includes('DELETE FROM puzzle_rewards')) return mockStmts.deletePuzzleRewards;
        if (sql.includes('DELETE FROM character_puzzles')) return mockStmts.deletePuzzleCharacters;
        if (sql.includes('DELETE FROM puzzles')) return mockStmts.deletePuzzles;
        if (sql.includes('INSERT INTO puzzles')) return mockStmts.insertPuzzle;
        if (sql.includes('INSERT OR IGNORE INTO puzzle_elements')) return mockStmts.insertPuzzleElement;
        if (sql.includes('INSERT OR IGNORE INTO puzzle_rewards')) return mockStmts.insertPuzzleReward;
        if (sql.includes('INSERT OR IGNORE INTO character_puzzles')) return mockStmts.insertPuzzleCharacter;
        throw new Error(`Unexpected SQL: ${sql}`);
      });

      const result = await syncer.sync();

      expect(result).toEqual({
        fetched: 1,
        synced: 0,
        errors: 1
      });
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing puzzles puzzle1',
        'FOREIGN KEY constraint failed'
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Raw Notion data for failed puzzle puzzle1:',
        '{}'
      );
    });
  });

  describe('dryRun()', () => {
    it('should preview changes without committing', async () => {
      const mockNotionPuzzles = [
        { id: 'puzzle1' },
        { id: 'puzzle2' },
        { id: 'puzzle3' }
      ];

      mockNotionService.getPuzzles.mockResolvedValue(mockNotionPuzzles);
      mockPropertyMapper.mapPuzzleWithNames
        .mockResolvedValueOnce({ id: 'puzzle1', name: 'Safe' })
        .mockResolvedValueOnce({ error: 'Invalid data' })
        .mockResolvedValueOnce({ id: 'puzzle3', name: 'Door' });

      const mockCountStmt = { get: jest.fn().mockReturnValue({ count: 15 }) };
      mockDB.prepare.mockReturnValue(mockCountStmt);

      const result = await syncer.dryRun();

      expect(result).toEqual({
        fetched: 3,
        toDelete: 15,
        toAdd: 2,
        errors: 1,
        wouldSync: 2,
        wouldDelete: 15,
        wouldError: 1
      });

      // Verify no actual database changes
      expect(mockDB.exec).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should handle database errors during puzzle insertion', async () => {
      mockNotionService.getPuzzles.mockResolvedValue([{ id: 'puzzle1' }]);
      mockPropertyMapper.mapPuzzleWithNames.mockResolvedValue({ 
        id: 'puzzle1', 
        name: 'Test Puzzle' 
      });
      
      const mockStmt = { 
        run: jest.fn().mockImplementation(() => {
          throw new Error('Foreign key constraint violation');
        })
      };
      mockDB.prepare.mockReturnValue(mockStmt);

      const result = await syncer.sync();

      expect(result.errors).toBe(1);
      expect(result.synced).toBe(0);
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Error processing puzzles puzzle1',
        expect.stringContaining('Foreign key')
      );
    });
  });
});
