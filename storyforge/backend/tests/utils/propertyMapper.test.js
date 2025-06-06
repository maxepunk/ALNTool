const propertyMapper = require('../../src/utils/propertyMapper');
const { MOCK_CHARACTERS, MOCK_ELEMENTS, MOCK_PUZZLES, MOCK_TIMELINE_EVENTS } = require('../services/__mocks__/notionService');

describe('Property Mapper - Unit Tests', () => {
  describe('mapCharacter', () => {
    it('should correctly map a Character Notion page to a Character entity', () => {
      const rawCharacterPage = MOCK_CHARACTERS[0]; // Alex Reeves
      const mappedCharacter = propertyMapper.mapCharacter(rawCharacterPage);

      expect(mappedCharacter).toBeDefined();
      expect(mappedCharacter.id).toBe(rawCharacterPage.id);
      expect(mappedCharacter.name).toBe('Alex Reeves');
      expect(mappedCharacter.tier).toBe('Core');
      expect(mappedCharacter.logline).toBe('A talented engineer');
      // Updated based on new mapper
      expect(mappedCharacter.event_ids).toEqual(['event-id-1']);
      expect(mappedCharacter.owned_element_ids).toEqual(['element-id-1']);
    });

     it('should return null for an undefined page', () => {
      const mappedEntity = propertyMapper.mapCharacter(undefined);
      expect(mappedEntity).toBeNull();
    });
  });

  describe('mapElement', () => {
      it('should correctly map an Element Notion page to an Element entity', () => {
        const rawElementPage = MOCK_ELEMENTS[0]; // Memory Video 1
        const mappedElement = propertyMapper.mapElement(rawElementPage);

        expect(mappedElement).toBeDefined();
        expect(mappedElement.id).toBe(rawElementPage.id);
        expect(mappedElement.name).toBe('Memory Video 1');
        expect(mappedElement.type).toBe('Memory Token Video');
        expect(mappedElement.description).toBe('A corrupted memory video');
        expect(mappedElement.character_ids).toEqual(['char-id-1']);
      });
  });
  
  describe('mapPuzzle', () => {
      it('should correctly map a Puzzle Notion page to a Puzzle entity', () => {
        const rawPuzzlePage = MOCK_PUZZLES[0]; // Locked Safe
        const mappedPuzzle = propertyMapper.mapPuzzle(rawPuzzlePage);

        expect(mappedPuzzle).toBeDefined();
        expect(mappedPuzzle.id).toBe(rawPuzzlePage.id);
        expect(mappedPuzzle.name).toBe('Locked Safe');
        // This relies on the mock data having specific property names that the mapper expects
        expect(mappedPuzzle.timing).toBe('Act 1');
        expect(mappedPuzzle.description).toBe('A safe that is locked.');
      });
  });

  describe('mapTimelineEvent', () => {
      it('should correctly map a Timeline Event Notion page to a Timeline entity', () => {
        const rawTimelinePage = MOCK_TIMELINE_EVENTS[0]; // Party begins
        const mappedTimeline = propertyMapper.mapTimelineEvent(rawTimelinePage);

        expect(mappedTimeline).toBeDefined();
        expect(mappedTimeline.id).toBe(rawTimelinePage.id);
        expect(mappedTimeline.name).toBe('Party begins');
        expect(mappedTimeline.date).toBe('2023-01-01');
        expect(mappedTimeline.character_ids).toEqual(['char-id-1', 'char-id-2']);
        expect(mappedTimeline.element_ids).toEqual(['element-id-1']);
      });
  });

  describe('Helper functions', () => {
    it('getPlainText should extract text', () => {
      const prop = { title: [{ plain_text: 'Hello' }] };
      expect(propertyMapper.getPlainText(prop.title)).toBe('Hello');
    });

    it('getRelationIds should extract ids', () => {
      const prop = { relation: [{ id: '123' }, { id: '456' }] };
      expect(propertyMapper.getRelationIds(prop.relation)).toEqual(['123', '456']);
    });
  });
}); 