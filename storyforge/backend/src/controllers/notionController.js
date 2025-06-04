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
  const filterConditions = [];
  for (const [key, value] of Object.entries(query)) {
    if (propertyMap[key] && value) {
      if (key === 'narrativeThreadContains') { // Special handling for multi-select contains
        filterConditions.push({
          property: propertyMap[key],
          multi_select: { contains: value },
        });
      } else { // Default to select equals
        filterConditions.push({
          property: propertyMap[key],
          select: { equals: value },
        });
      }
    }
  }
  if (filterConditions.length === 0) return undefined;
  return filterConditions.length === 1 ? filterConditions[0] : { and: filterConditions };
}

const getCharacters = catchAsync(async (req, res) => {
  const propertyMap = { type: 'Type', tier: 'Tier', narrativeThreadContains: 'Narrative Threads' };
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
  const cacheKey = makeCacheKey('mapped-character-v1.1-sociogram', { id }); // Updated cache key
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
  const cacheKey = makeCacheKey('graph-character-v3.2', { id, depth }); // Cache key updated
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }
  console.log(`[CACHE MISS] ${cacheKey}`);
  const page = await notionService.getPage(id);
  if (!page) return res.status(404).json({ error: 'Character not found' });

  const charData = await propertyMapper.mapCharacterWithNames(page, notionService);
  if (charData.error) {
    console.error(`[getCharacterGraph] Error mapping central character ${id}: ${charData.error}`);
    return res.status(500).json({ error: 'Failed to map central character data.'});
  }

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
    let inferredType = 'Unknown';
    if ((charData.events || []).find(e => e.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapTimelineEventWithNames(pageObj, notionService);
      inferredType = 'Timeline';
    } else if ((charData.puzzles || []).find(p => p.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapPuzzleWithNames(pageObj, notionService);
      inferredType = 'Puzzle';
    } else if ((charData.ownedElements || []).find(el => el.id === pageObj.id) || (charData.associatedElements || []).find(el => el.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapElementWithNames(pageObj, notionService);
      inferredType = 'Element';
    }
    if (mappedEntity && !mappedEntity.error) {
      mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: inferredType });
    } else if (mappedEntity && mappedEntity.error) {
      console.warn(`[getCharacterGraph] Error mapping 1st degree entity ${pageObj.id}: ${mappedEntity.error}`);
    }
  }

  const allContentItemIdsToFetch = new Set();
  const containerToContentsMap = new Map(); 

  const potentialContainersStubs = [
    ...(charData.ownedElements || []),
    ...(charData.associatedElements || [])
  ];

  for (const elStub of potentialContainersStubs) {
      const fullElData = mappedFirstDegreeEntities.get(elStub.id);
      if (fullElData && fullElData._inferredType === 'Element' && fullElData.contents && fullElData.contents.length > 0) {
          containerToContentsMap.set(fullElData.id, fullElData.contents); 
          fullElData.contents.forEach(ci => { 
              if (!mappedFirstDegreeEntities.has(ci.id) && !processedFullEntities.has(ci.id)) {
                  allContentItemIdsToFetch.add(ci.id);
              }
          });
      }
  }
   
  const mappedContentItems = new Map(); 
  if (allContentItemIdsToFetch.size > 0) {
      const contentItemPages = await notionService.getPagesByIds(Array.from(allContentItemIdsToFetch));
      for (const contentPage of contentItemPages) {
          if (contentPage && contentPage.id) {
              const mappedContent = await propertyMapper.mapElementWithNames(contentPage, notionService);
              if (mappedContent && !mappedContent.error) {
                  mappedContentItems.set(mappedContent.id, { ...mappedContent, _inferredType: 'Element' });
              } else if (mappedContent && mappedContent.error) {
                  console.warn(`[getCharacterGraph] Error mapping content item ${contentPage.id}: ${mappedContent.error}`);
              }
          }
      }
  }

  const _processCharacterElementLink = (elStub, relationshipTypeToCharacter) => {
      const fullElData = mappedFirstDegreeEntities.get(elStub.id); 
      
      if (fullElData && fullElData._inferredType === 'Element') {
          const elNodeData = _createGraphNodeInternal(fullElData, 'Element', nodes, addedNodeIds, processedFullEntities);
          if (elNodeData && centerNodeData) { 
              _createGraphEdgeInternal(centerNodeData, elNodeData, relationshipTypeToCharacter, edges);

              const contentItemStubs = containerToContentsMap.get(fullElData.id); 
              if (contentItemStubs && contentItemStubs.length > 0) {
                  contentItemStubs.forEach(contentItemStub => { 
                      let fullContentItemData = processedFullEntities.get(contentItemStub.id) || 
                                                mappedFirstDegreeEntities.get(contentItemStub.id) || 
                                                mappedContentItems.get(contentItemStub.id);
                       
                      if (fullContentItemData) {
                          if (!fullContentItemData._inferredType) fullContentItemData._inferredType = 'Element'; 
                          
                          const contentNodeData = _createGraphNodeInternal(fullContentItemData, fullContentItemData._inferredType, nodes, addedNodeIds, processedFullEntities);
                          if (contentNodeData) { 
                              _createGraphEdgeInternal(elNodeData, contentNodeData, 'Contains (Element is container)', edges);
                          }
                      } else {
                          console.warn(`[getCharacterGraph] Full data for content item ${contentItemStub.id} (name: ${contentItemStub.name}) not found for container ${fullElData.name} (${fullElData.id}).`);
                      }
                  });
              }
          }
      }
  };

  (charData.ownedElements || []).forEach(elStub => _processCharacterElementLink(elStub, 'Owns'));
  (charData.associatedElements || []).forEach(elStub => _processCharacterElementLink(elStub, 'Associated'));

  (charData.puzzles || []).forEach(pzStub => {
    const fullPzData = mappedFirstDegreeEntities.get(pzStub.id);
    if (fullPzData && fullPzData._inferredType === 'Puzzle') { 
        const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); 
        if (pzNodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, pzNodeData, 'Involved In (Puzzle)', edges); 
    }
  });
  (charData.events || []).forEach(evStub => {
    const fullEvData = mappedFirstDegreeEntities.get(evStub.id);
    if (fullEvData && fullEvData._inferredType === 'Timeline') { 
        const evNodeData = _createGraphNodeInternal(fullEvData, 'Timeline', nodes, addedNodeIds, processedFullEntities); 
        if (evNodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, evNodeData, 'Participates In (Event)', edges); 
    }
  });

  if (depth >= 2) {
    const secondDegreePromises = []; 

    const addSecondDegreeLink = async (sourceNodeForEdge, targetStub, targetExpectedType, edgeLabel, reverseEdge = false) => {
        if (!targetStub || !targetStub.id || !sourceNodeForEdge) return;

        let fullTargetItemData = processedFullEntities.get(targetStub.id) ||
                                 mappedFirstDegreeEntities.get(targetStub.id) ||
                                 mappedContentItems.get(targetStub.id); 

        if (!fullTargetItemData) {
            const targetPage = await notionService.getPage(targetStub.id);
            if (targetPage) {
                switch (targetExpectedType) {
                    case 'Character': fullTargetItemData = await propertyMapper.mapCharacterWithNames(targetPage, notionService); break;
                    case 'Element':   fullTargetItemData = await propertyMapper.mapElementWithNames(targetPage, notionService);   break;
                    case 'Puzzle':    fullTargetItemData = await propertyMapper.mapPuzzleWithNames(targetPage, notionService);    break;
                    case 'Timeline':  fullTargetItemData = await propertyMapper.mapTimelineEventWithNames(targetPage, notionService); break;
                    default: console.warn(`[getCharacterGraph D2] Unknown targetExpectedType: ${targetExpectedType} for ID ${targetStub.id}`); return;
                }
                if (fullTargetItemData && !fullTargetItemData.error) {
                    if(!fullTargetItemData._inferredType) fullTargetItemData._inferredType = targetExpectedType; 
                } else if (fullTargetItemData && fullTargetItemData.error) {
                    console.warn(`[getCharacterGraph D2] Error mapping ${targetExpectedType} ${targetStub.id}: ${fullTargetItemData.error}`);
                    return; 
                }
            }
        }
        
        if (fullTargetItemData) {
            const targetNodeDataForEdge = _createGraphNodeInternal(fullTargetItemData, fullTargetItemData._inferredType || targetExpectedType, nodes, addedNodeIds, processedFullEntities);
            if (targetNodeDataForEdge) {
                if (reverseEdge) {
                    _createGraphEdgeInternal(targetNodeDataForEdge, sourceNodeForEdge, edgeLabel, edges);
                } else {
                    _createGraphEdgeInternal(sourceNodeForEdge, targetNodeDataForEdge, edgeLabel, edges);
                }
            }
        }
    };

    for (const [/*id*/, firstDegreeEntity] of mappedFirstDegreeEntities.entries()) {
        const firstDegreeNodeData = processedFullEntities.get(firstDegreeEntity.id);
        if (!firstDegreeNodeData) continue;

        switch (firstDegreeEntity._inferredType) {
            case 'Puzzle':
                (firstDegreeEntity.puzzleElements || []).forEach(elStub => 
                    secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Required By (Puzzle)', true)) 
                );
                (firstDegreeEntity.rewards || []).forEach(elStub => 
                    secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Rewards (Element)'))
                );
                if (firstDegreeEntity.owner && firstDegreeEntity.owner.length > 0) {
                    firstDegreeEntity.owner.forEach(ownerStub => {
                        if (ownerStub.id !== charData.id) { 
                           secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, ownerStub, 'Character', 'Owns (Puzzle)', true)); 
                        }
                    });
                }
                break;
            case 'Element':
                (firstDegreeEntity.requiredForPuzzle || []).forEach(pzStub => 
                    secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Required For (Puzzle)'))
                );
                (firstDegreeEntity.rewardedByPuzzle || []).forEach(pzStub => 
                    secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Rewards (Element)'))
                );
                if (firstDegreeEntity.owner && firstDegreeEntity.owner.length > 0) {
                    firstDegreeEntity.owner.forEach(ownerStub => {
                        if (ownerStub.id !== charData.id) { 
                            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, ownerStub, 'Character', 'Owned By', true)); 
                        }
                    });
                }
                break;
            case 'Timeline':
                (firstDegreeEntity.memoryEvidence || []).forEach(elStub => 
                    secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Evidence For (Event)', true)) 
                );
                (firstDegreeEntity.charactersInvolved || []).filter(c => c.id !== charData.id).forEach(chStub => 
                    secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, chStub, 'Character', 'Involves (Character)'))
                );
                break;
        }
    }
    await Promise.all(secondDegreePromises);
  }

  const graph = { center: charData, nodes, edges };
  notionCache.set(cacheKey, graph);
  console.log(`[CACHE SET] ${cacheKey} for char ${charData.name} with ${nodes.length} nodes, ${edges.length} edges.`);
  setCacheHeaders(res);
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
  // console.log('[Timeline Controller] Constructed Filter for Notion:', JSON.stringify(filter, null, 2));
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
// Define Memory Basic Types at a scope accessible by getElements
const MEMORY_BASIC_TYPES = [
  "Memory Token Video",
  "Memory Token Audio",
  "Memory Token Physical",
  "Corrupted Memory RFID",
  "Memory Fragment" // Add any other relevant types
];

