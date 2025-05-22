/**
 * Layout utilities for arranging nodes in the relationship mapper.
 * This file provides a Dagre-based hierarchical layout algorithm.
 */

import dagre from 'dagre'; // NOTE: Ensure this is '@dagrejs/dagre' if that's the package used

/**
 * Detects cycles in a list of parent-child assignments.
 * @param {Array<Object>} parentAssignments - Array of objects like { child: string, parent: string }.
 * @returns {Array<Array<string>>} - An array of cycles, where each cycle is an array of node IDs.
 */
const detectHierarchyCycles = (parentAssignments) => {
  const adj = new Map(); // Parent -> Set of Children
  const allNodesInHierarchy = new Set();

  parentAssignments.forEach(assignment => {
    if (!adj.has(assignment.parent)) {
      adj.set(assignment.parent, new Set());
    }
    adj.get(assignment.parent).add(assignment.child);
    allNodesInHierarchy.add(assignment.parent);
    allNodesInHierarchy.add(assignment.child);
  });

  const visited = new Set();      // Nodes for which all descendants have been visited
  const recursionStack = new Set(); // Nodes currently in the recursion path for DFS
  const cycles = [];

  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const children = adj.get(node) || new Set();
    for (const child of children) {
      if (!visited.has(child)) {
        // If dfs returns true, a cycle was found deeper in the stack, propagate it up.
        if (dfs(child, path)) { 
          // If we only want to report one cycle per DFS path, we could return true here.
          // For now, let's let it continue to find other potential branches from this path.
        }
      } else if (recursionStack.has(child)) {
        // Cycle detected
        const cycleStartIndex = path.indexOf(child);
        const cyclePath = path.slice(cycleStartIndex);
        // No need to add child again as it's already the start of the sliced path if found in recursionStack
        cycles.push([...cyclePath, child]); // Add child to explicitly show closure node
      }
    }

    path.pop();
    recursionStack.delete(node);
    return false; // No cycle found starting from this specific path branch in this DFS traversal
  }

  for (const node of allNodesInHierarchy) {
    if (!visited.has(node)) {
      dfs(node, []); // Start DFS for each unvisited node
    }
  }
  return cycles; // Return all detected cycles
};


/**
 * Applies a hierarchical layout using Dagre, supporting compound nodes.
 * 
 * @param {Array} nodes - The nodes to lay out. Nodes should have `data.parentId` if they are children of a compound node.
 * @param {Array} edges - The edges connecting nodes.
 * @param {Object} options - Layout configuration options.
 * @returns {Object} Object containing positioned nodes and edges.
 */
