/**
 * Graph processing utilities
 * Handles node and edge processing for AdaptiveGraphCanvas
 */

import { 
  getConnectedEntities, 
  calculateVisualProperties,
  calculateEdgeVisualProperties
} from './visualHierarchyUtils';

/**
 * Process nodes with visual hierarchy based on selection
 */
export const processNodes = (graphData, selectedEntity, focusMode) => {
  // If no nodes, return empty
  if (!graphData.nodes || graphData.nodes.length === 0) {
    return [];
  }
  
  // Get connected entities if something is selected
  let connected = new Set();
  let secondaryConnected = new Set();
  
  if (selectedEntity && focusMode !== 'overview') {
    const characterConnections = graphData.edges?.filter(e => 
      e.data?.type === 'character-character'
    ) || [];
    
    const connections = getConnectedEntities(
      selectedEntity, 
      graphData.nodes, 
      characterConnections
    );
    connected = connections.connected;
    secondaryConnected = connections.secondaryConnected;
  }
  
  // Process all nodes with visual properties
  return graphData.nodes.map(node => {
    const visualProps = calculateVisualProperties(
      node,
      selectedEntity,
      connected,
      secondaryConnected
    );
    
    // Preserve the original node structure and type
    return {
      ...node,
      // Preserve the exact node type - no fallback
      type: node.type,
      // Apply visual state through data for custom nodes to use
      data: {
        ...node.data,
        visualState: visualProps
      },
      // Apply z-index through style for ReactFlow
      style: {
        ...node.style,
        zIndex: visualProps.zIndex
      }
    };
  });
};

/**
 * Process edges with visual hierarchy based on selection
 */
export const processEdges = (graphData, processedNodes, selectedEntity, focusMode) => {
  if (!graphData.edges || graphData.edges.length === 0) {
    return [];
  }
  
  // In overview mode, all edges are visible
  if (!selectedEntity || focusMode === 'overview') {
    return graphData.edges.map(edge => ({
      ...edge,
      style: {
        ...edge.style,
        opacity: edge.style?.opacity || 0.6
      }
    }));
  }
  
  // In focus mode, highlight relevant edges
  const relevantNodes = new Set();
  processedNodes.forEach(node => {
    if (node.data.visualState.isSelected || 
        node.data.visualState.isConnected || 
        node.data.visualState.isSecondaryConnected) {
      relevantNodes.add(node.id);
    }
  });
  
  return graphData.edges.map(edge => {
    const edgeVisualProps = calculateEdgeVisualProperties(
      edge,
      relevantNodes,
      selectedEntity.id
    );
    
    return {
      ...edge,
      style: {
        ...edge.style,
        opacity: edgeVisualProps.opacity,
        strokeWidth: edgeVisualProps.strokeWidth
      }
    };
  });
};

/**
 * Get node color based on entity type
 */
export const getNodeColor = (node) => {
  const entityType = node.data?.entityCategory || node.type;
  switch (entityType) {
    case 'character': return '#2196f3';
    case 'element': return '#ff9800';
    case 'puzzle': return '#4caf50';
    case 'timeline_event': return '#9c27b0';
    default: return '#ccc';
  }
};