/**
 * Layout utilities for graph positioning
 * Provides force-directed and radial layout algorithms
 */

import {
  forceSimulation,
  forceManyBody,
  forceCollide,
  forceCenter,
  forceLink,
  forceX,
  forceY
} from 'd3-force';
import { getCollisionRadius } from './nodeSizeCalculator';

/**
 * Create and configure a force simulation for graph layout
 * CRITICAL: This creates a SEPARATE data structure for d3-force to mutate
 * @param {Array} nodes - Array of ReactFlow node objects (will not be mutated)
 * @param {Array} edges - Array of ReactFlow edge objects (will not be mutated)
 * @param {Object} options - Layout configuration options
 * @returns {Object} Object containing simulation and node map
 */
export function createForceSimulation(nodes, edges, options = {}) {
  const {
    width = 800,
    height = 600,
    nodeRepulsion = -800, // Increased from -300 for better spacing
    linkDistance = 120, // Increased from 50 for 80px nodes
    centerForce = 0.05,
    collisionRadius = 40, // Base collision radius
    alphaDecay = 0.02 // Slightly faster cooling
  } = options;

  // CREATE SEPARATE DATA FOR SIMULATION
  // This is critical - d3 will mutate these objects, not our ReactFlow data
  const simulationNodes = nodes.map(node => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
    // Copy only the data we need for force calculations
    entityCategory: node.data?.entityCategory || node.type,
    isAggregated: node.data?.isAggregated || false,
    isBackground: node.data?.isBackground || node.data?.className?.includes('background'),
    // Store original node reference for easy lookup
    __originalId: node.id
  }));

  // Create a map for quick node lookup by ID
  const nodeMap = new Map();
  simulationNodes.forEach(node => {
    nodeMap.set(node.id, node);
  });

  // Create separate edge data that will reference simulation nodes by ID only
  const simulationEdges = edges.map(edge => ({
    source: edge.source, // Keep as string ID
    target: edge.target, // Keep as string ID
    isBackground: edge.className === 'background'
  }));

  // Create simulation with our separate node data
  const simulation = forceSimulation(simulationNodes)
    .alphaDecay(alphaDecay)
    .velocityDecay(0.4); // Increased friction for smoother movement

  // Add forces
  simulation
    // Repulsion between nodes - much stronger for proper spacing
    .force('charge', forceManyBody()
      .strength(d => {
        // Even stronger repulsion for aggregated nodes
        if (d.isAggregated) {
          return nodeRepulsion * 1.5;
        }
        // Weaker repulsion for background nodes to let them drift away
        if (d.isBackground) {
          return nodeRepulsion * 0.3;
        }
        return nodeRepulsion;
      })
      .distanceMax(400) // Increased range for better spread
    )
    
    // Collision detection to prevent overlap - based on actual visual sizes
    .force('collide', forceCollide()
      .radius(d => {
        // Use the dynamic collision radius calculation
        // This accounts for variable node sizes based on importance metrics
        return getCollisionRadius(d);
      })
      .strength(0.9) // Strong collision avoidance
      .iterations(3) // More iterations for better separation
    )
    
    // Center force - gentle pull to keep graph centered
    .force('center', forceCenter(width / 2, height / 2)
      .strength(centerForce)
    )
    
    // Link force if edges exist
    .force('link', simulationEdges.length > 0 ? 
      forceLink(simulationEdges)
        .id(d => d.id)
        .distance(link => {
          // After d3 processes links, it will replace source/target with node refs
          // But we check both cases for safety
          const sourceNode = typeof link.source === 'string' ? nodeMap.get(link.source) : link.source;
          const targetNode = typeof link.target === 'string' ? nodeMap.get(link.target) : link.target;
          
          // Variable link distance based on node types
          if (sourceNode?.isAggregated || targetNode?.isAggregated) {
            return linkDistance * 2; // Longer links for aggregated nodes
          }
          
          // Character-to-character links need more space
          if (sourceNode?.entityCategory === 'character' && 
              targetNode?.entityCategory === 'character') {
            return linkDistance * 1.5;
          }
          
          return linkDistance;
        })
        .strength(link => {
          // Weaker links for background connections
          return link.isBackground ? 0.2 : 0.4;
        })
      : null
    );

  // Add boundary forces to spread nodes and use full viewport
  simulation
    .force('x', forceX()
      .x(d => {
        // Push background nodes toward edges
        if (d.isBackground) {
          return d.x < width / 2 ? width * 0.2 : width * 0.8;
        }
        return width / 2;
      })
      .strength(d => d.isBackground ? 0.05 : 0.02)
    )
    .force('y', forceY()
      .y(d => {
        // Push background nodes toward edges
        if (d.isBackground) {
          return d.y < height / 2 ? height * 0.2 : height * 0.8;
        }
        return height / 2;
      })
      .strength(d => d.isBackground ? 0.05 : 0.02)
    );

  return {
    simulation,
    simulationNodes,
    nodeMap
  };
}

