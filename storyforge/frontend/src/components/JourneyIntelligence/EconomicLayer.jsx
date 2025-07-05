/**
 * EconomicLayer - Entity-responsive economic intelligence
 * 
 * Features:
 * - Provides deep economic analysis for selected entity
 * - Element: Path pressure, value breakdown, set completion
 * - Character: Token portfolio, economic role, path influence  
 * - Puzzle: Economic ripple effects, path balance impact
 * - Only renders when economic layer active AND entity selected
 */

import React, { useMemo } from 'react';
import { Box, Typography, Chip, Paper, Alert, Stack, Divider } from '@mui/material';
import { AttachMoney, Warning, Groups, TrendingUp, Assessment } from '@mui/icons-material';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { usePerformanceElements } from '../../hooks/usePerformanceElements';
import { getElementType } from '../../utils/elementFields';
import logger from '../../utils/logger';

// Element Economic Intelligence
const getElementEconomicIntelligence = (element, elements) => {
  const elementData = elements.find(e => e.id === element.id);
  if (!elementData) return null;

  const value = elementData.calculated_memory_value || 0;
  const isHighValue = value >= 5000;
  
  return (
    <Stack spacing={2}>
      {/* Current Value */}
      <Box>
        <Typography variant="h5" color={isHighValue ? 'error.main' : 'success.main'}>
          ${value.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Memory Token Value
        </Typography>
      </Box>

      {/* Memory Group */}
      {elementData.memory_group && (
        <Box>
          <Typography variant="body1">{elementData.memory_group}</Typography>
          {elementData.group_multiplier > 1 && (
            <Chip
              icon={<Groups />}
              label={`${elementData.group_multiplier}x`}
              size="small"
              color="primary"
            />
          )}
          <Typography variant="body2" color="text.secondary">
            Memory Group & Multiplier
          </Typography>
        </Box>
      )}

      {/* Path Pressure Analysis */}
      {isHighValue && (
        <Alert severity="warning" icon={<Warning />}>
          <Typography variant="body2">
            <strong>Choice Pressure: High</strong><br />
            At ${value.toLocaleString()}, strongly incentivizes Black Market path
          </Typography>
        </Alert>
      )}

      {/* Return Path */}
      {elementData.rightful_owner && (
        <Box>
          <Typography variant="body1">Return: {elementData.rightful_owner}</Typography>
          <Typography variant="body2" color="text.secondary">
            Return Path Available
          </Typography>
        </Box>
      )}
    </Stack>
  );
};

// Character Economic Intelligence  
const getCharacterEconomicIntelligence = (character, elements) => {
  // Find elements owned by this character
  const ownedElements = elements.filter(e => e.owner_character_id === character.id);
  const totalValue = ownedElements.reduce((sum, e) => sum + (e.calculated_memory_value || 0), 0);
  
  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
        <Assessment sx={{ mr: 1 }} />
        Token Portfolio
      </Typography>
      
      <Box>
        <Typography variant="h5" color="primary.main">
          ${totalValue.toLocaleString()}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Token Value ({ownedElements.length} tokens)
        </Typography>
      </Box>

      <Box>
        <Typography variant="body1">
          Economic Role: {totalValue > 10000 ? 'High contributor' : totalValue > 5000 ? 'Medium contributor' : 'Low contributor'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Based on token portfolio value
        </Typography>
      </Box>
    </Stack>
  );
};

// Puzzle Economic Intelligence
const getPuzzleEconomicIntelligence = (puzzle, elements) => {
  // This would need puzzle data - for now return basic analysis
  return (
    <Stack spacing={2}>
      <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center' }}>
        <TrendingUp sx={{ mr: 1 }} />
        Economic Impact
      </Typography>
      
      <Typography variant="body1">
        Puzzle economic analysis would require puzzle data integration
      </Typography>
    </Stack>
  );
};

const EconomicLayer = ({ nodes = [] }) => {
  const { activeIntelligence, selectedEntity } = useJourneyIntelligenceStore();
  
  // Use our established data hook - MUST be called before any conditional returns
  const { data: elements, isLoading } = usePerformanceElements({
    includeMemoryTokens: true
  });

  // Get economic intelligence based on selected entity type - MUST be before conditional returns
  const economicIntelligence = useMemo(() => {
    if (!selectedEntity || !elements) return null;

    // Determine entity category for intelligence - check entityType first, then type
    const entityCategory = selectedEntity.entityType || selectedEntity.type || 'unknown';
    
    switch (entityCategory) {
      case 'element':
        return getElementEconomicIntelligence(selectedEntity, elements);
      case 'character':
        return getCharacterEconomicIntelligence(selectedEntity, elements);
      case 'puzzle':
        return getPuzzleEconomicIntelligence(selectedEntity, elements);
      case 'timeline_event':
        // For now, return basic analysis for timeline events
        return (
          <Typography variant="body1">
            Timeline event economic analysis would require event data integration
          </Typography>
        );
      default:
        return null;
    }
  }, [selectedEntity, elements]);

  // Only render if economic layer is active AND entity is selected
  if (!activeIntelligence.includes('economic') || !selectedEntity) {
    return null;
  }

  if (isLoading) {
    return (
      <Box data-testid="economic-overlay" sx={{ p: 2 }}>
        <Typography>Loading economic analysis...</Typography>
      </Box>
    );
  }

  if (!economicIntelligence) {
    return null;
  }

  return (
    <Box 
      data-testid="economic-overlay"
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
          <AttachMoney sx={{ mr: 1, color: 'primary.main' }} />
          <Typography variant="h6">Economic Intelligence</Typography>
        </Box>
        
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
          {selectedEntity?.name || 'Unknown Entity'}
        </Typography>

        {economicIntelligence}
      </Paper>
    </Box>
  );
};

export default EconomicLayer;