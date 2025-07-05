/**
 * API Response Transformers
 * 
 * Transforms API responses at the service layer
 * This ensures consistent data format throughout the application
 */

import { transformElements, transformCharacter, transformPuzzle, transformTimelineEvent } from '../utils/dataTransformers';
import logger from '../utils/logger';

/**
 * Transform elements API response
 * @param {Object} response - Raw API response
 * @returns {Array} Transformed elements
 */
export function transformElementsResponse(response) {
  const rawElements = response.data || response;
  
  if (!Array.isArray(rawElements)) {
    logger.warn('transformElementsResponse: Expected array, got', typeof rawElements);
    return [];
  }
  
  return transformElements(rawElements);
}

/**
 * Transform characters API response
 * @param {Object} response - Raw API response
 * @returns {Array} Transformed characters
 */
export function transformCharactersResponse(response) {
  const rawCharacters = response.data || response;
  
  if (!Array.isArray(rawCharacters)) {
    logger.warn('transformCharactersResponse: Expected array, got', typeof rawCharacters);
    return [];
  }
  
  return rawCharacters.map(transformCharacter).filter(Boolean);
}

/**
 * Transform puzzles API response
 * @param {Object} response - Raw API response
 * @returns {Array} Transformed puzzles
 */
export function transformPuzzlesResponse(response) {
  const rawPuzzles = response.data || response;
  
  if (!Array.isArray(rawPuzzles)) {
    logger.warn('transformPuzzlesResponse: Expected array, got', typeof rawPuzzles);
    return [];
  }
  
  return rawPuzzles.map(transformPuzzle).filter(Boolean);
}

/**
 * Transform timeline events API response
 * @param {Object} response - Raw API response
 * @returns {Array} Transformed timeline events
 */
export function transformTimelineEventsResponse(response) {
  const rawEvents = response.data || response;
  
  if (!Array.isArray(rawEvents)) {
    logger.warn('transformTimelineEventsResponse: Expected array, got', typeof rawEvents);
    return [];
  }
  
  return rawEvents.map(transformTimelineEvent).filter(Boolean);
}

/**
 * Transform character journey API response
 * @param {Object} response - Raw API response
 * @returns {Object} Transformed journey data
 */
export function transformJourneyResponse(response) {
  const rawData = response.data || response;
  
  // Journey data has a specific structure with graph nodes/edges
  if (!rawData.graph) {
    logger.warn('transformJourneyResponse: Missing graph data');
    return rawData;
  }
  
  // Map backend node types to frontend types
  const transformedNodes = rawData.graph.nodes.map(node => {
    let mappedType = node.type;
    
    // Backend compatibility mapping
    if (node.type === 'loreNode') {
      mappedType = 'timeline_event';
    } else if (node.type === 'discoveryNode') {
      mappedType = 'element';
    } else if (node.type === 'activityNode') {
      mappedType = 'puzzle';
    }
    
    return {
      ...node,
      type: mappedType,
      data: {
        ...node.data,
        entityCategory: mappedType
      }
    };
  });
  
  return {
    ...rawData,
    graph: {
      ...rawData.graph,
      nodes: transformedNodes
    }
  };
}