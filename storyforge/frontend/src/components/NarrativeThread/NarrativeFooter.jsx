/**
 * NarrativeFooter.jsx
 * Footer section with recommendations and quick action buttons
 * 
 * Extracted from NarrativeThreadTrackerPage.jsx for final component modularity.
 * Contains recommendations panel and quick action navigation buttons.
 */

import React from 'react';
import PropTypes from 'prop-types';
import {
  Paper,
  Typography,
  Grid,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Box
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import PeopleIcon from '@mui/icons-material/People';
import ExtensionIcon from '@mui/icons-material/Extension';
import MemoryIcon from '@mui/icons-material/Memory';
import TimelineIcon from '@mui/icons-material/Timeline';
import ErrorBoundary from '../ErrorBoundary';

const NarrativeFooter = ({ 
  recommendations = [],
  showRecommendations = false,
  sx = {}
}) => {
  return (
    <ErrorBoundary level="component">
      <Box sx={sx}>
        {/* Recommendations Panel */}
        {showRecommendations && recommendations.length > 0 && (
          <Accordion sx={{ mb: 3 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUpIcon color="info" />
                Story Enhancement Recommendations ({recommendations.length})
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              {recommendations.map((rec, index) => (
                <Alert 
                  key={index} 
                  severity="info"
                  sx={{ mb: 1 }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    {rec.message}
                  </Typography>
                  <Typography variant="caption">
                    {rec.action}
                  </Typography>
                </Alert>
              ))}
            </AccordionDetails>
          </Accordion>
        )}
        
        {/* Quick Actions */}
        <Paper sx={{ p: 3, mt: 3 }} elevation={2}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Story Development Tools
          </Typography>
          <Grid container spacing={2}>
            <Grid item>
              <Button 
                component={RouterLink} 
                to="/characters" 
                variant="outlined" 
                startIcon={<PeopleIcon />}
              >
                Character Development
              </Button>
            </Grid>
            <Grid item>
              <Button 
                component={RouterLink} 
                to="/elements" 
                variant="outlined" 
                startIcon={<MemoryIcon />}
              >
                Story Elements
              </Button>
            </Grid>
            <Grid item>
              <Button 
                component={RouterLink} 
                to="/puzzles" 
                variant="outlined" 
                startIcon={<ExtensionIcon />}
              >
                Puzzle Design
              </Button>
            </Grid>
            <Grid item>
              <Button 
                component={RouterLink} 
                to="/timeline" 
                variant="outlined" 
                startIcon={<TimelineIcon />}
              >
                Timeline Events
              </Button>
            </Grid>
            <Grid item>
              <Button 
                component={RouterLink} 
                to="/" 
                variant="contained" 
                startIcon={<AssessmentIcon />}
              >
                Production Dashboard
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </ErrorBoundary>
  );
};

NarrativeFooter.propTypes = {
  recommendations: PropTypes.arrayOf(PropTypes.shape({
    type: PropTypes.string,
    message: PropTypes.string.isRequired,
    action: PropTypes.string.isRequired
  })),
  showRecommendations: PropTypes.bool,
  sx: PropTypes.object
};

export default NarrativeFooter;