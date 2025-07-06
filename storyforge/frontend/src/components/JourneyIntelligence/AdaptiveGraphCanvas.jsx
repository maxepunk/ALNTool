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
import { Box } from '@mui/material';
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
  
  const focusMode = viewMode;
  const viewport = useStore(viewportSelector);
  
  // Process nodes with viewport culling
  const processedNodes = useMemo(() => {
    const baseNodes = processNodes(graphData, selectedEntity, focusMode);
    
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
    // Only process edges for visible nodes
    const visibleNodeIds = new Set(processedNodes.map(n => n.id));
    const edges = processEdges(graphData, processedNodes, selectedEntity, focusMode);
    
    return edges.filter(edge => 
      visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
    );
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
    if (nodes.length > 0 && !initialFitDone && layoutReady) {
      fitView({ 
        padding: 0.1, 
        duration: nodes.length > MAX_VISIBLE_NODES ? 0 : 800 
      });
      setInitialFitDone(true);
    }
  }, [nodes.length, fitView, initialFitDone, layoutReady]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    logger.debug('AdaptiveGraphCanvas: Node clicked', {
      nodeId: node.id,
      nodeType: node.type
    });
    selectEntity(node.data);
  }, [selectEntity]);
  
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
    nodeTypes,
    edgeTypes,
    minZoom: 0.1,
    maxZoom: 2,
    defaultViewport: { x: 0, y: 0, zoom: 0.8 },
    fitView: true,
    attributionPosition: 'top-right',
    fitViewOptions: { padding: 0.1 },
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
  }), [nodes, edges, throttledOnNodesChange, throttledOnEdgesChange, onNodeClick]);

  logger.debug('AdaptiveGraphCanvas: Rendering', {
    totalNodes: nodes.length,
    totalEdges: edges.length,
    selectedEntityId: selectedEntity?.id,
    focusMode,
    viewportCulling: nodes.length > MAX_VISIBLE_NODES
  });

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <ReactFlow {...reactFlowProps}>
        <Background 
          variant="dots" 
          gap={12} 
          size={1} 
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
    </Box>
  );
});

AdaptiveGraphCanvas.displayName = 'AdaptiveGraphCanvas';

export default AdaptiveGraphCanvas;