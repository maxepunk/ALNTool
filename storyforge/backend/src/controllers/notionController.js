const notionService = require('../services/notionService');
const logger = require('../utils/logger');
const graphService = require('../services/graphService'); // Import the new service
const propertyMapper = require('../utils/notionPropertyMapper');
const { notionCache, makeCacheKey } = require('../services/notionService');
const { getDB } = require('../db/database');
const GameConstants = require('../config/GameConstants');

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

const catchAsync = fn => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

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

const getCharacters = catchAsync(async (req, res) => {
  // Now using the lightweight query for the list view to avoid N+1 issues.
  // This fetches a flat list of characters without resolving all nested entity names.
  const characters = await notionService.getCharactersForList(req.query);
  setCacheHeaders(res);
  res.json(characters);
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
  const characterLinks = db.prepare(`
    SELECT DISTINCT
      CASE 
        WHEN cl.character_a_id < cl.character_b_id THEN cl.character_a_id 
        ELSE cl.character_b_id 
      END as char1_id,
      CASE 
        WHEN cl.character_a_id < cl.character_b_id THEN cl.character_b_id 
        ELSE cl.character_a_id 
      END as char2_id,
      COUNT(*) as link_count
    FROM character_links cl
    GROUP BY char1_id, char2_id
  `).all();

  // Create a map of character data for quick lookup
  const characterMap = new Map(characters.map(c => [c.id, c]));

  // Build linkedCharacters arrays for each character
  const linksByCharacter = new Map();
  
  characterLinks.forEach(link => {
    // Add link for char1
    if (!linksByCharacter.has(link.char1_id)) {
      linksByCharacter.set(link.char1_id, []);
    }
    const char2 = characterMap.get(link.char2_id);
    if (char2) {
      linksByCharacter.get(link.char1_id).push({
        id: char2.id,
        name: char2.name,
        linkCount: link.link_count
      });
    }

    // Add link for char2
    if (!linksByCharacter.has(link.char2_id)) {
      linksByCharacter.set(link.char2_id, []);
    }
    const char1 = characterMap.get(link.char1_id);
    if (char1) {
      linksByCharacter.get(link.char2_id).push({
        id: char1.id,
        name: char1.name,
        linkCount: link.link_count
      });
    }
  });

  // Parse JSON fields and add computed memory value data
  const enrichedCharacters = characters.map(char => ({
    ...char,
    resolution_paths: char.resolution_paths ? JSON.parse(char.resolution_paths) : [],
    resolutionPaths: char.resolution_paths ? JSON.parse(char.resolution_paths) : [], // Frontend expects this name
    memoryValue: char.total_memory_value || 0,
    relationshipCount: char.relationship_count,
    elementCount: char.owned_elements_count + char.associated_elements_count,
    timelineEventCount: char.timeline_events_count,
    linkedCharacters: linksByCharacter.get(char.id) || [] // Add the linked characters array
  }));

  setCacheHeaders(res);
  res.json(enrichedCharacters);
});

const getCharacterById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cacheKey = makeCacheKey('mapped-character-v1.1-sociogram', { id }); // Updated cache key
  const cachedMappedCharacter = notionCache.get(cacheKey);
  if (cachedMappedCharacter) {
    logger.debug(`[CACHE HIT] ${cacheKey} (mapped character)`);
    setCacheHeaders(res);
    return res.json(cachedMappedCharacter);
  }
  logger.debug(`[CACHE MISS] ${cacheKey} (mapped character)`);
  const characterPage = await notionService.getPage(id);
  if (!characterPage) {
    return res.status(404).json({ error: 'Character not found' });
  }
  const mappedCharacter = await propertyMapper.mapCharacterWithNames(characterPage, notionService);
  if (mappedCharacter && !mappedCharacter.error) {
    notionCache.set(cacheKey, mappedCharacter);
    logger.debug(`[CACHE SET] ${cacheKey} (mapped character)`);
  }
  setCacheHeaders(res);
  res.json(mappedCharacter);
});

const getCharacterGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const depth = parseInt(req.query.depth || '1', 10);

  // The cache key should probably be updated or reconsidered, but for now, we'll bypass it
  // to ensure we're hitting our new service. A proper caching layer can be added to the graphService later.

  const graph = await graphService.getCharacterGraph(id, depth);

  // We are not setting cache headers here for now to ensure fresh data from the new service.
  res.json(graph);
});

const getTimelineEvents = catchAsync(async (req, res) => {
  const propertyMap = {
    memType: 'mem type',
    date: 'Date',
    narrativeThreadContains: 'Narrative Threads',
    actFocus: 'Act Focus' // Added for server-side filtering
  };
  const filter = buildNotionFilter(req.query, propertyMap);
  // Log the constructed filter for debugging
  // logger.debug('[Timeline Controller] Constructed Filter for Notion:', JSON.stringify(filter, null, 2));
  const notionEvents = await notionService.getTimelineEvents(filter);
  const events = await Promise.all(
    notionEvents.map(event => propertyMapper.mapTimelineEventWithNames(event, notionService))
  );
  setCacheHeaders(res);
  res.json(events);
});

const getTimelineEventsList = catchAsync(async (req, res) => {
  // Database-backed timeline events for dashboard
  const events = await notionService.getTimelineEventsForList(req.query);
  setCacheHeaders(res);
  res.json(events);
});

const getTimelineEventById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cacheKey = makeCacheKey('mapped-timelineevent', { id });
  const cachedMappedEvent = notionCache.get(cacheKey);
  if (cachedMappedEvent) {
    logger.debug(`[CACHE HIT] ${cacheKey} (mapped event)`);
    setCacheHeaders(res);
    return res.json(cachedMappedEvent);
  }
  logger.debug(`[CACHE MISS] ${cacheKey} (mapped event)`);
  const eventPage = await notionService.getPage(id);
  if (!eventPage) {
    return res.status(404).json({ error: 'Timeline event not found' });
  }
  const mappedEvent = await propertyMapper.mapTimelineEventWithNames(eventPage, notionService);
  if (mappedEvent && !mappedEvent.error) {
    notionCache.set(cacheKey, mappedEvent);
    logger.debug(`[CACHE SET] ${cacheKey} (mapped event)`);
  }
  setCacheHeaders(res);
  res.json(mappedEvent);
});

