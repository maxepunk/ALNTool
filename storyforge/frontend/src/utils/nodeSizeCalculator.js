/**
 * Calculate dynamic node sizes based on entity type and importance metrics
 * Follows the sizing heuristics defined in Phase 1 planning
 */

import logger from './logger';

// Base sizes for each entity type
const BASE_SIZES = {
  character: 100,
  element: 90, // All elements same size for now
  puzzle: 90,
  timeline_event: 100,
  aggregated: 100 // For aggregated nodes
};

// Size limits to prevent extreme variations
const SIZE_LIMITS = {
  character: { min: 100, max: 180 },
  element: { min: 90, max: 90 }, // Fixed size for now
  puzzle: { min: 90, max: 150 },
  timeline_event: { min: 100, max: 130 },
  aggregated: { min: 100, max: 120 }
};

/**
 * Calculate size for a character node
 * @param {Object} nodeData - The node data object
 * @returns {number} - The calculated size in pixels
 */
function calculateCharacterSize(nodeData) {
  let size = BASE_SIZES.character;
  
  // Tier multiplier
  const tier = nodeData.tier?.toLowerCase();
  if (tier === 'core') {
    size *= 1.4;
  } else if (tier === 'tier 2') {
    size *= 1.2;
  } // Tier 3 is 1.0x (no change)
  
  // Relationship bonus: +2px per relationship (capped at +40px)
  const relationshipCount = nodeData.relationshipCount || 0;
  const relationshipBonus = Math.min(relationshipCount * 2, 40);
  size += relationshipBonus;
  
  // Apply limits
  return Math.max(
    SIZE_LIMITS.character.min,
    Math.min(SIZE_LIMITS.character.max, size)
  );
}

/**
 * Calculate size for an element node
 * Currently fixed size, but structure allows for future economy-based sizing
 * @param {Object} nodeData - The node data object
 * @returns {number} - The calculated size in pixels
 */
function calculateElementSize(nodeData) {
  // Fixed size for now as requested
  return BASE_SIZES.element;
  
  // Future economy-based sizing could use:
  // const memoryValue = nodeData.calculated_memory_value || nodeData.memory_value || 0;
  // const scaledValue = Math.log10(Math.max(1, memoryValue)) * 20;
  // return BASE_SIZES.element + scaledValue;
}

/**
 * Calculate size for a puzzle node
 * @param {Object} nodeData - The node data object
 * @returns {number} - The calculated size in pixels
 */
function calculatePuzzleSize(nodeData) {
  let size = BASE_SIZES.puzzle;
  
  // Reward count bonus: +10px per reward (capped at +40px)
  const rewardCount = nodeData.rewardIds?.length || nodeData.rewards?.length || 0;
  const rewardBonus = Math.min(rewardCount * 10, 40);
  size += rewardBonus;
  
  // Collaboration bonus: +10px if multiple owners
  const ownerCount = nodeData.owner?.length || 0;
  if (ownerCount > 1) {
    size += 10;
  }
  
  // Complexity bonus: +5px per required element (capped at +20px)
  const requiredElementCount = nodeData.puzzleElements?.length || nodeData.requiredElements?.length || 0;
  const complexityBonus = Math.min(requiredElementCount * 5, 20);
  size += complexityBonus;
  
  // Apply limits
  return Math.max(
    SIZE_LIMITS.puzzle.min,
    Math.min(SIZE_LIMITS.puzzle.max, size)
  );
}

/**
 * Calculate size for a timeline event node
 * @param {Object} nodeData - The node data object
 * @returns {number} - The calculated size in pixels
 */
function calculateTimelineEventSize(nodeData) {
  let size = BASE_SIZES.timeline_event;
  
  // Character involvement: +5px per character (capped at +30px)
  const characterCount = nodeData.charactersInvolved?.length || 0;
  const characterBonus = Math.min(characterCount * 5, 30);
  size += characterBonus;
  
  // No act multiplier as requested
  
  // Apply limits
  return Math.max(
    SIZE_LIMITS.timeline_event.min,
    Math.min(SIZE_LIMITS.timeline_event.max, size)
  );
}

/**
 * Main function to calculate node size based on entity type
 * @param {Object} node - The ReactFlow node object
 * @returns {number} - The calculated size in pixels
 */
export function calculateNodeSize(node) {
  const entityCategory = node.data?.entityCategory || node.type;
  
  switch (entityCategory) {
    case 'character':
      return calculateCharacterSize(node.data);
    case 'element':
      return calculateElementSize(node.data);
    case 'puzzle':
      return calculatePuzzleSize(node.data);
    case 'timeline_event':
      return calculateTimelineEventSize(node.data);
    case 'aggregated':
      // Aggregated nodes have fixed size
      return BASE_SIZES.aggregated;
    default:
      // Default to base size if type unknown
      return 100;
  }
}

/**
 * Get collision radius for force simulation based on node size
 * Adds padding to prevent overlap
 * @param {Object} node - The simulation node object
 * @returns {number} - The collision radius in pixels
 */
