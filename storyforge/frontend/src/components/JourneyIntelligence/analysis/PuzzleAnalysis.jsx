/**
 * PuzzleAnalysis - Analysis component for puzzle entities
 * Shows social requirements and reward impact
 */

import React from 'react';
import { 
  Box, 
  Typography, 
  Divider, 
  Stack
} from '@mui/material';
import { 
  Group,
  Memory
} from '@mui/icons-material';

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

export default React.memo(PuzzleAnalysis);