const getPuzzles = catchAsync(async (req, res) => {
  const propertyMap = { timing: 'Timing', narrativeThreadContains: 'Narrative Threads' };
  const filter = buildNotionFilter(req.query, propertyMap);
  const notionPuzzles = await notionService.getPuzzles(filter);
  const puzzles = await Promise.all(
    notionPuzzles.map(puzzle => propertyMapper.mapPuzzleWithNames(puzzle, notionService))
  );
  setCacheHeaders(res);
  res.json(puzzles);
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

// Use GameConstants for all business values
const MEMORY_BASIC_TYPES = GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES;

// Memory value mappings (from GameConstants)
const VALUE_RATING_MAP = GameConstants.MEMORY_VALUE.BASE_VALUES;

// Use correct multipliers from GameConstants
const TYPE_MULTIPLIER_MAP = GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS;

const getElements = catchAsync(async (req, res) => {
  const { filterGroup, ...otherQueryParams } = req.query;

  // For memory types, use database with computed fields
  if (filterGroup === 'memoryTypes') {
    const db = getDB();
    const elements = db.prepare(`
      SELECT 
        e.*,
        c.name as owner_name,
        ce.name as container_name
      FROM elements e
      LEFT JOIN characters c ON e.owner_id = c.id
      LEFT JOIN elements ce ON e.container_id = ce.id
      WHERE e.type IN ('Memory Token Video', 'Memory Token Audio', 'Memory Token Physical', 'Corrupted Memory RFID', 'Memory Fragment')
      ORDER BY e.name
    `).all();

    // Transform to match frontend expectations
    const transformedElements = elements.map(el => ({
      ...el,
      // Memory-specific fields with correct mappings
      sf_value_rating: el.value_rating || 0,  // Use the actual extracted value rating
      sf_memory_type: el.memory_type || null,  // Use null instead of 'Unknown' to match frontend
      parsed_sf_rfid: el.rfid_tag || null,
      sf_memory_group: el.memory_group || null,

      // Computed fields - keep these for backward compatibility
      baseValueAmount: el.value_rating ? VALUE_RATING_MAP[el.value_rating] : 0,
      typeMultiplierValue: el.memory_type ? TYPE_MULTIPLIER_MAP[el.memory_type] : 1,
      finalCalculatedValue: el.calculated_memory_value || 0,

      // Resolution paths
      resolutionPaths: el.resolution_paths ? JSON.parse(el.resolution_paths) : [],

      // Owner info
      ownerName: el.owner_name,
      containerName: el.container_name,

      // Legacy field for backward compatibility
      memoryValue: el.calculated_memory_value || 0,

      // Properties field to match Notion structure
      properties: {
        sf_value_rating: el.value_rating || 0,
        sf_memory_type: el.memory_type || null,
        parsed_sf_rfid: el.rfid_tag || null,
        status: el.status || 'Unknown'
      }
    }));

    setCacheHeaders(res);
    return res.json(transformedElements);
  }

  // Default behavior for non-memory queries
  let combinedFilter;
  const propertyMap = {
    type: 'Basic Type',
    status: 'Status',
    firstAvailable: 'First Available',
    narrativeThreadContains: 'Narrative Threads'
  };
  const standardFilters = buildNotionFilter(otherQueryParams, propertyMap);
  combinedFilter = standardFilters;

  const notionElements = await notionService.getElements(combinedFilter);
  const elements = await Promise.all(
    notionElements.map(element => propertyMapper.mapElementWithNames(element, notionService))
  );
  setCacheHeaders(res);
  res.json(elements);
});

const getElementById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cacheKey = makeCacheKey('mapped-element', { id });
  const cachedMappedElement = notionCache.get(cacheKey);
  if (cachedMappedElement) {
    logger.debug(`[CACHE HIT] ${cacheKey} (mapped element)`);
    setCacheHeaders(res);
    return res.json(cachedMappedElement);
  }
  logger.debug(`[CACHE MISS] ${cacheKey} (mapped element)`);
  const elementPage = await notionService.getPage(id);
  if (!elementPage) {
    return res.status(404).json({ error: 'Element not found' });
  }
  const mappedElement = await propertyMapper.mapElementWithNames(elementPage, notionService);
  if (mappedElement && !mappedElement.error) {
    notionCache.set(cacheKey, mappedElement);
    logger.debug(`[CACHE SET] ${cacheKey} (mapped element)`);
  }
  setCacheHeaders(res);
  res.json(mappedElement);
});

const getDatabasesMetadata = catchAsync(async (req, res) => {
  res.json({
    databases: {
      characters: notionService.DB_IDS.CHARACTERS,
      timeline: notionService.DB_IDS.TIMELINE,
      puzzles: notionService.DB_IDS.PUZZLES,
      elements: notionService.DB_IDS.ELEMENTS
    },
    elementTypes: [
      'Prop',
      'Set Dressing',
      'Memory Token Video',
      'Character Sheet'
    ]
  });
});

const getGameConstants = catchAsync(async (req, res) => {
  const GameConstants = require('../config/GameConstants');

  // Return the entire GameConstants object so frontend has access to all business rules
  res.json(GameConstants);
});

