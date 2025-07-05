/**
 * Data Transformation Utilities
 * 
 * Centralizes data transformations between API responses and UI components
 * Following Single Responsibility Principle and DRY
 */

import logger from './logger';

/**
 * Transform element from API format to UI format
 * Handles the difference between Notion API response and expected UI structure
 * 
 * @param {Object} apiElement - Element from API response
 * @returns {Object} Transformed element with normalized fields
 */
export function transformElement(apiElement) {
  if (!apiElement) return null;
  
  return {
    ...apiElement,
    // Extract owner_character_id from owner array
    owner_character_id: apiElement.owner?.[0]?.id || null,
    owner_character_name: apiElement.owner?.[0]?.name || null,
    // Map basicType to type for consistency
    type: apiElement.basicType || apiElement.type || 'element',
    // Extract container_element_id from container object
    container_element_id: apiElement.container?.[0]?.id || apiElement.container_element_id || null,
    // Ensure we have entityCategory
    entityCategory: 'element'
  };
}

/**
 * Transform multiple elements
 * @param {Array} elements - Array of elements from API
 * @returns {Array} Transformed elements
 */
export function transformElements(elements) {
  if (!Array.isArray(elements)) {
    logger.warn('transformElements: Expected array, got', typeof elements);
    return [];
  }
  
  return elements.map(transformElement).filter(Boolean);
}

/**
 * Transform character from API format to UI format
 * @param {Object} apiCharacter - Character from API response  
 * @returns {Object} Transformed character
 */
export function transformCharacter(apiCharacter) {
  if (!apiCharacter) return null;
  
  return {
    ...apiCharacter,
    entityCategory: 'character',
    type: 'character',
    // Ensure tier is present
    tier: apiCharacter.tier || 'Supporting'
  };
}

/**
 * Transform puzzle from API format to UI format
 * @param {Object} apiPuzzle - Puzzle from API response
 * @returns {Object} Transformed puzzle  
 */
export function transformPuzzle(apiPuzzle) {
  if (!apiPuzzle) return null;
  
  return {
    ...apiPuzzle,
    entityCategory: 'puzzle',
    type: 'puzzle',
    // Normalize required/reward element IDs
    requiredElements: apiPuzzle.required_elements || apiPuzzle.requiredElements || [],
    rewardIds: apiPuzzle.reward_ids || apiPuzzle.rewardIds || []
  };
}

/**
 * Transform timeline event from API format to UI format
 * @param {Object} apiEvent - Timeline event from API response
 * @returns {Object} Transformed timeline event
 */
export function transformTimelineEvent(apiEvent) {
  if (!apiEvent) return null;
  
  return {
    ...apiEvent,
    entityCategory: 'timeline_event',
    type: 'timeline_event',
    // Ensure description exists for label
    description: apiEvent.description || apiEvent.event || 'Timeline Event'
  };
}

/**
 * Create ownership edges from transformed elements
 * @param {Array} elements - Transformed elements with owner_character_id
 * @returns {Array} Edge objects for ReactFlow
 */
export function createOwnershipEdges(elements) {
  const edges = [];
  
  elements.forEach(element => {
    if (element.owner_character_id) {
      edges.push({
        id: `owner-${element.id}`,
        source: element.owner_character_id,
        target: element.id,
        type: 'smoothstep',
        animated: false,
        data: {
          type: 'character-element-ownership'
        },
        style: {
          stroke: '#10b981',
          strokeWidth: 2,
          strokeDasharray: '5,5'
        }
      });
    }
  });
  
  return edges;
}

/**
 * Create container edges from transformed elements
 * @param {Array} elements - Transformed elements with container_element_id
 * @returns {Array} Edge objects for ReactFlow
 */
export function createContainerEdges(elements) {
  const edges = [];
  
  elements.forEach(element => {
    if (element.container_element_id) {
      edges.push({
        id: `container-${element.id}`,
        source: element.container_element_id,
        target: element.id,
        type: 'smoothstep',
        animated: false,
        data: {
          type: 'element-element-container'
        },
        style: {
          stroke: '#64748b',
          strokeWidth: 1.5
        }
      });
    }
  });
  
  return edges;
}

/**
 * Create puzzle relationship edges
 * @param {Array} puzzles - Transformed puzzles
 * @returns {Array} Edge objects for ReactFlow
 */
export function createPuzzleEdges(puzzles) {
  const edges = [];
  
  puzzles.forEach(puzzle => {
    // Reward edges
    if (puzzle.rewardIds?.length > 0) {
      puzzle.rewardIds.forEach(rewardId => {
        edges.push({
          id: `reward-${puzzle.id}-${rewardId}`,
          source: puzzle.id,
          target: rewardId,
          type: 'smoothstep',
          animated: false,
          data: {
            type: 'puzzle-element-reward'
          },
          style: {
            stroke: '#f59e0b',
            strokeWidth: 2,
            strokeDasharray: '3,3'
          }
        });
      });
    }
    
    // Requirement edges
    if (puzzle.requiredElements?.length > 0) {
      puzzle.requiredElements.forEach(reqId => {
        edges.push({
          id: `requires-${puzzle.id}-${reqId}`,
          source: reqId,
          target: puzzle.id,
          type: 'smoothstep',
          animated: true,
          data: {
            type: 'element-puzzle-requirement'
          },
          style: {
            stroke: '#ef4444',
            strokeWidth: 1.5
          }
        });
      });
    }
  });
  
  return edges;
}

/**
 * Group elements by owner for meaningful aggregation
 * @param {Array} elements - Transformed elements
 * @param {Array} characters - Character list for name lookup
 * @returns {Object} Elements grouped by owner
 */
export function groupElementsByOwner(elements, characters) {
  const groups = {};
  
  elements.forEach(element => {
    const ownerKey = element.owner_character_id || 'unowned';
    
    if (!groups[ownerKey]) {
      const owner = characters?.find(c => c.id === ownerKey);
      groups[ownerKey] = {
        ownerId: ownerKey,
        ownerName: owner?.name || 'Unowned',
        elements: []
      };
    }
    
    groups[ownerKey].elements.push(element);
  });
  
  return groups;
}