const propertyMapper = require('../../src/utils/propertyMapper');
const { MOCK_CHARACTERS, MOCK_ELEMENTS, MOCK_PUZZLES, MOCK_TIMELINE_EVENTS } = require('../services/__mocks__/notionService'); // Re-use mock data structures for input

describe('Property Mapper - Unit Tests', () => {
  describe('mapNotionPageToEntity', () => {
    it('should correctly map a Character Notion page to a Character entity', () => {
      const rawCharacterPage = MOCK_CHARACTERS[0]; // Alex Reeves
      const mappedCharacter = propertyMapper.mapNotionPageToEntity(rawCharacterPage, 'Character');

      expect(mappedCharacter).toBeDefined();
      expect(mappedCharacter.id).toBe(rawCharacterPage.id);
      expect(mappedCharacter.last_edited_time).toBe(rawCharacterPage.last_edited_time);
      expect(mappedCharacter.name).toBe('Alex Reeves');
      expect(mappedCharacter.type).toBe('Player');
      expect(mappedCharacter.tier).toBe('Core');
      expect(mappedCharacter.characterLogline).toBe('A talented engineer');
      expect(mappedCharacter.events).toEqual([{ id: 'event-id-1' }]);
      expect(mappedCharacter.ownedElements).toEqual([{ id: 'element-id-1' }]);
      // Add checks for all properties defined in PRD for Characters if mapNotionPageToEntity handles them
    });

    it('should correctly map an Element Notion page to an Element entity', () => {
      const rawElementPage = MOCK_ELEMENTS[0]; // Memory Video 1
      const mappedElement = propertyMapper.mapNotionPageToEntity(rawElementPage, 'Element');

      expect(mappedElement).toBeDefined();
      expect(mappedElement.id).toBe(rawElementPage.id);
      expect(mappedElement.name).toBe('Memory Video 1');
      expect(mappedElement.basicType).toBe('Memory Token Video');
      expect(mappedElement.owner).toEqual([{ id: 'char-id-1' }]);
      expect(mappedElement.descriptionText).toBe('A corrupted memory video');
      // Add checks for all properties defined in PRD for Elements
    });
    
    it('should correctly map a Puzzle Notion page to a Puzzle entity', () => {
      const rawPuzzlePage = MOCK_PUZZLES[0]; // Locked Safe
      const mappedPuzzle = propertyMapper.mapNotionPageToEntity(rawPuzzlePage, 'Puzzle');

      expect(mappedPuzzle).toBeDefined();
      expect(mappedPuzzle.id).toBe(rawPuzzlePage.id);
      expect(mappedPuzzle.puzzle).toBe('Locked Safe');
      expect(mappedPuzzle.owner).toEqual([{ id: 'char-id-1' }]);
      expect(mappedPuzzle.timing).toBe('Act 1');
      expect(mappedPuzzle.rewards).toEqual([{ id: 'element-id-1' }]);
      expect(mappedPuzzle.narrativeThreads).toEqual(['Memory Drug']);
      // Add checks for all properties defined in PRD for Puzzles
    });

    it('should correctly map a Timeline Event Notion page to a Timeline entity', () => {
      const rawTimelinePage = MOCK_TIMELINE_EVENTS[0]; // Party begins
      const mappedTimeline = propertyMapper.mapNotionPageToEntity(rawTimelinePage, 'Timeline');

      expect(mappedTimeline).toBeDefined();
      expect(mappedTimeline.id).toBe(rawTimelinePage.id);
      expect(mappedTimeline.description).toBe('Party begins');
      expect(mappedTimeline.date).toBe('2023-01-01');
      expect(mappedTimeline.charactersInvolved).toEqual([{ id: 'char-id-1' }, { id: 'char-id-2' }]);
      expect(mappedTimeline.memoryEvidence).toEqual([{ id: 'element-id-1' }]);
      // Add checks for all properties defined in PRD for Timeline events
    });

    it('should return null or a minimal object for an undefined page', () => {
      const mappedEntity = propertyMapper.mapNotionPageToEntity(undefined, 'Character');
      // Define expected behavior: could be null, or an object with an id if that's how it's handled.
      // For this example, let's assume it returns null or an empty object for safety.
      expect(mappedEntity).toBeFalsy(); // Or expect(mappedEntity).toEqual({});
    });

    it('should handle missing optional properties gracefully', () => {
      const characterWithMissingProps = {
        id: 'char-id-minimal',
        properties: {
          Name: { title: [{ plain_text: 'Minimal Character' }] },
          // Tier, Type, etc., are missing
        },
        last_edited_time: '2023-01-03',
      };
      const mappedCharacter = propertyMapper.mapNotionPageToEntity(characterWithMissingProps, 'Character');
      expect(mappedCharacter.name).toBe('Minimal Character');
      expect(mappedCharacter.tier).toBeUndefined(); // Or null, depending on implementation
      expect(mappedCharacter.type).toBeUndefined();
    });
  });

  // describe('mapNotionProperties', () => { ... }); // If this is a public helper used by mapNotionPageToEntity
  // describe('extractRichText', () => { ... });
  // describe('extractSelect', () => { ... });
  // describe('extractMultiSelect', () => { ... });
  // describe('extractRelation', () => { ... });
  // describe('extractDate', () => { ... });
  // Add tests for other specific property extractor functions if they are public and complex

  describe('mapEntityWithNames', () => {
    // This function is more complex as it involves fetching related names.
    // It would typically be tested by mocking the functions that fetch related names (e.g., from notionService or a cache).
    // For unit tests, we assume the basic mapping (mapNotionPageToEntity) works, and test the name enrichment.
    
    // Example for mapCharacterWithNames - others would be similar
    it('should enrich a mapped Character entity with names for its relations', async () => {
      const mappedCharacter = {
        id: 'char-id-1',
        name: 'Alex Reeves',
        events: [{ id: 'event-id-1' }],
        ownedElements: [{ id: 'element-id-1' }],
        // other mapped props
      };
      const mockAllEntities = {
        'event-id-1': { id: 'event-id-1', name: 'Party begins', type: 'Timeline' },
        'element-id-1': { id: 'element-id-1', name: 'Memory Video 1', type: 'Element' },
      };

      // Assuming mapCharacterWithNames (or a generic mapEntityWithNames) takes the mapped entity
      // and a way to look up names (e.g., a map or a function that calls the service)
      const enrichedCharacter = await propertyMapper.mapCharacterWithNames(mappedCharacter, mockAllEntities);

      expect(enrichedCharacter.events[0]).toHaveProperty('name', 'Party begins');
      expect(enrichedCharacter.ownedElements[0]).toHaveProperty('name', 'Memory Video 1');
    });

    it('should handle relations with missing names gracefully in mapCharacterWithNames', async () => {
        const mappedCharacter = {
            id: 'char-id-1',
            name: 'Alex Reeves',
            events: [{ id: 'event-id-unknown' }], // This one won't be in mockAllEntities
        };
        const mockAllEntities = {
            'event-id-1': { id: 'event-id-1', name: 'Party begins', type: 'Timeline' },
        };
  
        const enrichedCharacter = await propertyMapper.mapCharacterWithNames(mappedCharacter, mockAllEntities);
        expect(enrichedCharacter.events[0]).toEqual({ id: 'event-id-unknown' }); // Should not have name property or have it as undefined
      });
  });
  
  // TODO: Add tests for specific helper functions within propertyMapper if they are complex and exported, e.g.,
  // - createSnippet
  // - various property extractors (extractText, extractSelect, extractRelation etc.)
}); 