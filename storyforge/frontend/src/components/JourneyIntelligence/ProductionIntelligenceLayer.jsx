/**
 * ProductionIntelligenceLayer - Entity-responsive production reality intelligence
 * 
 * Features:
 * - Element: Physical prop status, RFID tracking, container location
 * - Character: Props required, missing items, production notes
 * - Puzzle: Physical setup requirements, critical dependencies, timing
 * - Only renders when production layer active AND entity selected
 */

import React, { useMemo } from 'react';
import { Box, Typography, Paper, Stack, Alert, Chip } from '@mui/material';
import { Build, Warning, CheckCircle, Cancel, Memory } from '@mui/icons-material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { getRFIDTag, getProductionStatus, isMemoryToken, getElementValue } from '../../utils/elementFields';

const ProductionIntelligenceLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading: elementsLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });

  // Fetch puzzles for production dependencies
  const { data: puzzlesResponse, isLoading: puzzlesLoading } = useQuery({
    queryKey: ['puzzles'],
    queryFn: () => api.getPuzzles(),
    staleTime: 5 * 60 * 1000,
  });
  
  const puzzles = puzzlesResponse?.data || puzzlesResponse || [];
  const isLoading = elementsLoading || puzzlesLoading;
  
  // Only render if production layer is active AND entity is selected
  if (!activeIntelligence.includes('production') || !selectedEntity) {
    return null;
  }

  // Element Production Intelligence
  const getElementProductionIntelligence = (element, allElements, allPuzzles) => {
    // Find the full element data from our elements array or use what's provided
    const fullElement = allElements?.find(e => e.id === element.id) || element;
    
    // Use utility functions for consistent field access
    const rfidTag = getRFIDTag(fullElement);
    const productionStatus = getProductionStatus(fullElement);
    const isMemToken = isMemoryToken(fullElement);
    const memoryValue = getElementValue(fullElement);
    
    // Find puzzles that require this element
    const requiredForPuzzles = allPuzzles.filter(p => 
      p.required_elements?.includes(fullElement.id) ||
      p.required_elements?.includes(fullElement.name)
    );
    
    // Determine criticality
    const isCritical = isMemToken && !rfidTag && memoryValue > 0;
    const container = fullElement.container || fullElement.location || 'Not specified';
    
    return (
      <Stack spacing={2}>
        {/* Element Type & Status */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Production Status
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Chip 
              label={productionStatus}
              color={productionStatus === 'Ready' ? 'success' : 
                     productionStatus === 'In Development' ? 'warning' : 'default'}
              size="small"
            />
            {isMemToken && (
              <Chip 
                label="Memory Token"
                icon={<Memory />}
                size="small"
                color="primary"
              />
            )}
          </Stack>
        </Box>

        {/* RFID Status for Memory Tokens */}
        {isMemToken && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              RFID Tracking
            </Typography>
            {rfidTag ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                <Typography variant="body2">{rfidTag}</Typography>
              </Box>
            ) : (
              <Alert severity={isCritical ? 'error' : 'warning'} sx={{ mt: 1 }}>
                <Typography variant="body2">
                  {isCritical ? 'CRITICAL: ' : ''}No RFID tag assigned
                  {memoryValue > 0 && ` - $${memoryValue} token`}
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Location/Container */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Physical Location
          </Typography>
          <Typography variant="body2">
            {container}
          </Typography>
          {container === 'Not specified' && requiredForPuzzles.length > 0 && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
              Location needed - required for {requiredForPuzzles.length} puzzle{requiredForPuzzles.length > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        {/* Puzzle Dependencies */}
        {requiredForPuzzles.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Critical for Puzzles
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {requiredForPuzzles.map(puzzle => (
                <Alert key={puzzle.id} severity="info" sx={{ py: 0.5 }}>
                  <Typography variant="body2">
                    {puzzle.name || 'Unnamed puzzle'}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        {/* Critical Warning */}
        {isCritical && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <Typography variant="body2">
              Memory token without RFID - blocks revelation scene!
            </Typography>
          </Alert>
        )}
      </Stack>
    );
  };

  // Puzzle Production Intelligence
  const getPuzzleProductionIntelligence = (puzzle, allElements) => {
    // Get required elements and check their production status
    const requiredElements = puzzle.required_elements || [];
    const requiredElementDetails = requiredElements.map(elemId => {
      const elem = allElements.find(e => e.id === elemId || e.name === elemId);
      return {
        id: elemId,
        element: elem,
        hasRFID: elem ? getRFIDTag(elem) : false,
        isMemToken: elem ? isMemoryToken(elem) : false,
        status: elem ? getProductionStatus(elem) : 'Missing',
        owner: elem?.owner_character_id
      };
    });
    
    // Calculate production readiness
    const missingElements = requiredElementDetails.filter(d => !d.element);
    const missingRFID = requiredElementDetails.filter(d => d.isMemToken && !d.hasRFID);
    const notReady = requiredElementDetails.filter(d => d.status !== 'Ready');
    
    const productionComplexity = requiredElements.length > 5 ? 'High' :
                                requiredElements.length > 2 ? 'Medium' : 'Low';
    
    const isProductionReady = missingElements.length === 0 && missingRFID.length === 0;
    
    return (
      <Stack spacing={2}>
        {/* Overall Status */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Production Readiness
          </Typography>
          <Chip 
            label={isProductionReady ? 'Ready' : 'Not Ready'}
            color={isProductionReady ? 'success' : 'error'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Required Elements Status */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Physical Elements Required
          </Typography>
          <Typography variant="body2">
            {requiredElements.length} elements needed
          </Typography>
          {requiredElementDetails.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {requiredElementDetails.slice(0, 5).map((detail, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {detail.element ? (
                    <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                  ) : (
                    <Cancel sx={{ color: 'error.main', fontSize: 16 }} />
                  )}
                  <Typography variant="body2">
                    {detail.element?.name || detail.id}
                    {detail.isMemToken && !detail.hasRFID && ' (needs RFID)'}
                  </Typography>
                </Box>
              ))}
              {requiredElementDetails.length > 5 && (
                <Typography variant="body2" color="text.secondary">
                  ...and {requiredElementDetails.length - 5} more
                </Typography>
              )}
            </Stack>
          )}
        </Box>

        {/* Production Issues */}
        {(missingElements.length > 0 || missingRFID.length > 0) && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Production Blockers
            </Typography>
            <Stack spacing={1} sx={{ mt: 1 }}>
              {missingElements.length > 0 && (
                <Alert severity="error">
                  <Typography variant="body2">
                    {missingElements.length} elements not found in database
                  </Typography>
                </Alert>
              )}
              {missingRFID.length > 0 && (
                <Alert severity="warning">
                  <Typography variant="body2">
                    {missingRFID.length} memory tokens need RFID tags
                  </Typography>
                </Alert>
              )}
            </Stack>
          </Box>
        )}

        {/* Complexity Rating */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Setup Complexity
          </Typography>
          <Chip 
            label={productionComplexity}
            color={productionComplexity === 'High' ? 'warning' : productionComplexity === 'Medium' ? 'info' : 'success'}
            size="small"
            sx={{ mt: 0.5 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Based on {requiredElements.length} required elements
          </Typography>
        </Box>
      </Stack>
    );
  };

  // Character Production Intelligence
  const getCharacterProductionIntelligence = (character, allElements, allPuzzles) => {
    // Find elements owned by this character
    const ownedElements = allElements.filter(e => e.owner_character_id === character.id);
    
    // Check production status of owned elements
    const memoryTokens = ownedElements.filter(e => isMemoryToken(e));
    const tokensWithoutRFID = memoryTokens.filter(e => !getRFIDTag(e));
    const notReadyElements = ownedElements.filter(e => getProductionStatus(e) !== 'Ready');
    
    // Find puzzles this character is involved in
    const involvedPuzzles = allPuzzles.filter(p => 
      p.required_collaborators?.includes(character.id) ||
      p.required_elements?.some(elemId => 
        ownedElements.some(owned => owned.id === elemId || owned.name === elemId)
      )
    );
    
    const productionReady = tokensWithoutRFID.length === 0 && notReadyElements.length === 0;
    
    return (
      <Stack spacing={2}>
        {/* Overall Status */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Character Production Status
          </Typography>
          <Chip 
            label={productionReady ? 'Ready' : 'Has Issues'}
            color={productionReady ? 'success' : 'warning'}
            size="small"
            sx={{ mt: 1 }}
          />
        </Box>

        {/* Owned Elements Status */}
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Props Inventory
          </Typography>
          <Stack spacing={0.5} sx={{ mt: 1 }}>
            <Typography variant="body2">
              Total elements: {ownedElements.length}
            </Typography>
            {memoryTokens.length > 0 && (
              <Typography variant="body2">
                Memory tokens: {memoryTokens.length}
                {tokensWithoutRFID.length > 0 && (
                  <span style={{ color: 'error.main' }}>
                    {' '}({tokensWithoutRFID.length} need RFID)
                  </span>
                )}
              </Typography>
            )}
            {notReadyElements.length > 0 && (
              <Typography variant="body2" color="warning.main">
                {notReadyElements.length} elements not production ready
              </Typography>
            )}
          </Stack>
        </Box>

        {/* RFID Issues */}
        {tokensWithoutRFID.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Missing RFID Tags
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {tokensWithoutRFID.slice(0, 3).map((token) => (
                <Alert severity="error" key={token.id} sx={{ py: 0.5 }}>
                  <Typography variant="body2">
                    {token.name} - ${getElementValue(token)}
                  </Typography>
                </Alert>
              ))}
              {tokensWithoutRFID.length > 3 && (
                <Typography variant="body2" color="error.main">
                  ...and {tokensWithoutRFID.length - 3} more
                </Typography>
              )}
            </Stack>
          </Box>
        )}

        {/* Puzzle Dependencies */}
        {involvedPuzzles.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Critical for Puzzles
            </Typography>
            <Typography variant="body2">
              Involved in {involvedPuzzles.length} puzzle{involvedPuzzles.length > 1 ? 's' : ''}
            </Typography>
            {!productionReady && (
              <Alert severity="warning" sx={{ mt: 1 }}>
                <Typography variant="body2">
                  Production issues may block puzzle completion
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Production Notes */}
        {character.description && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Character Notes
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {character.description.substring(0, 150)}...
            </Typography>
          </Box>
        )}
      </Stack>
    );
  };

  // Calculate production intelligence based on entity type
  const productionIntelligence = useMemo(() => {
    if (!selectedEntity || !elements) return null;

    // Determine entity category for intelligence - check entityType first, then type
    const entityCategory = selectedEntity.entityType || selectedEntity.type || 'unknown';
    
    switch (entityCategory) {
      case 'element':
        return getElementProductionIntelligence(selectedEntity, elements, puzzles);
      case 'puzzle':
        return getPuzzleProductionIntelligence(selectedEntity, elements);
      case 'character':
        return getCharacterProductionIntelligence(selectedEntity, elements, puzzles);
      case 'timeline_event':
        return (
          <Stack spacing={2}>
            <Typography variant="body1">
              Timeline events have no direct production requirements
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Check elements that reveal this event for production status
            </Typography>
          </Stack>
        );
      default:
        return (
          <Typography variant="body1">
            Production analysis for {entityCategory} not yet implemented
          </Typography>
        );
    }
  }, [selectedEntity, elements, puzzles]);

  if (isLoading) {
    return (
      <Box data-testid="production-overlay" sx={{ p: 2 }}>
        <Typography>Loading production analysis...</Typography>
      </Box>
    );
  }

  // Main render
  return (
    <Box 
      data-testid="production-overlay"
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
          <Build sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Production Intelligence</Typography>
        </Box>
        
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          {selectedEntity?.name || 'Unknown Entity'}
        </Typography>

        {productionIntelligence}
      </Paper>
    </Box>
  );
};

export default ProductionIntelligenceLayer;