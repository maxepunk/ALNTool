const graphService = require('../graphService');
const { getDB } = require('../../db/database');
const dbQueries = require('../../db/queries');

// Mock the database and queries
jest.mock('../../db/database');
jest.mock('../../db/queries');

describe('GraphService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCharacterGraph', () => {
    it('should return graph data for a valid character', async () => {
      // Mock character data
      const mockCharacter = {
        id: 'char-1',
        name: 'Test Character',
        tier: 'Core',
        type: 'character'
      };

      // Mock related data
      const mockRelations = {
        events: [
          { id: 'event-1', name: 'Event 1', type: 'timeline_event' }
        ],
        puzzles: [
          { id: 'puzzle-1', name: 'Puzzle 1', type: 'puzzle' }
        ],
        elements: [
          { id: 'elem-1', name: 'Element 1', type: 'element', relationship_type: 'owned' }
        ]
      };

      // Mock character links
      const mockCharacterLinks = [
        {
          linked_character_id: 'char-2',
          link_type: 'knows',
          link_count: 5,
          linked_character_name: 'Linked Character'
        }
      ];

      // Set up mocks
      dbQueries.getCharacterById.mockReturnValue(mockCharacter);
      dbQueries.getCharacterRelations.mockReturnValue(mockRelations);
      
      // Mock the database prepare/all chain for character links
      const mockStmt = { all: jest.fn().mockReturnValue(mockCharacterLinks) };
      const mockPrepare = jest.fn().mockReturnValue(mockStmt);
      getDB.mockReturnValue({ prepare: mockPrepare });
      
      // Mock linked character fetch
      dbQueries.getCharacterById.mockImplementation((id) => {
        if (id === 'char-2') {
          return { id: 'char-2', name: 'Linked Character', type: 'character' };
        }
        return mockCharacter;
      });

      // Execute
      const result = await graphService.getCharacterGraph('char-1');

      // Verify structure
      expect(result).toHaveProperty('center');
      expect(result).toHaveProperty('nodes');
      expect(result).toHaveProperty('edges');
      
      // Verify nodes
      expect(result.nodes).toHaveLength(5); // center + event + puzzle + element + linked char
      expect(result.nodes[0]).toMatchObject({
        id: 'char-1',
        name: 'Test Character',
        type: 'character'
      });

      // Verify edges
      expect(result.edges).toHaveLength(4); // 3 relations + 1 character link
      
      // Verify character link edge
      const charLinkEdge = result.edges.find(e => e.label.includes('linked_via'));
      expect(charLinkEdge).toBeDefined();
      expect(charLinkEdge.data.linkCount).toBe(5);
    });

    it('should throw error for non-existent character', async () => {
      dbQueries.getCharacterById.mockReturnValue(null);

      await expect(graphService.getCharacterGraph('invalid-id'))
        .rejects.toThrow('Character not found');
    });

    it('should handle characters with no relationships gracefully', async () => {
      const mockCharacter = {
        id: 'char-1',
        name: 'Lonely Character',
        type: 'character'
      };

      dbQueries.getCharacterById.mockReturnValue(mockCharacter);
      dbQueries.getCharacterRelations.mockReturnValue({
        events: [],
        puzzles: [],
        elements: []
      });

      const mockStmt = { all: jest.fn().mockReturnValue([]) };
      getDB.mockReturnValue({ prepare: jest.fn().mockReturnValue(mockStmt) });

      const result = await graphService.getCharacterGraph('char-1');

      expect(result.nodes).toHaveLength(1); // Just the center character
      expect(result.edges).toHaveLength(0);
    });

    it('should use correct SQL query for character links', async () => {
      // Set up minimal mocks
      dbQueries.getCharacterById.mockReturnValue({ id: 'char-1', name: 'Test', type: 'character' });
      dbQueries.getCharacterRelations.mockReturnValue({ events: [], puzzles: [], elements: [] });
      
      const mockStmt = { all: jest.fn().mockReturnValue([]) };
      const mockPrepare = jest.fn().mockReturnValue(mockStmt);
      getDB.mockReturnValue({ prepare: mockPrepare });

      await graphService.getCharacterGraph('char-1');

      // Verify the SQL query includes link_strength column
      const sqlQuery = mockPrepare.mock.calls[0][0];
      expect(sqlQuery).toContain('cl.link_strength as link_count');
      expect(sqlQuery).not.toContain('cl.link_count as link_count');
    });
  });

  describe('Unimplemented graph methods', () => {
    it('getElementGraph should throw not implemented error', async () => {
      await expect(graphService.getElementGraph('elem-1'))
        .rejects.toThrow('Not implemented');
    });

    it('getPuzzleGraph should throw not implemented error', async () => {
      await expect(graphService.getPuzzleGraph('puzzle-1'))
        .rejects.toThrow('Not implemented');
    });

    it('getTimelineGraph should throw not implemented error', async () => {
      await expect(graphService.getTimelineGraph('timeline-1'))
        .rejects.toThrow('Not implemented');
    });
  });
});