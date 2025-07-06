const notionService = require('../services/notionService');
const logger = require('../utils/logger');
const propertyMapper = require('../utils/notionPropertyMapper');
const puzzleFlowService = require('../services/puzzleFlowService');
const warningService = require('../services/warningService');
const { notionCache, makeCacheKey } = require('../services/notionService');
const { getDB } = require('../db/database');
const { catchAsync, setCacheHeaders, buildNotionFilter } = require('../utils/controllerUtils');

const getPuzzles = catchAsync(async (req, res) => {
  const { search, limit = 50, offset = 0, ...filterParams } = req.query;
  
  const propertyMap = { timing: 'Timing', narrativeThreadContains: 'Narrative Threads' };
  const filter = buildNotionFilter(filterParams, propertyMap);
  const notionPuzzles = await notionService.getPuzzles(filter);
  let puzzles = await Promise.all(
    notionPuzzles.map(puzzle => propertyMapper.mapPuzzleWithNames(puzzle, notionService))
  );
  
  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    puzzles = puzzles.filter(puzzle => 
      (puzzle.name && puzzle.name.toLowerCase().includes(searchLower)) ||
      (puzzle.difficulty && puzzle.difficulty.toString().toLowerCase().includes(searchLower)) ||
      (puzzle.status && puzzle.status.toLowerCase().includes(searchLower))
    );
  }
  
  // Apply pagination
  const total = puzzles.length;
  const paginated = puzzles.slice(
    parseInt(offset), 
    parseInt(offset) + parseInt(limit)
  );
  
  setCacheHeaders(res);
  res.json({
    data: paginated,
    total,
    limit: parseInt(limit),
    offset: parseInt(offset)
  });
});

const getPuzzleById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cacheKey = makeCacheKey('mapped-puzzle-v1.1-narrative', { id }); // Updated cache key
  const cachedMappedPuzzle = notionCache.get(cacheKey);
  if (cachedMappedPuzzle) {
    logger.debug(`[CACHE HIT] ${cacheKey} (mapped puzzle)`);
    setCacheHeaders(res);
    return res.json(cachedMappedPuzzle);
  }
  logger.debug(`[CACHE MISS] ${cacheKey} (mapped puzzle)`);
  const puzzlePage = await notionService.getPage(id);
  if (!puzzlePage) {
    return res.status(404).json({ error: 'Puzzle not found' });
  }
  const mappedPuzzle = await propertyMapper.mapPuzzleWithNames(puzzlePage, notionService);
  if (mappedPuzzle && !mappedPuzzle.error) {
    notionCache.set(cacheKey, mappedPuzzle);
    logger.debug(`[CACHE SET] ${cacheKey} (mapped puzzle)`);
  }
  setCacheHeaders(res);
  res.json(mappedPuzzle);
});

const getPuzzleGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const graphService = require('../services/graphService');
  const graphData = await graphService.getPuzzleGraph(id);
  setCacheHeaders(res);
  res.json(graphData);
});

const getPuzzleFlow = catchAsync(async (req, res) => {
  const { id: puzzleId } = req.params;
  const cacheKey = makeCacheKey('puzzle-flow-v1', { id: puzzleId });
  const cachedData = notionCache.get(cacheKey);

  if (cachedData) {
    logger.debug(`[CACHE HIT] ${cacheKey} (Puzzle Flow)`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  logger.debug(`[CACHE MISS] ${cacheKey} (Puzzle Flow)`);

  try {
    const flowData = await puzzleFlowService.getPuzzleFlowData(puzzleId);
    notionCache.set(cacheKey, flowData);
    logger.debug(`[CACHE SET] ${cacheKey} (Puzzle Flow for ${flowData.centralPuzzle.name})`);
    setCacheHeaders(res);
    res.json(flowData);
  } catch (error) {
    if (error.message === 'Puzzle not found') {
      return res.status(404).json({ error: error.message });
    }
    return res.status(500).json({ error: error.message });
  }
});

const getPuzzleFlowGraph = catchAsync(async (req, res) => {
  const { id: puzzleId } = req.params;
  const cacheKey = makeCacheKey('puzzle-flow-graph-v1', { id: puzzleId });
  const cachedData = notionCache.get(cacheKey);

  if (cachedData) {
    logger.debug(`[CACHE HIT] ${cacheKey} (Puzzle Flow Graph)`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  logger.debug(`[CACHE MISS] ${cacheKey} (Puzzle Flow Graph)`);

  try {
    const graphData = await puzzleFlowService.buildPuzzleFlowGraph(puzzleId);
    notionCache.set(cacheKey, graphData);
    logger.debug(`[CACHE SET] ${cacheKey} (Puzzle Flow Graph for ${graphData.center.name})`);
    setCacheHeaders(res);
    res.json(graphData);
  } catch (error) {
    logger.error(`Failed to get puzzle flow graph for ${puzzleId}:`, error);
    res.status(500).json({ error: 'Failed to generate puzzle flow graph' });
  }
});

const getPuzzlesWithWarnings = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('puzzles-warnings');
  const cached = notionCache.get(cacheKey);
  if (cached) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }

  const puzzlesWithWarnings = await warningService.getPuzzleWarnings();
  notionCache.set(cacheKey, puzzlesWithWarnings);
  logger.debug(`[CACHE SET] ${cacheKey} - Found ${puzzlesWithWarnings.length} puzzles with warnings.`);
  setCacheHeaders(res);
  res.json(puzzlesWithWarnings);
});

module.exports = {
  getPuzzles,
  getPuzzleById,
  getPuzzleGraph,
  getPuzzleFlow,
  getPuzzleFlowGraph,
  getPuzzlesWithWarnings
};