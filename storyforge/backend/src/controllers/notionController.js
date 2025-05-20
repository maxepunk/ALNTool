const notionService = require('../services/notionService');
const propertyMapper = require('../utils/notionPropertyMapper');
const { notionCache, makeCacheKey } = require('../services/notionService');

/**
 * Creates a short snippet from text.
 * @param {string} text The text to snippet.
 * @param {number} maxLength The maximum length of the snippet.
 * @returns {string} The generated snippet.
 */
function createSnippet(text, maxLength = 150) {
  if (!text) return '';
  text = String(text);
  if (text.length <= maxLength) return text;
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
  const filters = Object.entries(query)
    .filter(([key, value]) => propertyMap[key] && value)
    .map(([key, value]) => ({
      property: propertyMap[key],
      select: { equals: value },
    }));
  if (filters.length === 0) return undefined;
  return filters.length === 1 ? filters[0] : { and: filters };
}

const getCharacters = catchAsync(async (req, res) => {
  const propertyMap = { type: 'Type', tier: 'Tier' };
  const filter = buildNotionFilter(req.query, propertyMap);
  const notionCharacters = await notionService.getCharacters(filter);
  const characters = await Promise.all(
    notionCharacters.map(character => propertyMapper.mapCharacterWithNames(character, notionService))
  );
  setCacheHeaders(res);
  res.json(characters);
});

const getCharacterById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cacheKey = makeCacheKey('mapped-character', { id });
  const cachedMappedCharacter = notionCache.get(cacheKey);
  if (cachedMappedCharacter) {
    console.log(`[CACHE HIT] ${cacheKey} (mapped character)`);
    setCacheHeaders(res);
    return res.json(cachedMappedCharacter);
  }
  console.log(`[CACHE MISS] ${cacheKey} (mapped character)`);
  const characterPage = await notionService.getPage(id);
  if (!characterPage) {
    return res.status(404).json({ error: 'Character not found' });
  }
  const mappedCharacter = await propertyMapper.mapCharacterWithNames(characterPage, notionService);
  if (mappedCharacter && !mappedCharacter.error) {
    notionCache.set(cacheKey, mappedCharacter);
    console.log(`[CACHE SET] ${cacheKey} (mapped character)`);
  }
  setCacheHeaders(res);
  res.json(mappedCharacter);
});

const getCharacterGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const depth = parseInt(req.query.depth || '1', 10);
  const cacheKey = makeCacheKey('graph-character-v3', { id, depth });
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }
  const page = await notionService.getPage(id);
  if (!page) return res.status(404).json({ error: 'Character not found' });
  const charData = await propertyMapper.mapCharacterWithNames(page, notionService);
  const nodes = [];
  const edges = [];
  const addedNodeIds = new Set();
  const processedFullEntities = new Map();
  const centerNodeData = _createGraphNodeInternal(charData, 'Character', nodes, addedNodeIds, processedFullEntities);
  const firstDegreeIds = new Set();
  (charData.events || []).forEach(e => firstDegreeIds.add(e.id));
  (charData.puzzles || []).forEach(p => firstDegreeIds.add(p.id));
  (charData.ownedElements || []).forEach(el => firstDegreeIds.add(el.id));
  (charData.associatedElements || []).forEach(el => firstDegreeIds.add(el.id));
  const firstDegreePageObjects = await notionService.getPagesByIds(Array.from(firstDegreeIds));
  const mappedFirstDegreeEntities = new Map();
  for (const pageObj of firstDegreePageObjects) {
    if (!pageObj || !pageObj.id) continue;
    let mappedEntity;
    if ((charData.events || []).find(e => e.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapTimelineEventWithNames(pageObj, notionService);
      if(mappedEntity && !mappedEntity.error) mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: 'Timeline' });
    } else if ((charData.puzzles || []).find(p => p.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapPuzzleWithNames(pageObj, notionService);
      if(mappedEntity && !mappedEntity.error) mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: 'Puzzle' });
    } else if ((charData.ownedElements || []).find(el => el.id === pageObj.id) || (charData.associatedElements || []).find(el => el.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapElementWithNames(pageObj, notionService);
      if(mappedEntity && !mappedEntity.error) mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: 'Element' });
    }
  }
  (charData.ownedElements || []).forEach(elStub => {
    const fullElData = mappedFirstDegreeEntities.get(elStub.id);
    if (fullElData) { const elNodeData = _createGraphNodeInternal(fullElData, fullElData._inferredType || 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, elNodeData, 'Owns', edges); }
  });
  (charData.associatedElements || []).forEach(elStub => {
    const fullElData = mappedFirstDegreeEntities.get(elStub.id);
    if (fullElData) { const elNodeData = _createGraphNodeInternal(fullElData, fullElData._inferredType || 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, elNodeData, 'Associated', edges); }
  });
  (charData.puzzles || []).forEach(pzStub => {
    const fullPzData = mappedFirstDegreeEntities.get(pzStub.id);
    if (fullPzData) { const pzNodeData = _createGraphNodeInternal(fullPzData, fullPzData._inferredType || 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, pzNodeData, 'Involved In (Puzzle)', edges); }
  });
  (charData.events || []).forEach(evStub => {
    const fullEvData = mappedFirstDegreeEntities.get(evStub.id);
    if (fullEvData) { const evNodeData = _createGraphNodeInternal(fullEvData, fullEvData._inferredType || 'Timeline', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, evNodeData, 'Participates In (Event)', edges); }
  });
  if (depth >= 2) {
    for (const [id, firstDegreeEntity] of mappedFirstDegreeEntities.entries()) {
      const firstDegreeNodeData = processedFullEntities.get(id);
      if (!firstDegreeNodeData) continue;
      switch (firstDegreeEntity._inferredType) {
        case 'Puzzle':
          (firstDegreeEntity.puzzleElements || []).forEach(async elStub => {
            let fullElData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if (!fullElData || !fullElData.basicType) { 
                const elPage = await notionService.getPage(elStub.id);
                if(elPage) fullElData = await propertyMapper.mapElementWithNames(elPage, notionService);
            }
            if(fullElData) {const elNodeData = _createGraphNodeInternal(fullElData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(elNodeData, firstDegreeNodeData, 'Required For', edges);}
          });
          (firstDegreeEntity.rewards || []).forEach(async elStub => {
            let fullElData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if (!fullElData || !fullElData.basicType) {
                const elPage = await notionService.getPage(elStub.id);
                if(elPage) fullElData = await propertyMapper.mapElementWithNames(elPage, notionService);
            }
            if(fullElData) {const elNodeData = _createGraphNodeInternal(fullElData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, elNodeData, 'Rewards', edges);}
          });
           if (firstDegreeEntity.owner && firstDegreeEntity.owner.length > 0) {
             const ownerStub = firstDegreeEntity.owner[0];
             let fullOwnerData = mappedFirstDegreeEntities.get(ownerStub.id) || processedFullEntities.get(ownerStub.id);
             if(!fullOwnerData || !fullOwnerData.tier) {
                const ownerPage = await notionService.getPage(ownerStub.id);
                if(ownerPage) fullOwnerData = await propertyMapper.mapCharacterWithNames(ownerPage, notionService);
             }
            if(fullOwnerData) {const ownerNodeData = _createGraphNodeInternal(fullOwnerData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(ownerNodeData, firstDegreeNodeData, 'Owns', edges);}
           }
          break;
        case 'Element':
          (firstDegreeEntity.requiredForPuzzle || []).forEach(async pzStub => {
            let fullPzData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullPzData || !fullPzData.timing) {
                const pzPage = await notionService.getPage(pzStub.id);
                if(pzPage) fullPzData = await propertyMapper.mapPuzzleWithNames(pzPage, notionService);
            }
            if(fullPzData) {const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, pzNodeData, 'Required For', edges);}
          });
          (firstDegreeEntity.rewardedByPuzzle || []).forEach(async pzStub => {
            let fullPzData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullPzData || !fullPzData.timing) {
                const pzPage = await notionService.getPage(pzStub.id);
                if(pzPage) fullPzData = await propertyMapper.mapPuzzleWithNames(pzPage, notionService);
            }
           if(fullPzData) { const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(pzNodeData, firstDegreeNodeData, 'Rewards', edges);}
          });
          if (firstDegreeEntity.owner && firstDegreeEntity.owner.length > 0) {
            const ownerStub = firstDegreeEntity.owner[0];
            let fullOwnerData = mappedFirstDegreeEntities.get(ownerStub.id) || processedFullEntities.get(ownerStub.id);
            if(!fullOwnerData || !fullOwnerData.tier) {
               const ownerPage = await notionService.getPage(ownerStub.id);
               if(ownerPage) fullOwnerData = await propertyMapper.mapCharacterWithNames(ownerPage, notionService);
            }
           if(fullOwnerData) {const ownerNodeData = _createGraphNodeInternal(fullOwnerData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(ownerNodeData, firstDegreeNodeData, 'Owned By', edges);}
          }
          break;
        case 'Timeline':
          (firstDegreeEntity.memoryEvidence || []).forEach(async elStub => {
            let fullElData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if (!fullElData || !fullElData.basicType) {
                const elPage = await notionService.getPage(elStub.id);
                if(elPage) fullElData = await propertyMapper.mapElementWithNames(elPage, notionService);
            }
            if(fullElData) {const elNodeData = _createGraphNodeInternal(fullElData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(elNodeData, firstDegreeNodeData, 'Evidence For (Event)', edges);}
          });
          (firstDegreeEntity.charactersInvolved || []).filter(c => c.id !== charData.id).forEach(async chStub => {
            let fullChData = mappedFirstDegreeEntities.get(chStub.id) || processedFullEntities.get(chStub.id);
             if(!fullChData || !fullChData.tier) {
                const chPage = await notionService.getPage(chStub.id);
                if(chPage) fullChData = await propertyMapper.mapCharacterWithNames(chPage, notionService);
             }
            if(fullChData) {const chNodeData = _createGraphNodeInternal(fullChData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, chNodeData, 'Involves', edges);}
          });
          break;
      }
    }
  }
  const graph = { center: charData, nodes, edges };
  notionCache.set(cacheKey, graph);
  console.log(`[CACHE SET] ${cacheKey}`);
  setCacheHeaders(res);
  res.json(graph);
});

