/**
 * CharacterAnalysis - Analysis component for character entities
 * Shows content gaps, social choreography, and economic impact
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Stack,
  Alert
} from '@mui/material';
import { 
  Timeline, 
  Group,
  AttachMoney
} from '@mui/icons-material';

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

export default React.memo(CharacterAnalysis);