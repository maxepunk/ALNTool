const DerivedFieldComputer = require('./DerivedFieldComputer');
const GameConstants = require('../../config/GameConstants');
const ValidationUtils = require('../../utils/ValidationUtils');

const logger = require('../../utils/logger');
/**
 * Computes Narrative Threads for puzzles based on their rewards and story reveals
 * Narrative threads are story themes that connect puzzles together
 * They are computed by analyzing:
 * 1. The puzzle's story reveals
 * 2. The narrative themes of reward elements
 * 3. The puzzle's name and description
 */
class NarrativeThreadComputer extends DerivedFieldComputer {
  constructor(db) {
    super(db, 'puzzles', 'computed_narrative_threads');
    this.requiredFields = ['id'];
  }

  /**
   * Compute narrative threads for a puzzle
   * @param {Object} puzzle - The puzzle to compute threads for
   * @returns {Promise<Object>} Object containing computed_narrative_threads
   * @throws {Error} If computation fails
   */
  async compute(puzzle) {
    // Validate required fields
    if (!this.requiredFields.every(field => puzzle[field])) {
      throw new Error('Missing required fields');
    }
    try {
      const threads = new Set();

      // Extract threads from story reveals
      if (puzzle.story_reveals) {
        this._extractThreadsFromText(puzzle.story_reveals, threads);
      }

      // Extract threads from reward elements
      if (puzzle.reward_ids) {
        try {
          const rewardIds = JSON.parse(puzzle.reward_ids);
          if (Array.isArray(rewardIds)) {
            for (const elementId of rewardIds) {
              const element = this.db.prepare('SELECT * FROM elements WHERE id = ?').get(elementId);
              if (element) {
                if (element.name) {
                  this._extractThreadsFromText(element.name, threads);
                }
                if (element.description) {
                  this._extractThreadsFromText(element.description, threads);
                }
              }
            }
          }
        } catch (e) {
          // If JSON parsing fails, just skip reward elements
          logger.warn(`Failed to parse reward_ids for puzzle ${puzzle.id}: ${e.message}`);
        }
      }

      // Extract threads from puzzle name
      if (puzzle.name) {
        this._extractThreadsFromText(puzzle.name, threads);
      }

      // If no threads found, mark as unassigned
      if (threads.size === 0) {
        threads.add(GameConstants.NARRATIVE_THREADS.DEFAULT_CATEGORY);
      }

      return {
        ...puzzle,
        computed_narrative_threads: JSON.stringify(Array.from(threads))
      };
    } catch (error) {
      logger.error(`Failed to compute narrative threads for puzzle ${puzzle.id}: ${error.message}`);
      return {
        ...puzzle,
        computed_narrative_threads: JSON.stringify([GameConstants.NARRATIVE_THREADS.DEFAULT_CATEGORY])
      };
    }
  }

  /**
   * Extract narrative threads from text using keyword matching
   * @private
   */
  _extractThreadsFromText(text, threads) {
    // Map keywords to narrative thread categories from GameConstants
    const keywordMap = {
      // Corporate Espionage keywords
      'corporate': GameConstants.NARRATIVE_THREADS.CATEGORIES[0], // 'Corporate Espionage'
      'espionage': GameConstants.NARRATIVE_THREADS.CATEGORIES[0],
      'business': GameConstants.NARRATIVE_THREADS.CATEGORIES[0],
      'company': GameConstants.NARRATIVE_THREADS.CATEGORIES[0],

      // Memory Technology keywords
      'memory': GameConstants.NARRATIVE_THREADS.CATEGORIES[1], // 'Memory Technology'
      'rfid': GameConstants.NARRATIVE_THREADS.CATEGORIES[1],
      'token': GameConstants.NARRATIVE_THREADS.CATEGORIES[1],
      'technology': GameConstants.NARRATIVE_THREADS.CATEGORIES[1],

      // Personal Relationships keywords
      'relationship': GameConstants.NARRATIVE_THREADS.CATEGORIES[2], // 'Personal Relationships'
      'marriage': GameConstants.NARRATIVE_THREADS.CATEGORIES[2],
      'affair': GameConstants.NARRATIVE_THREADS.CATEGORIES[2],
      'personal': GameConstants.NARRATIVE_THREADS.CATEGORIES[2],

      // Environmental Crimes keywords
      'environmental': GameConstants.NARRATIVE_THREADS.CATEGORIES[3], // 'Environmental Crimes'
      'pollution': GameConstants.NARRATIVE_THREADS.CATEGORIES[3],
      'crime': GameConstants.NARRATIVE_THREADS.CATEGORIES[3],

      // AI Consciousness keywords
      'ai': GameConstants.NARRATIVE_THREADS.CATEGORIES[4], // 'AI Consciousness'
      'consciousness': GameConstants.NARRATIVE_THREADS.CATEGORIES[4],
      'artificial': GameConstants.NARRATIVE_THREADS.CATEGORIES[4],
      'intelligence': GameConstants.NARRATIVE_THREADS.CATEGORIES[4]
    };

    const lowerText = text.toLowerCase();
    for (const [keyword, category] of Object.entries(keywordMap)) {
      if (lowerText.includes(keyword)) {
        threads.add(category);
      }
    }

    // Also check for exact category names in the text
    GameConstants.NARRATIVE_THREADS.CATEGORIES.forEach(category => {
      if (lowerText.includes(category.toLowerCase())) {
        threads.add(category);
      }
    });
  }

  /**
   * Compute and update narrative threads for all puzzles
   * @returns {Promise<{processed: number, errors: number}>} Stats about the computation
   */
  async computeAll() {
    try {
      const puzzles = this.db.prepare('SELECT * FROM puzzles').all();
      let processed = 0;
      let errors = 0;

      for (const puzzle of puzzles) {
        try {
          const result = await this.compute(puzzle);
          this.db.prepare(`
            UPDATE puzzles 
            SET computed_narrative_threads = ? 
            WHERE id = ?
          `).run(result.computed_narrative_threads, puzzle.id);
          processed++;
        } catch (error) {
          logger.error(`Error processing puzzle ${puzzle.id}: ${error.message}`);
          errors++;
        }
      }

      return { processed, errors };
    } catch (error) {
      logger.error(`Failed to compute all narrative threads: ${error.message}`);
      throw new Error(`Failed to compute all narrative threads: ${error.message}`);
    }
  }
}

module.exports = NarrativeThreadComputer;