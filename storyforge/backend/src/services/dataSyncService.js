const notionService = require('./notionService');
const propertyMapper = require('../utils/notionPropertyMapper');
const { getDB } = require('../db/database');
const { invalidateJourneyCache, clearExpiredJourneyCache } = require('../db/queries');
const SyncLogger = require('./sync/SyncLogger');
const CharacterSyncer = require('./sync/entitySyncers/CharacterSyncer');
const ElementSyncer = require('./sync/entitySyncers/ElementSyncer');
const PuzzleSyncer = require('./sync/entitySyncers/PuzzleSyncer');
const TimelineEventSyncer = require('./sync/entitySyncers/TimelineEventSyncer');

class DataSyncService {
  constructor() {
    this.db = null;
  }

  /**
   * Perform cache maintenance after sync
   */
  async performCacheMaintenance() {
    try {
      // Clear expired caches older than 7 days
      clearExpiredJourneyCache(168);
      
      // Invalidate all journey caches since we've synced new data
      // In a more sophisticated implementation, we could track which characters
      // were affected and only invalidate those specific caches
      const characters = this.db.prepare('SELECT id FROM characters').all();
      let invalidated = 0;
      
      for (const char of characters) {
        try {
          invalidateJourneyCache(char.id);
          invalidated++;
        } catch (error) {
          console.warn(`Failed to invalidate cache for character ${char.id}:`, error.message);
        }
      }
      
      console.log(`✅ Cache maintenance complete. Invalidated ${invalidated} journey caches.`);
    } catch (error) {
      console.error('❌ Error during cache maintenance:', error);
      // Don't throw - cache maintenance failure shouldn't break sync
    }
  }

  /**
   * Initialize database connection
   */
  initDB() {
    if (!this.db) {
      this.db = getDB();
    }
    return this.db;
  }

  //<editor-fold desc="Sync Logging">
  logSyncStart(entityType) {
    const stmt = this.db.prepare(
        'INSERT INTO sync_log (start_time, status, entity_type) VALUES (?, ?, ?)'
    );
    const { lastInsertRowid } = stmt.run(new Date().toISOString(), 'started', entityType);
    return lastInsertRowid;
  }

  logSyncSuccess(logId, recordsFetched, recordsSynced, errors) {
    this.db.prepare(
        `UPDATE sync_log 
         SET end_time = ?, status = 'completed', records_fetched = ?, records_synced = ?, errors = ?
         WHERE id = ?`
    ).run(new Date().toISOString(), recordsFetched, recordsSynced, errors, logId);
  }

  logSyncFailure(logId, error, recordsFetched = 0, recordsSynced = 0) {
    this.db.prepare(
        `UPDATE sync_log 
         SET end_time = ?, status = 'failed', error_details = ?, records_fetched = ?, records_synced = ?
         WHERE id = ?`
    ).run(new Date().toISOString(), error.message, recordsFetched, recordsSynced, logId);
  }
  //</editor-fold>

