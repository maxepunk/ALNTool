/**
 * TimelineEventAnalysis - Analysis component for timeline event entities
 * Shows revealing elements and content balance
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Stack
} from '@mui/material';
import { 
  Timeline,
  Info
} from '@mui/icons-material';

const TimelineEventAnalysis = ({ entity, elements }) => {
  // Find revealing elements
  const revealingElements = (elements || []).filter(elem => 
    elem.timeline_event_id === entity.id
  );

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>{entity.name || 'Timeline Event'}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {entity.description}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Story Integration */}
      <Box data-testid="story-integration" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ mr: 1 }} /> Story Integration
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Revealing Elements: {revealingElements.length}
          </Typography>
          
          {revealingElements.length > 0 && revealingElements[0].name && (
            <Typography variant="body2" color="text.secondary">
              {revealingElements[0].name}
            </Typography>
          )}
          
          {entity.act_focus && (
            <Typography variant="body2" color="text.secondary">
              Act Focus: {entity.act_focus}
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Content Balance */}
      <Box data-testid="content-balance" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Info sx={{ mr: 1 }} /> Content Balance
        </Typography>
        
        <Stack spacing={2}>
          {entity.narrative_weight && (
            <Typography variant="body2" color="text.secondary">
              Narrative Weight: {entity.narrative_weight}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary">
            Discovery Paths: Multiple paths available
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Integration Opportunities: {revealingElements.length > 0 ? 'Well integrated' : 'Needs more revealing elements'}
          </Typography>
        </Stack>
      </Box>
    </>
  );
};

export default React.memo(TimelineEventAnalysis);