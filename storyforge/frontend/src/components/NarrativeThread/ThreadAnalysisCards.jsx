/**
 * ThreadAnalysisCards.jsx
 * Grid of cards displaying individual narrative thread analysis
 * 
 * Extracted from NarrativeThreadTrackerPage.jsx for better modularity
 * and reusability across narrative analysis features.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Chip,
  LinearProgress,
  Tooltip
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import ExtensionIcon from '@mui/icons-material/Extension';
import MemoryIcon from '@mui/icons-material/Memory';
import TimelineIcon from '@mui/icons-material/Timeline';
import ErrorBoundary from '../ErrorBoundary';
import { NARRATIVE_THREADS } from '../../utils/narrativeConstants';

const ThreadAnalysisCards = ({ 
  coherenceMetrics = {}, 
  threadMaps = {},
  spacing = 3,
  sx = {}
}) => {
  const getCoherenceColor = (score) => {
    if (score >= 70) return 'success';
    if (score >= 50) return 'warning';
    return 'error';
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      default: return 'default';
    }
  };

  return (
    <ErrorBoundary level="component">
      <Grid container spacing={spacing} sx={{ mb: 3, ...sx }}>
        {Object.keys(NARRATIVE_THREADS).map(thread => {
          const threadConfig = NARRATIVE_THREADS[thread];
          const metrics = coherenceMetrics[thread] || {};
          const threadData = threadMaps[thread] || {};
          
          return (
            <Grid item xs={12} md={6} lg={4} key={thread}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-2px)' } }}>
                <CardContent>
                  {/* Thread Header */}
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Avatar sx={{ bgcolor: `${threadConfig.color}.light`, mr: 2, fontSize: '1.2rem' }}>
                      {threadConfig.icon}
                    </Avatar>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="h6" sx={{ lineHeight: 1.2 }}>
                        {thread}
                      </Typography>
                      <Chip 
                        label={threadConfig.priority} 
                        size="small" 
                        color={getPriorityColor(threadConfig.priority)}
                        sx={{ mt: 0.5 }}
                      />
                    </Box>
                  </Box>
                  
                  {/* Thread Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {threadConfig.description}
                  </Typography>
                  
                  {/* Coherence Score Section */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Coherence Score
                    </Typography>
                    <LinearProgress 
                      variant="determinate" 
                      value={metrics.coherenceScore || 0}
                      sx={{ mb: 1, height: 6, borderRadius: 3 }}
                      color={getCoherenceColor(metrics.coherenceScore || 0)}
                    />
                    <Typography variant="body2" color="text.secondary">
                      {metrics.coherenceScore || 0}% • {metrics.connections || 0} connections
                    </Typography>
                  </Box>
                  
                  {/* Content Statistics Grid */}
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Tooltip title="Characters involved in this narrative thread">
                        <Chip 
                          icon={<PeopleIcon />}
                          label={threadData.characters?.length || 0}
                          size="small"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={6}>
                      <Tooltip title="Elements connected to this thread">
                        <Chip 
                          icon={<MemoryIcon />}
                          label={threadData.elements?.length || 0}
                          size="small"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={6}>
                      <Tooltip title="Puzzles related to this thread">
                        <Chip 
                          icon={<ExtensionIcon />}
                          label={threadData.puzzles?.length || 0}
                          size="small"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      </Tooltip>
                    </Grid>
                    <Grid item xs={6}>
                      <Tooltip title="Timeline events in this thread">
                        <Chip 
                          icon={<TimelineIcon />}
                          label={threadData.timelineEvents?.length || 0}
                          size="small"
                          variant="outlined"
                          sx={{ width: '100%' }}
                        />
                      </Tooltip>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </ErrorBoundary>
  );
};

ThreadAnalysisCards.propTypes = {
  coherenceMetrics: PropTypes.objectOf(PropTypes.shape({
    totalItems: PropTypes.number,
    connections: PropTypes.number,
    coherenceScore: PropTypes.number,
    density: PropTypes.number,
    coverage: PropTypes.object
  })),
  threadMaps: PropTypes.objectOf(PropTypes.shape({
    characters: PropTypes.array,
    elements: PropTypes.array,
    puzzles: PropTypes.array,
    timelineEvents: PropTypes.array,
    connections: PropTypes.number,
    coherenceScore: PropTypes.number
  })),
  spacing: PropTypes.number,
  sx: PropTypes.object
};

export default ThreadAnalysisCards;