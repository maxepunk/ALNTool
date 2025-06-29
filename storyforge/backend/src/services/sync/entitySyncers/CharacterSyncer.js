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
    super({ ...dependencies, entityType: 'characters' });
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
   * Store character relationships for later processing by RelationshipSyncer
   * CharacterSyncer should only handle character entities, not relationships
   * @returns {Promise<void>}
   */
  async postProcess() {
    // Character relationships are now handled by RelationshipSyncer in Phase 2
    // This ensures all entities exist before relationships are created
    this.logger.info(`Stored relationship data for ${this._pendingRelationships?.length || 0} characters for Phase 2 processing`);

    // Relationships will be processed by RelationshipSyncer after all entities are synced
    // This prevents foreign key constraint violations
  }

  // _processRelations method removed - relationships now handled by RelationshipSyncer

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
