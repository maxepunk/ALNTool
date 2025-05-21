/**
 * Layout utilities for arranging nodes in the relationship mapper.
 * This file provides multiple layout algorithms for visualizing entity relationships.
 */

import * as d3 from 'd3-force';
import dagre from 'dagre';

// Sector settings for radial layout
const GROUP_SETTINGS = {
  Character: { angle: -Math.PI / 2, order: 1, radiusFactor: 1.0 }, // Top
  Puzzle: { angle: 0, order: 2, radiusFactor: 1.1 },               // Right
  Element: { angle: Math.PI / 2, order: 3, radiusFactor: 1.0 },    // Bottom
  Timeline: { angle: Math.PI, order: 4, radiusFactor: 1.2 },       // Left
  Unknown: { angle: Math.PI * 1.5, order: 5, radiusFactor: 0.9}    // Default for other types
};

const DEFAULT_GROUP_SETTING = { angle: Math.PI * 1.5, order: 5, radiusFactor: 0.9 };

/**
 * Applies a custom radial layout to nodes, organizing them by entity type in sectors
 * 
 * @param {Array} nodes - The nodes to lay out
 * @param {Array} edges - The edges connecting nodes
 * @param {Object} options - Layout configuration options
 * @returns {Object} Object containing positioned nodes and edges
 */
export const getCustomRadialLayout = (nodes, edges, options = {}) => {
  console.log('Applying radial layout to', nodes?.length || 0, 'nodes');
  
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  try {
    const centerNode = nodes.find(node => node.data.isCenter);
    if (!centerNode) {
      console.warn('No center node found for radial layout.');
      // Fallback: simple grid or return as is
      nodes.forEach((n, i) => {
        if (!n.position) n.position = { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 };
      });
      return { nodes, edges };
    }

    const centerPosition = { x: 0, y: 0 };
    centerNode.position = { ...centerPosition };

    const nodesToArrange = nodes.filter(node => node.id !== centerNode.id);

    if (nodesToArrange.length === 0) {
      return { nodes, edges };
    }

    const defaultOptions = {
      baseRadius: 320,             // Base radius for the first ring
      minRadiusBetweenNodes: 130,  // Minimum radius between nodes
      listSpacing: 90,             // Spacing for list layouts
      maxNodesRadial: 5,           // Maximum nodes per ring
      nodeWidth: 180,              // Average node width for spacing calculations
      nodeHeight: 80,              // Average node height for spacing calculations
    };
    const config = { ...defaultOptions, ...options };

    // Group nodes by their type
    const nodesByType = {};
    nodesToArrange.forEach(node => {
      const type = node.data.type || 'Unknown';
      if (!nodesByType[type]) {
        nodesByType[type] = [];
      }
      nodesByType[type].push(node);
    });

    // Sort group keys by predefined order for consistent layout
    const sortedGroupKeys = Object.keys(nodesByType).sort((a, b) => {
      const orderA = (GROUP_SETTINGS[a] || DEFAULT_GROUP_SETTING).order;
      const orderB = (GROUP_SETTINGS[b] || DEFAULT_GROUP_SETTING).order;
      return orderA - orderB;
    });
    
    // For each group, arrange nodes in their sector
    sortedGroupKeys.forEach(typeKey => {
      console.log(`Laying out ${typeKey} group with ${nodesByType[typeKey].length} nodes`);
      
      const groupNodes = nodesByType[typeKey];
      const numNodesInGroup = groupNodes.length;
      const groupConfig = GROUP_SETTINGS[typeKey] || DEFAULT_GROUP_SETTING;
      const groupBaseAngle = groupConfig.angle;
      const groupRadius = config.baseRadius * groupConfig.radiusFactor;

      if (numNodesInGroup === 0) return;

      const maxPerRing = config.maxNodesRadial;
      const ringCount = Math.ceil(numNodesInGroup / maxPerRing);

      const angularSpreadForGroup = Math.min(Math.PI / 3, maxPerRing * Math.atan2(config.nodeWidth * 1.2, groupRadius));
      const angleStep = maxPerRing > 1 ? angularSpreadForGroup / (maxPerRing - 1) : 0;
      const startAngleBase = groupBaseAngle - (maxPerRing > 1 ? angularSpreadForGroup / 2 : 0);

      groupNodes.forEach((node, index) => {
        const ringIndex = Math.floor(index / maxPerRing); // 0-based
        const indexInRing = index % maxPerRing;
        const angle = startAngleBase + indexInRing * angleStep;
        const R = groupRadius + ringIndex * (config.minRadiusBetweenNodes + 40);

        node.position = {
          x: centerPosition.x + R * Math.cos(angle),
          y: centerPosition.y + R * Math.sin(angle),
        };
      });
    });
    
    return { nodes, edges };

  } catch (error) {
    console.error('Error in getCustomRadialLayout:', error);
    // Fallback to prevent crashing
    nodes.forEach((n, i) => {
      if (!n.position) n.position = { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 };
    });
    return { nodes: nodes || [], edges: edges || [] };
  }
};

