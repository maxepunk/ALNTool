/**
 * AdaptiveGraphCanvas - Intelligent graph that responds to entity selection
 * 
 * Features:
 * - Focus mode: Shows only connected entities when one is selected
 * - Visual hierarchy: Selected → Connected → Secondary → Background
 * - Smart clustering: Elements stay near their owners through forces
 * - Smooth transitions between states
 * - No aggregation - all entities always visible with visual management
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ReactFlow, Controls, Background, MiniMap, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import { Box } from '@mui/material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import logger from '../../utils/logger';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import { 
  createForceSimulation, 
  runSimulation,
  calculateRadialLayout,
  applyLayoutPositions,
  applySimulationPositions,
  constrainNodesToViewport,
  getViewportBounds
} from '../../utils/layoutUtils';

// Utility to get connected entities based on selection
const getConnectedEntities = (selectedEntity, allNodes, characterConnections = []) => {
  const connected = new Set([selectedEntity.id]);
  const secondaryConnected = new Set();
  
  // Get the entity type from either entityCategory or type field
  const entityType = selectedEntity.entityCategory || selectedEntity.type;
  
  switch (entityType) {
    case 'character':
      // Get owned elements
      allNodes.forEach(node => {
        if (node.data.owner_character_id === selectedEntity.id) {
          connected.add(node.id);
          
          // Also get elements contained in owned elements
          allNodes.forEach(innerNode => {
            if (innerNode.data.container_element_id === node.id) {
              connected.add(innerNode.id);
            }
          });
        }
      });
      
      // Get connected characters (secondary connections)
      characterConnections.forEach(conn => {
        if (conn.source === selectedEntity.id) {
          secondaryConnected.add(conn.target);
        } else if (conn.target === selectedEntity.id) {
          secondaryConnected.add(conn.source);
        }
      });
      break;
      
    case 'element':
      // Add owner
      if (selectedEntity.owner_character_id) {
        connected.add(selectedEntity.owner_character_id);
      }
      
      // Add container
      if (selectedEntity.container_element_id) {
        connected.add(selectedEntity.container_element_id);
      }
      
      // Add contained elements
      allNodes.forEach(node => {
        if (node.data.container_element_id === selectedEntity.id) {
          connected.add(node.id);
        }
      });
      break;
      
    case 'puzzle':
      // Add reward elements
      if (selectedEntity.rewardIds) {
        selectedEntity.rewardIds.forEach(id => connected.add(id));
      }
      
      // Add required elements
      if (selectedEntity.requiredElements) {
        selectedEntity.requiredElements.forEach(id => connected.add(id));
      }
      break;
      
    case 'timeline_event':
      // Add revealing elements
      allNodes.forEach(node => {
        if (node.data.timeline_event_id === selectedEntity.id) {
          connected.add(node.id);
        }
      });
      break;
  }
  
  return { connected, secondaryConnected };
};

// Calculate visual properties based on selection and connections
const calculateVisualProperties = (node, selectedEntity, connected, secondaryConnected) => {
  if (!selectedEntity) {
    // Overview mode - all nodes fully visible
    return {
      opacity: 1,
      scale: 1,
      blur: 0,
      zIndex: 1,
      className: '',
      isSelected: false,
      isConnected: false,
      isSecondaryConnected: false,
      isBackground: false
    };
  }
  
  // Focus mode - apply visual hierarchy
  if (node.id === selectedEntity.id) {
    return {
      opacity: 1,
      scale: 1.2,
      blur: 0,
      zIndex: 10,
      className: 'selected',
      isSelected: true,
      isConnected: false,
      isSecondaryConnected: false,
      isBackground: false
    };
  } else if (connected.has(node.id)) {
    return {
      opacity: 0.9,
      scale: 1,
      blur: 0,
      zIndex: 5,
      className: 'connected',
      isSelected: false,
      isConnected: true,
      isSecondaryConnected: false,
      isBackground: false
    };
  } else if (secondaryConnected.has(node.id)) {
    return {
      opacity: 0.6,
      scale: 0.9,
      blur: 0,
      zIndex: 3,
      className: 'secondary-connected',
      isSelected: false,
      isConnected: false,
      isSecondaryConnected: true,
      isBackground: false
    };
  } else {
    return {
      opacity: 0.3,  // Increased from 0.2 for better visibility
      scale: 0.9,    // Increased from 0.8
      blur: 0,       // Removed blur - too aggressive
      zIndex: 1,
      className: 'background',
      isSelected: false,
      isConnected: false,
      isSecondaryConnected: false,
      isBackground: true
    };
  }
};

const AdaptiveGraphCanvas = ({ 
  graphData = { nodes: [], edges: [], metadata: {} },
  elements = [] // Keep for intelligence analysis
}) => {
  logger.debug('🔍 AdaptiveGraphCanvas: Rendering with', {
    nodesCount: graphData.nodes?.length || 0,
    edgesCount: graphData.edges?.length || 0,
    elementsCount: elements.length,
    nodeTypes: Object.keys(nodeTypes),
    edgeTypes: Object.keys(edgeTypes)
  });
  
  const { 
    selectedEntity, 
    setSelectedEntity,
    focusMode,
    setFocusMode,
    updateNodeCount
  } = useJourneyIntelligenceStore();
  
  const [transitioning, setTransitioning] = useState(false);

  // Process nodes with visual hierarchy
  const processedNodes = useMemo(() => {
    // If no nodes, return empty
    if (!graphData.nodes || graphData.nodes.length === 0) {
      return [];
    }
    
    // Get connected entities if something is selected
    let connected = new Set();
    let secondaryConnected = new Set();
    
    if (selectedEntity && focusMode !== 'overview') {
      const characterConnections = graphData.edges?.filter(e => 
        e.data?.type === 'character-character'
      ) || [];
      
      const connections = getConnectedEntities(
        selectedEntity, 
        graphData.nodes, 
        characterConnections
      );
      connected = connections.connected;
      secondaryConnected = connections.secondaryConnected;
    }
    
    // Process all nodes with visual properties
    return graphData.nodes.map(node => {
      const visualProps = calculateVisualProperties(
        node,
        selectedEntity,
        connected,
        secondaryConnected
      );
      
      // Preserve the original node structure and type
      return {
        ...node,
        // Preserve the exact node type - no fallback
        type: node.type,
        // Apply visual state through data for custom nodes to use
        data: {
          ...node.data,
          visualState: visualProps
        },
        // Apply z-index through style for ReactFlow
        style: {
          ...node.style,
          zIndex: visualProps.zIndex
        }
      };
    });
  }, [graphData.nodes, graphData.edges, selectedEntity, focusMode]);

  // Process edges with visual hierarchy
  const processedEdges = useMemo(() => {
    if (!graphData.edges || graphData.edges.length === 0) {
      return [];
    }
    
    // In overview mode, all edges are visible
    if (!selectedEntity || focusMode === 'overview') {
      return graphData.edges.map(edge => ({
        ...edge,
        style: {
          ...edge.style,
          opacity: edge.style?.opacity || 0.6
        }
      }));
    }
    
    // In focus mode, highlight relevant edges
    const relevantNodes = new Set();
    processedNodes.forEach(node => {
      if (node.data.visualState.isSelected || 
          node.data.visualState.isConnected || 
          node.data.visualState.isSecondaryConnected) {
        relevantNodes.add(node.id);
      }
    });
    
    return graphData.edges.map(edge => {
      const isRelevant = relevantNodes.has(edge.source) && relevantNodes.has(edge.target);
      const isFocused = (edge.source === selectedEntity.id || edge.target === selectedEntity.id);
      
      return {
        ...edge,
        style: {
          ...edge.style,
          opacity: isFocused ? 1 : (isRelevant ? 0.6 : 0.1),
          strokeWidth: isFocused ? 3 : 2
        }
      };
    });
  }, [graphData.edges, processedNodes, selectedEntity, focusMode]);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState(processedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(processedEdges);
  const { getViewport, fitView } = useReactFlow();
  
  // Force simulation reference
  const simulationRef = useRef(null);
  const [layoutReady, setLayoutReady] = useState(false);
  const [initialFitDone, setInitialFitDone] = useState(false);

  // Update nodes and edges when they change
  useEffect(() => {
    setNodes(processedNodes);
    setEdges(processedEdges);
  }, [processedNodes, processedEdges, setNodes, setEdges]);
  
  // Update node count
  useEffect(() => {
    updateNodeCount(nodes.length);
  }, [nodes.length, updateNodeCount]);
  
  // Apply layout based on mode
  useEffect(() => {
    if (!nodes || nodes.length === 0) return;
    
    // Stop any existing simulation
    if (simulationRef.current) {
      simulationRef.current.stop();
      simulationRef.current = null;
    }
    
    if (selectedEntity && focusMode !== 'overview') {
      // RADIAL LAYOUT for focused view
      const centerNode = nodes.find(n => n.id === selectedEntity.id);
      
      if (centerNode) {
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
      }
    } else {
      // FORCE LAYOUT for overview mode
      const { simulation, simulationNodes } = createForceSimulation(
        nodes,
        edges,
        {
          width: window.innerWidth,
          height: window.innerHeight - 100,
          nodeRepulsion: -300, // Reduced repulsion to allow clustering
          linkDistance: 50, // Shorter links for tighter clusters
          centerForce: 0.02, // Gentler centering
          collisionRadius: 40,
          alphaDecay: 0.015, // Slower cooling for better convergence
          useOwnershipClustering: true
        }
      );
      
      simulationRef.current = simulation;
      
      let frameCount = 0;
      const maxFrames = 300;
      
      simulation.on('tick', () => {
        frameCount++;
        
        if (frameCount % 5 === 0 || simulation.alpha() < 0.01) {
          setNodes(currentNodes => {
            const updatedNodes = applySimulationPositions(currentNodes, simulationNodes);
            const hasChanges = updatedNodes.some((node, i) => 
              node.position.x !== currentNodes[i].position.x || 
              node.position.y !== currentNodes[i].position.y
            );
            return hasChanges ? updatedNodes : currentNodes;
          });
        }
        
        if (frameCount >= maxFrames || simulation.alpha() < 0.001) {
          simulation.stop();
          simulationRef.current = null;
        }
      });
    }
    
    return () => {
      if (simulationRef.current) {
        simulationRef.current.stop();
        simulationRef.current = null;
      }
    };
  }, [nodes.length, edges.length, selectedEntity?.id, focusMode]);
  
  // Initial fit view
  useEffect(() => {
    if (!initialFitDone && nodes.length > 0 && layoutReady) {
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 800 });
        setInitialFitDone(true);
      }, 100);
    }
  }, [nodes.length, layoutReady, initialFitDone, fitView]);

  // Fit view on focus mode change
  useEffect(() => {
    if (initialFitDone && nodes.length > 0 && focusMode === 'focused' && selectedEntity) {
      setTimeout(() => {
        fitView({ 
          padding: 0.3, 
          duration: 800,
          nodes: nodes.filter(n => 
            n.data.visualState.isSelected || 
            n.data.visualState.isConnected
          )
        });
      }, 300);
    }
  }, [focusMode, selectedEntity?.id, initialFitDone, nodes, fitView]);

  // Set layout ready
  useEffect(() => {
    setLayoutReady(true);
  }, []);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    logger.info('Node clicked:', { nodeId: node.id, nodeType: node.data.type });
    
    setTransitioning(true);
    setFocusMode('focused');
    
    // Create a clean entity object with all necessary data
    const entityData = {
      ...node.data,
      id: node.id,
      type: node.data.type || node.data.entityCategory || node.type,
      entityCategory: node.data.entityCategory || node.type
    };
    
    // Remove only visual state fields
    delete entityData.visualState;
    delete entityData.size;
    
    setSelectedEntity(entityData);
    
    setTimeout(() => setTransitioning(false), 500);
  }, [setSelectedEntity, setFocusMode]);

  // Handle background click
  const onPaneClick = useCallback(() => {
    logger.info('Background clicked, returning to overview');
    
    setTransitioning(true);
    setFocusMode('overview');
    setSelectedEntity(null);
    
    setTimeout(() => setTransitioning(false), 500);
  }, [setSelectedEntity, setFocusMode]);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        className={transitioning ? 'transitioning' : ''}
        fitView={false}
        preventScrolling={true}
        minZoom={0.1}
        maxZoom={2}
      >
        <Background variant="dots" gap={20} size={1} />
        <Controls position="bottom-right" />
        <MiniMap 
          position="bottom-left"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            border: '1px solid #e0e0e0'
          }}
          nodeColor={node => {
            if (node.data?.visualState?.isSelected) return '#1976d2';
            if (node.data?.visualState?.isConnected) return '#42a5f5';
            if (node.data?.visualState?.isSecondaryConnected) return '#90caf9';
            return '#e0e0e0';
          }}
        />
      </ReactFlow>
      
      {/* Visual hierarchy style overrides */}
      <style jsx global>{`
        .react-flow__node {
          transition: all 0.3s ease;
        }
        
        .react-flow__node.selected {
          filter: drop-shadow(0 0 10px rgba(25, 118, 210, 0.5));
        }
        
        .react-flow__edge {
          transition: all 0.3s ease;
        }
        
        .transitioning .react-flow__node,
        .transitioning .react-flow__edge {
          transition: all 0.5s ease;
        }
      `}</style>
    </Box>
  );
};

export default AdaptiveGraphCanvas;