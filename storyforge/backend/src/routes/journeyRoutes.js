const express = require('express');
const router = express.Router();

const {
  getCharacterJourney,
  getSyncStatus
} = require('../controllers/journeyController');

// Journey routes
// All these will be prefixed by '/api' (or similar) in the main app setup.
// So the full paths will be like /api/journeys/:characterId

router.get('/journeys/:characterId', getCharacterJourney);

module.exports = router;
