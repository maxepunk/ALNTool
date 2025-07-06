const notionService = require('../services/notionService');
const logger = require('../utils/logger');
const propertyMapper = require('../utils/notionPropertyMapper');
const GameConstants = require('../config/GameConstants');
const { notionCache, makeCacheKey } = require('../services/notionService');
const { catchAsync, setCacheHeaders } = require('../utils/controllerUtils');

const getDatabasesMetadata = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('metadata');
  const cached = notionCache.get(cacheKey);
  if (cached) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }

  const metadata = await notionService.getDatabasesMetadata();
  notionCache.set(cacheKey, metadata);
  logger.debug(`[CACHE SET] ${cacheKey}`);
  setCacheHeaders(res);
  res.json(metadata);
});

const getGameConstants = catchAsync(async (req, res) => {
  setCacheHeaders(res);
  res.json(GameConstants);
});

const globalSearch = catchAsync(async (req, res) => {
  const { query } = req.query;
  if (!query || query.trim().length < 2) {
    return res.json([]);
  }

  const cacheKey = makeCacheKey('search', query);
  const cached = notionCache.get(cacheKey);
  if (cached) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }

  const searchPromises = [
    notionService.searchDatabases(query, 'Characters'),
    notionService.searchDatabases(query, 'Elements'),
    notionService.searchDatabases(query, 'Puzzles'),
    notionService.searchDatabases(query, 'Timeline Events')
  ];

  const [characters, elements, puzzles, timelineEvents] = await Promise.all(searchPromises);

  const mapPromises = [
    ...characters.map(c => propertyMapper.mapCharacterWithNames(c, notionService).then(mapped => ({ ...mapped, type: 'Character' }))),
    ...elements.map(e => propertyMapper.mapElementWithNames(e, notionService).then(mapped => ({ ...mapped, type: 'Element' }))),
    ...puzzles.map(p => propertyMapper.mapPuzzleWithNames(p, notionService).then(mapped => ({ ...mapped, type: 'Puzzle' }))),
    ...timelineEvents.map(t => propertyMapper.mapTimelineEventWithNames(t, notionService).then(mapped => ({ ...mapped, type: 'Timeline Event' })))
  ];

  const results = await Promise.all(mapPromises);
  const validResults = results.filter(r => !r.error);

  notionCache.set(cacheKey, validResults);
  logger.debug(`[CACHE SET] ${cacheKey} - Found ${validResults.length} results`);
  setCacheHeaders(res);
  res.json(validResults);
});

const clearCache = catchAsync(async (req, res) => {
  notionCache.flushAll();
  logger.info('🗑️ Cache cleared manually');
  res.json({ message: 'Cache cleared successfully' });
});

const getAllUniqueNarrativeThreads = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('unique-narrative-threads-v1');
  const cachedData = notionCache.get(cacheKey);
  if (cachedData) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  logger.debug(`[CACHE MISS] ${cacheKey}`);

  const allThreads = new Set();

  // Fetch from all four entity types
  const characterPages = await notionService.getCharacters();
  const elementPages = await notionService.getElements();
  const puzzlePages = await notionService.getPuzzles();
  const timelineEventPages = await notionService.getTimelineEvents();

  const allItems = [
    ...characterPages,
    ...elementPages,
    ...puzzlePages,
    ...timelineEventPages
  ];

  // Map all entities to extract narrative threads
  const mappedChars = await Promise.all(characterPages.map(c => propertyMapper.mapCharacterWithNames(c, notionService)));
  const mappedElems = await Promise.all(elementPages.map(e => propertyMapper.mapElementWithNames(e, notionService)));
  const mappedPuzzles = await Promise.all(puzzlePages.map(p => propertyMapper.mapPuzzleWithNames(p, notionService)));
  const mappedEvents = await Promise.all(timelineEventPages.map(t => propertyMapper.mapTimelineEventWithNames(t, notionService)));

  const allMappedItems = [
    ...mappedChars,
    ...mappedElems,
    ...mappedPuzzles,
    ...mappedEvents
  ];

  allMappedItems.forEach(item => {
    if (item && item.narrativeThreads && Array.isArray(item.narrativeThreads)) {
      item.narrativeThreads.forEach(thread => allThreads.add(thread));
    }
  });

  const sortedThreads = Array.from(allThreads).sort();

  notionCache.set(cacheKey, sortedThreads);
  logger.debug(`[CACHE SET] ${cacheKey} - Found ${sortedThreads.length} unique narrative threads.`);
  setCacheHeaders(res);
  res.json(sortedThreads);
});

module.exports = {
  getDatabasesMetadata,
  getGameConstants,
  globalSearch,
  clearCache,
  getAllUniqueNarrativeThreads
};