export function getCollisionRadius(node) {
  // For simulation nodes, we need to check the entityCategory field
  const entityCategory = node.entityCategory || 'unknown';
  
  // Get base size for the entity type
  let baseSize = BASE_SIZES[entityCategory] || 100;
  
  // For aggregated nodes, use their fixed size
  if (node.isAggregated) {
    return 50; // 100px diameter / 2 + padding
  }
  
  // For regular nodes, we need to estimate size since we don't have full data in simulation
  // Use a conservative estimate based on entity type
  switch (entityCategory) {
    case 'character':
      // Characters can be up to 180px, so use larger collision radius
      return 90; // Max radius
    case 'element':
      // Elements are fixed at 90px
      return 45; // 90px diameter / 2
    case 'puzzle':
      // Puzzles can be up to 150px
      return 75; // Max radius
    case 'timeline_event':
      // Timeline events can be up to 130px
      return 65; // Max radius
    default:
      return 50; // Default radius
  }
}

/**
 * Calculate edge styling based on type and strength
 * @param {Object} edge - The edge object
 * @returns {Object} - Style object for the edge with metadata
 */
export function calculateEdgeStyle(edge) {
  const baseStyle = {
    stroke: '#64748b', // Default gray
    strokeWidth: 1,
    opacity: 0.6
  };
  
  // Track metadata about how we determined the edge type
  const metadata = {
    inferredType: null,
    inferenceSource: null,
    originalType: edge.data?.type || edge.type || edge.label
  };
  
  // Get edge type from various possible locations
  const edgeType = edge.data?.type || edge.type || edge.label;
  
  // Set color based on edge type or label
  switch (edgeType) {
    // Character relationships
    case 'character-character':
    case 'computed': // From character-links API
    case 'knows':
    case 'related':
      baseStyle.stroke = '#10b981'; // Green
      break;
      
    // Ownership/possession
    case 'character-element':
    case 'owns':
    case 'has':
    case 'possesses':
      baseStyle.stroke = '#10b981'; // Green
      break;
      
    // Puzzle relationships
    case 'element-puzzle':
    case 'unlocks':
    case 'requires':
    case 'rewards':
      baseStyle.stroke = '#f59e0b'; // Orange
      break;
      
    // Timeline relationships
    case 'timeline':
    case 'reveals':
    case 'happens':
      baseStyle.stroke = '#6366f1'; // Purple
      break;
      
    // Container relationships
    case 'contains':
    case 'inside':
      baseStyle.stroke = '#06b6d4'; // Cyan
      break;
      
    // Default for unknown types
    default:
      // Try to infer from edge label
      if (edge.label) {
        if (edge.label.includes('unlock') || edge.label.includes('reward')) {
          baseStyle.stroke = '#f59e0b'; // Orange for puzzle-related
          metadata.inferredType = 'puzzle-relationship';
          metadata.inferenceSource = `label contains '${edge.label.includes('unlock') ? 'unlock' : 'reward'}'`;
        } else if (edge.label.includes('own') || edge.label.includes('has')) {
          baseStyle.stroke = '#10b981'; // Green for ownership
          metadata.inferredType = 'ownership';
          metadata.inferenceSource = `label contains '${edge.label.includes('own') ? 'own' : 'has'}'`;
        } else if (edge.label.includes('contain')) {
          baseStyle.stroke = '#06b6d4'; // Cyan for containers
          metadata.inferredType = 'container';
          metadata.inferenceSource = `label contains 'contain'`;
        } else {
          metadata.inferredType = 'unknown';
          metadata.inferenceSource = `no matching pattern for label '${edge.label}'`;
        }
      } else {
        metadata.inferredType = 'unknown';
        metadata.inferenceSource = 'no type or label provided';
      }
      break;
  }
  
  // Get strength from various possible locations
  const strength = edge.data?.strength || edge.strength || edge.weight || 1;
  
  // Set width based on strength (1-5px range)
  baseStyle.strokeWidth = Math.min(5, Math.max(1, strength));
  
  // Set opacity based on strength (0.4-1.0 range)
  baseStyle.opacity = 0.4 + (Math.min(strength, 10) / 10) * 0.6;
  
  // Special styling for certain edge labels
  if (edge.label === 'rewards' || edge.animated) {
    baseStyle.strokeWidth = Math.max(2, baseStyle.strokeWidth);
  }
  
  // Apply any existing style overrides
  const finalStyle = {
    ...baseStyle,
    ...edge.style
  };
  
  // Add metadata as data attributes for debugging
  // These will be visible in React DevTools and browser inspector
  if (metadata.inferredType) {
    finalStyle['data-inferred-type'] = metadata.inferredType;
    finalStyle['data-inference-source'] = metadata.inferenceSource;
    finalStyle['data-original-type'] = metadata.originalType || 'none';
    
    // Log inference for debugging
    logger.debug('Edge type inferred:', {
      edgeId: edge.id,
      originalType: metadata.originalType,
      inferredType: metadata.inferredType,
      inferenceSource: metadata.inferenceSource,
      resultingColor: finalStyle.stroke
    });
  }
  
  return finalStyle;
}