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
import { Box, Typography, Paper, Stack, Chip, Alert } from '@mui/material';
import { Book, Timeline, Event } from '@mui/icons-material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

// Element Story Intelligence
const getElementStoryIntelligence = (element, elements, timelineEvents) => {
  const elementData = elements.find(e => e.id === element.id);
  if (!elementData) return null;

  // Find connected timeline event from real data
  const timelineEvent = timelineEvents?.find(t => t.id === elementData.timeline_event_id);
  
  // Determine narrative importance based on element type and connections
  const narrativeImportance = elementData.narrative_thread || 
    (elementData.calculated_memory_value > 5000 ? 'High' : 'Medium');
  
  return (
    <Stack spacing={2}>
      {/* Timeline Connection or Gap Analysis */}
      {timelineEvent ? (
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Timeline Connection
          </Typography>
          <Typography variant="body2">
            {timelineEvent.description || timelineEvent.name}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            {timelineEvent.act_focus && (
              <Chip 
                label={timelineEvent.act_focus} 
                size="small" 
                color="primary"
              />
            )}
            {timelineEvent.narrative_importance && (
              <Chip 
                label={timelineEvent.narrative_importance} 
                size="small" 
                color={timelineEvent.narrative_importance === 'Critical' ? 'error' : 'default'}
              />
            )}
          </Stack>
        </Box>
      ) : (
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Story Integration
          </Typography>
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              No timeline connection - opportunity to develop backstory
            </Typography>
          </Alert>
        </Box>
      )}

      {/* Narrative Thread */}
      {elementData.narrative_thread && (
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Narrative Thread
          </Typography>
          <Typography variant="body2">
            {elementData.narrative_thread}
          </Typography>
        </Box>
      )}

      {/* Story Importance */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Story Importance
        </Typography>
        <Chip 
          label={narrativeImportance}
          color={narrativeImportance === 'High' ? 'error' : narrativeImportance === 'Medium' ? 'warning' : 'default'}
          size="small"
        />
      </Box>
    </Stack>
  );
};

// Character Story Intelligence  
const getCharacterStoryIntelligence = (character, elements, timelineEvents) => {
  // Find elements owned by this character
  const ownedElements = elements.filter(e => e.owner_character_id === character.id);
  
  // Find timeline events connected to character's elements
  const connectedTimelineEvents = timelineEvents?.filter(event => 
    ownedElements.some(elem => elem.timeline_event_id === event.id)
  ) || [];
  
  // Count elements with narrative threads
  const narrativeElements = ownedElements.filter(e => e.narrative_thread);
  
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Story Development
        </Typography>
        <Typography variant="body2">
          {ownedElements.length} elements revealing character story
        </Typography>
        {narrativeElements.length > 0 && (
          <Typography variant="body2" color="primary.main" sx={{ mt: 0.5 }}>
            {narrativeElements.length} with narrative threads
          </Typography>
        )}
      </Box>

      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Timeline Connections
        </Typography>
        {connectedTimelineEvents.length > 0 ? (
          <Stack spacing={1} sx={{ mt: 1 }}>
            {connectedTimelineEvents.slice(0, 3).map((event, index) => (
              <Box key={event.id}>
                <Typography variant="body2">
                  • {event.description || event.name}
                </Typography>
              </Box>
            ))}
            {connectedTimelineEvents.length > 3 && (
              <Typography variant="body2" color="text.secondary">
                ...and {connectedTimelineEvents.length - 3} more
              </Typography>
            )}
          </Stack>
        ) : (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2">
              No timeline connections found - character needs story development
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Narrative Threads Summary */}
      {narrativeElements.length > 0 && (
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Key Story Elements
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            {narrativeElements.slice(0, 2).map((elem) => (
              <Typography key={elem.id} variant="body2">
                • {elem.name}: {elem.narrative_thread}
              </Typography>
            ))}
          </Stack>
        </Box>
      )}
    </Stack>
  );
};

// Timeline Event Story Intelligence
const getTimelineEventStoryIntelligence = (timelineEvent, elements) => {
  // Find elements that reveal this timeline event
  const revealingElements = elements.filter(e => e.timeline_event_id === timelineEvent.id);
  
  // Group revealing elements by owner
  const elementsByOwner = revealingElements.reduce((acc, elem) => {
    const owner = elem.owner_character_id || 'unassigned';
    if (!acc[owner]) acc[owner] = [];
    acc[owner].push(elem);
    return acc;
  }, {});
  
  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Revealing Elements
        </Typography>
        {revealingElements.length > 0 ? (
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2">
              {revealingElements.length} elements reveal this event
            </Typography>
            {Object.entries(elementsByOwner).slice(0, 3).map(([owner, elems]) => (
              <Typography key={owner} variant="body2" color="text.secondary">
                • {owner === 'unassigned' ? 'Unassigned' : owner.replace('char-', '')}: {elems.length} items
              </Typography>
            ))}
          </Stack>
        ) : (
          <Alert severity="error" sx={{ mt: 1 }}>
            <Typography variant="body2">
              No elements reveal this event - critical content gap!
            </Typography>
          </Alert>
        )}
      </Box>

      {/* Story Arc Information */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Story Arc
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
          {timelineEvent.act_focus && (
            <Chip 
              label={timelineEvent.act_focus} 
              size="small" 
              color="primary"
            />
          )}
          {timelineEvent.narrative_importance && (
            <Chip 
              label={timelineEvent.narrative_importance} 
              size="small" 
              color={timelineEvent.narrative_importance === 'Critical' ? 'error' : 'warning'}
            />
          )}
        </Stack>
        {timelineEvent.narrative_thread && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            Thread: {timelineEvent.narrative_thread}
          </Typography>
        )}
      </Box>

      {/* Content Balance */}
      <Box>
        <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
          Content Balance
        </Typography>
        <Typography variant="body2">
          {revealingElements.length === 0 && 'Missing evidence - urgent!'}
          {revealingElements.length === 1 && 'Single point of discovery - risky'}
          {revealingElements.length >= 2 && revealingElements.length <= 3 && 'Good balance'}
          {revealingElements.length > 3 && 'Well documented'}
        </Typography>
      </Box>
    </Stack>
  );
};

const StoryIntelligenceLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading: elementsLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });
  
  // Fetch timeline events with React Query
  const { data: timelineResponse, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline-events'],
    queryFn: () => api.getTimelineEvents(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const timelineEvents = timelineResponse?.data || timelineResponse || [];
  const isLoading = elementsLoading || timelineLoading;
  
  // Get story intelligence based on selected entity type - MUST be before conditional returns
  const storyIntelligence = useMemo(() => {
    if (!selectedEntity || !elements) return null;

    // Determine entity category for intelligence - check entityType first, then type
    const entityCategory = selectedEntity.entityType || selectedEntity.type || 'unknown';
    
    switch (entityCategory) {
      case 'element':
        return getElementStoryIntelligence(selectedEntity, elements, timelineEvents);
      case 'character':
        return getCharacterStoryIntelligence(selectedEntity, elements, timelineEvents);
      case 'timeline_event':
        return getTimelineEventStoryIntelligence(selectedEntity, elements);
      case 'puzzle':
        return (
          <Stack spacing={2}>
            <Typography variant="body1">
              Puzzle story analysis would show narrative role and story integration
            </Typography>
          </Stack>
        );
      default:
        return (
          <Typography variant="body1">
            Story analysis for {entityCategory} not yet implemented
          </Typography>
        );
    }
  }, [selectedEntity, elements, timelineEvents]);

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