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
 * @param {boolean} [options.suppressLowSignal=true] - Whether to remove low-signal nodes/edges
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
    suppressLowSignal = true, // This might be re-evaluated after new simplification
  } = {}
) {
  if (!Array.isArray(nodes) || !Array.isArray(edges)) {
    return { nodes: [], edges: [] };
  }

  let workingNodes = nodes.slice();
  let workingEdges = edges.slice();
  let workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));

  // --- NEW Edge Simplification Logic (Single Point of Connection) ---
  if (centerNodeId && workingEdges.length > 0) {
    // Edges whose narrative meaning is strong *unless* an equivalent strong indirect
    // path already exists (centre → hub → node).  Treat these as candidates for
    // removal during SPOC pruning.
    const CONDITIONAL_STRONG = new Set([
      "Owns", "Owned By", "Contains", "Inside"
    ]);

    // Always-keep strong relationships (direction-defining / dependency)
    const UNCONDITIONAL_STRONG = new Set([
      "Requires", "Required By", "Rewards", "Reward From", "Unlocks", "Locked In",
      "Sub-Puzzle Of", "Has Sub-Puzzle", "Evidence For"
    ]);

    const WEAK_RELATIONSHIPS = new Set([
      "Associated", "Associated With", "Involves", "Involved In", 
      "Participates In", "Appears In"
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
    simplifiedEdges.push(...nonCentralEdges); // Keep all non-central edges initially

    for (const directEdge of directEdgesToCenter) {
      const directEdgeShortLabel = directEdge.data?.shortLabel;
      const nonCenterNodeId = directEdge.source === centerNodeId ? directEdge.target : directEdge.source;

      // 1. unconditional-strong are always kept
      if (isUnconditionalStrong(directEdgeShortLabel)) {
        simplifiedEdges.push(directEdge);
        continue;
      }

      // 2. conditional-strong and weak edges share the same pruning logic –
      //    keep only if no strong indirect path exists.  Bonus rule: if the
      //    non-center node already belongs to a container/puzzle (has
      //    parentId) then we consider that an implicit indirect path and
      //    drop the edge immediately for conditional-strong labels.

      const nonCenterNode = workingNodeMap.get(nonCenterNodeId);

      if (isConditionalStrong(directEdgeShortLabel) && nonCenterNode?.data?.parentId) {
        // Redundant direct edge – child will be visible via its hub.
        continue;
      }

      if (isEdgeStrong(directEdgeShortLabel) || WEAK_RELATIONSHIPS.has(directEdgeShortLabel)) {
        let hasStrongIndirectPath = false;
        // Search for a C-P-N path
        for (const edge1 of workingEdges) { // Potential C-P edge
          if (edge1.source === centerNodeId || edge1.target === centerNodeId) {
            const pNodeId = edge1.source === centerNodeId ? edge1.target : edge1.source;
            const pNode = workingNodeMap.get(pNodeId);
            const edge1ShortLabel = edge1.data?.shortLabel;

            if (pNodeId !== nonCenterNodeId && pNode && INTERMEDIARY_HUB_TYPES.has(pNode.data?.type) && isEdgeStrong(edge1ShortLabel)) {
              // Found a strong C-P link. Now look for P-N.
              for (const edge2 of workingEdges) { // Potential P-N edge
                if (((edge2.source === pNodeId && edge2.target === nonCenterNodeId) || 
                     (edge2.source === nonCenterNodeId && edge2.target === pNodeId)) && 
                     edge2.id !== edge1.id && edge2.id !== directEdge.id) {
                  
                  const edge2ShortLabel = edge2.data?.shortLabel;
                  // Indirect edge must be strong enough to support pruning.
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
          // console.log(`Simplifying: Removing weak direct edge ${directEdge.id} (${centerNodeId} - ${directEdgeShortLabel} - ${nonCenterNodeId}) due to strong indirect path.`);
          // Do not add this weak direct edge
        } else {
          simplifiedEdges.push(directEdge); // No strong indirect path, keep the weak direct edge
        }
      } else {
        simplifiedEdges.push(directEdge); // Edge type not in strong/weak lists, keep it by default
      }
    }
    workingEdges = simplifiedEdges;

    // Prune orphaned nodes (except center) after simplification
    const connectedNodeIdsAfterSimplification = new Set([centerNodeId]);
    workingEdges.forEach(edge => {
      connectedNodeIdsAfterSimplification.add(edge.source);
      connectedNodeIdsAfterSimplification.add(edge.target);
    });
    workingNodes = workingNodes.filter(node => node.data.isCenter || connectedNodeIdsAfterSimplification.has(node.id));
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
  }
  // --- END NEW Edge Simplification Logic ---

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
  const allowedNodeTypes = Object.keys(nodeFilters).filter((t) => nodeFilters[t]);
  if (allowedNodeTypes.length && allowedNodeTypes.length < Object.keys(nodeFilters).length) {
    workingNodes = workingNodes.filter((n) => n.data.isCenter || allowedNodeTypes.includes(n.data.type));
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
    workingEdges = workingEdges.filter((e) => workingNodeMap.has(e.source) && workingNodeMap.has(e.target));
  }

  // --- Edge Type Filtering ---
  const allowedEdgeTypes = Object.keys(edgeFilters).filter((et) => edgeFilters[et]);
  if (allowedEdgeTypes.length && allowedEdgeTypes.length < Object.keys(edgeFilters).length) {
    workingEdges = workingEdges.filter(edge => {
      return edge.data?.type && allowedEdgeTypes.includes(edge.data.type); // Filters on edge.data.type (e.g., 'dependency')
    });
    // Remove orphaned nodes (except center)
    const connectedNodeIds = new Set([centerNodeId]);
    workingEdges.forEach(edge => {
      connectedNodeIds.add(edge.source);
      connectedNodeIds.add(edge.target);
    });
    workingNodes = workingNodes.filter(node => node.data.isCenter || connectedNodeIds.has(node.id));
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
  }

  // Commented out original timeline removal logic, can be re-added if necessary
  // const timelineNodes = filteredNodes.filter((n) => n.data.type === 'Timeline');
  // ...

  return { nodes: workingNodes, edges: workingEdges };
}

export default filterGraph; 