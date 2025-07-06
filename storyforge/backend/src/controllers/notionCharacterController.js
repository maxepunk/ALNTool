const notionService = require('../services/notionService');
const logger = require('../utils/logger');
const warningService = require('../services/warningService');
const { notionCache, makeCacheKey } = require('../services/notionService');
const { getDB } = require('../db/database');
const { catchAsync, setCacheHeaders } = require('../utils/controllerUtils');
const dbQueries = require('../db/queries');

const getCharacters = catchAsync(async (req, res) => {
  const { search, limit = 50, offset = 0 } = req.query;
  
  let characters = await notionService.getCharactersForList(req.query);
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    characters = characters.filter(char => 
      (char.name && char.name.toLowerCase().includes(searchLower)) ||
      (char.logline && char.logline.toLowerCase().includes(searchLower)) ||
      (char.tier && char.tier.toString().toLowerCase().includes(searchLower))
    );
  }
  
  // Apply pagination
  const total = characters.length;
  const paginated = characters.slice(
    parseInt(offset), 
    parseInt(offset) + parseInt(limit)
  );
  
  setCacheHeaders(res);
  // The response wrapper will handle the success wrapper
  res.json({
    data: paginated,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

const getCharactersWithSociogramData = catchAsync(async (req, res) => {
  const db = getDB();

  // Get all characters with their computed fields and relationships
  const characters = db.prepare(`
    SELECT 
      c.*,
      (
        SELECT COUNT(DISTINCT CASE 
          WHEN cl.character_a_id = c.id THEN cl.character_b_id 
          WHEN cl.character_b_id = c.id THEN cl.character_a_id 
        END)
        FROM character_links cl
        WHERE cl.character_a_id = c.id OR cl.character_b_id = c.id
      ) as relationship_count,
      COUNT(DISTINCT coe.element_id) as owned_elements_count,
      COUNT(DISTINCT cae.element_id) as associated_elements_count,
      COUNT(DISTINCT cte.timeline_event_id) as timeline_events_count
    FROM characters c
    LEFT JOIN character_owned_elements coe ON c.id = coe.character_id
    LEFT JOIN character_associated_elements cae ON c.id = cae.character_id
    LEFT JOIN character_timeline_events cte ON c.id = cte.character_id
    GROUP BY c.id
    ORDER BY c.name
  `).all();

  // Get all character links for building edges
  const characterLinks = dbQueries.getAllCharacterLinks();

  res.json({
    characters,
    characterLinks
  });
});

const getAllCharacterLinks = catchAsync(async (req, res) => {
  // Use the query from queries.js which matches the actual database schema
  const characterLinks = dbQueries.getAllCharacterLinks();
  res.json(characterLinks);
});

const getCharacterById = catchAsync(async (req, res) => {
  const { id } = req.params;
  
  const cacheKey = makeCacheKey('character', id);
  const cached = notionCache.get(cacheKey);
  if (cached) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }

  const character = await notionService.getCharacterById(id);
  if (!character) {
    return res.status(404).json({ error: 'Character not found' });
  }

  notionCache.set(cacheKey, character);
  logger.debug(`[CACHE SET] ${cacheKey}`);
  setCacheHeaders(res);
  res.json(character);
});

const getCharacterGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const graphService = require('../services/graphService');
  const graphData = await graphService.getCharacterGraph(id);
  setCacheHeaders(res);
  res.json(graphData);
});

const getCharactersWithWarnings = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('characters-warnings');
  const cached = notionCache.get(cacheKey);
  if (cached) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }

  const charactersWithWarnings = await warningService.getCharacterWarnings();
  notionCache.set(cacheKey, charactersWithWarnings);
  logger.debug(`[CACHE SET] ${cacheKey} - Found ${charactersWithWarnings.length} characters with warnings.`);
  setCacheHeaders(res);
  res.json(charactersWithWarnings);
});

module.exports = {
  getCharacters,
  getCharactersWithSociogramData,
  getAllCharacterLinks,
  getCharacterById,
  getCharacterGraph,
  getCharactersWithWarnings
};