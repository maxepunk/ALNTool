/**
 * Utility functions for creating contextual relationship data for different entity types and view modes
 */
import { MarkerType } from '@xyflow/react';

import logger from '../../utils/logger';
/**
 * Creates a node object for the React Flow graph
 */
const createNode = (entity, type, isCenter = false, isSecondary = false, options = {}) => {
  if (!entity || !entity.id) {
    logger.warn('Attempted to create node with invalid entity', entity);
    return null;
  }
  
  const baseNodeData = {
    id: isCenter ? entity.id : `${type}-${entity.id}`,
    type: isSecondary ? 'secondaryNode' : 'entityNode',
    data: {
      label: entity.name || entity.description || entity.puzzle || `Unnamed ${type}`,
      type: type,
      id: entity.id,
      isCenter: isCenter,
      properties: entity,
      ...options
    },
    // Position will be set by layout algorithm
    position: { x: 0, y: 0 }
  };
  
  if (isCenter) {
    baseNodeData.style = { zIndex: 100 }; // Ensure center node is on top
  }
  
  if (!isCenter) {
    baseNodeData.data.route = `/${type.toLowerCase()}s/${entity.id}`;
  }
  
  return baseNodeData;
};

/**
 * Creates an edge between two nodes in the graph
 */
const createEdge = (sourceId, targetId, label, options = {}) => {
  // Only keep relationType from options for now, if used
  const { relationType = null } = options;
  
  // Basic ID generation
  const safeLabel = label ? label.replace(/\s+/g, '') : 'related';
  const edgeId = `edge-${sourceId}-${targetId}-${safeLabel}`;
  
  // Return only the essential structure + label + optional relationType data
  return {
    id: edgeId,
    source: sourceId,
    target: targetId,
    label: label, // Label is still needed for getEdgeType later
    // Remove: type, animated, style, labelStyle, labelBg*, markerEnd
    // Keep relationType in data if it was passed
    data: { relationType }
  };
};

// Remove getDirectRelationships, getCharacterFocusedRelationships, getPuzzleFocusedRelationships, getElementFocusedRelationships, getTimelineFocusedRelationships, and getContextualRelationships
// Only keep createNode and createEdge if used elsewhere 