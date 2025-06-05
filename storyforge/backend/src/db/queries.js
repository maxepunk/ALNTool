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
};
