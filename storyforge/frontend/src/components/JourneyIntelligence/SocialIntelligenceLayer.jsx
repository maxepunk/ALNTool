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
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';

const SocialIntelligenceLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading: elementsLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });
  
  // Fetch puzzles data for social analysis
  const { data: puzzlesResponse, isLoading: puzzlesLoading } = useQuery({
    queryKey: ['puzzles'],
    queryFn: () => api.getPuzzles(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const puzzles = puzzlesResponse?.data || puzzlesResponse || [];
  const isLoading = elementsLoading || puzzlesLoading;
  
  // Element Social Intelligence
  const getElementSocialIntelligence = (element, allElements, allPuzzles) => {
    // Find the full element data from our elements array
    const fullElement = allElements?.find(e => e.id === element.id) || element;
    
    // Find puzzles that require this element
    const requiredForPuzzles = allPuzzles.filter(puzzle => {
      // Check if this element is in puzzle's required_elements array
      return puzzle.required_elements?.includes(fullElement.id) ||
             puzzle.required_elements?.includes(fullElement.name);
    });
    
    // Determine access complexity based on owner and puzzle requirements
    const ownerCharacterId = fullElement.owner_character_id;
    const isSharedResource = requiredForPuzzles.length > 1;
    const requiresCollaboration = requiredForPuzzles.some(p => 
      p.required_collaborators?.length > 1 || 
      p.social_complexity === 'High'
    );
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Social Access Pattern
          </Typography>
          {ownerCharacterId ? (
            <Typography variant="body2">
              Owned by {ownerCharacterId.replace('char-', '').replace(/-/g, ' ')}
            </Typography>
          ) : (
            <Typography variant="body2" color="warning.main">
              No clear owner - may cause confusion
            </Typography>
          )}
        </Box>

        {requiredForPuzzles.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Required for Puzzles
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {requiredForPuzzles.map((puzzle) => (
                <Alert 
                  key={puzzle.id} 
                  severity={puzzle.social_complexity === 'High' ? 'warning' : 'info'}
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="body2">
                    {puzzle.name || 'Unnamed puzzle'}
                    {puzzle.required_collaborators?.length > 1 && 
                      ` (${puzzle.required_collaborators.length} players)`
                    }
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Collaboration Requirements
          </Typography>
          {requiresCollaboration ? (
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2">
                Forces player interaction - good for social dynamics
              </Typography>
            </Alert>
          ) : (
            <Typography variant="body2">
              Can be accessed independently
            </Typography>
          )}
        </Box>

        {isSharedResource && (
          <Alert severity="info" sx={{ mt: 1 }}>
            <Typography variant="body2">
              Shared resource - creates natural collaboration point
            </Typography>
          </Alert>
        )}
      </Stack>
    );
  };

  // Character Social Intelligence
  const getCharacterSocialIntelligence = (character, allElements, allPuzzles) => {
    // Find elements owned by this character
    const ownedElements = allElements.filter(e => e.owner_character_id === character.id);
    
    // Find puzzles where this character is a required collaborator
    const requiredForPuzzles = allPuzzles.filter(puzzle => 
      puzzle.required_collaborators?.includes(character.id)
    );
    
    // Find puzzles that need elements from this character
    const puzzlesNeedingMyElements = allPuzzles.filter(puzzle => {
      const requiredElems = puzzle.required_elements || [];
      return requiredElems.some(elemId => 
        ownedElements.some(owned => owned.id === elemId || owned.name === elemId)
      );
    });
    
    // Calculate social load
    const directCollaborations = requiredForPuzzles.length;
    const indirectCollaborations = puzzlesNeedingMyElements.length;
    const totalCollaborations = directCollaborations + indirectCollaborations;
    
    const socialLoad = totalCollaborations > 5 ? 'Overloaded' : 
                      totalCollaborations > 3 ? 'High' : 
                      totalCollaborations > 0 ? 'Balanced' : 'Low';
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Collaboration Load
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Direct collaborations: {directCollaborations}
            </Typography>
            <Typography variant="body2">
              Element-based interactions: {indirectCollaborations}
            </Typography>
            <Chip 
              label={`Total: ${totalCollaborations} - ${socialLoad}`}
              color={socialLoad === 'Overloaded' ? 'error' : socialLoad === 'High' ? 'warning' : 'success'}
              size="small"
              sx={{ mt: 1, width: 'fit-content' }}
            />
          </Stack>
        </Box>

        {ownedElements.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Social Resources
            </Typography>
            <Typography variant="body2">
              {ownedElements.length} elements can be traded/shared
            </Typography>
            {ownedElements.filter(e => e.calculated_memory_value > 5000).length > 0 && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                High-value items create negotiation dynamics
              </Typography>
            )}
          </Box>
        )}

        {requiredForPuzzles.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Required Collaborations
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {requiredForPuzzles.slice(0, 3).map((puzzle) => (
                <Typography key={puzzle.id} variant="body2">
                  • {puzzle.name || 'Unnamed puzzle'}
                </Typography>
              ))}
              {requiredForPuzzles.length > 3 && (
                <Typography variant="body2" color="text.secondary">
                  ...and {requiredForPuzzles.length - 3} more
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {socialLoad === 'Overloaded' && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            <Typography variant="body2">
              This character is central to many puzzles - consider redistributing some dependencies
            </Typography>
          </Alert>
        )}
      </Stack>
    );
  };

  // Puzzle Social Intelligence
  const getPuzzleSocialIntelligence = (puzzle, allElements, allPuzzles) => {
    const requiredCollaborators = puzzle.required_collaborators || [];
    const requiredElements = puzzle.required_elements || [];
    
    // Find which characters own the required elements
    const elementOwners = new Set();
    requiredElements.forEach(elemId => {
      const element = allElements.find(e => e.id === elemId || e.name === elemId);
      if (element?.owner_character_id) {
        elementOwners.add(element.owner_character_id);
      }
    });
    
    // Calculate social complexity
    const totalPlayersNeeded = Math.max(requiredCollaborators.length, elementOwners.size);
    const socialComplexity = totalPlayersNeeded >= 4 ? 'High' : 
                           totalPlayersNeeded >= 2 ? 'Medium' : 'Low';
    
    // Determine collaboration type
    const collaborationType = requiredElements.length > 0 && requiredCollaborators.length > 0 ? 'Mixed' :
                            requiredElements.length > 0 ? 'Element Exchange' :
                            requiredCollaborators.length > 0 ? 'Direct Collaboration' : 'Solo';
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Social Choreography
          </Typography>
          <Chip 
            label={`${socialComplexity} complexity - ${collaborationType}`}
            color={socialComplexity === 'High' ? 'error' : socialComplexity === 'Medium' ? 'warning' : 'success'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {requiredCollaborators.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Required Players
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {requiredCollaborators.map((collab, index) => (
                <Typography key={index} variant="body2">
                  • {collab.replace('char-', '').replace(/-/g, ' ')}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {elementOwners.size > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Element Dependencies
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Typography variant="body2">
                Need items from {elementOwners.size} character{elementOwners.size > 1 ? 's' : ''}
              </Typography>
              {Array.from(elementOwners).slice(0, 3).map((owner, index) => (
                <Typography key={index} variant="body2" color="text.secondary">
                  • {owner.replace('char-', '').replace(/-/g, ' ')}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}

        {/* Social Design Analysis */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Interaction Design
          </Typography>
          {totalPlayersNeeded === 0 ? (
            <Alert severity="info" sx={{ mt: 1 }}>
              <Typography variant="body2">
                Solo puzzle - consider adding social elements
              </Typography>
            </Alert>
          ) : totalPlayersNeeded === 1 ? (
            <Typography variant="body2">
              Simple exchange - minimal social friction
            </Typography>
          ) : totalPlayersNeeded >= 4 ? (
            <Alert severity="warning" sx={{ mt: 1 }}>
              <Typography variant="body2">
                Complex multi-party negotiation - high coordination needed
              </Typography>
            </Alert>
          ) : (
            <Typography variant="body2">
              Good balance - promotes interaction without overwhelming
            </Typography>
          )}
        </Box>

        {puzzle.reward_elements?.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Social Payoff
            </Typography>
            <Typography variant="body2">
              Rewards {puzzle.reward_elements.length} element{puzzle.reward_elements.length > 1 ? 's' : ''} - 
              {puzzle.reward_elements.length > 1 ? ' distributable rewards encourage cooperation' : ' single reward may cause competition'}
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
        return getElementSocialIntelligence(selectedEntity, elements, puzzles);
      case 'character':
        return getCharacterSocialIntelligence(selectedEntity, elements, puzzles);
      case 'puzzle':
        return getPuzzleSocialIntelligence(selectedEntity, elements, puzzles);
      case 'timeline_event':
        return (
          <Stack spacing={2}>
            <Typography variant="body1">
              Timeline events drive social discovery through evidence sharing
            </Typography>
          </Stack>
        );
      default:
        return (
          <Typography variant="body1">
            Social analysis for {entityCategory} not yet implemented
          </Typography>
        );
    }
  }, [selectedEntity, elements, puzzles]);

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