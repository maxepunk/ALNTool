const { getDB, initializeDatabase, closeDB } = require('../../src/db/database');
const { runMigrations } = require('../../src/db/migrations');
const Database = require('better-sqlite3');

/**
 * Utility for setting up and managing test databases
 */
class TestDbSetup {
  constructor() {
    this.db = null;
    this.requiredTables = [
      'characters',
      'elements',
      'puzzles',
      'timeline_events',
      'character_links',
      'character_timeline_events',
      'character_owned_elements',
      'character_associated_elements',
      'puzzle_elements',
      'character_puzzles',
      'cached_gaps',
      'schema_migrations',
      'sync_log'
    ];
  }

  /**
   * Run migrations on the test database
   */
  async runMigrations() {
    if (!this.db) throw new Error('Database not initialized');
    
    try {
      // Run migrations with transaction support
      const result = runMigrations(this.db, { useTransaction: true });
      return result;
    } catch (error) {
      console.error('Error running migrations in test:', error);
      throw error;
    }
  }

  /**
   * Initialize a fresh test database with all migrations
   * @returns {Promise<object>} The database instance
   */
  async initialize() {
    // Create fresh in-memory database
    this.db = new Database(':memory:');
    
    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');
    
    // Run migrations
    await this.runMigrations();
    
    // Create any missing tables
    const tables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    const missingTables = this.requiredTables.filter(table => !tables.includes(table));

    if (missingTables.length > 0) {
      // Create missing tables
      for (const table of missingTables) {
        switch (table) {
          case 'puzzle_elements':
            this.db.exec(`
              CREATE TABLE puzzle_elements (
                puzzle_id TEXT NOT NULL,
                element_id TEXT NOT NULL,
                PRIMARY KEY (puzzle_id, element_id),
                FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE,
                FOREIGN KEY (element_id) REFERENCES elements(id) ON DELETE CASCADE
              )
            `);
            break;
          case 'character_puzzles':
            this.db.exec(`
              CREATE TABLE character_puzzles (
                character_id TEXT NOT NULL,
                puzzle_id TEXT NOT NULL,
                PRIMARY KEY (character_id, puzzle_id),
                FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
                FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
              )
            `);
            break;
          case 'cached_gaps':
            this.db.exec(`
              CREATE TABLE cached_gaps (
                id TEXT PRIMARY KEY,
                character_id TEXT NOT NULL,
                gap_type TEXT NOT NULL,
                status TEXT,
                resolution_comment TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
              )
            `);
            break;
          case 'character_links':
            // Drop and recreate with correct column names
            this.db.exec('DROP TABLE IF EXISTS character_links');
            this.db.exec(`
              CREATE TABLE character_links (
                character_a_id TEXT NOT NULL,
                character_b_id TEXT NOT NULL,
                link_type TEXT NOT NULL,
                strength INTEGER DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (character_a_id, character_b_id),
                FOREIGN KEY (character_a_id) REFERENCES characters(id) ON DELETE CASCADE,
                FOREIGN KEY (character_b_id) REFERENCES characters(id) ON DELETE CASCADE
              )
            `);
            break;
        }
      }
    }

    // Verify all tables exist
    const finalTables = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(t => t.name);
    const stillMissing = this.requiredTables.filter(table => !finalTables.includes(table));
    if (stillMissing.length > 0) {
      throw new Error(`Missing required tables: ${stillMissing.join(', ')}`);
    }
  }

