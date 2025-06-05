// storyforge/backend/src/db/queries.js
const { getDB } = require('./database');

// Characters
async function getCharacterById(characterId) {
  const db = getDB();
  return db.prepare('SELECT * FROM characters WHERE id = ?').get(characterId);
}

// Events
async function getEventsForCharacter(characterId) {
  const db = getDB();
  // Assuming direct link or through a join table not yet defined.
  // For now, let's assume timeline_events stores character_ids as JSON array.
  // This is a placeholder query and will need refinement based on actual data storage.
  // It's also inefficient to fetch all and then filter in JS for many characters.
  const allEvents = db.prepare('SELECT * FROM timeline_events').all();
  return allEvents.filter(event => {
      try {
          const ids = JSON.parse(event.character_ids || '[]');
          return ids.includes(characterId);
      } catch (e) { return false; }
  });
}

async function getAllEvents() {
   const db = getDB();
   return db.prepare('SELECT * FROM timeline_events').all();
}

// Puzzles
async function getPuzzlesForCharacter(characterId) {
  const db = getDB();
  // Assuming puzzles have an owner_id or similar linking.
  // Or, if linked via character_puzzles join table (not defined yet).
  // For now, uses owner_id directly from puzzles table.
  return db.prepare('SELECT * FROM puzzles WHERE owner_id = ?').all(characterId);
}

async function getAllPuzzles() {
   const db = getDB();
   return db.prepare('SELECT * FROM puzzles').all();
}

// Elements
async function getElementsForCharacter(characterId) {
  const db = getDB();
  // This is highly dependent on how elements are linked to characters.
  // (e.g., owned_elements, associated_elements, via puzzles, via events).
  // For now, this is a placeholder - returning all elements.
  // A more realistic query would join through relevant tables.
  return db.prepare('SELECT * FROM elements').all();
}

async function getAllElements() {
   const db = getDB();
   return db.prepare('SELECT * FROM elements').all();
}

// Get all character IDs and Names
async function getAllCharacterIdsAndNames() {
  const db = getDB();
  return db.prepare('SELECT id, name FROM characters').all();
}

module.exports = {
  getCharacterById,
  getEventsForCharacter, // Or a more generic getAllEvents if filtering happens in JS
  getPuzzlesForCharacter, // Or getAllPuzzles
  getElementsForCharacter, // Or getAllElements
  getAllEvents,
  getAllPuzzles,
  getAllElements,
  getAllCharacterIdsAndNames,
  getCachedJourney,
  saveCachedJourney,
  isValidJourneyCache,
};

// Cached Journeys
// Assume tables: cached_journey_segments, cached_journey_gaps
// cached_journey_segments: id, character_id, start_minute, end_minute, activities (JSON), interactions (JSON), discoveries (JSON), gap_status, cached_at
// cached_journey_gaps: id, character_id, start_minute, end_minute, severity, suggested_solutions (JSON), cached_at

async function getCachedJourney(characterId) {
  const db = getDB();
  try {
    const segments = db.prepare('SELECT * FROM cached_journey_segments WHERE character_id = ? ORDER BY start_minute ASC').all(characterId);
    const gaps = db.prepare('SELECT * FROM cached_journey_gaps WHERE character_id = ? ORDER BY start_minute ASC').all(characterId);

    if (!segments || segments.length === 0) {
      return null; // No cached journey found
    }

    // Assuming character_info is not stored directly with segments/gaps but can be fetched if needed
    // For now, the cached journey will primarily consist of segments, gaps, and the cached_at timestamp (from the first segment).
    // The full character_info can be re-fetched by buildCharacterJourney if a valid cache is found.
    return {
      character_id: characterId,
      segments: segments.map(s => ({ ...s, activities: JSON.parse(s.activities || '[]'), interactions: JSON.parse(s.interactions || '[]'), discoveries: JSON.parse(s.discoveries || '[]') })),
      gaps: gaps.map(g => ({ ...g, suggested_solutions: JSON.parse(g.suggested_solutions || '[]') })),
      // Use cached_at from the first segment as the overall cache time for the journey
      cached_at: segments[0].cached_at
    };
  } catch (error) {
    console.error(`Error getting cached journey for character ${characterId}:`, error);
    // In case of schema issues (tables not existing), this will likely throw an error.
    // For this subtask, we assume tables exist. If not, it correctly returns null or an error state.
    return null;
  }
}

async function saveCachedJourney(characterId, journeyData) {
  const db = getDB();
  const now = new Date().toISOString();

  // Start a transaction
  db.exec('BEGIN');
  try {
    // Clear old cache for this character
    db.prepare('DELETE FROM cached_journey_segments WHERE character_id = ?').run(characterId);
    db.prepare('DELETE FROM cached_journey_gaps WHERE character_id = ?').run(characterId);

    // Save segments
    const insertSegment = db.prepare(
      'INSERT INTO cached_journey_segments (character_id, start_minute, end_minute, activities, interactions, discoveries, gap_status, cached_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    );
    for (const segment of journeyData.segments) {
      insertSegment.run(
        characterId,
        segment.start_minute,
        segment.end_minute,
        JSON.stringify(segment.activities || []),
        JSON.stringify(segment.interactions || []),
        JSON.stringify(segment.discoveries || []),
        segment.gap_status,
        now
      );
    }

    // Save gaps
    const insertGap = db.prepare(
      'INSERT INTO cached_journey_gaps (character_id, start_minute, end_minute, severity, suggested_solutions, cached_at) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (const gap of journeyData.gaps) {
      insertGap.run(
        characterId,
        gap.start_minute,
        gap.end_minute,
        gap.severity,
        JSON.stringify(gap.suggested_solutions || []),
        now
      );
    }
    db.exec('COMMIT');
    // console.log(`Cached journey for character ${characterId} successfully.`);
  } catch (error) {
    db.exec('ROLLBACK');
    console.error(`Error saving cached journey for character ${characterId}:`, error);
    // This will also catch errors if tables don't exist.
  }
}

function isValidJourneyCache(cachedJourney) {
  if (!cachedJourney || !cachedJourney.cached_at) {
    return false;
  }
  const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  const cacheTime = new Date(cachedJourney.cached_at).getTime();
  const now = new Date().getTime();
  return (now - cacheTime) < CACHE_TTL_MS;
}
