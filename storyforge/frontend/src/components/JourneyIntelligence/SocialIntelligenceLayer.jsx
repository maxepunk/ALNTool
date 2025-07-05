/**
 * SocialIntelligenceLayer - Entity-responsive social choreography intelligence
 * 
 * Features:
 * - Element: Access requirements, collaboration mapping, social complexity
 * - Character: Collaboration load, social requirements, balance analysis
 * - Puzzle: Required collaborators, social choreography, interaction design
 * - Only renders when social layer active AND entity selected
 */

import React, { useMemo } from 'react';
import { Box, Typography, Paper, Stack, Alert, Chip } from '@mui/material';
import { Groups, Warning, Person, Psychology } from '@mui/icons-material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';

const SocialIntelligenceLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });
  
  // Element Social Intelligence
  const getElementSocialIntelligence = (element, allElements) => {
    // Find the full element data from our elements array
    const fullElement = allElements?.find(e => e.id === element.id) || element;
    
    // In mock data, social_access_requirements is directly on element
    const accessRequirements = fullElement.social_access_requirements || [];
    const requiredForPuzzles = fullElement.required_for_puzzles || [];
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Access Requirements
          </Typography>
          {accessRequirements.length > 0 ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              {accessRequirements.map((req, index) => (
                <Typography key={index} variant="body2">
                  • {req}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2">
              No special access requirements
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Required Collaborations
          </Typography>
          {accessRequirements.some(req => req.includes('collaboration')) ? (
            <Typography variant="body2" color="warning.main">
              Multiple characters required
            </Typography>
          ) : (
            <Typography variant="body2">
              Direct access available
            </Typography>
          )}
        </Box>
      </Stack>
    );
  };

  // Character Social Intelligence
  const getCharacterSocialIntelligence = (character, allElements) => {
    // For testing, character data might be directly on selectedEntity
    // In production, we'd fetch from characterJourney API
    const collaborationCount = character.collaboration_count || 0;
    const socialLoad = character.social_load || 'Unknown';
    const personalityRequirements = character.personality_requirements || [];
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Collaboration Load
          </Typography>
          <Typography variant="body2" color={socialLoad === 'Overloaded' ? 'error' : 'text.primary'}>
            {collaborationCount} collaborations required
          </Typography>
          <Typography variant="body2" sx={{ color: socialLoad === 'Overloaded' ? 'warning.main' : 'text.secondary' }}>
            Status: {socialLoad}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Social Requirements
          </Typography>
          {personalityRequirements.length > 0 ? (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {personalityRequirements.map((req, index) => (
                <Typography key={index} variant="body2">
                  • {req}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2">
              No specific personality requirements
            </Typography>
          )}
        </Box>

        {socialLoad === 'Overloaded' && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2">
              Consider redistributing some collaborations to other characters
            </Typography>
          </Alert>
        )}
      </Stack>
    );
  };

  // Puzzle Social Intelligence
  const getPuzzleSocialIntelligence = (puzzle, allElements) => {
    // For testing, puzzle data might be directly on selectedEntity
    const requiredCollaborators = puzzle.required_collaborators || [];
    const socialComplexity = puzzle.social_complexity || 'Unknown';
    const collaborationType = puzzle.collaboration_type || 'Unknown';
    const requiredElements = puzzle.required_elements || [];
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Required Collaborators
          </Typography>
          {requiredCollaborators.length > 0 ? (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {requiredCollaborators.map((collab, index) => (
                <Typography key={index} variant="body2">
                  • {collab.replace('char-', '').replace(/-/g, ' ')}
                </Typography>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2">
              No specific collaborators required
            </Typography>
          )}
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Social Complexity
          </Typography>
          <Typography 
            variant="body2" 
            color={socialComplexity === 'High' ? 'warning.main' : 'text.primary'}
          >
            {socialComplexity} complexity - {collaborationType} collaboration
          </Typography>
        </Box>

        {requiredElements.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Required Elements
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {requiredElements.length} elements needed from different characters
            </Typography>
          </Box>
        )}
      </Stack>
    );
  };

  // Calculate social intelligence based on entity type
  const socialIntelligence = useMemo(() => {
    if (!selectedEntity || !elements) return null;

    // Determine entity category for intelligence - check entityType first, then type
    const entityCategory = selectedEntity.entityType || selectedEntity.type || 'unknown';
    
    switch (entityCategory) {
      case 'element':
        return getElementSocialIntelligence(selectedEntity, elements);
      case 'character':
        return getCharacterSocialIntelligence(selectedEntity, elements);
      case 'puzzle':
        return getPuzzleSocialIntelligence(selectedEntity, elements);
      default:
        return (
          <Typography variant="body1">
            Social analysis placeholder
          </Typography>
        );
    }
  }, [selectedEntity, elements]);

  // Only render if social layer is active AND entity is selected
  if (!activeIntelligence.includes('social') || !selectedEntity) {
    return null;
  }

  if (isLoading) {
    return (
      <Box data-testid="social-overlay" sx={{ p: 2 }}>
        <Typography>Loading social analysis...</Typography>
      </Box>
    );
  }

  // Main render
  return (
    <Box 
      data-testid="social-overlay"
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
          <Groups sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Social Intelligence</Typography>
        </Box>
        
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          {selectedEntity?.name || 'Unknown Entity'}
        </Typography>

        {socialIntelligence}
      </Paper>
    </Box>
  );
};

export default SocialIntelligenceLayer;