// This file will contain the JourneyEngine class responsible for computing journey segments, detecting gaps, and building character journeys.
const { getDB } = require('../db/database'); // Adjust path as needed
const dbQueries = require('../db/queries'); // Adjust path
const { parseTimingToMinutes } = require('../utils/timingParser');

class JourneyEngine {
  /**
   * Constructor for JourneyEngine.
   */
  constructor() {
    // this.db = db; // Remove if getDB is used directly
    this.GAME_DURATION_MINUTES = 90;
    this.INTERVAL_MINUTES = 5;
  }

  /**
   * Builds a directed graph representing the character's narrative journey.
   * @param {string} characterId - The ID of the character.
   * @returns {Promise<object>} - A graph object with 'nodes' and 'edges' arrays.
   */
  async buildJourneyGraph(characterId) {
    const nodes = [];
    const edges = [];
    const position = { x: 0, y: 0 }; // Initial position for layout

    // Pass 1: Node Collection - Get all relevant entities for the journey
    const journeyData = await dbQueries.getCharacterJourneyData(characterId);

    // Create nodes for each entity type
    journeyData.puzzles.forEach(puzzle => {
      nodes.push({
        id: `puzzle-${puzzle.id}`,
        type: 'activityNode', // Custom node type for styling
        data: { label: `Puzzle: ${puzzle.name}`, ...puzzle },
        position, // Position will be calculated by the frontend layout algorithm
      });
    });

    journeyData.elements.forEach(element => {
      nodes.push({
        id: `element-${element.id}`,
        type: 'discoveryNode', // Custom node type
        data: { label: `Element: ${element.name}`, ...element },
        position,
      });
    });

    journeyData.events.forEach(event => {
        nodes.push({
            id: `event-${event.id}`,
            type: 'loreNode', // Custom node type for historical events
            data: { label: `Event: ${event.description}`, ...event },
            position,
        });
    });


    // Pass 2: Dependency Edge Creation (Gameplay Graph)
    journeyData.puzzles.forEach(puzzle => {
      const puzzleNodeId = `puzzle-${puzzle.id}`;

      // Edge from required lock item to the puzzle
      if (puzzle.locked_item_id) {
        edges.push({
          id: `e-${puzzle.locked_item_id}-to-${puzzle.id}`,
          source: `element-${puzzle.locked_item_id}`,
          target: puzzleNodeId,
          label: 'unlocks',
        });
      }

      // Edges from the puzzle to its rewards
      try {
        const rewardIds = JSON.parse(puzzle.reward_ids || '[]');
        rewardIds.forEach(rewardId => {
          edges.push({
            id: `e-${puzzle.id}-to-${rewardId}`,
            source: puzzleNodeId,
            target: `element-${rewardId}`,
            label: 'rewards',
          });
        });
      } catch (e) {
        console.warn(`Could not parse reward_ids for puzzle ${puzzle.id}`);
      }
    });

    // Pass 3: Weaving the Lore and Gameplay Graphs
    journeyData.elements.forEach(element => {
      if (element.timeline_event_id) {
        edges.push({
          id: `context-e-${element.id}-to-event-${element.timeline_event_id}`,
          source: `element-${element.id}`,
          target: `event-${element.timeline_event_id}`,
          label: 'provides context for',
          type: 'contextEdge', // For special styling on the frontend
        });
      }
    });

    // TODO: Pass 4 (Interactions)

    return { nodes, edges };
  }

  /**
   * Builds the complete journey for a character, including segments and gaps.
   * @param {string} characterId - The ID of the character.
   * @param {object} [journeyData={}] - Optional data for journey computation, used for testing or what-if scenarios.
   * @param {Array<object>} [journeyData.eventsData] - Optional override for events data.
   * @param {Array<object>} [journeyData.puzzlesData] - Optional override for puzzles data.
   * @param {Array<object>} [journeyData.elementsData] - Optional override for elements data.
   * @returns {Promise<object|null>} - The character's journey object, or null if character not found.
   */
  async buildCharacterJourney(characterId, { eventsData: eventsDataOverride, puzzlesData: puzzlesDataOverride, elementsData: elementsDataOverride } = {}) {
    const isTestingWithOverride = eventsDataOverride || puzzlesDataOverride || elementsDataOverride;

    // TODO: This function needs to be re-evaluated.
    // It currently returns segments and gaps, but the new model is a graph.
    // For now, we will adapt it to call the new graph builder.

    // 1. Attempt to retrieve a cached journey
    // Caching needs to be adapted for graph data. For now, we skip it.
    
    // 2. Compute the journey graph
    const characterData = await dbQueries.getCharacterById(characterId);
    if (!characterData) {
      console.error(`Character with ID ${characterId} not found.`);
      return null;
    }

    const journeyGraph = await this.buildJourneyGraph(characterId);
    
    // Fetch linked characters for this character
    const linkedCharacters = await dbQueries.getLinkedCharacters(characterId);

    const computedJourney = {
      character_id: characterId,
      character_info: {
        ...characterData,
        linkedCharacters: linkedCharacters
      },
      // The frontend will now expect a 'graph' property instead of 'segments' and 'gaps'
      graph: journeyGraph, 
      segments: [], // Deprecated - send empty array for now
      gaps: [],     // Deprecated - send empty array for now
    };

    // 3. Caching logic will need to be updated to store graph data.
    // if (!isTestingWithOverride) {
    //   await dbQueries.saveCachedJourney(characterId, computedJourney);
    // }

    return computedJourney;
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