const globalSearch = catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  const dbSearchConfigs = {
    characters: {
      serviceFn: notionService.getCharacters,
      titleProperty: 'Name',
      mapperFn: propertyMapper.mapCharacterWithNames
    },
    timeline: {
      serviceFn: notionService.getTimelineEvents,
      titleProperty: 'Description',
      mapperFn: propertyMapper.mapTimelineEventWithNames
    },
    puzzles: {
      serviceFn: notionService.getPuzzles,
      titleProperty: 'Puzzle',
      mapperFn: propertyMapper.mapPuzzleWithNames
    },
    elements: {
      serviceFn: notionService.getElements,
      titleProperty: 'Name',
      mapperFn: propertyMapper.mapElementWithNames
    }
  };

  const results = {};
  const searchPromises = Object.entries(dbSearchConfigs).map(async ([dbKey, config]) => {
    const filter = {
      property: config.titleProperty,
      title: { contains: q }
    };
    try {
      const items = await config.serviceFn(filter);
      results[dbKey] = await Promise.all(
        items.map(item => config.mapperFn(item, notionService))
      );
    } catch (e) {
      logger.error(`Error searching in ${dbKey}:`, e);
      results[dbKey] = [];
    }
  });

  await Promise.all(searchPromises);
  res.json(results);
});

const clearCache = catchAsync(async (req, res) => {
  notionService.clearCache();
  logger.debug('Server cache cleared.');
  res.json({ message: 'Cache cleared' });
});

function setCacheHeaders(res, seconds = 300) {
  res.set('Cache-Control', `public, max-age=${seconds}`);
}

const getElementGraph = catchAsync(async (req, res) => {
  // TODO: Implement in graphService.js
  res.status(501).json({ error: 'Not implemented' });
});

const getPuzzleGraph = catchAsync(async (req, res) => {
  // TODO: Implement in graphService.js
  res.status(501).json({ error: 'Not implemented' });
});

const getTimelineGraph = catchAsync(async (req, res) => {
  // TODO: Implement in graphService.js
  res.status(501).json({ error: 'Not implemented' });
});

module.exports = {
  getCharacters,
  getCharacterById,
  getTimelineEvents,
  getTimelineEventById,
  getPuzzles,
  getPuzzleById,
  getElements,
  getElementById,
  getDatabasesMetadata,
  globalSearch,
  clearCache,
  getCharacterGraph,
  getElementGraph,
  getPuzzleGraph,
  getTimelineGraph
};

// --- New Endpoints for Dashboard "Needs Attention" ---

const getPuzzlesWithWarnings = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('puzzles-with-warnings-v2'); // Cache key updated
  const cachedData = notionCache.get(cacheKey);
  if (cachedData) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  logger.debug(`[CACHE MISS] ${cacheKey}`);

  const notionPuzzles = await notionService.getPuzzles(); // Get all puzzles
  const mappedPuzzles = await Promise.all(
    notionPuzzles.map(puzzle => propertyMapper.mapPuzzleWithNames(puzzle, notionService))
  );

  const puzzlesWithWarnings = [];
  for (const puzzle of mappedPuzzles) {
    if (puzzle.error) {
      continue;
    } // Skip if there was an error mapping this puzzle

    const warnings = [];
    if (!puzzle.rewards || puzzle.rewards.length === 0) {
      warnings.push({ warningType: 'NoRewards', message: 'Puzzle has no rewards defined.' });
    }
    if (!puzzle.puzzleElements || puzzle.puzzleElements.length === 0) {
      warnings.push({ warningType: 'NoInputs', message: 'Puzzle has no input elements defined (puzzleElements).' });
    }
    if (!puzzle.resolutionPaths || puzzle.resolutionPaths.length === 0) {
      warnings.push({ warningType: 'NoResolutionPath', message: 'Puzzle does not contribute to any resolution path.' });
    }
    // Add more checks here if needed, e.g., missing owner, etc.

    if (warnings.length > 0) {
      puzzlesWithWarnings.push({
        id: puzzle.id,
        name: puzzle.puzzle, // Name of the puzzle
        type: 'Puzzle', // To help frontend identify item type
        warnings,
        // Optionally include a few key properties for quick display, like owner or timing
        owner: puzzle.owner,
        timing: puzzle.timing || puzzle.actFocus
      });
    }
  }

  notionCache.set(cacheKey, puzzlesWithWarnings);
  logger.debug(`[CACHE SET] ${cacheKey} - Found ${puzzlesWithWarnings.length} puzzles with warnings.`);
  setCacheHeaders(res);
  res.json(puzzlesWithWarnings);
});

