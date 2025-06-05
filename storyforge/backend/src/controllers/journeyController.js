const JourneyEngine = require('../services/journeyEngine');
// const NotionService = require('../services/notionService'); // NotionService is not directly used here anymore for fetching journey engine data
const dbQueries = require('../db/queries');
// const { getDB } = require('../db/database'); // getDB is used by queries.js, not directly here.

// Instantiate services
const journeyEngine = new JourneyEngine(); // JourneyEngine now fetches its own data

/**
 * Get character journey details.
 */
async function getCharacterJourney(req, res) {
  const { characterId } = req.params;
  try {
    const journey = await journeyEngine.buildCharacterJourney(characterId);
    if (!journey) {
      return res.status(404).json({ error: 'Character not found or journey could not be built.' });
    }
    res.json(journey);
  } catch (error) {
    console.error(`Error fetching journey for character ${characterId}:`, error);
    res.status(500).json({ error: 'Failed to compute character journey.' });
  }
}

/**
 * Get suggestions for a specific gap for a specific character.
 */
async function getGapSuggestions(req, res) {
  const { characterId, gapId } = req.params;
  try {
    const journey = await journeyEngine.buildCharacterJourney(characterId);
    if (!journey) {
      return res.status(404).json({ error: 'Character not found or journey could not be built for gap suggestions.' });
    }

    const foundGap = journey.gaps.find(g => g.id === gapId);
    if (!foundGap) {
      return res.status(404).json({ error: `Gap with id ${gapId} not found for character ${characterId}.` });
    }

    const allElements = await dbQueries.getAllElements();
    const allPuzzles = await dbQueries.getAllPuzzles();

    const suggestions = await journeyEngine.suggestGapSolutions(foundGap, allElements, allPuzzles);
    res.json(suggestions);

  } catch (error) {
    console.error(`Error fetching suggestions for gap ${gapId} of character ${characterId}:`, error);
    res.status(500).json({ error: 'Failed to compute gap suggestions.' });
  }
}

/**
 * Get only the gaps for a specific character.
 */
async function getCharacterGaps(req, res) {
  const { characterId } = req.params;
  try {
    const journey = await journeyEngine.buildCharacterJourney(characterId);
    if (!journey) {
      return res.status(404).json({ error: 'Character not found or journey could not be built for gap extraction.' });
    }
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
    const characters = await dbQueries.getAllCharacterIdsAndNames(); // Fetch from local DB

    if (!characters || characters.length === 0) {
      console.log('No characters found in local DB to process for getAllGaps.');
      return res.json([]);
    }

    for (const charInfo of characters) { // charInfo will have id and name
      const journey = await journeyEngine.buildCharacterJourney(charInfo.id);
      if (journey && journey.gaps && journey.gaps.length > 0) {
        allGapsCollected.push(...journey.gaps.map(gap => ({...gap, characterId: charInfo.id, characterName: charInfo.name })));
      } else if (!journey) {
        console.warn(`Could not build journey for character ID ${charInfo.id} in getAllGaps.`);
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
  getGapSuggestions,
};