/**
 * Applies a force-directed layout using d3-force simulation
 * 
 * @param {Array} nodes - The nodes to lay out
 * @param {Array} edges - The edges connecting nodes
 * @param {Object} options - Layout configuration options
 * @returns {Object} Object containing positioned nodes and edges
 */
export const getForceDirectedLayout = (nodes, edges, options = {}) => {
  console.log('Applying force-directed layout to', nodes?.length || 0, 'nodes');
  
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  try {
    const centerNode = nodes.find(node => node.data.isCenter);
    const layoutNodes = nodes.map(n => ({ ...n })); // Clone nodes for simulation
    const layoutEdges = edges.map(e => ({ ...e })); // Clone edges

    const defaultOptions = {
      width: options.width || 800,
      height: options.height || 600,
      chargeStrength: -150,     // Repulsion between nodes
      linkDistance: 100,        // Ideal distance between connected nodes
      linkStrength: 0.8,        // Link elasticity 
      centerStrength: 0.05,     // Pull toward center
      iterations: 150,          // Simulation ticks to run
    };
    const config = { ...defaultOptions, ...options };

    // Fix center node position
    if (centerNode) {
      const centerLayoutNode = layoutNodes.find(n => n.id === centerNode.id);
      if(centerLayoutNode) {
        centerLayoutNode.fx = 0; // Fix x position
        centerLayoutNode.fy = 0; // Fix y position
      }
    }

    // Create and configure d3-force simulation
    const simulation = d3.forceSimulation(layoutNodes)
      .force("link", d3.forceLink(layoutEdges).id(d => d.id).distance(config.linkDistance).strength(config.linkStrength))
      .force("charge", d3.forceManyBody().strength(config.chargeStrength))
      .force("center", d3.forceCenter(0, 0).strength(config.centerStrength))
      .force("collide", d3.forceCollide().radius(d => (d.data.isCenter ? 80 : 70)).strength(0.7))
      .stop();

    // Run simulation ticks synchronously
    console.log(`Running force simulation for ${config.iterations} iterations`);
    simulation.tick(config.iterations);

    // Update original nodes with calculated positions
    const positionMap = new Map(layoutNodes.map(n => [n.id, { x: n.x, y: n.y }]));
    const finalNodes = nodes.map(n => ({
      ...n,
      position: positionMap.get(n.id) || n.position || { x: 0, y: 0 },
    }));

    return { nodes: finalNodes, edges };

  } catch (error) {
    console.error('Error in getForceDirectedLayout:', error);
    // Fallback to prevent crashing
    nodes.forEach((n, i) => {
        if (!n.position) n.position = { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 };
    });
    return { nodes: nodes || [], edges: edges || [] };
  }
};

