const { Client } = require('@notionhq/client');
const NodeCache = require('node-cache');
const propertyMapper = require('../utils/propertyMapper'); // Added import

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
  // fetchPuzzleFlowDataStructure, // Commenting out as it uses different mappers
  // New functions for journey computation:
  getCharacterDetails,
  getAllCharacterOverviews,
};

// --- Start of new functions for journey computation ---

/**
 * Fetches full character details including related events, puzzles, and elements.
 * @param {string} characterId - The Notion page ID of the character.
 * @returns {Promise<Object|null>} Object with character, events, puzzles, elements, or null if not found.
 */
async function getCharacterDetails(characterId) {
  const characterPage = await getPage(characterId);
  if (!characterPage) {
    console.warn(`[NotionService] Character page not found for ID: ${characterId}`);
    return null;
  }

  const mappedCharacter = propertyMapper.mapCharacter(characterPage);
  if (!mappedCharacter) {
    console.warn(`[NotionService] Failed to map character page for ID: ${characterId}`);
    return null;
  }

  // Fetch and map related events
  const eventPages = mappedCharacter.event_ids ? await getPagesByIds(mappedCharacter.event_ids) : [];
  const mappedEvents = eventPages.map(propertyMapper.mapTimelineEvent).filter(Boolean);

  // Fetch and map related puzzles
  const puzzlePages = mappedCharacter.puzzle_ids ? await getPagesByIds(mappedCharacter.puzzle_ids) : [];
  const mappedPuzzles = puzzlePages.map(propertyMapper.mapPuzzle).filter(Boolean);

  // Fetch and map related elements (owned and associated)
  const elementIds = [
    ...(mappedCharacter.owned_element_ids || []),
    ...(mappedCharacter.associated_element_ids || []),
  ];
  const uniqueElementIds = [...new Set(elementIds)]; // Ensure unique IDs
  const elementPages = uniqueElementIds.length > 0 ? await getPagesByIds(uniqueElementIds) : [];
  const mappedElements = elementPages.map(propertyMapper.mapElement).filter(Boolean);

  return {
    character: mappedCharacter,
    events: mappedEvents,
    puzzles: mappedPuzzles,
    elements: mappedElements,
  };
}

/**
 * Fetches overview data (ID and name) for all characters.
 * @returns {Promise<Array<Object>>} Array of character overview objects.
 */
async function getAllCharacterOverviews() {
  // Assuming getCharacters() fetches all characters from the correct DB
  // The existing getCharacters() uses queryDatabase(DB_IDS.CHARACTERS)
  const characterPages = await getCharacters();
  return characterPages.map(propertyMapper.mapCharacterOverview).filter(Boolean);
}

// --- End of new functions for journey computation ---


// Commenting out fetchPuzzleFlowDataStructure as it seems to use a different set of mappers
// or is part of an incomplete feature not related to this subtask.
// If propertyMapper.js was intended to have map...WithNames, this would need reconciliation.
// For now, focusing on the journey-related mappers defined in this subtask.

// async function fetchPuzzleFlowDataStructure(puzzleId, notionServiceInstance = module.exports) {
//   const puzzlePage = await notionServiceInstance.getPage(puzzleId);
//   if (!puzzlePage) {
//     throw new Error('Puzzle not found');
//   }

//   const centralPuzzle = await propertyMapper.mapPuzzleWithNames(puzzlePage, notionServiceInstance);
//   if (centralPuzzle.error) {
//     throw new Error(`Failed to map central puzzle data: ${centralPuzzle.error}`);
//   }

//   const relatedEntityIds = new Set();
//   (centralPuzzle.puzzleElements || []).forEach(el => el.id && relatedEntityIds.add(el.id));
//   (centralPuzzle.rewards || []).forEach(el => el.id && relatedEntityIds.add(el.id));
//   (centralPuzzle.lockedItem || []).forEach(el => el.id && relatedEntityIds.add(el.id));
//   (centralPuzzle.parentItem || []).forEach(p => p.id && relatedEntityIds.add(p.id));
//   (centralPuzzle.subPuzzles || []).forEach(p => p.id && relatedEntityIds.add(p.id));
//   (centralPuzzle.owner || []).forEach(o => o.id && relatedEntityIds.add(o.id));

//   const relatedPages = await notionServiceInstance.getPagesByIds(Array.from(relatedEntityIds));
//   const mappedRelatedEntities = new Map();

//   for (const page of relatedPages) {
//     if (!page || !page.id) continue;

//     let mappedEntity;
//     if ((centralPuzzle.puzzleElements || []).find(s => s.id === page.id) ||
//         (centralPuzzle.rewards || []).find(s => s.id === page.id) ||
//         (centralPuzzle.lockedItem || []).find(s => s.id === page.id)) {
//       mappedEntity = await propertyMapper.mapElementWithNames(page, notionServiceInstance);
//     } else if ((centralPuzzle.parentItem || []).find(s => s.id === page.id) ||
//                (centralPuzzle.subPuzzles || []).find(s => s.id === page.id)) {
//       mappedEntity = await propertyMapper.mapPuzzleWithNames(page, notionServiceInstance);
//     } else if ((centralPuzzle.owner || []).find(s => s.id === page.id)) {
//       mappedEntity = await propertyMapper.mapCharacterWithNames(page, notionServiceInstance);
//     } else {
//       if (page.properties.Puzzle) {
//           mappedEntity = await propertyMapper.mapPuzzleWithNames(page, notionServiceInstance);
//       } else if (page.properties.Name && page.properties['Basic Type']) {
//           mappedEntity = await propertyMapper.mapElementWithNames(page, notionServiceInstance);
//       } else if (page.properties.Name && page.properties.Tier) {
//           mappedEntity = await propertyMapper.mapCharacterWithNames(page, notionServiceInstance);
//       } else {
//           console.warn(`[fetchPuzzleFlowDataStructure] Could not determine type for related page ${page.id}`);
//           continue;
//       }
//     }

//     if (mappedEntity && !mappedEntity.error) {
//       mappedRelatedEntities.set(page.id, mappedEntity);
//     } else if (mappedEntity && mappedEntity.error) {
//       console.warn(`[fetchPuzzleFlowDataStructure] Error mapping entity ${page.id}: ${mappedEntity.error}`);
//     }
//   }
//   return { centralPuzzle, mappedRelatedEntities };
// }