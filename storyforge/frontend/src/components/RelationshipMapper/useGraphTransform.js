import { useMemo } from 'react';
import transformToGraphElements from './transformToGraphElements';
import { getDagreLayout } from './layoutUtils';
import filterGraph from './filterGraph';
import { MarkerType } from '@xyflow/react';

const edgeStyles = {
  dependency: { stroke: '#f57c00', strokeWidth: 2.5, animated: true },
  containment: { stroke: '#03a9f4', strokeWidth: 1.5, strokeDasharray: '6, 4' },
  character: { stroke: '#3f51b5', strokeWidth: 1.5 },
  timeline: { stroke: '#d81b60', strokeWidth: 1.5 },
  default: { stroke: '#90a4ae', strokeWidth: 1 },
};

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

// transformBackendGraph function seems to be unused directly in the main hook logic, transformToGraphElements is used.
// It might be a helper for transformToGraphElements or legacy. For now, keeping it as is.
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
      type: 'custom',
      animated: style.animated || false,
      markerEnd: { type: MarkerType.ArrowClosed, width: 15, height: 15, color: style.stroke || edgeStyles.default.stroke },
      style: { strokeWidth: style.strokeWidth || edgeStyles.default.strokeWidth, stroke: style.stroke || edgeStyles.default.stroke, strokeDasharray: style.strokeDasharray, opacity: 1 },
      labelStyle: { fill: '#ddd', fontWeight: 500, fontSize: '11px' },
      labelBgPadding: [4, 6],
      labelBgBorderRadius: 4,
      labelBgStyle: { fill: 'rgba(40,40,40,0.85)', fillOpacity: 0.85 },
      data: { type: edgeType, shortLabel: e.data?.shortLabel, contextualLabel: e.data?.contextualLabel }
    };
  });
  return { nodes, edges };
};

