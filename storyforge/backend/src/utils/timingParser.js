const GameConstants = require('../config/GameConstants');

const logger = require('./logger');
/**
 * Parses various timing strings from Notion into a minute range.
 * @param {string | null | undefined} timing - The timing string (e.g., "Act 1", "15-30", "Minute 45").
 * @param {number} defaultDuration - The default duration for single-minute events.
 * @returns {{start: number, end: number} | null} - An object with start and end minutes, or null if unparsable.
 */
function parseTimingToMinutes(timing, defaultDuration = GameConstants.ACTS.DEFAULT_EVENT_DURATION) {
  if (!timing || typeof timing !== 'string') {
    return null;
  }

  const normalized = timing.toLowerCase().trim();

  // Handle Acts
  if (normalized === 'act 1') {
    return { 
      start: GameConstants.ACTS.ACT_1.START, 
      end: GameConstants.ACTS.ACT_1.END 
    };
  }
  if (normalized === 'act 2') {
    return { 
      start: GameConstants.ACTS.ACT_2.START, 
      end: GameConstants.ACTS.ACT_2.END 
    };
  }

  // Handle Game Phases
  if (normalized === 'early game') {
    return { 
      start: GameConstants.ACTS.PHASES.EARLY_GAME.START, 
      end: GameConstants.ACTS.PHASES.EARLY_GAME.END 
    };
  }
  if (normalized === 'mid game') {
    return { 
      start: GameConstants.ACTS.PHASES.MID_GAME.START, 
      end: GameConstants.ACTS.PHASES.MID_GAME.END 
    };
  }
  if (normalized === 'late game') {
    return { 
      start: GameConstants.ACTS.PHASES.LATE_GAME.START, 
      end: GameConstants.ACTS.PHASES.LATE_GAME.END 
    };
  }

  // Handle minute ranges like "15-30" or "15 - 30"
  const rangeMatch = normalized.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    return { start: parseInt(rangeMatch[1], 10), end: parseInt(rangeMatch[2], 10) };
  }

  // Handle single minutes like "Minute 45" or "45 minutes"
  const minuteMatch = normalized.match(/^(?:minute\s+)?(\d+)(?:\s*minutes)?$/);
  if (minuteMatch) {
    const start = parseInt(minuteMatch[1], 10);
    return { start, end: start + defaultDuration };
  }

  // Handle date-based minutes like "YYYY-MM-DDTHH:MM:SS..." (placeholder)
  // This would require a more complex implementation with a reference start date for the game.
  // For now, we return null for these complex cases.
  if (timing.includes('T')) {
    // logger.warn(`ISO Date parsing not yet implemented for timing: ${timing}`);
    return null;
  }

  // logger.warn(`Unparsable timing string: "${timing}"`);
  return null;
}

module.exports = {
  parseTimingToMinutes
};