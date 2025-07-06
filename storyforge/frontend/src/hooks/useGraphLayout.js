/**
 * useGraphLayout - Custom hook for managing graph layout
 * Handles force simulation and radial layout based on selection state
 */

import { useEffect, useRef, useCallback } from 'react';
import { 
  createForceSimulation, 
  runSimulation,
  calculateRadialLayout,
  constrainNodesToViewport,
  getViewportBounds
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
    
    const viewportBounds = getViewportBounds();
    
    // Create simulation with ownership clustering
    simulationRef.current = createForceSimulation(nodes, edges, {
      ...viewportBounds,
      strength: {
        charge: -300,
        link: 0.5,
        centerX: 0.05,
        centerY: 0.05
      },
      clusterStrength: 0.3
    });
    
    // Run simulation and update positions
    runSimulation(simulationRef.current, (positions) => {
      const constrainedPositions = constrainNodesToViewport(positions, nodes, viewportBounds);
      
      setNodes(currentNodes => 
        currentNodes.map(node => {
          const newPos = constrainedPositions[node.id];
          return newPos ? { ...node, position: newPos } : node;
        })
      );
      
      // Fit view after layout is complete
      if (!layoutReadyRef.current) {
        layoutReadyRef.current = true;
        setTimeout(() => {
          fitView({ duration: 800, padding: 0.1 });
        }, 100);
      }
    });
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