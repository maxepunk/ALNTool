import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Alert
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SpeedIcon from '@mui/icons-material/Speed';
import MemoryIcon from '@mui/icons-material/Memory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';

const ExperienceAnalysisPanel = ({ experienceAnalysis }) => {
  return (
    <Paper 
      elevation={2} 
      sx={{ 
        p: 2, 
        height: '100%',
        overflow: 'auto',
        transition: 'all 0.3s ease'
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <TrendingUpIcon />
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
  );
};

export default ExperienceAnalysisPanel;