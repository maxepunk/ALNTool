const GameConstants = require('../config/GameConstants');

/**
 * Higher-order function to wrap async route handlers
 * @param {Function} fn The async function to wrap
 * @returns {Function} The wrapped function with error handling
 */
const catchAsync = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Sets cache headers for API responses
 * @param {Object} res Express response object
 */
function setCacheHeaders(res) {
  res.set('Cache-Control', 'public, max-age=300'); // Cache for 5 minutes
}

/**
 * Creates a short snippet from text.
 * @param {string} text The text to snippet.
 * @param {number} maxLength The maximum length of the snippet.
 * @returns {string} The generated snippet.
 */
function createSnippet(text, maxLength = GameConstants.SYSTEM.UI.DEFAULT_SNIPPET_LENGTH) {
  if (!text) {
    return '';
  }
  text = String(text);
  if (text.length <= maxLength) {
    return text;
  }
  const cutPos = text.lastIndexOf(' ', maxLength - 3);
  if (cutPos > maxLength / 2 && cutPos < text.length -1) {
    return text.substring(0, cutPos) + '...';
  }
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Builds a Notion filter from query parameters and property mapping
 * @param {Object} query Query parameters
 * @param {Object} propertyMap Mapping of query keys to Notion properties
 * @returns {Object|undefined} Notion filter object or undefined
 */
function buildNotionFilter(query, propertyMap) {
  const filterConditions = [];
  for (const [key, value] of Object.entries(query)) {
    if (propertyMap[key] && value) {
      if (key === 'narrativeThreadContains') { // Special handling for multi-select contains
        filterConditions.push({
          property: propertyMap[key],
          multi_select: { contains: value }
        });
      } else { // Default to select equals
        filterConditions.push({
          property: propertyMap[key],
          select: { equals: value }
        });
      }
    }
  }
  if (filterConditions.length === 0) {
    return undefined;
  }
  return filterConditions.length === 1 ? filterConditions[0] : { and: filterConditions };
}

module.exports = {
  catchAsync,
  setCacheHeaders,
  createSnippet,
  buildNotionFilter
};