const getTimelineEvents = catchAsync(async (req, res) => {
  const propertyMap = { memType: 'mem type', date: 'Date' };
  const filter = buildNotionFilter(req.query, propertyMap);
  const notionEvents = await notionService.getTimelineEvents(filter);
  const events = await Promise.all(
    notionEvents.map(event => propertyMapper.mapTimelineEventWithNames(event, notionService))
  );
  setCacheHeaders(res);
  res.json(events);
});

const getTimelineEventById = catchAsync(async (req, res) => {
  const { id } = req.params;
  const cacheKey = makeCacheKey('mapped-timelineevent', { id });
  const cachedMappedEvent = notionCache.get(cacheKey);
  if (cachedMappedEvent) {
    console.log(`[CACHE HIT] ${cacheKey} (mapped event)`);
    setCacheHeaders(res);
    return res.json(cachedMappedEvent);
  }
  console.log(`[CACHE MISS] ${cacheKey} (mapped event)`);
  const eventPage = await notionService.getPage(id);
  if (!eventPage) {
    return res.status(404).json({ error: 'Timeline event not found' });
  }
  const mappedEvent = await propertyMapper.mapTimelineEventWithNames(eventPage, notionService);
  if (mappedEvent && !mappedEvent.error) {
    notionCache.set(cacheKey, mappedEvent);
    console.log(`[CACHE SET] ${cacheKey} (mapped event)`);
  }
  setCacheHeaders(res);
  res.json(mappedEvent);
});

const getPuzzles = catchAsync(async (req, res) => {
  const propertyMap = { timing: 'Timing' };
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
  const cacheKey = makeCacheKey('mapped-puzzle', { id });
  const cachedMappedPuzzle = notionCache.get(cacheKey);
  if (cachedMappedPuzzle) {
    console.log(`[CACHE HIT] ${cacheKey} (mapped puzzle)`);
    setCacheHeaders(res);
    return res.json(cachedMappedPuzzle);
  }
  console.log(`[CACHE MISS] ${cacheKey} (mapped puzzle)`);
  const puzzlePage = await notionService.getPage(id);
  if (!puzzlePage) {
    return res.status(404).json({ error: 'Puzzle not found' });
  }
  const mappedPuzzle = await propertyMapper.mapPuzzleWithNames(puzzlePage, notionService);
  if (mappedPuzzle && !mappedPuzzle.error) {
    notionCache.set(cacheKey, mappedPuzzle);
    console.log(`[CACHE SET] ${cacheKey} (mapped puzzle)`);
  }
  setCacheHeaders(res);
  res.json(mappedPuzzle);
});

const getElements = catchAsync(async (req, res) => {
  const propertyMap = { type: 'Basic Type', status: 'Status', firstAvailable: 'First Available' };
  const filter = buildNotionFilter(req.query, propertyMap);
  const notionElements = await notionService.getElements(filter);
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
    console.log(`[CACHE HIT] ${cacheKey} (mapped element)`);
    setCacheHeaders(res);
    return res.json(cachedMappedElement);
  }
  console.log(`[CACHE MISS] ${cacheKey} (mapped element)`);
  const elementPage = await notionService.getPage(id);
  if (!elementPage) {
    return res.status(404).json({ error: 'Element not found' });
  }
  const mappedElement = await propertyMapper.mapElementWithNames(elementPage, notionService);
  if (mappedElement && !mappedElement.error) {
    notionCache.set(cacheKey, mappedElement);
    console.log(`[CACHE SET] ${cacheKey} (mapped element)`);
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
      elements: notionService.DB_IDS.ELEMENTS,
    },
    elementTypes: [
      "Prop", 
      "Set Dressing", 
      "Memory Token Video", 
      "Character Sheet"
    ],
  });
});

// Global search endpoint (Refactored)
const globalSearch = catchAsync(async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing search query' });

  const dbSearchConfigs = {
    characters: {
      serviceFn: notionService.getCharacters,
      titleProperty: 'Name',
      mapperFn: propertyMapper.mapCharacterWithNames,
    },
    timeline: {
      serviceFn: notionService.getTimelineEvents,
      titleProperty: 'Description',
      mapperFn: propertyMapper.mapTimelineEventWithNames, // Corrected mapper
    },
    puzzles: {
      serviceFn: notionService.getPuzzles,
      titleProperty: 'Puzzle',
      mapperFn: propertyMapper.mapPuzzleWithNames,
    },
    elements: {
      serviceFn: notionService.getElements,
      titleProperty: 'Name',
      mapperFn: propertyMapper.mapElementWithNames,
    },
  };

  const results = {};
  const searchPromises = Object.entries(dbSearchConfigs).map(async ([dbKey, config]) => {
    const filter = {
      property: config.titleProperty,
      title: { contains: q }, 
    };
    try {
      const items = await config.serviceFn(filter);
      results[dbKey] = await Promise.all(
        items.map(item => config.mapperFn(item, notionService))
      );
    } catch (e) {
      console.error(`Error searching in ${dbKey}:`, e);
      results[dbKey] = [];
    }
  });

  await Promise.all(searchPromises);
  res.json(results);
});

const clearCache = catchAsync(async (req, res) => {
  notionService.clearCache();
  res.json({ message: 'Cache cleared' });
});

function setCacheHeaders(res, seconds = 300) {
  res.set('Cache-Control', `public, max-age=${seconds}`);
}

const getElementGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const depth = parseInt(req.query.depth || '1', 10);
  const cacheKey = makeCacheKey('graph-element-v3', { id, depth });
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }
  const page = await notionService.getPage(id);
  if (!page) return res.status(404).json({ error: 'Element not found' });
  const elData = await propertyMapper.mapElementWithNames(page, notionService);
  const nodes = [];
  const edges = [];
  const addedNodeIds = new Set();
  const processedFullEntities = new Map();
  const centerNodeData = _createGraphNodeInternal(elData, 'Element', nodes, addedNodeIds, processedFullEntities);
  const firstDegreeIds = new Set();
  (elData.owner || []).forEach(s => firstDegreeIds.add(s.id));
  (elData.associatedCharacters || []).forEach(s => firstDegreeIds.add(s.id));
  (elData.timelineEvent || []).forEach(s => firstDegreeIds.add(s.id));
  (elData.requiredForPuzzle || []).forEach(s => firstDegreeIds.add(s.id));
  (elData.rewardedByPuzzle || []).forEach(s => firstDegreeIds.add(s.id));
  (elData.containerPuzzle || []).forEach(s => firstDegreeIds.add(s.id));
  (elData.container || []).forEach(s => firstDegreeIds.add(s.id));
  (elData.contents || []).forEach(s => firstDegreeIds.add(s.id));
  const firstDegreePageObjects = await notionService.getPagesByIds(Array.from(firstDegreeIds));
  const mappedFirstDegreeEntities = new Map();
  for (const pageObj of firstDegreePageObjects) {
    if (!pageObj || !pageObj.id) continue;
    let mappedEntity, inferredType;
    if ((elData.owner || []).find(s => s.id === pageObj.id) || (elData.associatedCharacters || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapCharacterWithNames(pageObj, notionService); inferredType = 'Character';
    } else if ((elData.timelineEvent || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapTimelineEventWithNames(pageObj, notionService); inferredType = 'Timeline';
    } else if ((elData.requiredForPuzzle || []).find(s => s.id === pageObj.id) || (elData.rewardedByPuzzle || []).find(s => s.id === pageObj.id) || (elData.containerPuzzle || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapPuzzleWithNames(pageObj, notionService); inferredType = 'Puzzle';
    } else if ((elData.container || []).find(s => s.id === pageObj.id) || (elData.contents || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapElementWithNames(pageObj, notionService); inferredType = 'Element';
    }
    if (mappedEntity && !mappedEntity.error) mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: inferredType });
  }
  (elData.owner || []).forEach(chStub => { 
    const fullChData = mappedFirstDegreeEntities.get(chStub.id);
    if(fullChData) { const chNodeData = _createGraphNodeInternal(fullChData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(chNodeData, centerNodeData, 'Owns Element', edges); }
  });
  (elData.associatedCharacters || []).forEach(chStub => {
    const fullChData = mappedFirstDegreeEntities.get(chStub.id);
    if(fullChData) { const chNodeData = _createGraphNodeInternal(fullChData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, chNodeData, 'Associated With (Character)', edges); }
  });
  (elData.timelineEvent || []).forEach(evStub => {
    const fullEvData = mappedFirstDegreeEntities.get(evStub.id);
    if(fullEvData) { const evNodeData = _createGraphNodeInternal(fullEvData, 'Timeline', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, evNodeData, 'Appears In (Event)', edges); }
  });
  (elData.requiredForPuzzle || []).forEach(pzStub => {
    const fullPzData = mappedFirstDegreeEntities.get(pzStub.id);
    if(fullPzData) { const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, pzNodeData, 'Required For (Puzzle)', edges); }
  });
  (elData.rewardedByPuzzle || []).forEach(pzStub => {
    const fullPzData = mappedFirstDegreeEntities.get(pzStub.id);
    if(fullPzData) { const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(pzNodeData, centerNodeData, 'Reward From (Puzzle)', edges); }
  });
  (elData.containerPuzzle || []).forEach(pzStub => {
    const fullPzData = mappedFirstDegreeEntities.get(pzStub.id);
    if(fullPzData) { const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(pzNodeData, centerNodeData, 'Locked In (Element is in Puzzle container)', edges); }
  });
  (elData.container || []).forEach(containerStub => { 
    const fullContainerData = mappedFirstDegreeEntities.get(containerStub.id);
    if(fullContainerData) { const ctnNodeData = _createGraphNodeInternal(fullContainerData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(ctnNodeData, centerNodeData, 'Contains (Element is inside)', edges); }
  });
  (elData.contents || []).forEach(contentStub => {
    const fullContentData = mappedFirstDegreeEntities.get(contentStub.id);
    if(fullContentData) { const contNodeData = _createGraphNodeInternal(fullContentData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, contNodeData, 'Contains (Element is container)', edges); }
  });
  if (depth >= 2) {
    for (const [id, firstDegreeEntity] of mappedFirstDegreeEntities.entries()) {
      const firstDegreeNodeData = processedFullEntities.get(id);
      if (!firstDegreeNodeData) continue;
      switch (firstDegreeEntity._inferredType) {
        case 'Puzzle':
          (firstDegreeEntity.owner || []).forEach(async chStub => {
            let fullData = mappedFirstDegreeEntities.get(chStub.id) || processedFullEntities.get(chStub.id);
            if(!fullData || !fullData.tier) { const page = await notionService.getPage(chStub.id); if(page) fullData = await propertyMapper.mapCharacterWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, firstDegreeNodeData, 'Owned By', edges); }
          });
          (firstDegreeEntity.puzzleElements || []).filter(e => e.id !== elData.id).forEach(async elStub => {
            let fullData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if(!fullData || !fullData.basicType) { const page = await notionService.getPage(elStub.id); if(page) fullData = await propertyMapper.mapElementWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Required For', edges); }
          });
          (firstDegreeEntity.rewards || []).filter(e => e.id !== elData.id).forEach(async elStub => {
            let fullData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if(!fullData || !fullData.basicType) { const page = await notionService.getPage(elStub.id); if(page) fullData = await propertyMapper.mapElementWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Rewards', edges); }
          });
          break;
        case 'Character':
          (firstDegreeEntity.puzzles || []).forEach(async pzStub => {
            let fullData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullData || !fullData.timing) { const page = await notionService.getPage(pzStub.id); if(page) fullData = await propertyMapper.mapPuzzleWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Owns', edges); }
          });
          (firstDegreeEntity.ownedElements || []).forEach(async elStub => {
            let fullData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if(!fullData || !fullData.basicType) { const page = await notionService.getPage(elStub.id); if(page) fullData = await propertyMapper.mapElementWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Owns', edges); }
          });
          break;
      }
    }
  }
  const graph = { center: elData, nodes, edges };
  notionCache.set(cacheKey, graph);
  console.log(`[CACHE SET] ${cacheKey}`);
  setCacheHeaders(res);
  res.json(graph);
});

const getPuzzleGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const depth = parseInt(req.query.depth || '1', 10);
  const cacheKey = makeCacheKey('graph-puzzle-v3', { id, depth });
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }
  const page = await notionService.getPage(id);
  if (!page) return res.status(404).json({ error: 'Puzzle not found' });
  const puzzleData = await propertyMapper.mapPuzzleWithNames(page, notionService);
  const nodes = [];
  const edges = [];
  const addedNodeIds = new Set();
  const processedFullEntities = new Map();
  const centerNodeData = _createGraphNodeInternal(puzzleData, 'Puzzle', nodes, addedNodeIds, processedFullEntities);
  const firstDegreeIds = new Set();
  (puzzleData.owner || []).forEach(s => firstDegreeIds.add(s.id));
  (puzzleData.lockedItem || []).forEach(s => firstDegreeIds.add(s.id));
  (puzzleData.puzzleElements || []).forEach(s => firstDegreeIds.add(s.id));
  (puzzleData.rewards || []).forEach(s => firstDegreeIds.add(s.id));
  (puzzleData.parentItem || []).forEach(s => firstDegreeIds.add(s.id));
  (puzzleData.subPuzzles || []).forEach(s => firstDegreeIds.add(s.id));
  const firstDegreePageObjects = await notionService.getPagesByIds(Array.from(firstDegreeIds));
  const mappedFirstDegreeEntities = new Map();
  for (const pageObj of firstDegreePageObjects) {
    if (!pageObj || !pageObj.id) continue;
    let mappedEntity, inferredType;
    if ((puzzleData.owner || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapCharacterWithNames(pageObj, notionService); inferredType = 'Character';
    } else if ((puzzleData.lockedItem || []).find(s => s.id === pageObj.id) || (puzzleData.puzzleElements || []).find(s => s.id === pageObj.id) || (puzzleData.rewards || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapElementWithNames(pageObj, notionService); inferredType = 'Element';
    } else if ((puzzleData.parentItem || []).find(s => s.id === pageObj.id) || (puzzleData.subPuzzles || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapPuzzleWithNames(pageObj, notionService); inferredType = 'Puzzle';
    }
    if (mappedEntity && !mappedEntity.error) mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: inferredType });
  }
  (puzzleData.owner || []).forEach(chStub => {
    const fullData = mappedFirstDegreeEntities.get(chStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, centerNodeData, 'Owns (Puzzle)', edges); }
  });
  (puzzleData.lockedItem || []).forEach(elStub => {
    const fullData = mappedFirstDegreeEntities.get(elStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, nodeData, 'Unlocks (Item)', edges); }
  });
  (puzzleData.puzzleElements || []).forEach(elStub => {
    const fullData = mappedFirstDegreeEntities.get(elStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, centerNodeData, 'Required By (Puzzle)', edges); }
  });
  (puzzleData.rewards || []).forEach(elStub => {
    const fullData = mappedFirstDegreeEntities.get(elStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, nodeData, 'Rewards (Element)', edges); }
  });
  (puzzleData.parentItem || []).forEach(parentStub => {
    const fullData = mappedFirstDegreeEntities.get(parentStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, centerNodeData, 'Sub-Puzzle Of', edges); }
  });
  (puzzleData.subPuzzles || []).forEach(spStub => {
    const fullData = mappedFirstDegreeEntities.get(spStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, nodeData, 'Has Sub-Puzzle', edges); }
  });
  if (depth >= 2) {
    for (const [id, firstDegreeEntity] of mappedFirstDegreeEntities.entries()) {
      const firstDegreeNodeData = processedFullEntities.get(id);
      if (!firstDegreeNodeData) continue;
      switch (firstDegreeEntity._inferredType) {
        case 'Element': 
          (firstDegreeEntity.owner || []).forEach(async chStub => {
            let fullData = mappedFirstDegreeEntities.get(chStub.id) || processedFullEntities.get(chStub.id);
            if(!fullData || !fullData.tier) { const page = await notionService.getPage(chStub.id); if(page) fullData = await propertyMapper.mapCharacterWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, firstDegreeNodeData, 'Owned By', edges); }
          });
          (firstDegreeEntity.requiredForPuzzle || []).filter(p => p.id !== puzzleData.id).forEach(async pzStub => {
            let fullData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullData || !fullData.timing) { const page = await notionService.getPage(pzStub.id); if(page) fullData = await propertyMapper.mapPuzzleWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Required For', edges);}
          });
          (firstDegreeEntity.rewardedByPuzzle || []).filter(p => p.id !== puzzleData.id).forEach(async pzStub => {
            let fullData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullData || !fullData.timing) { const page = await notionService.getPage(pzStub.id); if(page) fullData = await propertyMapper.mapPuzzleWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, firstDegreeNodeData, 'Rewards', edges);}
          });
          break;
        case 'Character': 
          (firstDegreeEntity.puzzles || []).filter(p => p.id !== puzzleData.id).forEach(async pzStub => {
            let fullData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullData || !fullData.timing) { const page = await notionService.getPage(pzStub.id); if(page) fullData = await propertyMapper.mapPuzzleWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Owns', edges); }
          });
          (firstDegreeEntity.ownedElements || []).forEach(async elStub => {
            let fullData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if(!fullData || !fullData.basicType) { const page = await notionService.getPage(elStub.id); if(page) fullData = await propertyMapper.mapElementWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Owns', edges); }
          });
          break;
        case 'Puzzle': 
          (firstDegreeEntity.puzzleElements || []).forEach(async elStub => {
            let fullData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if(!fullData || !fullData.basicType) { const page = await notionService.getPage(elStub.id); if(page) fullData = await propertyMapper.mapElementWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, firstDegreeNodeData, 'Required For', edges); }
          });
           (firstDegreeEntity.rewards || []).forEach(async elStub => {
            let fullData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if(!fullData || !fullData.basicType) { const page = await notionService.getPage(elStub.id); if(page) fullData = await propertyMapper.mapElementWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Rewards', edges); }
          });
          break;
      }
    }
  }
  const graph = { center: puzzleData, nodes, edges };
  notionCache.set(cacheKey, graph);
  console.log(`[CACHE SET] ${cacheKey}`);
  setCacheHeaders(res);
  res.json(graph);
});

const getTimelineGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const depth = parseInt(req.query.depth || '1', 10);
  const cacheKey = makeCacheKey('graph-timeline-v3', { id, depth });
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }
  const page = await notionService.getPage(id);
  if (!page) return res.status(404).json({ error: 'Timeline event not found' });
  const eventData = await propertyMapper.mapTimelineEventWithNames(page, notionService);
  const nodes = [];
  const edges = [];
  const addedNodeIds = new Set();
  const processedFullEntities = new Map();
  const centerNodeData = _createGraphNodeInternal(eventData, 'Timeline', nodes, addedNodeIds, processedFullEntities);
  const firstDegreeIds = new Set();
  (eventData.charactersInvolved || []).forEach(s => firstDegreeIds.add(s.id));
  (eventData.memoryEvidence || []).forEach(s => firstDegreeIds.add(s.id));
  const firstDegreePageObjects = await notionService.getPagesByIds(Array.from(firstDegreeIds));
  const mappedFirstDegreeEntities = new Map();
  for (const pageObj of firstDegreePageObjects) {
    if (!pageObj || !pageObj.id) continue;
    let mappedEntity, inferredType;
    if ((eventData.charactersInvolved || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapCharacterWithNames(pageObj, notionService); inferredType = 'Character';
    } else if ((eventData.memoryEvidence || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapElementWithNames(pageObj, notionService); inferredType = 'Element';
    }
    if (mappedEntity && !mappedEntity.error) mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: inferredType });
  }
  (eventData.charactersInvolved || []).forEach(chStub => {
    const fullData = mappedFirstDegreeEntities.get(chStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(centerNodeData, nodeData, 'Involves (Character)', edges); }
  });
  (eventData.memoryEvidence || []).forEach(elStub => {
    const fullData = mappedFirstDegreeEntities.get(elStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, centerNodeData, 'Evidence For (Event)', edges); }
  });
  if (depth >= 2) {
    for (const [id, firstDegreeEntity] of mappedFirstDegreeEntities.entries()) {
      const firstDegreeNodeData = processedFullEntities.get(id);
      if (!firstDegreeNodeData) continue;
      switch (firstDegreeEntity._inferredType) {
        case 'Character':
          (firstDegreeEntity.events || []).filter(ev => ev.id !== eventData.id).forEach(async evStub => {
            let fullData = mappedFirstDegreeEntities.get(evStub.id) || processedFullEntities.get(evStub.id);
            if(!fullData || !fullData.dateString) { const page = await notionService.getPage(evStub.id); if(page) fullData = await propertyMapper.mapTimelineEventWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Timeline', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Participates In', edges);}
          });
          (firstDegreeEntity.puzzles || []).forEach(async pzStub => {
            let fullData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullData || !fullData.timing) { const page = await notionService.getPage(pzStub.id); if(page) fullData = await propertyMapper.mapPuzzleWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Owns', edges); }
          });
          (firstDegreeEntity.ownedElements || []).forEach(async elStub => {
            let fullData = mappedFirstDegreeEntities.get(elStub.id) || processedFullEntities.get(elStub.id);
            if(!fullData || !fullData.basicType) { const page = await notionService.getPage(elStub.id); if(page) fullData = await propertyMapper.mapElementWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Owns', edges); }
          });
          break;
        case 'Element':
          (firstDegreeEntity.owner || []).forEach(async chStub => {
            let fullData = mappedFirstDegreeEntities.get(chStub.id) || processedFullEntities.get(chStub.id);
            if(!fullData || !fullData.tier) { const page = await notionService.getPage(chStub.id); if(page) fullData = await propertyMapper.mapCharacterWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Character', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, firstDegreeNodeData, 'Owned By', edges); }
          });
          (firstDegreeEntity.requiredForPuzzle || []).forEach(async pzStub => {
            let fullData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullData || !fullData.timing) { const page = await notionService.getPage(pzStub.id); if(page) fullData = await propertyMapper.mapPuzzleWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(firstDegreeNodeData, nodeData, 'Required For', edges); }
          });
          (firstDegreeEntity.rewardedByPuzzle || []).forEach(async pzStub => {
            let fullData = mappedFirstDegreeEntities.get(pzStub.id) || processedFullEntities.get(pzStub.id);
            if(!fullData || !fullData.timing) { const page = await notionService.getPage(pzStub.id); if(page) fullData = await propertyMapper.mapPuzzleWithNames(page, notionService); }
            if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); _createGraphEdgeInternal(nodeData, firstDegreeNodeData, 'Rewards', edges); }
          });
          break;
      }
    }
  }
  const graph = { center: eventData, nodes, edges };
  notionCache.set(cacheKey, graph);
  console.log(`[CACHE SET] ${cacheKey}`);
  setCacheHeaders(res);
  res.json(graph);
});

