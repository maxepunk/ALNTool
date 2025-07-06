const GameConstants = require('../config/GameConstants');
const { getDB } = require('../db/database');

// Use GameConstants for all business values
const VALUE_RATING_MAP = GameConstants.MEMORY_VALUE.BASE_VALUES;
const TYPE_MULTIPLIER_MAP = GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS;

/**
 * Fetches and transforms memory elements from the database
 * @returns {Array} Transformed memory elements
 */
function getMemoryElements() {
  const db = getDB();
  const elements = db.prepare(`
    SELECT 
      e.*,
      c.name as owner_name,
      ce.name as container_name,
      GROUP_CONCAT(DISTINCT cae.character_id) as associated_character_ids
    FROM elements e
    LEFT JOIN characters c ON e.owner_id = c.id
    LEFT JOIN elements ce ON e.container_id = ce.id
    LEFT JOIN character_associated_elements cae ON e.id = cae.element_id
    WHERE e.type IN ('Memory Token Video', 'Memory Token Audio', 'Memory Token Physical', 'Corrupted Memory RFID', 'Memory Fragment')
    GROUP BY e.id
    ORDER BY e.name
  `).all();

  // Transform to match frontend expectations
  return elements.map(el => ({
    ...el,
    // Memory-specific fields with correct mappings
    sf_value_rating: el.value_rating || 0,
    sf_memory_type: el.memory_type || null,
    parsed_sf_rfid: el.rfid_tag || null,
    sf_memory_group: el.memory_group || null,

    // Computed fields - keep these for backward compatibility
    baseValueAmount: el.value_rating ? VALUE_RATING_MAP[el.value_rating] : 0,
    typeMultiplierValue: el.memory_type ? TYPE_MULTIPLIER_MAP[el.memory_type] : 1,
    finalCalculatedValue: el.calculated_memory_value || 0,

    // Resolution paths
    resolutionPaths: el.resolution_paths ? JSON.parse(el.resolution_paths) : [],

    // Owner info
    ownerName: el.owner_name,
    containerName: el.container_name,

    // Character associations
    associated_character_ids: el.associated_character_ids 
      ? el.associated_character_ids.split(',') 
      : [],

    // Legacy field for backward compatibility
    memoryValue: el.calculated_memory_value || 0,

    // Properties field to match Notion structure
    properties: {
      sf_value_rating: el.value_rating || 0,
      sf_memory_type: el.memory_type || null,
      parsed_sf_rfid: el.rfid_tag || null,
      status: el.status || 'Unknown'
    }
  }));
}

module.exports = {
  getMemoryElements
};