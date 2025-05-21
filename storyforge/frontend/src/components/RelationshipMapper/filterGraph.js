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
    console.warn('[filterGraph] Invalid nodes or edges input. Nodes:', nodes, 'Edges:', edges);
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
      "Owns", "Owned By", "Contains", "Inside"
    ]);
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
  if (depth > 0 && workingNodes.length > 1 && centerNodeId && workingNodeMap.has(centerNodeId)) {
    const visited = new Set();
    if (workingNodeMap.has(centerNodeId)) { // Ensure centerNodeId is valid before adding
        visited.add(centerNodeId);
    } else {
        console.warn(`[filterGraph] Center node ID ${centerNodeId} not found in initial workingNodeMap. Depth filtering might be incorrect.`);
    }

    const queue = [{ id: centerNodeId, d: 0 }];
    const adjacency = {};
    workingEdges.forEach((e) => {
      if (!adjacency[e.source]) adjacency[e.source] = [];
      if (!adjacency[e.target]) adjacency[e.target] = [];
      adjacency[e.source].push(e.target);
      adjacency[e.target].push(e.source);
    });
    
    let head = 0;
    while(head < queue.length) { // Efficient queue processing
        const { id, d } = queue[head++];
        if (d >= depth) continue;

        (adjacency[id] || []).forEach((neighborId) => {
            if (workingNodeMap.has(neighborId) && !visited.has(neighborId)) {
                visited.add(neighborId);
                queue.push({ id: neighborId, d: d + 1 });
            }
        });
    }
    
    // New logic to add children of visited parents
    const allOriginalNodes = nodes.slice(); // Use the original full nodes list
    let newChildrenAddedInPass;
    do {
      newChildrenAddedInPass = false;
      allOriginalNodes.forEach(potentialChildNode => {
        if (potentialChildNode.data && potentialChildNode.data.parentId) {
          if (visited.has(potentialChildNode.data.parentId) && !visited.has(potentialChildNode.id)) {
            if (workingNodeMap.has(potentialChildNode.id)) { // Ensure child exists in the current graph context
                visited.add(potentialChildNode.id);
                newChildrenAddedInPass = true;
            }
          }
        }
      });
    } while (newChildrenAddedInPass);

    workingNodes = workingNodes.filter((n) => visited.has(n.id));
    workingEdges = workingEdges.filter((e) => visited.has(e.source) && visited.has(e.target));
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
  } else if (depth > 0 && workingNodes.length > 1 && centerNodeId && !workingNodeMap.has(centerNodeId)) {
    console.warn(`[filterGraph] Center node ${centerNodeId} for depth filtering not found in the provided nodes. Returning all nodes/edges.`);
  }


  // --- Node Type Filtering ---
  const activeNodeFilters = Object.keys(nodeFilters).filter((t) => nodeFilters[t]);
  if (activeNodeFilters.length > 0 && activeNodeFilters.length < Object.keys(nodeFilters).length) {
    // Initial filter based on type or being the center node
    let tempFilteredNodes = workingNodes.filter((n) => 
      (n.data.isCenter && workingNodeMap.has(n.id)) || 
      activeNodeFilters.includes(n.data.type)
    );
    
    // Ensure children of kept, type-valid parents are also kept, even if child's type *would* be filtered (this is debatable UX, but aims to preserve group structure if parent is shown)
    // This specific part might be too aggressive or counter-intuitive if a type is EXPLICITLY filtered out.
    // For now, let's simplify: if a node's type is filtered out, it's out. The group will show the parent without that specific child.
    // The primary goal is that if a child's type IS NOT filtered out, but it might have been pruned by earlier filters, it should be kept if its parent is kept.
    // The depth filter already handles bringing children in. Node type filter should be respected.
    
    // Revised Node Type Filtering:
    // A node is kept if:
    // 1. It's the center node.
    // 2. Its type is in activeNodeFilters.
    workingNodes = workingNodes.filter(n => {
        if (n.data.isCenter && workingNodeMap.has(n.id)) return true; // Keep center
        if (activeNodeFilters.includes(n.data.type)) return true; // Keep if type matches
        return false; // Otherwise, filter out
    });

    // After filtering nodes, update the map and filter edges
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
    workingEdges = workingEdges.filter((e) => workingNodeMap.has(e.source) && workingNodeMap.has(e.target));
  }

  // --- Edge Type Filtering ---
  const activeEdgeFilters = typeof edgeFilters === 'object' && edgeFilters !== null 
    ? Object.keys(edgeFilters).filter((et) => edgeFilters[et])
    : [];
  if (activeEdgeFilters.length > 0 && (typeof edgeFilters === 'object' && edgeFilters !== null && activeEdgeFilters.length < Object.keys(edgeFilters).length)) {
    workingEdges = workingEdges.filter(edge => {
      return edge.data?.type && activeEdgeFilters.includes(edge.data.type);
    });
    
    // Remove orphaned nodes after edge filtering
    // A node is kept if:
    // 1. It's the center node (if it still exists in workingNodeMap).
    // 2. It's part of any remaining workingEdge.
    // 3. It's a child of a node that is kept by rules 1 or 2.
    const nodesConnectedByEdges = new Set();
    workingEdges.forEach(edge => {
      nodesConnectedByEdges.add(edge.source);
      nodesConnectedByEdges.add(edge.target);
    });

    const finalKeptNodeIds = new Set();
    if (centerNodeId && workingNodeMap.has(centerNodeId)) {
      finalKeptNodeIds.add(centerNodeId);
    }

    workingNodes.forEach(n => {
      if (nodesConnectedByEdges.has(n.id)) {
        finalKeptNodeIds.add(n.id);
      }
    });
    
    // Iteratively add children of already kept nodes
    let newChildrenAddedInLastPass;
    const originalNodesForOrphanCheck = nodes.slice(); // Use original full node list to check parentage

    do {
      newChildrenAddedInLastPass = false;
      originalNodesForOrphanCheck.forEach(node => {
        if (node.data && node.data.parentId && 
            finalKeptNodeIds.has(node.data.parentId) && 
            !finalKeptNodeIds.has(node.id)) {
          // Only add if this node wasn't filtered out by type earlier
          if (workingNodeMap.has(node.id)) { 
            finalKeptNodeIds.add(node.id);
            newChildrenAddedInLastPass = true;
          }
        }
      });
    } while (newChildrenAddedInLastPass);
    
    workingNodes = workingNodes.filter(node => finalKeptNodeIds.has(node.id));
    // Update workingNodeMap after node filtering
    workingNodeMap = new Map(workingNodes.map(n => [n.id, n]));
  }

  // Final consistency check: ensure all edge sources/targets are in the final node list
  const finalNodeIdsSet = new Set(workingNodes.map(n => n.id));
  workingEdges = workingEdges.filter(e => finalNodeIdsSet.has(e.source) && finalNodeIdsSet.has(e.target));

  return { nodes: workingNodes, edges: workingEdges };
}

export default filterGraph;
