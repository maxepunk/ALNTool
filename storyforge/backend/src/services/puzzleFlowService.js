const notionService = require('./notionService');
const propertyMapper = require('../utils/notionPropertyMapper');
const logger = require('../utils/logger');
const { createSnippet } = require('../utils/controllerUtils');

/**
 * Formats an element stub into a consistent structure
 */
function formatElement(elStub, mappedRelatedEntities) {
  const fullEl = mappedRelatedEntities.get(elStub.id);
  return {
    id: elStub.id,
    name: fullEl?.name || elStub.name || 'Unknown Element',
    type: 'Element',
    basicType: fullEl?.basicType || 'Unknown'
  };
}

/**
 * Formats a puzzle stub into a consistent structure
 */
function formatPuzzle(pzStub, mappedRelatedEntities) {
  const fullPz = mappedRelatedEntities.get(pzStub.id);
  return {
    id: pzStub.id,
    name: fullPz?.puzzle || pzStub.name || 'Unknown Puzzle',
    type: 'Puzzle'
  };
}

/**
 * Fetches and processes puzzle flow data
 */
async function getPuzzleFlowData(puzzleId) {
  const puzzlePage = await notionService.getPage(puzzleId);
  if (!puzzlePage) {
    throw new Error('Puzzle not found');
  }

  const centralPuzzle = await propertyMapper.mapPuzzleWithNames(puzzlePage, notionService);
  if (centralPuzzle.error) {
    throw new Error(`Failed to map central puzzle data: ${centralPuzzle.error}`);
  }

  const relatedEntityIds = new Set();
  (centralPuzzle.puzzleElements || []).forEach(el => relatedEntityIds.add(el.id));
  (centralPuzzle.rewards || []).forEach(el => relatedEntityIds.add(el.id));
  (centralPuzzle.subPuzzles || []).forEach(p => relatedEntityIds.add(p.id));
  (centralPuzzle.parentItem || []).forEach(p => relatedEntityIds.add(p.id));
  (centralPuzzle.lockedItem || []).forEach(el => relatedEntityIds.add(el.id));

  const relatedPages = await notionService.getPagesByIds(Array.from(relatedEntityIds));
  const mappedRelatedEntities = new Map();

  for (const page of relatedPages) {
    if (!page || !page.id) {
      continue;
    }
    let mappedEntity;
    if (page.properties.Puzzle) {
      mappedEntity = await propertyMapper.mapPuzzleWithNames(page, notionService);
    } else if (page.properties.Name) {
      mappedEntity = await propertyMapper.mapElementWithNames(page, notionService);
    } else {
      logger.warn(`[getPuzzleFlow] Could not determine type for related page ${page.id}`);
      continue;
    }

    if (mappedEntity && !mappedEntity.error) {
      mappedRelatedEntities.set(page.id, mappedEntity);
    }
  }

  const inputElements = (centralPuzzle.puzzleElements || []).map(el => formatElement(el, mappedRelatedEntities));
  const outputElements = (centralPuzzle.rewards || []).map(el => formatElement(el, mappedRelatedEntities));
  
  // Add locked items to outputs
  (centralPuzzle.lockedItem || []).forEach(itemStub => {
    const fullItem = mappedRelatedEntities.get(itemStub.id);
    if (fullItem && fullItem.basicType) {
      const formattedItem = formatElement(itemStub, mappedRelatedEntities);
      if (!outputElements.find(o => o.id === formattedItem.id)) {
        outputElements.push(formattedItem);
      }
    }
  });

  const unlocksPuzzles = (centralPuzzle.subPuzzles || []).map(pz => formatPuzzle(pz, mappedRelatedEntities));
  const prerequisitePuzzles = (centralPuzzle.parentItem || []).map(pz => formatPuzzle(pz, mappedRelatedEntities));

  return {
    centralPuzzle: {
      id: centralPuzzle.id,
      name: centralPuzzle.puzzle,
      type: 'Puzzle',
      properties: centralPuzzle
    },
    inputElements,
    outputElements,
    unlocksPuzzles,
    prerequisitePuzzles
  };
}

