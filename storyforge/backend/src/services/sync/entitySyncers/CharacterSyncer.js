const BaseSyncer = require('./BaseSyncer');

/**
 * Syncer for Character entities.
 * Handles fetching from Notion, mapping, and inserting character data.
 * 
 * @extends BaseSyncer
 */
class CharacterSyncer extends BaseSyncer {
  /**
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.notionService - Service for fetching from Notion
   * @param {Object} dependencies.propertyMapper - Service for mapping Notion properties
   * @param {Object} dependencies.logger - SyncLogger instance
   */
  constructor(dependencies) {
    super(dependencies);
    this.entityType = 'characters';
  }

  /**
   * Fetch characters from Notion
   * @returns {Promise<Array>} Array of Notion character objects
   */
  async fetchFromNotion() {
    return await this.notionService.getCharacters();
  }

  /**
   * Clear existing character data and related tables
   * @returns {Promise<void>}
   */
  async clearExistingData() {
    // Clear tables that have foreign key to characters, in correct order
    this.db.prepare('DELETE FROM character_links').run();
    this.db.prepare('DELETE FROM character_timeline_events').run();
    this.db.prepare('DELETE FROM character_owned_elements').run();
    this.db.prepare('DELETE FROM character_associated_elements').run();
    this.db.prepare('DELETE FROM character_puzzles').run();
    // Finally, clear the characters table
    this.db.prepare('DELETE FROM characters').run();
  }

  /**
   * Map Notion character data to database format
   * @param {Object} notionCharacter - Raw Notion character object
   * @returns {Promise<Object>} Mapped character data
   */
  async mapData(notionCharacter) {
    try {
      const mapped = await this.propertyMapper.mapCharacterWithNames(
        notionCharacter, 
        this.notionService
      );
      
      if (mapped.error) {
        return { error: mapped.error };
      }

      // Transform to database format
      return {
        id: mapped.id,
        name: mapped.name || '',
        type: mapped.type || '',
        tier: mapped.tier || '',
        logline: mapped.logline || '',
        connections: mapped.connections || 0,
        // Store relationships for later processing
        _relationships: {
          events: mapped.events,
          puzzles: mapped.puzzles,
          ownedElements: mapped.ownedElements,
          associatedElements: mapped.associatedElements
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Insert character data into database
   * @param {Object} mappedData - Mapped character data
   * @returns {Promise<void>}
   */
  async insertData(mappedData) {
    // Extract relationships before inserting
    const { _relationships, ...characterData } = mappedData;
    
    // Insert the character
    const stmt = this.db.prepare(
      'INSERT INTO characters (id, name, type, tier, logline, connections) VALUES (?, ?, ?, ?, ?, ?)'
    );
    
    stmt.run(
      characterData.id,
      characterData.name,
      characterData.type,
      characterData.tier,
      characterData.logline,
      characterData.connections
    );
    
    // Store relationships for post-processing
    if (!this._pendingRelationships) {
      this._pendingRelationships = [];
    }
    this._pendingRelationships.push({
      characterId: characterData.id,
      relationships: _relationships
    });
  }

  /**
   * Process character relationships after all characters are synced
   * @returns {Promise<void>}
   */
  async postProcess() {
    if (!this._pendingRelationships || this._pendingRelationships.length === 0) {
      return;
    }

    this.logger.info(`Processing relationships for ${this._pendingRelationships.length} characters...`);

    // Prepare insert statements
    const insertEventRel = this.db.prepare(
      'INSERT OR IGNORE INTO character_timeline_events (character_id, timeline_event_id) VALUES (?, ?)'
    );
    const insertOwnedElement = this.db.prepare(
      'INSERT OR IGNORE INTO character_owned_elements (character_id, element_id) VALUES (?, ?)'
    );
    const insertAssocElement = this.db.prepare(
      'INSERT OR IGNORE INTO character_associated_elements (character_id, element_id) VALUES (?, ?)'
    );
    const insertPuzzleRel = this.db.prepare(
      'INSERT OR IGNORE INTO character_puzzles (character_id, puzzle_id) VALUES (?, ?)'
    );

    // Process all pending relationships
    for (const pending of this._pendingRelationships) {
      const { characterId, relationships } = pending;
      
      // Process each relationship type
      this._processRelations(relationships.events, characterId, insertEventRel);
      this._processRelations(relationships.ownedElements, characterId, insertOwnedElement);
      this._processRelations(relationships.associatedElements, characterId, insertAssocElement);
      this._processRelations(relationships.puzzles, characterId, insertPuzzleRel);
    }

    // Clear pending relationships
    this._pendingRelationships = [];
  }

  /**
   * Helper to process a set of relations
   * @private
   * @param {Array} relations - Array of relation objects with id property
   * @param {string} characterId - Character ID
   * @param {Object} stmt - Prepared statement for insertion
   */
  _processRelations(relations, characterId, stmt) {
    if (relations && Array.isArray(relations)) {
      for (const rel of relations) {
        const relId = rel.id || rel;
        stmt.run(characterId, relId);
      }
    }
  }

  /**
   * Get current character count for dry run
   * @returns {Promise<number>} Current character count
   */
  async getCurrentRecordCount() {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM characters').get();
    return result.count;
  }
}

module.exports = CharacterSyncer;