export default function useGraphTransform({
  entityType,
  entityId,
  entityName,
  graphData,
  viewMode = 'default',
  depth = 1,
  nodeFilters = {},
  edgeFilters = {},
  suppressLowSignal = true,
  layoutOptions = {},
  isFullScreenForLogging, // ADDED FOR DEBUGGING
  // New filter props
  actFocusFilter = "All",
  themeFilters = {},
  memorySetFilter = "All",
}) {
  const { nodes, edges, error } = useMemo(() => {
    // console.log('[useGraphTransform DEBUG] ALL parentId assignments ENABLED (Dagre rank error testing - default state).');
    // ADDED FOR DEBUGGING: General layout calculation log
    // console.log(`[useGraphTransform DEBUG] Recalculating layout. Entity: ${entityName} (ID: ${entityId}), Depth: ${depth}, NodeFilters: ${JSON.stringify(nodeFilters)}, EdgeFilters: ${JSON.stringify(edgeFilters)}, ActFocus: ${actFocusFilter}, Themes: ${JSON.stringify(themeFilters)}, MemorySet: ${memorySetFilter}`);
    // console.log('[useGraphTransform DEBUG] layoutOptions received:', JSON.stringify(layoutOptions));


    // console.log('[useGraphTransform] Memo Start. Entity:', entityName, 'ID:', entityId, 'Depth:', depth); // Original log
    // console.log('[useGraphTransform] Input graphData nodes:', graphData?.nodes?.length, 'edges:', graphData?.edges?.length); // Original log

    try {
      const { nodes: baseNodes, edges: baseEdges } = transformToGraphElements({
        entityType,
        entityId,
        entityName,
        graphData,
        viewMode,
      });
      // console.log('[useGraphTransform] Step 1 (transformToGraphElements) Done. Base nodes:', baseNodes?.length, 'Base edges:', baseEdges?.length); // Original log

      let nodesWithParentId = baseNodes;
      if (baseNodes && baseNodes.length > 0) {
        const nodesForGrouping = baseNodes.map(n => ({ ...n, data: { ...(n.data || {}) } }));
        const nodeMap = new Map(nodesForGrouping.map(n => [n.id, n]));
        nodesForGrouping.forEach(potentialContainerNode => {
          if (potentialContainerNode.data.type === 'Element') {
            baseEdges.forEach(edge => {
              if (edge.source === potentialContainerNode.id && edge.data?.shortLabel === 'Contains') {
                const contentNode = nodeMap.get(edge.target);
                if (contentNode && contentNode.data.type === 'Element') contentNode.data.parentId = potentialContainerNode.id;
              }
            });
          }
        });
        nodesForGrouping.forEach(potentialPuzzleNode => {
          if (potentialPuzzleNode.data.type === 'Puzzle') {
            baseEdges.forEach(edge => {
              if (edge.target === potentialPuzzleNode.id && edge.data?.shortLabel === 'Required For') {
                const requiredElementNode = nodeMap.get(edge.source);
                if (requiredElementNode && requiredElementNode.data.type === 'Element' && !requiredElementNode.data.parentId) requiredElementNode.data.parentId = potentialPuzzleNode.id;
              }
              if (edge.source === potentialPuzzleNode.id && edge.data?.shortLabel === 'Rewards') {
                const rewardedElementNode = nodeMap.get(edge.target);
                if (rewardedElementNode && rewardedElementNode.data.type === 'Element' && !rewardedElementNode.data.parentId) rewardedElementNode.data.parentId = potentialPuzzleNode.id;
              }
            });
          }
        });
        nodesWithParentId = nodesForGrouping;
      }
      // console.log('[useGraphTransform] Step 2 (parentId assignment) Done.'); // Original log

      if (nodesWithParentId && nodesWithParentId.length > 0) {
        const parentIdsFromChildren = new Set();
        nodesWithParentId.forEach(n => { if (n.data?.parentId) parentIdsFromChildren.add(n.data.parentId); });
        nodesWithParentId = nodesWithParentId.map(n => ({ ...n, data: { ...n.data, isActualParentGroup: parentIdsFromChildren.has(n.id) } }));
      }
      // console.log('[useGraphTransform] Step 2.5 (isActualParentGroup) Done.'); // Original log

      const { nodes: filteredNodes, edges: filteredEdges } = filterGraph(
        nodesWithParentId,
        baseEdges,
        {
          centerNodeId: entityId,
          depth,
          nodeFilters,
          edgeFilters,
          suppressLowSignal,
          // Pass new filters to filterGraph
          actFocusFilter,
          themeFilters,
          memorySetFilter,
        }
      );
      // console.log('[useGraphTransform] Step 3 (filterGraph) Done. Filtered nodes:', filteredNodes?.length, 'Filtered edges:', filteredEdges?.length); // Original log

      let layoutedNodes, layoutedEdges;
      const finalNodesForLayout = filteredNodes; 
      const finalLayoutOptions = { ...layoutOptions }; // Ensure we pass a consistent copy

      // ADDED FOR DEBUGGING: Log inputs to getDagreLayout
      // console.log(`[useGraphTransform DEBUG] BEFORE getDagreLayout. Is Fullscreen: ${isFullScreenForLogging}. finalNodesForLayout count: ${finalNodesForLayout?.length}.`);
      if (finalNodesForLayout && finalNodesForLayout.length > 0) {
        const sampleNode = finalNodesForLayout.find(n => n.id === entityId) || finalNodesForLayout[0];
        // console.log(`[useGraphTransform DEBUG] Sample node for Dagre (ID: ${sampleNode.id}, Name: ${sampleNode.data?.label}, parentId: ${sampleNode.data?.parentId})`);
      }
      // console.log(`[useGraphTransform DEBUG] filteredEdges count: ${filteredEdges?.length}. finalLayoutOptions for Dagre:`, JSON.stringify(finalLayoutOptions));
      // console.log('[useGraphTransform] Step 4: About to call getDagreLayout.'); // Original Log
      // console.log('[useGraphTransform] Nodes for Dagre:', finalNodesForLayout?.length, 'Edges for Dagre:', filteredEdges?.length); // Original Log
      // if (finalNodesForLayout && finalNodesForLayout.length > 0) { // Original Log
      //    console.log('[useGraphTransform] Sample node for Dagre:', JSON.stringify(finalNodesForLayout[0]));
      // }
      // console.log('[useGraphTransform] Layout options for Dagre:', JSON.stringify(finalLayoutOptions)); // Original Log


      ({ nodes: layoutedNodes, edges: layoutedEdges } = getDagreLayout(finalNodesForLayout, filteredEdges, finalLayoutOptions));
      
      // ADDED FOR DEBUGGING: Log outputs from getDagreLayout
      // console.log(`[useGraphTransform DEBUG] AFTER getDagreLayout. Is Fullscreen: ${isFullScreenForLogging}. layoutedNodes count: ${layoutedNodes?.length}.`);
      if (layoutedNodes && layoutedNodes.length > 0) {
        const sampleLayoutedNode = layoutedNodes.find(n => n.id === entityId) || layoutedNodes[0];
        // console.log(`[useGraphTransform DEBUG] Sample layouted node (ID: ${sampleLayoutedNode.id}, Name: ${sampleLayoutedNode.data?.label}) position (x,y):`, sampleLayoutedNode.position?.x, sampleLayoutedNode.position?.y);
      }
      // console.log('[useGraphTransform] getDagreLayout call completed. Layouted nodes:', layoutedNodes?.length); // Original log
      
      let finalReactFlowNodes = layoutedNodes.map(n => {
        // Ensure parentId refers to a node that still exists after filtering and layout
        if (n.data && n.data.parentId && layoutedNodes.find(p => p.id === n.data.parentId)) {
          return { ...n, parentNode: n.data.parentId };
        }
        return n;
      });
      // console.log('[useGraphTransform] parentNode mapping complete. Final nodes:', finalReactFlowNodes?.length); // Original log

      return { nodes: finalReactFlowNodes, edges: layoutedEdges, error: null };
    } catch (err) {
      // console.error('[useGraphTransform] CRITICAL ERROR in memoized calculation:', err);
      return { nodes: [], edges: [], error: err };
    }
  }, [
    entityType, 
    entityId, 
    entityName, 
    graphData, 
    viewMode, 
    depth, 
    JSON.stringify(nodeFilters), 
    JSON.stringify(edgeFilters), 
    suppressLowSignal, 
    JSON.stringify(layoutOptions),
    isFullScreenForLogging, // ADDED FOR DEBUGGING
    // Add new filters to dependency array
    actFocusFilter,
    JSON.stringify(themeFilters), // Stringify object for stable dependency check
    memorySetFilter,
  ]);

  return { nodes, edges, error };
}
