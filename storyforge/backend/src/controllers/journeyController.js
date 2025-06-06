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
 * @deprecated Gaps are no longer part of the graph model. This endpoint returns an error.
 */
async function getGapSuggestions(req, res) {
  const { characterId, gapId } = req.params;
  // This endpoint is deprecated as gaps are no longer part of the narrative graph model
  return res.status(410).json({ 
    error: 'Gap suggestions endpoint is deprecated. The journey model now uses a narrative graph instead of linear segments and gaps.',
    migration: 'Please use the graph visualization to identify narrative flow issues.'
  });
}

/**
 * Get only the gaps for a specific character.
 * @deprecated Gaps are no longer part of the graph model. This endpoint returns an empty array for backward compatibility.
 */
async function getCharacterGaps(req, res) {
  const { characterId } = req.params;
  // Return empty array for backward compatibility
  // Gaps are no longer part of the narrative graph model
  console.warn(`Deprecated endpoint accessed: /journeys/${characterId}/gaps`);
  res.json([]);
}

/**
 * Get all gaps for all (or a subset of) characters.
 * @deprecated Gaps are no longer part of the graph model. This endpoint returns an empty array for backward compatibility.
 */
async function getAllGaps(req, res) {
  // Return empty array for backward compatibility
  // Gaps are no longer part of the narrative graph model
  console.warn('Deprecated endpoint accessed: /gaps/all');
  res.json([]);
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
  resolveGap,
};

/**
 * Resolve a gap.
 * @deprecated Gaps are no longer part of the graph model. This endpoint returns an error.
 */
async function resolveGap(req, res) {
  const { gapId } = req.params;
  // This endpoint is deprecated as gaps are no longer part of the narrative graph model
  return res.status(410).json({ 
    error: 'Gap resolution endpoint is deprecated. The journey model now uses a narrative graph instead of linear segments and gaps.',
    migration: 'Please use the graph visualization to manage narrative flow.'
  });
}
