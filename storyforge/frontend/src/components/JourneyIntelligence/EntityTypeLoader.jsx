/**
 * EntityTypeLoader - Progressive loading controls for different entity types
 * Allows users to selectively load elements, puzzles, and timeline events
 */

import React from 'react';
import { Box, Button, Chip, Typography } from '@mui/material';
import { 
  Extension as ElementIcon,
  Construction as PuzzleIcon,
  Event as TimelineIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon
} from '@mui/icons-material';

const EntityTypeLoader = ({ 
  metadata = {},
  onLoadEntityType,
  loadedTypes = []
}) => {
  const { hiddenEntities = {}, totalEntities = 0, totalCharacters = 0 } = metadata;
  
  const entityTypes = [
    {
      type: 'elements',
      label: 'Elements',
      icon: <ElementIcon />,
      count: hiddenEntities.elements?.length || 0,
      color: '#10b981'
    },
    {
      type: 'puzzles', 
      label: 'Puzzles',
      icon: <PuzzleIcon />,
      count: hiddenEntities.puzzles?.length || 0,
      color: '#f59e0b'
    },
    {
      type: 'timelineEvents',
      label: 'Timeline Events',
      icon: <TimelineIcon />,
      count: hiddenEntities.timelineEvents?.length || 0,
      color: '#6366f1'
    }
  ];
  
  const hiddenCount = totalEntities - totalCharacters;
  
  if (hiddenCount === 0) {
    return null; // No hidden entities to load
  }
  
  return (
    <Box sx={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: 2,
      p: 1,
      borderRadius: 1,
      bgcolor: 'background.paper',
      boxShadow: 1
    }}>
      <Typography variant="body2" color="text.secondary">
        Show more:
      </Typography>
      {entityTypes.map(({ type, label, icon, count, color }) => {
        if (count === 0) return null;
        
        const isLoaded = loadedTypes.includes(type);
        
        return (
          <Button
            key={type}
            size="small"
            variant={isLoaded ? "contained" : "outlined"}
            startIcon={icon}
            endIcon={isLoaded ? <HideIcon fontSize="small" /> : <ShowIcon fontSize="small" />}
            onClick={() => onLoadEntityType(type)}
            sx={{ 
              minWidth: 120,
              color: isLoaded ? 'white' : color,
              bgcolor: isLoaded ? color : 'transparent',
              borderColor: color,
              '&:hover': {
                bgcolor: isLoaded ? color : `${color}20`,
                borderColor: color
              }
            }}
          >
            {label}
            <Chip 
              label={count} 
              size="small" 
              sx={{ 
                ml: 0.5,
                height: 18,
                bgcolor: isLoaded ? 'rgba(255,255,255,0.2)' : 'transparent',
                color: isLoaded ? 'white' : 'text.secondary'
              }} 
            />
          </Button>
        );
      })}
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
        {totalCharacters} characters shown • {hiddenCount} entities hidden
      </Typography>
    </Box>
  );
};

export default EntityTypeLoader;