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
    const g = new dagre.graphlib.Graph({ compound: true, multigraph: true }); 

    const defaultOptions = {
      rankdir: 'TB', 
      align: undefined, 
      nodesep: 80,    
      ranksep: 100,   
      marginx: 20,    
      marginy: 20,    
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
        return; // Skip invalid node
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

    nodes.forEach((node) => {
      if (!node || !node.id) return; // Skip invalid node already warned about
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
    
    const edgesForLayout = edges.filter(edge => {
      if (!edge || !edge.source || !edge.target) {
        console.warn('[Dagre] Encountered invalid edge object:', edge);
        return false; // Skip invalid edge
      }
      const sourceExists = dagreNodeIds.has(edge.source);
      const targetExists = dagreNodeIds.has(edge.target);
      if (!sourceExists || !targetExists) {
        // console.warn(`[Dagre Pre-filter] Edge source/target not in Dagre graph. Edge:`, edge);
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

    // DEBUG: Inspect a few nodes directly from Dagre graph object after layout
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
        return null; // Or some placeholder to filter out later
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
        // Fallback if node not found in Dagre graph OR x/y are not numbers
        console.warn(`[Dagre FALLBACK] Node ${originalInputNode.id} (label: ${originalInputNode.data?.label}) either not found in Dagre graph post-layout or has invalid x/y. Dagre node data:`, JSON.stringify(dagreNodeData));
        fallbackIndex++;
        return { 
          ...originalInputNode, 
          position: { x: (fallbackIndex % 5) * 200, y: Math.floor(fallbackIndex / 5) * 150 + 50 } // Staggered fallback positions
        }; 
      }
    }).filter(node => node !== null); // Filter out any null nodes from invalid input

    if (fallbackIndex > 0) {
        console.warn(`[Dagre] ${fallbackIndex} nodes used fallback positioning.`);
    }
    console.log('[Dagre] Node position mapping complete.');
    return { nodes: layoutedNodes, edges: edgesForLayout };

  } catch (error) {
    console.error('[Dagre Layout Error Caught]', error); 
    const fallbackNodes = nodes.map((n, i) => {
      if (!n) return null;
      return {
        ...n,
        position: n.position || { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 + 1000 } // Position far away if error
      }
    }).filter(Boolean);
    return { nodes: fallbackNodes, edges: edges || [] };
  }
};