const getElements = catchAsync(async (req, res) => {
  const { filterGroup, ...otherQueryParams } = req.query;
  let combinedFilter;

  // Base filters from propertyMap for other query params
  const propertyMap = {
    type: 'Basic Type',
    status: 'Status',
    firstAvailable: 'First Available',
    narrativeThreadContains: 'Narrative Threads'
  };
  const standardFilters = buildNotionFilter(otherQueryParams, propertyMap);

  if (filterGroup === 'memoryTypes') {
    const memoryTypeOrConditions = MEMORY_BASIC_TYPES.map(type => ({
      property: 'Basic Type',
      select: { equals: type },
    }));

    const memoryFilter = { or: memoryTypeOrConditions };

    if (standardFilters) {
      // If standardFilters is just one condition (not an 'and' object yet)
      if (!standardFilters.and) {
         combinedFilter = { and: [standardFilters, memoryFilter] };
      } else { // If standardFilters is already an 'and' object
         combinedFilter = { and: [...standardFilters.and, memoryFilter] };
      }
    } else {
      combinedFilter = memoryFilter; // No other filters, just memory types
    }
    // console.log('[Elements Controller] Constructed Filter for Memory Types:', JSON.stringify(combinedFilter, null, 2));
  } else {
    combinedFilter = standardFilters;
    // console.log('[Elements Controller] Constructed Standard Filter:', JSON.stringify(combinedFilter, null, 2));
  }

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
      mapperFn: propertyMapper.mapTimelineEventWithNames, 
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
  console.log('Server cache cleared.');
  res.json({ message: 'Cache cleared' });
});

