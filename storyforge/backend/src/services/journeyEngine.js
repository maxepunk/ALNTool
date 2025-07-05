const logger = require('../utils/logger');

// This file will contain the JourneyEngine class responsible for computing journey segments, detecting gaps, and building character journeys.
const { getDB } = require('../db/database'); // Adjust path as needed
const dbQueries = require('../db/queries'); // Adjust path

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
    const journeyData = dbQueries.getCharacterJourneyData(characterId);

    // Create nodes for each entity type
    journeyData.puzzles.forEach(puzzle => {
      nodes.push({
        id: `puzzle-${puzzle.id}`,
        type: 'activityNode', // Custom node type for styling
        data: { label: `Puzzle: ${puzzle.name}`, ...puzzle },
        position // Position will be calculated by the frontend layout algorithm
      });
    });

    journeyData.elements.forEach(element => {
      nodes.push({
        id: `element-${element.id}`,
        type: 'discoveryNode', // Custom node type
        data: { label: `Element: ${element.name}`, ...element },
        position
      });
    });

    journeyData.events.forEach(event => {
      nodes.push({
        id: `event-${event.id}`,
        type: 'loreNode', // Custom node type for historical events
        data: { label: `Event: ${event.description}`, ...event },
        position
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
          label: 'unlocks'
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
            label: 'rewards'
          });
        });
      } catch (e) {
        logger.warn(`Could not parse reward_ids for puzzle ${puzzle.id}`);
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
          type: 'contextEdge' // For special styling on the frontend
        });
      }
    });

    // TODO: Pass 4 (Interactions)

    return { nodes, edges };
  }

  /**
   * Builds the complete journey for a character as a narrative graph.
   * @param {string} characterId - The ID of the character.
   * @param {object} [journeyData={}] - Optional data for journey computation, used for testing or what-if scenarios.
   * @param {Array<object>} [journeyData.eventsData] - Optional override for events data.
   * @param {Array<object>} [journeyData.puzzlesData] - Optional override for puzzles data.
   * @param {Array<object>} [journeyData.elementsData] - Optional override for elements data.
   * @returns {Promise<object|null>} - The character's journey object with character_info and graph, or null if character not found.
   */
  async buildCharacterJourney(characterId, { eventsData: eventsDataOverride, puzzlesData: puzzlesDataOverride, elementsData: elementsDataOverride } = {}) {
    const isTestingWithOverride = eventsDataOverride || puzzlesDataOverride || elementsDataOverride;

    // 1. Attempt to retrieve a cached journey (skip cache if testing with overrides)
    if (!isTestingWithOverride) {
      const cachedJourney = await dbQueries.getCachedJourneyGraph(characterId);
      if (cachedJourney) {
        logger.debug(`Serving cached journey for character ${characterId}`);
        return cachedJourney;
      }
    }

    // 2. Compute the journey graph
    const characterData = dbQueries.getCharacterById(characterId);
    if (!characterData) {
      logger.error(`Character with ID ${characterId} not found.`);
      return null;
    }

    const journeyGraph = await this.buildJourneyGraph(characterId);

    // Fetch linked characters for this character
    const linkedCharacters = dbQueries.getLinkedCharacters(characterId);

    const computedJourney = {
      character_id: characterId,
      character_info: {
        ...characterData,
        linkedCharacters: linkedCharacters
      },
      graph: journeyGraph
    };

    // 3. Save to cache (skip if testing with overrides)
    if (!isTestingWithOverride) {
      await dbQueries.saveCachedJourneyGraph(characterId, computedJourney);
    }

    return computedJourney;
  }

}

module.exports = JourneyEngine;
