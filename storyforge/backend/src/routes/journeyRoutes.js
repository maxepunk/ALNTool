const express = require('express');
const router = express.Router();

const {
  getCharacterJourney,
  getCharacterGaps,
  getAllGaps,
  getSyncStatus,
} = require('../controllers/journeyController');

// Journey and Gap related routes
// All these will be prefixed by '/api' (or similar) in the main app setup.
// So the full paths will be like /api/journeys/:characterId

router.get('/journeys/:characterId', getCharacterJourney);
router.get('/journeys/:characterId/gaps', getCharacterGaps);
router.get('/gaps/all', getAllGaps); // Consider if this path should be /journeys/gaps/all for consistency
router.get('/sync/status', getSyncStatus); // Path /api/sync/status

module.exports = router;
