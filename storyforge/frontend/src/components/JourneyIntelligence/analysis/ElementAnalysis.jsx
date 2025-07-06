/**
 * ElementAnalysis - Analysis component for element entities
 * Shows timeline connections, accessibility, and economic value
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Stack,
  Chip
} from '@mui/material';
import { 
  Timeline, 
  Person,
  Memory,
  AttachMoney
} from '@mui/icons-material';
import { getElementType } from '../../../utils/elementFields';

const ElementAnalysis = ({ entity, timelineEvents, elements }) => {
  // Find connected timeline event
  const connectedEvent = entity.timeline_event_id ? 
    timelineEvents?.find(event => event.id === entity.timeline_event_id) : null;
  
  // Find container element
  const containerElement = entity.container_element_id ?
    elements?.find(elem => elem.id === entity.container_element_id) : null;
  
  // Find owner character - entity already has owner_character_id from transformation
  const ownerCharacterId = entity.owner_character_id;

  return (
    <>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" gutterBottom>{entity.name}</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
          <Chip 
            label={getElementType(entity)}
            size="small"
            color={entity.calculated_memory_value ? 'primary' : 'default'}
          />
          {entity.calculated_memory_value && (
            <Chip 
              label={`$${entity.calculated_memory_value.toLocaleString()}`}
              size="small"
              icon={<Memory />}
            />
          )}
        </Box>
        {entity.description && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {entity.description}
          </Typography>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {/* Timeline Integration */}
      <Box data-testid="timeline-integration" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Timeline sx={{ mr: 1 }} /> Timeline Integration
        </Typography>
        
        <Stack spacing={2}>
          {connectedEvent ? (
            <>
              <Typography variant="body2" color="text.secondary">
                Connected Event: {connectedEvent.name || connectedEvent.description}
              </Typography>
              {connectedEvent.act_focus && (
                <Typography variant="body2" color="text.secondary">
                  Act Focus: {connectedEvent.act_focus}
                </Typography>
              )}
            </>
          ) : (
            <Typography variant="body2" color="text.secondary">
              No timeline connection
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary">
            Discovery Timing: {connectedEvent ? 'Event-triggered' : 'Available from start'}
          </Typography>
        </Stack>
      </Box>

      {/* Accessibility */}
      <Box data-testid="accessibility" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <Person sx={{ mr: 1 }} /> Accessibility
        </Typography>
        
        <Stack spacing={2}>
          {ownerCharacterId && (
            <Typography variant="body2" color="text.secondary">
              Owner: Character ID {ownerCharacterId}
            </Typography>
          )}
          
          {containerElement && (
            <Typography variant="body2" color="text.secondary">
              Container: {containerElement.name}
            </Typography>
          )}
          
          <Typography variant="body2" color="text.secondary">
            Access Path: {containerElement ? 'Container required' : 'Direct access'}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Discoverability: {entity.discoverability || 'Standard'}
          </Typography>
        </Stack>
      </Box>

      {/* Economic Value */}
      <Box data-testid="economic-value" sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <AttachMoney sx={{ mr: 1 }} /> Economic Value
        </Typography>
        
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Memory Token Value: ${(entity.calculated_memory_value || 0).toLocaleString()}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Type: {getElementType(entity)}
          </Typography>
          
          <Typography variant="body2" color="text.secondary">
            Path Impact: {entity.calculated_memory_value > 5000 ? 'High value - creates choice pressure' : 'Standard value'}
          </Typography>
        </Stack>
      </Box>
    </>
  );
};

export default React.memo(ElementAnalysis);