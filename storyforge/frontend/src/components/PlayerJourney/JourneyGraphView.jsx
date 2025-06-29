import React, { useEffect, useMemo, useState } from 'react';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState, Controls, Background, MiniMap } from '@xyflow/react';
import logger from '../../utils/logger';
import { 
  Box, 
  Typography, 
  Paper, 
  Chip, 
  Switch, 
  FormControlLabel, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  Alert,
  LinearProgress,
  Tooltip,
  IconButton,
  useTheme
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import InfoIcon from '@mui/icons-material/Info';

import useJourneyStore from '../../stores/journeyStore';
import useAutoLayout from '../../hooks/useAutoLayout';
import ActivityNode from './customNodes/ActivityNode';
import DiscoveryNode from './customNodes/DiscoveryNode';
import LoreNode from './customNodes/LoreNode';

import '@xyflow/react/dist/style.css';

const nodeTypes = {
  activityNode: ActivityNode,
  discoveryNode: DiscoveryNode,
  loreNode: LoreNode,
};

// Experience Flow Analysis utilities
const analyzeExperienceFlow = (nodes, edges, characterData) => {
  if (!nodes || !edges) return {
    pacing: { score: 0, issues: [] },
    memoryTokenFlow: { collected: 0, total: 0, progression: [] },
    actTransitions: { smooth: true, issues: [] },
    bottlenecks: [],
    qualityMetrics: { discoveryRatio: 0, actionRatio: 0, balance: 'unknown' }
  };

  const analysis = {
    pacing: { score: 85, issues: [] },
    memoryTokenFlow: { collected: 0, total: 0, progression: [] },
    actTransitions: { smooth: true, issues: [] },
    bottlenecks: [],
    qualityMetrics: { discoveryRatio: 0, actionRatio: 0, balance: 'good' }
  };

  // Analyze pacing by looking at node clustering and types
  const activityNodes = nodes.filter(n => n.type === 'activityNode');
  const discoveryNodes = nodes.filter(n => n.type === 'discoveryNode');
  const totalNodes = nodes.length;

  if (totalNodes > 0) {
    const discoveryRatio = (discoveryNodes.length / totalNodes) * 100;
    const actionRatio = (activityNodes.length / totalNodes) * 100;
    
    analysis.qualityMetrics.discoveryRatio = Math.round(discoveryRatio);
    analysis.qualityMetrics.actionRatio = Math.round(actionRatio);
    
    // Ideal ratio is 60% discovery, 40% action for About Last Night
    if (discoveryRatio < 50) {
      analysis.pacing.issues.push('Low discovery content - may feel rushed');
      analysis.pacing.score -= 15;
    } else if (discoveryRatio > 75) {
      analysis.pacing.issues.push('High discovery ratio - may feel slow');
      analysis.pacing.score -= 10;
    }
    
    analysis.qualityMetrics.balance = 
      discoveryRatio >= 55 && discoveryRatio <= 70 ? 'excellent' :
      discoveryRatio >= 45 && discoveryRatio <= 80 ? 'good' : 'needs-attention';
  }

  // Check for memory token flow (simulate based on About Last Night's 55-token economy)
  const memoryEvents = nodes.filter(n => 
    n.data?.label?.toLowerCase().includes('memory') ||
    n.data?.label?.toLowerCase().includes('token') ||
    n.data?.type === 'memory'
  );
  
  analysis.memoryTokenFlow.collected = memoryEvents.length;
  analysis.memoryTokenFlow.total = 8; // Estimated per character in 55-token economy
  
  if (analysis.memoryTokenFlow.collected < 3) {
    analysis.bottlenecks.push('Memory token collection below target - check economy balance');
  }

  // Detect potential bottlenecks from node connections
  const highConnectionNodes = nodes.filter(n => {
    const connections = edges.filter(e => e.source === n.id || e.target === n.id);
    return connections.length > 4;
  });
  
  if (highConnectionNodes.length > 0) {
    analysis.bottlenecks.push(`${highConnectionNodes.length} high-traffic nodes may cause congestion`);
  }

  // Act transition analysis (look for Act 1 -> Act 2 flow)
  const act1Nodes = nodes.filter(n => n.data?.act === 1 || n.data?.actFocus === 'Act 1');
  const act2Nodes = nodes.filter(n => n.data?.act === 2 || n.data?.actFocus === 'Act 2');
  
  if (act1Nodes.length === 0 && act2Nodes.length === 0) {
    analysis.actTransitions.issues.push('No clear act structure detected');
    analysis.actTransitions.smooth = false;
  } else if (act1Nodes.length > 0 && act2Nodes.length === 0) {
    analysis.actTransitions.issues.push('Missing Act 2 content - incomplete experience');
    analysis.actTransitions.smooth = false;
  }

  return analysis;
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
    if (onAnalysisUpdate) {
      onAnalysisUpdate(experienceAnalysis);
    }
  }, [experienceAnalysis, onAnalysisUpdate]);

  useEffect(() => {
    // Apply experience flow styling in analysis mode
    let styledNodes = layoutedNodes;
    
    if (analysisMode && layoutedNodes) {
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
  const journeyData = useJourneyStore(state => state.journeyData.get(characterId));
  const [analysisMode, setAnalysisMode] = useState(false);
  const [experienceAnalysis, setExperienceAnalysis] = useState(null);
  const theme = useTheme();

  const journeyGraph = journeyData?.graph;
  const characterInfo = journeyData?.character_info;

  const handleAnalysisUpdate = (analysis) => {
    setExperienceAnalysis(analysis);
  };

  if (!journeyGraph || !journeyGraph.nodes || !journeyGraph.edges) {
    return (
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: '100%',
        color: 'text.secondary'
      }}>
        <Typography>Loading experience flow...</Typography>
      </Box>
    );
  }

  return (
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
          <Paper sx={{ 
            width: '320px', 
            flexShrink: 0, 
            p: 2, 
            overflowY: 'auto',
            maxHeight: '100%'
          }}>
            <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon color="primary" />
              Flow Analysis
            </Typography>

            {/* Pacing Analysis */}
            <Accordion defaultExpanded sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SpeedIcon fontSize="small" />
                  Pacing Score: {experienceAnalysis.pacing.score}/100
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <LinearProgress 
                  variant="determinate" 
                  value={experienceAnalysis.pacing.score} 
                  sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  color={experienceAnalysis.pacing.score >= 80 ? 'success' : experienceAnalysis.pacing.score >= 60 ? 'warning' : 'error'}
                />
                {experienceAnalysis.pacing.issues.length > 0 ? (
                  experienceAnalysis.pacing.issues.map((issue, index) => (
                    <Alert key={index} severity="warning" sx={{ mt: 1 }}>
                      {issue}
                    </Alert>
                  ))
                ) : (
                  <Alert severity="success">Pacing looks good!</Alert>
                )}
              </AccordionDetails>
            </Accordion>

            {/* Memory Token Flow */}
            <Accordion sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <MemoryIcon fontSize="small" />
                  Memory Tokens: {experienceAnalysis.memoryTokenFlow.collected}/{experienceAnalysis.memoryTokenFlow.total}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <LinearProgress 
                  variant="determinate" 
                  value={(experienceAnalysis.memoryTokenFlow.collected / experienceAnalysis.memoryTokenFlow.total) * 100} 
                  sx={{ mb: 2, height: 8, borderRadius: 4 }}
                  color="info"
                />
                <Typography variant="caption" color="text.secondary">
                  Target: 3-8 tokens per character in the 55-token economy
                </Typography>
              </AccordionDetails>
            </Accordion>

            {/* Experience Quality */}
            <Accordion sx={{ mb: 1 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon fontSize="small" />
                  Experience Balance: {experienceAnalysis.qualityMetrics.balance}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption">Discovery: {experienceAnalysis.qualityMetrics.discoveryRatio}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={experienceAnalysis.qualityMetrics.discoveryRatio} 
                    sx={{ mb: 1, height: 6 }}
                    color="primary"
                  />
                  <Typography variant="caption">Action: {experienceAnalysis.qualityMetrics.actionRatio}%</Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={experienceAnalysis.qualityMetrics.actionRatio} 
                    sx={{ height: 6 }}
                    color="secondary"
                  />
                </Box>
                <Alert 
                  severity={experienceAnalysis.qualityMetrics.balance === 'excellent' ? 'success' : 
                           experienceAnalysis.qualityMetrics.balance === 'good' ? 'info' : 'warning'}
                >
                  {experienceAnalysis.qualityMetrics.balance === 'excellent' ? 'Perfect discovery/action balance' :
                   experienceAnalysis.qualityMetrics.balance === 'good' ? 'Good experience balance' :
                   'Balance needs attention - aim for 55-70% discovery'}
                </Alert>
              </AccordionDetails>
            </Accordion>

            {/* Bottlenecks */}
            {experienceAnalysis.bottlenecks.length > 0 && (
              <Accordion sx={{ mb: 1 }}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography variant="subtitle2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WarningIcon fontSize="small" color="warning" />
                    Bottlenecks ({experienceAnalysis.bottlenecks.length})
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {experienceAnalysis.bottlenecks.map((bottleneck, index) => (
                    <Alert key={index} severity="warning" sx={{ mt: index > 0 ? 1 : 0 }}>
                      {bottleneck}
                    </Alert>
                  ))}
                </AccordionDetails>
              </Accordion>
            )}

            {/* Legend */}
            <Box sx={{ mt: 2, p: 1, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block', mb: 1 }}>Visual Legend:</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#4caf50', borderRadius: 1 }} />
                  <Typography variant="caption">Memory Tokens</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#ff9800', borderRadius: 1 }} />
                  <Typography variant="caption">Potential Bottlenecks</Typography>
                </Box>
              </Box>
            </Box>
          </Paper>
        )}
      </Box>
    </Box>
  );
};

// Keep backwards compatibility
const JourneyGraphView = ExperienceFlowAnalyzer;

export default JourneyGraphView;
export { ExperienceFlowAnalyzer }; 