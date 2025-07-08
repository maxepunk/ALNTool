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
import { ErrorOutline, Lightbulb, ContentPaste, CheckCircle, Warning } from '@mui/icons-material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

const ContentGapsLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading: elementsLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });
  
  // Fetch timeline events for gap analysis
  const { data: timelineResponse, isLoading: timelineLoading } = useQuery({
    queryKey: ['timeline-events'],
    queryFn: () => api.getTimelineEvents(),
    staleTime: 5 * 60 * 1000,
  });
  
  // Fetch puzzles for completeness analysis
  const { data: puzzlesResponse, isLoading: puzzlesLoading } = useQuery({
    queryKey: ['puzzles'],
    queryFn: () => api.getPuzzles(),
    staleTime: 5 * 60 * 1000,
  });
  
  const timelineEvents = timelineResponse?.data || timelineResponse || [];
  const puzzles = puzzlesResponse?.data || puzzlesResponse || [];
  const isLoading = elementsLoading || timelineLoading || puzzlesLoading;
  
  // Element Gap Intelligence
  const getElementGapIntelligence = (element, allElements, allTimelineEvents, allPuzzles) => {
    // Find the full element data from our elements array or use what's provided
    const fullElement = allElements?.find(e => e.id === element.id) || element;
    
    const hasTimelineConnection = fullElement.timeline_event_id !== null && fullElement.timeline_event_id !== undefined;
    const hasNarrativeThread = fullElement.narrative_thread !== null && fullElement.narrative_thread !== undefined;
    const ownerCharacterId = fullElement.owner_character_id;
    const memoryType = fullElement.memory_type || fullElement.SF_MemoryType;
    
    // Find puzzles that use this element
    const usedInPuzzles = allPuzzles.filter(p => 
      p.required_elements?.includes(fullElement.id) ||
      p.required_elements?.includes(fullElement.name) ||
      p.reward_elements?.includes(fullElement.id)
    );
    
    const gaps = [];
    
    if (!hasTimelineConnection) {
      gaps.push({
        type: 'timeline',
        severity: 'high',
        message: 'No timeline event connection',
        suggestion: 'Link to a backstory event showing when/how this element came to exist'
      });
    }
    
    if (!hasNarrativeThread) {
      gaps.push({
        type: 'story',
        severity: 'medium',
        message: 'Missing narrative thread',
        suggestion: 'Add story context explaining this item\'s significance'
      });
    }
    
    if (!ownerCharacterId && usedInPuzzles.length === 0) {
      gaps.push({
        type: 'integration',
        severity: 'high',
        message: 'Orphaned element - no owner or puzzle use',
        suggestion: 'Assign to a character or integrate into a puzzle'
      });
    }
    
    if (memoryType && !hasTimelineConnection) {
      gaps.push({
        type: 'memory',
        severity: 'high',
        message: `${memoryType} memory token lacks story connection`,
        suggestion: 'Memory tokens should reveal specific timeline events'
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

        {/* Integration Status */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Integration Status
          </Typography>
          <Stack spacing={1} sx={{ mt: 1 }}>
            {ownerCharacterId && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="body2">
                  Owned by {ownerCharacterId.replace('char-', '').replace(/-/g, ' ')}
                </Typography>
              </Box>
            )}
            {usedInPuzzles.length > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="body2">
                  Used in {usedInPuzzles.length} puzzle{usedInPuzzles.length > 1 ? 's' : ''}
                </Typography>
              </Box>
            )}
            {hasTimelineConnection && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="body2">
                  Connected to timeline event
                </Typography>
              </Box>
            )}
          </Stack>
        </Box>
      </Stack>
    );
  };

  // Character Gap Intelligence
  const getCharacterGapIntelligence = (character, allElements, allTimelineEvents, allPuzzles) => {
    // Find elements owned by this character
    const ownedElements = allElements.filter(e => e.owner_character_id === character.id);
    
    // Find timeline events connected to character's elements
    const connectedTimelineEvents = allTimelineEvents.filter(event =>
      ownedElements.some(elem => elem.timeline_event_id === event.id)
    );
    
    // Find puzzles involving this character
    const involvedPuzzles = allPuzzles.filter(p => 
      p.required_collaborators?.includes(character.id) ||
      p.required_elements?.some(elemId => 
        ownedElements.some(owned => owned.id === elemId || owned.name === elemId)
      )
    );
    
    // Calculate content completeness
    const hasBackstory = connectedTimelineEvents.length > 0;
    const hasElements = ownedElements.length > 0;
    const hasPuzzleRole = involvedPuzzles.length > 0;
    const hasNarrativeElements = ownedElements.filter(e => e.narrative_thread).length > 0;
    
    const gaps = [];
    
    if (!hasBackstory) {
      gaps.push({
        type: 'critical',
        severity: 'high',
        message: 'No backstory events',
        suggestion: 'Create timeline events showing character history and motivations'
      });
    } else if (connectedTimelineEvents.length < 2) {
      gaps.push({
        type: 'backstory',
        severity: 'medium',
        message: 'Minimal backstory content',
        suggestion: 'Add more timeline events to fully develop character arc'
      });
    }
    
    if (!hasElements) {
      gaps.push({
        type: 'elements',
        severity: 'high',
        message: 'No owned elements',
        suggestion: 'Assign memory tokens or props to reveal character story'
      });
    } else if (!hasNarrativeElements) {
      gaps.push({
        type: 'narrative',
        severity: 'medium',
        message: 'Elements lack narrative threads',
        suggestion: 'Add story context to owned elements'
      });
    }
    
    if (!hasPuzzleRole) {
      gaps.push({
        type: 'gameplay',
        severity: 'medium',
        message: 'Not integrated into puzzles',
        suggestion: 'Include character in puzzle mechanics or collaborations'
      });
    }
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Content Development Status
          </Typography>
          <Chip 
            label={gaps.length === 0 ? 'Well Developed' : gaps.some(g => g.severity === 'high') ? 'Needs Development' : 'Partially Developed'}
            color={gaps.length === 0 ? 'success' : gaps.some(g => g.severity === 'high') ? 'error' : 'warning'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {gaps.length > 0 ? (
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
        ) : (
          <Alert severity="success">
            <Typography variant="body2">
              Character is well integrated into the story
            </Typography>
          </Alert>
        )}

        {/* Content Summary */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Current Content
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="body2">
              • Elements: {ownedElements.length} {hasNarrativeElements && `(${ownedElements.filter(e => e.narrative_thread).length} with stories)`}
            </Typography>
            <Typography variant="body2">
              • Timeline events: {connectedTimelineEvents.length}
            </Typography>
            <Typography variant="body2">
              • Puzzle involvement: {involvedPuzzles.length}
            </Typography>
          </Stack>
        </Box>
      </Stack>
    );
  };

  // Timeline Event Gap Intelligence
  const getTimelineEventGapIntelligence = (timelineEvent, allElements) => {
    // Find elements that reveal this timeline event
    const revealingElements = allElements.filter(e => e.timeline_event_id === timelineEvent.id);
    
    // Group by character ownership
    const elementsByOwner = revealingElements.reduce((acc, elem) => {
      const owner = elem.owner_character_id || 'unassigned';
      if (!acc[owner]) acc[owner] = { count: 0, hasNarrative: 0 };
      acc[owner].count++;
      if (elem.narrative_thread) acc[owner].hasNarrative++;
      return acc;
    }, {});
    
    const gaps = [];
    
    if (revealingElements.length === 0) {
      gaps.push({
        type: 'evidence',
        severity: 'high',
        message: 'No revealing elements',
        suggestion: 'Create physical evidence or memory tokens that reveal this event'
      });
    } else if (revealingElements.length === 1) {
      gaps.push({
        type: 'evidence',
        severity: 'medium',
        message: 'Single point of discovery',
        suggestion: 'Add more evidence to ensure players can discover this event'
      });
    }
    
    // Check distribution across characters
    const ownersCount = Object.keys(elementsByOwner).filter(o => o !== 'unassigned').length;
    if (revealingElements.length > 0 && ownersCount === 0) {
      gaps.push({
        type: 'distribution',
        severity: 'high',
        message: 'All evidence is unassigned',
        suggestion: 'Distribute evidence across multiple characters'
      });
    } else if (ownersCount === 1 && revealingElements.length > 2) {
      gaps.push({
        type: 'distribution',
        severity: 'medium',
        message: 'All evidence on single character',
        suggestion: 'Spread evidence across multiple characters for better discovery'
      });
    }
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Evidence Status
          </Typography>
          <Chip 
            label={
              revealingElements.length === 0 ? 'Missing Evidence' : 
              revealingElements.length === 1 ? 'Minimal Evidence' :
              gaps.length === 0 ? 'Well Documented' : 'Has Issues'
            }
            color={
              revealingElements.length === 0 ? 'error' : 
              gaps.length === 0 ? 'success' : 'warning'
            }
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {gaps.length > 0 ? (
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
        ) : (
          <Alert severity="success">
            <Typography variant="body2">
              Event is well documented with discoverable evidence
            </Typography>
          </Alert>
        )}

        {/* Evidence Distribution */}
        {revealingElements.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Evidence Distribution
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              <Typography variant="body2">
                Total evidence: {revealingElements.length} element{revealingElements.length > 1 ? 's' : ''}
              </Typography>
              {Object.entries(elementsByOwner).map(([owner, data]) => (
                <Typography key={owner} variant="body2" color="text.secondary">
                  • {owner === 'unassigned' ? 'Unassigned' : owner.replace('char-', '').replace(/-/g, ' ')}: 
                  {' '}{data.count} item{data.count > 1 ? 's' : ''}
                  {data.hasNarrative > 0 && ` (${data.hasNarrative} with narrative)`}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {/* Discovery Suggestions */}
        {revealingElements.length < 3 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Suggested Evidence Types
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {revealingElements.length === 0 && (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lightbulb sx={{ color: 'info.main', fontSize: 20 }} />
                    <Typography variant="body2">
                      Photo or video memory token
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Lightbulb sx={{ color: 'info.main', fontSize: 20 }} />
                    <Typography variant="body2">
                      Document or correspondence
                    </Typography>
                  </Box>
                </>
              )}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Lightbulb sx={{ color: 'info.main', fontSize: 20 }} />
                <Typography variant="body2">
                  Personal item with emotional connection
                </Typography>
              </Box>
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
        return getElementGapIntelligence(selectedEntity, elements, timelineEvents, puzzles);
      case 'character':
        return getCharacterGapIntelligence(selectedEntity, elements, timelineEvents, puzzles);
      case 'timeline_event':
        return getTimelineEventGapIntelligence(selectedEntity, elements);
      case 'puzzle':
        return (
          <Stack spacing={2}>
            <Typography variant="body1">
              Puzzle gap analysis would show missing requirements and rewards
            </Typography>
          </Stack>
        );
      default:
        return (
          <Typography variant="body1">
            Gap analysis for {entityCategory} not yet implemented
          </Typography>
        );
    }
  }, [selectedEntity, elements, timelineEvents, puzzles]);

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