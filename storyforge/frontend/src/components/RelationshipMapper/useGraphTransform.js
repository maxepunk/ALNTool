import { useMemo } from 'react';
import transformToGraphElements from './transformToGraphElements';
import { getCustomRadialLayout, getForceDirectedLayout, getDagreLayout } from './layoutUtils';
import filterGraph from './filterGraph';

// Helper: convert backend-pre-computed graph to ReactFlow-compatible
import { MarkerType } from '@xyflow/react';

// Define edge styles based on relationship type
const edgeStyles = {
  dependency: {
    stroke: '#f57c00', // Orange
    strokeWidth: 2.5, // Thicker
    animated: true,
  },
  containment: {
    stroke: '#03a9f4', // Light Blue (more distinct)
    strokeWidth: 1.5,
    strokeDasharray: '6, 4', // More obvious dash
  },
  character: {
    stroke: '#3f51b5', // Indigo
    strokeWidth: 1.5,
  },
  timeline: {
    stroke: '#d81b60', // Pink
    strokeWidth: 1.5,
  },
  default: {
    stroke: '#90a4ae', // Grey
    strokeWidth: 1, // Thinner default
  },
};

// Function to determine edge type based on label or node types (example)
const getEdgeType = (edge, nodes) => {
  const sourceNode = nodes.find(n => n.id === edge.source);
  const targetNode = nodes.find(n => n.id === edge.target);
  const label = edge.label?.toLowerCase() || '';

  if (label.includes('puzzle') || label.includes('required') || label.includes('reward') || label.includes('lock')) return 'dependency';
  if (label.includes('contain') || label.includes('inside')) return 'containment';
  if (sourceNode?.data?.type === 'Character' || targetNode?.data?.type === 'Character') return 'character';
  if (sourceNode?.data?.type === 'Timeline' || targetNode?.data?.type === 'Timeline') return 'timeline';

  return 'default';
};

const transformBackendGraph = (graphData, centerId) => {
  if (!graphData || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.edges)) {
    return { nodes: [], edges: [] };
  }

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

  const nodes = graphData.nodes.map((node) => mapNode(node, node.id === centerId));
  if (!nodes.find((n) => n.id === centerId) && graphData.center) {
    nodes.push(mapNode(graphData.center, true));
  }
  
  const baseNodesForEdgeType = nodes;

  const edges = graphData.edges.map((e, idx) => {
    const edgeType = getEdgeType(e, baseNodesForEdgeType);
    const style = { ...(edgeStyles[edgeType] || edgeStyles.default) };
    
    return {
      id: e.id || `edge-${idx}`,
      source: e.source,
      target: e.target,
      label: e.label || '', 
      type: 'custom', // Use the registered custom edge type
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
        opacity: 1, // Base opacity
      },
      labelStyle: { fill: '#ddd', fontWeight: 500, fontSize: '11px' }, // Slightly bolder/larger label
      labelBgPadding: [4, 6],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: 'rgba(40,40,40,0.85)', fillOpacity: 0.85 }, // Slightly more opaque background
      // Add data attribute for highlighting
      data: { 
        type: edgeType,
        shortLabel: e.data?.shortLabel,
        contextualLabel: e.data?.contextualLabel,
      }
    };
  });

  return { nodes, edges };
};

/**
 * useGraphTransform
 * Transforms raw or backend graph data into React Flow nodes/edges, applies filtering, and then applies layout.
 * @param {Object} params - Parameters for transformation, filtering, and layout
 * @returns {Object} { nodes, edges, error }
 */
