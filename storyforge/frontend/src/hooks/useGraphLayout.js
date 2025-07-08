/**
 * useGraphLayout - Custom hook for managing graph layout
 * Handles force simulation and radial layout based on selection state
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  createForceSimulation, 
  runSimulation,
  calculateRadialLayout,
  applySimulationPositions,
  getViewportBounds,
  generateInitialPositions
} from '../utils/layoutUtils';
import logger from '../utils/logger';

const useGraphLayout = ({
  nodes,
  edges,
  selectedEntity,
  focusMode,
  setNodes,
  fitView
}) => {
  const simulationRef = useRef(null);
  const layoutReadyRef = useRef(false);
  
  // Set layout ready if we have nodes with positions
  useEffect(() => {
    if (nodes.length > 0 && nodes.some(n => n.position.x !== 0 || n.position.y !== 0)) {
      layoutReadyRef.current = true;
    }
  }, [nodes]);
  
  // Stop simulation cleanup
  const stopSimulation = useCallback(() => {
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
  }, []);
  
  // Apply force layout for overview mode
  const applyForceLayout = useCallback(() => {
    if (!nodes || nodes.length === 0) return;
    
    logger.debug('useGraphLayout: Starting force simulation', {
      nodeCount: nodes.length,
      edgeCount: edges.length
    });
    
    const viewportBounds = getViewportBounds(
      window.innerWidth * 0.7,
      window.innerHeight - 100,
      50
    );
    
    // Apply initial positions if nodes don't have good positions yet
    const needsInitialLayout = nodes.some(n => 
      n.position.x === 0 && n.position.y === 0
    );
    
    if (needsInitialLayout) {
      logger.debug('Applying initial positions before force simulation');
      const initialPositions = generateInitialPositions(nodes, {
        width: viewportBounds.maxX - viewportBounds.minX,
        height: viewportBounds.maxY - viewportBounds.minY
      });
      
      // Apply initial positions
      const nodesWithInitialPositions = nodes.map(node => ({
        ...node,
        position: initialPositions[node.id] || node.position
      }));
      
      setNodes(nodesWithInitialPositions);
      
      // Use nodes with initial positions for simulation
      nodes = nodesWithInitialPositions;
    }
    
    // Create simulation with ownership clustering
    const { simulation, simulationNodes } = createForceSimulation(nodes, edges, {
      width: viewportBounds.maxX - viewportBounds.minX,
      height: viewportBounds.maxY - viewportBounds.minY,
      nodeRepulsion: -800,
      linkDistance: 120,
      centerForce: 0.05,
      useOwnershipClustering: true
    });
    
    simulationRef.current = simulation;
    
    // Track tick count for debugging
    let tickCount = 0;
    
    // Run simulation and update positions on each tick
    runSimulation(simulation, () => {
      tickCount++;
      
      // Apply the simulation positions back to ReactFlow nodes
      const updatedNodes = applySimulationPositions(nodes, simulationNodes, viewportBounds);
      
      // Log progress every 10 ticks
      if (tickCount % 10 === 0) {
        logger.debug('Force simulation progress', {
          tick: tickCount,
          alpha: simulation.alpha(),
          nodesUpdated: updatedNodes.length
        });
      }
      
      setNodes(updatedNodes);
      
      // Fit view after layout stabilizes
      if (!layoutReadyRef.current && simulation.alpha() < 0.1) {
        layoutReadyRef.current = true;
        logger.debug('Force simulation stabilized', {
          totalTicks: tickCount,
          finalAlpha: simulation.alpha()
        });
        setTimeout(() => {
          fitView({ duration: 800, padding: 0.1 });
        }, 100);
      }
    }, 300);
  }, [nodes, edges, setNodes, fitView]);
  
  // Apply radial layout for focus mode
  const applyRadialLayout = useCallback(() => {
    if (!nodes || nodes.length === 0 || !selectedEntity) return;
    
    const centerNode = nodes.find(n => n.id === selectedEntity.id);
    if (!centerNode) return;
    
    logger.debug('useGraphLayout: Applying radial layout', {
      centerNodeId: centerNode.id,
      nodeCount: nodes.length
    });
    
    const positions = calculateRadialLayout(
      centerNode,
      nodes,
      edges,
      {
        width: window.innerWidth * 0.7,
        height: window.innerHeight - 100,
        ringSpacing: 150,
        startAngle: -Math.PI / 2
      }
    );
    
    setNodes(currentNodes => 
      currentNodes.map(node => {
        const newPos = positions[node.id];
        return newPos ? { ...node, position: newPos } : node;
      })
    );
    
    // Fit view to focused nodes
    setTimeout(() => {
      const focusedNodes = nodes.filter(n => {
        const visualState = n.data?.visualState;
        return visualState?.isSelected || visualState?.isConnected;
      });
      
      if (focusedNodes.length > 0) {
        fitView({
          nodes: focusedNodes,
          duration: 800,
          padding: 0.2
        });
      }
    }, 100);
  }, [nodes, edges, selectedEntity, setNodes, fitView]);
  
  // Apply layout based on mode
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    
    // Stop any existing simulation
    stopSimulation();
    
    if (selectedEntity && focusMode !== 'overview') {
      // Apply radial layout for focused view
      applyRadialLayout();
    } else {
      // Apply force layout for overview mode
      applyForceLayout();
    }
    
    // Cleanup on unmount
    return () => {
      stopSimulation();
    };
  }, [selectedEntity, focusMode, applyRadialLayout, applyForceLayout, stopSimulation]);
  
  return {
    stopSimulation,
    layoutReady: layoutReadyRef.current
  };
};

export default useGraphLayout;