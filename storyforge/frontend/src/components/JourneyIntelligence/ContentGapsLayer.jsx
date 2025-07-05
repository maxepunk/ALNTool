/**
 * ContentGapsLayer - Entity-responsive content gap intelligence
 * 
 * Features:
 * - Element: Missing timeline connections, story integration gaps
 * - Character: Underdeveloped backstory, missing memory tokens, content opportunities
 * - Timeline Event: Missing revealing elements, evidence gaps
 * - Only renders when gaps layer active AND entity selected
 */

import React, { useMemo } from 'react';
import { Box, Typography, Paper, Stack, Alert, Chip } from '@mui/material';
import { ErrorOutline, Lightbulb, ContentPaste, CheckCircle } from '@mui/icons-material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';

const ContentGapsLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });
  
  // Element Gap Intelligence
  const getElementGapIntelligence = (element, allElements) => {
    // Find the full element data from our elements array or use what's provided
    const fullElement = allElements?.find(e => e.id === element.id) || element;
    
    const hasTimelineConnection = fullElement.timeline_event_id !== null && fullElement.timeline_event_id !== undefined;
    const contentCompleteness = fullElement.content_completeness || 'Unknown';
    const ownerCharacterId = fullElement.owner_character_id;
    
    const gaps = [];
    
    if (!hasTimelineConnection) {
      gaps.push({
        type: 'timeline',
        severity: 'high',
        message: 'No timeline event connection',
        suggestion: 'Consider creating a backstory event for when/how this element came to exist'
      });
    }
    
    if (contentCompleteness === 'Missing Story' || contentCompleteness === 'Unknown') {
      gaps.push({
        type: 'story',
        severity: 'medium',
        message: 'Element lacks story integration',
        suggestion: 'Create narrative context for this item\'s significance'
      });
    }
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
            Content Gaps Identified
          </Typography>
          
          {gaps.length > 0 ? (
            <Stack spacing={2}>
              {gaps.map((gap, index) => (
                <Alert 
                  key={index} 
                  severity={gap.severity === 'high' ? 'error' : 'warning'}
                  icon={<ErrorOutline />}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {gap.message}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {gap.suggestion}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          ) : (
            <Alert severity="success" icon={<CheckCircle />}>
              <Typography variant="body2">
                This element is well-integrated into the story
              </Typography>
            </Alert>
          )}
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Integration Opportunities
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {!hasTimelineConnection && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                <Lightbulb sx={{ color: 'warning.main', fontSize: 20, mt: 0.5 }} />
                <Typography variant="body2">
                  Add backstory about how {ownerCharacterId ? 'the owner' : 'someone'} acquired this item
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <Lightbulb sx={{ color: 'info.main', fontSize: 20, mt: 0.5 }} />
              <Typography variant="body2">
                Connect to character development or puzzle mechanics
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>
    );
  };

  // Character Gap Intelligence
  const getCharacterGapIntelligence = (character, allElements) => {
    // For testing, character data might be directly on selectedEntity
    const timelineEventCount = character.timeline_event_count || 0;
    const elementCount = character.element_count || 0;
    const contentStatus = character.content_status || 'Unknown';
    const missingContent = character.missing_content || [];
    
    const gaps = [];
    
    if (timelineEventCount === 0) {
      gaps.push({
        type: 'critical',
        severity: 'high',
        message: 'Character needs complete development',
        suggestion: 'Start with basic backstory, motivation, and relationships'
      });
    } else if (timelineEventCount < 3) {
      gaps.push({
        type: 'backstory',
        severity: 'medium',
        message: 'Minimal backstory content',
        suggestion: 'Add more timeline events to develop character history'
      });
    }
    
    if (elementCount === 0) {
      gaps.push({
        type: 'elements',
        severity: 'medium',
        message: 'No associated memory tokens',
        suggestion: 'Create elements that reveal character story'
      });
    }
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Content Development Status
          </Typography>
          <Chip 
            label={contentStatus}
            color={contentStatus === 'No Content Written' ? 'error' : contentStatus === 'Underdeveloped' ? 'warning' : 'success'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {gaps.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Content Gaps
            </Typography>
            <Stack spacing={2}>
              {gaps.map((gap, index) => (
                <Alert 
                  key={index} 
                  severity={gap.severity === 'high' ? 'error' : 'warning'}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {gap.message}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {gap.suggestion}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        {missingContent.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Missing Content Areas
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {missingContent.map((content, index) => (
                <Typography key={index} variant="body2">
                  • {content}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    );
  };

  // Timeline Event Gap Intelligence
  const getTimelineEventGapIntelligence = (timelineEvent, allElements) => {
    // For testing, timeline data might be directly on selectedEntity
    const revealingElements = timelineEvent.revealing_elements || [];
    const contentStatus = timelineEvent.content_status || 'Unknown';
    const suggestedElements = timelineEvent.suggested_elements || [];
    
    const gaps = [];
    
    if (revealingElements.length === 0) {
      gaps.push({
        type: 'evidence',
        severity: 'high',
        message: 'No revealing elements',
        suggestion: 'Create physical evidence or memory tokens that reveal this event'
      });
    }
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Content Status
          </Typography>
          <Chip 
            label={contentStatus}
            color={contentStatus === 'Missing Evidence' ? 'error' : contentStatus === 'Complete' ? 'success' : 'warning'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {gaps.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
              Evidence Gaps
            </Typography>
            <Stack spacing={2}>
              {gaps.map((gap, index) => (
                <Alert 
                  key={index} 
                  severity={gap.severity === 'high' ? 'error' : 'warning'}
                >
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    {gap.message}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {gap.suggestion}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        {suggestedElements.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Suggested Elements
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {suggestedElements.map((element, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Lightbulb sx={{ color: 'info.main', fontSize: 20 }} />
                  <Typography variant="body2">
                    {element}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    );
  };

  // Calculate gap intelligence based on entity type
  const gapIntelligence = useMemo(() => {
    if (!selectedEntity || !elements) return null;

    // Determine entity category for intelligence - check entityType first, then type
    const entityCategory = selectedEntity.entityType || selectedEntity.type || 'unknown';
    
    switch (entityCategory) {
      case 'element':
        return getElementGapIntelligence(selectedEntity, elements);
      case 'character':
        return getCharacterGapIntelligence(selectedEntity, elements);
      case 'timeline_event':
        return getTimelineEventGapIntelligence(selectedEntity, elements);
      default:
        return (
          <Typography variant="body1">
            Gap analysis placeholder
          </Typography>
        );
    }
  }, [selectedEntity, elements]);

  // Only render if gaps layer is active AND entity is selected
  if (!activeIntelligence.includes('gaps') || !selectedEntity) {
    return null;
  }

  if (isLoading) {
    return (
      <Box data-testid="gaps-overlay" sx={{ p: 2 }}>
        <Typography>Loading content gap analysis...</Typography>
      </Box>
    );
  }

  // Main render
  return (
    <Box 
      data-testid="gaps-overlay"
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
          <ContentPaste sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Content Gaps</Typography>
        </Box>
        
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          {selectedEntity?.name || 'Unknown Entity'}
        </Typography>

        {gapIntelligence}
      </Paper>
    </Box>
  );
};

export default ContentGapsLayer;