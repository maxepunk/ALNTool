import React, { useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { ReactFlow, Background, Controls, MiniMap, useNodesState, useEdgesState, MarkerType } from '@xyflow/react';
import { Box, Typography, CircularProgress, Alert, Paper, useTheme } from '@mui/material';
import PageHeader from '../components/PageHeader';
import api from '../services/api';
import { getDagreLayout } from '../components/RelationshipMapper/layoutUtils'; // Assuming this can be reused

// Simple Node component for this view
const FlowNode = ({ data }) => {
  const theme = useTheme();
  let backgroundColor = theme.palette.grey[200];
  let textColor = theme.palette.getContrastText(backgroundColor);
  let borderColor = theme.palette.grey[400];

  if (data.flowNodeType === 'centralPuzzle') {
    backgroundColor = theme.palette.primary.main;
    textColor = theme.palette.primary.contrastText;
    borderColor = theme.palette.primary.dark;
  } else if (data.flowNodeType === 'inputElement' || data.flowNodeType === 'outputElement') {
    backgroundColor = theme.palette.secondary.light;
    textColor = theme.palette.secondary.contrastText;
    borderColor = theme.palette.secondary.main;
  } else if (data.flowNodeType === 'linkedPuzzle') {
    backgroundColor = theme.palette.info.light;
    textColor = theme.palette.info.contrastText;
    borderColor = theme.palette.info.main;
  }

  return (
    <Paper
      elevation={3}
      sx={{
        p: 1,
        borderRadius: 1,
        border: `1px solid ${borderColor}`,
        backgroundColor,
        color: textColor,
        minWidth: 120,
        maxWidth: 200,
        textAlign: 'center'
      }}
    >
      <Typography variant="caption" sx={{fontWeight: 'bold'}}>{data.label}</Typography>
      {data.subLabel && <Typography variant="caption" display="block" sx={{fontSize: '0.65rem'}}>{data.subLabel}</Typography>}
    </Paper>
  );
};

const nodeTypes = {
  flowNode: FlowNode,
};

const PuzzleFlowPage = () => {
  const { id: puzzleId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: flowData, isLoading, error } = useQuery(
    ['puzzleFlow', puzzleId],
    () => api.getPuzzleFlow(puzzleId),
    { enabled: !!puzzleId }
  );

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const layoutedElements = useMemo(() => {
    if (!flowData) return null;

    const newNodes = [];
    const newEdges = [];
    const centralPuzzleId = flowData.centralPuzzle.id;

    // Central Puzzle
    newNodes.push({
      id: centralPuzzleId,
      type: 'flowNode',
      data: { label: flowData.centralPuzzle.name, flowNodeType: 'centralPuzzle', entityId: centralPuzzleId, entityType: 'Puzzle' },
      position: { x: 0, y: 0 }, // Initial position, layout will adjust
    });

    // Input Elements
    (flowData.inputElements || []).forEach(el => {
      newNodes.push({
        id: el.id,
        type: 'flowNode',
        data: { label: el.name, subLabel: `(${el.basicType || 'Element'})`, flowNodeType: 'inputElement', entityId: el.id, entityType: 'Element' },
        position: { x: 0, y: 0 },
      });
      newEdges.push({
        id: `input-${el.id}-to-${centralPuzzleId}`,
        source: el.id,
        target: centralPuzzleId,
        label: 'requires',
        markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.error.main },
        style: { stroke: theme.palette.error.light, strokeWidth: 1.5 },
      });
    });

    // Output Elements
    (flowData.outputElements || []).forEach(el => {
      newNodes.push({
        id: el.id,
        type: 'flowNode',
        data: { label: el.name, subLabel: `(${el.basicType || 'Element'})`, flowNodeType: 'outputElement', entityId: el.id, entityType: 'Element' },
        position: { x: 0, y: 0 },
      });
      newEdges.push({
        id: `reward-${centralPuzzleId}-to-${el.id}`,
        source: centralPuzzleId,
        target: el.id,
        label: 'rewards',
        markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.success.main },
        style: { stroke: theme.palette.success.light, strokeWidth: 1.5 },
      });
    });

    // Prerequisite Puzzles
    (flowData.prerequisitePuzzles || []).forEach(p => {
      newNodes.push({
        id: p.id,
        type: 'flowNode',
        data: { label: p.name, subLabel: '(Prerequisite)', flowNodeType: 'linkedPuzzle', entityId: p.id, entityType: 'Puzzle' },
        position: { x: 0, y: 0 },
      });
      newEdges.push({
        id: `prereq-${p.id}-to-${centralPuzzleId}`,
        source: p.id,
        target: centralPuzzleId,
        label: 'unlocks',
        markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.info.main },
        style: { stroke: theme.palette.info.light, strokeDasharray: '5,5', strokeWidth: 1.5 },
      });
    });

    // Unlocks Puzzles
    (flowData.unlocksPuzzles || []).forEach(p => {
      newNodes.push({
        id: p.id,
        type: 'flowNode',
        data: { label: p.name, subLabel: '(Unlocks)', flowNodeType: 'linkedPuzzle', entityId: p.id, entityType: 'Puzzle' },
        position: { x: 0, y: 0 },
      });
      newEdges.push({
        id: `unlocks-${centralPuzzleId}-to-${p.id}`,
        source: centralPuzzleId,
        target: p.id,
        label: 'unlocks',
        markerEnd: { type: MarkerType.ArrowClosed, color: theme.palette.info.main },
        style: { stroke: theme.palette.info.light, strokeDasharray: '5,5', strokeWidth: 1.5 },
      });
    });

    // Remove duplicate nodes (e.g. if an element is both input and output, though unlikely for this model)
    const uniqueNodes = Array.from(new Map(newNodes.map(node => [node.id, node])).values());

    return getDagreLayout(uniqueNodes, newEdges, { direction: 'LR' });

  }, [flowData, theme]);

  useEffect(() => {
    if (layoutedElements) {
      setNodes(layoutedElements.nodes);
      setEdges(layoutedElements.edges);
    } else {
      setNodes([]);
      setEdges([]);
    }
  }, [layoutedElements, setNodes, setEdges]);

  const onNodeClick = (event, node) => {
    if (node.data?.entityId && node.data?.entityType) {
      const path = `/${node.data.entityType.toLowerCase()}s/${node.data.entityId}`;
      navigate(path);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading Puzzle Flow...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">Error loading puzzle flow: {error.message}</Alert>;
  }

  if (!flowData) {
    return <Alert severity="info">No flow data available for this puzzle.</Alert>;
  }

  return (
    <Box sx={{ m: 2, height: 'calc(100vh - 120px)' /* Adjust height as needed */ }}>
      <PageHeader title={`Puzzle Flow: ${flowData?.centralPuzzle?.name || puzzleId}`} />
      <Paper sx={{ height: '100%', width: '100%' }} elevation={2}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </Paper>
    </Box>
  );
};

export default PuzzleFlowPage;
