const notionService = require('../services/notionService');
const logger = require('../utils/logger');
const propertyMapper = require('../utils/notionPropertyMapper');
const warningService = require('../services/warningService');
const memoryElementService = require('../services/memoryElementService');
const { notionCache, makeCacheKey } = require('../services/notionService');
const { catchAsync, setCacheHeaders } = require('../utils/controllerUtils');

const getElements = catchAsync(async (req, res) => {
  const { filterGroup, search, limit = 50, offset = 0, ...otherQueryParams } = req.query;

  let elements;

  // For memory types, use database with computed fields
  if (filterGroup === 'memoryTypes') {
    elements = memoryElementService.getMemoryElements();
  } else {
    // For non-memory queries, use regular Notion API with filtering
    const propertyMap = { 
      basicType: 'Basic Type', 
      status: 'Status', 
      location: 'Location',
      narrativeThreadContains: 'Narrative Threads'
    };

    const filterConditions = [];
    for (const [key, value] of Object.entries(otherQueryParams)) {
      if (propertyMap[key] && value) {
        if (key === 'narrativeThreadContains') {
          filterConditions.push({
            property: propertyMap[key],
            multi_select: { contains: value }
          });
        } else {
          filterConditions.push({
            property: propertyMap[key],
            select: { equals: value }
          });
        }
      }
    }

    const filter = filterConditions.length === 0 ? undefined : 
      filterConditions.length === 1 ? filterConditions[0] : { and: filterConditions };

    const notionElements = await notionService.getElements(filter);
    elements = await Promise.all(
      notionElements.map(element => propertyMapper.mapElementWithNames(element, notionService))
    );
  }

  // Apply search filter if provided
  if (search) {
    const searchLower = search.toLowerCase();
    elements = elements.filter(element => 
      (element.name && element.name.toLowerCase().includes(searchLower)) ||
      (element.owner && element.owner.toLowerCase().includes(searchLower)) ||
      (element.container && element.container.toLowerCase().includes(searchLower)) ||
      (element.status && element.status.toLowerCase().includes(searchLower))
    );
  }

  // Apply pagination
  const total = elements.length;
  const paginated = elements.slice(
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

const getElementById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cacheKey = makeCacheKey('element', id);
  const cached = notionCache.get(cacheKey);
  if (cached) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }

  const element = await notionService.getPage(id);
  if (!element) {
    return res.status(404).json({ error: 'Element not found' });
  }

  const mappedElement = await propertyMapper.mapElementWithNames(element, notionService);
  notionCache.set(cacheKey, mappedElement);
  logger.debug(`[CACHE SET] ${cacheKey}`);
  setCacheHeaders(res);
  res.json(mappedElement);
});

const getElementGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const graphService = require('../services/graphService');
  const graphData = await graphService.getElementGraph(id);
  setCacheHeaders(res);
  res.json(graphData);
});

const getElementsWithWarnings = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('elements-with-warnings-v2');
  const cachedData = notionCache.get(cacheKey);
  if (cachedData) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  logger.debug(`[CACHE MISS] ${cacheKey}`);

  const elementsWithWarnings = await warningService.getElementWarnings();
  notionCache.set(cacheKey, elementsWithWarnings);
  logger.debug(`[CACHE SET] ${cacheKey} - Found ${elementsWithWarnings.length} elements with warnings.`);
  setCacheHeaders(res);
  res.json(elementsWithWarnings);
});

module.exports = {
  getElements,
  getElementById,
  getElementGraph,
  getElementsWithWarnings
};