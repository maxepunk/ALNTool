const notionService = require('./notionService');
const propertyMapper = require('../utils/notionPropertyMapper');
const { getDB } = require('../db/database');

class DataSyncService {
  constructor() {
    this.db = null;
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
   * Sync all characters from Notion to SQLite in a single transaction.
   * This function is now self-contained and manages its own logging and transaction.
   */
  async syncCharacters() {
    this.initDB();
    const logId = this.logSyncStart('characters');
    console.log('📝 Syncing characters...');

    let stats = { fetched: 0, synced: 0, errors: 0 };
    let notionCharacters = [];

    try {
      notionCharacters = await notionService.getCharacters();
      stats.fetched = notionCharacters.length;

      if (stats.fetched === 0) {
        console.log('⚠️  No characters found in Notion.');
        this.logSyncSuccess(logId, 0, 0, 0);
        return;
      }

      this.db.exec('BEGIN');

      // Clear all tables that have a foreign key to characters, in the correct order.
      this.db.prepare('DELETE FROM character_links').run();
      this.db.prepare('DELETE FROM character_timeline_events').run();
      this.db.prepare('DELETE FROM character_owned_elements').run();
      this.db.prepare('DELETE FROM character_associated_elements').run();
      this.db.prepare('DELETE FROM character_puzzles').run();
      this.db.prepare('DELETE FROM cached_journey_gaps').run();
      this.db.prepare('DELETE FROM cached_journey_segments').run();
      // Defer deleting puzzles and interactions as they may be linked to multiple entities
      // this.db.prepare('DELETE FROM puzzles').run();
      // this.db.prepare('DELETE FROM interactions').run();
      this.db.prepare('DELETE FROM characters').run();

      const insertCharStmt = this.db.prepare(
          'INSERT INTO characters (id, name, type, tier, logline, connections) VALUES (?, ?, ?, ?, ?, ?)'
      );

      for (const notionChar of notionCharacters) {
        try {
          const mappedChar = await propertyMapper.mapCharacterWithNames(notionChar, notionService);
          if (mappedChar && !mappedChar.error) {
            insertCharStmt.run(
                mappedChar.id,
                mappedChar.name || '',
                mappedChar.type || '',
                mappedChar.tier || '',
                mappedChar.logline || '',
                mappedChar.connections || 0
            );
            stats.synced++;
          } else {
            console.warn(`⚠️  Failed to map character ${notionChar.id}:`, mappedChar?.error);
            stats.errors++;
          }
        } catch (charError) {
          console.error(`❌ Error processing character ${notionChar.id}:`, charError.message);
          stats.errors++;
        }
      }

      this.db.exec('COMMIT');
      console.log(`✅ Characters: ${stats.synced}/${stats.fetched} synced successfully.`);
      this.logSyncSuccess(logId, stats.fetched, stats.synced, stats.errors);

    } catch (error) {
      console.error('❌ Character sync failed:', error);
      if (this.db.inTransaction) {
        this.db.exec('ROLLBACK');
      }
      this.logSyncFailure(logId, error, stats.fetched, stats.synced);
      throw error; // Re-throw to halt the master sync process
    }
  }

  /**
   * Sync elements from Notion to SQLite
   */
  async syncElements() {
    this.initDB();
    const logId = this.logSyncStart('elements');
    console.log('🚮 Clearing and syncing elements...');
    let stats = { fetched: 0, synced: 0, errors: 0 };

    try {
      const notionElements = await notionService.getElements();
      stats.fetched = notionElements.length;

      if (stats.fetched === 0) {
        console.log('⚠️ No elements found in Notion.');
        this.logSyncSuccess(logId, 0, 0, 0);
        return;
      }

      this.db.exec('BEGIN');

      this.db.prepare('DELETE FROM elements').run();

      const insertStmt = this.db.prepare(`
        INSERT INTO elements (
          id, name, type, description, status, owner_id, 
          container_id, production_notes, first_available, timeline_event_id
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const notionElement of notionElements) {
        try {
          const mappedElement = await propertyMapper.mapElementWithNames(notionElement, notionService);
          if (mappedElement && !mappedElement.error) {
            const ownerId = mappedElement.owner && mappedElement.owner.length > 0 ? mappedElement.owner[0].id : null;
            const containerId = mappedElement.container && mappedElement.container.length > 0 ? mappedElement.container[0].id : null;
            const timelineEventId = mappedElement.timelineEvent && mappedElement.timelineEvent.length > 0 ? mappedElement.timelineEvent[0].id : null;
            
            insertStmt.run(
              mappedElement.id, mappedElement.name || '', mappedElement.basicType || '',
              mappedElement.description || '', mappedElement.status || '', ownerId,
              containerId, mappedElement.productionNotes || '',
              mappedElement.firstAvailable || '', timelineEventId
            );
            stats.synced++;
          } else {
            stats.errors++;
            console.warn(`⚠️ Failed to map element ${notionElement.id}:`, mappedElement?.error);
          }
        } catch (elementError) {
          stats.errors++;
          console.error(`❌ Error processing element ${notionElement.id}:`, elementError.message);
        }
      }

      this.db.exec('COMMIT');
      console.log(`✅ Elements: ${stats.synced}/${stats.fetched} synced successfully.`);
      this.logSyncSuccess(logId, stats.fetched, stats.synced, stats.errors);

    } catch (error) {
      console.error('❌ Element sync failed:', error);
      if (this.db.inTransaction) {
        this.db.exec('ROLLBACK');
      }
      this.logSyncFailure(logId, error, stats.fetched, stats.synced);
      throw error; // Re-throw
    }
  }

  /**
   * Sync puzzles from Notion to SQLite
   */
  async syncPuzzles() {
    this.initDB();
    const logId = this.logSyncStart('puzzles');
    console.log('🧩 Clearing and syncing puzzles...');
    let stats = { fetched: 0, synced: 0, errors: 0 };

    try {
      const notionPuzzles = await notionService.getPuzzles();
      stats.fetched = notionPuzzles.length;

      if (stats.fetched === 0) {
        console.log('⚠️ No puzzles found in Notion.');
        this.logSyncSuccess(logId, 0, 0, 0);
        return;
      }

      this.db.exec('BEGIN');
      this.db.prepare('DELETE FROM puzzles').run();

      const insertStmt = this.db.prepare(`
        INSERT INTO puzzles (
          id, name, timing, owner_id, locked_item_id, 
          reward_ids, puzzle_element_ids, story_reveals, narrative_threads
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const notionPuzzle of notionPuzzles) {
        try {
          const mappedPuzzle = await propertyMapper.mapPuzzleWithNames(notionPuzzle, notionService);
          if (mappedPuzzle && !mappedPuzzle.error) {
            const puzzleName = mappedPuzzle.puzzle || mappedPuzzle.name || `Untitled Puzzle (${notionPuzzle.id.substring(0, 8)})`;
            const ownerId = mappedPuzzle.owner && mappedPuzzle.owner.length > 0 ? mappedPuzzle.owner[0].id : null;
            const lockedItemId = mappedPuzzle.lockedItem && mappedPuzzle.lockedItem.length > 0 ? mappedPuzzle.lockedItem[0].id : null;
            const rewardIds = mappedPuzzle.rewards ? JSON.stringify(mappedPuzzle.rewards.map(r => r.id)) : '[]';
            const puzzleElementIds = mappedPuzzle.puzzleElements ? JSON.stringify(mappedPuzzle.puzzleElements.map(pe => pe.id)) : '[]';
            const narrativeThreads = mappedPuzzle.narrativeThreads ? JSON.stringify(mappedPuzzle.narrativeThreads) : '[]';

            insertStmt.run(
              mappedPuzzle.id, puzzleName, mappedPuzzle.timing || 'Unknown', ownerId,
              lockedItemId, rewardIds, puzzleElementIds,
              mappedPuzzle.storyReveals || '', narrativeThreads
            );
            stats.synced++;
          } else {
            stats.errors++;
            console.warn(`⚠️ Failed to map puzzle ${notionPuzzle.id}:`, mappedPuzzle?.error);
          }
        } catch (puzzleError) {
          stats.errors++;
          console.error(`❌ Error processing puzzle ${notionPuzzle.id}:`, puzzleError.message);
          console.error(`   Raw Notion data for failed puzzle:`, JSON.stringify(notionPuzzle.properties, null, 2));
        }
      }

      this.db.exec('COMMIT');
      console.log(`✅ Puzzles: ${stats.synced}/${stats.fetched} synced successfully.`);
      this.logSyncSuccess(logId, stats.fetched, stats.synced, stats.errors);

    } catch (error) {
      console.error('❌ Puzzle sync failed:', error);
      if (this.db.inTransaction) {
        this.db.exec('ROLLBACK');
      }
      this.logSyncFailure(logId, error, stats.fetched, stats.synced);
      throw error;
    }
  }

  /**
   * Sync timeline events from Notion to SQLite
   */
  async syncTimelineEvents() {
    this.initDB();
    const logId = this.logSyncStart('timeline_events');
    console.log('📅 Clearing and syncing timeline events...');
    let stats = { fetched: 0, synced: 0, errors: 0 };

    try {
      const notionEvents = await notionService.getTimelineEvents();
      stats.fetched = notionEvents.length;

      if (stats.fetched === 0) {
        console.log('⚠️ No timeline events found in Notion.');
        this.logSyncSuccess(logId, 0, 0, 0);
        return;
      }

      this.db.exec('BEGIN');
      this.db.prepare('DELETE FROM timeline_events').run();

      const insertStmt = this.db.prepare(`
        INSERT INTO timeline_events (id, description, date, character_ids, element_ids, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      for (const notionEvent of notionEvents) {
        try {
          const mappedEvent = await propertyMapper.mapTimelineEventWithNames(notionEvent, notionService);
          if (mappedEvent && !mappedEvent.error) {
            const characterIds = mappedEvent.charactersInvolved ? JSON.stringify(mappedEvent.charactersInvolved.map(c => c.id)) : '[]';
            const elementIds = mappedEvent.memoryEvidence ? JSON.stringify(mappedEvent.memoryEvidence.map(e => e.id)) : '[]';

            insertStmt.run(
              mappedEvent.id, mappedEvent.description || '', mappedEvent.date || '',
              characterIds, elementIds, mappedEvent.notes || ''
            );
            stats.synced++;
          } else {
            stats.errors++;
            console.warn(`⚠️ Failed to map timeline event ${notionEvent.id}:`, mappedEvent?.error);
          }
        } catch (eventError) {
          stats.errors++;
          console.error(`❌ Error processing timeline event ${notionEvent.id}:`, eventError.message);
        }
      }

      this.db.exec('COMMIT');
      console.log(`✅ Timeline Events: ${stats.synced}/${stats.fetched} synced successfully.`);
      this.logSyncSuccess(logId, stats.fetched, stats.synced, stats.errors);

    } catch (error) {
      console.error('❌ Timeline event sync failed:', error);
      if (this.db.inTransaction) {
        this.db.exec('ROLLBACK');
      }
      this.logSyncFailure(logId, error, stats.fetched, stats.synced);
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
   * Sync character relationships after all base tables are populated
   */
  async syncCharacterRelationships() {
    this.initDB();
    const logId = this.logSyncStart('character_relationships');
    console.log('🔗 Syncing character relationships...');
    let stats = { fetched: 0, synced: 0, errors: 0 };

    try {
      const notionCharacters = await notionService.getCharacters();
      stats.fetched = notionCharacters.length;

      this.db.exec('BEGIN');

      // Clear existing relationship tables
      this.db.prepare('DELETE FROM character_timeline_events').run();
      this.db.prepare('DELETE FROM character_owned_elements').run();
      this.db.prepare('DELETE FROM character_associated_elements').run();
      this.db.prepare('DELETE FROM character_puzzles').run();

      const insertEventRelStmt = this.db.prepare('INSERT OR IGNORE INTO character_timeline_events (character_id, timeline_event_id) VALUES (?, ?)');
      const insertOwnedElementStmt = this.db.prepare('INSERT OR IGNORE INTO character_owned_elements (character_id, element_id) VALUES (?, ?)');
      const insertAssocElementStmt = this.db.prepare('INSERT OR IGNORE INTO character_associated_elements (character_id, element_id) VALUES (?, ?)');
      const insertPuzzleRelStmt = this.db.prepare('INSERT OR IGNORE INTO character_puzzles (character_id, puzzle_id) VALUES (?, ?)');

      for (const notionChar of notionCharacters) {
        try {
          const mappedChar = await propertyMapper.mapCharacterWithNames(notionChar, notionService);
          if (mappedChar && !mappedChar.error) {
            const processRelations = (relations, stmt) => {
              if (relations && Array.isArray(relations)) {
                for (const rel of relations) {
                  stmt.run(mappedChar.id, rel.id || rel);
                  stats.synced++;
                }
              }
            };
            processRelations(mappedChar.events, insertEventRelStmt);
            processRelations(mappedChar.ownedElements, insertOwnedElementStmt);
            processRelations(mappedChar.associatedElements, insertAssocElementStmt);
            processRelations(mappedChar.puzzles, insertPuzzleRelStmt);
          } else {
            stats.errors++;
            console.warn(`⚠️ Could not map relationships for character ${notionChar.id}:`, mappedChar?.error);
          }
        } catch (error) {
          stats.errors++;
          console.error(`❌ Error syncing relationships for character ${notionChar.id}:`, error.message);
        }
      }

      this.db.exec('COMMIT');
      console.log(`✅ Synced ${stats.synced} character relationships.`);
      this.logSyncSuccess(logId, stats.fetched, stats.synced, stats.errors);
    } catch (error) {
      console.error('❌ Failed to sync character relationships:', error);
      if (this.db.inTransaction) {
        this.db.exec('ROLLBACK');
      }
      this.logSyncFailure(logId, error, stats.fetched, stats.synced);
      throw error;
    }
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