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
  // Panel, // Panel is no longer used directly, custom panel is implemented
} from '@xyflow/react';
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
  // Fade, // No longer used for layout toggles
  // Menu, // No longer used for layout toggles
  // MenuItem, // No longer used for layout toggles
  Divider,
  // ListItemIcon, // No longer used for layout toggles
  // ListItemText, // No longer used for layout toggles
  Slider,
  // ToggleButtonGroup, // No longer used for layout selection
  // ToggleButton, // No longer used for layout selection
  Snackbar,
} from '@mui/material';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ZoomOutIcon from '@mui/icons-material/ZoomOut';
import FitScreenIcon from '@mui/icons-material/FitScreen';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';
import InfoIcon from '@mui/icons-material/Info';
// Icons for removed layout selectors (SchemaIcon, AccountTreeIcon, HubIcon) can be removed if not used elsewhere
// import SchemaIcon from '@mui/icons-material/Schema';
// import AccountTreeIcon from '@mui/icons-material/AccountTree';
// import HubIcon from '@mui/icons-material/Hub';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CloseIcon from '@mui/icons-material/Close';

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

  console.log('RelationshipMapper GraphData:', graphData);
  console.log('EntityType:', entityType);

  const { nodes: transformedNodes, edges: transformedEdges, error: graphError } = useGraphTransform({
    entityType,
    entityId,
    entityName,
    // rawData: relationshipData, // Pass graphData directly or ensure it contains all necessary info
    graphData, // Assuming graphData from BFF is the sole source now
    viewMode: ui.viewMode,
    depth: ui.depth,
    nodeFilters: ui.nodeFilters,
    edgeFilters: ui.edgeFilters,
    suppressLowSignal: !ui.showLowSignal,
    layoutType: layoutManager.layoutType, // Will be 'dagre'
    layoutOptions: layoutManager.options, // Standardized Dagre options
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const reactFlowInstance = useReactFlow();
  const navigate = useNavigate();
  const theme = useTheme();

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
  }), [entityType, ui.isFullScreen]); // Add dependencies
  const edgeTypes = useMemo(() => ({ custom: CustomEdge }), []);

  useEffect(() => {
    if (nodes && nodes.length > 0 && reactFlowInstance) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.25, duration: 300 });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [nodes, layoutManager.layoutType, reactFlowInstance, ui.isFullScreen]); // layoutType dependency remains for now, but will be fixed

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
        p: 1.5, // Adjusted padding
        pb: 0, 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: `1px solid ${theme.palette.divider}`,
        ...(ui.isFullScreen && { bgcolor: 'background.paper' })
      }}>
        <Typography variant="h6" sx={{fontSize: '1.1rem'}}>{title || `${entityName}'s Map`}</Typography> {/* Simplified title */} 
        <Tooltip title={ui.isFullScreen ? "Exit Fullscreen" : "Fullscreen Mode"}>\n          <IconButton onClick={ui.toggleFullScreen} size="small">\n            {ui.isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}\n          </IconButton>
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
            <Modal open={ui.infoOpen} onClose={ui.closeInfoModal} aria-labelledby="info-modal-title" aria-describedby="info-modal-description" disableEnforceFocus>
              <Paper sx={{position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: {xs: '90%', sm: 450, md: 500}, bgcolor: 'background.paper', boxShadow: 24, p: {xs: 2, sm: 3, md: 4}, borderRadius: 2 }}>
                <Typography id="info-modal-title" variant="h6" component="h2">Relationship Mapper Guide</Typography>
                <Typography id="info-modal-description" sx={{ mt: 2 }} component="div">
                  <p>This map visualizes connections using a hierarchical layout.</p>
                  <strong>Navigation:</strong>
                  <ul>
                    <li>Click on a node (entity) to navigate to its detail page.</li>
                    <li>Drag the background to pan the view.</li>
                    <li>Use mouse wheel or pinch to zoom.</li>
                  </ul>
                  <strong>Controls (Panel):</strong>
                  <ul>
                    <li><strong>View:</strong> Zoom in/out, or fit all items to the screen.</li>
                    {/* Removed Layout selection from help text */}
                    <li><strong>Exploration Depth:</strong> Control how many levels of connections are shown.</li>
                    <li><strong>Filter Nodes/Edges:</strong> Toggle visibility of specific entity types or relationships.</li>
                    <li><strong>Signal Strength:</strong> Show or hide items deemed less critical connections.</li>
                  </ul>
                </Typography>
                <Button onClick={ui.closeInfoModal} sx={{mt:3}} variant="contained">Got it!</Button>
              </Paper>
            </Modal>
            <Snackbar open={ui.snackbar.open} autoHideDuration={ui.snackbar.duration || 6000} onClose={ui.closeSnackbar} message={ui.snackbar.message} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} action={<IconButton size="small" aria-label="close" color="inherit" onClick={ui.closeSnackbar}><CloseIcon fontSize="small" /></IconButton>} sx={{ '.MuiSnackbarContent-root': { backgroundColor: ui.snackbar.severity ? `${ui.snackbar.severity}.main` : undefined } }}/>
          </ReactFlow>
          {/* ClusterHull rendering removed */}
        </Box>

        {!ui.isFullScreen && (
          <Box sx={{ width: '280px', flexShrink: 0, borderLeft: `1px solid ${theme.palette.divider}`, height: '100%', overflowY: 'auto', p: 1.5, backgroundColor: 'background.default' /* Slightly different bg for panel */ }}>
            <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1}}>
              <Typography variant="subtitle1" sx={{fontWeight: 600}}>Controls</Typography>
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
            <Divider sx={{my:1}}/>
            {/* Layout ToggleButtonGroup and Dagre Orientation ToggleButtonGroup removed */}

            <Typography variant="caption" display="block" id="depth-slider-label" gutterBottom>Exploration Depth: {ui.depth}</Typography>
            <Slider size="small" value={ui.depth} onChange={(e, newValue) => ui.setDepth(newValue)} aria-labelledby="depth-slider-label" valueLabelDisplay="auto" step={1} marks min={1} max={ui.maxDepth || 3} sx={{mb:1.5, mx: 0.5}}/>
            <Divider sx={{my:1}}/>

            <Typography variant="caption" display="block" gutterBottom>Filter Nodes by Type</Typography>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5}}>
              {Object.entries(ui.nodeFilters || {}).map(([type, checked]) => (
                <Chip key={type} icon={checked ? <CheckBoxIcon fontSize="small"/> : <CheckBoxOutlineBlankIcon fontSize="small"/>} label={type} onClick={() => ui.toggleNodeFilter(type)} size="small" color={checked ? "primary" : "default"} variant={checked ? "filled" : "outlined"}/>
              ))}
            </Box>
            <Divider sx={{my:1}}/>
            
            <Typography variant="caption" display="block" gutterBottom>Filter Edges by Type</Typography>
            <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5}}>
              {Object.entries(ui.edgeFilters || {}).map(([type, checked]) => (
                <Chip key={type} label={type.charAt(0).toUpperCase() + type.slice(1)} onClick={() => ui.toggleEdgeFilter(type)} size="small" color={checked ? "secondary" : "default"} variant={checked ? "filled" : "outlined"} icon={checked ? <CheckBoxIcon fontSize="small"/> : <CheckBoxOutlineBlankIcon fontSize="small"/>}/ >
              ))}
            </Box>
            <Divider sx={{my:1}}/>

            <Tooltip title={ui.showLowSignal ? "Low signal items are visible" : "Low signal items are hidden"}>\n              <Button variant="outlined" size="small" fullWidth onClick={ui.toggleShowLowSignal} startIcon={ui.showLowSignal ? <VisibilityIcon /> : <VisibilityOffIcon />}>
                {ui.showLowSignal ? 'Show All Connections' : 'Focus on Key Links'} {/* Updated text */}
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
  // relationshipData: PropTypes.object, // deprecated or part of graphData
  graphData: PropTypes.object, // Now the primary data source
  isLoading: PropTypes.bool,
  error: PropTypes.object,
};

const RelationshipMapper = (props) => (
  <ReactFlowProvider>
    <RelationshipMapperContent {...props} />
  </ReactFlowProvider>
);

RelationshipMapper.propTypes = RelationshipMapperContent.propTypes; // Inherit propTypes

export default RelationshipMapper;
