import React from 'react';
import { Paper, Typography, FormGroup, FormControlLabel, Checkbox, Chip, Box } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import InventoryIcon from '@mui/icons-material/Inventory';
import ExtensionIcon from '@mui/icons-material/Extension';
import EventIcon from '@mui/icons-material/Event';

const ENTITY_TYPES = [
  { 
    type: 'elements', 
    label: 'Elements', 
    icon: <InventoryIcon />,
    color: '#4caf50',
    defaultEnabled: false
  },
  { 
    type: 'puzzles', 
    label: 'Puzzles', 
    icon: <ExtensionIcon />,
    color: '#ff9800',
    defaultEnabled: false
  },
  { 
    type: 'timelineEvents', 
    label: 'Timeline Events', 
    icon: <EventIcon />,
    color: '#9c27b0',
    defaultEnabled: false
  }
];

const EntityTypeLoader = React.memo(({ metadata, onLoadEntityType, loadedTypes }) => {
  // Initialize with default enabled types on first render
  React.useEffect(() => {
    const defaultTypes = ENTITY_TYPES
      .filter(et => et.defaultEnabled)
      .map(et => et.type);
    
    defaultTypes.forEach(type => {
      if (!loadedTypes.includes(type)) {
        onLoadEntityType(type);
      }
    });
  }, []); // Only run once on mount

  const getCounts = (type) => {
    if (!metadata) return 0;
    switch (type) {
      case 'elements':
        return metadata.elementCount || 0;
      case 'puzzles':
        return metadata.puzzleCount || 0;
      case 'timelineEvents':
        return metadata.timelineEventCount || 0;
      default:
        return 0;
    }
  };

  return (
    <Paper sx={{ 
      p: 2, 
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      minWidth: 200
    }}>
      <Typography variant="subtitle2" gutterBottom>
        Progressive Loading
      </Typography>
      
      {/* Show characters as always visible */}
      <Box sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon sx={{ fontSize: 16, color: '#2196f3' }} />
        <Typography variant="body2" color="text.secondary">
          Characters ({metadata?.characterCount || 0})
        </Typography>
        <Chip 
          label="Always Visible"
          size="small"
          sx={{ 
            height: 18,
            fontSize: '0.7rem',
            backgroundColor: '#2196f3',
            color: 'white'
          }}
        />
      </Box>
      
      <FormGroup>
        {ENTITY_TYPES.map(({ type, label, icon, color }) => {
          const count = getCounts(type);
          const isLoaded = loadedTypes.includes(type);
          
          return (
            <FormControlLabel
              key={type}
              control={
                <Checkbox
                  checked={isLoaded}
                  onChange={() => onLoadEntityType(type)}
                  size="small"
                  sx={{ color, '&.Mui-checked': { color } }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {React.cloneElement(icon, { sx: { fontSize: 16, color } })}
                  <Typography variant="body2">
                    {label}
                  </Typography>
                  <Chip 
                    label={count}
                    size="small"
                    sx={{ 
                      height: 20,
                      fontSize: '0.75rem',
                      backgroundColor: isLoaded ? color : 'grey.300',
                      color: 'white'
                    }}
                  />
                </Box>
              }
            />
          );
        })}
      </FormGroup>
      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
        Load entity types progressively for better performance
      </Typography>
    </Paper>
  );
});

EntityTypeLoader.displayName = 'EntityTypeLoader';

export default EntityTypeLoader;