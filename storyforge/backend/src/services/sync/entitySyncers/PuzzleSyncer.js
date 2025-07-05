const BaseSyncer = require('./BaseSyncer');

const logger = require('../../../utils/logger');
/**
 * Syncer for Puzzle entities.
 * Handles fetching from Notion, mapping, and inserting puzzle data.
 *
 * Puzzles have relationships with:
 * - Characters (owner)
 * - Elements (locked item, rewards, puzzle elements)
 *
 * @extends BaseSyncer
 */
class PuzzleSyncer extends BaseSyncer {
  /**
   * @param {Object} dependencies - Required dependencies
   * @param {Object} dependencies.notionService - Service for fetching from Notion
   * @param {Object} dependencies.propertyMapper - Service for mapping Notion properties
   * @param {Object} dependencies.logger - SyncLogger instance
   */
  constructor(dependencies) {
    super({ ...dependencies, entityType: 'puzzles' });
  }

  /**
   * Fetch puzzles from Notion
   * @returns {Promise<Array>} Array of Notion puzzle objects
   */
  async fetchFromNotion() {
    return await this.notionService.getPuzzles();
  }

  /**
   * Clear existing puzzle data and related tables
   * @returns {Promise<void>}
   */
  async clearExistingData() {
    // Clear tables that have foreign key to puzzles, in correct order
    this.db.prepare('DELETE FROM character_puzzles').run();

    // Finally, clear the puzzles table
    this.db.prepare('DELETE FROM puzzles').run();
  }

  /**
   * Map Notion puzzle data to database format
   * @param {Object} notionPuzzle - Raw Notion puzzle object
   * @returns {Promise<Object>} Mapped puzzle data
   */
  async mapData(notionPuzzle) {
    try {
      const startTime = Date.now();
      const puzzleName = notionPuzzle?.properties?.Puzzle ?
        this.propertyMapper.extractTitle(notionPuzzle.properties.Puzzle) : 'Unknown';

      logger.debug(`[PUZZLE SYNC] Mapping puzzle: "${puzzleName}"`);

      const mapped = await this.propertyMapper.mapPuzzleWithNames(
        notionPuzzle,
        this.notionService
      );

      const duration = Date.now() - startTime;
      logger.debug(`[PUZZLE SYNC] ✅ Mapped "${puzzleName}" in ${duration}ms`);

      if (mapped.error) {
        return { error: mapped.error };
      }

      // Handle puzzle name - puzzles can have either 'puzzle' or 'name' property
      const finalPuzzleName = mapped.puzzle || mapped.name ||
        `Untitled Puzzle (${notionPuzzle.id.substring(0, 8)})`;

      // Extract single IDs from relation arrays with foreign key validation
      let ownerId = mapped.owner && mapped.owner.length > 0
        ? mapped.owner[0].id
        : null;

      let lockedItemId = mapped.lockedItem && mapped.lockedItem.length > 0
        ? mapped.lockedItem[0].id
        : null;

      // Validate foreign key references to prevent constraint violations
      if (ownerId) {
        const ownerExists = this.db.prepare('SELECT 1 FROM characters WHERE id = ?').get(ownerId);
        if (!ownerExists) {
          logger.warn(`[PUZZLE SYNC] Warning: Owner ID ${ownerId} not found in characters table for puzzle "${finalPuzzleName}", setting to NULL`);
          ownerId = null;
        }
      }

      if (lockedItemId) {
        const elementExists = this.db.prepare('SELECT 1 FROM elements WHERE id = ?').get(lockedItemId);
        if (!elementExists) {
          logger.warn(`[PUZZLE SYNC] Warning: Locked item ID ${lockedItemId} not found in elements table for puzzle "${finalPuzzleName}", setting to NULL`);
          lockedItemId = null;
        }
      }

      // Convert arrays to JSON strings
      const rewardIds = mapped.rewards
        ? JSON.stringify(mapped.rewards.map(r => r.id))
        : '[]';

      const puzzleElementIds = mapped.puzzleElements
        ? JSON.stringify(mapped.puzzleElements.map(pe => pe.id))
        : '[]';

      const narrativeThreads = mapped.narrativeThreads
        ? JSON.stringify(mapped.narrativeThreads)
        : '[]';

      return {
        id: mapped.id,
        name: finalPuzzleName,
        timing: mapped.timing || 'Unknown',
        owner_id: ownerId,
        locked_item_id: lockedItemId,
        reward_ids: rewardIds,
        puzzle_element_ids: puzzleElementIds,
        story_reveals: mapped.storyReveals || '',
        narrative_threads: narrativeThreads
      };
    } catch (error) {
      const puzzleName = notionPuzzle?.properties?.Puzzle ?
        this.propertyMapper.extractTitle(notionPuzzle.properties.Puzzle) : 'Unknown';
      logger.error(`[PUZZLE SYNC] ❌ Failed to map "${puzzleName}": ${error.message}`);
      return { error: error.message };
    }
  }

  /**
   * Insert puzzle data into database
   * @param {Object} mappedData - Mapped puzzle data
   * @returns {Promise<void>}
   */
  async insertData(mappedData) {
    const stmt = this.db.prepare(`
      INSERT INTO puzzles (
        id, name, timing, owner_id, locked_item_id, 
        reward_ids, puzzle_element_ids, story_reveals, narrative_threads
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      mappedData.id,
      mappedData.name,
      mappedData.timing,
      mappedData.owner_id,
      mappedData.locked_item_id,
      mappedData.reward_ids,
      mappedData.puzzle_element_ids,
      mappedData.story_reveals,
      mappedData.narrative_threads
    );
  }

  /**
   * Handle individual puzzle sync errors with additional context
   * @protected
   * @param {Object} puzzle - The puzzle that failed
   * @param {Error|string} error - The error that occurred
   */
  handleItemError(puzzle, error) {
    super.handleItemError(puzzle, error);

    // Log raw Notion data for debugging puzzle sync issues
    if (puzzle.properties) {
      this.logger.error(
        `Raw Notion data for failed puzzle ${puzzle.id}:`,
        JSON.stringify(puzzle.properties, null, 2)
      );
    }
  }

  /**
   * Get current puzzle count for dry run
   * @returns {Promise<number>} Current puzzle count
   */
  async getCurrentRecordCount() {
    const result = this.db.prepare('SELECT COUNT(*) as count FROM puzzles').get();
    return result.count;
  }
}

module.exports = PuzzleSyncer;
