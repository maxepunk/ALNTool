/**
 * Parses various timing strings from Notion into a minute range.
 * @param {string | null | undefined} timing - The timing string (e.g., "Act 1", "15-30", "Minute 45").
 * @param {number} defaultDuration - The default duration for single-minute events.
 * @returns {{start: number, end: number} | null} - An object with start and end minutes, or null if unparsable.
 */
function parseTimingToMinutes(timing, defaultDuration = 5) {
  if (!timing || typeof timing !== 'string') {
    return null;
  }

  const normalized = timing.toLowerCase().trim();

  // Handle Acts
  if (normalized === 'act 1') return { start: 0, end: 60 };
  if (normalized === 'act 2') return { start: 60, end: 90 };

  // Handle Game Phases
  if (normalized === 'early game') return { start: 0, end: 30 };
  if (normalized === 'mid game') return { start: 30, end: 60 };
  if (normalized === 'late game') return { start: 60, end: 90 };

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
      // console.warn(`ISO Date parsing not yet implemented for timing: ${timing}`);
      return null;
  }

  // console.warn(`Unparsable timing string: "${timing}"`);
  return null;
}

module.exports = {
  parseTimingToMinutes,
}; 