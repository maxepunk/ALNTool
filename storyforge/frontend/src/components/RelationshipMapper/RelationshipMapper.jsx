import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  ReactFlow,
  Background, 
  Controls, 
  MiniMap,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react';
// Do not import style here as we're importing it globally in main.jsx
// import '@xyflow/react/dist/style.css';
import { 
  Box, 
  Typography, 
  Paper, 
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Tooltip,
  Modal,
  useTheme,
  Chip,
  Fade,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Slider,
  ToggleButtonGroup,
  ToggleButton,
  Snackbar,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import InfoIcon from '@mui/icons-material/Info';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';
import SchemaIcon from '@mui/icons-material/Schema';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import HubIcon from '@mui/icons-material/Hub';
import WaterfallChartIcon from '@mui/icons-material/WaterfallChart';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';

// Node types
import EntityNode from './EntityNode';
import FallbackGraph from './FallbackGraph';
import SecondaryEntityNode from './SecondaryEntityNode';
import { ClusterHull } from './ClusterHull';
// Edge types
import CustomEdge from './CustomEdge';

// Layout algorithm
import useGraphTransform from './useGraphTransform';
import useLayoutManager from './useLayoutManager';
import useRelationshipMapperUIState from './useRelationshipMapperUIState';

// Create an inner component that uses the ReactFlow hooks
const RelationshipMapperContent = ({ 
  title,
  entityType, 
  entityId, 
  entityName,
  relationshipData,
  graphData,
  isLoading,
  error
}) => {
  const ui = useRelationshipMapperUIState({ entityId });

  // Determine the default layout based on entity type
  let initialLayoutType;
  switch (entityType) {
    case 'Puzzle':
      initialLayoutType = 'dagre'; // Hierarchical for flow
      break;
    case 'Element':
      initialLayoutType = 'radial'; // Changed default to Radial for Elements
      break;
    case 'Character':
      initialLayoutType = 'dagre'; // USE DAGRE FOR CHARACTERS (was radial)
      break;
    case 'Timeline':
      initialLayoutType = 'radial'; // Overview of direct links
      break;
    default:
      initialLayoutType = 'radial'; // Fallback default
  }
  
  // Pass the determined initial layout and isFullScreen state to the manager
  const layoutManager = useLayoutManager({ 
    initialLayout: initialLayoutType, 
    isFullScreen: ui.isFullScreen // Pass isFullScreen state here
  });

  // *** Add this log ***
  console.log('RelationshipMapper RawData:', relationshipData);
  console.log('RelationshipMapper GraphData:', graphData);
  console.log('EntityType:', entityType);
  // ********************

  // Log edges from BFF graphData
  if (graphData && graphData.edges) {
    console.log('RelationshipMapper: Edges from BFF (graphData.edges):', JSON.stringify(graphData.edges.slice(0, 5), null, 2)); // Log first 5
  }

  const { nodes: transformedNodes, edges: transformedEdges, error: graphError } = useGraphTransform({
    entityType,
    entityId,
    entityName,
    rawData: relationshipData,
    graphData,
    viewMode: ui.viewMode,
    depth: ui.depth,
    nodeFilters: ui.nodeFilters,
    edgeFilters: ui.edgeFilters,
    suppressLowSignal: !ui.showLowSignal,
    layoutType: layoutManager.layoutType,
    layoutOptions: layoutManager.options,
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();
  const navigate = useNavigate();
  const theme = useTheme();

  // Log transformedEdges
  useEffect(() => {
    if (transformedEdges) {
      console.log('RelationshipMapper: Transformed Edges (from useGraphTransform):', JSON.stringify(transformedEdges.slice(0, 5), null, 2)); // Log first 5
    }
  }, [transformedEdges]);

  const nodeTypes = useMemo(() => ({ 
    entityNode: EntityNode,
    secondaryNode: SecondaryEntityNode 
  }), []);
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

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
  
  // Auto-fit view when nodes/layout change, after a brief delay for rendering
  useEffect(() => {
    if (nodes && nodes.length > 0 && reactFlowInstance) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.25, duration: 300 });
      }, 100); // Adjust delay as needed
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

  if (error) {
    return (
      <Paper sx={{ p: 2, minHeight: ui.isFullScreen ? '100vh' :'300px', ...ui.containerStyles }}>
        <Alert severity="error">Error loading relationship data: {error.message || 'Unknown error'}</Alert>
      </Paper>
    );
  }

  if (graphError) {
    return (
      <Paper sx={{ p: 2, minHeight: ui.isFullScreen ? '100vh' :'300px', ...ui.containerStyles }}>
        <Alert severity="warning" sx={{mb: 2}}>
           Error processing graph data: {graphError.message || 'Could not render graph.'}
        </Alert>
        <Typography variant="body2" sx={{mb: 1}}>Displaying fallback data if available:</Typography>
        <FallbackGraph 
          entityType={entityType} 
          entityName={entityName} 
          relationshipData={graphData || relationshipData} // Prefer graphData if it exists, else raw
        />
      </Paper>
    );
  }
  
  // If no nodes after attempting to load and process, show a message or fallback.
  // Check specifically if transformedNodes is null (initial state) or empty after processing.
  if (!transformedNodes || transformedNodes.length === 0) {
     return (
      <Paper sx={{ p: 2, minHeight: ui.isFullScreen ? '100vh' :'300px', ...ui.containerStyles }}>
        <Alert severity="info" sx={{mb: 2}}>No direct relationships found or data available to visualize for this entity.</Alert>
        {(graphData || relationshipData) && 
          <FallbackGraph 
            entityType={entityType} 
            entityName={entityName} 
            relationshipData={graphData || relationshipData} 
          />}
      </Paper>
    );
  }

  return (
    <Paper sx={{
      // Base styles
      width: '100%', 
      position: 'relative', // Default position
      overflow: 'hidden', 
      display: 'flex', 
      flexDirection: 'column',
      height: '600px', // Default height
      
      // Apply fullscreen styles conditionally
      ...(ui.isFullScreen && {
        position: 'fixed', // Take out of flow
        top: 0,
        left: 0,
        height: '100vh', // Full viewport height
        width: '100vw',  // Full viewport width
        zIndex: theme.zIndex.modal + 1, // Ensure it's above most other elements
        m: 0, // Remove margin in fullscreen
        borderRadius: 0, // Remove border radius in fullscreen
      }),
      
      // Merge with any styles from the hook (e.g., transitions)
      ...ui.containerStyles 
    }}>
      <Box sx={{
        p: 2, 
        pb: 0, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        // Add a background in fullscreen for better visibility if theme is light
        ...(ui.isFullScreen && { bgcolor: 'background.paper' })
      }}>
        <Typography variant="h6">{title || `${entityName}'s Relationship Map`}</Typography>
        <Tooltip title={ui.isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}>
          <IconButton onClick={ui.toggleFullScreen} size="small">
            {ui.isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </Tooltip>
      </Box>
      <Box sx={{ flexGrow: 1, display: 'flex', overflow: 'hidden' }}> 
        <Box sx={{ flexGrow: 1, height: '100%', position: 'relative' }}> 
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
            fitView={false} // Manual fitView via useEffect or button
            fitViewOptions={{ padding: 0.25, duration: 300 }}
            minZoom={0.05}
            maxZoom={4}
            proOptions={{ hideAttribution: true }}
            elevateEdgesOnSelect
            panOnScroll
            selectionOnDrag
          >
            <Background 
              color={theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300]} 
              gap={24} 
              size={1.2} 
              variant="dots" 
            />
            <Controls showInteractive={false} position="bottom-left" />
            <MiniMap 
              nodeColor={(n) => n.data?.isCenter ? theme.palette.primary.main : (EntityNode.nodeStyles?.[n.data?.type]?.color || theme.palette.text.secondary)}
              nodeStrokeWidth={2}
              pannable
              zoomable
              style={{ 
                backgroundColor: theme.palette.background.paper, 
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: theme.shape.borderRadius,
              }}
              maskColor={theme.palette.mode === 'dark' ? 'rgba(40,40,40,0.7)' : 'rgba(245,245,245,0.7)'}
            />

            <Modal 
              open={ui.infoOpen} 
              onClose={ui.closeInfoModal} 
              aria-labelledby="info-modal-title" 
              aria-describedby="info-modal-description"
              disableEnforceFocus // Added to potentially resolve aria-hidden conflict
            >
              <Paper sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: {xs: '90%', sm: 450, md: 500}, bgcolor: 'background.paper', boxShadow: 24, p: {xs: 2, sm: 3, md: 4}, borderRadius: 2 }}>
                <Typography id="info-modal-title" variant="h6" component="h2">Relationship Mapper Guide</Typography>
                <Typography id="info-modal-description" sx={{ mt: 2 }} component="div">
                  <p>This map visualizes connections between your story entities.</p>
                  <strong>Navigation:</strong>
                  <ul>
                    <li>Click on a node (entity) to navigate to its detail page.</li>
                    <li>Drag the background to pan the view.</li>
                    <li>Use mouse wheel or pinch to zoom.</li>
                  </ul>
                  <strong>Controls (Panel):</strong>
                  <ul>
                    <li><strong>View:</strong> Zoom in/out, or fit all items to the screen.</li>
                    <li><strong>Layout:</strong> Switch between Radial, Force-Directed, and Hierarchical (Dagre) layouts. Dagre layout offers different orientations (Top-to-Bottom, Left-to-Right etc.).</li>
                    <li><strong>Exploration Depth:</strong> Control how many levels of connections are shown from the central entity.</li>
                    <li><strong>Filter Nodes/Edges:</strong> Toggle visibility of specific entity types or relationship types.</li>
                    <li><strong>Signal Strength:</strong> Show or hide items deemed 'low signal' (less critical connections).</li>
                  </ul>
                </Typography>
                <Button onClick={ui.closeInfoModal} sx={{mt:3}} variant="contained">Got it!</Button>
              </Paper>
            </Modal>
  
            <Snackbar
              open={ui.snackbar.open}
              autoHideDuration={ui.snackbar.duration || 6000}
              onClose={ui.closeSnackbar}
              message={ui.snackbar.message}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              action={
                <IconButton size="small" aria-label="close" color="inherit" onClick={ui.closeSnackbar}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              }
              sx={{ '.MuiSnackbarContent-root': { backgroundColor: ui.snackbar.severity ? `${ui.snackbar.severity}.main` : undefined } }}
            />
          </ReactFlow>

          {/* Cluster hull overlay */}
          {nodes && nodes.length > 0 && (
            <Box sx={{position:'absolute',left:0,top:0,width:'100%',height:'100%',pointerEvents:'none'}}>
              {nodes.filter(n=>n.data && (n.data.type==='Puzzle' || n.data.type==='Element') && nodes.some(c=>c.data?.parentId===n.id)).map(hubNode=>{
                const children = nodes.filter(c=>c.data?.parentId===hubNode.id);
                return <ClusterHull key={`hull-${hubNode.id}`} hub={hubNode} childrenNodes={children} color={hubNode.style?.borderColor||'orange'} />;
              })}
            </Box>
          )}
        </Box>

        {!ui.isFullScreen && (
          <Box 
            sx={{ 
              width: '280px', // Fixed width for the panel
              flexShrink: 0, // Prevent shrinking
              borderLeft: `1px solid ${theme.palette.divider}`, // Separator line
              height: '100%', // Match parent height
              overflowY: 'auto', // Allow panel content to scroll
              p: 1.5, // Padding equivalent to old Panel padding
              backgroundColor: 'background.paper' // Match old Panel background
            }}
          >
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
              <Typography variant="subtitle1">Controls</Typography>
              <Tooltip title="Map Information & Help">
                <IconButton onClick={ui.openInfoModal} size="small"> <InfoIcon /> </IconButton>
              </Tooltip>
            </Box>
            <Divider sx={{my:1}}/>
            
            <Typography variant="caption" display="block" gutterBottom>View</Typography>
            <Box sx={{ display: 'flex', gap: 0.5, mb: 1.5, justifyContent: 'center' }}>
              <Tooltip title="Zoom In"><IconButton onClick={onZoomIn} size="small"><ZoomInIcon /></IconButton></Tooltip>
              <Tooltip title="Zoom Out"><IconButton onClick={onZoomOut} size="small"><ZoomOutIcon /></IconButton></Tooltip>
              <Tooltip title="Fit View"><IconButton onClick={onFitView} size="small"><FitScreenIcon /></IconButton></Tooltip>
            </Box>

            <Typography variant="caption" display="block" gutterBottom>Layout</Typography>
            <ToggleButtonGroup
              value={layoutManager.layoutType}
              exclusive
              onChange={(e, newLayout) => { if (newLayout) layoutManager.changeLayout(newLayout); }}
              aria-label="layout selector"
              size="small"
              fullWidth
              sx={{mb:1.5}}
            >
              <ToggleButton value="radial" aria-label="radial layout"><Tooltip title="Radial"><HubIcon fontSize="small"/></Tooltip></ToggleButton>
              <ToggleButton value="force-directed" aria-label="force-directed layout"><Tooltip title="Force-Directed"><SchemaIcon fontSize="small"/></Tooltip></ToggleButton>
              <ToggleButton value="dagre" aria-label="hierarchical layout"><Tooltip title="Hierarchical"><AccountTreeIcon fontSize="small"/></Tooltip></ToggleButton>
            </ToggleButtonGroup>
            
            {layoutManager.layoutType === 'dagre' && layoutManager.options?.orientation && (
              <Box sx={{mb: 1.5}}>
                <Typography variant="caption" display="block" gutterBottom>Hierarchy Orientation</Typography>
                <ToggleButtonGroup
                  value={layoutManager.options.orientation}
                  exclusive
                  onChange={(e, newOrientation) => {
                    if (newOrientation) layoutManager.updateOptions({ orientation: newOrientation });
                  }}
                  aria-label="dagre orientation selector"
                  size="small"
                  fullWidth
                >
                  {['TB', 'LR', 'BT', 'RL'].map(dir => (
                    <ToggleButton key={dir} value={dir} aria-label={`${dir} orientation`}>{dir}</ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>
            )}

            <Typography variant="caption" display="block" id="depth-slider-label" gutterBottom>Exploration Depth: {ui.depth}</Typography>
            <Slider
              size="small"
              value={ui.depth}
              onChange={(e, newValue) => ui.setDepth(newValue)}
              aria-labelledby="depth-slider-label"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={1}
              max={ui.maxDepth || 3}
              sx={{mb:1.5, mx: 0.5}}
            />

            <Typography variant="caption" display="block" gutterBottom>Filter Nodes by Type</Typography>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5}}>
              {Object.entries(ui.nodeFilters || {}).map(([type, checked]) => (
                <Chip
                  key={type}
                  icon={checked ? <CheckBoxIcon fontSize="small"/> : <CheckBoxOutlineBlankIcon fontSize="small"/>}
                  label={type}
                  onClick={() => ui.toggleNodeFilter(type)}
                  size="small"
                  color={checked ? "primary" : "default"}
                  variant={checked ? "filled" : "outlined"}
                />
              ))}
            </Box>
            
            <Typography variant="caption" display="block" gutterBottom>Filter Edges by Type</Typography>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5}}>
              {Object.entries(ui.edgeFilters || {}).map(([type, checked]) => (
                <Chip
                  key={type}
                  label={type.charAt(0).toUpperCase() + type.slice(1)} // Capitalize
                  onClick={() => ui.toggleEdgeFilter(type)}
                  size="small"
                  color={checked ? "secondary" : "default"}
                  variant={checked ? "filled" : "outlined"}
                  icon={checked ? <CheckBoxIcon fontSize="small"/> : <CheckBoxOutlineBlankIcon fontSize="small"/>}
                />
              ))}
            </Box>

            <Tooltip title={ui.showLowSignal ? "Low signal items are visible" : "Low signal items are hidden"}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={ui.toggleShowLowSignal}
                startIcon={ui.showLowSignal ? <VisibilityIcon /> : <VisibilityOffIcon />}
              >
                {ui.showLowSignal ? 'Show All Signal' : 'Hide Low Signal'}
              </Button>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

RelationshipMapperContent.propTypes = {
  title: PropTypes.string,
  entityType: PropTypes.oneOf(['Character', 'Element', 'Puzzle', 'Timeline']).isRequired,
  entityId: PropTypes.string.isRequired,
  entityName: PropTypes.string,
  relationshipData: PropTypes.object,
  graphData: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
};

// Wrapper component that provides the ReactFlowProvider
const RelationshipMapper = (props) => {
  return (
    <ReactFlowProvider>
      <RelationshipMapperContent {...props} />
    </ReactFlowProvider>
  );
};

RelationshipMapper.propTypes = {
  title: PropTypes.string,
  entityType: PropTypes.oneOf(['Character', 'Element', 'Puzzle', 'Timeline']).isRequired,
  entityId: PropTypes.string.isRequired,
  entityName: PropTypes.string,
  relationshipData: PropTypes.object,
  graphData: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.object,
};

export default RelationshipMapper; 