import React, { useEffect, useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, MiniMap } from '@xyflow/react';
import logger from '../../utils/logger';
import { logComponentData } from '../../utils/apiLogger';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Switch, 
  FormControlLabel, 
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import InfoIcon from '@mui/icons-material/Info';

import useJourneyStore from '../../stores/journeyStore';
import { useJourney } from '../../hooks/useJourney';
import useAutoLayout from '../../hooks/useAutoLayout';
import ActivityNode from './customNodes/ActivityNode';
import DiscoveryNode from './customNodes/DiscoveryNode';
import LoreNode from './customNodes/LoreNode';
import { analyzeExperienceFlow } from './analyzeExperienceFlow';
import ExperienceAnalysisPanel from './ExperienceAnalysisPanel';
import ErrorBoundary from '../ErrorBoundary';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  activityNode: ActivityNode,
  discoveryNode: DiscoveryNode,
  loreNode: LoreNode,
};


// The inner component that can use the auto-layout hook
const ExperienceFlowGraph = ({ initialNodes, initialEdges, characterData, analysisMode, onAnalysisUpdate }) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const setSelectedNode = useJourneyStore(state => state.setSelectedNode);
  const theme = useTheme();

  const layoutedNodes = useAutoLayout(initialNodes, initialEdges);
  
  // Experience Flow Analysis
  const experienceAnalysis = useMemo(() => 
    analyzeExperienceFlow(initialNodes, initialEdges, characterData), 
    [initialNodes, initialEdges, characterData]
  );
  
  useEffect(() => {
    if (onAnalysisUpdate && experienceAnalysis) {
      onAnalysisUpdate(experienceAnalysis);
    }
  }, [experienceAnalysis, onAnalysisUpdate]);

  useEffect(() => {
    // Apply experience flow styling in analysis mode
    let styledNodes = layoutedNodes;
    
    if (analysisMode && layoutedNodes && experienceAnalysis) {
      styledNodes = layoutedNodes.map(node => {
        const isBottleneck = experienceAnalysis.bottlenecks.some(b => b.includes('high-traffic'));
        const isMemoryToken = node.data?.label?.toLowerCase().includes('memory') || 
                              node.data?.label?.toLowerCase().includes('token');
        
        const enhancedStyle = {
          ...node.style,
          ...(isBottleneck && {
            border: '3px solid #ff9800',
            boxShadow: '0 0 10px rgba(255, 152, 0, 0.5)'
          }),
          ...(isMemoryToken && {
            border: '2px solid #4caf50',
            backgroundColor: '#e8f5e8'
          })
        };
        
        return {
          ...node,
          style: enhancedStyle,
          data: {
            ...node.data,
            analysisMode,
            isBottleneck,
            isMemoryToken
          }
        };
      });
    }
    
    setNodes(styledNodes);
  }, [layoutedNodes, setNodes, analysisMode, experienceAnalysis]);

  const handleNodeClick = (event, node) => {
    setSelectedNode(node);
    logger.debug('Selected node:', node);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.2 }}
    >
      <Controls />
      <Background color={theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[300]} />
      <MiniMap 
        nodeColor={(n) => {
          if (n.data?.isMemoryToken) return '#4caf50';
          if (n.data?.isBottleneck) return '#ff9800';
          return theme.palette.primary.main;
        }}
        style={{ 
          backgroundColor: theme.palette.background.paper, 
          border: `1px solid ${theme.palette.divider}` 
        }}
      />
    </ReactFlow>
  );
};


const ExperienceFlowAnalyzer = ({ characterId }) => {
  const { data: journeyData, isLoading, error } = useJourney(characterId);
  const [analysisMode, setAnalysisMode] = useState(false);
  const [experienceAnalysis, setExperienceAnalysis] = useState(null);
  const theme = useTheme();

  const journeyGraph = journeyData?.graph;
  const characterInfo = journeyData?.character_info;

  // Log component data for debugging
  useEffect(() => {
    logComponentData('JourneyGraphView', {
      characterId,
      journeyData,
      journeyGraph,
      characterInfo,
      hasNodes: journeyGraph?.nodes?.length > 0,
      hasEdges: journeyGraph?.edges?.length > 0
    }, {
      nodeCount: journeyGraph?.nodes?.length || 0,
      edgeCount: journeyGraph?.edges?.length || 0,
      firstNode: journeyGraph?.nodes?.[0]
    });
  }, [characterId, journeyData, journeyGraph, characterInfo]);

  const handleAnalysisUpdate = (analysis) => {
    setExperienceAnalysis(analysis);
  };

  if (isLoading) {
    return (
      <ErrorBoundary level="component">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'text.secondary'
        }}>
          <Typography>Loading experience flow...</Typography>
        </Box>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary level="component">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'error.main'
        }}>
          <Typography>Error loading journey: {error.message}</Typography>
        </Box>
      </ErrorBoundary>
    );
  }

  if (!journeyGraph || !journeyGraph.nodes || !journeyGraph.edges) {
    return (
      <ErrorBoundary level="component">
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100%',
          color: 'text.secondary'
        }}>
          <Typography>No journey data available</Typography>
        </Box>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="component">
      <Box sx={{ height: '100%', width: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Experience Flow Analyzer Header */}
      <Paper sx={{ p: 2, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            {analysisMode ? 'Experience Flow Analyzer' : 'Journey Timeline'}
          </Typography>
          {characterInfo && (
            <Chip 
              label={`${characterInfo.name} (${characterInfo.tier || 'Unknown'} Tier)`}
              color="primary"
              size="small"
            />
          )}
        </Box>
        <FormControlLabel
          control={
            <Switch 
              checked={analysisMode} 
              onChange={(e) => setAnalysisMode(e.target.checked)}
            />
          }
          label="Production Analysis"
        />
      </Paper>

      <Box sx={{ display: 'flex', flexGrow: 1, gap: 1 }}>
        {/* Main Graph Area */}
        <Box sx={{ flexGrow: 1, position: 'relative' }}>
          <ReactFlowProvider>
            <ExperienceFlowGraph 
              initialNodes={journeyGraph.nodes} 
              initialEdges={journeyGraph.edges}
              characterData={characterInfo}
              analysisMode={analysisMode}
              onAnalysisUpdate={handleAnalysisUpdate}
            />
          </ReactFlowProvider>
        </Box>

        {/* Analysis Panel */}
        {analysisMode && experienceAnalysis && (
          <Box sx={{ width: '320px', flexShrink: 0 }}>
            <ExperienceAnalysisPanel experienceAnalysis={experienceAnalysis} />
          </Box>
        )}
      </Box>
    </Box>
    </ErrorBoundary>
  );
};

// Keep backwards compatibility
const JourneyGraphView = ExperienceFlowAnalyzer;

export default JourneyGraphView;
export { ExperienceFlowAnalyzer }; 