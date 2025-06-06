const BaseSyncer = require('./entitySyncers/BaseSyncer');

/**
 * RelationshipSyncer handles all cross-entity relationships and character links.
 * This includes:
 * 1. Validating relationships between entities
 * 2. Computing character links based on shared experiences
 * 3. Ensuring referential integrity
 * 
 * The syncer operates after all entity syncers have completed their work,
 * ensuring that all referenced entities exist before creating relationships.
 */
class RelationshipSyncer extends BaseSyncer {
  constructor(dependencies) {
    super({ ...dependencies, entityType: 'relationships' });
  }

  /**
   * Clear all relationship tables
   * @returns {Promise<void>}
   */
  async clearExistingData() {
    // Clear in correct order to respect foreign key constraints
    this.db.prepare('DELETE FROM character_links').run();
    this.db.prepare('DELETE FROM character_timeline_events').run();
    this.db.prepare('DELETE FROM character_owned_elements').run();
    this.db.prepare('DELETE FROM character_associated_elements').run();
    this.db.prepare('DELETE FROM character_puzzles').run();
    // Note: puzzle_elements and element_containers tables don't exist in current schema
  }

  /**
   * Validate that all referenced entities exist
   * @param {Object} relationships - Object containing relationship data
   * @returns {Promise<{valid: boolean, errors: string[]}>}
   */
  async validateRelationships(relationships) {
    const errors = [];
    
    // Check character existence
    if (relationships.characterIds) {
      const missingChars = await this._findMissingEntities(
        'characters', 
        relationships.characterIds
      );
      if (missingChars.length > 0) {
        errors.push(`Missing characters: ${missingChars.join(', ')}`);
      }
    }

    // Check element existence
    if (relationships.elementIds) {
      const missingElems = await this._findMissingEntities(
        'elements', 
        relationships.elementIds
      );
      if (missingElems.length > 0) {
        errors.push(`Missing elements: ${missingElems.join(', ')}`);
      }
    }

    // Check puzzle existence
    if (relationships.puzzleIds) {
      const missingPuzzles = await this._findMissingEntities(
        'puzzles', 
        relationships.puzzleIds
      );
      if (missingPuzzles.length > 0) {
        errors.push(`Missing puzzles: ${missingPuzzles.join(', ')}`);
      }
    }

    // Check timeline event existence
    if (relationships.eventIds) {
      const missingEvents = await this._findMissingEntities(
        'timeline_events', 
        relationships.eventIds
      );
      if (missingEvents.length > 0) {
        errors.push(`Missing events: ${missingEvents.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Find entities that don't exist in the database
   * @private
   * @param {string} table - Table name
   * @param {string[]} ids - Array of entity IDs
   * @returns {Promise<string[]>} Array of missing IDs
   */
  async _findMissingEntities(table, ids) {
    if (!ids || ids.length === 0) return [];
    
    const placeholders = ids.map(() => '?').join(',');
    const existing = this.db.prepare(
      `SELECT id FROM ${table} WHERE id IN (${placeholders})`
    ).all(...ids);
    
    const existingIds = new Set(existing.map(e => e.id));
    return ids.filter(id => !existingIds.has(id));
  }

  /**
   * Sync character-entity relationships (events, elements, puzzles)
   * @returns {Promise<{processed: number, errors: number}>}
   */
  async syncCharacterRelationships() {
    this.logger.info('Syncing character-entity relationships...');
    let processed = 0;
    let errors = 0;

    try {
      // Get all characters from Notion to fetch their relationships
      const characters = await this.notionService.getCharacters();
      
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

      // Process each character's relationships
      for (const character of characters) {
        try {
          const characterData = await this.propertyMapper.mapCharacterWithNames(character, this.notionService);
          const characterId = characterData.id;

          // Process timeline events
          if (characterData.events && Array.isArray(characterData.events)) {
            for (const event of characterData.events) {
              const eventId = event.id || event;
              try {
                insertEventRel.run(characterId, eventId);
                processed++;
              } catch (err) {
                if (!err.message.includes('FOREIGN KEY constraint failed')) {
                  this.logger.warn(`Failed to link character ${characterId} to event ${eventId}: ${err.message}`);
                  errors++;
                }
              }
            }
          }

          // Process owned elements
          if (characterData.ownedElements && Array.isArray(characterData.ownedElements)) {
            for (const element of characterData.ownedElements) {
              const elementId = element.id || element;
              try {
                insertOwnedElement.run(characterId, elementId);
                processed++;
              } catch (err) {
                if (!err.message.includes('FOREIGN KEY constraint failed')) {
                  this.logger.warn(`Failed to link character ${characterId} to owned element ${elementId}: ${err.message}`);
                  errors++;
                }
              }
            }
          }

          // Process associated elements
          if (characterData.associatedElements && Array.isArray(characterData.associatedElements)) {
            for (const element of characterData.associatedElements) {
              const elementId = element.id || element;
              try {
                insertAssocElement.run(characterId, elementId);
                processed++;
              } catch (err) {
                if (!err.message.includes('FOREIGN KEY constraint failed')) {
                  this.logger.warn(`Failed to link character ${characterId} to associated element ${elementId}: ${err.message}`);
                  errors++;
                }
              }
            }
          }

          // Process puzzles
          if (characterData.puzzles && Array.isArray(characterData.puzzles)) {
            for (const puzzle of characterData.puzzles) {
              const puzzleId = puzzle.id || puzzle;
              try {
                insertPuzzleRel.run(characterId, puzzleId);
                processed++;
              } catch (err) {
                if (!err.message.includes('FOREIGN KEY constraint failed')) {
                  this.logger.warn(`Failed to link character ${characterId} to puzzle ${puzzleId}: ${err.message}`);
                  errors++;
                }
              }
            }
          }

        } catch (error) {
          this.logger.error(`Failed to process relationships for character ${character.id}: ${error.message}`);
          errors++;
        }
      }

      this.logger.info(`Character relationships sync: ${processed} processed, ${errors} errors`);
      return { processed, errors };

    } catch (error) {
      this.logger.error(`Character relationships sync failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Compute character links based on shared experiences
   * @returns {Promise<{processed: number, errors: number}>}
   */
  async computeCharacterLinks() {
    this.logger.info('Computing character links...');
    let processed = 0;
    let errors = 0;

    try {
      // Start transaction
      this.db.prepare('BEGIN TRANSACTION').run();

      // Clear existing links
      this.db.prepare('DELETE FROM character_links').run();

      // Get all characters
      const characters = this.db.prepare('SELECT id FROM characters').all();
      
      // For each character pair, compute link strength
      for (let i = 0; i < characters.length; i++) {
        for (let j = i + 1; j < characters.length; j++) {
          try {
            const char1Id = characters[i].id;
            const char2Id = characters[j].id;
            
            // Compute link strength based on:
            // 1. Shared timeline events
            // 2. Shared puzzles
            // 3. Shared elements
            const strength = await this._computeLinkStrength(char1Id, char2Id);
            
            if (strength > 0) {
              this.db.prepare(
                'INSERT INTO character_links (character1_id, character2_id, strength) VALUES (?, ?, ?)'
              ).run(char1Id, char2Id, strength);
              processed++;
            }
          } catch (error) {
            this.logger.error(`Error computing link between characters: ${error.message}`);
            errors++;
          }
        }
      }

      // Commit transaction
      this.db.prepare('COMMIT').run();
      
      return { processed, errors };
    } catch (error) {
      // Rollback on error
      this.db.prepare('ROLLBACK').run();
      throw error;
    }
  }

  /**
   * Compute link strength between two characters
   * @private
   * @param {string} char1Id - First character ID
   * @param {string} char2Id - Second character ID
   * @returns {Promise<number>} Link strength (0-100)
   */
  async _computeLinkStrength(char1Id, char2Id) {
    let strength = 0;

    // Check shared timeline events (weight: 30)
    const sharedEvents = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM character_timeline_events e1
      JOIN character_timeline_events e2 ON e1.timeline_event_id = e2.timeline_event_id
      WHERE e1.character_id = ? AND e2.character_id = ?
    `).get(char1Id, char2Id);
    strength += (sharedEvents.count * 30);

    // Check shared puzzles (weight: 25)
    const sharedPuzzles = this.db.prepare(`
      SELECT COUNT(*) as count
      FROM character_puzzles p1
      JOIN character_puzzles p2 ON p1.puzzle_id = p2.puzzle_id
      WHERE p1.character_id = ? AND p2.character_id = ?
    `).get(char1Id, char2Id);
    strength += (sharedPuzzles.count * 25);

    // Check shared elements (weight: 15)
    const sharedElements = this.db.prepare(`
      SELECT COUNT(*) as count FROM (
        SELECT element_id FROM character_owned_elements WHERE character_id = ?
        UNION
        SELECT element_id FROM character_associated_elements WHERE character_id = ?
      ) e1
      JOIN (
        SELECT element_id FROM character_owned_elements WHERE character_id = ?
        UNION
        SELECT element_id FROM character_associated_elements WHERE character_id = ?
      ) e2 ON e1.element_id = e2.element_id
    `).get(char1Id, char1Id, char2Id, char2Id);
    strength += (sharedElements.count * 15);

    // Cap at 100
    return Math.min(strength, 100);
  }

  /**
   * Main sync method
   * @returns {Promise<{processed: number, errors: number}>}
   */
  async sync() {
    this.logger.info('Starting relationship sync...');
    const startTime = Date.now();

    try {
      // Initialize database connection
      this.initDB();
      
      // Clear existing relationships
      await this.clearExistingData();

      // Sync character-entity relationships
      const charRelStats = await this.syncCharacterRelationships();

      // Compute character links based on shared experiences  
      const linkStats = await this.computeCharacterLinks();

      const duration = Date.now() - startTime;
      this.logger.info(`Relationship sync completed in ${duration}ms`);
      
      return {
        processed: charRelStats.processed + linkStats.processed,
        errors: charRelStats.errors + linkStats.errors,
        duration
      };
    } catch (error) {
      this.logger.error(`Relationship sync failed: ${error.message}`);
      throw error;
    }
  }
}

module.exports = RelationshipSyncer; 