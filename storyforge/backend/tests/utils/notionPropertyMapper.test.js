const propertyMapper = require('../../src/utils/notionPropertyMapper');

describe('Notion Property Mapper', () => {
  describe('extractTitle', () => {
    it('should extract title from a valid notion title property', () => {
      const titleProperty = {
        title: [
          {
            plain_text: 'Test Title',
            annotations: {},
            type: 'text',
            text: { content: 'Test Title', link: null }
          }
        ]
      };
      
      expect(propertyMapper.extractTitle(titleProperty)).toBe('Test Title');
    });
    
    it('should return empty string for invalid title property', () => {
      const invalidProperty = {};
      expect(propertyMapper.extractTitle(invalidProperty)).toBe('');
      
      const emptyTitleProperty = { title: [] };
      expect(propertyMapper.extractTitle(emptyTitleProperty)).toBe('');
    });
  });
  
  describe('extractRichText', () => {
    it('should extract text from a valid notion rich text property', () => {
      const richTextProperty = {
        rich_text: [
          {
            plain_text: 'Rich Text Content',
            annotations: {},
            type: 'text',
            text: { content: 'Rich Text Content', link: null }
          }
        ]
      };
      
      expect(propertyMapper.extractRichText(richTextProperty)).toBe('Rich Text Content');
    });
    
    it('should return empty string for invalid rich text property', () => {
      const invalidProperty = {};
      expect(propertyMapper.extractRichText(invalidProperty)).toBe('');
      
      const emptyRichTextProperty = { rich_text: [] };
      expect(propertyMapper.extractRichText(emptyRichTextProperty)).toBe('');
    });
  });
  
  describe('extractSelect', () => {
    it('should extract value from a valid notion select property', () => {
      const selectProperty = {
        select: {
          name: 'Option 1',
          id: 'select-id',
          color: 'blue'
        }
      };
      
      expect(propertyMapper.extractSelect(selectProperty)).toBe('Option 1');
    });
    
    it('should return null for invalid select property', () => {
      const invalidProperty = {};
      expect(propertyMapper.extractSelect(invalidProperty)).toBeNull();
      
      const emptySelectProperty = { select: null };
      expect(propertyMapper.extractSelect(emptySelectProperty)).toBeNull();
    });
  });
  
  describe('extractRelation', () => {
    it('should extract ids from a valid notion relation property', () => {
      const relationProperty = {
        relation: [
          { id: 'rel-id-1' },
          { id: 'rel-id-2' }
        ]
      };
      
      const result = propertyMapper.extractRelation(relationProperty);
      expect(result).toEqual(['rel-id-1', 'rel-id-2']);
    });
    
    it('should return empty array for invalid relation property', () => {
      const invalidProperty = {};
      expect(propertyMapper.extractRelation(invalidProperty)).toEqual([]);
      
      const emptyRelationProperty = { relation: [] };
      expect(propertyMapper.extractRelation(emptyRelationProperty)).toEqual([]);
    });
  });

  describe('extractMultiSelect', () => {
    it('should extract values from a valid notion multi-select property', () => {
      const multiSelectProperty = {
        multi_select: [
          { name: 'Option A', id: 'ms-id-a', color: 'red' },
          { name: 'Option B', id: 'ms-id-b', color: 'green' },
        ]
      };
      expect(propertyMapper.extractMultiSelect(multiSelectProperty)).toEqual(['Option A', 'Option B']);
    });

    it('should return empty array for invalid or empty multi-select property', () => {
      expect(propertyMapper.extractMultiSelect({})).toEqual([]);
      expect(propertyMapper.extractMultiSelect({ multi_select: [] })).toEqual([]);
      expect(propertyMapper.extractMultiSelect({ multi_select: null })).toEqual([]);
    });
  });

  describe('extractUrl', () => {
    it('should extract value from a valid notion url property', () => {
      const urlProperty = { url: 'http://example.com' };
      expect(propertyMapper.extractUrl(urlProperty)).toBe('http://example.com');
    });

    it('should return null for invalid or empty url property', () => {
      expect(propertyMapper.extractUrl({})).toBeNull();
      expect(propertyMapper.extractUrl({ url: null })).toBeNull();
      expect(propertyMapper.extractUrl({ url: '' })).toBeNull();
    });
  });

  describe('extractDate', () => {
    it('should extract start date from a valid notion date property', () => {
      const dateProperty = { date: { start: '2023-01-01', end: null, time_zone: null } };
      expect(propertyMapper.extractDate(dateProperty)).toBe('2023-01-01');
    });

    it('should return null for invalid or empty date property', () => {
      expect(propertyMapper.extractDate({})).toBeNull();
      expect(propertyMapper.extractDate({ date: null })).toBeNull();
    });
  });

  describe('extractNumber', () => {
    it('should extract value from a valid notion number property', () => {
      const numberProperty = { number: 123 };
      expect(propertyMapper.extractNumber(numberProperty)).toBe(123);
      const zeroProperty = { number: 0 };
      expect(propertyMapper.extractNumber(zeroProperty)).toBe(0);
    });

    it('should return null for invalid or empty number property', () => {
      expect(propertyMapper.extractNumber({})).toBeNull();
      expect(propertyMapper.extractNumber({ number: null })).toBeNull();
      // The function checks `numberProperty.number === undefined || numberProperty.number === null`
      // So an empty object ` {} ` has `property.number` as undefined.
    });
  });

  describe('getProperty', () => {
    const mockProperties = {
      'Name': { title: [{ plain_text: 'Direct Name' }] },
      'Owned_Elements': { relation: [{id: 'el-1'}] },
      'Description/Text': { rich_text: [{ plain_text: 'Slash Text' }] },
      'Sub-Puzzles': { relation: [{id: 'pz-1'}] },
    };

    it('should find property by exact name', () => {
      expect(propertyMapper.getProperty(mockProperties, 'Name')).toEqual(mockProperties.Name);
    });

    it('should find property by snake_case name', () => {
      expect(propertyMapper.getProperty(mockProperties, 'Owned Elements')).toEqual(mockProperties.Owned_Elements);
    });

    it('should find property with slash in name', () => {
      expect(propertyMapper.getProperty(mockProperties, 'Description/Text')).toEqual(mockProperties['Description/Text']);
    });

    it('should find property with hyphen in name (converted to snake_case)', () => {
      // Assumes 'Sub-Puzzles' in Notion becomes 'Sub_Puzzles' in the actual data keys if that's the convention
      // Or, the getProperty logic handles this.
      // The logic tries `propertyName.replace(/-/g, '_')`
      expect(propertyMapper.getProperty(mockProperties, 'Sub-Puzzles')).toEqual(mockProperties['Sub-Puzzles']);
    });

    it('should return null and log a warning if property not found', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      expect(propertyMapper.getProperty(mockProperties, 'NonExistentProperty')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  // Tests for extract*ByName functions
  describe('extractRichTextByName', () => {
    it('should extract rich text using getProperty', () => {
      const props = { 'Details/Text': { rich_text: [{ plain_text: 'Details here' }] } };
      expect(propertyMapper.extractRichTextByName(props, 'Details/Text')).toBe('Details here');
    });
    it('should return empty string if property not found by name', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      expect(propertyMapper.extractRichTextByName({}, 'NonExistent')).toBe('');
      expect(consoleWarnSpy).toHaveBeenCalled(); // getProperty should warn
      consoleWarnSpy.mockRestore();
    });
  });

  describe('extractSelectByName', () => {
    it('should extract select using getProperty', () => {
      const props = { 'Status_Select': { select: { name: 'Active' } } };
      expect(propertyMapper.extractSelectByName(props, 'Status Select')).toBe('Active');
    });
    it('should return null if property not found by name', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      expect(propertyMapper.extractSelectByName({}, 'NonExistent')).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  // Import mock data for testing main mappers
  const { MOCK_CHARACTERS, MOCK_ELEMENTS, MOCK_PUZZLES, MOCK_TIMELINE_EVENTS, MOCK_DATA_BY_ID } = require('../services/__mocks__/notionService');
  const mockNotionService = require('../services/__mocks__/notionService');

  describe('mapCharacter', () => {
    it('should correctly map a raw Notion character object to a simplified format', () => {
      const rawCharacter = MOCK_CHARACTERS[0]; // Alex Reeves
      const mapped = propertyMapper.mapCharacter(rawCharacter);

      expect(mapped.id).toBe(rawCharacter.id);
      expect(mapped.name).toBe('Alex Reeves');
      expect(mapped.type).toBe('Player');
      expect(mapped.tier).toBe('Core');
      expect(mapped.logline).toBe('A talented engineer');
      expect(mapped.events).toEqual(['event-id-1']);
      expect(mapped.ownedElements).toEqual(['element-id-1']);
      expect(mapped.lastEdited).toBe(rawCharacter.last_edited_time);
      // Check other properties as needed, including undefined/empty cases if applicable
      expect(mapped.overview).toBe(''); // Assuming Overview_Key_Relationships is not in MOCK_CHARACTERS[0].properties
    });
  });


  describe('mapPuzzle', () => {
    it('should correctly map a raw Notion puzzle object', () => {
      const rawPuzzle = MOCK_PUZZLES[0]; // Locked Safe
      const mapped = propertyMapper.mapPuzzle(rawPuzzle);
      expect(mapped.id).toBe(rawPuzzle.id);
      expect(mapped.puzzle).toBe('Locked Safe');
      expect(mapped.owner).toEqual(['char-id-1']);
      expect(mapped.timing).toBe('Act 1');
      expect(mapped.rewards).toEqual(['element-id-1']);
      expect(mapped.narrativeThreads).toEqual(['Memory Drug']);
    });
  });

  describe('mapTimelineEvent', () => {
    it('should correctly map a raw Notion timeline event object', () => {
      const rawEvent = MOCK_TIMELINE_EVENTS[0]; // Party begins
      const mapped = propertyMapper.mapTimelineEvent(rawEvent);
      expect(mapped.id).toBe(rawEvent.id);
      expect(mapped.description).toBe('Party begins');
      expect(mapped.date).toBe('2023-01-01');
      expect(mapped.charactersInvolved).toEqual(['char-id-1', 'char-id-2']);
      expect(mapped.memoryEvidence).toEqual(['element-id-1']);
    });
  });

  // Asynchronous mappers (*WithNames)
  describe('mapCharacterWithNames', () => {
    it('should map character and resolve relation names using notionService', async () => {
      const rawCharacter = MOCK_CHARACTERS[0]; // Alex Reeves
      // Mock notionService.getPagesByIds responses
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => {
        if (ids.includes('event-id-1')) return [MOCK_TIMELINE_EVENTS[0]];
        if (ids.includes('element-id-1')) return [MOCK_ELEMENTS[0]];
        return [];
      });

      const mapped = await propertyMapper.mapCharacterWithNames(rawCharacter, mockNotionService);
      expect(mapped.name).toBe('Alex Reeves');
      expect(mapped.events).toEqual([{ id: 'event-id-1', name: 'Party begins' }]);
      expect(mapped.ownedElements).toEqual([{ id: 'element-id-1', name: 'Memory Video 1' }]);
      expect(mockNotionService.getPagesByIds).toHaveBeenCalled();
    });

    it('should handle errors during relation fetching gracefully', async () => {
      const rawCharacter = MOCK_CHARACTERS[0];
      mockNotionService.getPagesByIds.mockRejectedValue(new Error('Notion API failed'));
      const mapped = await propertyMapper.mapCharacterWithNames(rawCharacter, mockNotionService);
      expect(mapped.error).toBeDefined();
      expect(mapped.name).toBe('Alex Reeves'); // Should still map basic info
      expect(mapped.events).toBeUndefined(); // Relations would be undefined or empty due to error handling
    });
  });

  describe('mapElementWithNames', () => {
    it('should map element and resolve relation names', async () => {
      const rawElement = MOCK_ELEMENTS[0]; // Memory Video 1, Owner: char-id-1
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => {
        if (ids.includes('char-id-1')) return [MOCK_CHARACTERS[0]];
        // Add other relations if MOCK_ELEMENTS[0] is expanded
        return [];
      });

      const mapped = await propertyMapper.mapElementWithNames(rawElement, mockNotionService);
      expect(mapped.name).toBe('Memory Video 1');
      expect(mapped.owner).toEqual([{id: 'char-id-1', name: 'Alex Reeves'}]);
       // mapElementWithNames makes 8 calls to getPagesByIds in the current implementation
      expect(mockNotionService.getPagesByIds).toHaveBeenCalled();
    });

    it('should parse memory fields from Description/Text for memory-type elements', async () => {
      const rawMemoryElement = {
        id: 'mem-elem-1',
        properties: {
          Name: { title: [{ plain_text: 'RFID Memory Token' }] },
          'Basic Type': { select: { name: 'RFID Memory' } },
          'Description/Text': { 
            rich_text: [{ 
              plain_text: 'SF_RFID: [ABC123]\nSF_ValueRating: [4]\nSF_MemoryType: [Core]\nSF_Group: [Ephemeral Echo (x2.5)]' 
            }] 
          },
          Owner: { relation: [] }
        }
      };

      mockNotionService.getPagesByIds.mockResolvedValue([]);

      const mapped = await propertyMapper.mapElementWithNames(rawMemoryElement, mockNotionService);
      expect(mapped.name).toBe('RFID Memory Token');
      expect(mapped.basicType).toBe('RFID Memory');
      expect(mapped.properties).toBeDefined();
      expect(mapped.properties.parsed_sf_rfid).toBe('ABC123');
      expect(mapped.properties.sf_value_rating).toBe(4);
      expect(mapped.properties.sf_memory_type).toBe('Core');
      expect(mapped.properties.sf_group).toBe('Ephemeral Echo (x2.5)');
      expect(mapped.properties.sf_group_multiplier).toBe(2.5);
    });

    it('should not parse memory fields for non-memory type elements', async () => {
      const rawPropElement = {
        id: 'prop-elem-1',
        properties: {
          Name: { title: [{ plain_text: 'Regular Prop' }] },
          'Basic Type': { select: { name: 'Prop' } },
          'Description/Text': { 
            rich_text: [{ 
              plain_text: 'SF_RFID: [XYZ789]\nThis is just a regular prop' 
            }] 
          },
          Owner: { relation: [] }
        }
      };

      mockNotionService.getPagesByIds.mockResolvedValue([]);

      const mapped = await propertyMapper.mapElementWithNames(rawPropElement, mockNotionService);
      expect(mapped.name).toBe('Regular Prop');
      expect(mapped.basicType).toBe('Prop');
      expect(mapped.properties).toBeUndefined(); // Should not parse SF_ fields
    });

    it('should handle SF_Group without multiplier', async () => {
      const rawMemoryElement = {
        id: 'mem-elem-2',
        properties: {
          Name: { title: [{ plain_text: 'Memory Token' }] },
          'Basic Type': { select: { name: 'Memory Token Video' } },
          'Description/Text': { 
            rich_text: [{ 
              plain_text: 'SF_Group: [Standard Memory]' 
            }] 
          },
          Owner: { relation: [] }
        }
      };

      mockNotionService.getPagesByIds.mockResolvedValue([]);

      const mapped = await propertyMapper.mapElementWithNames(rawMemoryElement, mockNotionService);
      expect(mapped.properties.sf_group).toBe('Standard Memory');
      expect(mapped.properties.sf_group_multiplier).toBe(1.0); // Default multiplier
    });
  });

  describe('mapPuzzleWithNames', () => {
    beforeEach(() => {
      mockNotionService.getPagesByIds.mockReset();
    });

    it('should map puzzle and resolve relation names', async () => {
      const rawPuzzle = MOCK_PUZZLES[0]; // Locked Safe
      // Owner: char-id-1, Rewards: element-id-1
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => {
        if (ids.length === 0) return [];
        let results = [];
        if (ids.includes('char-id-1')) results.push(MOCK_CHARACTERS[0]);
        if (ids.includes('element-id-1')) results.push(MOCK_ELEMENTS[0]);
        // Add other relations if MOCK_PUZZLES[0] is expanded
        return results;
      });

      const mapped = await propertyMapper.mapPuzzleWithNames(rawPuzzle, mockNotionService);
      expect(mapped.puzzle).toBe('Locked Safe');
      expect(mapped.owner).toEqual([{ id: 'char-id-1', name: 'Alex Reeves' }]);
      expect(mapped.rewards).toEqual([{ id: 'element-id-1', name: 'Memory Video 1' }]);
      // mapPuzzleWithNames makes 6 calls: owner, lockedItem, puzzleElements, rewards, parentItem, subPuzzles
      expect(mockNotionService.getPagesByIds).toHaveBeenCalled();
    });

    it('should handle errors gracefully if notionService fails', async () => {
      const rawPuzzle = MOCK_PUZZLES[0];
      mockNotionService.getPagesByIds.mockRejectedValue(new Error('Service Down'));
      const mapped = await propertyMapper.mapPuzzleWithNames(rawPuzzle, mockNotionService);
      expect(mapped.error).toBe('Service Down');
      expect(mapped.puzzle).toBe('Locked Safe'); // Basic info should still be there
      expect(mapped.owner).toBeUndefined(); // Relations would be affected
    });
  });

  describe('mapTimelineEventWithNames', () => {
    beforeEach(() => {
      mockNotionService.getPagesByIds.mockReset();
    });

    it('should map timeline event and resolve relation names', async () => {
      const rawEvent = MOCK_TIMELINE_EVENTS[0]; // Party begins
      // Characters_Involved: char-id-1, char-id-2
      // Memory_Evidence: element-id-1
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => {
        if (ids.length === 0) return [];
        let results = [];
        if (ids.includes('char-id-1')) results.push(MOCK_CHARACTERS[0]);
        if (ids.includes('char-id-2')) results.push(MOCK_CHARACTERS[1]);
        if (ids.includes('element-id-1')) results.push(MOCK_ELEMENTS[0]);
        return results;
      });

      const mapped = await propertyMapper.mapTimelineEventWithNames(rawEvent, mockNotionService);
      expect(mapped.description).toBe('Party begins');
      expect(mapped.charactersInvolved).toEqual(expect.arrayContaining([
        { id: 'char-id-1', name: 'Alex Reeves' },
        { id: 'char-id-2', name: 'Marcus Blackwood' },
      ]));
      expect(mapped.charactersInvolved.length).toBe(2);
      expect(mapped.memoryEvidence).toEqual([{ id: 'element-id-1', name: 'Memory Video 1' }]);
      // mapTimelineEventWithNames makes 2 calls: charactersInvolved, memoryEvidence
      expect(mockNotionService.getPagesByIds).toHaveBeenCalled();
    });

    it('should handle errors gracefully', async () => {
      const rawEvent = MOCK_TIMELINE_EVENTS[0];
      mockNotionService.getPagesByIds.mockRejectedValue(new Error('Fetch relations failed'));
      const mapped = await propertyMapper.mapTimelineEventWithNames(rawEvent, mockNotionService);
      expect(mapped.error).toBe('Fetch relations failed');
      expect(mapped.description).toBe('Party begins');
      expect(mapped.charactersInvolved).toBeUndefined();
    });
  });

  describe('mapCharacterOverview', () => {
    it('should map only id and name from character', () => {
      const rawCharacter = {
        id: 'char-123',
        properties: {
          Name: { title: [{ plain_text: 'Test Character' }] },
          Type: { select: { name: 'Main' } }, // Should be ignored
          Tier: { select: { name: 'A' } } // Should be ignored
        }
      };

      const mapped = propertyMapper.mapCharacterOverview(rawCharacter);
      expect(mapped).toEqual({
        id: 'char-123',
        name: 'Test Character'
      });
      expect(mapped.type).toBeUndefined(); // Should not include other properties
    });

    it('should return null for invalid input', () => {
      expect(propertyMapper.mapCharacterOverview(null)).toBeNull();
      expect(propertyMapper.mapCharacterOverview({})).toBeNull();
      expect(propertyMapper.mapCharacterOverview({ id: 'test' })).toBeNull(); // No properties
    });
  });

  describe('mapTimelineEventWithNames - character mention parsing', () => {
    it('should parse @mentions from description when no characters in relation', async () => {
      const rawEvent = {
        id: 'event-123',
        properties: {
          Description: { title: [{ plain_text: '@John Doe meets @Jane Smith at the party' }] },
          Characters_Involved: { relation: [] }, // Empty relation
          'Memory/Evidence': { relation: [] }
        }
      };

      mockNotionService.getPagesByIds.mockResolvedValue([]);

      const mapped = await propertyMapper.mapTimelineEventWithNames(rawEvent, mockNotionService);
      expect(mapped.charactersInvolved).toEqual([
        { id: null, name: 'John Doe' },
        { id: null, name: 'Jane Smith' }
      ]);
    });

    it('should handle single-word character names in @mentions', async () => {
      const rawEvent = {
        id: 'event-124',
        properties: {
          Description: { title: [{ plain_text: '@Marcus arrives late' }] },
          Characters_Involved: { relation: [] }
        }
      };

      mockNotionService.getPagesByIds.mockResolvedValue([]);

      const mapped = await propertyMapper.mapTimelineEventWithNames(rawEvent, mockNotionService);
      expect(mapped.charactersInvolved).toEqual([
        { id: null, name: 'Marcus' }
      ]);
    });

    it('should use relation data when available instead of parsing @mentions', async () => {
      const rawEvent = {
        id: 'event-125',
        properties: {
          Description: { title: [{ plain_text: '@John Doe meets @Jane Smith' }] },
          Characters_Involved: { relation: [{ id: 'char-1' }] } // Has relation data
        }
      };

      mockNotionService.getPagesByIds.mockImplementation(async (ids) => {
        if (ids.includes('char-1')) return [{ 
          id: 'char-1', 
          properties: { Name: { title: [{ plain_text: 'John Doe' }] } } 
        }];
        return [];
      });

      const mapped = await propertyMapper.mapTimelineEventWithNames(rawEvent, mockNotionService);
      expect(mapped.charactersInvolved).toEqual([
        { id: 'char-1', name: 'John Doe' }
      ]);
      expect(mapped.charactersInvolved.length).toBe(1); // Should not include @Jane Smith
    });
  });

  describe('mapPuzzleWithNames - optimization', () => {
    it('should only make API calls for non-empty relations', async () => {
      const rawPuzzle = {
        id: 'puzzle-opt-1',
        properties: {
          Puzzle: { title: [{ plain_text: 'Optimized Puzzle' }] },
          Owner: { relation: [{ id: 'char-1' }] }, // Has data
          Locked_Item: { relation: [] }, // Empty
          Puzzle_Elements: { relation: [] }, // Empty
          Rewards: { relation: [{ id: 'elem-1' }] }, // Has data
          Parent_item: { relation: [] }, // Empty
          'Sub-Puzzles': { relation: [] } // Empty
        }
      };

      let apiCallCount = 0;
      mockNotionService.getPagesByIds.mockImplementation(async (ids) => {
        apiCallCount++;
        if (ids.includes('char-1')) return [MOCK_CHARACTERS[0]];
        if (ids.includes('elem-1')) return [MOCK_ELEMENTS[0]];
        return [];
      });

      const mapped = await propertyMapper.mapPuzzleWithNames(rawPuzzle, mockNotionService);
      
      // Should only make 2 API calls (for owner and rewards)
      expect(apiCallCount).toBe(2);
      expect(mapped.owner).toHaveLength(1);
      expect(mapped.rewards).toHaveLength(1);
      expect(mapped.lockedItem).toEqual([]);
      expect(mapped.puzzleElements).toEqual([]);
    });

    it('should handle timeout gracefully', async () => {
      const rawPuzzle = {
        id: 'puzzle-timeout',
        properties: {
          Puzzle: { title: [{ plain_text: 'Timeout Puzzle' }] },
          Owner: { relation: [{ id: 'char-1' }] }
        }
      };

      // Simulate a timeout
      mockNotionService.getPagesByIds.mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 20000)) // Will timeout
      );

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      const mapped = await propertyMapper.mapPuzzleWithNames(rawPuzzle, mockNotionService);
      
      expect(mapped.error).toContain('timeout');
      expect(mapped.puzzle).toBe('Timeout Puzzle');
      
      consoleErrorSpy.mockRestore();
    }, 15000); // Increase test timeout
  });

  describe('Edge cases', () => {
    it('should handle properties with various naming conventions', () => {
      const properties = {
        'Character-Puzzles': { relation: [{ id: 'p1' }] },
        'Memory/Evidence': { relation: [{ id: 'm1' }] },
        'Description_Solution': { rich_text: [{ plain_text: 'Text' }] },
        'Name With Spaces': { title: [{ plain_text: 'Value' }] }
      };

      // Test various property name transformations
      expect(propertyMapper.extractRelationByName(properties, 'Character Puzzles')).toEqual(['p1']);
      expect(propertyMapper.extractRelationByName(properties, 'Memory/Evidence')).toEqual(['m1']);
      expect(propertyMapper.extractRichTextByName(properties, 'Description/Solution')).toBe('Text');
      expect(propertyMapper.extractRelationByName(properties, 'Name With Spaces')).toEqual([]); // Not a relation
    });

    it('should handle malformed data gracefully', () => {
      // Test with various malformed inputs
      expect(propertyMapper.extractTitle({ title: 'not-an-array' })).toBe('');
      expect(propertyMapper.extractRichText({ rich_text: {} })).toBe('');
      expect(propertyMapper.extractSelect({ select: [] })).toBeNull();
      expect(propertyMapper.extractMultiSelect({ multi_select: 'not-array' })).toEqual([]);
      expect(propertyMapper.extractRelation({ relation: { not: 'array' } })).toEqual([]);
      expect(propertyMapper.extractUrl({ url: {} })).toBeNull();
      expect(propertyMapper.extractDate({ date: {} })).toBeNull();
      expect(propertyMapper.extractNumber({ number: 'not-a-number' })).toBeNull();
    });

    it('should handle multiple text segments in title and rich text', () => {
      const multiSegmentTitle = {
        title: [
          { plain_text: 'Part 1 ' },
          { plain_text: 'Part 2 ' },
          { plain_text: 'Part 3' }
        ]
      };
      expect(propertyMapper.extractTitle(multiSegmentTitle)).toBe('Part 1 Part 2 Part 3');

      const multiSegmentRichText = {
        rich_text: [
          { plain_text: 'Segment A ' },
          { plain_text: 'Segment B' }
        ]
      };
      expect(propertyMapper.extractRichText(multiSegmentRichText)).toBe('Segment A Segment B');
    });
  });

}); 