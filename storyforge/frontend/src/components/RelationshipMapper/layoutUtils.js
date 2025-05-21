/**
 * Layout utilities for arranging nodes in the relationship mapper.
 * This file provides a Dagre-based hierarchical layout algorithm.
 */

import dagre from 'dagre';

/**
 * Applies a hierarchical layout using Dagre, supporting compound nodes.
 * 
 * @param {Array} nodes - The nodes to lay out. Nodes should have `data.parentId` if they are children of a compound node.
 * @param {Array} edges - The edges connecting nodes.
 * @param {Object} options - Layout configuration options.
 * @returns {Object} Object containing positioned nodes and edges.
 */
export const getDagreLayout = (nodes, edges, options = {}) => {
  console.log('[Dagre] Applying hierarchical layout to', nodes?.length || 0, 'nodes.');
  
  if (!nodes || nodes.length === 0) {
    console.warn('[Dagre] No nodes provided to getDagreLayout.');
    return { nodes: [], edges: [] };
  }

  try {
    // Initialize Dagre graph. Temporarily set compound: false to isolate ranking error.
    const g = new dagre.graphlib.Graph({ compound: false, multigraph: true }); 

    const defaultOptions = {
      rankdir: 'TB', 
      align: undefined, 
      nodesep: 90,    
      ranksep: 120,  
      marginx: 30,    
      marginy: 30,    
      nodeWidth: 170, 
      nodeHeight: 60, 
      centerNodeWidth: 190, 
      centerNodeHeight: 70, 
    };
    const config = { ...defaultOptions, ...options };

    g.setGraph(config);
    g.setDefaultEdgeLabel(() => ({}));

    const dagreNodeIds = new Set(); 
    nodes.forEach((node) => {
      if (!node || !node.id) {
        console.warn('[Dagre] Encountered invalid node object during setNode:', node);
        return; 
      }
      const visualWidth = node.data.isCenter ? config.centerNodeWidth : config.nodeWidth;
      const visualHeight = node.data.isCenter ? config.centerNodeHeight : config.nodeHeight;

      g.setNode(node.id, {
        label: node.data.label,
        width: visualWidth,  
        height: visualHeight, 
        visualWidth: visualWidth, 
        visualHeight: visualHeight 
      });
      dagreNodeIds.add(node.id); 
    });

    console.log(`[Dagre] Added ${g.nodeCount()} nodes to Dagre graph.`);

    // Temporarily disable setParent to isolate ranking error
    /*
    nodes.forEach((node) => {
      if (!node || !node.id) return;
      if (node.data && node.data.parentId) {
        if (dagreNodeIds.has(node.data.parentId) && dagreNodeIds.has(node.id)) {
          g.setParent(node.id, node.data.parentId);
          // console.log(`[Dagre] Set parent for ${node.id} to ${node.data.parentId}`);
        } else {
          if (!dagreNodeIds.has(node.data.parentId)) {
            // console.warn(`[Dagre] Parent node ${node.data.parentId} for child ${node.id} not found in Dagre graph. Skipping setParent.`);
          }
        }
      }
    });
    */
    console.log('[Dagre] g.setParent calls are TEMPORARILY DISABLED. Graph compound: false.');
    
    const edgesForLayout = edges.filter(edge => {
      if (!edge || !edge.source || !edge.target) {
        console.warn('[Dagre] Encountered invalid edge object:', edge);
        return false; 
      }
      const sourceExists = dagreNodeIds.has(edge.source);
      const targetExists = dagreNodeIds.has(edge.target);
      if (!sourceExists || !targetExists) {
        return false;
      }
      return true;
    });

    console.log(`[Dagre] Number of valid edges for layout: ${edgesForLayout.length}`);
    
    edgesForLayout.forEach((edge) => {
      const edgeName = edge.id || `edge-${edge.source}-${edge.target}-${Math.random().toString(36).substring(7)}`;
      g.setEdge(edge.source, edge.target, { 
        minlen: 1, 
        weight: 1, 
        label: edge.data?.shortLabel || edge.label || '' 
      }, edgeName); 
    });
    console.log(`[Dagre] Added ${g.edgeCount()} edges to Dagre graph.`);

    console.log('[Dagre] Running Dagre layout algorithm...');
    dagre.layout(g);
    console.log('[Dagre] Dagre layout algorithm complete.');

    if (g.nodeCount() > 0) {
      const sampleNodeIds = g.nodes().slice(0, Math.min(5, g.nodeCount()));
      console.log('[Dagre DEBUG] Sample nodes from graph post-layout:');
      sampleNodeIds.forEach(id => {
        const dagreInternalNode = g.node(id);
        console.log(`  ID: ${id}, X: ${dagreInternalNode?.x}, Y: ${dagreInternalNode?.y}, Width: ${dagreInternalNode?.width}, Height: ${dagreInternalNode?.height}`);
      });
    }

    let fallbackIndex = 0;
    const layoutedNodes = nodes.map((originalInputNode) => {
      if (!originalInputNode || !originalInputNode.id) {
        console.warn('[Dagre] Skipping invalid originalInputNode in final map stage.');
        return null; 
      }
      const dagreNodeData = g.node(originalInputNode.id); 

      if (dagreNodeData && typeof dagreNodeData.x === 'number' && typeof dagreNodeData.y === 'number') {
        return {
          ...originalInputNode,
          position: {
            x: dagreNodeData.x - (dagreNodeData.width / 2), 
            y: dagreNodeData.y - (dagreNodeData.height / 2),
          },
          style: { 
            ...originalInputNode.style, 
            width: dagreNodeData.visualWidth || dagreNodeData.width, 
            height: dagreNodeData.visualHeight || dagreNodeData.height 
          },
          data: {
            ...originalInputNode.data,
            dagreCalculated: {
                x: dagreNodeData.x,
                y: dagreNodeData.y,
                width: dagreNodeData.width,
                height: dagreNodeData.height,
            }
          }
        };
      } else {
        console.warn(`[Dagre FALLBACK APPLIED In-Try] Node ${originalInputNode.id} (label: ${originalInputNode.data?.label}) - Dagre data:`, JSON.stringify(dagreNodeData));
        fallbackIndex++;
        return { 
          ...originalInputNode, 
          position: { x: (fallbackIndex % 6) * 200, y: Math.floor(fallbackIndex / 6) * 150 } 
        }; 
      }
    }).filter(node => node !== null);

    if (fallbackIndex > 0) {
        console.warn(`[Dagre] ${fallbackIndex} nodes used IN-TRY fallback positioning due to missing/invalid Dagre coordinates.`);
    }
    console.log('[Dagre] Node position mapping complete. Number of layoutedNodes:', layoutedNodes.length);
    return { nodes: layoutedNodes, edges: edgesForLayout };

  } catch (error) {
    console.error('[Dagre Layout Error Caught]', error, error.stack); 
    let catchFallbackIndex = 0;
    const fallbackNodes = nodes.map((n) => {
      if (!n || !n.id) return null;
      catchFallbackIndex++;
      const newPosition = { x: (catchFallbackIndex % 7) * 180, y: Math.floor(catchFallbackIndex / 7) * 100 };
      // console.log(`[Dagre CATCH FALLBACK] Node ${n.id} assigned fallback position:`, JSON.stringify(newPosition));
      return {
        ...n,
        position: newPosition 
      };
    }).filter(Boolean);
    
    if(fallbackNodes.length > 0) {
        console.warn(`[Dagre CATCH BLOCK FALLBACK] Generated ${fallbackNodes.length} fallback nodes. Sample after CATCH fallback: NodeID: ${fallbackNodes[0].id}, Position: ${JSON.stringify(fallbackNodes[0].position)}`);
    }
    return { nodes: fallbackNodes, edges: edges || [] };
  }
};
