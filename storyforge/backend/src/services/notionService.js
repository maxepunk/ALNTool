const { Client } = require('@notionhq/client');
const NodeCache = require('node-cache');

// Initialize Notion client
const notion = new Client({
  auth: process.env.NOTION_API_KEY,
});

// Database IDs
const DB_IDS = {
  CHARACTERS: process.env.NOTION_CHARACTERS_DB || '18c2f33d583f8060a6abde32ff06bca2',
  TIMELINE: process.env.NOTION_TIMELINE_DB || '1b52f33d583f80deae5ad20020c120dd',
  PUZZLES: process.env.NOTION_PUZZLES_DB || '1b62f33d583f80cc87cfd7d6c4b0b265',
  ELEMENTS: process.env.NOTION_ELEMENTS_DB || '18c2f33d583f802091bcd84c7dd94306',
};

const notionCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

function makeCacheKey(prefix, params) {
  return prefix + ':' + JSON.stringify(params);
}

/**
 * Function to query a Notion database with optional filters
 * @param {string} databaseId - The Notion database ID
 * @param {Object} filter - Optional Notion filter
 * @returns {Promise<Array>} Array of database items
 */
async function queryDatabase(databaseId, filter = {}) {
  const cacheKey = makeCacheKey('queryDatabase', { databaseId, filter });
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  try {
    // Initialize parameters for the query
    const params = {
      database_id: databaseId,
    };

    // Add filter if provided
    if (Object.keys(filter).length > 0) {
      params.filter = filter;
    }

    // Query the database
    const response = await notion.databases.query(params);
    
    notionCache.set(cacheKey, response.results);
    console.log(`[CACHE MISS] ${cacheKey}`);
    // Return the results
    return response.results;
  } catch (error) {
    console.error(`Error querying Notion database ${databaseId}:`, error);
    throw error;
  }
}

/**
 * Get a specific page from Notion
 * @param {string} pageId - The Notion page ID
 * @returns {Promise<Object>} Page object
 */
async function getPage(pageId) {
  const cacheKey = makeCacheKey('getPage', { pageId });
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return cached;
  }
  try {
    const page = await notion.pages.retrieve({ page_id: pageId });
    notionCache.set(cacheKey, page);
    console.log(`[CACHE MISS] ${cacheKey}`);
    return page;
  } catch (error) {
    console.error(`Error retrieving Notion page ${pageId}:`, error);
    throw error;
  }
}

/**
 * Get all characters from the Characters database
 * @param {Object} filter - Optional filter
 * @returns {Promise<Array>} Array of character objects
 */
async function getCharacters(filter = {}) {
  return queryDatabase(DB_IDS.CHARACTERS, filter);
}

/**
 * Get all timeline events from the Timeline database
 * @param {Object} filter - Optional filter
 * @returns {Promise<Array>} Array of timeline event objects
 */
async function getTimelineEvents(filter = {}) {
  return queryDatabase(DB_IDS.TIMELINE, filter);
}

/**
 * Get all puzzles from the Puzzles database
 * @param {Object} filter - Optional filter
 * @returns {Promise<Array>} Array of puzzle objects
 */
async function getPuzzles(filter = {}) {
  return queryDatabase(DB_IDS.PUZZLES, filter);
}

/**
 * Get all elements from the Elements database
 * @param {Object} filter - Optional filter
 * @returns {Promise<Array>} Array of element objects
 */
async function getElements(filter = {}) {
  return queryDatabase(DB_IDS.ELEMENTS, filter);
}

/**
 * Get elements of a specific type (e.g., "Memory Token Video", "Prop")
 * @param {string} type - The basic type to filter by
 * @returns {Promise<Array>} Array of filtered element objects
 */
async function getElementsByType(type) {
  const filter = {
    property: 'Basic Type',
    select: {
      equals: type,
    },
  };
  
  return queryDatabase(DB_IDS.ELEMENTS, filter);
}

/**
 * Fetch multiple Notion pages by their IDs
 * @param {string[]} ids - Array of Notion page IDs
 * @returns {Promise<Object[]>} Array of page objects
 */
async function getPagesByIds(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return [];
  // Notion API does not support batch fetch, so fetch sequentially or in parallel
  const results = await Promise.all(
    ids.map(id => getPage(id).catch(() => null))
  );
  // Filter out any failed fetches (null)
  return results.filter(Boolean);
}

function clearCache() {
  notionCache.flushAll();
  console.log('[CACHE CLEARED]');
}

module.exports = {
  getCharacters,
  getTimelineEvents,
  getPuzzles,
  getElements,
  getElementsByType,
  getPage,
  queryDatabase,
  DB_IDS,
  getPagesByIds,
  clearCache,
  notionCache,
  makeCacheKey,
}; 