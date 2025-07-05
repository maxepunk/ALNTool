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
import { quadtree } from 'd3-quadtree';
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
    alphaDecay = 0.02, // Slightly faster cooling
    useOwnershipClustering = true // Enable ownership-based clustering
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
    owner_character_id: node.data?.owner_character_id,
    // Add radius for clustering calculations
    radius: getCollisionRadius(node),
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
    isBackground: edge.className === 'background',
    data: edge.data // Include edge data for type information
  }));

  // Create simulation with our separate node data
  const simulation = forceSimulation(simulationNodes)
    .alphaDecay(alphaDecay)
    .velocityDecay(0.4); // Increased friction for smoother movement

  // Add forces
  simulation
    // Repulsion between nodes - MUCH stronger for characters
    .force('charge', forceManyBody()
      .strength(d => {
        // Characters need VERY strong repulsion to stay separated
        if (d.entityCategory === 'character') {
          return -2000; // Very strong repulsion
        }
        // Elements have weak repulsion (let clustering dominate)
        if (d.entityCategory === 'element') {
          return -100; // Weak repulsion
        }
        // Other nodes
        if (d.isBackground) {
          return nodeRepulsion * 0.3;
        }
        return nodeRepulsion;
      })
      .distanceMax(800) // Increased range for character separation
    )
    
    // Cluster-aware collision detection
    .force('collide', function collideForce(alpha) {
      const padding = 1.5; // Separation between same-cluster nodes
      const clusterPadding = 6; // Separation between different-cluster nodes
      const tree = quadtree()
        .x(d => d.x)
        .y(d => d.y)
        .addAll(simulationNodes);
      
      simulationNodes.forEach(node => {
        const radius = getCollisionRadius(node);
        const nx1 = node.x - radius;
        const nx2 = node.x + radius;
        const ny1 = node.y - radius;
        const ny2 = node.y + radius;
        
        tree.visit((quad, x1, y1, x2, y2) => {
          if (quad.data && quad.data !== node) {
            const x = node.x - quad.data.x;
            const y = node.y - quad.data.y;
            const l = Math.sqrt(x * x + y * y);
            
            // Determine if nodes are in same cluster
            const sameCluster = (node.owner_character_id && 
                               node.owner_character_id === quad.data.owner_character_id) ||
                              (node.entityCategory === 'character' && 
                               quad.data.owner_character_id === node.id) ||
                              (quad.data.entityCategory === 'character' && 
                               node.owner_character_id === quad.data.id);
            
            // Much larger spacing between characters
            let spacing;
            if (node.entityCategory === 'character' && quad.data.entityCategory === 'character') {
              spacing = 150; // Very large spacing between characters
            } else if (sameCluster) {
              spacing = padding;
            } else {
              spacing = clusterPadding;
            }
            
            const r = radius + getCollisionRadius(quad.data) + spacing;
            
            if (l < r) {
              const strength = 0.5 * alpha;
              const force = (l - r) / l * strength;
              node.x -= x * force;
              node.y -= y * force;
              quad.data.x += x * force;
              quad.data.y += y * force;
            }
          }
          return x1 > nx2 || x2 < nx1 || y1 > ny2 || y2 < ny1;
        });
      });
    })
    
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
          
          // Ownership links should be very short to create tight clusters
          if (link.data?.type === 'character-element-ownership') {
            return linkDistance * 0.3; // Even shorter for tighter clustering
          }
          
          // Container links also short
          if (link.data?.type === 'element-element-container') {
            return linkDistance * 0.5;
          }
          
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
          // Very strong links for ownership relationships
          if (link.data?.type === 'character-element-ownership') {
            return 1.0; // Maximum strength for tight clustering
          }
          // Strong links for container relationships
          if (link.data?.type === 'element-element-container') {
            return 0.8;
          }
          // Moderate links for character relationships
          if (link.data?.type === 'character-character') {
            return 0.6;
          }
          // Weaker links for background connections
          return link.isBackground ? 0.2 : 0.4;
        })
      : null
    );


  // Add boundary forces to spread nodes and use full viewport
  simulation
    .force('x', forceX()
      .x(d => {
        // Constrain to viewport with padding
        const padding = 80; // Increased padding for node size
        const minX = padding;
        const maxX = width - padding;
        
        // If already outside bounds, pull strongly to nearest edge
        if (d.x < minX) return minX;
        if (d.x > maxX) return maxX;
        
        // Push background nodes toward edges
        if (d.isBackground) {
          return d.x < width / 2 ? width * 0.2 : width * 0.8;
        }
        return width / 2;
      })
      .strength(d => {
        // Strong force when outside bounds
        const padding = 80;
        if (d.x < padding || d.x > width - padding) return 0.8;
        return d.isBackground ? 0.05 : 0.02;
      })
    )
    .force('y', forceY()
      .y(d => {
        // Constrain to viewport with padding
        const padding = 80; // Increased padding for node size
        const minY = padding;
        const maxY = height - padding;
        
        // If already outside bounds, pull strongly to nearest edge
        if (d.y < minY) return minY;
        if (d.y > maxY) return maxY;
        
        // Push background nodes toward edges
        if (d.isBackground) {
          return d.y < height / 2 ? height * 0.2 : height * 0.8;
        }
        return height / 2;
      })
      .strength(d => {
        // Strong force when outside bounds
        const padding = 80;
        if (d.y < padding || d.y > height - padding) return 0.8;
        return d.isBackground ? 0.05 : 0.02;
      })
    );

  // Add ownership clustering force if enabled
  if (useOwnershipClustering) {
    // Track cluster centers for each character
    const clusterCenters = new Map();
    
    // Initialize cluster centers with character positions
    simulationNodes.forEach(node => {
      if (node.entityCategory === 'character') {
        clusterCenters.set(node.id, node);
      }
    });
    
    // Strong clustering force - only affects elements, not characters
    simulation.force('cluster', function clusterForce(alpha) {
      simulationNodes.forEach(node => {
        if (node.owner_character_id && node.entityCategory === 'element') {
          const cluster = clusterCenters.get(node.owner_character_id);
          if (cluster === node) return; // Skip if node is its own cluster
          
          if (cluster) {
            const x = node.x - cluster.x;
            const y = node.y - cluster.y;
            const l = Math.sqrt(x * x + y * y);
            const r = node.radius + cluster.radius;
            
            if (l !== r) {
              const strength = 0.8; // Much stronger than original 0.2
              const force = (l - r) / l * alpha * strength;
              
              // Only move the element, not the character
              node.vx -= x * force;
              node.vy -= y * force;
              // Don't move the cluster center (character) at all
              // cluster.vx += x * force * 0.3;
              // cluster.vy += y * force * 0.3;
            }
          }
        }
      });
    });
    
  }

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
export function applySimulationPositions(reactFlowNodes, simulationNodes, viewportBounds = null) {
  // Create a map of simulation positions for quick lookup
  const positionMap = new Map();
  simulationNodes.forEach(simNode => {
    positionMap.set(simNode.id, {
      x: simNode.x,
      y: simNode.y
    });
  });

  // If no viewport bounds provided, calculate them
  const bounds = viewportBounds || getViewportBounds(
    window.innerWidth,
    window.innerHeight - 100, // Account for UI elements
    50 // padding
  );

  // Return new array with updated positions (immutable update)
  return reactFlowNodes.map(node => {
    const newPosition = positionMap.get(node.id);
    if (newPosition && (node.position.x !== newPosition.x || node.position.y !== newPosition.y)) {
      // Constrain position to viewport bounds
      const constrainedPosition = {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, newPosition.x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, newPosition.y))
      };
      
      return {
        ...node,
        position: constrainedPosition
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

  // Position characters in a grid or circle with MUCH more spacing
  const characterCount = nodesByType.character.length;
  if (characterCount > 0) {
    // For many characters, use a grid layout
    if (characterCount > 12) {
      const cols = Math.ceil(Math.sqrt(characterCount));
      const rows = Math.ceil(characterCount / cols);
      const cellWidth = width / (cols + 1);
      const cellHeight = height / (rows + 1);
      
      nodesByType.character.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        positions[node.id] = {
          x: cellWidth * (col + 1),
          y: cellHeight * (row + 1)
        };
      });
    } else {
      // For fewer characters, use a large circle
      const characterRadius = Math.min(width, height) * 0.4; // 40% of viewport - much larger
      const angleStep = (2 * Math.PI) / characterCount;
      
      nodesByType.character.forEach((node, index) => {
        const angle = index * angleStep - Math.PI / 2; // Start at top
        positions[node.id] = {
          x: centerX + characterRadius * Math.cos(angle),
          y: centerY + characterRadius * Math.sin(angle)
        };
      });
    }
  }

  // Special handling for elements - position near their owners in tight clusters
  if (nodesByType.element.length > 0) {
    const unownedElements = [];
    const elementsByOwner = new Map();
    
    // Group elements by owner first
    nodesByType.element.forEach(elem => {
      if (elem.data?.owner_character_id && positions[elem.data.owner_character_id]) {
        if (!elementsByOwner.has(elem.data.owner_character_id)) {
          elementsByOwner.set(elem.data.owner_character_id, []);
        }
        elementsByOwner.get(elem.data.owner_character_id).push(elem);
      } else {
        unownedElements.push(elem);
      }
    });
    
    // Position elements in tight clusters around their owners
    elementsByOwner.forEach((elements, ownerId) => {
      const ownerPos = positions[ownerId];
      const elementCount = elements.length;
      
      if (elementCount === 1) {
        // Single element - position close to owner
        positions[elements[0].id] = {
          x: ownerPos.x + 40,
          y: ownerPos.y + 40
        };
      } else {
        // Multiple elements - arrange in tight circle around owner
        const clusterRadius = Math.max(50, 30 + elementCount * 8); // Scale with count
        const angleStep = (2 * Math.PI) / elementCount;
        const startAngle = Math.random() * 2 * Math.PI; // Random starting angle
        
        elements.forEach((elem, index) => {
          const angle = startAngle + index * angleStep;
          positions[elem.id] = {
            x: ownerPos.x + clusterRadius * Math.cos(angle),
            y: ownerPos.y + clusterRadius * Math.sin(angle)
          };
        });
      }
    });
    
    // Position unowned elements in outer ring
    if (unownedElements.length > 0) {
      const elementRadius = Math.min(width, height) * 0.5;
      const angleStep = (2 * Math.PI) / unownedElements.length;
      
      unownedElements.forEach((node, index) => {
        const angle = index * angleStep - Math.PI / 2;
        positions[node.id] = {
          x: centerX + elementRadius * Math.cos(angle),
          y: centerY + elementRadius * Math.sin(angle)
        };
      });
    }
  }

  // Position other entity types in outer rings
  const otherTypes = ['puzzle', 'timeline_event', 'aggregated'];
  let currentRadius = Math.min(width, height) * 0.6; // Start at 60% of viewport
  
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