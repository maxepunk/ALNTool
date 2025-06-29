const JourneyEngine = require('../services/journeyEngine');
const { getSyncStatus: getDbSyncStatus } = require('../db/queries');

const logger = require('../utils/logger');
// Initialize journey engine
const journeyEngine = new JourneyEngine();

/**
 * Get a character's complete journey graph
 */
async function getCharacterJourney(req, res) {
  try {
    const { characterId } = req.params;
    const journey = await journeyEngine.buildCharacterJourney(characterId);

    if (!journey) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(journey);
  } catch (error) {
    logger.error('Error fetching character journey:', error);
    res.status(500).json({ error: 'Failed to fetch character journey' });
  }
}

/**
 * Get gaps for a character - DEPRECATED
 * Gaps are no longer part of the journey model
 */
async function getCharacterGaps(req, res) {
  // Return empty array for backward compatibility
  res.json([]);
}

/**
 * Get all gaps across all characters - DEPRECATED
 * Gaps are no longer part of the journey model
 */
async function getAllGaps(req, res) {
  // Return empty array for backward compatibility
  res.json([]);
}

/**
 * Get sync status
 */
async function getSyncStatus(req, res) {
  try {
    const status = getDbSyncStatus();
    res.json(status);
  } catch (error) {
    logger.error('Error fetching sync status:', error);
    res.status(500).json({ error: 'Failed to fetch sync status' });
  }
}

/**
 * Get gap suggestions - DEPRECATED
 * This endpoint is no longer supported
 */
async function getGapSuggestions(req, res) {
  res.status(410).json({
    error: 'Gap suggestions endpoint is deprecated',
    message: 'The gap model has been replaced with a journey graph model',
    migration: 'Use the journey graph endpoint at /api/journeys/:characterId instead'
  });
}

/**
 * Resolve a gap - DEPRECATED
 * This endpoint is no longer supported
 */
async function resolveGap(req, res) {
  res.status(410).json({
    error: 'Gap resolution endpoint is deprecated',
    message: 'The gap model has been replaced with a journey graph model',
    migration: 'Gaps no longer exist in the current data model'
  });
}

module.exports = {
  getCharacterJourney,
  getCharacterGaps,
  getAllGaps,
  getSyncStatus,
  getGapSuggestions,
  resolveGap
};