/**
 * Builds a graph structure for puzzle flow visualization
 */
async function buildPuzzleFlowGraph(puzzleId) {
  const { centralPuzzle, mappedRelatedEntities } = await notionService.fetchPuzzleFlowDataStructure(puzzleId);

  const nodes = [];
  const edges = [];
  const addedNodeIds = new Set();

  const addNode = (entity, entityType, customProps = {}) => {
    if (!entity || !entity.id || addedNodeIds.has(entity.id)) {
      return;
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
      label: label,
      data: {
        shortLabel: label,
        contextualLabel: `${sourceNode.name} (${sourceNode.type}) ${label} ${targetNode.name} (${targetNode.type})`,
        type: type,
        ...customData
      }
    });
  };

  // Add central puzzle node
  const centralPuzzleNode = addNode(centralPuzzle, 'Puzzle', {
    timing: centralPuzzle.timing,
    ownerName: centralPuzzle.owner?.[0]?.name,
    storyRevealSnippet: createSnippet(centralPuzzle.storyReveals)
  });

  // Process all related entities
  const entityProcessors = [
    { 
      collection: centralPuzzle.puzzleElements || [], 
      handler: (elStub) => {
        const element = mappedRelatedEntities.get(elStub.id);
        if (element) {
          const elementNode = addNode(element, 'Element', { isInput: true, basicType: element.basicType });
          addEdge(elementNode, centralPuzzleNode, 'inputTo', 'REQUIRES');
        }
      }
    },
    {
      collection: centralPuzzle.rewards || [],
      handler: (elStub) => {
        const element = mappedRelatedEntities.get(elStub.id);
        if (element) {
          const elementNode = addNode(element, 'Element', { isOutput: true, basicType: element.basicType });
          addEdge(centralPuzzleNode, elementNode, 'rewards', 'REWARDS');
        }
      }
    },
    {
      collection: centralPuzzle.lockedItem || [],
      handler: (elStub) => {
        const element = mappedRelatedEntities.get(elStub.id);
        if (element) {
          const elementNode = addNode(element, 'Element', { isOutput: true, basicType: element.basicType, isLockedItem: true });
          addEdge(centralPuzzleNode, elementNode, 'unlocksItem', 'UNLOCKS_ITEM');
        }
      }
    },
    {
      collection: centralPuzzle.parentItem || [],
      handler: (parentPzStub) => {
        const parentPuzzle = mappedRelatedEntities.get(parentPzStub.id);
        if (parentPuzzle) {
          const parentPuzzleNode = addNode(parentPuzzle, 'Puzzle', {timing: parentPuzzle.timing, ownerName: parentPuzzle.owner?.[0]?.name});
          addEdge(parentPuzzleNode, centralPuzzleNode, 'unlocks', 'UNLOCKS_PUZZLE');
        }
      }
    },
    {
      collection: centralPuzzle.subPuzzles || [],
      handler: (subPzStub) => {
        const subPuzzle = mappedRelatedEntities.get(subPzStub.id);
        if (subPuzzle) {
          const subPuzzleNode = addNode(subPuzzle, 'Puzzle', {timing: subPuzzle.timing, ownerName: subPuzzle.owner?.[0]?.name});
          addEdge(centralPuzzleNode, subPuzzleNode, 'leadsTo', 'LEADS_TO_PUZZLE');
        }
      }
    },
    {
      collection: centralPuzzle.owner || [],
      handler: (ownerStub) => {
        const owner = mappedRelatedEntities.get(ownerStub.id);
        if (owner) {
          const ownerNode = addNode(owner, 'Character');
          addEdge(ownerNode, centralPuzzleNode, 'owns', 'OWNS_PUZZLE');
        }
      }
    }
  ];

  // Process all entity types
  entityProcessors.forEach(({ collection, handler }) => {
    collection.forEach(handler);
  });

  return {
    center: {
      id: centralPuzzle.id,
      name: centralPuzzle.puzzle,
      type: 'Puzzle'
    },
    nodes,
    edges
  };
}

module.exports = {
  getPuzzleFlowData,
  buildPuzzleFlowGraph
};