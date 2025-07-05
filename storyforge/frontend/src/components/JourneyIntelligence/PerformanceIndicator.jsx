import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import SpeedIcon from '@mui/icons-material/Speed';
import WarningIcon from '@mui/icons-material/Warning';

const PerformanceIndicator = () => {
  const { performanceMode, visibleNodeCount } = useJourneyIntelligenceStore();
  
  const isWarning = visibleNodeCount >= 47;
  const isPerformanceMode = performanceMode === 'performance' || (performanceMode === 'auto' && visibleNodeCount >= 40);
  
  return (
    <Box 
      data-testid="performance-indicator" 
      sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
      className={isWarning ? 'warning' : ''}
    >
      {isWarning && <WarningIcon color="warning" fontSize="small" />}
      <SpeedIcon fontSize="small" />
      <Typography variant="body2">
        {visibleNodeCount} nodes
      </Typography>
      {isPerformanceMode && (
        <Chip 
          label="Performance Mode" 
          size="small" 
          color="primary"
          variant="outlined"
        />
      )}
      {isWarning && (
        <Typography variant="caption" color="warning.main">
          Approaching limit
        </Typography>
      )}
    </Box>
  );
};

export default PerformanceIndicator;