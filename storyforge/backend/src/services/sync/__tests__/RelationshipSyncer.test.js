const RelationshipSyncer = require('../RelationshipSyncer');
const { getDB } = require('../../../db/database');

// Mock dependencies
const mockNotionService = {
  getCharacters: jest.fn(),
  getElements: jest.fn(),
  getPuzzles: jest.fn(),
  getTimelineEvents: jest.fn()
};

const mockPropertyMapper = {
  mapCharacterWithNames: jest.fn(),
  mapElementWithNames: jest.fn(),
  mapPuzzleWithNames: jest.fn(),
  mapTimelineEventWithNames: jest.fn()
};

const mockLogger = {
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn()
};

describe('RelationshipSyncer Integration Tests', () => {
  let syncer;
  let db;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Get test database
    db = getDB();
    
    // Setup mock responses
    mockNotionService.getCharacters.mockResolvedValue([
      { id: 'char1', properties: { Name: { title: [{ plain_text: 'Sarah' }] } } },
      { id: 'char2', properties: { Name: { title: [{ plain_text: 'Alex' }] } } },
      { id: 'char3', properties: { Name: { title: [{ plain_text: 'Marcus' }] } } }
    ]);
    
    mockPropertyMapper.mapCharacterWithNames.mockImplementation(async (character) => {
      // Return different relationships for different characters to test processing
      if (character.id === 'char1') {
        return {
          id: character.id,
          name: character.properties?.Name?.title?.[0]?.plain_text || 'Test Character',
          events: [{ id: 'event1' }],
          ownedElements: [{ id: 'elem1' }],
          associatedElements: [],
          puzzles: [{ id: 'puzzle1' }]
        };
      } else if (character.id === 'char2') {
        return {
          id: character.id,
          name: character.properties?.Name?.title?.[0]?.plain_text || 'Test Character',
          events: [{ id: 'event1' }],
          ownedElements: [],
          associatedElements: [],
          puzzles: []
        };
      } else {
        return {
          id: character.id,
          name: character.properties?.Name?.title?.[0]?.plain_text || 'Test Character',
          events: [],
          ownedElements: [],
          associatedElements: [],
          puzzles: []
        };
      }
    });
    
    // Create syncer instance
    syncer = new RelationshipSyncer({
      notionService: mockNotionService,
      propertyMapper: mockPropertyMapper,
      logger: mockLogger,
      db
    });

    // Setup test data
    db.prepare('BEGIN TRANSACTION').run();
    
    // Insert test characters
    db.prepare(`
      INSERT INTO characters (id, name, type) VALUES 
      ('char1', 'Sarah', 'Player'),
      ('char2', 'Alex', 'Player'),
      ('char3', 'Marcus', 'Player')
    `).run();

    // Insert test timeline events
    db.prepare(`
      INSERT INTO timeline_events (id, description) VALUES 
      ('event1', 'Shared Event 1'),
      ('event2', 'Shared Event 2')
    `).run();

    // Insert test elements
    db.prepare(`
      INSERT INTO elements (id, name, type) VALUES 
      ('elem1', 'Shared Element 1', 'Item'),
      ('elem2', 'Shared Element 2', 'Item')
    `).run();

    // Insert test puzzles
    db.prepare(`
      INSERT INTO puzzles (id, name) VALUES 
      ('puzzle1', 'Shared Puzzle 1'),
      ('puzzle2', 'Shared Puzzle 2')
    `).run();

    // Insert character-timeline event relationships
    db.prepare(`
      INSERT INTO character_timeline_events (character_id, timeline_event_id) VALUES 
      ('char1', 'event1'),
      ('char2', 'event1'),
      ('char1', 'event2'),
      ('char2', 'event2')
    `).run();

    // Insert character-element relationships
    db.prepare(`
      INSERT INTO character_owned_elements (character_id, element_id) VALUES 
      ('char1', 'elem1'),
      ('char2', 'elem1'),
      ('char1', 'elem2')
    `).run();

    // Insert character-puzzle relationships
    db.prepare(`
      INSERT INTO character_puzzles (character_id, puzzle_id) VALUES 
      ('char1', 'puzzle1'),
      ('char2', 'puzzle1'),
      ('char1', 'puzzle2')
    `).run();
  });

  afterEach(() => {
    // Rollback test data
    db.prepare('ROLLBACK').run();
  });

  describe('validateRelationships()', () => {
    it('should validate existing relationships', async () => {
      const result = await syncer.validateRelationships({
        characterIds: ['char1', 'char2'],
        elementIds: ['elem1', 'elem2'],
        puzzleIds: ['puzzle1', 'puzzle2'],
        eventIds: ['event1', 'event2']
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing entities', async () => {
      const result = await syncer.validateRelationships({
        characterIds: ['char1', 'missing_char'],
        elementIds: ['elem1', 'missing_elem'],
        puzzleIds: ['puzzle1', 'missing_puzzle'],
        eventIds: ['event1', 'missing_event']
      });

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(4);
      expect(result.errors[0]).toContain('Missing characters: missing_char');
      expect(result.errors[1]).toContain('Missing elements: missing_elem');
      expect(result.errors[2]).toContain('Missing puzzles: missing_puzzle');
      expect(result.errors[3]).toContain('Missing events: missing_event');
    });
  });

  describe('computeCharacterLinks()', () => {
    it('should compute links between characters based on shared experiences', async () => {
      const result = await syncer.computeCharacterLinks();

      // Verify results
      expect(result.processed).toBeGreaterThan(0);
      expect(result.errors).toBe(0);

      // Check computed links
      const links = db.prepare(`
        SELECT * FROM character_links 
        WHERE (character_a_id = 'char1' AND character_b_id = 'char2')
        OR (character_a_id = 'char2' AND character_b_id = 'char1')
      `).all();

      expect(links).toHaveLength(1);
      const link = links[0];
      
      // Calculate expected strength:
      // - 2 shared events * 30 = 60
      // - 1 shared puzzle * 25 = 25
      // - 1 shared element * 15 = 15
      // Total = 100 (capped)
      expect(link.link_strength).toBe(100);
    });

    it('should handle characters with no shared experiences', async () => {
      // Add a character with no relationships
      db.prepare(`
        INSERT INTO characters (id, name, type) VALUES 
        ('char4', 'Isolated', 'Player')
      `).run();

      const result = await syncer.computeCharacterLinks();

      // Verify no links created for isolated character
      const links = db.prepare(`
        SELECT * FROM character_links 
        WHERE character_a_id = 'char4' OR character_b_id = 'char4'
      `).all();

      expect(links).toHaveLength(0);
    });

    it('should handle database errors gracefully', async () => {
      // Force an error by dropping a table
      db.prepare('DROP TABLE character_timeline_events').run();

      const result = await syncer.computeCharacterLinks();
      expect(result.errors).toBeGreaterThan(0);
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('sync()', () => {
    it('should perform full relationship sync', async () => {
      const result = await syncer.sync();

      expect(result.processed).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
      expect(result.duration).toBeGreaterThan(0);
      expect(mockLogger.info).toHaveBeenCalledWith(
        expect.stringContaining('Relationship sync completed')
      );
    });

    it('should clear existing relationships before sync', async () => {
      // Insert some existing links
      db.prepare(`
        INSERT INTO character_links (character_a_id, character_b_id, link_type, link_source_id, link_strength) VALUES 
        ('char1', 'char3', 'computed', 'test', 50)
      `).run();

      await syncer.sync();

      // Verify old links are gone
      const oldLinks = db.prepare(`
        SELECT * FROM character_links 
        WHERE character_a_id = 'char1' AND character_b_id = 'char3'
      `).all();

      expect(oldLinks).toHaveLength(0);
    });
  });
}); 