/**
 * Apply simulation positions back to ReactFlow nodes immutably
 * @param {Array} reactFlowNodes - Current ReactFlow nodes
 * @param {Array} simulationNodes - Simulation nodes with updated positions
 * @returns {Array} New array of ReactFlow nodes with updated positions
 */
export function applySimulationPositions(reactFlowNodes, simulationNodes) {
  // Create a map of simulation positions for quick lookup
  const positionMap = new Map();
  simulationNodes.forEach(simNode => {
    positionMap.set(simNode.id, {
      x: simNode.x,
      y: simNode.y
    });
  });

  // Return new array with updated positions (immutable update)
  return reactFlowNodes.map(node => {
    const newPosition = positionMap.get(node.id);
    if (newPosition && (node.position.x !== newPosition.x || node.position.y !== newPosition.y)) {
      return {
        ...node,
        position: newPosition
      };
    }
    return node;
  });
}

/**
 * Generate initial positions for nodes in a circle/spiral pattern
 * This prevents initial clustering and gives force simulation a good starting point
 * @param {Array} nodes - Array of nodes to position
 * @param {Object} options - Layout options
 * @returns {Object} Map of node IDs to initial positions
 */
export function generateInitialPositions(nodes, options = {}) {
  const {
    width = 800,
    height = 600,
    centerX = width / 2,
    centerY = height / 2
  } = options;

  const positions = {};
  
  // Separate nodes by type for better organization
  const nodesByType = {
    character: [],
    element: [],
    puzzle: [],
    timeline_event: [],
    aggregated: []
  };

  nodes.forEach(node => {
    const category = node.data?.entityCategory || node.type || 'element';
    if (!nodesByType[category]) {
      nodesByType[category] = [];
    }
    nodesByType[category].push(node);
  });

  // Position characters in inner circle (they're most important)
  const characterCount = nodesByType.character.length;
  if (characterCount > 0) {
    const characterRadius = Math.min(width, height) * 0.3; // 30% of viewport
    const angleStep = (2 * Math.PI) / characterCount;
    
    nodesByType.character.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2; // Start at top
      positions[node.id] = {
        x: centerX + characterRadius * Math.cos(angle),
        y: centerY + characterRadius * Math.sin(angle)
      };
    });
  }

  // Position other entity types in outer rings
  const otherTypes = ['element', 'puzzle', 'timeline_event', 'aggregated'];
  let currentRadius = Math.min(width, height) * 0.45; // Start at 45% of viewport
  
  otherTypes.forEach(type => {
    const nodes = nodesByType[type];
    if (nodes.length === 0) return;

    // Use spiral for many nodes, circle for few
    if (nodes.length > 20) {
      // Spiral layout for many nodes
      const angleIncrement = (2 * Math.PI) / 8; // 8 nodes per revolution
      const radiusIncrement = 50; // Space between spiral arms
      
      nodes.forEach((node, index) => {
        const angle = index * angleIncrement;
        const spiralRadius = currentRadius + (index / 8) * radiusIncrement;
        
        positions[node.id] = {
          x: centerX + spiralRadius * Math.cos(angle),
          y: centerY + spiralRadius * Math.sin(angle)
        };
      });
      
      // Update radius for next type
      currentRadius += Math.ceil(nodes.length / 8) * radiusIncrement + 100;
    } else {
      // Circle layout for few nodes
      const angleStep = (2 * Math.PI) / nodes.length;
      
      nodes.forEach((node, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start at top
        positions[node.id] = {
          x: centerX + currentRadius * Math.cos(angle),
          y: centerY + currentRadius * Math.sin(angle)
        };
      });
      
      currentRadius += 150; // Space between rings
    }
  });

  return positions;
}

/**
 * Calculate radial layout positions for character-focused view
 * @param {Object} centerNode - The selected character node
 * @param {Array} nodes - All nodes to position
 * @param {Array} edges - Edge connections
 * @param {Object} options - Layout configuration
 * @returns {Object} Map of node IDs to positions
 */
