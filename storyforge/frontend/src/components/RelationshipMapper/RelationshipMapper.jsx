import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import ErrorBoundary from '../ErrorBoundary';
import logger from '../../utils/logger';
import {
  ReactFlow,
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  // Panel, // Panel is no longer used directly, custom panel is implemented
} from '@xyflow/react';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  useTheme,
  Chip,
  Snackbar,
  Switch,
  FormControlLabel,
} from '@mui/material';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';

// Node types
import EntityNode from './EntityNode';
import FallbackGraph from './FallbackGraph';
import SecondaryEntityNode from './SecondaryEntityNode';
// import { ClusterHull } from './ClusterHull'; // Removed ClusterHull
// Edge types
import CustomEdge from './CustomEdge';

// Layout algorithm related hooks
import useGraphTransform from './useGraphTransform';
import useLayoutManager from './useLayoutManager'; // Now simplified
import useRelationshipMapperUIState from './useRelationshipMapperUIState';

// Extracted components
import { analyzeDependencies } from './DependencyAnalyzer';
import DependencyAnalysisPanel from './DependencyAnalysisPanel';
import ControlsPanel from './ControlsPanel';
import InfoModal from './InfoModal';


const RelationshipMapperContent = ({ 
  title,
  entityType, 
  entityId, 
  entityName,
  // relationshipData, // This prop is part of graphData now or unused
  graphData,
  isLoading,
  error
}) => {
  const ui = useRelationshipMapperUIState({ entityId });
  const layoutManager = useLayoutManager(); // Simplified call, no initialLayout needed
  
  // Dependency Choreographer state
  const [dependencyAnalysisMode, setDependencyAnalysisMode] = useState(false);
  const [highlightCriticalPaths, setHighlightCriticalPaths] = useState(true);
  const [showBottlenecks, setShowBottlenecks] = useState(true);
  const [showCollaborationOpps, setShowCollaborationOpps] = useState(true);
  
  // Analyze dependencies for orchestration insights
  const dependencyAnalysis = useMemo(() => 
    analyzeDependencies(graphData, entityType, entityId), [graphData, entityType, entityId]);

  const { nodes: transformedNodes, edges: transformedEdges, error: graphError } = useGraphTransform({
    entityType,
    entityId,
    entityName,
    graphData,
    viewMode: ui.viewMode,
    depth: ui.depth,
    nodeFilters: ui.nodeFilters,
    edgeFilters: ui.edgeFilters,
    // Pass new filters to useGraphTransform - will be used in next subtask
    actFocusFilter: ui.actFocusFilter,
    themeFilters: ui.themeFilters,
    memorySetFilter: ui.memorySetFilter,
    suppressLowSignal: !ui.showLowSignal,
    layoutType: layoutManager.layoutType,
    layoutOptions: layoutManager.options,
    isFullScreenForLogging: ui.isFullScreen,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();
  const navigate = useNavigate();
  const theme = useTheme();

  // Effect to extract available themes and memory sets from graphData.nodes
  useEffect(() => {
    if (graphData?.nodes) {
      const themes = new Set();
      const memorySets = new Set();
      graphData.nodes.forEach(node => {
        if (node.properties?.themes) {
          node.properties.themes.forEach(theme => themes.add(theme));
        }
        if (node.properties?.memorySets) {
          node.properties.memorySets.forEach(set => memorySets.add(set));
        }
      });

      const sortedThemes = Array.from(themes).sort();
      ui.setAvailableThemes(sortedThemes);

      // Initialize themeFilters: set all available themes to true by default
      // This should only run once when themes are first populated, or if sortedThemes array identity changes.
      if (sortedThemes.length > 0 && Object.keys(ui.themeFilters).length === 0) { // Check if not already initialized
        const initialThemeFilters = {};
        sortedThemes.forEach(theme => {
          initialThemeFilters[theme] = true; // Default to all selected
        });
        ui.setThemeFilters(initialThemeFilters);
      } else if (sortedThemes.length === 0 && Object.keys(ui.themeFilters).length > 0) {
        // Clear filters if no themes are available (e.g. graphData cleared)
        ui.setThemeFilters({});
      }


      ui.setAvailableMemorySets(Array.from(memorySets).sort());
    }
  // ui.setThemeFilters is a dependency for initialization logic, ensure it's stable or handle carefully.
  // Adding ui.themeFilters to dependency array to correctly re-evaluate initialization if it changes externally.
  }, [graphData?.nodes, ui.setAvailableThemes, ui.setAvailableMemorySets, ui.setThemeFilters, ui.themeFilters]);


  useEffect(() => {
    if (transformedNodes) {
      setNodes(transformedNodes);
    }
  }, [transformedNodes, setNodes]);

  useEffect(() => {
    if (transformedEdges) {
      setEdges(transformedEdges);
    }
  }, [transformedEdges, setEdges]);
  
  const nodeTypes = useMemo(() => ({ 
    entityNode: (props) => <EntityNode {...props} centralEntityType={entityType} isFullScreen={ui.isFullScreen} />,
    secondaryNode: SecondaryEntityNode 
  }), [entityType, ui.isFullScreen]);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  useEffect(() => {
    if (nodes && nodes.length > 0 && reactFlowInstance) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.25, duration: 300 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, layoutManager.layoutType, reactFlowInstance, ui.isFullScreen]);

  const onNodeClick = useCallback((event, node) => {
    if (node.data?.route && node.id !== entityId) {
      navigate(node.data.route);
    }
    if (ui.handleNodeInteraction) ui.handleNodeInteraction(node);
  }, [navigate, entityId, ui]);

  const onEdgeClick = useCallback((event, edge) => {
    if (ui.handleEdgeInteraction) ui.handleEdgeInteraction(edge);
  }, [ui]);
  
  const onPaneClick = useCallback(() => {
    if (ui.handlePaneClick) ui.handlePaneClick();
  }, [ui]);

  const onFitView = useCallback(() => reactFlowInstance.fitView({ padding: 0.2, duration: 300 }), [reactFlowInstance]);
  const onZoomIn = useCallback(() => reactFlowInstance.zoomIn({ duration: 300 }), [reactFlowInstance]);
  const onZoomOut = useCallback(() => reactFlowInstance.zoomOut({ duration: 300 }), [reactFlowInstance]);

  if (isLoading) {
    return (
      <Paper sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: ui.isFullScreen ? '100vh' :'400px', ...ui.containerStyles }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Relationship Map...</Typography>
      </Paper>
    );
  }

  if (error || !graphData) { // Also check for graphData presence
    return (
      <Paper sx={{ p: 2, minHeight: ui.isFullScreen ? '100vh' :'300px', ...ui.containerStyles }}>
        <Alert severity="error">Error loading relationship data: {error?.message || 'No data received'}</Alert>
      </Paper>
    );
  }

  if (graphError) {
    return (
      <Paper sx={{ p: 2, minHeight: ui.isFullScreen ? '100vh' :'300px', ...ui.containerStyles }}>
        <Alert severity="warning" sx={{mb: 2}}>Error processing graph data: {graphError.message || 'Could not render graph.'}</Alert>
        <Typography variant="body2" sx={{mb: 1}}>Displaying fallback data if available:</Typography>
        <FallbackGraph entityType={entityType} entityName={entityName} relationshipData={graphData} />
      </Paper>
    );
  }
  
  if (!transformedNodes || transformedNodes.length === 0) {
     return (
      <Paper sx={{ p: 2, minHeight: ui.isFullScreen ? '100vh' :'300px', ...ui.containerStyles }}>
        <Alert severity="info" sx={{mb: 2}}>No direct relationships found or data available to visualize for this entity.</Alert>
        {graphData && <FallbackGraph entityType={entityType} entityName={entityName} relationshipData={graphData} />}
      </Paper>
    );
  }

  return (
    <Paper sx={{
      width: '100%', 
      position: 'relative', 
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      height: '600px', 
      ...(ui.isFullScreen && {
        position: 'fixed', 
        top: 0,
        left: 0,
        height: '100vh',
        width: '100vw', 
        zIndex: theme.zIndex.modal + 1, 
        m: 0, 
        borderRadius: 0, 
      }),
      ...ui.containerStyles 
    }}>
      <Box sx={{
        p: 1.5, 
        pb: 0, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        ...(ui.isFullScreen && { bgcolor: 'background.paper' })
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{fontSize: '1.1rem'}}>
            {dependencyAnalysisMode ? 'Dependency Choreographer' : (title || `${entityName}\'s Map`)}
          </Typography>
          {dependencyAnalysisMode && (
            <Chip 
              icon={<LinkIcon />} 
              label="Production Mode" 
              color="primary" 
              size="small"
            />
          )}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FormControlLabel
            control={
              <Switch 
                checked={dependencyAnalysisMode} 
                onChange={(e) => setDependencyAnalysisMode(e.target.checked)}
                size="small"
              />
            }
            label="Orchestration Mode"
            sx={{ mr: 1 }}
          />
          <Tooltip title={ui.isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}>
            <IconButton onClick={ui.toggleFullScreen} size="small">
              {ui.isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}> 
        <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}> {/* This is the ReactFlow container */}
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            onEdgeClick={onEdgeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            fitView={false}
            fitViewOptions={{ padding: 0.25, duration: 300 }}
            minZoom={0.05}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
            elevateEdgesOnSelect
            panOnScroll
            selectionOnDrag
          >
            <Background color={theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300]} gap={24} size={1.2} variant="dots" />
            <Controls showInteractive={false} position="bottom-left" />
            <MiniMap nodeColor={(n) => n.data?.isCenter ? theme.palette.primary.main : (theme.palette.text.secondary)} style={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: theme.shape.borderRadius }} maskColor={theme.palette.mode === 'dark' ? 'rgba(40,40,40,0.7)' : 'rgba(245,245,245,0.7)'}/>
            <InfoModal open={ui.infoOpen} onClose={ui.closeInfoModal} />
            <Snackbar open={ui.snackbar.open} autoHideDuration={ui.snackbar.duration || 6000} onClose={ui.closeSnackbar} message={ui.snackbar.message} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} action={<IconButton size="small" aria-label="close" color="inherit" onClick={ui.closeSnackbar}><CloseIcon fontSize="small" /></IconButton>} sx={{ '.MuiSnackbarContent-root': { backgroundColor: ui.snackbar.severity ? `${ui.snackbar.severity}.main` : undefined } }}/>
          </ReactFlow>
          {/* ClusterHull rendering removed */}
        </Box>

        {/* Controls Panel - Now always rendered, styling changes based on ui.isFullScreen */}
        <Box 
          sx={{
            // Common styles for the panel
            width: dependencyAnalysisMode ? '320px' : '280px', // Wider for dependency analysis
            flexShrink: 0,
            height: ui.isFullScreen ? 'auto' : '100%', // Full height in normal, auto in fullscreen
            maxHeight: ui.isFullScreen ? `calc(100vh - ${theme.spacing(10)})` : 'none', // Max height in fullscreen
            overflowY: 'auto',
            p: 1.5,
            boxSizing: 'border-box',

            // Conditional styling
            ...(ui.isFullScreen ? {
              position: 'absolute',
              top: theme.spacing(8), 
              right: theme.spacing(2),
              backgroundColor: theme.palette.background.paper, 
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: theme.shape.borderRadius,
              boxShadow: theme.shadows[5], 
              zIndex: theme.zIndex.modal + 2, 
            } : {
              borderLeft: `1px solid ${theme.palette.divider}`,
              backgroundColor: theme.palette.background.default, 
            })
          }}
        >
          {dependencyAnalysisMode && (
            <DependencyAnalysisPanel
              dependencyAnalysis={dependencyAnalysis}
              highlightCriticalPaths={highlightCriticalPaths}
              setHighlightCriticalPaths={setHighlightCriticalPaths}
              showBottlenecks={showBottlenecks}
              setShowBottlenecks={setShowBottlenecks}
              showCollaborationOpps={showCollaborationOpps}
              setShowCollaborationOpps={setShowCollaborationOpps}
            />
          )}
          <ControlsPanel
            ui={ui}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onFitView={onFitView}
            dependencyAnalysisMode={dependencyAnalysisMode}
          />
        </Box>
      </Box>
    </Paper>
  );
};

RelationshipMapperContent.propTypes = {
  title: PropTypes.string,
  entityType: PropTypes.oneOf(['Character', 'Element', 'Puzzle', 'Timeline']).isRequired,
  entityId: PropTypes.string.isRequired,
  entityName: PropTypes.string,
  // relationshipData: PropTypes.object, // deprecated or part of graphData
  graphData: PropTypes.object, // Now the primary data source
  isLoading: PropTypes.bool,
  error: PropTypes.object,
};

const RelationshipMapper = (props) => (
  <ErrorBoundary level="component">
    <ReactFlowProvider>
      <RelationshipMapperContent {...props} />
    </ReactFlowProvider>
  </ErrorBoundary>
);

RelationshipMapper.propTypes = RelationshipMapperContent.propTypes; // Inherit propTypes

export default RelationshipMapper;