export const getDagreLayout = (nodes, edges, options = {}) => {
  console.log('[DagreLayout] Applying hierarchical layout. Nodes:', nodes?.length || 0, 'Edges:', edges?.length || 0);
  
  if (!nodes || nodes.length === 0) {
    console.warn('[DagreLayout] No nodes provided. Returning empty layout.');
    return { nodes: [], edges: [] };
  }

  let g; 
  let parentAssignmentsLog = []; // Define here to be accessible in catch block

  try {
    g = new dagre.graphlib.Graph({ compound: true, multigraph: true }); 
    console.log('[DagreLayout] Initialized Dagre graph with compound: true, multigraph: true.');

    const defaultOptions = {
      rankdir: 'TB', 
      align: undefined, 
      nodesep: 85,    
      ranksep: 90,    
      marginx: 30,    
      marginy: 30,
      rankPadding: 50, 
      nodePadding: 20, 
      nodeWidth: 170, 
      nodeHeight: 60, 
      centerNodeWidth: 190, 
      centerNodeHeight: 70,
    };
    const config = { ...defaultOptions, ...options };

    g.setGraph(config);
    console.log('[DagreLayout] Graph options set:', JSON.stringify(g.graph()));
    g.setDefaultEdgeLabel(() => ({}));

    const dagreNodeIds = new Set(); 
    console.log('[DagreLayout] Processing input nodes for Dagre graph...');
    nodes.forEach((node) => {
      if (!node || !node.id) {
        console.warn('[DagreLayout] Invalid node object encountered during setNode:', node);
        return; 
      }
      const visualWidth = node.data?.isCenter ? config.centerNodeWidth : config.nodeWidth;
      const visualHeight = node.data?.isCenter ? config.centerNodeHeight : config.nodeHeight;

      g.setNode(node.id, {
        label: node.data?.label || node.id.substring(0,10), 
        width: visualWidth,  
        height: visualHeight, 
        visualWidth: visualWidth, 
        visualHeight: visualHeight,
        originalNodeDataForDebug: { id: node.id, parentId: node.data?.parentId, data: node.data }
      });
      dagreNodeIds.add(node.id); 
    });
    console.log(`[DagreLayout] Added ${g.nodeCount()} nodes to Dagre graph. Node IDs:`, Array.from(dagreNodeIds));

    
    // Populate parentAssignmentsLog first
    nodes.forEach((node) => {
      if (node && node.id && node.data && node.data.parentId) {
        parentAssignmentsLog.push({ 
          child: node.id, 
          parent: node.data.parentId,
          // These checks reflect the state *before* g.setParent is called.
          childExistsOnGraph: dagreNodeIds.has(node.id), 
          parentExistsOnGraph: dagreNodeIds.has(node.data.parentId) 
        });
      }
    });

    if (parentAssignmentsLog.length > 0) {
        console.log('[DagreLayout] Parent assignment data collected (based on input node.data.parentId):', JSON.stringify(parentAssignmentsLog, null, 2));
        
        // --- CYCLE DETECTION ---
        console.log('[DagreLayout] Running cycle detection on parent assignments...');
        const detectedCycles = detectHierarchyCycles(parentAssignmentsLog);
        if (detectedCycles.length > 0) {
            console.error(`[DagreLayout CRITICAL HIERARCHY ISSUE] ${detectedCycles.length} CYCLE(S) DETECTED IN PARENT-CHILD RELATIONSHIPS:`);
            detectedCycles.forEach((cycle, index) => {
                console.error(`  Cycle ${index + 1}: ${cycle.join(' -> ')}`);
            });
            console.error('[DagreLayout] These cycles are highly likely to cause the Dagre ''rank'' error.');
        } else {
            console.log('[DagreLayout] No cycles detected in parent-child relationships.');
        }
        // --- END CYCLE DETECTION ---
    } else {
        console.log('[DagreLayout] No parentId assignments found in input nodes to drive g.setParent calls.');
    }

    console.log('[DagreLayout] Attempting to set parent relationships on Dagre graph instance...');
    // Iterate based on parentAssignmentsLog to ensure consistency with cycle detection input
    parentAssignmentsLog.forEach((assignment) => {
        const { child: childId, parent: parentId, childExistsOnGraph, parentExistsOnGraph } = assignment;
        
        // Log detailed info for this specific assignment attempt
        const childNodeInput = nodes.find(n => n.id === childId);
        const parentNodeInput = nodes.find(n => n.id === parentId);
        console.log(`[DagreLayout SetParent Attempt] Child ID: ${childId} (Exists on Graph: ${childExistsOnGraph}), Parent ID: ${parentId} (Exists on Graph: ${parentExistsOnGraph}), Child Node Input Data: ${JSON.stringify(childNodeInput?.data)}, Parent Node Input Data: ${JSON.stringify(parentNodeInput?.data)}`);
                
        if (childExistsOnGraph && parentExistsOnGraph) {
          if (childId === parentId) {
            console.error(`[DagreLayout CRITICAL] Attempting to set node ${childId} as its own parent. Skipping setParent.`);
          } else {
            try {
                g.setParent(childId, parentId);
                console.log(`[DagreLayout SetParent SUCCESS] Successfully set parent for ${childId} to ${parentId}`);
            } catch (e) {
                console.error(`[DagreLayout SetParent FAILED INDIVIDUAL CALL] Child ID: ${childId}, Parent ID: ${parentId}, Error: ${e.message}`, e);
            }
          }
        } else {
          // This logging is slightly different now as we rely on parentAssignmentsLog's existence checks primarily
          if (!parentExistsOnGraph) {
            console.warn(`[DagreLayout] Parent node ${parentId} for child ${childId} was marked as NOT FOUND in Dagre graph during parentAssignmentsLog creation. Skipping setParent.`);
          }
          if (!childExistsOnGraph) { // Should be rare if node was in original nodes array
            console.warn(`[DagreLayout] Child node ${childId} (intended parent ${parentId}) was marked as NOT FOUND in Dagre graph during parentAssignmentsLog creation. Skipping setParent.`);
          }
        }
    });
        
    const edgesForLayout = edges.filter(edge => {
      if (!edge || !edge.source || !edge.target) {
        console.warn('[DagreLayout] Invalid edge object encountered:', edge);
        return false; 
      }
      const sourceExists = dagreNodeIds.has(edge.source);
      const targetExists = dagreNodeIds.has(edge.target);
      return sourceExists && targetExists;
    });

    if (edgesForLayout.length !== edges.length) {
        console.warn(`[DagreLayout] Filtered out ${edges.length - edgesForLayout.length} edges due to missing source/target nodes.`);
    }
    console.log(`[DagreLayout] Number of valid edges for layout: ${edgesForLayout.length}`);
    
    edgesForLayout.forEach((edge) => {
      const edgeName = edge.id || `edge-${edge.source}-${edge.target}-${Math.random().toString(36).substring(2, 9)}`;
      g.setEdge(edge.source, edge.target, { 
        minlen: edge.data?.minlen || 1, 
        weight: edge.data?.weight || 1, 
        label: edge.data?.shortLabel || edge.label || '' 
      }, edgeName); 
    });
    console.log(`[DagreLayout] Added ${g.edgeCount()} edges to Dagre graph.`);

    console.log('[DagreLayout] Graph state BEFORE dagre.layout(g). Nodes:', JSON.stringify(g.nodes().map(id => g.node(id))), 'Edges:', JSON.stringify(g.edges().map(e => ({v: e.v, w: e.w, name: e.name, ...g.edge(e)}))));

    console.log('[DagreLayout] Running Dagre layout algorithm...');
    dagre.layout(g); 
    console.log('[DagreLayout] Dagre layout algorithm complete.');

    g.nodes().forEach(nodeId => {
        const dagreInternalNode = g.node(nodeId);
        if (dagreInternalNode && (g.children(nodeId)?.length > 0 || dagreInternalNode._isCompound || typeof g.parent(nodeId) === 'string' )) { 
            console.log(`[DagreLayout DEBUG Post-Layout] Node: ${nodeId}, X: ${dagreInternalNode.x?.toFixed(2)}, Y: ${dagreInternalNode.y?.toFixed(2)}, W: ${dagreInternalNode.width?.toFixed(2)}, H: ${dagreInternalNode.height?.toFixed(2)}, Parent: ${g.parent(nodeId) || 'none'}, Children: ${JSON.stringify(g.children(nodeId))}, IsCompound: ${dagreInternalNode._isCompound}`);
        }
    });

    let fallbackIndex = 0;
    const layoutedNodes = nodes.map((originalInputNode) => {
      if (!originalInputNode || !originalInputNode.id) {
        console.warn('[DagreLayout] Skipping invalid originalInputNode in final map stage.');
        return null; 
      }
      const dagreNodeData = g.node(originalInputNode.id); 

      if (dagreNodeData && typeof dagreNodeData.x === 'number' && typeof dagreNodeData.y === 'number') {
        if (dagreNodeData.width === 0 || dagreNodeData.height === 0) {
             console.warn(`[DagreLayout] Node ${originalInputNode.id} has zero width/height from Dagre:`, dagreNodeData);
        }
        return {
          ...originalInputNode,
          position: {
            x: dagreNodeData.x - (dagreNodeData.width / 2), 
            y: dagreNodeData.y - (dagreNodeData.height / 2),
          },
          style: { 
            ...originalInputNode.style, 
            width: dagreNodeData.width,
            height: dagreNodeData.height 
          },
          data: {
            ...originalInputNode.data,
            dagreCalculated: { 
                x: dagreNodeData.x,
                y: dagreNodeData.y,
                width: dagreNodeData.width,
                height: dagreNodeData.height,
                isCompound: !!(g.children(originalInputNode.id)?.length > 0 || dagreNodeData._isCompound), 
                children: g.children(originalInputNode.id) || [] 
            }
          }
        };
      } else {
        console.warn(`[DagreLayout FALLBACK APPLIED In-Try] Node ${originalInputNode.id} (label: ${originalInputNode.data?.label}) - Dagre data missing or invalid:`, JSON.stringify(dagreNodeData));
        fallbackIndex++;
        return { 
          ...originalInputNode, 
          position: { x: (fallbackIndex % 6) * (config.nodeWidth + 20) , y: Math.floor(fallbackIndex / 6) * (config.nodeHeight + 50) } 
        }; 
      }
    }).filter(node => node !== null);

    if (fallbackIndex > 0) {
        console.warn(`[DagreLayout] ${fallbackIndex} nodes used IN-TRY fallback positioning due to missing/invalid Dagre coordinates.`);
    }
    console.log('[DagreLayout] Node position mapping complete. Number of layoutedNodes:', layoutedNodes.length);
    return { nodes: layoutedNodes, edges: edgesForLayout };

  } catch (error) {
    console.error('[DagreLayout CRITICAL ERROR CAUGHT]', error, error.stack);
    if (g && typeof g.nodes === 'function') { 
        try {
            console.error('[DagreLayout] Graph state AT TIME OF CRITICAL ERROR:');
            console.error('[DagreLayout] Nodes:', JSON.stringify(g.nodes().map(id => g.node(id))));
            console.error('[DagreLayout] Edges:', JSON.stringify(g.edges().map(e => ({v: e.v, w: e.w, name: e.name, ...g.edge(e)}))));
            // Log parentAssignmentsLog from the broader scope
            console.error('[DagreLayout] Parent Assignments attempted (from input nodes leading up to error - as captured by parentAssignmentsLog variable):', JSON.stringify(parentAssignmentsLog, null, 2));
        } catch (loggingError) {
            console.error('[DagreLayout] Error while logging graph state during critical error:', loggingError);
        }
    } else {
        console.error('[DagreLayout] Dagre graph object "g" was not initialized or available for full logging at time of critical error.');
    }
    
    let catchFallbackIndex = 0;
    const fallbackNodes = nodes.map((n) => {
      if (!n || !n.id) return null;
      catchFallbackIndex++;
      const newPosition = { x: (catchFallbackIndex % 7) * 180, y: Math.floor(catchFallbackIndex / 7) * 100 };
      return {
        ...n,
        position: newPosition 
      };
    }).filter(Boolean);
    
    if(fallbackNodes.length > 0) {
        console.warn(`[DagreLayout CATCH BLOCK FALLBACK] Generated ${fallbackNodes.length} fallback nodes.`);
    }
    return { nodes: fallbackNodes, edges: edges || [] };
  }
};