/**
 * Applies a hierarchical layout using Dagre
 * 
 * @param {Array} nodes - The nodes to lay out
 * @param {Array} edges - The edges connecting nodes
 * @param {Object} options - Layout configuration options
 * @returns {Object} Object containing positioned nodes and edges
 */
export const getDagreLayout = (nodes, edges, options = {}) => {
  console.log('Applying hierarchical layout to', nodes?.length || 0, 'nodes (excluding central node if applicable)');
  
  if (!nodes || nodes.length === 0) {
    return { nodes: [], edges: [] };
  }

  try {
    const g = new dagre.graphlib.Graph({ compound: true, multigraph: true }); 

    const defaultOptions = {
      rankdir: 'TB',           
      align: undefined,        
      nodesep: 80, // Increased from 60 to give more horizontal space between potential orbit groups
      ranksep: 100, // Increased from 70 to give more vertical space
      marginx: 20,
      marginy: 20,
      nodeWidth: 170, 
      nodeHeight: 60,
      centerNodeWidth: 190,
      centerNodeHeight: 70,
    };
    const config = { ...defaultOptions, ...options };

    // New constants for orbit calculation and effective size estimation
    const TYPICAL_CHILD_WIDTH = config.nodeWidth;
    const TYPICAL_CHILD_HEIGHT = config.nodeHeight;
    const DESIRED_GAP_CHILD_PARENT = 30;
    const MAX_ORBITING_CHILDREN_FOR_SIZE_ESTIMATE = 4;
    const ORBIT_PER_CHILD_FACTOR = config.perChildFactor || 25;

    g.setGraph(config);
    g.setDefaultEdgeLabel(() => ({}));

    const hubTypesForOrbit = new Set(["Puzzle", "Element"]);

    const dagreNodeIds = new Set(); 
    nodes.forEach((node) => {
      // Determine initial visual dimensions (these are for the node itself)
      const visualWidth = node.data.isCenter ? config.centerNodeWidth : config.nodeWidth;
      const visualHeight = node.data.isCenter ? config.centerNodeHeight : config.nodeHeight;

      let dagreNodeWidth = visualWidth;
      let dagreNodeHeight = visualHeight;

      // Check if this node is a hub that will have orbiting children
      const isOrbitHub = hubTypesForOrbit.has(node.data?.type) &&
        nodes.some(n => n.data?.parentId === node.id);

      if (isOrbitHub) {
        // Calculate the base radius for children orbiting this parent
        const baseOrbitRadiusForCalc = (visualWidth / 2) + (TYPICAL_CHILD_WIDTH / 2) + DESIRED_GAP_CHILD_PARENT;
        // Estimate maximum expansion due to multiple children
        const radiusExpansionEstimate = Math.max(0, MAX_ORBITING_CHILDREN_FOR_SIZE_ESTIMATE - 1) * ORBIT_PER_CHILD_FACTOR;
        const estimatedFullOrbitRadius = baseOrbitRadiusForCalc + radiusExpansionEstimate;
        // The maximum extent from the parent's center to the outer edge of an orbiting child
        const maxExtentFromHubCenter = estimatedFullOrbitRadius + (TYPICAL_CHILD_WIDTH / 2);
        // Set the effective size for Dagre to allocate space for the hub + its orbit
        dagreNodeWidth = 2 * maxExtentFromHubCenter;
        dagreNodeHeight = 2 * maxExtentFromHubCenter; // Make it a square area for simplicity
      }

      g.setNode(node.id, {
        label: node.data.label,
        width: dagreNodeWidth,
        height: dagreNodeHeight,
        visualWidth: visualWidth,
        visualHeight: visualHeight
      });
      dagreNodeIds.add(node.id); 
    });

    nodes.forEach((node) => {
      if (node.data && node.data.parentId) {
        // No compound parent in Dagre; orbiting logic will handle grouping visually
      }
    });

    console.log(`[Dagre] Initial number of edges for Dagre processing: ${edges.length}`);
    const edgesWithValidNodes = edges.filter(edge => {
      const sourceExists = dagreNodeIds.has(edge.source);
      const targetExists = dagreNodeIds.has(edge.target);
      if (!sourceExists) console.warn(`[Dagre Pre-filter] Edge ${edge.id} source node ${edge.source} not in Dagre graph. Filtering out edge.`);
      if (!targetExists) console.warn(`[Dagre Pre-filter] Edge ${edge.id} target node ${edge.target} not in Dagre graph. Filtering out edge.`);
      return sourceExists && targetExists;
    });
    console.log(`[Dagre] Number of edges after filtering for valid nodes: ${edgesWithValidNodes.length}`);

    // Edges for layout are now directly the ones filtered for valid nodes
    const edgesForLayout = edgesWithValidNodes;
    console.log(`[Dagre] Number of edges passed to layout: ${edgesForLayout.length}`);

    let successfullyAddedEdges = 0;
    edgesForLayout.forEach((edge, index) => {
      try {
        g.setEdge(edge.source, edge.target, { minlen: 1, weight: 1, label: edge.data?.shortLabel || edge.label || '' }, edge.id); 
        successfullyAddedEdges++;
      } catch (e) {
        console.error(`[Dagre] Error during g.setEdge for edge index ${index} (ID: ${edge.id}, Source: ${edge.source}, Target: ${edge.target}):`, e);
      }
    });
    console.log(`[Dagre] Attempted to add ${edgesForLayout.length} edges. Counter for successful g.setEdge calls: ${successfullyAddedEdges}`);

    const dagreGraphEdges = g.edges();
    console.log(`[Dagre] g.edges().length after loop: ${dagreGraphEdges.length}`);

    if (edgesForLayout.length !== dagreGraphEdges.length) {
      const dagreAcceptedEdgeKeys = new Set();
      dagreGraphEdges.forEach(e => {
        const key = e.name ? `${e.v}->${e.w}(${e.name})` : `${e.v}->${e.w}`;
        dagreAcceptedEdgeKeys.add(key);
      });
      const attemptedButNotAddedByDagre = edgesForLayout.filter(origEdge => {
        const edgeKeyWithName = `${origEdge.source}->${origEdge.target}(${origEdge.id})`;
        const edgeKeyWithoutName = `${origEdge.source}->${origEdge.target}`;
        return !dagreAcceptedEdgeKeys.has(edgeKeyWithName) && !dagreAcceptedEdgeKeys.has(edgeKeyWithoutName) ;
      }).map(e => ({id: e.id, source: e.source, target: e.target, label: e.data?.label || e.label, type: e.data?.type, original_edge_obj: e })); 
      if (attemptedButNotAddedByDagre.length > 0) {
        console.warn(`[Dagre] ${attemptedButNotAddedByDagre.length} EDGES PASSED OUR FILTER BUT WERE NOT IN g.edges() (Dagre silently dropped them):`, JSON.stringify(attemptedButNotAddedByDagre, null, 2));
      }
    }
    
    console.log('[Dagre] Graph structure BEFORE layout call:');
    console.log('[Dagre] Nodes in graph object (g.nodes()):', JSON.stringify(g.nodes().map(nodeId => ({ id: nodeId, data: g.node(nodeId), parent: g.parent(nodeId) }))));
    console.log('[Dagre] Edges in graph object (g.edges()):', JSON.stringify(g.edges()));
    g.nodes().forEach(nodeId => {
      if (g.children(nodeId) && g.children(nodeId).length > 0) {
        console.log(`[Dagre] Parent: ${nodeId}, Children: ${JSON.stringify(g.children(nodeId))}`);
      }
    });
    
    console.log('[Dagre] Running Dagre layout algorithm');
    dagre.layout(g);

    console.log('[Dagre] Layout complete. Extracting node positions and DIMENTIONS:');
    let layoutedNodes = nodes.map((node) => {
      const nodeWithPosition = g.node(node.id);
      if (nodeWithPosition) {
        return {
          ...node,
          position: {
            x: nodeWithPosition.x - nodeWithPosition.width / 2,
            y: nodeWithPosition.y - nodeWithPosition.height / 2,
          },
          style: { ...node.style, width: nodeWithPosition.visualWidth, height: nodeWithPosition.visualHeight },
        };
      }
      return node;
    });

    // -------------------------------------------------------------
    // Post-process: orbit children around their hub parent so that
    // they don't occupy the same rectangle.  Applied only to parents
    // that are Puzzles or Elements (containers) but can be extended.
    // -------------------------------------------------------------
    const idToNodeMap = new Map(layoutedNodes.map(n => [n.id, n]));

    layoutedNodes.forEach(parentNodeFromLayout => {
      // Find the original node data to get visual dimensions and check parentage
      const originalParentNode = nodes.find(n => n.id === parentNodeFromLayout.id);
      if (!originalParentNode) return;

      const children = nodes.filter(n => n.data?.parentId === originalParentNode.id);
      if (!children.length) return;

      if (!hubTypesForOrbit.has(originalParentNode.data?.type)) return;

      // Use the VISUAL width of the parent for orbit calculation
      const visualParentWidth = originalParentNode.data.isCenter ? config.centerNodeWidth : config.nodeWidth;
      // const visualParentHeight = originalParentNode.data.isCenter ? config.centerNodeHeight : config.nodeHeight;

      // Recalculate baseOrbitRadius based on visual sizes and desired gap
      const baseOrbitRadius = (visualParentWidth / 2) + (TYPICAL_CHILD_WIDTH / 2) + DESIRED_GAP_CHILD_PARENT;
      const perChildFactorToUse = options.perChildFactor || ORBIT_PER_CHILD_FACTOR;
      const radiusExpansion = Math.max(0, children.length - 1) * perChildFactorToUse;
      const R = baseOrbitRadius + radiusExpansion;

      const angleStep = (2 * Math.PI) / children.length;
      let startAngle = -Math.PI / 2; // Default: Start at the top for the first child (0 radians is right)

      // Aesthetic adjustments for small numbers of children:
      if (children.length === 1) {
        startAngle = Math.PI / 2; // Place a single child directly below the parent
      } else if (children.length === 2) {
        startAngle = Math.PI / 2 - Math.PI / 4; // 45 degrees (bottom-right quadrant)
      } else if (children.length === 3) {
        startAngle = -Math.PI / 2; // Top, then ~120, ~240 degrees
      } else if (children.length === 4) {
        startAngle = -Math.PI / 2 + Math.PI / 4; // 45 degrees offset
      }
      // For > 4 children, the default startAngle and even angleStep usually work well.

      children.forEach((childNode, idx) => {
        const angle = startAngle + idx * angleStep;
        const cx = (parentNodeFromLayout.position?.x || 0) + R * Math.cos(angle);
        const cy = (parentNodeFromLayout.position?.y || 0) + R * Math.sin(angle);
        const childNodeRef = idToNodeMap.get(childNode.id);
        if (childNodeRef) {
          childNodeRef.position = { x: cx, y: cy };
          childNodeRef.data.isManuallyPositioned = true;
          // Ensure the child node uses its standard visual size, not an inflated one
          childNodeRef.style = {
            ...childNodeRef.style,
            width: childNode.data.isCenter ? config.centerNodeWidth : config.nodeWidth,
            height: childNode.data.isCenter ? config.centerNodeHeight : config.nodeHeight
          };
        }
      });
    });

    return { nodes: layoutedNodes, edges };

  } catch (error) {
    console.error('[Dagre Layout Error Caught]', error, JSON.stringify(error)); 
    nodes.forEach((n, i) => {
      if (!n.position) n.position = { x: (i % 5) * 200, y: Math.floor(i / 5) * 150 };
    });
    return { nodes: nodes || [], edges: edges || [] };
  }
}; 