function setCacheHeaders(res, seconds = 300) { 
  res.set('Cache-Control', `public, max-age=${seconds}`);
}

const getElementGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const depth = parseInt(req.query.depth || '1', 10);
  const cacheKey = makeCacheKey('graph-element-v3.2', { id, depth }); // Cache key updated
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }
  console.log(`[CACHE MISS] ${cacheKey}`);

  const page = await notionService.getPage(id);
  if (!page) return res.status(404).json({ error: 'Element not found' });
  const elData = await propertyMapper.mapElementWithNames(page, notionService);
   if (elData.error) {
    console.error(`[getElementGraph] Error mapping central element ${id}: ${elData.error}`);
    return res.status(500).json({ error: 'Failed to map central element data.'});
  }

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
    let mappedEntity, inferredType = 'Unknown';
    if ((elData.owner || []).find(s => s.id === pageObj.id) || (elData.associatedCharacters || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapCharacterWithNames(pageObj, notionService); inferredType = 'Character';
    } else if ((elData.timelineEvent || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapTimelineEventWithNames(pageObj, notionService); inferredType = 'Timeline';
    } else if ((elData.requiredForPuzzle || []).find(s => s.id === pageObj.id) || (elData.rewardedByPuzzle || []).find(s => s.id === pageObj.id) || (elData.containerPuzzle || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapPuzzleWithNames(pageObj, notionService); inferredType = 'Puzzle';
    } else if ((elData.container || []).find(s => s.id === pageObj.id) || (elData.contents || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapElementWithNames(pageObj, notionService); inferredType = 'Element';
    }
    if (mappedEntity && !mappedEntity.error) {
      mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: inferredType });
    } else if (mappedEntity && mappedEntity.error) {
      console.warn(`[getElementGraph] Error mapping 1st degree entity ${pageObj.id}: ${mappedEntity.error}`);
    }
  }

  (elData.owner || []).forEach(chStub => { 
    const fullChData = mappedFirstDegreeEntities.get(chStub.id);
    if(fullChData) { const chNodeData = _createGraphNodeInternal(fullChData, 'Character', nodes, addedNodeIds, processedFullEntities); if (chNodeData && centerNodeData) _createGraphEdgeInternal(chNodeData, centerNodeData, 'Owns Element', edges); }
  });
  (elData.associatedCharacters || []).forEach(chStub => {
    const fullChData = mappedFirstDegreeEntities.get(chStub.id);
    if(fullChData) { const chNodeData = _createGraphNodeInternal(fullChData, 'Character', nodes, addedNodeIds, processedFullEntities); if (chNodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, chNodeData, 'Associated With (Character)', edges); }
  });
  (elData.timelineEvent || []).forEach(evStub => {
    const fullEvData = mappedFirstDegreeEntities.get(evStub.id);
    if(fullEvData) { const evNodeData = _createGraphNodeInternal(fullEvData, 'Timeline', nodes, addedNodeIds, processedFullEntities); if (evNodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, evNodeData, 'Appears In (Event)', edges); }
  });
  (elData.requiredForPuzzle || []).forEach(pzStub => {
    const fullPzData = mappedFirstDegreeEntities.get(pzStub.id);
    if(fullPzData) { const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); if (pzNodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, pzNodeData, 'Required For (Puzzle)', edges); }
  });
  (elData.rewardedByPuzzle || []).forEach(pzStub => {
    const fullPzData = mappedFirstDegreeEntities.get(pzStub.id);
    if(fullPzData) { const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); if (pzNodeData && centerNodeData) _createGraphEdgeInternal(pzNodeData, centerNodeData, 'Reward From (Puzzle)', edges); }
  });
  (elData.containerPuzzle || []).forEach(pzStub => {
    const fullPzData = mappedFirstDegreeEntities.get(pzStub.id);
    if(fullPzData) { const pzNodeData = _createGraphNodeInternal(fullPzData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); if (pzNodeData && centerNodeData) _createGraphEdgeInternal(pzNodeData, centerNodeData, 'Locked In (Element is in Puzzle container)', edges); }
  });
  (elData.container || []).forEach(containerStub => { // Element is IN this container
    const fullContainerData = mappedFirstDegreeEntities.get(containerStub.id);
    if(fullContainerData) { const ctnNodeData = _createGraphNodeInternal(fullContainerData, 'Element', nodes, addedNodeIds, processedFullEntities); if (ctnNodeData && centerNodeData) _createGraphEdgeInternal(ctnNodeData, centerNodeData, 'Contains (Element is inside)', edges); }
  });
  (elData.contents || []).forEach(contentStub => { // Element CONTAINS these items
    const fullContentData = mappedFirstDegreeEntities.get(contentStub.id);
    if(fullContentData) { const contNodeData = _createGraphNodeInternal(fullContentData, 'Element', nodes, addedNodeIds, processedFullEntities); if (contNodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, contNodeData, 'Contains (Element is container)', edges); }
  });

  if (depth >= 2) {
    const secondDegreePromises = [];
     const addSecondDegreeLink = async (sourceNodeForEdge, targetStub, targetExpectedType, edgeLabel, reverseEdge = false) => {
        if (!targetStub || !targetStub.id || !sourceNodeForEdge) return;
        let fullTargetItemData = processedFullEntities.get(targetStub.id) || mappedFirstDegreeEntities.get(targetStub.id);
        if (!fullTargetItemData) {
            const targetPage = await notionService.getPage(targetStub.id);
            if (targetPage) {
                 switch (targetExpectedType) {
                    case 'Character': fullTargetItemData = await propertyMapper.mapCharacterWithNames(targetPage, notionService); break;
                    case 'Element':   fullTargetItemData = await propertyMapper.mapElementWithNames(targetPage, notionService);   break;
                    case 'Puzzle':    fullTargetItemData = await propertyMapper.mapPuzzleWithNames(targetPage, notionService);    break;
                    default: console.warn(`[getElementGraph D2] Unknown targetExpectedType: ${targetExpectedType} for ID ${targetStub.id}`); return;
                }
                if (fullTargetItemData && !fullTargetItemData.error) {
                    if(!fullTargetItemData._inferredType) fullTargetItemData._inferredType = targetExpectedType;
                } else if (fullTargetItemData && fullTargetItemData.error) {
                     console.warn(`[getElementGraph D2] Error mapping ${targetExpectedType} ${targetStub.id}: ${fullTargetItemData.error}`); return;
                }
            }
        }
        if (fullTargetItemData) {
            const targetNodeDataForEdge = _createGraphNodeInternal(fullTargetItemData, fullTargetItemData._inferredType || targetExpectedType, nodes, addedNodeIds, processedFullEntities);
            if (targetNodeDataForEdge) {
                if (reverseEdge) _createGraphEdgeInternal(targetNodeDataForEdge, sourceNodeForEdge, edgeLabel, edges);
                else _createGraphEdgeInternal(sourceNodeForEdge, targetNodeDataForEdge, edgeLabel, edges);
            }
        }
    };
    for (const [/*id*/, firstDegreeEntity] of mappedFirstDegreeEntities.entries()) {
      const firstDegreeNodeData = processedFullEntities.get(firstDegreeEntity.id);
      if (!firstDegreeNodeData || firstDegreeEntity.id === elData.id) continue;

      switch (firstDegreeEntity._inferredType) {
        case 'Puzzle':
          (firstDegreeEntity.owner || []).forEach(chStub => 
             secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, chStub, 'Character', 'Owned By', true))
          );
          (firstDegreeEntity.puzzleElements || []).filter(e => e.id !== elData.id).forEach(elStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Required By (Puzzle)', true))
          );
          (firstDegreeEntity.rewards || []).filter(e => e.id !== elData.id).forEach(elStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Rewards (Element)'))
          );
          break;
        case 'Character':
          (firstDegreeEntity.puzzles || []).forEach(pzStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Owns (Puzzle)'))
          );
          (firstDegreeEntity.ownedElements || []).forEach(elStub => 
             secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Owns Element'))
          );
          break;
      }
    }
    await Promise.all(secondDegreePromises);
  }
  const graph = { center: elData, nodes, edges };
  notionCache.set(cacheKey, graph);
  console.log(`[CACHE SET] ${cacheKey} for element ${elData.name} with ${nodes.length} nodes, ${edges.length} edges.`);
  setCacheHeaders(res);
  res.json(graph);
});

const getPuzzleGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const depth = parseInt(req.query.depth || '1', 10);
  const cacheKey = makeCacheKey('graph-puzzle-v3.2', { id, depth }); // Cache key updated
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }
   console.log(`[CACHE MISS] ${cacheKey}`);
  const page = await notionService.getPage(id);
  if (!page) return res.status(404).json({ error: 'Puzzle not found' });
  const puzzleData = await propertyMapper.mapPuzzleWithNames(page, notionService);
  if (puzzleData.error) {
    console.error(`[getPuzzleGraph] Error mapping central puzzle ${id}: ${puzzleData.error}`);
    return res.status(500).json({ error: 'Failed to map central puzzle data.'});
  }

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
    let mappedEntity, inferredType = 'Unknown';
    if ((puzzleData.owner || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapCharacterWithNames(pageObj, notionService); inferredType = 'Character';
    } else if ((puzzleData.lockedItem || []).find(s => s.id === pageObj.id) || (puzzleData.puzzleElements || []).find(s => s.id === pageObj.id) || (puzzleData.rewards || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapElementWithNames(pageObj, notionService); inferredType = 'Element';
    } else if ((puzzleData.parentItem || []).find(s => s.id === pageObj.id) || (puzzleData.subPuzzles || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapPuzzleWithNames(pageObj, notionService); inferredType = 'Puzzle';
    }
    if (mappedEntity && !mappedEntity.error) {
      mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: inferredType });
    } else if (mappedEntity && mappedEntity.error) {
        console.warn(`[getPuzzleGraph] Error mapping 1st degree entity ${pageObj.id}: ${mappedEntity.error}`);
    }
  }

  (puzzleData.owner || []).forEach(chStub => {
    const fullData = mappedFirstDegreeEntities.get(chStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Character', nodes, addedNodeIds, processedFullEntities); if(nodeData && centerNodeData) _createGraphEdgeInternal(nodeData, centerNodeData, 'Owns (Puzzle)', edges); }
  });
  (puzzleData.lockedItem || []).forEach(elStub => {
    const fullData = mappedFirstDegreeEntities.get(elStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); if(nodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, nodeData, 'Unlocks (Item)', edges); }
  });
  (puzzleData.puzzleElements || []).forEach(elStub => {
    const fullData = mappedFirstDegreeEntities.get(elStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); if(nodeData && centerNodeData) _createGraphEdgeInternal(nodeData, centerNodeData, 'Required By (Puzzle)', edges); }
  });
  (puzzleData.rewards || []).forEach(elStub => {
    const fullData = mappedFirstDegreeEntities.get(elStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); if(nodeData && centerNodeData) _createGraphEdgeInternal(pzNodeData, nodeData, 'Rewards (Element)', edges); }
  });
  (puzzleData.parentItem || []).forEach(parentStub => {
    const fullData = mappedFirstDegreeEntities.get(parentStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); if(nodeData && centerNodeData) _createGraphEdgeInternal(nodeData, centerNodeData, 'Sub-Puzzle Of', edges); }
  });
  (puzzleData.subPuzzles || []).forEach(spStub => {
    const fullData = mappedFirstDegreeEntities.get(spStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Puzzle', nodes, addedNodeIds, processedFullEntities); if(nodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, nodeData, 'Has Sub-Puzzle', edges); }
  });

  if (depth >= 2) {
     const secondDegreePromises = [];
     const addSecondDegreeLink = async (sourceNodeForEdge, targetStub, targetExpectedType, edgeLabel, reverseEdge = false) => {
        if (!targetStub || !targetStub.id || !sourceNodeForEdge) return;
        let fullTargetItemData = processedFullEntities.get(targetStub.id) || mappedFirstDegreeEntities.get(targetStub.id);
        if (!fullTargetItemData) {
            const targetPage = await notionService.getPage(targetStub.id);
            if (targetPage) {
                 switch (targetExpectedType) {
                    case 'Character': fullTargetItemData = await propertyMapper.mapCharacterWithNames(targetPage, notionService); break;
                    case 'Element':   fullTargetItemData = await propertyMapper.mapElementWithNames(targetPage, notionService);   break;
                    case 'Puzzle':    fullTargetItemData = await propertyMapper.mapPuzzleWithNames(targetPage, notionService);    break;
                    default: console.warn(`[getPuzzleGraph D2] Unknown targetExpectedType: ${targetExpectedType} for ID ${targetStub.id}`); return;
                }
                if (fullTargetItemData && !fullTargetItemData.error) {
                    if(!fullTargetItemData._inferredType) fullTargetItemData._inferredType = targetExpectedType;
                } else if (fullTargetItemData && fullTargetItemData.error) {
                     console.warn(`[getPuzzleGraph D2] Error mapping ${targetExpectedType} ${targetStub.id}: ${fullTargetItemData.error}`); return;
                }
            }
        }
        if (fullTargetItemData) {
            const targetNodeDataForEdge = _createGraphNodeInternal(fullTargetItemData, fullTargetItemData._inferredType || targetExpectedType, nodes, addedNodeIds, processedFullEntities);
            if (targetNodeDataForEdge) {
                if (reverseEdge) _createGraphEdgeInternal(targetNodeDataForEdge, sourceNodeForEdge, edgeLabel, edges);
                else _createGraphEdgeInternal(sourceNodeForEdge, targetNodeDataForEdge, edgeLabel, edges);
            }
        }
    };
    for (const [/*id*/, firstDegreeEntity] of mappedFirstDegreeEntities.entries()) {
      const firstDegreeNodeData = processedFullEntities.get(firstDegreeEntity.id);
      if (!firstDegreeNodeData || firstDegreeEntity.id === puzzleData.id) continue; 

      switch (firstDegreeEntity._inferredType) {
        case 'Element': 
          (firstDegreeEntity.owner || []).forEach(chStub => 
             secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, chStub, 'Character', 'Owned By', true))
          );
          (firstDegreeEntity.requiredForPuzzle || []).forEach(pzStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Required For (Puzzle)'))
          );
          (firstDegreeEntity.rewardedByPuzzle || []).forEach(pzStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Reward From (Puzzle)', true))
          );
          break;
        case 'Character': 
          (firstDegreeEntity.puzzles || []).forEach(pzStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Owns (Puzzle)'))
          );
          (firstDegreeEntity.ownedElements || []).forEach(elStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Owns Element'))
          );
          break;
        case 'Puzzle': // For sub-puzzles or parent puzzles
          (firstDegreeEntity.puzzleElements || []).forEach(elStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Required By (Puzzle)', true))
          );
           (firstDegreeEntity.rewards || []).forEach(elStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Rewards (Element)'))
          );
          break;
      }
    }
    await Promise.all(secondDegreePromises);
  }
  const graph = { center: puzzleData, nodes, edges };
  notionCache.set(cacheKey, graph);
  console.log(`[CACHE SET] ${cacheKey} for puzzle ${puzzleData.puzzle} with ${nodes.length} nodes, ${edges.length} edges.`);
  setCacheHeaders(res);
  res.json(graph);
});

