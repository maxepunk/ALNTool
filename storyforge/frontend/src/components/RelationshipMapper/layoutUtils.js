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
    return { nodes: [], edges: [] };
  }

  try {
    // Initialize Dagre graph with compound node support
    const g = new dagre.graphlib.Graph({ compound: true, multigraph: true }); 

    const defaultOptions = {
      rankdir: 'TB', // Top-to-Bottom ranking
      align: undefined, // Node alignment (e.g., 'UL', 'UR', 'DL', 'DR')
      nodesep: 80,    // Separation between nodes in the same rank
      ranksep: 100,   // Separation between ranks
      marginx: 20,    // Margin for the x-axis
      marginy: 20,    // Margin for the y-axis
      nodeWidth: 170, // Default width for standard nodes
      nodeHeight: 60, // Default height for standard nodes
      centerNodeWidth: 190, // Width for the central node
      centerNodeHeight: 70, // Height for the central node
      // For future fine-tuning of compound node internal spacing, consider:
      // rankPadding: <value>, // Padding between ranks for compound nodes
      // nodePadding: <value>, // Padding around each node within a compound node
    };
    const config = { ...defaultOptions, ...options };

    g.setGraph(config);
    g.setDefaultEdgeLabel(() => ({})); // Default label for edges if not specified

    const dagreNodeIds = new Set(); 
    nodes.forEach((node) => {
      // Determine visual dimensions for the node itself (not inflated for children)
      const visualWidth = node.data.isCenter ? config.centerNodeWidth : config.nodeWidth;
      const visualHeight = node.data.isCenter ? config.centerNodeHeight : config.nodeHeight;

      g.setNode(node.id, {
        label: node.data.label,
        width: visualWidth,  // Use actual visual width for Dagre node
        height: visualHeight, // Use actual visual height for Dagre node
        // Store visual dimensions separately if needed for React Flow rendering style
        visualWidth: visualWidth, 
        visualHeight: visualHeight 
      });
      dagreNodeIds.add(node.id); 
    });

    // Set parent-child relationships for compound nodes
    // This must be done after all nodes are added to the graph.
    nodes.forEach((node) => {
      if (node.data && node.data.parentId) {
        if (dagreNodeIds.has(node.data.parentId) && dagreNodeIds.has(node.id)) {
          g.setParent(node.id, node.data.parentId);
          console.log(`[Dagre] Set parent for ${node.id} to ${node.data.parentId}`);
        } else {
          if (!dagreNodeIds.has(node.data.parentId)) {
            console.warn(`[Dagre] Parent node ${node.data.parentId} for child ${node.id} not found in Dagre graph. Skipping setParent.`);
          }
          if (!dagreNodeIds.has(node.id)) {
            // This case should ideally not happen if the outer loop iterates over `nodes`
            // which are the source for `dagreNodeIds`.
            console.warn(`[Dagre] Child node ${node.id} itself not found in Dagre graph. Skipping setParent.`);
          }
        }
      }
    });
    
    // Filter edges to ensure both source and target nodes exist in the Dagre graph
    const edgesForLayout = edges.filter(edge => {
      const sourceExists = dagreNodeIds.has(edge.source);
      const targetExists = dagreNodeIds.has(edge.target);
      if (!sourceExists) console.warn(`[Dagre Pre-filter] Edge ${edge.id || 'N/A'} source node ${edge.source} not in Dagre graph. Filtering out edge.`);
      if (!targetExists) console.warn(`[Dagre Pre-filter] Edge ${edge.id || 'N/A'} target node ${edge.target} not in Dagre graph. Filtering out edge.`);
      return sourceExists && targetExists;
    });

    console.log(`[Dagre] Number of edges after filtering for valid nodes: ${edgesForLayout.length}`);
    
    edgesForLayout.forEach((edge) => {
      // Dagre uses edge names to support multigraphs. Using edge.id or a unique string.
      const edgeName = edge.id || `edge-${edge.source}-${edge.target}`;
      g.setEdge(edge.source, edge.target, { 
        minlen: 1, // Minimum length of an edge (number of ranks)
        weight: 1, // Weight of an edge (higher weight pulls nodes closer)
        label: edge.data?.shortLabel || edge.label || '' 
      }, edgeName); 
    });
    
    console.log('[Dagre] Graph structure BEFORE layout call:');
    g.nodes().forEach(nodeId => {
      const nodeDetails = { id: nodeId, data: g.node(nodeId), parent: g.parent(nodeId) };
      if (g.children(nodeId) && g.children(nodeId).length > 0) {
        nodeDetails.children = g.children(nodeId);
      }
      console.log(JSON.stringify(nodeDetails));
    });
    console.log('[Dagre] Edges in graph object (g.edges()):', JSON.stringify(g.edges()));

    console.log('[Dagre] Running Dagre layout algorithm');
    dagre.layout(g);

    console.log('[Dagre] Layout complete. Extracting node positions.');
    const layoutedNodes = nodes.map((node) => {
      const dagreNode = g.node(node.id); // Get the layouted node from Dagre graph
      if (dagreNode) {
        return {
          ...node,
          position: {
            // Dagre provides center x,y; adjust for top-left for React Flow
            x: dagreNode.x - dagreNode.width / 2, 
            y: dagreNode.y - dagreNode.height / 2,
          },
          // Ensure React Flow uses the original visual dimensions for styling,
          // as Dagre might have different width/height internally after layout.
          style: { 
            ...node.style, 
            width: dagreNode.visualWidth || config.nodeWidth, 
            height: dagreNode.visualHeight || config.nodeHeight 
          },
          // Store dagre calculated width/height if needed for debugging or advanced rendering
          dagreLayout: {
            width: dagreNode.width,
            height: dagreNode.height,
            x: dagreNode.x,
            y: dagreNode.y
          }
        };
      }
      // Fallback if node not found in Dagre graph (should not happen if logic is correct)
      console.warn(`[Dagre] Node ${node.id} not found in Dagre graph after layout. Returning original node.`);
      return node; 
    });

    return { nodes: layoutedNodes, edges: edgesForLayout }; // Return edgesForLayout as they were the ones used

  } catch (error) {
    console.error('[Dagre Layout Error Caught]', error); 
    // Fallback: return original nodes to prevent UI crash
    const fallbackNodes = nodes.map((n, i) => {
      if (!n.position) n.position = { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 };
      return n;
    });
    return { nodes: fallbackNodes, edges: edges || [] };
  }
};