export function calculateRadialLayout(centerNode, nodes, edges, options = {}) {
  const {
    width = 800,
    height = 600,
    ringSpacing = 100,
    startAngle = 0
  } = options;

  const centerX = width / 2;
  const centerY = height / 2;
  const positions = {};

  // Place center node
  positions[centerNode.id] = {
    x: centerX,
    y: centerY
  };

  // Categorize nodes by their relationship to center
  const rings = {
    owned: [],      // Directly owned elements
    connected: [],  // Other directly connected nodes
    secondary: [],  // Secondary connections
    tertiary: []    // All others
  };

  // Build connection maps
  const directConnections = new Set();
  const secondaryConnections = new Set();

  edges.forEach(edge => {
    if (edge.source === centerNode.id || edge.source.id === centerNode.id) {
      const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
      directConnections.add(targetId);
    } else if (edge.target === centerNode.id || edge.target.id === centerNode.id) {
      const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
      directConnections.add(sourceId);
    }
  });

  // Find secondary connections (nodes connected to direct connections)
  edges.forEach(edge => {
    const sourceId = typeof edge.source === 'string' ? edge.source : edge.source.id;
    const targetId = typeof edge.target === 'string' ? edge.target : edge.target.id;
    
    if (directConnections.has(sourceId) && !directConnections.has(targetId) && targetId !== centerNode.id) {
      secondaryConnections.add(targetId);
    }
    if (directConnections.has(targetId) && !directConnections.has(sourceId) && sourceId !== centerNode.id) {
      secondaryConnections.add(sourceId);
    }
  });

  // Categorize nodes
  nodes.forEach(node => {
    if (node.id === centerNode.id) return;

    // Check if owned by center character
    if (node.data?.owner_character_id === centerNode.id) {
      rings.owned.push(node);
    } else if (directConnections.has(node.id)) {
      rings.connected.push(node);
    } else if (secondaryConnections.has(node.id)) {
      rings.secondary.push(node);
    } else {
      rings.tertiary.push(node);
    }
  });

  // Position nodes in each ring
  let currentRadius = 0;

  // Ring 1: Owned elements
  if (rings.owned.length > 0) {
    currentRadius += ringSpacing;
    positionNodesInRing(rings.owned, centerX, centerY, currentRadius, startAngle, positions);
  }

  // Ring 2: Direct connections
  if (rings.connected.length > 0) {
    currentRadius += ringSpacing;
    positionNodesInRing(rings.connected, centerX, centerY, currentRadius, startAngle + Math.PI / 8, positions);
  }

  // Ring 3: Secondary connections
  if (rings.secondary.length > 0) {
    currentRadius += ringSpacing;
    positionNodesInRing(rings.secondary, centerX, centerY, currentRadius, startAngle - Math.PI / 8, positions);
  }

  // Ring 4: Tertiary (if needed, but keep minimal)
  if (rings.tertiary.length > 0 && rings.tertiary.length < 20) {
    currentRadius += ringSpacing;
    positionNodesInRing(rings.tertiary, centerX, centerY, currentRadius, startAngle + Math.PI / 4, positions);
  }

  return positions;
}

/**
 * Position nodes evenly around a ring
 * @param {Array} nodes - Nodes to position
 * @param {number} centerX - Center X coordinate
 * @param {number} centerY - Center Y coordinate
 * @param {number} radius - Ring radius
 * @param {number} startAngle - Starting angle in radians
 * @param {Object} positions - Position map to update
 */
function positionNodesInRing(nodes, centerX, centerY, radius, startAngle, positions) {
  const angleStep = (2 * Math.PI) / nodes.length;
  
  nodes.forEach((node, index) => {
    const angle = startAngle + index * angleStep;
    positions[node.id] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
}

/**
 * Apply layout positions to nodes with smooth animation
 * @param {Array} nodes - Current nodes
 * @param {Object} positions - New positions map
 * @param {Function} setNodes - ReactFlow setNodes function
 * @param {boolean} animate - Whether to animate the transition
 */
export function applyLayoutPositions(nodes, positions, setNodes, animate = true) {
  setNodes(nodes => 
    nodes.map(node => {
      const newPosition = positions[node.id];
      if (newPosition) {
        return {
          ...node,
          position: animate ? 
            {
              x: node.position.x + (newPosition.x - node.position.x) * 0.5,
              y: node.position.y + (newPosition.y - node.position.y) * 0.5
            } : newPosition
        };
      }
      return node;
    })
  );
}

/**
 * Run force simulation until it stabilizes
 * @param {Object} simulation - D3 force simulation
 * @param {Function} onTick - Callback for each tick
 * @param {number} maxIterations - Maximum iterations before stopping
 */
export function runSimulation(simulation, onTick, maxIterations = 300) {
  let iterations = 0;
  
  simulation.on('tick', () => {
    iterations++;
    onTick();
    
    // Stop if we've run too many iterations or alpha is very low
    if (iterations >= maxIterations || simulation.alpha() < 0.001) {
      simulation.stop();
    }
  });
  
  // Start the simulation
  simulation.restart();
}

/**
 * Get viewport bounds with padding
 * @param {number} width - Viewport width
 * @param {number} height - Viewport height
 * @param {number} padding - Padding from edges
 * @returns {Object} Bounds object
 */
export function getViewportBounds(width, height, padding = 50) {
  return {
    minX: padding,
    maxX: width - padding,
    minY: padding,
    maxY: height - padding
  };
}

/**
 * Constrain node positions to viewport bounds
 * @param {Array} nodes - Nodes to constrain
 * @param {Object} bounds - Viewport bounds
 * @returns {Array} Nodes with constrained positions
 */
export function constrainNodesToViewport(nodes, bounds) {
  return nodes.map(node => ({
    ...node,
    position: {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, node.position.x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, node.position.y))
    }
  }));
}