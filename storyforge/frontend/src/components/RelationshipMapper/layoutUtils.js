/**
 * Layout utilities for arranging nodes in the relationship mapper.
 * This file provides a Dagre-based hierarchical layout algorithm.
 */

import dagre from 'dagre'; // NOTE: Ensure this is '@dagrejs/dagre' if that's the package used

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

  let g; // Define g in a scope accessible by the catch block for logging

  try {
    // PRD Objective: Re-enable compound: true
    g = new dagre.graphlib.Graph({ compound: true, multigraph: true }); 
    console.log('[DagreLayout] Initialized Dagre graph with compound: true, multigraph: true.');

    const defaultOptions = {
      rankdir: 'TB', 
      align: undefined, 
      nodesep: 70,    // Adjusted from 90, can be tuned
      ranksep: 70,    // Adjusted from 120, can be tuned
      marginx: 30,    
      marginy: 30,
      // For compound nodes, Dagre also supports:
      rankPadding: 50, // pixels between ranks (layers) of nodes - good starting point
      nodePadding: 20, // pixels between nodes in the same rank within a compound node - good starting point
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

    console.log('[DagreLayout] Attempting to set parent relationships...');
    const parentAssignmentsLog = [];
    nodes.forEach((node) => {
      if (!node || !node.id) return;
      if (node.data && node.data.parentId) {
        const childId = node.id;
        const parentId = node.data.parentId;
        let childExists = dagreNodeIds.has(childId);
        let parentExists = dagreNodeIds.has(parentId);
        parentAssignmentsLog.push({ child: childId, parent: parentId, childExists: childExists, parentExists: parentExists });
        
        if (childExists && parentExists) {
          if (childId === parentId) {
            console.error(`[DagreLayout] CRITICAL: Attempting to set node ${childId} as its own parent. Skipping setParent.`);
          } else {
            g.setParent(childId, parentId);
            // console.log(`[DagreLayout] Successfully set parent for ${childId} to ${parentId}`);
          }
        } else {
          if (!parentExists) {
            console.warn(`[DagreLayout] Parent node ${parentId} for child ${childId} NOT FOUND in Dagre graph. Skipping setParent.`);
          }
          if (!childExists) {
            console.warn(`[DagreLayout] Child node ${childId} (intended parent ${parentId}) NOT FOUND in Dagre graph during setParent. This is unexpected.`);
          }
        }
      }
    });
    if (parentAssignmentsLog.length > 0) {
        console.log('[DagreLayout] Parent assignment attempts details:', JSON.stringify(parentAssignmentsLog));
    } else {
        console.log('[DagreLayout] No parentId assignments found in input nodes.');
    }
    
    const edgesForLayout = edges.filter(edge => {
      if (!edge || !edge.source || !edge.target) {
        console.warn('[DagreLayout] Invalid edge object encountered:', edge);
        return false; 
      }
      const sourceExists = dagreNodeIds.has(edge.source);
      const targetExists = dagreNodeIds.has(edge.target);
      if (!sourceExists) {
        // console.warn(`[DagreLayout] Edge source node ${edge.source} not found in Dagre graph. Skipping edge:`, edge);
      }
      if (!targetExists) {
        // console.warn(`[DagreLayout] Edge target node ${edge.target} not found in Dagre graph. Skipping edge:`, edge);
      }
      return sourceExists && targetExists;
    });

    if (edgesForLayout.length !== edges.length) {
        console.warn(`[DagreLayout] Filtered out ${edges.length - edgesForLayout.length} edges due to missing source/target nodes.`);
    }
    console.log(`[DagreLayout] Number of valid edges for layout: ${edgesForLayout.length}`);
    
    edgesForLayout.forEach((edge) => {
      const edgeName = edge.id || \`edge-\${edge.source}-\${edge.target}-\${Math.random().toString(36).substring(2, 9)}\`;
      g.setEdge(edge.source, edge.target, { 
        minlen: edge.data?.minlen || 1, 
        weight: edge.data?.weight || 1, 
        label: edge.data?.shortLabel || edge.label || '' 
      }, edgeName); 
    });
    console.log(\`[DagreLayout] Added \${g.edgeCount()} edges to Dagre graph.\`);

    console.log('[DagreLayout] Graph state BEFORE dagre.layout(g). Nodes:', JSON.stringify(g.nodes().map(id => g.node(id))), 'Edges:', JSON.stringify(g.edges().map(e => ({v: e.v, w: e.w, name: e.name, ...g.edge(e)}))));

    console.log('[DagreLayout] Running Dagre layout algorithm...');
    dagre.layout(g); 
    console.log('[DagreLayout] Dagre layout algorithm complete.');

    g.nodes().forEach(nodeId => {
        const dagreInternalNode = g.node(nodeId);
        if (dagreInternalNode && (g.children(nodeId)?.length > 0 || dagreInternalNode._isCompound)) { 
            console.log(\`[DagreLayout DEBUG] Node (potential parent): \${nodeId}, X: \${dagreInternalNode.x?.toFixed(2)}, Y: \${dagreInternalNode.y?.toFixed(2)}, Width: \${dagreInternalNode.width?.toFixed(2)}, Height: \${dagreInternalNode.height?.toFixed(2)}, Children: \${JSON.stringify(g.children(nodeId))}, IsCompound: \${dagreInternalNode._isCompound}\`);
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
             console.warn(\`[DagreLayout] Node \${originalInputNode.id} has zero width/height from Dagre:\`, dagreNodeData);
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
                isCompound: dagreInternalNode._isCompound || (g.children(originalInputNode.id)?.length > 0) || false,
                children: g.children(originalInputNode.id) || []
            }
          }
        };
      } else {
        console.warn(\`[DagreLayout FALLBACK APPLIED In-Try] Node \${originalInputNode.id} (label: \${originalInputNode.data?.label}) - Dagre data missing or invalid:\`, JSON.stringify(dagreNodeData));
        fallbackIndex++;
        return { 
          ...originalInputNode, 
          position: { x: (fallbackIndex % 6) * (config.nodeWidth + 20) , y: Math.floor(fallbackIndex / 6) * (config.nodeHeight + 50) } 
        }; 
      }
    }).filter(node => node !== null);

    if (fallbackIndex > 0) {
        console.warn(\`[DagreLayout] \${fallbackIndex} nodes used IN-TRY fallback positioning due to missing/invalid Dagre coordinates.\`);
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
            const parentAssignmentsForError = [];
             nodes.forEach(node => { // Use original nodes array for this log
                 if (node.data?.parentId) parentAssignmentsForError.push({child: node.id, parent: node.data.parentId});
             });
             console.error('[DagreLayout] Parent Assignments attempted (from input nodes):', JSON.stringify(parentAssignmentsForError));
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
        console.warn(\`[DagreLayout CATCH BLOCK FALLBACK] Generated \${fallbackNodes.length} fallback nodes.\`);
    }
    return { nodes: fallbackNodes, edges: edges || [] };
  }
};
