const BaseSyncer = require('./BaseSyncer');

/**
 * Syncer for Timeline Event entities.
 * Handles fetching from Notion, mapping, and inserting timeline event data.
 *
 * Timeline Events have many-to-many relationships with:
 * - Characters (characters involved)
 * - Elements (memory/evidence)
 *
 * @extends BaseSyncer
 */
class TimelineEventSyncer extends BaseSyncer {
  /**
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.notionService - Service for fetching from Notion
   * @param {Object} dependencies.propertyMapper - Service for mapping Notion properties
   * @param {Object} dependencies.logger - SyncLogger instance
   */
  constructor(dependencies) {
    super({ ...dependencies, entityType: 'timeline_events' });
  }

  /**
   * Fetch timeline events from Notion
   * @returns {Promise<Array>} Array of Notion timeline event objects
   */
  async fetchFromNotion() {
    return await this.notionService.getTimelineEvents();
  }

  /**
   * Clear existing timeline event data and related tables
   * @returns {Promise<void>}
   */
  async clearExistingData() {
    // Clear tables that have foreign key to timeline_events, in correct order
    this.db.prepare('DELETE FROM character_timeline_events').run();

    // Also update elements that reference timeline events
    this.db.prepare('UPDATE elements SET timeline_event_id = NULL').run();

    // Finally, clear the timeline_events table
    this.db.prepare('DELETE FROM timeline_events').run();
  }

  /**
   * Map Notion timeline event data to database format
   * @param {Object} notionEvent - Raw Notion timeline event object
   * @returns {Promise<Object>} Mapped timeline event data
   */
  async mapData(notionEvent) {
    try {
      const mapped = await this.propertyMapper.mapTimelineEventWithNames(
        notionEvent,
        this.notionService
      );

      if (mapped.error) {
        return { error: mapped.error };
      }

      // Convert arrays to JSON strings
      const characterIds = mapped.charactersInvolved
        ? JSON.stringify(mapped.charactersInvolved.map(c => c.id))
        : '[]';

      const elementIds = mapped.memoryEvidence
        ? JSON.stringify(mapped.memoryEvidence.map(e => e.id))
        : '[]';

      return {
        id: mapped.id,
        description: mapped.description || '',
        date: mapped.date || '',
        character_ids: characterIds,
        element_ids: elementIds,
        notes: mapped.notes || '',
        // Store relationships for post-processing
        _relationships: {
          characters: mapped.charactersInvolved || [],
          elements: mapped.memoryEvidence || []
        }
      };
    } catch (error) {
      return { error: error.message };
    }
  }

  /**
   * Insert timeline event data into database
   * @param {Object} mappedData - Mapped timeline event data
   * @returns {Promise<void>}
   */
  async insertData(mappedData) {
    // Extract relationships before inserting
    const { _relationships, ...eventData } = mappedData;

    const stmt = this.db.prepare(`
      INSERT INTO timeline_events (
        id, description, date, character_ids, element_ids, notes
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      eventData.id,
      eventData.description,
      eventData.date,
      eventData.character_ids,
      eventData.element_ids,
      eventData.notes
    );

    // Store relationships for post-processing
    if (!this._pendingRelationships) {
      this._pendingRelationships = [];
    }
    this._pendingRelationships.push({
      eventId: eventData.id,
      relationships: _relationships
    });
  }

  /**
   * Process timeline event relationships after all events are synced
   * @returns {Promise<void>}
   */
  async postProcess() {
    if (!this._pendingRelationships || this._pendingRelationships.length === 0) {
      return;
    }

    this.logger.info(`Processing relationships for ${this._pendingRelationships.length} timeline events...`);

    // Prepare insert statement for character-timeline event relationships
    const insertCharEventRel = this.db.prepare(
      'INSERT OR IGNORE INTO character_timeline_events (character_id, timeline_event_id) VALUES (?, ?)'
    );

    // Process all pending relationships
    for (const pending of this._pendingRelationships) {
      const { eventId, relationships } = pending;

      // Process character relationships
      if (relationships.characters && Array.isArray(relationships.characters)) {
        for (const character of relationships.characters) {
          let charId = character.id || character;

          // If no ID but we have a name, look up the character ID
          if (!charId && character.name) {
            const foundChar = this.db.prepare('SELECT id FROM characters WHERE name = ?').get(character.name);
            if (foundChar) {
              charId = foundChar.id;
            } else {
              this.logger.warn(`Character not found for name: ${character.name} in event ${eventId}`);
              continue;
            }
          }

          if (charId) {
            insertCharEventRel.run(charId, eventId);
          }
        }
      }

      // Note: Element relationships are stored as JSON in the timeline_events table
      // No separate junction table needed for elements
    }

    // Clear pending relationships
    this._pendingRelationships = [];
  }

  /**
   * Get current timeline event count for dry run
   * @returns {Promise<number>} Current timeline event count
   */
  async getCurrentRecordCount() {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM timeline_events').get();
    return result.count;
  }
}

module.exports = TimelineEventSyncer;