function _createGraphNodeInternal(entityData, entityType, nodesArray, addedNodeIdsSet, processedFullEntitiesMap) {
  if (!entityData || !entityData.id) return undefined;
  if (addedNodeIdsSet.has(entityData.id)) {
    return processedFullEntitiesMap.get(entityData.id);
  }
  const commonProps = {
    id: entityData.id,
    name: entityData.name || entityData.description || entityData.puzzle, 
    type: entityType, 
    fullDescription: entityData.overview || entityData.description || entityData.logline || entityData.notes || '',
  };
  commonProps.descriptionSnippet = createSnippet(commonProps.fullDescription);
  let specificProps = {};
  switch (entityType) {
    case 'Character':
      specificProps = {
        tier: entityData.tier,
        role: entityData.type, 
        primaryActionSnippet: createSnippet(entityData.primaryAction),
      };
      break;
    case 'Puzzle':
      specificProps = {
        timing: entityData.timing,
        statusSummary: `Requires ${entityData.puzzleElements?.length || 0} elements; Rewards ${entityData.rewards?.length || 0} elements.`,
        storyRevealSnippet: createSnippet(entityData.storyReveals),
        ownerName: entityData.owner?.[0]?.name, 
        ownerId: entityData.owner?.[0]?.id,
      };
      break;
    case 'Element':
      specificProps = {
        basicType: entityData.basicType,
        status: entityData.status,
        flowSummary: `Owner: ${entityData.owner?.[0]?.name || 'N/A'}. Required for ${entityData.requiredForPuzzle?.length || 0} puzzles. Rewarded by ${entityData.rewardedByPuzzle?.length || 0} puzzles.`,
        ownerName: entityData.owner?.[0]?.name,
        ownerId: entityData.owner?.[0]?.id,
      };
      break;
    case 'Timeline':
      specificProps = {
        dateString: entityData.date, 
        participantSummary: `Involves: ${entityData.charactersInvolved?.length || 0} Characters, ${entityData.memoryEvidence?.length || 0} Elements.`,
        notesSnippet: createSnippet(entityData.notes)
      };
      break;
  }
  const finalNodeData = { ...commonProps, ...specificProps };
  nodesArray.push(finalNodeData);
  addedNodeIdsSet.add(entityData.id);
  processedFullEntitiesMap.set(entityData.id, finalNodeData); 
  return finalNodeData; 
}

