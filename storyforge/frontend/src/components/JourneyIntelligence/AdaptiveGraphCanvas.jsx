/**
 * AdaptiveGraphCanvas - Intelligent graph that responds to entity selection
 * 
 * Features:
 * - Focus mode: Shows only connected entities when one is selected
 * - Visual hierarchy: Selected → Connected → Secondary → Background
 * - Smart clustering: Elements stay near their owners through forces
 * - Smooth transitions between states
 * - Performance optimizations for 400+ entities
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ReactFlow, Controls, Background, MiniMap, useNodesState, useEdgesState, useReactFlow, useViewport, useStore } from '@xyflow/react';
import { Box, Paper, Typography } from '@mui/material';
import throttle from 'lodash.throttle';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import logger from '../../utils/logger';
import { nodeTypes } from './nodes';
import { edgeTypes } from './edges';
import useGraphLayout from '../../hooks/useGraphLayout';
import { processNodes, processEdges, getNodeColor } from '../../utils/graphProcessingUtils';

// Performance constants
const VIEWPORT_PADDING = 100; // Extra padding for viewport culling
const THROTTLE_DELAY = 100; // Milliseconds
const MAX_VISIBLE_NODES = 100; // Maximum nodes to render in detail
const MIN_ZOOM_FOR_LABELS = 0.5; // Hide labels below this zoom level

// Viewport culling selector
const viewportSelector = (state) => state.viewport;

const AdaptiveGraphCanvas = React.memo(({ graphData, elements }) => {
  const { 
    selectedEntity, 
    selectEntity, 
    viewMode,
    activeIntelligence,
    updateNodeCount
  } = useJourneyIntelligenceStore();
  
  const focusMode = viewMode === 'entity-focus' ? 'focused' : 'overview';
  const viewport = useStore(viewportSelector);
  
  // Process nodes with viewport culling
  const processedNodes = useMemo(() => {
    const baseNodes = processNodes(graphData, selectedEntity, focusMode);
    
    // Debug: Log some node positions
    if (baseNodes.length > 0) {
      logger.debug('AdaptiveGraphCanvas: Sample node positions', {
        firstNode: baseNodes[0] ? { id: baseNodes[0].id, position: baseNodes[0].position } : null,
        nodeCount: baseNodes.length,
        samplePositions: baseNodes.slice(0, 3).map(n => ({ id: n.id, pos: n.position }))
      });
    }
    
    // If too many nodes, apply viewport culling
    if (baseNodes.length > MAX_VISIBLE_NODES && viewport) {
      const { x, y, zoom } = viewport;
      const viewportWidth = window.innerWidth / zoom;
      const viewportHeight = window.innerHeight / zoom;
      
      // Calculate viewport bounds with padding
      const bounds = {
        minX: -x - VIEWPORT_PADDING,
        maxX: -x + viewportWidth + VIEWPORT_PADDING,
        minY: -y - VIEWPORT_PADDING,
        maxY: -y + viewportHeight + VIEWPORT_PADDING
      };
      
      // Filter nodes in viewport
      const visibleNodes = baseNodes.filter(node => {
        const pos = node.position;
        return pos.x >= bounds.minX && pos.x <= bounds.maxX &&
               pos.y >= bounds.minY && pos.y <= bounds.maxY;
      });
      
      // Add level of detail based on zoom
      return visibleNodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          hideLabel: zoom < MIN_ZOOM_FOR_LABELS
        }
      }));
    }
    
    return baseNodes;
  }, [graphData, selectedEntity, focusMode, viewport]);

  const processedEdges = useMemo(() => {
    // Debug: Log graphData edges
    logger.debug('AdaptiveGraphCanvas: Processing edges', {
      graphDataEdges: graphData?.edges?.length || 0,
      graphDataNodes: graphData?.nodes?.length || 0,
      processedNodesCount: processedNodes.length
    });
    
    // Only process edges for visible nodes
    const visibleNodeIds = new Set(processedNodes.map(n => n.id));
    const edges = processEdges(graphData, processedNodes, selectedEntity, focusMode);
    
    logger.debug('AdaptiveGraphCanvas: Edges after processing', {
      totalEdges: edges.length,
      visibleNodeIds: visibleNodeIds.size
    });
    
    const filteredEdges = edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
    
    logger.debug('AdaptiveGraphCanvas: Final filtered edges', {
      filteredCount: filteredEdges.length
    });
    
    return filteredEdges;
  }, [graphData, processedNodes, selectedEntity, focusMode]);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState(processedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(processedEdges);
  const { fitView } = useReactFlow();
  
  const [initialFitDone, setInitialFitDone] = useState(false);

  // Throttled node/edge updates
  const throttledSetNodes = useMemo(
    () => throttle(setNodes, THROTTLE_DELAY, { leading: true, trailing: true }),
    [setNodes]
  );
  
  const throttledSetEdges = useMemo(
    () => throttle(setEdges, THROTTLE_DELAY, { leading: true, trailing: true }),
    [setEdges]
  );

  // Update nodes and edges when they change
  useEffect(() => {
    if (processedNodes.length > MAX_VISIBLE_NODES) {
      // Use throttled updates for large datasets
      throttledSetNodes(processedNodes);
      throttledSetEdges(processedEdges);
    } else {
      // Direct updates for small datasets
      setNodes(processedNodes);
      setEdges(processedEdges);
    }
  }, [processedNodes, processedEdges, setNodes, setEdges, throttledSetNodes, throttledSetEdges]);
  
  // Update node count
  useEffect(() => {
    updateNodeCount(nodes.length);
  }, [nodes.length, updateNodeCount]);
  
  // Use the graph layout hook with performance options
  const { layoutReady } = useGraphLayout({
    nodes,
    edges,
    selectedEntity,
    focusMode,
    setNodes,
    fitView,
    // Performance options
    skipAnimation: nodes.length > MAX_VISIBLE_NODES,
    useWebWorker: nodes.length > 200
  });
  
  // Initial fit when data loads
  useEffect(() => {
    if (nodes.length > 0 && !initialFitDone) {
      // If layout is not ready after a short delay, fit anyway
      const timeoutId = setTimeout(() => {
        logger.debug('AdaptiveGraphCanvas: Force fitting view after timeout');
        fitView({ 
          padding: 0.2, 
          duration: 500
        });
        setInitialFitDone(true);
      }, 1000);

      if (layoutReady) {
        clearTimeout(timeoutId);
        fitView({ 
          padding: 0.1, 
          duration: nodes.length > MAX_VISIBLE_NODES ? 0 : 800 
        });
        setInitialFitDone(true);
      }

      return () => clearTimeout(timeoutId);
    }
  }, [nodes.length, fitView, initialFitDone, layoutReady]);

  // Focus on selected entity with smooth animation
  useEffect(() => {
    if (!layoutReady || nodes.length === 0) return;
    
    if (selectedEntity && viewMode === 'entity-focus') {
      // Find the selected node
      const selectedNode = nodes.find(n => n.id === selectedEntity.id);
      if (selectedNode) {
        logger.debug('AdaptiveGraphCanvas: Focusing on selected entity', {
          entityId: selectedEntity.id,
          nodePosition: selectedNode.position
        });
        
        // Fit view to the selected node and its connected nodes
        const connectedNodeIds = new Set([selectedEntity.id]);
        
        // Find all connected nodes
        edges.forEach(edge => {
          if (edge.source === selectedEntity.id) {
            connectedNodeIds.add(edge.target);
          } else if (edge.target === selectedEntity.id) {
            connectedNodeIds.add(edge.source);
          }
        });
        
        // Get positions of all relevant nodes
        const relevantNodes = nodes.filter(n => connectedNodeIds.has(n.id));
        
        if (relevantNodes.length > 1) {
          // Fit to show all connected nodes
          fitView({
            padding: 0.2,
            duration: 800,
            nodes: relevantNodes
          });
        } else {
          // Center on single node with appropriate zoom
          fitView({
            padding: 0.4,
            duration: 800,
            nodes: [selectedNode],
            maxZoom: 1.5
          });
        }
      }
    } else if (!selectedEntity && viewMode === 'overview') {
      // Return to overview - show all nodes
      logger.debug('AdaptiveGraphCanvas: Returning to overview mode');
      fitView({
        padding: 0.1,
        duration: 800
      });
    }
  }, [selectedEntity, viewMode, nodes, edges, fitView, layoutReady]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    logger.debug('AdaptiveGraphCanvas: Node clicked', {
      nodeId: node.id,
      nodeType: node.type
    });
    
    // Extract only the actual entity data, excluding graph-specific fields
    if (node?.data?.entity) {
      // If entity is nested in data
      selectEntity(node.data.entity);
    } else if (node?.data) {
      // Create clean entity object without graph-specific fields
      const { 
        visualState, 
        size, 
        label, 
        relationshipCount,
        ...entityData 
      } = node.data;
      
      // Only pass entity data if it has required fields
      if (entityData.id && entityData.type && entityData.name) {
        selectEntity(entityData);
      } else {
        logger.warn('AdaptiveGraphCanvas: Invalid entity data in node', {
          nodeId: node.id,
          data: node.data
        });
      }
    }
  }, [selectEntity]);
  
  // Hover state for tooltip
  const [hoveredNode, setHoveredNode] = useState(null);
  
  // Handle node hover
  const onNodeMouseEnter = useCallback((event, node) => {
    if (node?.data) {
      setHoveredNode({
        id: node.id,
        name: node.data.name || node.data.label || 'Unknown',
        type: node.data.type || node.data.entityType || 'Unknown',
        x: event.clientX,
        y: event.clientY
      });
    }
  }, []);
  
  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  // Handle click on empty space to deselect
  const onPaneClick = useCallback((event) => {
    logger.debug('AdaptiveGraphCanvas: Pane clicked - deselecting entity');
    selectEntity(null);
  }, [selectEntity]);

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && selectedEntity) {
        logger.debug('AdaptiveGraphCanvas: Escape pressed - deselecting entity');
        selectEntity(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntity, selectEntity]);
  
  // Throttled change handlers for performance
  const throttledOnNodesChange = useMemo(
    () => nodes.length > MAX_VISIBLE_NODES 
      ? throttle(onNodesChange, 50, { leading: true, trailing: true })
      : onNodesChange,
    [onNodesChange, nodes.length]
  );
  
  const throttledOnEdgesChange = useMemo(
    () => edges.length > MAX_VISIBLE_NODES * 2
      ? throttle(onEdgesChange, 50, { leading: true, trailing: true })
      : onEdgesChange,
    [onEdgesChange, edges.length]
  );
  
  // Memoize ReactFlow props
  const reactFlowProps = useMemo(() => ({
    nodes,
    edges,
    onNodesChange: throttledOnNodesChange,
    onEdgesChange: throttledOnEdgesChange,
    onNodeClick,
    onNodeMouseEnter,
    onNodeMouseLeave,
    onPaneClick,
    nodeTypes,
    edgeTypes,
    minZoom: 0.1,
    maxZoom: 2,
    defaultViewport: { x: 0, y: 0, zoom: 0.5 }, // Start more zoomed out
    fitView: true,
    attributionPosition: 'top-right',
    fitViewOptions: { 
      padding: 0.2, // More padding
      duration: 500
    },
    // Performance options
    deleteKeyCode: null, // Disable delete key
    selectionKeyCode: null, // Disable selection key
    multiSelectionKeyCode: null, // Disable multi-selection
    connectionLineType: 'straight', // Simpler connection lines
    snapToGrid: false, // Disable grid snapping
    snapGrid: [1, 1],
    // Optimize rendering
    onlyRenderVisibleElements: true,
    defaultEdgeOptions: {
      type: 'straight' // Default to straight edges for performance
    }
  }), [nodes, edges, throttledOnNodesChange, throttledOnEdgesChange, onNodeClick, onNodeMouseEnter, onNodeMouseLeave, onPaneClick]);

  logger.debug('AdaptiveGraphCanvas: Rendering', {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    selectedEntityId: selectedEntity?.id,
    viewMode,
    focusMode,
    viewportCulling: nodes.length > MAX_VISIBLE_NODES,
    nodeTypes: Object.keys(nodeTypes),
    sampleNode: nodes[0] ? { 
      id: nodes[0].id, 
      type: nodes[0].type, 
      position: nodes[0].position,
      data: { ...nodes[0].data, entity: undefined } // Don't log full entity
    } : null
  });

  return (
    <Box sx={{ 
      width: '100%', 
      height: '100%', 
      position: 'relative',
      backgroundColor: '#0a0a0a', // Ensure container has a background
      '& .react-flow__renderer': {
        backgroundColor: '#0a0a0a' // Ensure ReactFlow renderer has background
      }
    }}>
      <ReactFlow {...reactFlowProps}>
        <Background 
          variant="dots" 
          gap={12} 
          size={1} 
          color="#333" // Make dots visible on dark background
          style={{ opacity: nodes.length > 200 ? 0.3 : 0.5 }} 
        />
        <Controls position="top-left" />
        {nodes.length <= 200 && (
          <MiniMap 
            nodeColor={getNodeColor}
            position="bottom-right"
            pannable
            zoomable
            style={{ opacity: 0.8 }}
          />
        )}
      </ReactFlow>
      
      {/* Debug: Show node count if no nodes visible */}
      {nodes.length > 0 && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 10,
            right: 10,
            background: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 1000
          }}
        >
          {nodes.length} nodes, {edges.length} edges
        </Box>
      )}
      
      {/* Focus Mode Indicator */}
      {selectedEntity && viewMode === 'entity-focus' && (
        <Paper
          elevation={2}
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            padding: '8px 16px',
            backgroundColor: 'rgba(33, 150, 243, 0.9)',
            color: 'white',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Typography variant="body2">
            Focused on: <strong>{selectedEntity.name}</strong>
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            (ESC to exit)
          </Typography>
        </Paper>
      )}
      
      {/* Hover Tooltip */}
      {hoveredNode && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            left: hoveredNode.x + 10,
            top: hoveredNode.y - 40,
            padding: '8px 12px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: 'white',
            pointerEvents: 'none',
            zIndex: 1000,
            maxWidth: 300,
            borderRadius: 1
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {hoveredNode.name}
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.9, textTransform: 'capitalize' }}>
            {hoveredNode.type}
          </Typography>
        </Paper>
      )}
    </Box>
  );
});

AdaptiveGraphCanvas.displayName = 'AdaptiveGraphCanvas';

export default AdaptiveGraphCanvas;