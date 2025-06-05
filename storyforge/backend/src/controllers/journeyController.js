const JourneyEngine = require('../services/journeyEngine');
const NotionService = require('../services/notionService'); // Assuming this path and service structure
const { getDB } = require('../db/database'); // For JourneyEngine if it needs direct DB access later

// Instantiate services
// For NotionService, it might be a class or a set of exported functions.
// If it's a class: const notionService = new NotionService();
// If it's functions, we'll call them directly: NotionService.someFunction();
// For this subtask, we'll assume NotionService provides static methods or direct function exports.

const db = getDB(); // Get database instance
const journeyEngine = new JourneyEngine(db); // Pass db if JourneyEngine constructor uses it

// --- Mock Data (if NotionService integration is complex for this phase) ---
const MOCK_CHARACTERS = {
  char1: { id: 'char1', name: 'Alex Reeves', type: 'Protagonist', tier: 'A', logline: 'A driven journalist seeking truth.' },
  char2: { id: 'char2', name: 'Marcus Blackwood', type: 'Antagonist', tier: 'A', logline: 'A shadowy CEO with hidden motives.' },
  char3: { id: 'char3', name: 'Sarah Chen', type: 'Ally', tier: 'B', logline: 'A resourceful hacker aiding Alex.' },
};

const MOCK_EVENTS = {
  char1: [
    { id: 'event1', character_id: 'char1', description: 'Attends secret meeting', date: 10 }, // minute 10
    { id: 'event2', character_id: 'char1', description: 'Finds a clue', date: '20-25 minutes' },
  ],
  char2: [
    { id: 'event3', character_id: 'char2', description: 'Makes a threatening call', date: 15 },
  ],
  char3: [
    { id: 'event4', character_id: 'char3', description: 'Hacks a server', date: '30-40 minutes'},
  ],
};

const MOCK_PUZZLES = {
  char1: [
    { id: 'puzzle1', character_id: 'char1', name: 'Decode encrypted message', timing: 'Early Game' },
  ],
  char2: [],
  char3: [
    { id: 'puzzle2', character_id: 'char3', name: 'Bypass security system', timing: '35-45' },
  ],
};

const MOCK_ELEMENTS = {
  char1: [
    { id: 'elem1', character_id: 'char1', name: 'Encrypted USB', type: 'Clue', description: 'Contains financial records.' },
  ],
  char2: [],
  char3: [
    { id: 'elem2', character_id: 'char3', name: 'Security Schematics', type: 'Intel', description: 'Building layout.' },
  ],
};
// --- End Mock Data ---

/**
 * Get character journey details.
 */
async function getCharacterJourney(req, res) {
  const { characterId } = req.params;
  try {
    // Phase 1: Prioritize using mock data for stability.
    // Replace with NotionService calls when its capabilities are confirmed/extended.
    const characterData = MOCK_CHARACTERS[characterId];
    const eventsData = MOCK_EVENTS[characterId] || [];
    const puzzlesData = MOCK_PUZZLES[characterId] || [];
    const elementsData = MOCK_ELEMENTS[characterId] || [];

    if (!characterData) {
      return res.status(404).json({ error: 'Character not found with mock data.' });
    }

    /*
    // Example of future NotionService integration:
    const characterData = await NotionService.getCharacterById(characterId);
    if (!characterData) {
      return res.status(404).json({ error: 'Character not found.' });
    }
    // These might be direct calls or fetched via relations from characterData
    const eventsData = await NotionService.getEventsForCharacter(characterId);
    const puzzlesData = await NotionService.getPuzzlesForCharacter(characterId);
    const elementsData = await NotionService.getElementsForCharacter(characterId);
    */

    const journey = await journeyEngine.buildCharacterJourney(characterId, characterData, eventsData, puzzlesData, elementsData);
    res.json(journey);
  } catch (error) {
    console.error(`Error fetching journey for character ${characterId}:`, error);
    res.status(500).json({ error: 'Failed to compute character journey.' });
  }
}

/**
 * Get only the gaps for a specific character.
 */
async function getCharacterGaps(req, res) {
  const { characterId } = req.params;
  try {
    const characterData = MOCK_CHARACTERS[characterId];
    const eventsData = MOCK_EVENTS[characterId] || [];
    const puzzlesData = MOCK_PUZZLES[characterId] || [];
    const elementsData = MOCK_ELEMENTS[characterId] || [];

    if (!characterData) {
      return res.status(404).json({ error: 'Character not found with mock data.' });
    }

    /*
    // Future NotionService integration:
    const characterData = await NotionService.getCharacterById(characterId);
    if (!characterData) {
      return res.status(404).json({ error: 'Character not found.' });
    }
    const eventsData = await NotionService.getEventsForCharacter(characterId);
    const puzzlesData = await NotionService.getPuzzlesForCharacter(characterId);
    const elementsData = await NotionService.getElementsForCharacter(characterId);
    */

    const journey = await journeyEngine.buildCharacterJourney(characterId, characterData, eventsData, puzzlesData, elementsData);
    res.json(journey.gaps || []);
  } catch (error) {
    console.error(`Error fetching gaps for character ${characterId}:`, error);
    res.status(500).json({ error: 'Failed to compute character gaps.' });
  }
}

/**
 * Get all gaps for all (or a subset of) characters.
 */
async function getAllGaps(req, res) {
  try {
    const allGapsCollected = [];
    // For Phase 1, iterate through mock characters.
    // Replace with NotionService.getAllCharactersWithDetails() or similar in future.
    const characterIdsToProcess = Object.keys(MOCK_CHARACTERS); // Using all mock characters

    for (const characterId of characterIdsToProcess) {
      const characterData = MOCK_CHARACTERS[characterId];
      const eventsData = MOCK_EVENTS[characterId] || [];
      const puzzlesData = MOCK_PUZZLES[characterId] || [];
      const elementsData = MOCK_ELEMENTS[characterId] || [];

      if (characterData) {
        const journey = await journeyEngine.buildCharacterJourney(characterId, characterData, eventsData, puzzlesData, elementsData);
        if (journey.gaps && journey.gaps.length > 0) {
          allGapsCollected.push(...journey.gaps);
        }
      }
    }
    res.json(allGapsCollected);
  } catch (error) {
    console.error('Error fetching all gaps:', error);
    res.status(500).json({ error: 'Failed to compute all gaps.' });
  }
}

/**
 * Get synchronization status (mocked for Phase 1).
 */
async function getSyncStatus(req, res) {
  try {
    // TODO: In the future, this might query the database for last sync times, check Notion API status, etc.
    res.json({
      status: "foundational_sync_ok", // Indicates core local DB schema is up.
      pending_changes: 0, // Placeholder
      last_notion_sync: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // Mock: 30 mins ago
      last_local_db_update: new Date().toISOString(), // Mock: now
      database_status: "online",
    });
  } catch (error) {
    console.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to get sync status.' });
  }
}

module.exports = {
  getCharacterJourney,
  getCharacterGaps,
  getAllGaps,
  getSyncStatus,
};
