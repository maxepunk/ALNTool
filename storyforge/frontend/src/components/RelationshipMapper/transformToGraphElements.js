/**
 * transformToGraphElements.js
 * Pure function to transform raw Notion/BFF entity data or BFF-precomputed graph data
 * into React Flow-compatible nodes and edges for the RelationshipMapper.
 *
 * @param {Object} options
 *   - entityType: string (e.g., 'Character', 'Element', etc.)
 *   - entityId: string (ID of the central entity)
 *   - entityName: string (optional, for labeling)
 *   - rawData: object (Notion/BFF entity data, optional)
 *   - graphData: object (BFF-precomputed graph, optional)
 *   - viewMode: string (optional, for future expansion)
 * @returns {Object} { nodes: Array, edges: Array }
 */
import { MarkerType } from '@xyflow/react';

// Define edge styles based on relationship type (can be moved/shared later)
const edgeStyles = {
  dependency: { // For puzzles, requirements, rewards
    stroke: '#f57c00', // Orange
    strokeWidth: 2.2,
    animated: true,
  },
  containment: { // For elements inside other elements
    stroke: '#03a9f4', // Light Blue
    strokeWidth: 1.5,
    strokeDasharray: '5, 5',
  },
  character: { // For character involvement/ownership
    stroke: '#3f51b5', // Indigo
    strokeWidth: 1.8,
  },
  timeline: { // For links to timeline events
    stroke: '#d81b60', // Pink
    strokeWidth: 1.8,
  },
  association: { // Generic association
    stroke: '#4caf50', // Green
    strokeWidth: 1.5,
  },
  default: {
    stroke: '#90a4ae', // Grey
    strokeWidth: 1.2,
  },
};

// Function to determine edge category based on relationType passed to addEdge
// Note: 'nodes' argument is not available here directly like in useGraphTransform's getEdgeType.
// We are relying on the 'relationType' passed to addEdge.
const determineEdgeCategory = (relationType) => {
  const type = relationType?.toLowerCase() || '';
  if (type === 'dependency') return 'dependency';
  if (type === 'containment') return 'containment';
  if (type === 'character') return 'character';
  if (type === 'timeline') return 'timeline';
  if (type === 'association') return 'association';
  return 'default';
};

function transformToGraphElements({ entityType, entityId, entityName, rawData, graphData, viewMode = 'default' }) {
  // --- Helper: Map BFF graph data to React Flow format ---
  if (graphData && Array.isArray(graphData.nodes) && Array.isArray(graphData.edges)) {
    const mapNode = (n, isCenter = false) => ({
      id: n.id,
      type: 'entityNode',
      position: { x: 0, y: 0 },
      data: {
        label: n.name || n.description || n.puzzle || 'Unnamed',
        type: n.type,
        id: n.id,
        isCenter,
        route: isCenter ? undefined : `/${n.type?.toLowerCase()}s/${n.id}`,
        properties: n,
      },
      ...(isCenter ? { style: { zIndex: 100 } } : {}),
    });
    let nodes = graphData.nodes.map((node) => mapNode(node, node.id === entityId));
    if (!nodes.find((n) => n.id === entityId) && graphData.center) {
      nodes.push(mapNode(graphData.center, true));
    }
    const baseNodesForEdgeType = nodes;
    const edges = graphData.edges.map((e, idx) => {
      // Standardize edge type for filtering/styling
      const label = e.label?.toLowerCase() || '';
      let edgeType = 'default';
      if (label.includes('puzzle') || label.includes('required') || label.includes('reward') || label.includes('lock')) edgeType = 'dependency';
      else if (label.includes('contain') || label.includes('inside')) edgeType = 'containment';
      else if (baseNodesForEdgeType.find(n => n.id === e.source)?.data?.type === 'Character' || baseNodesForEdgeType.find(n => n.id === e.target)?.data?.type === 'Character') edgeType = 'character';
      else if (baseNodesForEdgeType.find(n => n.id === e.source)?.data?.type === 'Timeline' || baseNodesForEdgeType.find(n => n.id === e.target)?.data?.type === 'Timeline') edgeType = 'timeline';
      
      const style = { ...(edgeStyles[edgeType] || edgeStyles.default) }; // Use defined styles

      return {
        id: e.id || `edge-${idx}`,
        source: e.source,
        target: e.target,
        label: e.label || '',
        type: 'custom',
        animated: style.animated || false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 15,
          height: 15,
          color: style.stroke || edgeStyles.default.stroke,
        },
        style: { 
          strokeWidth: style.strokeWidth || edgeStyles.default.strokeWidth, 
          stroke: style.stroke || edgeStyles.default.stroke,
          strokeDasharray: style.strokeDasharray,
        },
        data: { 
          ...(e.data || {}), // Spread the original data from BFF first
          type: edgeType      // Add/overwrite with the locally determined edgeType for styling
        },
      };
    });
    return { nodes, edges };
  }

  // If graphData is not valid or not provided, return empty.
  return { nodes: [], edges: [] };
}

export default transformToGraphElements; 