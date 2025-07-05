const propertyMapper = require('../../src/utils/notionPropertyMapper');
const mockService = require('../services/__mocks__/notionService');

// Helper to create simplified test expectation objects
const createIdNameObject = (id, name) => ({ id, name });

// Mock notionService for testing
jest.mock('../../src/services/notionService', () => require('../services/__mocks__/notionService'));

describe('Async Notion Property Mappers', () => {
  
  describe('mapPuzzleWithNames', () => {
    it('should map a puzzle with related entity names', async () => {
      const mockPuzzle = mockService.MOCK_PUZZLES[0];
      const result = await propertyMapper.mapPuzzleWithNames(mockPuzzle, mockService);
      
      // Test basic properties
      expect(result.id).toBe(mockPuzzle.id);
      expect(result.puzzle).toBe('Locked Safe');
      expect(result.timing).toBe('Act 1');
      
      // Test relations with names
      expect(result.owner).toHaveLength(1);
      expect(result.owner[0]).toEqual(
        expect.objectContaining({
          id: 'char-id-1',
          name: 'Alex Reeves'
        })
      );
      
      expect(result.rewards).toHaveLength(1);
      expect(result.rewards[0]).toEqual(
        expect.objectContaining({
          id: 'element-id-1',
          name: 'Memory Video 1'
        })
      );
      
      // Test arrays
      expect(result.narrativeThreads).toEqual(['Memory Drug']);
    });
    
    it('should handle a puzzle with no relations', async () => {
      const emptyPuzzle = {
        id: 'empty-puzzle-id',
        properties: {
          Puzzle: { title: [{ plain_text: 'Empty Puzzle' }] },
          Timing: { select: { name: 'Act 2' } },
          Narrative_Threads: { multi_select: [] }
        },
        last_edited_time: '2023-01-03',
      };
      
      const result = await propertyMapper.mapPuzzleWithNames(emptyPuzzle, mockService);
      
      // Test basic properties
      expect(result.id).toBe('empty-puzzle-id');
      expect(result.puzzle).toBe('Empty Puzzle');
      
      // Test empty relations
      expect(result.owner).toEqual([]);
      expect(result.rewards).toEqual([]);
      expect(result.narrativeThreads).toEqual([]);
    });
  });

  describe('mapTimelineEventWithNames', () => {
    it('should map a timeline event with related entity names', async () => {
      const mockEvent = mockService.MOCK_TIMELINE_EVENTS[0];
      const result = await propertyMapper.mapTimelineEventWithNames(mockEvent, mockService);
      
      // Test basic properties
      expect(result.id).toBe(mockEvent.id);
      expect(result.description).toBe('Party begins');
      expect(result.date).toBe('2023-01-01');
      
      // Test relations with names
      expect(result.charactersInvolved).toHaveLength(2);
      expect(result.charactersInvolved).toEqual(expect.arrayContaining([
        expect.objectContaining({
          id: 'char-id-1',
          name: 'Alex Reeves'
        }),
        expect.objectContaining({
          id: 'char-id-2',
          name: 'Marcus Blackwood'
        })
      ]));
      
      expect(result.memoryEvidence).toHaveLength(1);
      expect(result.memoryEvidence[0]).toEqual(
        expect.objectContaining({
          id: 'element-id-1',
          name: 'Memory Video 1'
        })
      );
    });
  });
  
  describe('mapCharacterWithNames', () => {
    it('should map a character with related entity names', async () => {
      const mockCharacter = mockService.MOCK_CHARACTERS[0];
      const result = await propertyMapper.mapCharacterWithNames(mockCharacter, mockService);
      
      // Test basic properties
      expect(result.id).toBe(mockCharacter.id);
      expect(result.name).toBe('Alex Reeves');
      expect(result.type).toBe('Player');
      
      // Test relations with names
      expect(result.events).toHaveLength(1);
      expect(result.events[0]).toEqual(
        expect.objectContaining({
          id: 'event-id-1',
          name: 'Party begins'
        })
      );
      
      expect(result.ownedElements).toHaveLength(1);
      expect(result.ownedElements[0]).toEqual(
        expect.objectContaining({
          id: 'element-id-1',
          name: 'Memory Video 1'
        })
      );
    });
  });
  
  describe('mapElementWithNames', () => {
    it('should map an element with related entity names', async () => {
      const mockElement = mockService.MOCK_ELEMENTS[0];
      const result = await propertyMapper.mapElementWithNames(mockElement, mockService);
      
      // Test basic properties
      expect(result.id).toBe(mockElement.id);
      expect(result.name).toBe('Memory Video 1');
      expect(result.basicType).toBe('Memory Token Video');
      
      // Test relations with names
      expect(result.owner).toHaveLength(1);
      expect(result.owner[0]).toEqual(
        expect.objectContaining({
          id: 'char-id-1',
          name: 'Alex Reeves'
        })
      );
    });
  });
}); 