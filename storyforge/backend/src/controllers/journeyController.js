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

// Mock data has been removed. Live data will be fetched from NotionService.

/**
 * Get character journey details.
 */
async function getCharacterJourney(req, res) {
  const { characterId } = req.params;
  try {
    const characterDetails = await NotionService.getCharacterDetails(characterId);

    if (!characterDetails || !characterDetails.character) {
      return res.status(404).json({ error: 'Character not found or failed to load details.' });
    }

    const journey = await journeyEngine.buildCharacterJourney(
      characterDetails.character.id, // Pass the character ID
      characterDetails.character,    // Pass the full mapped character object
      characterDetails.events,
      characterDetails.puzzles,
      characterDetails.elements
    );
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
    const characterDetails = await NotionService.getCharacterDetails(characterId);

    if (!characterDetails || !characterDetails.character) {
      return res.status(404).json({ error: 'Character not found or failed to load details.' });
    }

    const journey = await journeyEngine.buildCharacterJourney(
      characterDetails.character.id,
      characterDetails.character,
      characterDetails.events,
      characterDetails.puzzles,
      characterDetails.elements
    );
    res.json(journey.gaps || []);
  } catch (error) {
    console.error(`Error fetching gaps for character ${characterId}:`, error);
    res.status(500).json({ error: 'Failed to compute character gaps.' });
  }
}

/**
 * Get all gaps for all (or a subset of) characters.
 * Note: This can be slow as it fetches details for each character sequentially.
 * Future optimizations: parallel fetching, caching, background processing.
 */
async function getAllGaps(req, res) {
  try {
    const allGapsCollected = [];
    const characterOverviews = await NotionService.getAllCharacterOverviews();

    if (!characterOverviews || characterOverviews.length === 0) {
      console.log('No characters found to process for getAllGaps.');
      return res.json([]);
    }

    for (const charOverview of characterOverviews) {
      const characterDetails = await NotionService.getCharacterDetails(charOverview.id);
      if (characterDetails && characterDetails.character) {
        const journey = await journeyEngine.buildCharacterJourney(
          characterDetails.character.id,
          characterDetails.character,
          characterDetails.events,
          characterDetails.puzzles,
          characterDetails.elements
        );
        if (journey.gaps && journey.gaps.length > 0) {
          // Add character info to each gap for context if needed, or ensure gap objects are self-contained.
          // For now, just collecting them.
          allGapsCollected.push(...journey.gaps.map(gap => ({...gap, characterId: charOverview.id, characterName: charOverview.name })));
        }
      } else {
        console.warn(`Could not retrieve details for character ID ${charOverview.id} in getAllGaps.`);
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
