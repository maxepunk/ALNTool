// This file will contain the JourneyEngine class responsible for computing journey segments, detecting gaps, and building character journeys.

class JourneyEngine {
  /**
   * Constructor for JourneyEngine.
   * @param {object} db - Optional database instance for helper methods.
   */
  constructor(db = null) {
    this.db = db; // Store db instance if needed for internal helpers
    this.GAME_DURATION_MINUTES = 90;
    this.INTERVAL_MINUTES = 5;
  }

  /**
   * Computes journey segments for a character based on events, puzzles, and elements.
   * @param {object} character - The character object.
   * @param {Array<object>} events - Array of event objects.
   * @param {Array<object>} puzzles - Array of puzzle objects.
   * @param {Array<object>} elements - Array of element objects.
   * @returns {Promise<Array<object>>} - An array of journey segment objects.
   */
  async computeJourneySegments(character, events = [], puzzles = [], elements = []) {
    const segments = [];
    // For phase 1, we assume events might have a 'minute' or 'date' (parsable to minute) property.
    // Puzzles might have a 'timing' string (e.g., "Early Game", "Mid Game", "Late Game", or specific minutes).
    // Elements might be discovered through events or puzzles.

    for (let currentTime = 0; currentTime < this.GAME_DURATION_MINUTES; currentTime += this.INTERVAL_MINUTES) {
      const segment = {
        character_id: character.id, // Assuming character object has an id
        start_minute: currentTime,
        end_minute: currentTime + this.INTERVAL_MINUTES,
        activities: [], // Things the character does
        discoveries: [], // Things the character learns or finds
        interactions: [], // Interactions with other characters (placeholder for now)
        gap_status: 'pending_analysis', // Will be updated by detectGaps
      };

      // Placeholder logic for associating events, puzzles, elements with the current time segment.
      // This will need refinement based on actual data structures from Notion/DB.

      // Example: Check events that fall into this time segment
      events.forEach(event => {
        // Assuming event.minute is the specific minute it occurs
        // Or event.date could be a timestamp or a string like "0-15 minutes"
        let eventMinute = -1;
        if (typeof event.date === 'number') { // Direct minute provided
            eventMinute = event.date;
        } else if (typeof event.date === 'string') {
            // Attempt to parse "X minutes" or "X-Y minutes" (takes start of range)
            const simpleMinuteMatch = event.date.match(/^(\d+)(-(\d+))?\s*minutes$/i);
            if (simpleMinuteMatch && simpleMinuteMatch[1]) {
                eventMinute = parseInt(simpleMinuteMatch[1], 10);
            }
            // Placeholder for ISO date string parsing (e.g., "2023-10-26T12:00:00.000Z")
            // This would require a reference game start time and date-fns or similar.
            // Example:
            // else if (event.date.includes('T')) { /* try parsing as ISO */ eventMinute = parseAndConvertDateToGameMinute(event.date); }
            // For now, this engine primarily expects a direct minute or simple "X minutes" string.
            // The propertyMapper should ideally prioritize a direct "Game Minute" field from Notion.
            else {
                // console.warn(`Event ${event.id} has unparsable date string: ${event.date}. Needs specific 'Game Minute' property or enhanced parsing.`);
            }
        }

        if (eventMinute !== -1 && eventMinute >= segment.start_minute && eventMinute < segment.end_minute) {
          segment.activities.push(`Participated in event: ${event.name || event.description || event.id}`);
        }
      });

      // Example: Check puzzles active in this segment
      puzzles.forEach(puzzle => {
        let puzzleStart = -1, puzzleEnd = -1;
        if (typeof puzzle.timing === 'string') {
            const rangeMatch = puzzle.timing.match(/^(\d+)\s*-\s*(\d+)$/);
            const minuteMatch = puzzle.timing.match(/^minute\s+(\d+)$/i);

            if (rangeMatch) {
                [puzzleStart, puzzleEnd] = [parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10)];
            } else if (minuteMatch) {
                puzzleStart = parseInt(minuteMatch[1], 10);
                puzzleEnd = puzzleStart + this.INTERVAL_MINUTES; // Assume puzzle duration is one interval if single minute given
            } else if (puzzle.timing.toLowerCase() === 'early game') {
                [puzzleStart, puzzleEnd] = [0, 30];
            } else if (puzzle.timing.toLowerCase() === 'mid game') {
                [puzzleStart, puzzleEnd] = [30, 60];
            } else if (puzzle.timing.toLowerCase() === 'late game') {
                [puzzleStart, puzzleEnd] = [60, 90];
            }
            // Relational timings like "Between Event A and B" are not handled here and would require more complex logic.
            else {
                // console.warn(`Puzzle ${puzzle.id} has unparsable timing string: ${puzzle.timing}`);
            }
        }

        if (puzzleStart !== -1 && puzzleEnd !== -1 &&
            segment.start_minute < puzzleEnd && segment.end_minute > puzzleStart) {
          segment.activities.push(`Engaged with puzzle: ${puzzle.name || puzzle.id}`);
        }
      });

      // Example: Check elements discovered (highly dependent on how elements are linked to events/puzzles)
      // For now, let's assume an element might be linked to an event that happens in this segment.
      elements.forEach(element => {
          // This is very simplified. In reality, element discovery would be tied to
          // completing a puzzle, a specific outcome of an event, or a character interaction.
          // We might need to check if an event/puzzle in *this segment* leads to discovering this element.
          if(segment.activities.length > 0 && Math.random() < 0.1) { // Randomly discover an element if active
            segment.discoveries.push(`Discovered element: ${element.name || element.id}`);
          }
      });


      segments.push(segment);
    }
    return segments;
  }

  /**
   * Detects gaps in character journey based on segments.
   * @param {Array<object>} segments - Array of journey segment objects.
   * @param {string} characterId - The ID of the character for whom gaps are being detected.
   * @returns {Promise<Array<object>>} - An array of gap objects.
   */
  async detectGaps(segments, characterId) {
    const gaps = [];
    let currentGapStart = -1;

    segments.forEach((segment, index) => {
      const isSignificant = segment.activities.length > 0 || segment.discoveries.length > 0 || segment.interactions.length > 0;
      segment.gap_status = isSignificant ? 'no_gap' : 'gap_detected';

      if (!isSignificant && currentGapStart === -1) {
        // Start of a new potential gap
        currentGapStart = segment.start_minute;
      } else if (isSignificant && currentGapStart !== -1) {
        // End of the current gap
        gaps.push({
          id: `gap_${characterId}_${currentGapStart}_${segment.start_minute}`, // Generate a unique ID for the gap
          character_id: characterId,
          start_minute: currentGapStart,
          end_minute: segment.start_minute, // Gap ends when significant activity resumes
          severity: (segment.start_minute - currentGapStart > 15) ? "high" : ((segment.start_minute - currentGapStart > 10) ? "medium" : "low"),
          suggested_solutions: "[]", // Placeholder
        });
        currentGapStart = -1;
      }
    });

    // If the journey ends with a gap
    if (currentGapStart !== -1) {
      gaps.push({
        id: `gap_${characterId}_${currentGapStart}_${this.GAME_DURATION_MINUTES}`,
        character_id: characterId,
        start_minute: currentGapStart,
        end_minute: this.GAME_DURATION_MINUTES,
        severity: (this.GAME_DURATION_MINUTES - currentGapStart > 15) ? "high" : ((this.GAME_DURATION_MINUTES - currentGapStart > 10) ? "medium" : "low"),
        suggested_solutions: "[]",
      });
    }
    return gaps;
  }

  /**
   * Builds the complete journey for a character, including segments and gaps.
   * @param {string} characterId - The ID of the character.
   * @param {object} characterData - The comprehensive data for the character.
   * @param {Array<object>} eventsData - Array of all event objects.
   * @param {Array<object>} puzzlesData - Array of all puzzle objects.
   * @param {Array<object>} elementsData - Array of all element objects.
   * @returns {Promise<object>} - The character's journey object.
   */
  async buildCharacterJourney(characterId, characterData, eventsData, puzzlesData, elementsData) {
    // Filter events, puzzles, elements relevant to this character if necessary.
    // For phase 1, we assume the input data might already be character-specific or easily filterable.
    // This is a placeholder for more complex filtering logic if events/puzzles/elements are not directly tied to characters in the input.
    const relevantEvents = eventsData; // .filter(e => e.related_character_ids.includes(characterId));
    const relevantPuzzles = puzzlesData; // .filter(p => p.related_character_ids.includes(characterId));
    const relevantElements = elementsData; // .filter(el => el.related_character_ids.includes(characterId));


    const segments = await this.computeJourneySegments(characterData, relevantEvents, relevantPuzzles, relevantElements);
    const gaps = await this.detectGaps(segments, characterId);

    return {
      character_id: characterId,
      character_info: characterData,
      segments: segments,
      gaps: gaps,
    };
  }

  /**
   * Stub for suggesting solutions to fill identified gaps.
   * @param {object} gap - The gap object.
   * @param {Array<object>} allElements - All available element objects.
   * @param {Array<object>} allPuzzles - All available puzzle objects.
   * @returns {Promise<Array<object>>} - Placeholder for suggested solutions.
   */
  async suggestGapSolutions(gap, allElements, allPuzzles) {
    const suggestions = [];
    const gapDuration = gap.end_minute - gap.start_minute;

    if (gap.severity === 'low' || gapDuration <= 5) {
      suggestions.push({
        id: 'suggestion_low_1',
        type: 'discovery',
        description: 'Consider adding a small discovery or observation.',
        details: { estimated_time: 5, related_elements: [] }
      });
      suggestions.push({
        id: 'suggestion_low_2',
        type: 'interaction',
        description: 'Consider a brief interaction with another character or an element.',
        details: { estimated_time: 5, related_characters: [], related_elements: [] }
      });
    } else if (gap.severity === 'medium' || (gapDuration > 5 && gapDuration <= 10)) {
      suggestions.push({
        id: 'suggestion_medium_1',
        type: 'element',
        description: 'Consider introducing a minor puzzle or a significant element.',
        details: { estimated_time: 10, related_elements: [] }
      });
      suggestions.push({
        id: 'suggestion_medium_2',
        type: 'puzzle',
        description: 'A simple puzzle could fit here.',
        details: { estimated_time: 10, difficulty: 'easy' }
      });
    } else if (gap.severity === 'high' || gapDuration > 10) {
      suggestions.push({
        id: 'suggestion_high_1',
        type: 'activity',
        description: 'Consider a more complex activity or a multi-step element interaction.',
        details: { estimated_time: 15, steps: 3 }
      });
      suggestions.push({
        id: 'suggestion_high_2',
        type: 'element_interaction',
        description: 'A multi-step interaction with a key element could be engaging.',
        details: { estimated_time: 15, related_elements: [], required_items: [] }
      });
    }

    // console.log('Suggesting solutions for gap:', gap, 'Generated suggestions:', suggestions);
    // Parameters allElements and allPuzzles are kept for future, more advanced implementations.
    return suggestions;
  }

  /**
   * Stub for identifying interaction windows between two characters.
   * @param {object} characterAJourney - Journey object for character A.
   * @param {object} characterBJourney - Journey object for character B.
   * @returns {Promise<Array<object>>} - Placeholder for interaction windows.
   */
  async getInteractionWindows(characterAJourney, characterBJourney) {
    // TODO: Implement logic to compare two character journeys and find overlapping segments
    // where they might interact. This would involve looking at their locations (if available),
    // common events, or puzzles they might both be involved in.
    console.log('getInteractionWindows is a stub and needs implementation.', characterAJourney, characterBJourney);
    return []; // Placeholder
  }
}

module.exports = JourneyEngine;
