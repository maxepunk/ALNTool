/**
 * ThreadAnalysisSection.jsx
 * Comprehensive tabbed analysis section for narrative threads
 * 
 * Extracted from NarrativeThreadTrackerPage.jsx for better modularity.
 * Contains Thread Details, Story Gaps, Content Distribution, and Legacy views.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Grid,
  AvatarGroup,
  Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorBoundary from '../ErrorBoundary';
import { NARRATIVE_THREADS } from '../../utils/narrativeConstants';

const ThreadAnalysisSection = ({ 
  activeTab = 0,
  onTabChange,
  coherenceMetrics = {},
  threadMaps = {},
  storyGaps = [],
  elevation = 2,
  legacyThreadView = null,
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

  const getSeverityColor = (severity) => {
    return severity === 'error' ? 'error' : 'warning';
  };

  return (
    <ErrorBoundary level="component">
      <Paper sx={{ mb: 3, ...sx }} elevation={elevation}>
        <Tabs 
          value={activeTab} 
          onChange={onTabChange} 
          sx={{ borderBottom: 1, borderColor: 'divider' }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="Thread Details" />
          <Tab label="Story Gaps" />
          <Tab label="Content Distribution" />
          {legacyThreadView && <Tab label="Legacy Thread View" />}
        </Tabs>
        
        {/* Thread Details Tab */}
        {activeTab === 0 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Narrative Thread Analysis
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Comprehensive overview of all narrative threads with coherence scores and content metrics.
            </Typography>
            
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Thread</TableCell>
                    <TableCell align="right">Coherence</TableCell>
                    <TableCell align="right">Content Items</TableCell>
                    <TableCell align="right">Connections</TableCell>
                    <TableCell align="right">Priority</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.keys(NARRATIVE_THREADS).map(thread => {
                    const threadConfig = NARRATIVE_THREADS[thread];
                    const metrics = coherenceMetrics[thread] || {};
                    
                    return (
                      <TableRow key={thread} hover>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              sx={{ 
                                bgcolor: `${threadConfig.color}.light`, 
                                mr: 2, 
                                width: 32, 
                                height: 32,
                                fontSize: '0.875rem'
                              }}
                            >
                              {threadConfig.icon}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="medium">
                                {thread}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {threadConfig.description}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${metrics.coherenceScore || 0}%`}
                            color={getCoherenceColor(metrics.coherenceScore || 0)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="medium">
                            {metrics.totalItems || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2">
                            {metrics.connections || 0}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={threadConfig.priority}
                            color={getPriorityColor(threadConfig.priority)}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="right">
                          {metrics.coherenceScore >= 70 ? (
                            <Tooltip title="Thread coherence is good">
                              <CheckCircleIcon color="success" />
                            </Tooltip>
                          ) : (
                            <Tooltip title="Thread needs attention">
                              <WarningIcon color="warning" />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        )}
        
        {/* Story Gaps Tab */}
        {activeTab === 1 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Story Gaps & Issues
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Identified narrative issues that may impact story coherence and player experience.
            </Typography>
            
            {storyGaps.length === 0 ? (
              <Alert severity="success" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Excellent Story Coherence!
                  </Typography>
                  <Typography variant="body2">
                    No story gaps detected. All narrative threads have good coherence and connectivity.
                  </Typography>
                </Box>
              </Alert>
            ) : (
              <List>
                {storyGaps.map((gap, index) => (
                  <React.Fragment key={index}>
                    <ListItem sx={{ alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ mt: 1 }}>
                        <Chip 
                          label={gap.severity}
                          color={getSeverityColor(gap.severity)}
                          size="small"
                        />
                      </ListItemIcon>
                      <ListItemText 
                        primary={gap.message}
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              <strong>Impact:</strong> {gap.impact}
                            </Typography>
                            <Chip 
                              label={gap.thread}
                              size="small"
                              color={NARRATIVE_THREADS[gap.thread]?.color || 'default'}
                              variant="outlined"
                            />
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < storyGaps.length - 1 && <Divider variant="inset" component="li" />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        )}
        
        {/* Content Distribution Tab */}
        {activeTab === 2 && (
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Content Distribution by Thread
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Overview of characters, elements, puzzles, and events distributed across narrative threads.
            </Typography>
            
            <Grid container spacing={2}>
              {Object.keys(NARRATIVE_THREADS).map(thread => {
                const threadData = threadMaps[thread] || {};
                const threadConfig = NARRATIVE_THREADS[thread];
                
                return (
                  <Grid item xs={12} md={6} key={thread}>
                    <Paper sx={{ p: 2 }} variant="outlined">
                      <Typography variant="subtitle1" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                        <Avatar 
                          sx={{ 
                            bgcolor: `${threadConfig.color}.light`, 
                            mr: 1, 
                            width: 24, 
                            height: 24,
                            fontSize: '0.75rem'
                          }}
                        >
                          {threadConfig.icon}
                        </Avatar>
                        {thread}
                      </Typography>
                      
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Characters ({threadData.characters?.length || 0}):
                          </Typography>
                          <AvatarGroup max={4} sx={{ justifyContent: 'flex-start' }}>
                            {threadData.characters?.slice(0, 4).map(char => (
                              <Tooltip key={char.id} title={char.name}>
                                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>
                                  {char.name.charAt(0)}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        </Grid>
                        
                        <Grid item xs={12} sm={6}>
                          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                            Content Summary:
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            <Chip 
                              label={`${threadData.elements?.length || 0} elements`} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${threadData.puzzles?.length || 0} puzzles`} 
                              size="small" 
                              variant="outlined"
                            />
                            <Chip 
                              label={`${threadData.timelineEvents?.length || 0} events`} 
                              size="small" 
                              variant="outlined"
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          </Box>
        )}

        {/* Legacy Thread View Tab */}
        {legacyThreadView && activeTab === 3 && (
          <Box sx={{ p: 3 }}>
            {legacyThreadView}
          </Box>
        )}
      </Paper>
    </ErrorBoundary>
  );
};

ThreadAnalysisSection.propTypes = {
  activeTab: PropTypes.number,
  onTabChange: PropTypes.func,
  coherenceMetrics: PropTypes.object,
  threadMaps: PropTypes.object,
  storyGaps: PropTypes.array,
  elevation: PropTypes.number,
  legacyThreadView: PropTypes.node,
  sx: PropTypes.object
};

export default ThreadAnalysisSection;