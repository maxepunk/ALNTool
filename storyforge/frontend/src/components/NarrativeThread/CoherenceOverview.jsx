/**
 * CoherenceOverview.jsx
 * Overview component displaying overall narrative coherence metrics
 * 
 * Extracted from NarrativeThreadTrackerPage.jsx for better modularity
 * and reusability across narrative analysis features.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Grid,
  Box,
  LinearProgress
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ErrorBoundary from '../ErrorBoundary';
import { NARRATIVE_THREADS } from '../../utils/narrativeConstants';

const CoherenceOverview = ({ 
  overallScore = 0, 
  storyGaps = [], 
  elevation = 2,
  sx = {}
}) => {
  const getScoreColor = (score) => {
    if (score >= 80) return 'success.main';
    if (score >= 60) return 'warning.main';
    return 'error.main';
  };

  const getScoreVariant = (score) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getGapsColor = (gapsCount) => {
    if (gapsCount === 0) return 'success.main';
    if (gapsCount <= 3) return 'warning.main';
    return 'error.main';
  };

  const getGapsMessage = (gapsCount) => {
    if (gapsCount === 0) return 'No issues detected';
    return 'Issues need attention';
  };

  return (
    <ErrorBoundary level="component">
      <Paper sx={{ p: 3, mb: 3, ...sx }} elevation={elevation}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AutoStoriesIcon sx={{ mr: 1 }} />
          Narrative Coherence Overview
        </Typography>
        
        <Grid container spacing={3}>
          {/* Overall Coherence Score */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h2" 
                color={getScoreColor(overallScore)}
                sx={{ fontWeight: 'bold' }}
              >
                {overallScore}%
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Overall Coherence
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={overallScore} 
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
                color={getScoreVariant(overallScore)}
              />
            </Box>
          </Grid>
          
          {/* Story Gaps Count */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h2" 
                color={getGapsColor(storyGaps.length)}
                sx={{ fontWeight: 'bold' }}
              >
                {storyGaps.length}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Story Gaps
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {getGapsMessage(storyGaps.length)}
              </Typography>
            </Box>
          </Grid>
          
          {/* Active Threads Count */}
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography 
                variant="h2" 
                color="info.main"
                sx={{ fontWeight: 'bold' }}
              >
                {Object.keys(NARRATIVE_THREADS).length}
              </Typography>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active Threads
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Narrative storylines tracked
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </ErrorBoundary>
  );
};

CoherenceOverview.propTypes = {
  overallScore: PropTypes.number,
  storyGaps: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    thread: PropTypes.string,
    severity: PropTypes.oneOf(['error', 'warning', 'info']),
    message: PropTypes.string,
    impact: PropTypes.string
  })),
  elevation: PropTypes.number,
  sx: PropTypes.object
};

export default CoherenceOverview;