const getElementsWithWarnings = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('elements-with-warnings-v2'); // Cache key updated
  const cachedData = notionCache.get(cacheKey);
  if (cachedData) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  logger.debug(`[CACHE MISS] ${cacheKey}`);

  const notionElements = await notionService.getElements(); // Get all elements
  const mappedElements = await Promise.all(
    notionElements.map(element => propertyMapper.mapElementWithNames(element, notionService))
  );

  const EXCLUDED_BASIC_TYPES = ['Character Sheet', 'Set Dressing', 'Core Narrative']; // Add other non-puzzle interactive types

  const elementsWithWarnings = [];
  for (const element of mappedElements) {
    if (element.error) {
      continue;
    }

    if (EXCLUDED_BASIC_TYPES.includes(element.basicType)) {
      continue;
    }

    const warnings = [];
    const isRequired = element.requiredForPuzzle && element.requiredForPuzzle.length > 0;
    const isReward = element.rewardedByPuzzle && element.rewardedByPuzzle.length > 0;

    if (!isRequired && !isReward) {
      warnings.push({
        warningType: 'NotUsedInOrRewardingPuzzles',
        message: 'Element is not used as an input for any puzzle and is not a reward from any puzzle.'
      });
    }

    const isMemoryToken = element.basicType?.toLowerCase().includes('memory') || element.basicType?.toLowerCase().includes('token');
    if (isMemoryToken && (!element.memorySets || element.memorySets.length === 0)) {
      warnings.push({
        warningType: 'NoMemorySet',
        message: 'Memory Token is not part of any Memory Set.'
      });
    }

    if (warnings.length > 0) {
      elementsWithWarnings.push({
        id: element.id,
        name: element.name,
        type: 'Element', // To help frontend identify item type
        basicType: element.basicType,
        status: element.status,
        owner: element.owner,
        warnings
      });
    }
  }

  notionCache.set(cacheKey, elementsWithWarnings);
  logger.debug(`[CACHE SET] ${cacheKey} - Found ${elementsWithWarnings.length} elements with warnings.`);
  setCacheHeaders(res);
  res.json(elementsWithWarnings);
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

  const puzzlePage = await notionService.getPage(puzzleId);
  if (!puzzlePage) {
    return res.status(404).json({ error: 'Puzzle not found' });
  }

  const centralPuzzle = await propertyMapper.mapPuzzleWithNames(puzzlePage, notionService);
  if (centralPuzzle.error) {
    return res.status(500).json({ error: `Failed to map central puzzle data: ${centralPuzzle.error}` });
  }

  const relatedEntityIds = new Set();
  (centralPuzzle.puzzleElements || []).forEach(el => relatedEntityIds.add(el.id));
  (centralPuzzle.rewards || []).forEach(el => relatedEntityIds.add(el.id));
  (centralPuzzle.subPuzzles || []).forEach(p => relatedEntityIds.add(p.id));
  (centralPuzzle.parentItem || []).forEach(p => relatedEntityIds.add(p.id));
  // Add IDs from lockedItem if it's considered an output or distinct part of the flow
  (centralPuzzle.lockedItem || []).forEach(el => relatedEntityIds.add(el.id));

  const relatedPages = await notionService.getPagesByIds(Array.from(relatedEntityIds));
  const mappedRelatedEntities = new Map();

  for (const page of relatedPages) {
    if (!page || !page.id) {
      continue;
    }
    // Determine type based on which list it came from or by querying DB type if necessary (more complex)
    // For now, assume we can infer or just map generally. The mapXWithNames includes type.
    let mappedEntity;
    // A more robust way would be to query the DB type or check properties if type isn't on the stub
    // For now, we rely on the stubs from centralPuzzle having enough info or mapElement/mapPuzzle to fill it.
    if (page.properties.Puzzle) { // Heuristic: if it has a 'Puzzle' title property, it's a puzzle
      mappedEntity = await propertyMapper.mapPuzzleWithNames(page, notionService);
    } else if (page.properties.Name) { // Heuristic: if it has 'Name', it's likely an Element
      mappedEntity = await propertyMapper.mapElementWithNames(page, notionService);
    } else { // Fallback or if more types are possible
      logger.warn(`[getPuzzleFlow] Could not determine type for related page ${page.id}`);
      continue;
    }

    if (mappedEntity && !mappedEntity.error) {
      mappedRelatedEntities.set(page.id, mappedEntity);
    }
  }

  const formatElement = (elStub) => {
    const fullEl = mappedRelatedEntities.get(elStub.id);
    return {
      id: elStub.id,
      name: fullEl?.name || elStub.name || 'Unknown Element', // Use full name if available
      type: 'Element', // Explicitly set type
      basicType: fullEl?.basicType || 'Unknown'
      // Future: Add sourcePuzzleName if element is a reward from another puzzle
    };
  };

  const formatPuzzle = (pzStub) => {
    const fullPz = mappedRelatedEntities.get(pzStub.id);
    return {
      id: pzStub.id,
      name: fullPz?.puzzle || pzStub.name || 'Unknown Puzzle', // Use full name if available
      type: 'Puzzle'
    };
  };

  const inputElements = (centralPuzzle.puzzleElements || []).map(formatElement);
  const outputElements = (centralPuzzle.rewards || []).map(formatElement);
  // lockedItem can also be considered an output/unlock if it's an Element
  (centralPuzzle.lockedItem || []).forEach(itemStub => {
    const fullItem = mappedRelatedEntities.get(itemStub.id);
    if (fullItem && fullItem.basicType) { // Check if it's an element
      const formattedItem = formatElement(itemStub);
      // Avoid duplicates if already in rewards
      if(!outputElements.find(o => o.id === formattedItem.id)) {
        outputElements.push(formattedItem);
      }
    }
  });

  const unlocksPuzzles = (centralPuzzle.subPuzzles || []).map(formatPuzzle);
  const prerequisitePuzzles = (centralPuzzle.parentItem || []).map(formatPuzzle);

  const flowData = {
    centralPuzzle: {
      id: centralPuzzle.id,
      name: centralPuzzle.puzzle,
      type: 'Puzzle',
      properties: centralPuzzle // Send all mapped properties for the central puzzle
    },
    inputElements,
    outputElements,
    unlocksPuzzles,
    prerequisitePuzzles
  };

  notionCache.set(cacheKey, flowData);
  logger.debug(`[CACHE SET] ${cacheKey} (Puzzle Flow for ${centralPuzzle.puzzle})`);
  setCacheHeaders(res);
  res.json(flowData);
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

  // Map and extract narrative threads - using simple mappers here as we only need the threads array
  // and don't want to trigger all the related name fetches of WithNames mappers.
  // This assumes simple mappers also correctly map 'Narrative Threads' property.
  // If not, this part needs adjustment or use WithNames mappers carefully.
  // For now, assuming simple mappers are sufficient or that `narrativeThreads` is directly on properties.

  // Re-checking propertyMapper.js, the simple mappers DO map 'Narrative Threads' for puzzles and elements.
  // For Characters and TimelineEvents, `narrativeThreads` was added to `WithNames` mappers.
  // To be safe and ensure all data is processed consistently with how it's added elsewhere,
  // it's better to use the WithNames mappers here, even if it's slightly less performant.
  // The alternative would be to ensure simple mappers also map narrativeThreads for all types.

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

