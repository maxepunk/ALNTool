/**
 * filterGraph.js
 * Pure function for filtering graph nodes and edges for RelationshipMapper.
 *
 * @param {Object[]} nodes - Array of graph nodes (React Flow format)
 * @param {Object[]} edges - Array of graph edges (React Flow format)
 * @param {Object} options - Filtering options
 * @param {string} options.centerNodeId - The ID of the central node (for depth/low-signal)
 * @param {number} [options.depth=1] - Max depth from center node
 * @param {Object} [options.nodeFilters={}] - { [type: string]: boolean }
 * @param {Object} [options.edgeFilters={}] - { [type: string]: boolean }
 * @param {boolean} [options.suppressLowSignal=true] - Whether to remove low-signal nodes/edges (Currently unused if SPOC is disabled)
 * @returns {Object} { nodes: filteredNodes, edges: filteredEdges }
 */
function filterGraph(
  nodes,
  edges,
  {
    centerNodeId,
    depth = 1,
    nodeFilters = {},
    edgeFilters = {},
    // suppressLowSignal = true, // SPOC logic that might use this is currently disabled
  } = {}
) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return { nodes: [], edges: [] };
  }

  let workingNodes = nodes.slice();
  let workingEdges = edges.slice();
  let workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));

  // --- NEW Edge Simplification Logic (Single Point of Connection) ---
  // Temporarily disabled as per PRD Section 9, Phase 1, Step 2.C, Task 7
  // to evaluate compound node layout without confounding factors from SPOC.
  /*
  if (centerNodeId && workingEdges.length > 0) {
    const CONDITIONAL_STRONG = new Set([
      \"Owns\", \"Owned By\", \"Contains\", \"Inside\"
    ]);
    const UNCONDITIONAL_STRONG = new Set([
      \"Requires\", \"Required By\", \"Rewards\", \"Reward From\", \"Unlocks\", \"Locked In\",
      \"Sub-Puzzle Of\", \"Has Sub-Puzzle\", \"Evidence For\"
    ]);
    const WEAK_RELATIONSHIPS = new Set([
      \"Associated\", \"Associated With\", \"Involves\", \"Involved In\", 
      \"Participates In\", \"Appears In\"
    ]);
    const INTERMEDIARY_HUB_TYPES = new Set(['Puzzle', 'Timeline', 'Element']);

    const isUnconditionalStrong = label => UNCONDITIONAL_STRONG.has(label);
    const isConditionalStrong  = label => CONDITIONAL_STRONG.has(label);
    const isEdgeStrong = label => isUnconditionalStrong(label) || isConditionalStrong(label);

    const simplifiedEdges = [];
    const directEdgesToCenter = [];
    const nonCentralEdges = [];

    for (const edge of workingEdges) {
      if (edge.source === centerNodeId || edge.target === centerNodeId) {
        directEdgesToCenter.push(edge);
      } else {
        nonCentralEdges.push(edge);
      }
    }
    simplifiedEdges.push(...nonCentralEdges); 

    for (const directEdge of directEdgesToCenter) {
      const directEdgeShortLabel = directEdge.data?.shortLabel;
      const nonCenterNodeId = directEdge.source === centerNodeId ? directEdge.target : directEdge.source;
      const nonCenterNode = workingNodeMap.get(nonCenterNodeId);

      if (isUnconditionalStrong(directEdgeShortLabel)) {
        simplifiedEdges.push(directEdge);
        continue;
      }

      if (isConditionalStrong(directEdgeShortLabel) && nonCenterNode?.data?.parentId) {
        continue;
      }

      if (isEdgeStrong(directEdgeShortLabel) || WEAK_RELATIONSHIPS.has(directEdgeShortLabel)) {
        let hasStrongIndirectPath = false;
        for (const edge1 of workingEdges) { 
          if (edge1.source === centerNodeId || edge1.target === centerNodeId) {
            const pNodeId = edge1.source === centerNodeId ? edge1.target : edge1.source;
            const pNode = workingNodeMap.get(pNodeId);
            const edge1ShortLabel = edge1.data?.shortLabel;

            if (pNodeId !== nonCenterNodeId && pNode && INTERMEDIARY_HUB_TYPES.has(pNode.data?.type) && isEdgeStrong(edge1ShortLabel)) {
              for (const edge2 of workingEdges) { 
                if (((edge2.source === pNodeId && edge2.target === nonCenterNodeId) || 
                     (edge2.source === nonCenterNodeId && edge2.target === pNodeId)) && 
                     edge2.id !== edge1.id && edge2.id !== directEdge.id) {
                  
                  const edge2ShortLabel = edge2.data?.shortLabel;
                  if (isUnconditionalStrong(edge2ShortLabel) || isConditionalStrong(edge2ShortLabel)) {
                    hasStrongIndirectPath = true;
                    break;
                  }
                }
              }
            }
          }
          if (hasStrongIndirectPath) break;
        }

        if (hasStrongIndirectPath) {
          // Do not add this weak direct edge
        } else {
          simplifiedEdges.push(directEdge); 
        }
      } else {
        simplifiedEdges.push(directEdge); 
      }
    }
    workingEdges = simplifiedEdges;

    const connectedNodeIdsAfterSimplification = new Set([centerNodeId]);
    workingEdges.forEach(edge => {
      connectedNodeIdsAfterSimplification.add(edge.source);
      connectedNodeIdsAfterSimplification.add(edge.target);
    });
    workingNodes = workingNodes.filter(node => node.data.isCenter || connectedNodeIdsAfterSimplification.has(node.id));
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
  }
  */
  // --- END NEW Edge Simplification Logic (Temporarily Disabled) ---

  // --- Depth Filtering ---
  if (depth > 0 && workingNodes.length > 1 && centerNodeId) {
    const visited = new Set([centerNodeId]);
    const queue = [{ id: centerNodeId, d: 0 }];
    const adjacency = {};
    workingEdges.forEach((e) => {
      if (!adjacency[e.source]) adjacency[e.source] = [];
      if (!adjacency[e.target]) adjacency[e.target] = [];
      adjacency[e.source].push(e.target);
      adjacency[e.target].push(e.source);
    });
    while (queue.length) {
      const { id, d } = queue.shift();
      if (d >= depth) continue;
      (adjacency[id] || []).forEach((neighborId) => {
        if (workingNodeMap.has(neighborId) && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({ id: neighborId, d: d + 1 });
        }
      });
    }
    workingNodes = workingNodes.filter((n) => visited.has(n.id));
    workingEdges = workingEdges.filter((e) => visited.has(e.source) && visited.has(e.target));
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
  }

  // --- Node Type Filtering ---
  const activeNodeFilters = Object.keys(nodeFilters).filter((t) => nodeFilters[t]);
  if (activeNodeFilters.length > 0 && activeNodeFilters.length < Object.keys(nodeFilters).length) {
    workingNodes = workingNodes.filter((n) => n.data.isCenter || activeNodeFilters.includes(n.data.type));
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
    workingEdges = workingEdges.filter((e) => workingNodeMap.has(e.source) && workingNodeMap.has(e.target));
  }

  // --- Edge Type Filtering ---
  // Ensure edgeFilters is an object before processing
  const activeEdgeFilters = typeof edgeFilters === 'object' && edgeFilters !== null 
    ? Object.keys(edgeFilters).filter((et) => edgeFilters[et])
    : [];
  if (activeEdgeFilters.length > 0 && (typeof edgeFilters === 'object' && edgeFilters !== null && activeEdgeFilters.length < Object.keys(edgeFilters).length)) {
    workingEdges = workingEdges.filter(edge => {
      return edge.data?.type && activeEdgeFilters.includes(edge.data.type);
    });
    // Remove orphaned nodes (except center) after edge filtering
    const connectedNodeIdsAfterEdgeFilter = new Set();
    if (centerNodeId) connectedNodeIdsAfterEdgeFilter.add(centerNodeId); // Keep center node
    
    workingEdges.forEach(edge => {
      connectedNodeIdsAfterEdgeFilter.add(edge.source);
      connectedNodeIdsAfterEdgeFilter.add(edge.target);
    });
    workingNodes = workingNodes.filter(node => node.data.isCenter || connectedNodeIdsAfterEdgeFilter.has(node.id));
    // No need to update workingNodeMap here as it's the last step for nodes
  }

  return { nodes: workingNodes, edges: workingEdges };
}

export default filterGraph;
