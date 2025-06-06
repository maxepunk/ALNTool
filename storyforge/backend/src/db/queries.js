// storyforge/backend/src/db/queries.js
const { getDB } = require('./database');

// Characters
async function getCharacterById(characterId) {
  const db = getDB();
  return db.prepare('SELECT * FROM characters WHERE id = ?').get(characterId);
}

// Efficiently get all related entities for a character graph
async function getCharacterRelations(characterId) {
    const db = getDB();

    const events = db.prepare(`
        SELECT te.*, 'timeline_event' as type FROM timeline_events te
        JOIN character_timeline_events cte ON te.id = cte.timeline_event_id
        WHERE cte.character_id = ?
    `).all(characterId);

    const puzzles = db.prepare(`
        SELECT p.*, 'puzzle' as type FROM puzzles p
        JOIN character_puzzles cp ON p.id = cp.puzzle_id
        WHERE cp.character_id = ?
    `).all(characterId);

    const ownedElements = db.prepare(`
        SELECT e.*, 'element' as type, 'owned' as relationship_type FROM elements e
        JOIN character_owned_elements coe ON e.id = coe.element_id
        WHERE coe.character_id = ?
    `).all(characterId);

    const associatedElements = db.prepare(`
        SELECT e.*, 'element' as type, 'associated' as relationship_type FROM elements e
        JOIN character_associated_elements cae ON e.id = cae.element_id
        WHERE cae.character_id = ?
    `).all(characterId);
    
    return {
        events,
        puzzles,
        elements: [...ownedElements, ...associatedElements]
    };
}

// Events

async function getAllEvents() {
   const db = getDB();
   return db.prepare('SELECT * FROM timeline_events').all();
}

// Puzzles

async function getAllPuzzles() {
   const db = getDB();
   return db.prepare('SELECT * FROM puzzles').all();
}

// Elements

async function getAllElements() {
   const db = getDB();
   return db.prepare('SELECT * FROM elements').all();
}

// Get all character IDs and Names
async function getAllCharacterIdsAndNames() {
  const db = getDB();
  return db.prepare('SELECT id, name FROM characters').all();
}

// Get linked characters for a specific character
async function getLinkedCharacters(characterId) {
  const db = getDB();
  const links = db.prepare(`
    SELECT DISTINCT 
      CASE 
        WHEN character_a_id = ? THEN character_b_id 
        ELSE character_a_id 
      END as linked_character_id,
      c.name as linked_character_name,
      cl.link_type,
      COUNT(*) as link_count
    FROM character_links cl
    JOIN characters c ON (
      CASE 
        WHEN cl.character_a_id = ? THEN cl.character_b_id 
        ELSE cl.character_a_id 
      END = c.id
    )
    WHERE character_a_id = ? OR character_b_id = ?
    GROUP BY linked_character_id, link_type
    ORDER BY link_count DESC
  `).all(characterId, characterId, characterId, characterId);
  
  return links;
}

async function getFullEntityDetails(entityIds) {
    const db = getDB();
    if (!entityIds || entityIds.length === 0) {
        return { characters: [], elements: [], puzzles: [], timeline_events: [] };
    }
    const placeholders = entityIds.map(() => '?').join(',');
    
    const characters = db.prepare(`SELECT *, 'character' as type FROM characters WHERE id IN (${placeholders})`).all(...entityIds);
    const elements = db.prepare(`SELECT *, 'element' as type FROM elements WHERE id IN (${placeholders})`).all(...entityIds);
    const puzzles = db.prepare(`SELECT *, 'puzzle' as type FROM puzzles WHERE id IN (${placeholders})`).all(...entityIds);
    const timeline_events = db.prepare(`SELECT *, 'timeline_event' as type FROM timeline_events WHERE id IN (${placeholders})`).all(...entityIds);

    return { characters, elements, puzzles, timeline_events };
}

/**
 * Gathers all data relevant to a character's journey for graph construction.
 * This includes directly related items and items linked through puzzles and rewards.
 * @param {string} characterId - The ID of the character.
 * @returns {Promise<{events: Array, puzzles: Array, elements: Array}>}
 */
async function getCharacterJourneyData(characterId) {
  const db = getDB();
  
  // 1. Get direct relationships
  const directRelations = await getCharacterRelations(characterId);
  const allEvents = new Map(directRelations.events.map(e => [e.id, e]));
  const allPuzzles = new Map(directRelations.puzzles.map(p => [p.id, p]));
  const allElements = new Map(directRelations.elements.map(el => [el.id, el]));

  // 2. Find puzzles that reward this character's elements (upstream dependencies)
  const elementIds = Array.from(allElements.keys());
  if (elementIds.length > 0) {
    const rewardingPuzzlesStmt = db.prepare(`
      SELECT * FROM puzzles
      WHERE json_valid(reward_ids) AND EXISTS (
        SELECT 1 FROM json_each(reward_ids)
        WHERE json_each.value IN (${elementIds.map(() => '?').join(',')})
      )
    `);
    const rewardingPuzzles = rewardingPuzzlesStmt.all(...elementIds);
    rewardingPuzzles.forEach(p => allPuzzles.set(p.id, p));
  }

  // 3. Find elements rewarded by this character's puzzles (downstream discoveries)
  const puzzleIds = Array.from(allPuzzles.keys());
  if (puzzleIds.length > 0) {
    const puzzlesWithRewards = db.prepare(`SELECT reward_ids FROM puzzles WHERE id IN (${puzzleIds.map(() => '?').join(',')})`).all(...puzzleIds);
    const rewardElementIds = new Set();
    puzzlesWithRewards.forEach(p => {
      try {
        const ids = JSON.parse(p.reward_ids || '[]');
        ids.forEach(id => rewardElementIds.add(id));
      } catch (e) { /* ignore malformed JSON */ }
    });
    
    if (rewardElementIds.size > 0) {
      const rewardedElements = db.prepare(`SELECT * FROM elements WHERE id IN (${Array.from(rewardElementIds).map(() => '?').join(',')})`).all(...rewardElementIds);
      rewardedElements.forEach(el => allElements.set(el.id, el));
    }
  }

  return {
    events: Array.from(allEvents.values()),
    puzzles: Array.from(allPuzzles.values()),
    elements: Array.from(allElements.values()),
  };
}

// Get element by ID
function getElementById(id) {
  return getDB().prepare('SELECT * FROM elements WHERE id = ?').get(id);
}

// Get characters for list view
function getCharactersForList() {
  const db = getDB();
  // This query fetches only the essential fields for the character list view.
  return db.prepare(`
    SELECT 
      id, 
      name, 
      type, 
      tier,
      logline,
      resolution_paths
    FROM characters 
    ORDER BY name ASC
  `).all();
}

module.exports = {
  getCharacterById,
  getCharacterRelations,
  getAllEvents,
  getAllPuzzles,
  getAllElements,
  getAllCharacterIdsAndNames,
  getLinkedCharacters,
  getFullEntityDetails,
  getCharacterJourneyData,
  getElementById,
  getCharactersForList,
};


