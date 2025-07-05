const TimelineEventSyncer = require('../TimelineEventSyncer');
const { getDB } = require('../../../../db/database');

// Mock the database module
jest.mock('../../../../db/database');

describe('TimelineEventSyncer Integration Tests', () => {
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
      getTimelineEvents: jest.fn()
    };

    mockPropertyMapper = {
      mapTimelineEventWithNames: jest.fn()
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
    syncer = new TimelineEventSyncer({
      notionService: mockNotionService,
      propertyMapper: mockPropertyMapper,
      logger: mockLogger,
      db: mockDB
    });
  });

  describe('sync()', () => {
    it('should successfully sync timeline events with character relationships', async () => {
      // Setup mock data
      const mockNotionEvents = [
        { id: 'event1', properties: { Description: { title: [{ plain_text: 'Marcus discovered the affair' }] } } },
        { id: 'event2', properties: { Description: { title: [{ plain_text: 'Company merger announced' }] } } }
      ];

      const mockMappedEvents = [
        {
          id: 'event1',
          description: 'Marcus discovered the affair',
          date: '2018-06-15',
          charactersInvolved: [
            { id: 'char1', name: 'Marcus' },
            { id: 'char2', name: 'Sarah' },
            { id: 'char3', name: 'Alex' }
          ],
          memoryEvidence: [
            { id: 'elem1', name: 'Photo' },
            { id: 'elem2', name: 'Letter' }
          ],
          notes: 'Turning point in the story'
        },
        {
          id: 'event2',
          description: 'Company merger announced',
          date: '2019-01-01',
          charactersInvolved: [{ id: 'char2', name: 'Sarah' }],
          memoryEvidence: [],
          notes: ''
        }
      ];

      // Mock Notion service responses
      mockNotionService.getTimelineEvents.mockResolvedValue(mockNotionEvents);
      mockPropertyMapper.mapTimelineEventWithNames
        .mockResolvedValueOnce(mockMappedEvents[0])
        .mockResolvedValueOnce(mockMappedEvents[1]);

      // Mock database statements
      const mockStmts = {
        deleteCharEvents: { run: jest.fn() },
        updateElements: { run: jest.fn() },
        deleteEvents: { run: jest.fn() },
        insertEvent: { run: jest.fn() },
        insertCharEventRel: { run: jest.fn() }
      };

      // Setup prepare mock to return appropriate statements
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('DELETE FROM character_timeline_events')) {
          return mockStmts.deleteCharEvents;
        }
        if (sql.includes('UPDATE elements SET timeline_event_id = NULL')) {
          return mockStmts.updateElements;
        }
        if (sql.includes('DELETE FROM timeline_events')) {
          return mockStmts.deleteEvents;
        }
        if (sql.includes('INSERT INTO timeline_events')) {
          return mockStmts.insertEvent;
        }
        if (sql.includes('INSERT OR IGNORE INTO character_timeline_events')) {
          return mockStmts.insertCharEventRel;
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
      expect(mockStmts.deleteCharEvents.run).toHaveBeenCalled();
      expect(mockStmts.updateElements.run).toHaveBeenCalled();
      expect(mockStmts.deleteEvents.run).toHaveBeenCalled();

      // Verify timeline event insertion with JSON arrays
      expect(mockStmts.insertEvent.run).toHaveBeenCalledTimes(2);
      expect(mockStmts.insertEvent.run).toHaveBeenCalledWith(
        'event1',
        'Marcus discovered the affair',
        '2018-06-15',
        JSON.stringify(['char1', 'char2', 'char3']), // character_ids
        JSON.stringify(['elem1', 'elem2']), // element_ids
        'Turning point in the story'
      );
      expect(mockStmts.insertEvent.run).toHaveBeenCalledWith(
        'event2',
        'Company merger announced',
        '2019-01-01',
        JSON.stringify(['char2']),
        '[]', // empty elements
        ''
      );

      // Verify character relationship insertion (postProcess)
      expect(mockStmts.insertCharEventRel.run).toHaveBeenCalledTimes(4); // 3 for event1, 1 for event2
      expect(mockStmts.insertCharEventRel.run).toHaveBeenCalledWith('char1', 'event1');
      expect(mockStmts.insertCharEventRel.run).toHaveBeenCalledWith('char2', 'event1');
      expect(mockStmts.insertCharEventRel.run).toHaveBeenCalledWith('char3', 'event1');
      expect(mockStmts.insertCharEventRel.run).toHaveBeenCalledWith('char2', 'event2');

      // Verify logging
      expect(mockLogger.startSync).toHaveBeenCalledWith('timeline_events');
      expect(mockLogger.info).toHaveBeenCalledWith('Processing relationships for 2 timeline events...');
      expect(mockLogger.completeSync).toHaveBeenCalledWith(1, result);
    });

    it('should handle empty timeline event list', async () => {
      mockNotionService.getTimelineEvents.mockResolvedValue([]);

      const result = await syncer.sync();

      expect(result).toEqual({
        fetched: 0,
        synced: 0,
        errors: 0
      });
      expect(mockLogger.warn).toHaveBeenCalledWith('No timeline_events found in Notion.');
      expect(mockDB.exec).not.toHaveBeenCalled(); // No transaction needed
    });

    it('should handle events with no relationships', async () => {
      const mockNotionEvents = [{ id: 'event1' }];
      const mockMappedEvent = {
        id: 'event1',
        description: 'Standalone event',
        date: '2020-01-01',
        charactersInvolved: null,
        memoryEvidence: null,
        notes: 'No connections'
      };

      mockNotionService.getTimelineEvents.mockResolvedValue(mockNotionEvents);
      mockPropertyMapper.mapTimelineEventWithNames.mockResolvedValue(mockMappedEvent);

      const mockInsertStmt = { run: jest.fn() };
      mockDB.prepare.mockReturnValue(mockInsertStmt);

      const result = await syncer.sync();

      expect(result.synced).toBe(1);
      expect(mockInsertStmt.run).toHaveBeenCalledWith(
        'event1',
        'Standalone event',
        '2020-01-01',
        '[]', // empty character_ids
        '[]', // empty element_ids
        'No connections'
      );
    });

    it('should skip postProcess if no relationships to process', async () => {
      const mockNotionEvents = [{ id: 'event1' }];
      const mockMappedEvent = {
        id: 'event1',
        description: 'Event without characters',
        charactersInvolved: [],
        memoryEvidence: []
      };

      mockNotionService.getTimelineEvents.mockResolvedValue(mockNotionEvents);
      mockPropertyMapper.mapTimelineEventWithNames.mockResolvedValue(mockMappedEvent);

      const mockStmt = { run: jest.fn() };
      mockDB.prepare.mockReturnValue(mockStmt);

      await syncer.sync();

      // postProcess should still run but not insert any relationships
      expect(mockLogger.info).toHaveBeenCalledWith('Processing relationships for 1 timeline events...');
      // Verify no character-event relationships were inserted
      const charEventInserts = mockDB.prepare.mock.calls.filter(
        call => call[0].includes('INSERT OR IGNORE INTO character_timeline_events')
      );
      expect(charEventInserts.length).toBe(1); // Statement prepared but not run for empty arrays
    });

    it('should handle mapping errors and continue by default', async () => {
      const mockNotionEvents = [
        { id: 'event1' },
        { id: 'event2' },
        { id: 'event3' }
      ];

      mockNotionService.getTimelineEvents.mockResolvedValue(mockNotionEvents);
      mockPropertyMapper.mapTimelineEventWithNames
        .mockResolvedValueOnce({ id: 'event1', description: 'Event 1' })
        .mockResolvedValueOnce({ error: 'Missing required date' })
        .mockResolvedValueOnce({ id: 'event3', description: 'Event 3' });

      // Create separate mock statements for different operations
      const mockEventInsertStmt = { run: jest.fn() };
      const mockCharEventRelStmt = { run: jest.fn() };
      const mockClearStmt = { run: jest.fn() };

      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('INSERT INTO timeline_events')) {
          return mockEventInsertStmt;
        }
        if (sql.includes('INSERT OR IGNORE INTO character_timeline_events')) {
          return mockCharEventRelStmt;
        }
        if (sql.includes('DELETE FROM')) {
          return mockClearStmt;
        }
        return { run: jest.fn() };
      });

      const result = await syncer.sync();

      expect(result).toEqual({
        fetched: 3,
        synced: 2,
        errors: 1
      });
      expect(mockEventInsertStmt.run).toHaveBeenCalledTimes(2); // Only successful mappings
      expect(mockEventInsertStmt.run).toHaveBeenCalledWith(
        'event1',
        'Event 1',
        '',
        '[]',
        '[]',
        ''
      );
      expect(mockEventInsertStmt.run).toHaveBeenCalledWith(
        'event3',
        'Event 3',
        '',
        '[]',
        '[]',
        ''
      );
    });
  });

  describe('dryRun()', () => {
    it('should preview changes without committing', async () => {
      const mockNotionEvents = [
        { id: 'event1' },
        { id: 'event2' }
      ];

      mockNotionService.getTimelineEvents.mockResolvedValue(mockNotionEvents);
      mockPropertyMapper.mapTimelineEventWithNames
        .mockResolvedValueOnce({ id: 'event1', description: 'Event 1' })
        .mockResolvedValueOnce({ id: 'event2', description: 'Event 2' });

      const mockCountStmt = { get: jest.fn().mockReturnValue({ count: 75 }) };
      mockDB.prepare.mockReturnValue(mockCountStmt);

      const result = await syncer.dryRun();

      expect(result).toEqual({
        fetched: 2,
        toDelete: 75,
        toAdd: 2,
        errors: 0,
        wouldSync: 2,
        wouldDelete: 75,
        wouldError: 0
      });

      // Verify no actual database changes
      expect(mockDB.exec).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    it('should rollback on critical error', async () => {
      mockNotionService.getTimelineEvents.mockResolvedValue([{ id: 'event1' }]);
      mockPropertyMapper.mapTimelineEventWithNames.mockResolvedValue({
        id: 'event1',
        description: 'Test Event'
      });

      // Simulate database error during clearing
      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('DELETE FROM character_timeline_events')) {
          throw new Error('Foreign key constraint failed');
        }
        return { run: jest.fn() };
      });

      mockDB.inTransaction = true;

      await expect(syncer.sync()).rejects.toThrow('Foreign key constraint failed');
      expect(mockDB.exec).toHaveBeenCalledWith('ROLLBACK');
      expect(mockLogger.failSync).toHaveBeenCalled();
    });

    it('should handle postProcess errors gracefully', async () => {
      const mockNotionEvents = [{ id: 'event1' }];
      mockNotionService.getTimelineEvents.mockResolvedValue(mockNotionEvents);
      mockPropertyMapper.mapTimelineEventWithNames.mockResolvedValue({
        id: 'event1',
        description: 'Test Event',
        charactersInvolved: [{ id: 'char1' }]
      });

      const mockInsertStmt = { run: jest.fn() };
      const mockCharEventStmt = {
        run: jest.fn().mockImplementation(() => {
          throw new Error('Character does not exist');
        })
      };

      mockDB.prepare.mockImplementation((sql) => {
        if (sql.includes('INSERT OR IGNORE INTO character_timeline_events')) {
          return mockCharEventStmt;
        }
        return mockInsertStmt;
      });

      mockDB.inTransaction = true;

      await expect(syncer.sync()).rejects.toThrow('Character does not exist');
      expect(mockDB.exec).toHaveBeenCalledWith('ROLLBACK');
    });
  });
});
