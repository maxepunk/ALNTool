/**
 * IntelligencePanel - Context-sensitive analysis panel
 * Shows entity-specific insights based on selected entity type
 * 
 * Features:
 * - Character analysis: Content gaps, social choreography, economic impact
 * - Element analysis: Timeline connections, accessibility, economic value
 * - Puzzle analysis: Social requirements, reward impact
 * - Timeline event analysis: Revealing elements, content balance
 */

import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Divider, 
  Chip,
  CircularProgress,
  Skeleton,
  Stack,
  Alert
} from '@mui/material';
import { 
  Person, 
  Extension, 
  Timeline, 
  Memory,
  Group,
  AttachMoney,
  Warning,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import logger from '../../utils/logger';

// Import our new data access hooks
import { usePerformanceElements } from '../../hooks/usePerformanceElements';
import { useFreshElements } from '../../hooks/useFreshElements';
import { getElementType } from '../../utils/elementFields';

const IntelligencePanel = ({ entity }) => {
  const [additionalData, setAdditionalData] = useState({
    timelineEvents: [],
    elements: [],
    puzzles: [],
    loading: true
  });

  // Fetch timeline events using direct API for now (can be optimized later)
  const { data: timelineEvents, isLoading: loadingTimeline } = useQuery({
    queryKey: ['timeline-events'],
    queryFn: async () => {
      const response = await api.getTimelineEvents();
      return response.data || [];
    },
    enabled: !!entity
  });

  // Use our new performance elements hook for elements data
  const { data: elements, isLoading: loadingElements } = usePerformanceElements({
    includeMemoryTokens: true,
    enabled: !!entity
  });

  // Fetch puzzles using direct API for now (can be optimized later)
  const { data: puzzles, isLoading: loadingPuzzles } = useQuery({
    queryKey: ['puzzles'],
    queryFn: async () => {
      const response = await api.getPuzzles();
      return response.data || [];
    },
    enabled: !!entity && entity.type === 'character'
  });

  const isLoading = loadingTimeline || loadingElements || (entity?.type === 'character' && loadingPuzzles);

  if (!entity) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Typography variant="body1" color="text.secondary">
          Select an entity to view detailed analysis
        </Typography>
      </Paper>
    );
  }

  // Render loading skeleton
  if (isLoading) {
    return (
      <Paper sx={{ p: 3, height: '100%' }}>
        <Skeleton variant="text" width="60%" height={32} />
        <Skeleton variant="text" width="40%" height={24} sx={{ mb: 2 }} />
        <Divider sx={{ mb: 2 }} />
        <Box data-testid="loading-skeleton">
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} />
        </Box>
      </Paper>
    );
  }

  // Entity-specific rendering
  const renderEntityAnalysis = () => {
    // Determine entity type - handle both generic types and specific element types
    const entityType = determineEntityType(entity);
    
    switch (entityType) {
      case 'character':
        return <CharacterAnalysis entity={entity} timelineEvents={timelineEvents} elements={elements} puzzles={puzzles} />;
      case 'element':
        return <ElementAnalysis entity={entity} timelineEvents={timelineEvents} elements={elements} />;
      case 'puzzle':
        return <PuzzleAnalysis entity={entity} elements={elements} />;
      case 'timeline_event':
        return <TimelineEventAnalysis entity={entity} elements={elements} />;
      default:
        return <Typography>Unknown entity type: {entity.type}</Typography>;
    }
  };
  
  // Helper function to determine entity type
  const determineEntityType = (entity) => {
    if (!entity) return 'unknown';
    
    // Check for entityCategory first (added by graph processing)
    if (entity.entityCategory) {
      return entity.entityCategory;
    }
    
    // Use the imported getElementType for consistent type detection
    const type = getElementType(entity);
    
    // Direct entity types
    if (['character', 'puzzle', 'timeline_event'].includes(type)) {
      return type;
    }
    
    // For elements, they have specific types like 'Memory Token Audio', 'Document', etc.
    // If it's not one of the main entity types, assume it's an element
    return 'element';
  };

  return (
    <Paper sx={{ p: 3, height: '100%', overflowY: 'auto' }}>
      {renderEntityAnalysis()}
    </Paper>
  );
};

