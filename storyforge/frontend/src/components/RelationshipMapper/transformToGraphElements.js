import { MarkerType } from '@xyflow/react';

const edgeStyles = {
  dependency: { 
    stroke: '#f57c00', 
    strokeWidth: 2.2,
    animated: true,
  },
  containment: { 
    stroke: '#03a9f4', 
    strokeWidth: 1.5,
    strokeDasharray: '5, 5',
  },
  character: { 
    stroke: '#3f51b5', 
    strokeWidth: 1.8,
  },
  timeline: { 
    stroke: '#d81b60', 
    strokeWidth: 1.8,
  },
  association: { 
    stroke: '#4caf50', 
    strokeWidth: 1.5,
  },
  default: {
    stroke: '#90a4ae', 
    strokeWidth: 1.2,
  },
};

// Unused determineEdgeCategory function has been removed.

function transformToGraphElements({ entityType, entityId, entityName, rawData, graphData, viewMode = 'default' }) {
  if (graphData && Array.isArray(graphData.nodes) && Array.isArray(graphData.edges)) {
    const mapNode = (n, isCenter = false) => ({
      id: n.id,
      type: 'entityNode',
      position: { x: 0, y: 0 },
      width: isCenter ? 200 : 150, // Default width, can be overridden by layout
      height: isCenter ? 100 : 80, // Default height, can be overridden by layout
      data: {
        label: n.name || n.description || n.puzzle || 'Unnamed',
        name: n.name, // Preserve original name property
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
      const shortLabel = e.data?.shortLabel?.toLowerCase() || '';
      const originalLabel = e.label?.toLowerCase() || '';
      let edgeType = 'default';

      if (shortLabel === 'requires' || shortLabel === 'rewards' || shortLabel === 'required by' || shortLabel === 'reward from' || shortLabel === 'unlocks' || shortLabel === 'locked in' || shortLabel === 'has sub-puzzle' || shortLabel === 'sub-puzzle of') {
        edgeType = 'dependency';
      } else if (shortLabel === 'contains' || shortLabel === 'inside') {
        edgeType = 'containment';
      } else if (shortLabel === 'owns' || shortLabel === 'owned by' || shortLabel === 'associated with') {
        const sourceNodeType = baseNodesForEdgeType.find(n => n.id === e.source)?.data?.type;
        const targetNodeType = baseNodesForEdgeType.find(n => n.id === e.target)?.data?.type;
        if (sourceNodeType === 'Character' || targetNodeType === 'Character') {
            edgeType = 'character';
        } else {
            edgeType = 'association';
        }
      } else if (shortLabel === 'participates in' || shortLabel === 'involves' || shortLabel === 'appears in' || shortLabel === 'evidence for') {
        const sourceNodeType = baseNodesForEdgeType.find(n => n.id === e.source)?.data?.type;
        const targetNodeType = baseNodesForEdgeType.find(n => n.id === e.target)?.data?.type;
         if (sourceNodeType === 'Timeline' || targetNodeType === 'Timeline') {
            edgeType = 'timeline';
        } else {
            edgeType = 'association'; 
        }
      }
      else if (edgeType === 'default') { 
        if (originalLabel.includes('puzzle') || originalLabel.includes('required') || originalLabel.includes('reward') || originalLabel.includes('lock')) {
            edgeType = 'dependency';
        } else if (originalLabel.includes('contain') || originalLabel.includes('inside')) {
            edgeType = 'containment';
        } else {
            const sourceNodeType = baseNodesForEdgeType.find(n => n.id === e.source)?.data?.type;
            const targetNodeType = baseNodesForEdgeType.find(n => n.id === e.target)?.data?.type;
            if (sourceNodeType === 'Character' || targetNodeType === 'Character') {
                edgeType = 'character';
            } else if (sourceNodeType === 'Timeline' || targetNodeType === 'Timeline') {
                edgeType = 'timeline';
            }
        }
      }
      
      const style = { ...(edgeStyles[edgeType] || edgeStyles.default) };

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
          ...(e.data || {}),
          type: edgeType 
        },
      };
    });
    
    // Only filter out ALL edges if there are NO nodes at all
    // If there are some nodes, include all edges (even those pointing to missing nodes)
    const finalEdges = nodes.length === 0 ? [] : edges;
    
    return { nodes, edges: finalEdges };
  }

  return { nodes: [], edges: [] };
}

export default transformToGraphElements;