const getTimelineGraph = catchAsync(async (req, res) => {
  const { id } = req.params;
  const depth = parseInt(req.query.depth || '1', 10);
  const cacheKey = makeCacheKey('graph-timeline-v3.2', { id, depth }); // Cache key updated
  const cached = notionCache.get(cacheKey);
  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cached);
  }
  console.log(`[CACHE MISS] ${cacheKey}`);
  const page = await notionService.getPage(id);
  if (!page) return res.status(404).json({ error: 'Timeline event not found' });
  const eventData = await propertyMapper.mapTimelineEventWithNames(page, notionService);
   if (eventData.error) {
    console.error(`[getTimelineGraph] Error mapping central event ${id}: ${eventData.error}`);
    return res.status(500).json({ error: 'Failed to map central event data.'});
  }

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
    let mappedEntity, inferredType = 'Unknown';
    if ((eventData.charactersInvolved || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapCharacterWithNames(pageObj, notionService); inferredType = 'Character';
    } else if ((eventData.memoryEvidence || []).find(s => s.id === pageObj.id)) {
      mappedEntity = await propertyMapper.mapElementWithNames(pageObj, notionService); inferredType = 'Element';
    }
     if (mappedEntity && !mappedEntity.error) {
      mappedFirstDegreeEntities.set(pageObj.id, { ...mappedEntity, _inferredType: inferredType });
    } else if (mappedEntity && mappedEntity.error) {
        console.warn(`[getTimelineGraph] Error mapping 1st degree entity ${pageObj.id}: ${mappedEntity.error}`);
    }
  }

  (eventData.charactersInvolved || []).forEach(chStub => {
    const fullData = mappedFirstDegreeEntities.get(chStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Character', nodes, addedNodeIds, processedFullEntities); if(nodeData && centerNodeData) _createGraphEdgeInternal(centerNodeData, nodeData, 'Involves (Character)', edges); }
  });
  (eventData.memoryEvidence || []).forEach(elStub => {
    const fullData = mappedFirstDegreeEntities.get(elStub.id);
    if(fullData) { const nodeData = _createGraphNodeInternal(fullData, 'Element', nodes, addedNodeIds, processedFullEntities); if(nodeData && centerNodeData) _createGraphEdgeInternal(nodeData, centerNodeData, 'Evidence For (Event)', edges); }
  });

  if (depth >= 2) {
    const secondDegreePromises = [];
    const addSecondDegreeLink = async (sourceNodeForEdge, targetStub, targetExpectedType, edgeLabel, reverseEdge = false) => {
        if (!targetStub || !targetStub.id || !sourceNodeForEdge) return;
        let fullTargetItemData = processedFullEntities.get(targetStub.id) || mappedFirstDegreeEntities.get(targetStub.id);
        if (!fullTargetItemData) {
            const targetPage = await notionService.getPage(targetStub.id);
            if (targetPage) {
                 switch (targetExpectedType) {
                    case 'Character': fullTargetItemData = await propertyMapper.mapCharacterWithNames(targetPage, notionService); break;
                    case 'Element':   fullTargetItemData = await propertyMapper.mapElementWithNames(targetPage, notionService);   break;
                    case 'Puzzle':    fullTargetItemData = await propertyMapper.mapPuzzleWithNames(targetPage, notionService);    break;
                    case 'Timeline':  fullTargetItemData = await propertyMapper.mapTimelineEventWithNames(targetPage, notionService); break;
                    default: console.warn(`[getTimelineGraph D2] Unknown targetExpectedType: ${targetExpectedType} for ID ${targetStub.id}`); return;
                }
                if (fullTargetItemData && !fullTargetItemData.error) {
                    if(!fullTargetItemData._inferredType) fullTargetItemData._inferredType = targetExpectedType;
                } else if (fullTargetItemData && fullTargetItemData.error) {
                     console.warn(`[getTimelineGraph D2] Error mapping ${targetExpectedType} ${targetStub.id}: ${fullTargetItemData.error}`); return;
                }
            }
        }
        if (fullTargetItemData) {
            const targetNodeDataForEdge = _createGraphNodeInternal(fullTargetItemData, fullTargetItemData._inferredType || targetExpectedType, nodes, addedNodeIds, processedFullEntities);
            if (targetNodeDataForEdge) {
                if (reverseEdge) _createGraphEdgeInternal(targetNodeDataForEdge, sourceNodeForEdge, edgeLabel, edges);
                else _createGraphEdgeInternal(sourceNodeForEdge, targetNodeDataForEdge, edgeLabel, edges);
            }
        }
    };
    for (const [/*id*/, firstDegreeEntity] of mappedFirstDegreeEntities.entries()) {
      const firstDegreeNodeData = processedFullEntities.get(firstDegreeEntity.id);
      if (!firstDegreeNodeData || firstDegreeEntity.id === eventData.id) continue;

      switch (firstDegreeEntity._inferredType) {
        case 'Character':
          (firstDegreeEntity.events || []).filter(ev => ev.id !== eventData.id).forEach(evStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, evStub, 'Timeline', 'Participates In (Event)'))
          );
          (firstDegreeEntity.puzzles || []).forEach(pzStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Owns (Puzzle)'))
          );
          (firstDegreeEntity.ownedElements || []).forEach(elStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, elStub, 'Element', 'Owns Element'))
          );
          break;
        case 'Element':
          (firstDegreeEntity.owner || []).forEach(chStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, chStub, 'Character', 'Owned By', true))
          );
          (firstDegreeEntity.requiredForPuzzle || []).forEach(pzStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Required For (Puzzle)'))
          );
          (firstDegreeEntity.rewardedByPuzzle || []).forEach(pzStub => 
            secondDegreePromises.push(addSecondDegreeLink(firstDegreeNodeData, pzStub, 'Puzzle', 'Reward From (Puzzle)', true))
          );
          break;
      }
    }
     await Promise.all(secondDegreePromises);
  }
  const graph = { center: eventData, nodes, edges };
  notionCache.set(cacheKey, graph);
  console.log(`[CACHE SET] ${cacheKey} for event ${eventData.description} with ${nodes.length} nodes, ${edges.length} edges.`);
  setCacheHeaders(res);
  res.json(graph);
});

