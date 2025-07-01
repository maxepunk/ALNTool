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

module.exports = {
  getCharacterJourney,
  getSyncStatus
};