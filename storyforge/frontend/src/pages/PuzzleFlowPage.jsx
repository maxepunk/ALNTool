import React, { useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { Box, Paper, CircularProgress, Alert, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ReactFlow, Background, Controls, MiniMap, ReactFlowProvider, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';

import PageHeader from '../components/PageHeader';
// import RelationshipMapper from '../components/RelationshipMapper'; // Not directly using RelationshipMapper component
import { api } from '../services/api';
import useGraphTransform from '../components/RelationshipMapper/useGraphTransform';
import EntityNode from '../components/RelationshipMapper/EntityNode';
import CustomEdge from '../components/RelationshipMapper/CustomEdge';

import '@xyflow/react/dist/style.css';

const nodeTypes = { entityNode: EntityNode };
const edgeTypes = { custom: CustomEdge };

function PuzzleFlowPage() {
  const { id: puzzleId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const queryKey = ['puzzleFlowGraph', puzzleId];
  const { data: rawGraphData, isLoading, isError, error, refetch, isFetching } = useQuery(
    queryKey,
    () => api.getPuzzleFlowGraph(puzzleId),
    {
      enabled: !!puzzleId,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    }
  );

  const centralEntityName = rawGraphData?.center?.name || puzzleId;

  // useGraphTransform is used here primarily for layout application.
  // The backend /flowgraph endpoint already structures nodes and edges.
  // ParentId assignment and complex filtering are likely not needed here.
  const { nodes: layoutedNodes, edges: layoutedEdges, error: layoutError } = useGraphTransform({
    graphData: rawGraphData, // Pass the raw data from the new endpoint
    entityId: puzzleId,
    entityType: 'Puzzle', // The central entity is a Puzzle
    entityName: centralEntityName,
    viewMode: 'LR', // Use 'LR' (Left-to-Right) for Puzzle Flow
    layoutOptions: {
      rankdir: 'LR',
      ranksep: 120,
      nodesep: 70,
    },
    suppressLowSignal: false, // Show all fetched nodes/edges
    depth: 99, // Assume backend sends the appropriate depth
    // Disable specific parentId assignment logic if not using compound nodes for flow
    // by not providing the typical edge shortLabels that trigger it,
    // or by adding an option to useGraphTransform to disable it.
    // For now, rely on the backend data structure not needing this.
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    if (layoutedNodes) setNodes(layoutedNodes);
  }, [layoutedNodes, setNodes]);

  useEffect(() => {
    if (layoutedEdges) setEdges(layoutedEdges);
  }, [layoutedEdges, setEdges]);

  const onNodeClick = (event, node) => {
    // Navigate to detail page based on node type
    const type = node.data?.type || node.type; // data.type from graphData, node.type from ReactFlow
    if (type === 'Puzzle') {
      navigate(`/puzzles/${node.id}`);
    } else if (type === 'Element') {
      navigate(`/elements/${node.id}`);
    } else if (type === 'Character') {
      navigate(`/characters/${node.id}`);
    } else {
      console.log('Clicked node with unhandled type:', node);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress size={50} /> <Typography sx={{ml:2}}>Loading Puzzle Flow...</Typography>
      </Box>
    );
  }

  if (isError) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="error">Error loading puzzle flow: {error?.message || 'Unknown error'}</Alert>
        <Button startIcon={<ArrowBackIcon />} component={RouterLink} to={`/puzzles/${puzzleId}`} sx={{ mr: 1, mt: 2 }}>Back to Puzzle</Button>
        <Button startIcon={<RefreshIcon />} onClick={() => refetch()} sx={{ mt: 2 }}>Retry</Button>
      </Paper>
    );
  }

  if (layoutError) {
     return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="error">Error processing graph layout: {layoutError.message}</Alert>
         <Button startIcon={<ArrowBackIcon />} component={RouterLink} to={`/puzzles/${puzzleId}`} sx={{ mr: 1, mt: 2 }}>Back to Puzzle</Button>
        <Button startIcon={<RefreshIcon />} onClick={() => refetch()} sx={{ mt: 2 }}>Retry</Button>
      </Paper>
    );
  }

  if (!rawGraphData || !layoutedNodes || !layoutedEdges) {
    return (
      <Paper sx={{ p: 3, m:1 }} elevation={3}>
        <Alert severity="info">No flow data available for this puzzle or layout could not be generated.</Alert>
         <Button startIcon={<ArrowBackIcon />} component={RouterLink} to={`/puzzles/${puzzleId}`} sx={{ mr: 1, mt: 2 }}>Back to Puzzle</Button>
         <Button startIcon={<RefreshIcon />} onClick={() => refetch()} sx={{ mt: 2 }}>Refresh</Button>
      </Paper>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${centralEntityName} - Flow View`}
        breadcrumbs={[
          { name: 'Puzzles', path: '/puzzles' },
          { name: centralEntityName, path: `/puzzles/${puzzleId}` },
          { name: 'Flow' },
        ]}
        action={
            <Box sx={{display: 'flex', gap: 1}}>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} disabled={isFetching}>
                    {isFetching ? 'Refreshing...' : 'Refresh Flow'}
                </Button>
                 <Button variant="contained" startIcon={<ArrowBackIcon />} component={RouterLink} to={`/puzzles/${puzzleId}`}>
                    Back to Puzzle Details
                </Button>
            </Box>
        }
      />
      <Paper sx={{ height: 'calc(100vh - 220px)', width: '100%', p: 0, position: 'relative' }} elevation={1}>
        {isFetching && !rawGraphData ? ( // Show loading overlay only if fetching and no data yet
           <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <CircularProgress /> <Typography sx={{ml:2}}>Loading Graph...</Typography>
          </Box>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodeClick={onNodeClick}
            fitView
            attributionPosition="bottom-right"
            defaultMarkerColor="#ccc" // Default marker color for edges
          >
            <Background />
            <Controls />
            <MiniMap nodeStrokeWidth={3} zoomable pannable />
          </ReactFlow>
        )}
      </Paper>
    </Box>
  );
}

export default function PuzzleFlowPageWrapper() {
  return (
    <ReactFlowProvider>
      <PuzzleFlowPage />
    </ReactFlowProvider>
  );
}
