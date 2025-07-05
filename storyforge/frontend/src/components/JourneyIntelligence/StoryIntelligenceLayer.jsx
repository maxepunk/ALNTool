/**
 * StoryIntelligenceLayer - Entity-responsive story intelligence
 * 
 * Features:
 * - Element: Timeline connections, narrative importance, story integration
 * - Character: Story development analysis, content gaps, narrative role  
 * - Timeline Event: Revealing elements, story arc analysis, content balance
 * - Only renders when story layer active AND entity selected
 */

import React, { useMemo } from 'react';
import { Box, Typography, Paper, Stack } from '@mui/material';
import { Book } from '@mui/icons-material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';

// Mock timeline events data for now
const mockTimelineEvents = [
  {
    id: 'timeline-affair',
    description: 'Marcus and Victoria\'s affair',
    act_focus: 'Act 1',
    narrative_importance: 'Critical'
  }
];

// Element Story Intelligence
const getElementStoryIntelligence = (element, elements) => {
  const elementData = elements.find(e => e.id === element.id);
  if (!elementData) return null;

  // Find connected timeline event (mock data for now)
  const timelineEvent = mockTimelineEvents.find(t => t.id === elementData.timeline_event_id);
  
  return (
    <Stack spacing={2}>
      {/* Timeline Connection or Gap Analysis */}
      {timelineEvent ? (
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Timeline Connection
          </Typography>
          <Typography variant="body2">
            {timelineEvent.description}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {timelineEvent.act_focus} - {timelineEvent.narrative_importance}
          </Typography>
        </Box>
      ) : (
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Content Opportunities
          </Typography>
          <Typography variant="body2">
            No timeline connection - opportunity to develop backstory
          </Typography>
        </Box>
      )}

      {/* Story Importance */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Story Importance
        </Typography>
        <Typography variant="body2">
          Critical
        </Typography>
      </Box>
    </Stack>
  );
};

// Character Story Intelligence  
const getCharacterStoryIntelligence = (character, elements) => {
  // Mock character story analysis
  const timelineEventCount = 2; // Mock count
  
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Story Development
        </Typography>
        <Typography variant="body2">
          Character has rich narrative foundation
        </Typography>
      </Box>

      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Timeline Events
        </Typography>
        <Typography variant="body2">
          Connected to {timelineEventCount} timeline events
        </Typography>
      </Box>
    </Stack>
  );
};

// Timeline Event Story Intelligence
const getTimelineEventStoryIntelligence = (timelineEvent, elements) => {
  // Find the timeline event in our mock data
  const eventData = mockTimelineEvents.find(t => t.id === timelineEvent.id);
  
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Revealing Elements
        </Typography>
        <Typography variant="body2">
          2 elements reveal this timeline event
        </Typography>
      </Box>

      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Story Arc
        </Typography>
        <Typography variant="body2">
          Critical narrative moment in {eventData?.act_focus || 'Act 1'}
        </Typography>
      </Box>
    </Stack>
  );
};

const StoryIntelligenceLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });
  
  // Get story intelligence based on selected entity type - MUST be before conditional returns
  const storyIntelligence = useMemo(() => {
    if (!selectedEntity || !elements) return null;

    // Determine entity category for intelligence - check entityType first, then type
    const entityCategory = selectedEntity.entityType || selectedEntity.type || 'unknown';
    
    switch (entityCategory) {
      case 'element':
        return getElementStoryIntelligence(selectedEntity, elements);
      case 'character':
        return getCharacterStoryIntelligence(selectedEntity, elements);
      case 'timeline_event':
        return getTimelineEventStoryIntelligence(selectedEntity, elements);
      default:
        return (
          <Typography variant="body1">
            Story analysis for {entityCategory} not yet implemented
          </Typography>
        );
    }
  }, [selectedEntity, elements]);

  // Only render if story layer is active AND entity is selected
  if (!activeIntelligence.includes('story') || !selectedEntity) {
    return null;
  }

  if (isLoading) {
    return (
      <Box data-testid="story-overlay" sx={{ p: 2 }}>
        <Typography>Loading story analysis...</Typography>
      </Box>
    );
  }

  if (!storyIntelligence) {
    return null;
  }

  return (
    <Box 
      data-testid="story-overlay"
      sx={{
        position: 'fixed',
        top: 80,
        right: 20,
        width: 350,
        maxHeight: '70vh',
        overflowY: 'auto',
        zIndex: 1100,
        pointerEvents: 'auto'
      }}
    >
      <Paper elevation={4} sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Book sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Story Intelligence</Typography>
        </Box>
        
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          {selectedEntity?.name || 'Unknown Entity'}
        </Typography>

        {storyIntelligence}
      </Paper>
    </Box>
  );
};

export default StoryIntelligenceLayer;