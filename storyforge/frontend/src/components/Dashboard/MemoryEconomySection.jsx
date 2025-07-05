import React from 'react';
import {
  Box,
  Typography,
  Paper,
  LinearProgress
} from '@mui/material';
import MemoryIcon from '@mui/icons-material/Memory';

const MemoryEconomySection = ({ 
  memoryTokensCompleted = 0, 
  memoryTokensTotal = 0, 
  memoryCompletionPercentage = 0 
}) => {
  return (
    <Paper sx={{ p: 3, height: '100%' }} elevation={2}>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
        <MemoryIcon sx={{ mr: 1 }} />
        Memory Economy
      </Typography>
      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="h3" color="primary">{memoryTokensCompleted || 0}</Typography>
        <Typography variant="body1" color="text.secondary">of {memoryTokensTotal || 0} tokens</Typography>
        <LinearProgress 
          variant="determinate" 
          value={memoryCompletionPercentage || 0} 
          sx={{ mt: 2, mb: 1, height: 8, borderRadius: 4 }}
        />
        <Typography variant="h6" color="primary">{memoryCompletionPercentage || 0}% Complete</Typography>
        <Typography variant="caption" color="text.secondary">
          {Math.max(0, (memoryTokensTotal || 0) - (memoryTokensCompleted || 0))} tokens remaining
        </Typography>
      </Box>
    </Paper>
  );
};

export default MemoryEconomySection;