function _createGraphEdgeInternal(sourceNodeData, targetNodeData, label, edgesArray) {
  if (!sourceNodeData || !targetNodeData || !sourceNodeData.id || !targetNodeData.id) return;
  let shortLabel = label;
  let refinedContextualLabel = '';
  const sourceName = sourceNodeData.name || 'Unnamed Source';
  const targetName = targetNodeData.name || 'Unnamed Target';
  const sourceType = sourceNodeData.type || 'Unknown Type';
  const targetType = targetNodeData.type || 'Unknown Type';
  switch (label) {
    case 'Owns':
      shortLabel = 'Owns';
      refinedContextualLabel = `${sourceName} (${sourceType}) owns ${targetName} (${targetType})`;
      break;
    case 'Owned By': 
      shortLabel = 'Owned By';
      refinedContextualLabel = `${sourceName} (${sourceType}) is owned by ${targetName} (${targetType})`;
      break;
    case 'Associated':
      shortLabel = 'Associated';
      refinedContextualLabel = `${sourceName} (${sourceType}) is associated with ${targetName} (${targetType})`;
      break;
    case 'Involved In (Puzzle)':
      shortLabel = 'Involved In';
      refinedContextualLabel = `${sourceName} (${sourceType}) is involved in Puzzle \"${targetName}\"`;
      break;
    case 'Participates In (Event)':
      shortLabel = 'Participates In';
      refinedContextualLabel = `${sourceName} (${sourceType}) participates in Event \"${targetName}\"`;
      break;
    case 'Required For':
      shortLabel = 'Required For';
      refinedContextualLabel = `${sourceName} (${sourceType}) is required for ${targetName} (${targetType})`;
      break;
    case 'Rewards':
      shortLabel = 'Rewards';
      refinedContextualLabel = `${sourceName} (${sourceType}) rewards ${targetName} (${targetType})`;
      break;
    case 'Owns Element': 
      shortLabel = 'Owns';
      refinedContextualLabel = `${sourceName} (${sourceType}) owns Element \"${targetName}\"`;
      break;
    case 'Associated With (Character)':
      shortLabel = 'Associated With';
      refinedContextualLabel = `${sourceName} (${sourceType}) is associated with Character \"${targetName}\"`;
      break;
    case 'Appears In (Event)':
      shortLabel = 'Appears In';
      refinedContextualLabel = `${sourceName} (${sourceType}) appears in Event \"${targetName}\"`;
      break;
    case 'Required For (Puzzle)':
      shortLabel = 'Required For';
      refinedContextualLabel = `${sourceName} (${sourceType}) is required for Puzzle \"${targetName}\"`;
      break;
    case 'Reward From (Puzzle)':
      shortLabel = 'Reward From';
      refinedContextualLabel = `${sourceName} (${sourceType}) is a reward from Puzzle \"${targetName}\"`;
      break;
    case 'Locked In (Element is in Puzzle container)':
      shortLabel = 'Locked In';
      refinedContextualLabel = `${sourceName} (${sourceType}) is locked in Puzzle \"${targetName}\" (container)`;
      break;
    case 'Contains (Element is inside)': 
      shortLabel = 'Inside';
      refinedContextualLabel = `${targetName} (${targetType}) contains ${sourceName} (${sourceType})`;
      break;
    case 'Contains (Element is container)': 
      shortLabel = 'Contains';
      refinedContextualLabel = `${sourceName} (${sourceType}) contains ${targetName} (${targetType})`;
      break;
    case 'Owns (Puzzle)': 
      shortLabel = 'Owns';
      refinedContextualLabel = `${sourceName} (${sourceType}) owns Puzzle \"${targetName}\"`;
      break;
    case 'Unlocks (Item)': 
      shortLabel = 'Unlocks';
      refinedContextualLabel = `${sourceName} (${sourceType}) unlocks ${targetName} (${targetType})`;
      break;
    case 'Required By (Puzzle)': 
      shortLabel = 'Required By';
      refinedContextualLabel = `${sourceName} (${sourceType}) is required by Puzzle \"${targetName}\"`;
      break;
    case 'Rewards (Element)': 
      shortLabel = 'Rewards';
      refinedContextualLabel = `${sourceName} (${sourceType}) rewards Element \"${targetName}\"`;
      break;
    case 'Sub-Puzzle Of': 
      shortLabel = 'Sub-Puzzle Of';
      refinedContextualLabel = `${targetName} (${targetType}) is a sub-puzzle of ${sourceName} (${sourceType})`;
      break;
    case 'Has Sub-Puzzle': 
      shortLabel = 'Has Sub-Puzzle';
      refinedContextualLabel = `${sourceName} (${sourceType}) has sub-puzzle ${targetName} (${targetType})`;
      break;
    case 'Involves (Character)': 
      shortLabel = 'Involves';
      refinedContextualLabel = `${sourceName} (${sourceType}) involves Character \"${targetName}\"`;
      break;
    case 'Evidence For (Event)': 
      shortLabel = 'Evidence For';
      refinedContextualLabel = `${sourceName} (${sourceType}) is evidence for Event \"${targetName}\"`;
      break;
    case 'Participates In': 
      shortLabel = 'Participates In';
      refinedContextualLabel = `${sourceName} (${sourceType}) participates in ${targetName} (${targetType})`;
      break;
    default:
      shortLabel = label.replace(/\s*\(.*\)\s*/g, '').trim(); 
      if (!shortLabel) shortLabel = 'Related'; 
      refinedContextualLabel = `${sourceName} (${sourceType}) ${label.toLowerCase()} ${targetName} (${targetType})`;
  }
  edgesArray.push({
    source: sourceNodeData.id,
    target: targetNodeData.id,
    label: label, 
    data: { 
      sourceNodeName: sourceName,
      sourceNodeType: sourceType,
      targetNodeName: targetName,
      targetNodeType: targetType,
      contextualLabel: refinedContextualLabel, 
      shortLabel: shortLabel 
    }
  });
}

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
  getTimelineGraph,
}; 