function _createGraphNodeInternal(entityData, entityType, nodesArray, addedNodeIdsSet, processedFullEntitiesMap) {
  if (!entityData || !entityData.id) {
    // console.warn('[_createGraphNodeInternal] Attempted to create node with invalid entityData:', entityData);
    return undefined;
  }
  // If this exact entity instance (by ID and potentially version/lastEdited) has been fully processed and added, return its node representation
  if (processedFullEntitiesMap.has(entityData.id)) {
      const existingNode = processedFullEntitiesMap.get(entityData.id);
      // Optional: Add a check here if entityData has changed since last processing,
      // for now, assume if ID exists, it's the same intended node.
      // Ensure it's in nodesArray if somehow only in processedFullEntitiesMap but not yet pushed.
      if (!addedNodeIdsSet.has(entityData.id)) { // Should ideally not happen if logic is consistent
          nodesArray.push(existingNode);
          addedNodeIdsSet.add(entityData.id);
      }
      return existingNode;
  }
  // If only ID is in addedNodeIdsSet but not in processedFullEntitiesMap, it means a stub was added.
  // We should still proceed to create the full node and replace the stub logic if that were the case.
  // However, current logic adds full nodes via processedFullEntitiesMap first.

  const commonProps = {
    id: entityData.id,
    name: entityData.name || entityData.description || entityData.puzzle || `Unnamed ${entityType}`, 
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
        // Add SF_RFID if parsed, for tooltip or specific display
        ...(entityData.SF_RFID && { SF_RFID: entityData.SF_RFID }),
      };
      break;
    case 'Timeline':
      specificProps = {
        dateString: entityData.date, 
        participantSummary: `Involves: ${entityData.charactersInvolved?.length || 0} Characters, ${entityData.memoryEvidence?.length || 0} Elements.`,
        notesSnippet: createSnippet(entityData.notes)
      };
      break;
    default:
      // console.warn(`[_createGraphNodeInternal] Unknown entityType: ${entityType} for ID ${entityData.id}`);
      // Allow creation with just common props if type is unknown but data is valid
      break;
  }

  // Add new universal properties if they exist on entityData
  if (entityData.actFocus) specificProps.actFocus = entityData.actFocus;
  if (entityData.themes && entityData.themes.length > 0) specificProps.themes = entityData.themes;
  if (entityData.memorySets && entityData.memorySets.length > 0) specificProps.memorySets = entityData.memorySets;

  const finalNodeData = { ...commonProps, ...specificProps };
  
  // Check if this node ID was already added, perhaps as a different type or less complete version
  if (addedNodeIdsSet.has(entityData.id)) {
      // If it exists, update it if the new data is more complete (e.g., has more specific props)
      const existingNodeIndex = nodesArray.findIndex(n => n.id === entityData.id);
      if (existingNodeIndex !== -1) {
          // A simple heuristic: if the new one has more keys, it might be more complete.
          // Or, if the type was 'Unknown' and is now specific.
          if (Object.keys(nodesArray[existingNodeIndex]).length < Object.keys(finalNodeData).length || 
              (nodesArray[existingNodeIndex].type === 'Unknown' && entityType !== 'Unknown')) {
              nodesArray[existingNodeIndex] = finalNodeData;
              // console.log(`[_createGraphNodeInternal] Updated existing node ${entityData.id} with more complete data.`);
          }
      }
      // It's already in addedNodeIdsSet, so no need to add again.
      // Ensure it's in processedFullEntitiesMap with the (potentially updated) full data.
      processedFullEntitiesMap.set(entityData.id, finalNodeData);
      return finalNodeData;
  }

  nodesArray.push(finalNodeData);
  addedNodeIdsSet.add(entityData.id);
  processedFullEntitiesMap.set(entityData.id, finalNodeData); 
  return finalNodeData; 
}

