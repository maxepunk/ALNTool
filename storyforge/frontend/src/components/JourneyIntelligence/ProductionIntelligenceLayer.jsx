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
import { Build, Warning, CheckCircle, Cancel } from '@mui/icons-material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';

const ProductionIntelligenceLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });
  
  // Only render if production layer is active AND entity is selected
  if (!activeIntelligence.includes('production') || !selectedEntity) {
    return null;
  }

  // Element Production Intelligence
  const getElementProductionIntelligence = (element, allElements) => {
    // Find the full element data from our elements array or use what's provided
    const fullElement = allElements?.find(e => e.id === element.id) || element;
    
    const physicalProp = fullElement.physical_prop || 'No physical prop assigned';
    const rfidTag = fullElement.rfid_tag || null;
    const productionStatus = fullElement.production_status || 'Unknown';
    const container = fullElement.container || 'Not in container';
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Physical Prop
          </Typography>
          <Typography variant="body2">
            {physicalProp}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            RFID Status
          </Typography>
          {rfidTag ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
              <Typography variant="body2">{rfidTag}</Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Warning sx={{ color: 'warning.main', fontSize: 20 }} />
              <Typography variant="body2">No RFID tag assigned</Typography>
            </Box>
          )}
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Container Location
          </Typography>
          <Typography variant="body2">
            {container}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Production Status
          </Typography>
          <Chip 
            label={productionStatus}
            color={productionStatus === 'Ready' ? 'success' : productionStatus === 'Critical Missing' ? 'error' : 'default'}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>

        {productionStatus === 'Critical Missing' && (
          <Alert severity="error" sx={{ mt: 1 }}>
            <Typography variant="body2">
              Blocks revelation scene - urgent action required!
            </Typography>
          </Alert>
        )}
      </Stack>
    );
  };

  // Puzzle Production Intelligence
  const getPuzzleProductionIntelligence = (puzzle, allElements) => {
    // For testing, puzzle data might be directly on selectedEntity
    const physicalPropsRequired = puzzle.physical_props_required || [];
    const productionComplexity = puzzle.production_complexity || 'Unknown';
    const criticalDependencies = puzzle.critical_dependencies || [];
    const setupTime = puzzle.setup_time || 'Unknown';
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Physical Props Required
          </Typography>
          <Typography variant="body2">
            {physicalPropsRequired.length} props needed
          </Typography>
          {physicalPropsRequired.length > 0 && (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {physicalPropsRequired.map((prop, index) => (
                <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                  • {prop}
                </Typography>
              ))}
            </Stack>
          )}
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Setup Time
          </Typography>
          <Typography variant="body2">
            {setupTime}
          </Typography>
        </Box>

        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Production Complexity
          </Typography>
          <Chip 
            label={productionComplexity}
            color={productionComplexity === 'High' ? 'warning' : productionComplexity === 'Medium' ? 'info' : 'success'}
            size="small"
            sx={{ mt: 0.5 }}
          />
        </Box>

        {criticalDependencies.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Critical Dependencies
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {criticalDependencies.map((dep, index) => (
                <Alert 
                  key={index} 
                  severity={dep.includes('MISSING') ? 'error' : 'warning'} 
                  sx={{ py: 0.5 }}
                >
                  <Typography variant="body2">
                    {dep}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>
    );
  };

  // Character Production Intelligence
  const getCharacterProductionIntelligence = (character, allElements) => {
    // For testing, character data might be directly on selectedEntity
    const propsRequired = character.props_required || [];
    const criticalMissing = character.critical_missing || [];
    const productionNotes = character.production_notes || '';
    
    return (
      <Stack spacing={2}>
        <Box>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            Props Required
          </Typography>
          {propsRequired.length > 0 ? (
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {propsRequired.map((prop, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ color: 'success.main', fontSize: 16 }} />
                  <Typography variant="body2">{prop}</Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2">
              No props required
            </Typography>
          )}
        </Box>

        {criticalMissing.length > 0 && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Critical Missing Items
            </Typography>
            <Stack spacing={0.5} sx={{ mt: 1 }}>
              {criticalMissing.map((item, index) => (
                <Alert severity="error" key={index} sx={{ py: 0.5 }}>
                  <Typography variant="body2">
                    {item}
                  </Typography>
                </Alert>
              ))}
            </Stack>
          </Box>
        )}

        {productionNotes && (
          <Box>
            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
              Production Notes
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {productionNotes}
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
        return getElementProductionIntelligence(selectedEntity, elements);
      case 'puzzle':
        return getPuzzleProductionIntelligence(selectedEntity, elements);
      case 'character':
        return getCharacterProductionIntelligence(selectedEntity, elements);
      default:
        return (
          <Typography variant="body1">
            Production analysis placeholder
          </Typography>
        );
    }
  }, [selectedEntity, elements]);

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