const getPuzzleFlowGraph = catchAsync(async (req, res) => {
  const { id: puzzleId } = req.params;
  // const depth = parseInt(req.query.depth || '1', 10); // Depth parameter for future expansion
  const cacheKey = makeCacheKey('puzzle-flow-graph-v1', { id: puzzleId });
  const cachedData = notionCache.get(cacheKey);

  if (cachedData) {
    logger.debug(`[CACHE HIT] ${cacheKey} (Puzzle Flow Graph)`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  logger.debug(`[CACHE MISS] ${cacheKey} (Puzzle Flow Graph)`);

  try {
    const { centralPuzzle, mappedRelatedEntities } = await notionService.fetchPuzzleFlowDataStructure(puzzleId);

    const nodes = [];
    const edges = [];
    const addedNodeIds = new Set();
    // Using a simplified internal node creation for this specific graph,
    // as _createGraphNodeInternal has broader side effects and property mappings not all relevant here.

    const addNode = (entity, entityType, customProps = {}) => {
      if (!entity || !entity.id || addedNodeIds.has(entity.id)) {
        return processedFullEntities.get(entity.id); // Return existing if already processed by _createGraphNodeInternal
      }

      const node = {
        id: entity.id,
        name: entity.name || entity.puzzle || entity.description || `Unnamed ${entityType}`,
        type: entityType,
        properties: {
          ...(entity.timing && { timing: entity.timing }),
          ...(entity.ownerName && { ownerName: entity.ownerName }),
          ...(entity.storyRevealSnippet && { storyRevealSnippet: createSnippet(entity.storyRevealSnippet) }),
          ...(entity.basicType && { basicType: entity.basicType }),
          ...customProps
        }
      };
      nodes.push(node);
      addedNodeIds.add(entity.id);
      return node;
    };

    const addEdge = (sourceNode, targetNode, label, type, customData = {}) => {
      if (!sourceNode || !targetNode) {
        return;
      }
      edges.push({
        id: `edge-${sourceNode.id}-${targetNode.id}-${type}-${Math.random().toString(16).slice(2,8)}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: label, // simple label
        data: {
          shortLabel: label, // concise label for on-path
          contextualLabel: `${sourceNode.name} (${sourceNode.type}) ${label} ${targetNode.name} (${targetNode.type})`,
          type: type, // e.g., REQUIRES, REWARDS
          ...customData
        }
      });
    };

    // Add central puzzle node
    const centralPuzzleNode = addNode(centralPuzzle, 'Puzzle', {
      timing: centralPuzzle.timing,
      ownerName: centralPuzzle.owner?.[0]?.name, // Assuming owner is an array
      storyRevealSnippet: createSnippet(centralPuzzle.storyReveals)
    });

    // Process related entities
    (centralPuzzle.puzzleElements || []).forEach(elStub => {
      const element = mappedRelatedEntities.get(elStub.id);
      if (element) {
        const elementNode = addNode(element, 'Element', { isInput: true, basicType: element.basicType });
        addEdge(elementNode, centralPuzzleNode, 'inputTo', 'REQUIRES');
      }
    });

    (centralPuzzle.rewards || []).forEach(elStub => {
      const element = mappedRelatedEntities.get(elStub.id);
      if (element) {
        const elementNode = addNode(element, 'Element', { isOutput: true, basicType: element.basicType });
        addEdge(centralPuzzleNode, elementNode, 'rewards', 'REWARDS');
      }
    });

    (centralPuzzle.lockedItem || []).forEach(elStub => {
      const element = mappedRelatedEntities.get(elStub.id);
      if (element) {
        const elementNode = addNode(element, 'Element', { isOutput: true, basicType: element.basicType, isLockedItem: true });
        addEdge(centralPuzzleNode, elementNode, 'unlocksItem', 'UNLOCKS_ITEM');
      }
    });

    (centralPuzzle.parentItem || []).forEach(parentPzStub => {
      const parentPuzzle = mappedRelatedEntities.get(parentPzStub.id);
      if (parentPuzzle) {
        const parentPuzzleNode = addNode(parentPuzzle, 'Puzzle', {timing: parentPuzzle.timing, ownerName: parentPuzzle.owner?.[0]?.name});
        addEdge(parentPuzzleNode, centralPuzzleNode, 'unlocks', 'UNLOCKS_PUZZLE');
      }
    });

    (centralPuzzle.subPuzzles || []).forEach(subPzStub => {
      const subPuzzle = mappedRelatedEntities.get(subPzStub.id);
      if (subPuzzle) {
        const subPuzzleNode = addNode(subPuzzle, 'Puzzle', {timing: subPuzzle.timing, ownerName: subPuzzle.owner?.[0]?.name});
        addEdge(centralPuzzleNode, subPuzzleNode, 'leadsTo', 'LEADS_TO_PUZZLE');
      }
    });

    (centralPuzzle.owner || []).forEach(ownerStub => {
      const owner = mappedRelatedEntities.get(ownerStub.id);
      if(owner) {
        const ownerNode = addNode(owner, 'Character'); // Add minimal character props if needed
        addEdge(ownerNode, centralPuzzleNode, 'owns', 'OWNS_PUZZLE');
      }
    });

    const graphData = {
      center: { // Provide a center-like structure for consistency if frontend expects it
        id: centralPuzzle.id,
        name: centralPuzzle.puzzle,
        type: 'Puzzle',
        properties: centralPuzzle // Full mapped properties of the central puzzle
      },
      nodes,
      edges
    };

    notionCache.set(cacheKey, graphData);
    logger.debug(`[CACHE SET] ${cacheKey} (Puzzle Flow Graph for ${centralPuzzle.puzzle})`);
    setCacheHeaders(res);
    res.json(graphData);

  } catch (error) {
    logger.error(`Error generating puzzle flow graph for ID ${puzzleId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to generate puzzle flow graph' });
    }
  }
});

const getCharactersWithWarnings = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('characters-with-warnings-v2');
  const cachedData = notionCache.get(cacheKey);
  if (cachedData) {
    logger.debug(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  logger.debug(`[CACHE MISS] ${cacheKey}`);

  const notionCharacters = await notionService.getCharacters(); // Get all characters
  const mappedCharacters = await Promise.all(
    notionCharacters.map(character => propertyMapper.mapCharacterWithNames(character, notionService))
  );

  const charactersWithWarnings = [];
  for (const character of mappedCharacters) {
    if (character.error) {
      continue;
    } // Skip if there was an error mapping this character

    const warnings = [];

    // Check if character has no elements (empty inventory/relationships)
    if (!character.elements || character.elements.length === 0) {
      warnings.push({
        warningType: 'NoElements',
        message: 'Character has no associated elements or inventory items.'
      });
    }

    // Check if character owns no puzzles
    if (!character.ownedPuzzles || character.ownedPuzzles.length === 0) {
      warnings.push({
        warningType: 'NoOwnedPuzzles',
        message: 'Character does not own any puzzles.'
      });
    }

    // Check if character has no narrative threads
    if (!character.narrativeThreads || character.narrativeThreads.length === 0) {
      warnings.push({
        warningType: 'NoNarrativeThreads',
        message: 'Character is not part of any narrative threads.'
      });
    }

    // Check if character has no description
    if (!character.description || character.description.trim() === '') {
      warnings.push({
        warningType: 'NoDescription',
        message: 'Character has no description.'
      });
    }

    if (warnings.length > 0) {
      charactersWithWarnings.push({
        id: character.id,
        name: character.name,
        type: 'Character',
        warnings,
        // Include key properties for display
        description: character.description,
        location: character.location,
        status: character.status
      });
    }
  }

  notionCache.set(cacheKey, charactersWithWarnings);
  logger.debug(`[CACHE SET] ${cacheKey} - Found ${charactersWithWarnings.length} characters with warnings.`);
  setCacheHeaders(res);
  res.json(charactersWithWarnings);
});

module.exports = {
  getCharacters,
  getCharactersWithSociogramData,
  getCharacterById,
  getCharacterGraph,
  getTimelineEvents,
  getTimelineEventsList,
  getTimelineEventById,
  getTimelineGraph,
  getPuzzles,
  getPuzzleById,
  getPuzzleGraph,
  getPuzzleFlow,
  getPuzzleFlowGraph,
  getElements,
  getElementById,
  getElementGraph,
  getDatabasesMetadata,
  getGameConstants,
  globalSearch,
  clearCache,
  getPuzzlesWithWarnings,
  getElementsWithWarnings,
  getCharactersWithWarnings,
  getAllUniqueNarrativeThreads
};