// Character Analysis Component
const CharacterAnalysis = ({ entity, timelineEvents, elements, puzzles }) => {
  // Calculate content gaps
  const characterEvents = (timelineEvents || []).filter(event => {
    // Check if the event has a characters array and includes this character ID
    return event.characters && Array.isArray(event.characters) && event.characters.includes(entity.id);
  });
  // Elements are already transformed with owner_character_id by useTransformedElements
  const ownedElements = (elements || []).filter(elem => 
    elem.owner_character_id === entity.id
  );
  
  // Calculate memory token value
  const totalMemoryValue = ownedElements
    .filter(elem => elem.calculated_memory_value)
    .reduce((sum, elem) => sum + elem.calculated_memory_value, 0);

  // Check for content gaps
  const hasContentGap = characterEvents.length < 2 || ownedElements.length < 3;

  // Calculate social load (puzzles requiring collaboration)
  const collaborativePuzzles = (puzzles || []).filter(puzzle => {
    const requiredElements = puzzle.required_elements || [];
    // Check if any required elements belong to other characters
    return requiredElements.some(elemId => {
      const elem = elements?.find(e => e.id === elemId);
      return elem && elem.owner_character_id && elem.owner_character_id !== entity.id;
    });
  });

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>{entity.name}</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {entity.tier} Character
        </Typography>
        {entity.logline && (
          <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
            {entity.logline}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Content Analysis */}
      <Box data-testid="content-analysis" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ mr: 1 }} /> Content Analysis
        </Typography>
        
        <Stack spacing={2}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              Timeline Events: {characterEvents.length}
            </Typography>
            {hasContentGap && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                Content Gap: Needs more backstory
              </Alert>
            )}
          </Box>
          
          <Box>
            <Typography variant="body2" color="text.secondary">
              Owned Elements: {ownedElements.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Memory Token Value: ${totalMemoryValue.toLocaleString()}
            </Typography>
          </Box>

          {characterEvents.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No timeline events
            </Typography>
          )}
          {ownedElements.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No owned elements
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Social Analysis */}
      <Box data-testid="social-analysis" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Group sx={{ mr: 1 }} /> Social Choreography
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Social Load: {collaborativePuzzles.length} collaborative puzzles
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Required Collaborations: {collaborativePuzzles.length > 0 ? 'Yes' : 'None'}
          </Typography>
          
          {entity.resolutionPaths && (
            <Typography variant="body2" color="text.secondary">
              Path Access: {entity.resolutionPaths.join(', ')}
            </Typography>
          )}

          {collaborativePuzzles.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No collaborations required
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Economic Analysis */}
      <Box data-testid="economic-analysis" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AttachMoney sx={{ mr: 1 }} /> Economic Impact
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Economic Contribution
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Token Value: ${totalMemoryValue.toLocaleString()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Path Balance: {totalMemoryValue > 10000 ? 'High impact' : totalMemoryValue > 5000 ? 'Medium impact' : 'Low impact'}
          </Typography>
        </Stack>
      </Box>
    </>
  );
};

// Element Analysis Component
const ElementAnalysis = ({ entity, timelineEvents, elements }) => {
  // Find connected timeline event
  const connectedEvent = entity.timeline_event_id ? 
    timelineEvents?.find(event => event.id === entity.timeline_event_id) : null;

  // Find container element
  const containerElement = entity.container_element_id ?
    elements?.find(elem => elem.id === entity.container_element_id) : null;

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>{entity.name}</Typography>
        <Typography variant="subtitle1" color="text.secondary">
          {getElementType(entity)}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Story Integration */}
      <Box data-testid="story-integration" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ mr: 1 }} /> Story Integration
        </Typography>
        
        <Stack spacing={2}>
          {connectedEvent ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Timeline Event: {connectedEvent.description}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {connectedEvent.act_focus}
              </Typography>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No timeline connection
            </Typography>
          )}
        </Stack>
      </Box>

      {/* Accessibility Analysis */}
      <Box data-testid="accessibility-analysis" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Extension sx={{ mr: 1 }} /> Accessibility Analysis
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Owner: {entity.owner_character_id || 'None'}
          </Typography>
          
          {entity.container_element_id && (
            <Typography variant="body2" color="text.secondary">
              Container: {entity.container_element_id}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary">
            Access Requirements: {containerElement ? 'Container access needed' : 'Direct access'}
          </Typography>
        </Stack>
      </Box>

      {/* Economic Impact */}
      <Box data-testid="economic-impact" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AttachMoney sx={{ mr: 1 }} /> Economic Impact
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Memory Value: ${(entity.calculated_memory_value || 0).toLocaleString()}
          </Typography>
          
          {entity.rightful_owner && (
            <Typography variant="body2" color="text.secondary">
              Rightful Owner: {entity.rightful_owner}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary">
            Path Impact: {entity.calculated_memory_value > 5000 ? 'High value - creates choice pressure' : 'Standard value'}
          </Typography>
        </Stack>
      </Box>
    </>
  );
};

// Puzzle Analysis Component
const PuzzleAnalysis = ({ entity, elements }) => {
  const requiredElements = entity.required_elements || [];
  const rewardElements = entity.reward_ids || [];
  
  // Calculate total reward value
  const totalRewardValue = rewardElements.reduce((sum, rewardId) => {
    const elem = elements?.find(e => e.id === rewardId);
    return sum + (elem?.calculated_memory_value || 0);
  }, 0);

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>{entity.name}</Typography>
        <Typography variant="body2" sx={{ mt: 1 }}>
          {entity.description}
        </Typography>
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Social Choreography */}
      <Box data-testid="social-choreography" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Group sx={{ mr: 1 }} /> Social Choreography
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Required Elements: {requiredElements.length}
          </Typography>
          
          {requiredElements.map(elemId => (
            <Typography key={elemId} variant="body2" color="text.secondary">
              {elemId}
            </Typography>
          ))}
          
          <Typography variant="body2" color="text.secondary">
            Collaboration Required: {requiredElements.length > 1 ? 'Yes' : 'No'}
          </Typography>
        </Stack>
      </Box>

      {/* Reward Impact */}
      <Box data-testid="reward-impact" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Memory sx={{ mr: 1 }} /> Reward Impact
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Rewards: {rewardElements.length} elements
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Total Value: ${totalRewardValue.toLocaleString()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Path Balance Impact: {totalRewardValue > 10000 ? 'Major impact' : totalRewardValue > 5000 ? 'Moderate impact' : 'Low impact'}
          </Typography>
        </Stack>
      </Box>
    </>
  );
};

// Timeline Event Analysis Component
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

export default IntelligencePanel;