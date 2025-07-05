const DerivedFieldComputer = require('./DerivedFieldComputer');
const GameConstants = require('../../config/GameConstants');
const ValidationUtils = require('../../utils/ValidationUtils');

const logger = require('../../utils/logger');
/**
 * Computes Act Focus for timeline events based on related elements
 * Act Focus is determined by the most common act from related elements
 */
class ActFocusComputer extends DerivedFieldComputer {
  constructor(db) {
    super(db);
    this.requiredFields = ['id', 'element_ids'];
  }

  /**
   * Compute act focus for a timeline event
   * @param {Object} event - Timeline event with element_ids
   * @returns {Promise<Object>} Object containing act_focus
   * @throws {Error} If computation fails
   */
  async compute(event) {
    try {
      this.validateRequiredFields(event, this.requiredFields);

      // Handle malformed JSON gracefully
      let elementIds;
      try {
        elementIds = JSON.parse(event.element_ids || '[]');
      } catch (parseError) {
        return { act_focus: null };
      }

      if (elementIds.length === 0) {
        return { act_focus: null };
      }

      // Get elements and count acts
      const placeholders = elementIds.map(() => '?').join(',');
      const elements = this.db.prepare(
        `SELECT first_available FROM elements WHERE id IN (${placeholders})`
      ).all(...elementIds);

      // Count occurrences of each act
      const actCounts = {};
      elements.forEach(el => {
        if (el.first_available) {
          actCounts[el.first_available] = (actCounts[el.first_available] || 0) + 1;
        }
      });

      // Return most common act, with act sequence ordering as tiebreaker
      const sortedActs = Object.entries(actCounts)
        .sort(([actA, countA], [actB, countB]) => {
          if (countB !== countA) {
            return countB - countA;
          } // Primary: sort by count desc
          // Secondary: sort by act sequence from GameConstants
          const seqA = GameConstants.ACTS.SEQUENCE[actA] || 999;
          const seqB = GameConstants.ACTS.SEQUENCE[actB] || 999;
          return seqA - seqB;
        });
      const actFocus = sortedActs[0]?.[0] || null;

      // Validate the computed act
      if (actFocus && !ValidationUtils.isValidAct(actFocus)) {
        logger.warn(`Invalid act computed: ${actFocus}, returning null`);
        return { act_focus: null };
      }

      return { act_focus: actFocus };
    } catch (error) {
      throw new Error(`Failed to compute act focus for event ${event?.id || 'unknown'}: ${error.message}`);
    }
  }

  /**
   * Compute and update act focus for all timeline events
   * @returns {Promise<{processed: number, errors: number}>} Stats about the computation
   */
  async computeAll() {
    const stats = { processed: 0, errors: 0 };

    try {
      const events = this.db.prepare('SELECT * FROM timeline_events').all();

      for (const event of events) {
        try {
          const { act_focus } = await this.compute(event);
          await this.updateDatabase('timeline_events', 'id', event, { act_focus });
          stats.processed++;
        } catch (error) {
          logger.error(`Error processing event ${event.id}:`, error);
          stats.errors++;
        }
      }

      return stats;
    } catch (error) {
      throw new Error(`Failed to compute all act focus values: ${error.message}`);
    }
  }
}

module.exports = ActFocusComputer;