function _createGraphEdgeInternal(sourceNodeData, targetNodeData, label, edgesArray) {
  if (!sourceNodeData || !targetNodeData || !sourceNodeData.id || !targetNodeData.id) {
    // console.warn('[_createGraphEdgeInternal] Attempted to create edge with invalid source/target node data:', {source: sourceNodeData, target: targetNodeData});
    return;
  }
  // Prevent self-loops unless specifically designed for (none currently are)
  if (sourceNodeData.id === targetNodeData.id) {
    // console.warn(`[_createGraphEdgeInternal] Attempted to create self-loop for node ${sourceNodeData.id} with label "${label}". Skipping.`);
    return;
  }

  let shortLabel = label;
  let refinedContextualLabel = '';
  const sourceName = sourceNodeData.name || `Unnamed ${sourceNodeData.type || 'Source'}`;
  const targetName = targetNodeData.name || `Unnamed ${targetNodeData.type || 'Target'}`;
  const sourceType = sourceNodeData.type || 'Unknown';
  const targetType = targetNodeData.type || 'Unknown';

  // Standardize edge labels for grouping and clarity
  switch (label) {
    case 'Owns': shortLabel = 'Owns'; refinedContextualLabel = `${sourceName} (${sourceType}) owns ${targetName} (${targetType})`; break;
    case 'Owned By': shortLabel = 'Owned By'; refinedContextualLabel = `${sourceName} (${sourceType}) is owned by ${targetName} (${targetType})`; break;
    case 'Associated': shortLabel = 'Associated'; refinedContextualLabel = `${sourceName} (${sourceType}) is associated with ${targetName} (${targetType})`; break;
    case 'Involved In (Puzzle)': shortLabel = 'Involved In'; refinedContextualLabel = `${sourceName} (${sourceType}) is involved in Puzzle "${targetName}"`; break;
    case 'Participates In (Event)': shortLabel = 'Participates In'; refinedContextualLabel = `${sourceName} (${sourceType}) participates in Event "${targetName}"`; break;
    case 'Required For': shortLabel = 'Required For'; refinedContextualLabel = `${sourceName} (${sourceType}) is required for ${targetName} (${targetType})`; break;
    case 'Rewards': shortLabel = 'Rewards'; refinedContextualLabel = `${sourceName} (${sourceType}) rewards ${targetName} (${targetType})`; break;
    case 'Owns Element': shortLabel = 'Owns'; refinedContextualLabel = `${sourceName} (${sourceType}) owns Element "${targetName}"`; break;
    case 'Associated With (Character)': shortLabel = 'Associated With'; refinedContextualLabel = `${sourceName} (${sourceType}) is associated with Character "${targetName}"`; break;
    case 'Appears In (Event)': shortLabel = 'Appears In'; refinedContextualLabel = `${sourceName} (${sourceType}) appears in Event "${targetName}"`; break;
    case 'Required For (Puzzle)': shortLabel = 'Required For'; refinedContextualLabel = `${sourceName} (${sourceType}) is required for Puzzle "${targetName}"`; break;
    case 'Reward From (Puzzle)': shortLabel = 'Reward From'; refinedContextualLabel = `${sourceName} (${sourceType}) is a reward from Puzzle "${targetName}"`; break;
    case 'Locked In (Element is in Puzzle container)': shortLabel = 'Locked In'; refinedContextualLabel = `${sourceName} (${sourceType}) is locked in Puzzle "${targetName}" (container)`; break;
    case 'Contains (Element is inside)': shortLabel = 'Inside'; refinedContextualLabel = `${targetName} (${targetType}) contains ${sourceName} (${sourceType})`; break; // Reversed for "A is inside B"
    case 'Contains (Element is container)': shortLabel = 'Contains'; refinedContextualLabel = `${sourceName} (${sourceType}) contains ${targetName} (${targetType})`; break;
    case 'Owns (Puzzle)': shortLabel = 'Owns'; refinedContextualLabel = `${sourceName} (${sourceType}) owns Puzzle "${targetName}"`; break;
    case 'Unlocks (Item)': shortLabel = 'Unlocks'; refinedContextualLabel = `${sourceName} (${sourceType}) unlocks ${targetName} (${targetType})`; break;
    case 'Required By (Puzzle)': shortLabel = 'Required By'; refinedContextualLabel = `${sourceName} (${sourceType}) is required by Puzzle "${targetName}"`; break;
    case 'Rewards (Element)': shortLabel = 'Rewards'; refinedContextualLabel = `${sourceName} (${sourceType}) rewards Element "${targetName}"`; break;
    case 'Sub-Puzzle Of': shortLabel = 'Sub-Puzzle Of'; refinedContextualLabel = `${targetName} (${targetType}) is a sub-puzzle of ${sourceName} (${sourceType})`; break; // Reversed
    case 'Has Sub-Puzzle': shortLabel = 'Has Sub-Puzzle'; refinedContextualLabel = `${sourceName} (${sourceType}) has sub-puzzle ${targetName} (${targetType})`; break;
    case 'Involves (Character)': shortLabel = 'Involves'; refinedContextualLabel = `${sourceName} (${sourceType}) involves Character "${targetName}"`; break;
    case 'Evidence For (Event)': shortLabel = 'Evidence For'; refinedContextualLabel = `${sourceName} (${sourceType}) is evidence for Event "${targetName}"`; break;
    case 'Participates In': shortLabel = 'Participates In'; refinedContextualLabel = `${sourceName} (${sourceType}) participates in ${targetName} (${targetType})`; break;
    default:
      shortLabel = label.replace(/\s*\(.*?\)\s*/g, '').trim(); 
      if (!shortLabel) shortLabel = 'Related'; 
      refinedContextualLabel = `${sourceName} (${sourceType}) ${label.toLowerCase()} ${targetName} (${targetType})`;
  }

  // Check for duplicate edges before adding
  const edgeExists = edgesArray.some(
    edge => edge.source === sourceNodeData.id && edge.target === targetNodeData.id && edge.data.shortLabel === shortLabel
  );

  if (!edgeExists) {
    edgesArray.push({
      id: `edge-${sourceNodeData.id}-${targetNodeData.id}-${label.replace(/\s/g,'_')}-${Math.random().toString(16).slice(2,8)}`, // More unique ID
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
  } else {
    // console.log(`[_createGraphEdgeInternal] Duplicate edge skipped: ${sourceNodeData.id} -> ${targetNodeData.id} (${shortLabel})`);
  }
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

// --- New Endpoints for Dashboard "Needs Attention" ---

const getPuzzlesWithWarnings = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('puzzles-with-warnings-v2'); // Cache key updated
  const cachedData = notionCache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  console.log(`[CACHE MISS] ${cacheKey}`);

  const notionPuzzles = await notionService.getPuzzles(); // Get all puzzles
  const mappedPuzzles = await Promise.all(
    notionPuzzles.map(puzzle => propertyMapper.mapPuzzleWithNames(puzzle, notionService))
  );

  const puzzlesWithWarnings = [];
  for (const puzzle of mappedPuzzles) {
    if (puzzle.error) continue; // Skip if there was an error mapping this puzzle

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
        timing: puzzle.timing || puzzle.actFocus,
      });
    }
  }

  notionCache.set(cacheKey, puzzlesWithWarnings);
  console.log(`[CACHE SET] ${cacheKey} - Found ${puzzlesWithWarnings.length} puzzles with warnings.`);
  setCacheHeaders(res);
  res.json(puzzlesWithWarnings);
});

