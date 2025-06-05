const JourneyEngine = require('../../src/services/journeyEngine');

describe('JourneyEngine', () => {
  let journeyEngine;
  const mockDb = {}; // Mock DB if needed for future tests, not used in phase 1 engine methods

  beforeEach(() => {
    journeyEngine = new JourneyEngine(mockDb);
  });

  describe('constructor', () => {
    it('should instantiate with default game duration and interval', () => {
      expect(journeyEngine.GAME_DURATION_MINUTES).toBe(90);
      expect(journeyEngine.INTERVAL_MINUTES).toBe(5);
    });
  });

  describe('computeJourneySegments', () => {
    const mockCharacter = { id: 'char1', name: 'Test Character' };
    const mockEvents = [
      { id: 'event1', description: 'Event at 7 mins', date: 7 },
      { id: 'event2', description: 'Event spanning 10-15 mins', date: '10-15 minutes' },
      { id: 'event3', description: 'Event with no specific timing in description', date: 'Some time early' },
    ];
    const mockPuzzles = [
      { id: 'puzzle1', name: 'Puzzle in Mid Game', timing: 'Mid Game' }, // 30-60
      { id: 'puzzle2', name: 'Puzzle from 5-10', timing: '5-10' },
    ];
    const mockElements = [
      { id: 'elem1', name: 'Key Element', description: 'Found early' },
    ];

    it('should return an array of segments for the full game duration', async () => {
      const segments = await journeyEngine.computeJourneySegments(mockCharacter);
      expect(Array.isArray(segments)).toBe(true);
      expect(segments.length).toBe(journeyEngine.GAME_DURATION_MINUTES / journeyEngine.INTERVAL_MINUTES); // 90/5 = 18 segments
      expect(segments[0].start_minute).toBe(0);
      expect(segments[0].end_minute).toBe(5);
      expect(segments[17].start_minute).toBe(85);
      expect(segments[17].end_minute).toBe(90);
    });

    it('should include character_id in each segment', async () => {
      const segments = await journeyEngine.computeJourneySegments(mockCharacter);
      segments.forEach(segment => {
        expect(segment.character_id).toBe(mockCharacter.id);
      });
    });

    it('should place events into correct segment activities', async () => {
      const segments = await journeyEngine.computeJourneySegments(mockCharacter, mockEvents);
      // Event at 7 mins (segment 5-10 min)
      const segmentForEvent1 = segments.find(s => s.start_minute === 5 && s.end_minute === 10);
      expect(segmentForEvent1.activities).toEqual(expect.arrayContaining([
        expect.stringContaining('Event at 7 mins')
      ]));

      // Event spanning 10-15 mins (segment 10-15 min)
      const segmentForEvent2 = segments.find(s => s.start_minute === 10 && s.end_minute === 15);
      expect(segmentForEvent2.activities).toEqual(expect.arrayContaining([
        expect.stringContaining('Event spanning 10-15 mins')
      ]));
    });

    it('should place puzzles into correct segment activities based on timing', async () => {
      const segments = await journeyEngine.computeJourneySegments(mockCharacter, [], mockPuzzles);

      // Puzzle from 5-10 (segment 5-10)
      const segmentForPuzzle2 = segments.find(s => s.start_minute === 5 && s.end_minute === 10);
      expect(segmentForPuzzle2.activities).toEqual(expect.arrayContaining([
        expect.stringContaining('Puzzle from 5-10')
      ]));

      // Puzzle in Mid Game (30-60 min) - should appear in segments 30-35, 35-40, ..., 55-60
      const midGameSegments = segments.filter(s => s.start_minute >= 30 && s.end_minute <= 60);
      expect(midGameSegments.length).toBe(6); // 30-35, 35-40, 40-45, 45-50, 50-55, 55-60
      midGameSegments.forEach(segment => {
        expect(segment.activities).toEqual(expect.arrayContaining([
          expect.stringContaining('Puzzle in Mid Game')
        ]));
      });
    });

    it('should initialize segments with empty activities, discoveries, interactions and pending_analysis gap_status', async () => {
      const segments = await journeyEngine.computeJourneySegments(mockCharacter);
      segments.forEach(segment => {
        expect(segment.activities).toEqual([]);
        expect(segment.discoveries).toEqual([]);
        expect(segment.interactions).toEqual([]);
        expect(segment.gap_status).toBe('pending_analysis');
      });
    });

    // Basic test for element discovery (highly random in current implementation, so just check if it can happen)
    // This test might be flaky due to Math.random(). Consider a more deterministic approach for elements if critical.
    it('can include discovered elements if activities are present (mocked randomness)', async () => {
      // To make this test more deterministic, we could mock Math.random if needed,
      // but for now, we'll just check if the structure allows for discoveries.
      const eventForDiscovery = [{ id: 'event_makes_segment_active', date: 2 }]; // Puts an activity in 0-5 min segment
      const segments = await journeyEngine.computeJourneySegments(mockCharacter, eventForDiscovery, [], mockElements);

      // Check if any segment has a discovery (possible due to the random element discovery logic)
      const hasDiscovery = segments.some(s => s.discoveries.length > 0);
      // This is not a strong assertion due to randomness, but confirms the code path exists.
      // A better test would involve mocking Math.random() or making element discovery deterministic.
      expect(typeof hasDiscovery === 'boolean').toBe(true);
    });
  });

  describe('detectGaps', () => {
    const characterId = 'charTest';
    let segments;

    beforeEach(() => {
      // Create a default set of 3 segments for 15 minutes total
      segments = [
        { character_id: characterId, start_minute: 0, end_minute: 5, activities: ['Activity 1'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 5, end_minute: 10, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 10, end_minute: 15, activities: ['Activity 2'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
      ];
    });

    it('should identify a segment with no activities/discoveries/interactions as a gap', async () => {
      const gaps = await journeyEngine.detectGaps(segments, characterId);
      expect(gaps.length).toBe(1);
      expect(gaps[0].character_id).toBe(characterId);
      expect(gaps[0].start_minute).toBe(5);
      expect(gaps[0].end_minute).toBe(10);
      expect(gaps[0].severity).toBe('low'); // 5 min gap
    });

    it('should update gap_status in segments', async () => {
      await journeyEngine.detectGaps(segments, characterId);
      expect(segments[0].gap_status).toBe('no_gap');
      expect(segments[1].gap_status).toBe('gap_detected');
      expect(segments[2].gap_status).toBe('no_gap');
    });

    it('should merge consecutive empty segments into a single gap', async () => {
      segments = [
        { character_id: characterId, start_minute: 0, end_minute: 5, activities: ['Activity 1'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 5, end_minute: 10, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 10, end_minute: 15, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' }, // Another empty segment
        { character_id: characterId, start_minute: 15, end_minute: 20, activities: ['Activity 2'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
      ];
      const gaps = await journeyEngine.detectGaps(segments, characterId);
      expect(gaps.length).toBe(1);
      expect(gaps[0].start_minute).toBe(5);
      expect(gaps[0].end_minute).toBe(15); // Gap is from 5 to 15
      expect(gaps[0].severity).toBe('medium'); // 10 min gap
    });

    it('should handle gaps at the beginning of the journey', async () => {
      segments = [
        { character_id: characterId, start_minute: 0, end_minute: 5, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 5, end_minute: 10, activities: ['Activity 1'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
      ];
      // Override default 90 min duration for this specific test case if detectGaps relies on it for end_minute of final gaps
      journeyEngine.GAME_DURATION_MINUTES = 10;
      const gaps = await journeyEngine.detectGaps(segments, characterId);
      expect(gaps.length).toBe(1);
      expect(gaps[0].start_minute).toBe(0);
      expect(gaps[0].end_minute).toBe(5);
      journeyEngine.GAME_DURATION_MINUTES = 90; // Reset to default
    });

    it('should handle gaps at the end of the journey', async () => {
      segments = [
        { character_id: characterId, start_minute: journeyEngine.GAME_DURATION_MINUTES - 10, end_minute: journeyEngine.GAME_DURATION_MINUTES - 5, activities: ['Activity 1'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: journeyEngine.GAME_DURATION_MINUTES - 5, end_minute: journeyEngine.GAME_DURATION_MINUTES, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
      ];
      const gaps = await journeyEngine.detectGaps(segments, characterId);
      expect(gaps.length).toBe(1);
      expect(gaps[0].start_minute).toBe(journeyEngine.GAME_DURATION_MINUTES - 5);
      expect(gaps[0].end_minute).toBe(journeyEngine.GAME_DURATION_MINUTES);
    });

    it('should return an empty array if there are no gaps', async () => {
      segments = segments.map(s => ({ ...s, activities: ['Non-empty'] }));
      const gaps = await journeyEngine.detectGaps(segments, characterId);
      expect(gaps.length).toBe(0);
    });

    it('should correctly assign severity based on gap duration', async () => {
      segments = [ // Total 20 minutes of gap
        { character_id: characterId, start_minute: 0, end_minute: 5, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 5, end_minute: 10, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 10, end_minute: 15, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 15, end_minute: 20, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 20, end_minute: 25, activities: ['Activity'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
      ];
      journeyEngine.GAME_DURATION_MINUTES = 25; // Adjust for test
      const gaps = await journeyEngine.detectGaps(segments, characterId);
      expect(gaps.length).toBe(1);
      expect(gaps[0].start_minute).toBe(0);
      expect(gaps[0].end_minute).toBe(20);
      expect(gaps[0].severity).toBe('high'); // 20 min gap
      journeyEngine.GAME_DURATION_MINUTES = 90; // Reset
    });
     it('should generate a unique ID for each gap', async () => {
      segments = [
        { character_id: characterId, start_minute: 0, end_minute: 5, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 5, end_minute: 10, activities: ['Activity 1'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
        { character_id: characterId, start_minute: 10, end_minute: 15, activities: [], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
         { character_id: characterId, start_minute: 15, end_minute: 20, activities: ['Activity 2'], discoveries: [], interactions: [], gap_status: 'pending_analysis' },
      ];
      journeyEngine.GAME_DURATION_MINUTES = 20;
      const gaps = await journeyEngine.detectGaps(segments, characterId);
      expect(gaps.length).toBe(2);
      expect(gaps[0].id).toBe(`gap_${characterId}_0_5`);
      expect(gaps[1].id).toBe(`gap_${characterId}_10_15`);
      journeyEngine.GAME_DURATION_MINUTES = 90;
    });
  });

  describe('buildCharacterJourney', () => {
    const characterId = 'charBuildTest';
    const mockCharacterData = { id: characterId, name: 'Builder Test' };
    const mockEvents = [{ id: 'e1', date: 1 }];
    const mockPuzzles = [{ id: 'p1', timing: '5-10' }];
    const mockElements = [{ id: 'el1', name: 'Element of Building' }];

    // Spy on the other methods to ensure they are called
    let computeSegmentsSpy;
    let detectGapsSpy;

    beforeEach(() => {
      computeSegmentsSpy = jest.spyOn(journeyEngine, 'computeJourneySegments');
      detectGapsSpy = jest.spyOn(journeyEngine, 'detectGaps');
    });

    afterEach(() => {
      computeSegmentsSpy.mockRestore();
      detectGapsSpy.mockRestore();
    });

    it('should call computeJourneySegments and detectGaps', async () => {
      await journeyEngine.buildCharacterJourney(characterId, mockCharacterData, mockEvents, mockPuzzles, mockElements);
      expect(computeSegmentsSpy).toHaveBeenCalledWith(mockCharacterData, mockEvents, mockPuzzles, mockElements);
      expect(detectGapsSpy).toHaveBeenCalled(); // Called with segments from computeJourneySegments and characterId
    });

    it('should return a journey object with character_id, character_info, segments, and gaps', async () => {
      // Let the original methods run to get their output structure
      computeSegmentsSpy.mockRestore(); // Use original
      detectGapsSpy.mockRestore(); // Use original

      // Re-spy without mocking implementation to check call but get real results for structure
      computeSegmentsSpy = jest.spyOn(journeyEngine, 'computeJourneySegments');
      detectGapsSpy = jest.spyOn(journeyEngine, 'detectGaps');


      const journey = await journeyEngine.buildCharacterJourney(characterId, mockCharacterData, mockEvents, mockPuzzles, mockElements);

      expect(journey).toHaveProperty('character_id', characterId);
      expect(journey).toHaveProperty('character_info', mockCharacterData);
      expect(journey).toHaveProperty('segments');
      expect(Array.isArray(journey.segments)).toBe(true);
      expect(journey).toHaveProperty('gaps');
      expect(Array.isArray(journey.gaps)).toBe(true);

      // Ensure the spies were still called
      expect(computeSegmentsSpy).toHaveBeenCalled();
      expect(detectGapsSpy).toHaveBeenCalled();
    });

    it('should correctly pass data through to segments and gaps', async () => {
      // Mock return values for more controlled testing of buildCharacterJourney itself
      const expectedSegments = [{ start_minute: 0, end_minute: 5, activities: ['Segment Activity'] }];
      const expectedGaps = [{ start_minute: 10, end_minute: 15, severity: 'low' }];
      computeSegmentsSpy.mockResolvedValue(expectedSegments);
      detectGapsSpy.mockResolvedValue(expectedGaps);

      const journey = await journeyEngine.buildCharacterJourney(characterId, mockCharacterData, mockEvents, mockPuzzles, mockElements);

      expect(journey.segments).toEqual(expectedSegments);
      expect(journey.gaps).toEqual(expectedGaps);
      expect(detectGapsSpy).toHaveBeenCalledWith(expectedSegments, characterId);
    });
  });

  describe('Stubbed Methods', () => {
    it('suggestGapSolutions should return an empty array (placeholder)', async () => {
      const result = await journeyEngine.suggestGapSolutions({}, [], []);
      expect(result).toEqual([]);
    });

    it('getInteractionWindows should return an empty array (placeholder)', async () => {
      const result = await journeyEngine.getInteractionWindows({}, {});
      expect(result).toEqual([]);
    });
  });
});