  /**
   * Sync all data from Notion to SQLite in a structured, observable manner.
   */
  async syncAll() {
    console.log('🔄 Starting full data sync from Notion to SQLite...');
    this.initDB();
    const overallLogId = this.logSyncStart('all');
    const startTime = Date.now();

    try {
      // PHASE 1: Sync all base entities
      console.log('\n--- PHASE 1: SYNCING BASE ENTITIES ---');
      await this.syncCharacters();
      await this.syncElements();
      await this.syncPuzzles();
      await this.syncTimelineEvents();

      // PHASE 2: Sync relationships
      console.log('\n--- PHASE 2: SYNCING RELATIONSHIPS ---');
      await this.syncCharacterRelationships();

      // PHASE 3: Compute Links
      console.log('\n--- PHASE 3: COMPUTING LINKS ---');
      await this.computeCharacterLinks();

      // PHASE 4: Compute derived fields
      console.log('\n--- PHASE 4: COMPUTING DERIVED FIELDS ---');
      await this.computeDerivedFields();

      // PHASE 5: Clear expired caches and invalidate all journey caches
      console.log('\n--- PHASE 5: CACHE MAINTENANCE ---');
      await this.performCacheMaintenance();

      const duration = Date.now() - startTime;
      console.log(`\n🎉 MASTER SYNC COMPLETE! Duration: ${duration}ms`);
      this.logSyncSuccess(overallLogId, -1, -1, -1); // -1 indicates an aggregate log
      return { success: true, duration };

    } catch (error) {
      console.error('❌ MASTER SYNC FAILED:', error);
      this.logSyncFailure(overallLogId, error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Sync all characters from Notion to SQLite using the new CharacterSyncer.
   * This method now delegates to the modular syncer while maintaining backward compatibility.
   */
  async syncCharacters() {
    console.log('📝 Syncing characters...');
    
    // Create a SyncLogger instance
    const syncLogger = new SyncLogger();
    
    // Create and run the character syncer
    const characterSyncer = new CharacterSyncer({
      notionService,
      propertyMapper,
      logger: syncLogger
    });
    
    try {
      const stats = await characterSyncer.sync();
      
      // Note: characterSyncer handles its own relationship syncing via postProcess()
      // so we don't need to call syncCharacterRelationships() separately for characters
      
      return stats;
    } catch (error) {
      // Error is already logged by the syncer
      throw error;
    }
  }

  /**
   * Sync all elements from Notion to SQLite using the new ElementSyncer.
   * This method now delegates to the modular syncer while maintaining backward compatibility.
   */
  async syncElements() {
    console.log('🚮 Syncing elements...');
    
    // Create a SyncLogger instance
    const syncLogger = new SyncLogger();
    
    // Create and run the element syncer
    const elementSyncer = new ElementSyncer({
      notionService,
      propertyMapper,
      logger: syncLogger
    });
    
    try {
      const stats = await elementSyncer.sync();
      return stats;
    } catch (error) {
      // Error is already logged by the syncer
      throw error;
    }
  }

  /**
   * Sync all puzzles from Notion to SQLite using the new PuzzleSyncer.
   * This method now delegates to the modular syncer while maintaining backward compatibility.
   */
  async syncPuzzles() {
    console.log('🧩 Syncing puzzles...');
    
    // Create a SyncLogger instance
    const syncLogger = new SyncLogger();
    
    // Create and run the puzzle syncer
    const puzzleSyncer = new PuzzleSyncer({
      notionService,
      propertyMapper,
      logger: syncLogger
    });
    
    try {
      const stats = await puzzleSyncer.sync();
      return stats;
    } catch (error) {
      // Error is already logged by the syncer
      throw error;
    }
  }

  /**
   * Sync all timeline events from Notion to SQLite using the new TimelineEventSyncer.
   * This method now delegates to the modular syncer while maintaining backward compatibility.
   */
  async syncTimelineEvents() {
    console.log('📅 Syncing timeline events...');
    
    // Create a SyncLogger instance
    const syncLogger = new SyncLogger();
    
    // Create and run the timeline event syncer
    const timelineEventSyncer = new TimelineEventSyncer({
      notionService,
      propertyMapper,
      logger: syncLogger
    });
    
    try {
      const stats = await timelineEventSyncer.sync();
      
      // Note: TimelineEventSyncer handles its own relationship syncing via postProcess()
      // for character-timeline event relationships
      
      return stats;
    } catch (error) {
      // Error is already logged by the syncer
      throw error;
    }
  }

  /**
   * Compute Act Focus for a timeline event based on related elements
   */
  async computeTimelineActFocus(timelineEvent) {
    try {
      const elementIds = JSON.parse(timelineEvent.element_ids || '[]');
      
      if (elementIds.length === 0) return null;
      
      // Get elements and count acts
      const placeholders = elementIds.map(() => '?').join(',');
      const elements = this.db.prepare(
        `SELECT first_available FROM elements WHERE id IN (${placeholders})`
      ).all(...elementIds);
      
      const actCounts = {};
      elements.forEach(el => {
        if (el.first_available) {
          actCounts[el.first_available] = (actCounts[el.first_available] || 0) + 1;
        }
      });
      
      // Return most common act
      const sortedActs = Object.entries(actCounts).sort(([,a], [,b]) => b - a);
      return sortedActs[0]?.[0] || null;
    } catch (error) {
      console.error(`Error computing act focus for timeline event ${timelineEvent.id}:`, error);
      return null;
    }
  }

  /**
   * Compute Narrative Threads for a puzzle based on reward elements
   */
  async computePuzzleNarrativeThreads(puzzle) {
    try {
      const rewardIds = JSON.parse(puzzle.reward_ids || '[]');
      
      if (rewardIds.length === 0) return [];
      
      // Get narrative threads from reward elements
      const placeholders = rewardIds.map(() => '?').join(',');
      const elements = this.db.prepare(
        `SELECT narrative_threads FROM elements WHERE id IN (${placeholders})`
      ).all(...rewardIds);
      
      const threads = new Set();
      elements.forEach(el => {
        try {
          const elThreads = JSON.parse(el.narrative_threads || '[]');
          elThreads.forEach(thread => threads.add(thread));
        } catch (e) {
          // Skip malformed JSON
        }
      });
      
      return Array.from(threads);
    } catch (error) {
      console.error(`Error computing narrative threads for puzzle ${puzzle.id}:`, error);
      return [];
    }
  }

  /**
   * Compute Resolution Paths based on entity type and attributes
   */
  computeResolutionPaths(entity, entityType) {
    const paths = [];
    
    try {
      if (entityType === 'character') {
        // Check owned elements for path indicators
        const ownedElements = this.db.prepare(
          'SELECT e.name, e.type FROM elements e JOIN character_owned_elements coe ON e.id = coe.element_id WHERE coe.character_id = ?'
        ).all(entity.id);
        
        const hasBlackMarket = ownedElements.some(el => 
          el.name?.toLowerCase().includes('black market') || 
          el.type?.toLowerCase().includes('memory')
        );
        if (hasBlackMarket) paths.push('Black Market');
        
        const hasDetective = ownedElements.some(el =>
          el.type?.toLowerCase().includes('evidence') ||
          el.name?.toLowerCase().includes('clue') ||
          el.name?.toLowerCase().includes('investigation')
        );
        if (hasDetective) paths.push('Detective');
        
        // High connections suggest Third Path
        if (entity.connections > 5) paths.push('Third Path');
      }
      
      if (entityType === 'puzzle') {
        // Based on narrative threads
        const threads = JSON.parse(entity.computed_narrative_threads || '[]');
        if (threads.includes('Underground Parties') || threads.includes('Memory Drug')) {
          paths.push('Black Market');
        }
        if (threads.includes('Corp. Espionage') || threads.includes('Corporate Espionage')) {
          paths.push('Detective');
        }
        if (threads.includes('Marriage Troubles') || threads.includes('Community')) {
          paths.push('Third Path');
        }
      }
      
      if (entityType === 'element') {
        // Based on element name/type
        if (entity.name?.toLowerCase().includes('black market') || 
            entity.type?.toLowerCase().includes('memory')) {
          paths.push('Black Market');
        }
        if (entity.type?.toLowerCase().includes('evidence') || 
            entity.name?.toLowerCase().includes('clue') ||
            entity.type?.toLowerCase().includes('investigation')) {
          paths.push('Detective');
        }
        if (entity.name?.toLowerCase().includes('community') ||
            entity.type?.toLowerCase().includes('personal')) {
          paths.push('Third Path');
        }
      }
    } catch (error) {
      console.error(`Error computing resolution paths for ${entityType} ${entity.id}:`, error);
    }
    
    return paths.length > 0 ? paths : ['Unassigned'];
  }

  /**
   * Compute all derived fields after base data sync
   */
  async computeDerivedFields() {
    this.initDB();
    const logId = this.logSyncStart('derived_fields');
    console.log('🧮 Computing all derived fields...');
    let stats = { processed: 0, errors: 0 };

    this.db.exec('BEGIN');
    try {
      const puzzleTableInfo = this.db.prepare("PRAGMA table_info(puzzles)").all();
      const hasNarrativeThreadsColumn = puzzleTableInfo.some(col => col.name === 'narrative_threads');

      // 1. Compute Act Focus for Timeline Events
      const timelineEvents = this.db.prepare('SELECT * FROM timeline_events').all();
      const updateActFocusStmt = this.db.prepare('UPDATE timeline_events SET act_focus = ? WHERE id = ?');
      for (const event of timelineEvents) {
        const actFocus = await this.computeTimelineActFocus(event);
        if (actFocus) {
          updateActFocusStmt.run(actFocus, event.id);
        }
        stats.processed++;
      }
      console.log(`- Processed Act Focus for ${timelineEvents.length} timeline events.`);

      // 2. Compute Narrative Threads & Resolution Paths for Puzzles
      const puzzles = this.db.prepare('SELECT * FROM puzzles').all();
      const updateThreadsStmt = this.db.prepare('UPDATE puzzles SET computed_narrative_threads = ? WHERE id = ?');
      const updatePuzzlePathsStmt = this.db.prepare('UPDATE puzzles SET resolution_paths = ? WHERE id = ?');
      for (const puzzle of puzzles) {
        if (hasNarrativeThreadsColumn) {
          const narrativeThreads = await this.computePuzzleNarrativeThreads(puzzle);
          if (narrativeThreads.length > 0) {
            updateThreadsStmt.run(JSON.stringify(narrativeThreads), puzzle.id);
            puzzle.computed_narrative_threads = JSON.stringify(narrativeThreads);
          }
        }
        const resolutionPaths = this.computeResolutionPaths(puzzle, 'puzzle');
        updatePuzzlePathsStmt.run(JSON.stringify(resolutionPaths), puzzle.id);
        stats.processed++;
      }
      console.log(`- Processed Narrative Threads & Paths for ${puzzles.length} puzzles.`);

      // 3. Compute Resolution Paths for Characters
      const characters = this.db.prepare('SELECT * FROM characters').all();
      const updateCharPathsStmt = this.db.prepare('UPDATE characters SET resolution_paths = ? WHERE id = ?');
      for (const character of characters) {
        const resolutionPaths = this.computeResolutionPaths(character, 'character');
        updateCharPathsStmt.run(JSON.stringify(resolutionPaths), character.id);
        stats.processed++;
      }
      console.log(`- Processed Resolution Paths for ${characters.length} characters.`);

      // 4. Compute Resolution Paths for Elements
      const elements = this.db.prepare('SELECT * FROM elements').all();
      const updateElemPathsStmt = this.db.prepare('UPDATE elements SET resolution_paths = ? WHERE id = ?');
      for (const element of elements) {
        const resolutionPaths = this.computeResolutionPaths(element, 'element');
        updateElemPathsStmt.run(JSON.stringify(resolutionPaths), element.id);
        stats.processed++;
      }
      console.log(`- Processed Resolution Paths for ${elements.length} elements.`);

      this.db.exec('COMMIT');
      console.log(`✅ Derived fields computed for ${stats.processed} total entities.`);
      this.logSyncSuccess(logId, stats.processed, stats.processed, stats.errors);

    } catch (error) {
      console.error('❌ Error computing derived fields:', error);
      stats.errors++;
      if (this.db.inTransaction) {
        this.db.exec('ROLLBACK');
      }
      this.logSyncFailure(logId, error, stats.processed, 0);
      throw error;
    }
  }

  /**
   * Sync character relationships after all base tables are populated.
   * Note: Character relationships are now handled by CharacterSyncer.postProcess(),
   * so this method is kept for backward compatibility but may be redundant
   * if all entities are properly refactored to handle their own relationships.
   */
  async syncCharacterRelationships() {
    // TODO: Once all entity syncers are refactored, this entire method can be removed
    // as each syncer will handle its own relationships via postProcess()
    
    // For now, skip if characters were just synced by CharacterSyncer
    console.log('🔗 Character relationships already synced by CharacterSyncer');
    return { fetched: 0, synced: 0, errors: 0 };
  }

  /**
   * Compute character links from timeline events, puzzles, and elements
   */
  async computeCharacterLinks() {
    this.initDB();
    const logId = this.logSyncStart('character_links');
    console.log('🔗 Computing character links...');
    let stats = { fetched: 0, synced: 0, errors: 0 };

    try {
      this.db.exec('BEGIN');
      this.db.prepare('DELETE FROM character_links').run();

      const insertLink = this.db.prepare(`
        INSERT OR IGNORE INTO character_links 
        (character_a_id, character_b_id, link_type, link_source_id)
        VALUES (?, ?, ?, ?)
      `);

      // 1. Links from shared timeline events
      const sharedEvents = this.db.prepare(`
        SELECT timeline_event_id, GROUP_CONCAT(character_id) as characters
        FROM character_timeline_events GROUP BY timeline_event_id HAVING COUNT(DISTINCT character_id) > 1
      `).all();
      stats.fetched += sharedEvents.length;
      for (const event of sharedEvents) {
        const characterIds = event.characters.split(',');
        for (let i = 0; i < characterIds.length; i++) {
          for (let j = i + 1; j < characterIds.length; j++) {
            const [charA, charB] = [characterIds[i], characterIds[j]].sort();
            insertLink.run(charA, charB, 'timeline_event', event.timeline_event_id);
            stats.synced++;
          }
        }
      }

      // 2. Links from puzzle ownership and elements
      const puzzleConnections = this.db.prepare(`
        SELECT DISTINCT p.owner_id, cae.character_id, p.id as puzzle_id
        FROM puzzles p
        JOIN elements e ON json_extract(p.puzzle_element_ids, '$') LIKE '%' || e.id || '%'
        JOIN character_associated_elements cae ON cae.element_id = e.id
        WHERE p.owner_id IS NOT NULL AND p.owner_id != cae.character_id
      `).all();
      stats.fetched += puzzleConnections.length;
      for (const connection of puzzleConnections) {
        const [charA, charB] = [connection.owner_id, connection.character_id].sort();
        insertLink.run(charA, charB, 'puzzle', connection.puzzle_id);
        stats.synced++;
      }

      // 3. Links from shared elements (owned or associated)
      const elementConnections = this.db.prepare(`
        WITH all_element_chars AS (
          SELECT element_id, character_id FROM character_owned_elements
          UNION
          SELECT element_id, character_id FROM character_associated_elements
        )
        SELECT element_id, GROUP_CONCAT(DISTINCT character_id) as characters
        FROM all_element_chars GROUP BY element_id HAVING COUNT(DISTINCT character_id) > 1
      `).all();
      stats.fetched += elementConnections.length;
      for (const element of elementConnections) {
        const characterIds = element.characters.split(',');
        for (let i = 0; i < characterIds.length; i++) {
          for (let j = i + 1; j < characterIds.length; j++) {
            const [charA, charB] = [characterIds[i], characterIds[j]].sort();
            insertLink.run(charA, charB, 'element', element.element_id);
            stats.synced++;
          }
        }
      }

      this.db.exec('COMMIT');
      console.log(`✅ Computed ${stats.synced} character links from ${stats.fetched} sources.`);
      this.logSyncSuccess(logId, stats.fetched, stats.synced, stats.errors);
      
    } catch (error) {
      console.error('❌ Error computing character links:', error);
      if (this.db.inTransaction) {
        this.db.exec('ROLLBACK');
      }
      this.logSyncFailure(logId, error, stats.fetched, stats.synced);
      throw error;
    }
  }

  /**
   * Get sync status
   */
  async getSyncStatus() {
    try {
      this.initDB();
      
      const counts = {};
      const tables = ['characters', 'elements', 'puzzles', 'timeline_events', 'character_links'];
      
      for (const table of tables) {
        const result = this.db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        counts[table] = result.count;
      }
      
      return {
        success: true,
        counts,
        lastSync: new Date().toISOString() // TODO: Store actual last sync time
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = DataSyncService; 