const getElementsWithWarnings = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('elements-with-warnings-v2'); // Cache key updated
  const cachedData = notionCache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  console.log(`[CACHE MISS] ${cacheKey}`);

  const notionElements = await notionService.getElements(); // Get all elements
  const mappedElements = await Promise.all(
    notionElements.map(element => propertyMapper.mapElementWithNames(element, notionService))
  );

  const EXCLUDED_BASIC_TYPES = ['Character Sheet', 'Set Dressing', 'Core Narrative']; // Add other non-puzzle interactive types

  const elementsWithWarnings = [];
  for (const element of mappedElements) {
    if (element.error) continue;

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
        warnings,
      });
    }
  }

  notionCache.set(cacheKey, elementsWithWarnings);
  console.log(`[CACHE SET] ${cacheKey} - Found ${elementsWithWarnings.length} elements with warnings.`);
  setCacheHeaders(res);
  res.json(elementsWithWarnings);
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
  getTimelineGraph,
  // Add new exports
  getPuzzlesWithWarnings,
  getElementsWithWarnings,
};

const getPuzzleFlow = catchAsync(async (req, res) => {
  const { id: puzzleId } = req.params;
  const cacheKey = makeCacheKey('puzzle-flow-v1', { id: puzzleId });
  const cachedData = notionCache.get(cacheKey);

  if (cachedData) {
    console.log(`[CACHE HIT] ${cacheKey} (Puzzle Flow)`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  console.log(`[CACHE MISS] ${cacheKey} (Puzzle Flow)`);

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
    if (!page || !page.id) continue;
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
        console.warn(`[getPuzzleFlow] Could not determine type for related page ${page.id}`);
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
      basicType: fullEl?.basicType || 'Unknown',
      // Future: Add sourcePuzzleName if element is a reward from another puzzle
    };
  };

  const formatPuzzle = (pzStub) => {
    const fullPz = mappedRelatedEntities.get(pzStub.id);
    return {
      id: pzStub.id,
      name: fullPz?.puzzle || pzStub.name || 'Unknown Puzzle', // Use full name if available
      type: 'Puzzle',
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
    prerequisitePuzzles,
  };

  notionCache.set(cacheKey, flowData);
  console.log(`[CACHE SET] ${cacheKey} (Puzzle Flow for ${centralPuzzle.puzzle})`);
  setCacheHeaders(res);
  res.json(flowData);
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
  getTimelineGraph,
  getPuzzlesWithWarnings,
  getElementsWithWarnings,
  getPuzzleFlow,
  getAllCharactersWithSociogramData,
  getCharactersWithWarnings,
  // Add new export for unique narrative threads
  getAllUniqueNarrativeThreads,
};

const getAllUniqueNarrativeThreads = catchAsync(async (req, res) => {
  const cacheKey = makeCacheKey('unique-narrative-threads-v1');
  const cachedData = notionCache.get(cacheKey);
  if (cachedData) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  console.log(`[CACHE MISS] ${cacheKey}`);

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
    ...timelineEventPages,
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
      ...mappedEvents,
  ];

  allMappedItems.forEach(item => {
    if (item && item.narrativeThreads && Array.isArray(item.narrativeThreads)) {
      item.narrativeThreads.forEach(thread => allThreads.add(thread));
    }
  });

  const sortedThreads = Array.from(allThreads).sort();

  notionCache.set(cacheKey, sortedThreads);
  console.log(`[CACHE SET] ${cacheKey} - Found ${sortedThreads.length} unique narrative threads.`);
  setCacheHeaders(res);
  res.json(sortedThreads);
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
  getTimelineGraph,
  getPuzzlesWithWarnings,
  getElementsWithWarnings,
  getPuzzleFlow,
  getAllCharactersWithSociogramData,
  getCharactersWithWarnings,
  getAllUniqueNarrativeThreads, // Ensure this is in the final export
  getPuzzleFlowGraph, // Added new controller
};

const getPuzzleFlowGraph = catchAsync(async (req, res) => {
  const { id: puzzleId } = req.params;
  // const depth = parseInt(req.query.depth || '1', 10); // Depth parameter for future expansion
  const cacheKey = makeCacheKey('puzzle-flow-graph-v1', { id: puzzleId });
  const cachedData = notionCache.get(cacheKey);

  if (cachedData) {
    console.log(`[CACHE HIT] ${cacheKey} (Puzzle Flow Graph)`);
    setCacheHeaders(res);
    return res.json(cachedData);
  }
  console.log(`[CACHE MISS] ${cacheKey} (Puzzle Flow Graph)`);

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
          ...customProps,
        }
      };
      nodes.push(node);
      addedNodeIds.add(entity.id);
      return node;
    };

    const addEdge = (sourceNode, targetNode, label, type, customData = {}) => {
      if (!sourceNode || !targetNode) return;
      edges.push({
        id: `edge-${sourceNode.id}-${targetNode.id}-${type}-${Math.random().toString(16).slice(2,8)}`,
        source: sourceNode.id,
        target: targetNode.id,
        label: label, // simple label
        data: {
          shortLabel: label, // concise label for on-path
          contextualLabel: `${sourceNode.name} (${sourceNode.type}) ${label} ${targetNode.name} (${targetNode.type})`,
          type: type, // e.g., REQUIRES, REWARDS
          ...customData,
        }
      });
    };

    // Add central puzzle node
    const centralPuzzleNode = addNode(centralPuzzle, 'Puzzle', {
        timing: centralPuzzle.timing,
        ownerName: centralPuzzle.owner?.[0]?.name, // Assuming owner is an array
        storyRevealSnippet: createSnippet(centralPuzzle.storyReveals),
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
        properties: centralPuzzle, // Full mapped properties of the central puzzle
      },
      nodes,
      edges,
    };

    notionCache.set(cacheKey, graphData);
    console.log(`[CACHE SET] ${cacheKey} (Puzzle Flow Graph for ${centralPuzzle.puzzle})`);
    setCacheHeaders(res);
    res.json(graphData);

  } catch (error) {
    console.error(`Error generating puzzle flow graph for ID ${puzzleId}:`, error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to generate puzzle flow graph' });
    }
  }
});