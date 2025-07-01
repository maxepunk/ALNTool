// storyforge/backend/src/db/queries.js
const { getDB } = require('./database');

const logger = require('../utils/logger');
// Characters
function getCharacterById(characterId) {
  const db = getDB();
  return db.prepare('SELECT * FROM characters WHERE id = ?').get(characterId);
}

// Efficiently get all related entities for a character graph
function getCharacterRelations(characterId) {
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

function getAllEvents() {
  const db = getDB();
  return db.prepare('SELECT * FROM timeline_events').all();
}

// Get timeline events for list view
function getTimelineEventsForList() {
  const db = getDB();
  return db.prepare(`
    SELECT 
      id, 
      description, 
      date,
      act_focus,
      notes
    FROM timeline_events 
    ORDER BY date ASC
  `).all();
}

// Puzzles

function getAllPuzzles() {
  const db = getDB();
  return db.prepare('SELECT * FROM puzzles').all();
}

// Elements

function getAllElements() {
  const db = getDB();
  return db.prepare('SELECT * FROM elements').all();
}

// Get all elements with computed fields for Memory Economy
function getElementsWithComputedFields() {
  const db = getDB();
  return db.prepare(`
    SELECT 
      e.*,
      c.name as owner_name,
      ce.name as container_name
    FROM elements e
    LEFT JOIN characters c ON e.owner_id = c.id
    LEFT JOIN elements ce ON e.container_id = ce.id
  `).all();
}

// Get all character IDs and Names
function getAllCharacterIdsAndNames() {
  const db = getDB();
  return db.prepare('SELECT id, name FROM characters').all();
}

// Get linked characters for a specific character
function getLinkedCharacters(characterId) {
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

function getFullEntityDetails(entityIds) {
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
function getCharacterJourneyData(characterId) {
  const db = getDB();

  // 1. Get direct relationships
  const directRelations = getCharacterRelations(characterId);
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
    elements: Array.from(allElements.values())
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
  const characters = db.prepare(`
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

  // Parse JSON strings to arrays for computed fields
  return characters.map(character => ({
    ...character,
    resolution_paths: character.resolution_paths ? JSON.parse(character.resolution_paths) : []
  }));
}

// ======== Journey Graph Caching Functions ========

/**
 * Generates a hash for cache validation based on source data timestamps.
 * @param {string} characterId - The character ID
 * @returns {string} A hash representing the current state of source data
 */
function generateJourneyVersionHash(characterId) {
  const db = getDB();

  // Get last modification times of related data
  // In a real implementation, you might track actual modification timestamps
  // For now, we'll use count and checksum of related entities
  const counts = db.prepare(`
    SELECT 
      (SELECT COUNT(*) FROM character_timeline_events WHERE character_id = ?) as event_count,
      (SELECT COUNT(*) FROM character_puzzles WHERE character_id = ?) as puzzle_count,
      (SELECT COUNT(*) FROM character_owned_elements WHERE character_id = ?) as owned_element_count,
      (SELECT COUNT(*) FROM character_associated_elements WHERE character_id = ?) as assoc_element_count,
      (SELECT COUNT(*) FROM character_links WHERE character_a_id = ? OR character_b_id = ?) as link_count
  `).get(characterId, characterId, characterId, characterId, characterId, characterId);

  // Create a simple hash from the counts
  // In production, you might use actual checksums or modification timestamps
  const hashSource = `${counts.event_count}-${counts.puzzle_count}-${counts.owned_element_count}-${counts.assoc_element_count}-${counts.link_count}`;

  // Simple hash function (in production, use crypto.createHash)
  let hash = 0;
  for (let i = 0; i < hashSource.length; i++) {
    const char = hashSource.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return hash.toString(16);
}

/**
 * Retrieves a cached journey graph if valid.
 * @param {string} characterId - The character ID
 * @returns {object|null} The cached journey or null if not found/invalid
 */
function getCachedJourneyGraph(characterId) {
  const db = getDB();
  const CACHE_DURATION_HOURS = 24; // Configurable cache duration

  try {
    const cached = db.prepare(`
      SELECT * FROM cached_journey_graphs 
      WHERE character_id = ? 
      AND datetime(cached_at) > datetime('now', '-${CACHE_DURATION_HOURS} hours')
    `).get(characterId);

    if (!cached) {
      return null;
    }

    // Check if cache is still valid by comparing version hash
    const currentHash = generateJourneyVersionHash(characterId);
    if (cached.version_hash !== currentHash) {
      // Source data has changed, cache is stale
      logger.debug(`Cache invalidated for character ${characterId}: hash mismatch`);
      return null;
    }

    // Update last accessed time
    db.prepare(`
      UPDATE cached_journey_graphs 
      SET last_accessed = CURRENT_TIMESTAMP 
      WHERE character_id = ?
    `).run(characterId);

    // Parse and return the cached journey
    return {
      character_id: characterId,
      character_info: JSON.parse(cached.character_info),
      graph: {
        nodes: JSON.parse(cached.graph_nodes),
        edges: JSON.parse(cached.graph_edges)
      }
    };

  } catch (error) {
    logger.error(`Error retrieving cached journey for ${characterId}:`, error);
    return null;
  }
}

/**
 * Saves a computed journey graph to the cache.
 * @param {string} characterId - The character ID
 * @param {object} journey - The computed journey object
 */
function saveCachedJourneyGraph(characterId, journey) {
  const db = getDB();

  try {
    const versionHash = generateJourneyVersionHash(characterId);

    // Use INSERT OR REPLACE to handle both new and existing cache entries
    db.prepare(`
      INSERT OR REPLACE INTO cached_journey_graphs 
      (character_id, character_info, graph_nodes, graph_edges, version_hash, cached_at, last_accessed)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `).run(
      characterId,
      JSON.stringify(journey.character_info),
      JSON.stringify(journey.graph.nodes),
      JSON.stringify(journey.graph.edges),
      versionHash
    );

    logger.debug(`Journey graph cached for character ${characterId}`);

  } catch (error) {
    logger.error(`Error caching journey for ${characterId}:`, error);
    // Don't throw - caching failure shouldn't break the journey computation
  }
}

/**
 * Clears expired cache entries (optional maintenance function).
 * @param {number} maxAgeHours - Maximum age of cache entries in hours
 */
function clearExpiredJourneyCache(maxAgeHours = 168) { // Default: 1 week
  const db = getDB();

  try {
    const result = db.prepare(`
      DELETE FROM cached_journey_graphs 
      WHERE datetime(cached_at) < datetime('now', '-${maxAgeHours} hours')
    `).run();

    if (result.changes > 0) {
      logger.debug(`Cleared ${result.changes} expired journey cache entries`);
    }

  } catch (error) {
    logger.error('Error clearing expired cache:', error);
  }
}

/**
 * Invalidates cache for a specific character.
 * @param {string} characterId - The character ID to invalidate
 */
function invalidateJourneyCache(characterId) {
  const db = getDB();

  try {
    db.prepare('DELETE FROM cached_journey_graphs WHERE character_id = ?').run(characterId);
    logger.debug(`Journey cache invalidated for character ${characterId}`);
  } catch (error) {
    logger.error(`Error invalidating cache for ${characterId}:`, error);
  }
}

/**
 * Get the current sync status
 * @returns {Object} Sync status information
 */
function getSyncStatus() {
  const db = getDB();

  try {
    // Get last sync log entry
    const lastSync = db.prepare(`
      SELECT * FROM sync_log 
      ORDER BY start_time DESC 
      LIMIT 1
    `).get();

    // Get database status (simple check)
    const tableCount = db.prepare(`
      SELECT COUNT(*) as count 
      FROM sqlite_master 
      WHERE type='table'
    `).get();

    // Get entity counts
    const characterCount = db.prepare('SELECT COUNT(*) as count FROM characters').get();
    const elementCount = db.prepare('SELECT COUNT(*) as count FROM elements').get();
    const puzzleCount = db.prepare('SELECT COUNT(*) as count FROM puzzles').get();
    const timelineCount = db.prepare('SELECT COUNT(*) as count FROM timeline_events').get();

    return {
      status: 'foundational_sync_ok',
      pending_changes: 0,
      last_notion_sync: lastSync ? lastSync.timestamp : null,
      last_local_db_update: lastSync ? lastSync.timestamp : null,
      database_status: tableCount.count > 0 ? 'online' : 'offline',
      entity_counts: {
        characters: characterCount.count,
        elements: elementCount.count,
        puzzles: puzzleCount.count,
        timeline_events: timelineCount.count
      }
    };
  } catch (error) {
    logger.error('Error getting sync status:', error);
    return {
      status: 'error',
      pending_changes: 0,
      last_notion_sync: null,
      last_local_db_update: null,
      database_status: 'error',
      error: error.message
    };
  }
}

module.exports = {
  getCharacterById,
  getCharacterRelations,
  getAllEvents,
  getAllPuzzles,
  getAllElements,
  getElementsWithComputedFields,
  getAllCharacterIdsAndNames,
  getLinkedCharacters,
  getFullEntityDetails,
  getCharacterJourneyData,
  getElementById,
  getCharactersForList,
  getTimelineEventsForList,
  // Journey caching functions
  getCachedJourneyGraph,
  saveCachedJourneyGraph,
  invalidateJourneyCache,
  clearExpiredJourneyCache,
  // Sync status
  getSyncStatus
};