export default function useGraphTransform({
  entityType,
  entityId,
  entityName,
  rawData,
  graphData,
  viewMode = 'default',
  depth = 1,
  nodeFilters = {},
  edgeFilters = {},
  suppressLowSignal = true,
  layoutType = 'radial',
  layoutOptions = {},
}) {
  /**
   * We memo-calculate the graph so that expensive work only reruns when inputs change.
   */
  const { nodes, edges, error } = useMemo(() => {
    try {
      // Step 1: Transform data to base nodes/edges
      const { nodes: baseNodes, edges: baseEdges } = transformToGraphElements({
        entityType,
        entityId,
        entityName,
        rawData,
        graphData,
        viewMode,
      });

      // --- Step 2 (NEW ORDER): Assign parentId for Dagre grouping ---
      let nodesWithParentId = baseNodes;
      if (layoutType === 'dagre' && baseNodes && baseNodes.length > 0) { // Only do this for dagre
        const nodesForGrouping = baseNodes.map(n => ({
          ...n,
          data: { ...(n.data || {}) }, 
        }));
        const nodeMap = new Map(nodesForGrouping.map(n => [n.id, n]));

        // 1. Identify Container Groups and assign parentId
        nodesForGrouping.forEach(potentialContainerNode => {
          if (potentialContainerNode.data.type === 'Element') {
            baseEdges.forEach(edge => {
              if (edge.source === potentialContainerNode.id && edge.data?.shortLabel === 'Contains') {
                const contentNode = nodeMap.get(edge.target);
                if (contentNode && contentNode.data.type === 'Element') {
                  contentNode.data.parentId = potentialContainerNode.id;
                }
              }
            });
          }
        });

        // 2. Identify Puzzle Groups and assign parentId (respecting existing parentId from container grouping)
        nodesForGrouping.forEach(potentialPuzzleNode => {
          if (potentialPuzzleNode.data.type === 'Puzzle') {
            baseEdges.forEach(edge => {
              if (edge.target === potentialPuzzleNode.id && edge.data?.shortLabel === 'Required For') {
                const requiredElementNode = nodeMap.get(edge.source);
                if (requiredElementNode && requiredElementNode.data.type === 'Element' && !requiredElementNode.data.parentId) {
                  requiredElementNode.data.parentId = potentialPuzzleNode.id;
                }
              }
              if (edge.source === potentialPuzzleNode.id && edge.data?.shortLabel === 'Rewards') {
                const rewardedElementNode = nodeMap.get(edge.target);
                if (rewardedElementNode && rewardedElementNode.data.type === 'Element' && !rewardedElementNode.data.parentId) {
                  rewardedElementNode.data.parentId = potentialPuzzleNode.id;
                }
              }
            });
          }
        });
        nodesWithParentId = nodesForGrouping;
      }
      // --- END Step 2 (NEW ORDER) ---

      // Step 3 (NEW ORDER): Filtering
      const { nodes: filteredNodes, edges: filteredEdges } = filterGraph(
        nodesWithParentId, // Pass nodes that may now have parentId
        baseEdges,
        {
          centerNodeId: entityId,
          depth,
          nodeFilters,
          edgeFilters,
          suppressLowSignal, // This parameter is still here from the function signature
        }
      );

      // Step 4 (NEW ORDER): Layout
      let layoutedNodes, layoutedEdges;
      const finalLayoutOptions = { ...layoutOptions };
      // Use filteredNodes for layout, which already incorporates parentId logic's effects via filterGraph
      const finalNodesForLayout = filteredNodes; 

      if (layoutType === 'force-directed') {
        ({ nodes: layoutedNodes, edges: layoutedEdges } = getForceDirectedLayout(finalNodesForLayout, filteredEdges, finalLayoutOptions));
      } else if (layoutType === 'dagre') {
        ({ nodes: layoutedNodes, edges: layoutedEdges } = getDagreLayout(finalNodesForLayout, filteredEdges, finalLayoutOptions));
      } else {
        ({ nodes: layoutedNodes, edges: layoutedEdges } = getCustomRadialLayout(finalNodesForLayout, filteredEdges, finalLayoutOptions));
      }

      // After layout, if Dagre was used, map parentId from data to the node's parentNode attribute for React Flow
      let finalReactFlowNodes = layoutedNodes;
      // Temporarily comment out to prevent React Flow from drawing its own parent boxes for Dagre layouts,
      // as we want to move towards custom hulls with the orbiting strategy.
      // if (layoutType === 'dagre') {
      //   finalReactFlowNodes = layoutedNodes.map(n => {
      //     if (n.data && n.data.parentId && finalNodesForLayout.find(p => p.id === n.data.parentId)) {
      //       // Ensure the parent node still exists after all transformations before assigning parentNode
      //       return { ...n, parentNode: n.data.parentId };
      //     }
      //     return n;
      //   });
      // }

      return { nodes: finalReactFlowNodes, edges: layoutedEdges, error: null };
    } catch (err) {
      console.error('useGraphTransform error', err);
      return { nodes: [], edges: [], error: err };
    }
  }, [
    entityType, 
    entityId, 
    entityName, 
    rawData, 
    graphData, 
    viewMode, 
    depth, 
    JSON.stringify(nodeFilters), 
    JSON.stringify(edgeFilters), 
    suppressLowSignal, 
    layoutType, 
    JSON.stringify(layoutOptions)
  ]);

  return { nodes, edges, error };
} 