  /**
   * Clear all data from the database while preserving schema
   */
  async clearData() {
    if (!this.db) throw new Error('Database not initialized');
    
    // Clear in correct order to respect foreign key constraints
    const clearOrder = [
      'cached_journey_graphs',
      'character_links',
      'character_puzzles',
      'character_timeline_events',
      'character_owned_elements',
      'character_associated_elements',
      'timeline_events',
      'elements',
      'puzzles',
      'characters'
    ];
    
    // Use a transaction for atomicity
    this.db.prepare('BEGIN').run();
    try {
      for (const table of clearOrder) {
        // Check if table exists before trying to delete
        const tableExists = this.db.prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?"
        ).get(table);
        
        if (tableExists) {
          try {
            this.db.prepare(`DELETE FROM ${table}`).run();
          } catch (tableError) {
            console.error(`Failed to clear table ${table}:`, tableError.message);
            throw tableError;
          }
        }
      }
      this.db.prepare('COMMIT').run();
    } catch (error) {
      this.db.prepare('ROLLBACK').run();
      throw error;
    }
  }

  /**
   * Insert test character data
   * @param {object} data Character data
   * @returns {string} The inserted character ID
   */
  insertTestCharacter({ id, name = 'Test Character', type = 'Protagonist', tier = 'Main', logline = 'A test character.' }) {
    const stmt = this.db.prepare(`
      INSERT INTO characters (id, name, type, tier, logline)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET 
        name = excluded.name,
        type = excluded.type,
        tier = excluded.tier,
        logline = excluded.logline
    `);
    stmt.run(id, name, type, tier, logline);
    return id;
  }

  /**
   * Insert test element data
   * @param {object} data Element data
   * @returns {string} The inserted element ID
   */
  async insertTestElement(element) {
    const { id, name, type, description, status, container_id, owner_id, timeline_event_id } = element;
    
    // Note: act_focus is a computed field, not stored in database
    this.db.prepare(`
      INSERT OR REPLACE INTO elements (
        id, name, type, description, status, 
        container_id, owner_id, timeline_event_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, type, description, status, container_id, owner_id, timeline_event_id);
  }

  /**
   * Insert test puzzle data
   * @param {object} data Puzzle data
   * @returns {string} The inserted puzzle ID
   */
  insertTestPuzzle({ id, name = 'Test Puzzle', timing = 'Act 1', owner_id = null, locked_item_id = null, reward_ids = '[]', puzzle_element_ids = '[]' }) {
    const stmt = this.db.prepare(`
      INSERT INTO puzzles (id, name, timing, owner_id, locked_item_id, reward_ids, puzzle_element_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name = excluded.name,
        timing = excluded.timing,
        owner_id = excluded.owner_id,
        locked_item_id = excluded.locked_item_id,
        reward_ids = excluded.reward_ids,
        puzzle_element_ids = excluded.puzzle_element_ids
    `);
    stmt.run(id, name, timing, owner_id, locked_item_id, reward_ids, puzzle_element_ids);
    return id;
  }

  /**
   * Insert test timeline event data
   * @param {object} data Timeline event data
   * @returns {string} The inserted event ID
   */
  insertTestTimelineEvent({ id, description = 'Test Event', date = '2023-01-01' }) {
    const stmt = this.db.prepare(`
      INSERT INTO timeline_events (id, description, date)
      VALUES (?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        description = excluded.description,
        date = excluded.date
    `);
    stmt.run(id, description, date);
    return id;
  }

  /**
   * Create a character-element relationship
   * @param {string} characterId Character ID
   * @param {string} elementId Element ID
   * @param {boolean} isOwner Whether the character owns the element
   */
  createCharacterElementLink(characterId, elementId, isOwner = false) {
    const table = isOwner ? 'character_owned_elements' : 'character_associated_elements';
    const stmt = this.db.prepare(`
      INSERT INTO ${table} (character_id, element_id)
      VALUES (?, ?)
      ON CONFLICT(character_id, element_id) DO NOTHING
    `);
    stmt.run(characterId, elementId);
  }

  /**
   * Create a character-timeline event relationship
   * @param {string} characterId Character ID
   * @param {string} eventId Timeline event ID
   */
  createCharacterTimelineLink(characterId, timelineEventId) {
    const stmt = this.db.prepare(`
      INSERT INTO character_timeline_events (character_id, timeline_event_id)
      VALUES (?, ?)
      ON CONFLICT(character_id, timeline_event_id) DO NOTHING
    `);
    stmt.run(characterId, timelineEventId);
  }

  /**
   * Create a character-character link
   * @param {string} characterAId First character ID
   * @param {string} characterBId Second character ID
   * @param {string} linkType Type of link (timeline_event, puzzle, element)
   * @param {string} sourceId ID of the source entity creating the link
   */
  async createCharacterLink(characterAId, characterBId, linkType, linkSourceId) {
    // Use the correct column names from the schema
    this.db.prepare(`
      INSERT OR REPLACE INTO character_links (
        character_a_id, character_b_id, link_type, link_source_id
      ) VALUES (?, ?, ?, ?)
    `).run(characterAId, characterBId, linkType, linkSourceId);
  }

  /**
   * Create a character-puzzle relationship
   * @param {string} characterId Character ID
   * @param {string} puzzleId Puzzle ID
   */
  createCharacterPuzzleLink(characterId, puzzleId) {
    const stmt = this.db.prepare(`
      INSERT INTO character_puzzles (character_id, puzzle_id)
      VALUES (?, ?)
      ON CONFLICT(character_id, puzzle_id) DO NOTHING
    `);
    stmt.run(characterId, puzzleId);
  }

  /**
   * Close the database connection
   */
  async close() {
    if (this.db) {
      await closeDB();
      this.db = null;
    }
  }

  getDb() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }
}

module.exports = TestDbSetup; 