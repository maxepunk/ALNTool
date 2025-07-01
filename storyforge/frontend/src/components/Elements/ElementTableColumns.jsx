import React from 'react';
import { 
  Chip, Typography, Box
} from '@mui/material';

// Enhanced table columns with production intelligence for Elements
export const elementTableColumns = [
  { id: 'name', label: 'Name', sortable: true, width: '20%' },
  {
    id: 'basicType', label: 'Type', sortable: true, width: '15%',
    format: (value) => value ? (
      <Chip 
        size="small" 
        label={value} 
        color={
          value.includes('Memory') ? 'warning' : 
          value === 'Prop' ? 'info' : 
          value === 'Character Sheet' ? 'secondary' : 
          'default'
        }
        icon={value.includes('Memory') ? <span role="img" aria-label="memory">🧠</span> : undefined}
      />
    ) : null
  },
  {
    id: 'properties.actFocus', label: 'Act Focus', sortable: true, width: '10%',
    format: (value) => value ? <Chip size="small" label={value} /> : <Typography variant="caption" color="textSecondary">N/A</Typography>
  },
  {
    id: 'status', label: 'Status', sortable: true, width: '15%',
    format: (value) => value ? (
      <Chip 
        size="small" 
        label={value} 
        color={
          value === 'Ready for Playtest' || value === 'Done' ? 'success' : 
          value === 'In development' ? 'warning' : 
          value === 'Idea/Placeholder' ? 'info' : 
          'default'
        } 
      />
    ) : null
  },
  { id: 'firstAvailable', label: 'First Available', sortable: true, width: '10%' },
  {
    id: 'properties.themes', label: 'Themes', sortable: false, width: '15%', // Not directly sortable unless we pick one theme
    format: (themesArray) => themesArray && themesArray.length > 0 ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {themesArray.map((theme, i) => (
          <Chip key={i} label={theme} size="small" variant="outlined" />
        ))}
      </Box>
    ) : <Typography variant="caption" color="textSecondary">N/A</Typography>
  },
  {
    id: 'properties.memorySets', label: 'Memory Sets', sortable: false, width: '15%',
    format: (setsArray) => setsArray && setsArray.length > 0 ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {setsArray.map((set, i) => (
          <Chip key={i} label={set} size="small" variant="outlined" color="info" />
        ))}
      </Box>
    ) : <Typography variant="caption" color="textSecondary">N/A</Typography>
  },
];