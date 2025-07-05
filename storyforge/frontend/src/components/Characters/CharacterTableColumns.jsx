import React from 'react';
import { 
  Chip, Typography, Box
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import GroupsIcon from '@mui/icons-material/Groups';

// Enhanced table columns with production intelligence
export const characterTableColumns = [
  { id: 'name', label: 'Name', sortable: true, width: '18%' },
  { 
    id: 'type', label: 'Type', sortable: true, width: '8%',
    format: (value) => value ? (
      <Chip 
        size="small" 
        label={value} 
        icon={value === 'Player' ? <PersonIcon /> : <SmartToyIcon />}
        color={value === 'Player' ? 'primary' : 'secondary'} 
        variant="outlined"
      />
    ) : null
  },
  { 
    id: 'tier', label: 'Tier', sortable: true, width: '8%',
    format: (value) => value ? (
      <Chip 
        size="small" 
        label={value} 
        color={
          value === 'Core' ? 'success' : 
          value === 'Secondary' ? 'info' : 
          'default'
        } 
      />
    ) : null
  },
  {
    id: 'resolutionPaths', 
    label: 'Resolution Paths', 
    sortable: false, 
    width: '12%',
    format: (value) => {
      if (!value || value.length === 0) {
        return <Chip size="small" label="Unassigned" color="default" variant="outlined" />;
      }
      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {value.slice(0, 2).map(path => (
            <Chip 
              key={path}
              size="small" 
              label={path === 'Black Market' ? 'BM' : path === 'Detective' ? 'Det' : path === 'Third Path' ? '3rd' : path}
              color={
                path === 'Black Market' ? 'warning' :
                path === 'Detective' ? 'error' :
                path === 'Third Path' ? 'secondary' : 'default'
              }
              variant="outlined"
            />
          ))}
          {value.length > 2 && <Typography variant="caption">+{value.length - 2}</Typography>}
        </Box>
      );
    }
  },
  { 
    id: 'act_focus',
    label: 'Act Focus',
    sortable: true,
    width: '8%',
    format: (value) => value ? (
      <Chip
        size="small"
        label={value}
        color={value === 'Act 1' ? 'warning' : value === 'Act 2' ? 'info' : 'default'}
      />
    ) : <Typography variant="caption" color="textSecondary">N/A</Typography>
  },
  { id: 'logline', label: 'Logline', sortable: true, width: '25%' },
  {
    id: 'ownedElements', 
    label: 'Memory Tokens', 
    sortable: false,
    format: (value, row) => {
      const memoryTokens = value?.filter(el => 
        el.properties?.basicType?.toLowerCase().includes('memory') ||
        el.properties?.basicType?.toLowerCase().includes('token') ||
        el.properties?.basicType?.toLowerCase().includes('rfid')
      ) || [];
      const total = value?.length || 0;
      return (
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="primary">{memoryTokens.length}</Typography>
          <Typography variant="caption" color="text.secondary">of {total}</Typography>
        </Box>
      );
    },
    align: 'center', 
    width: '8%'
  },
  {
    id: 'character_links',
    label: 'Connections',
    sortable: false,
    format: (value) => {
      const linkCount = value?.length || 0;
      return (
        <Chip 
          size="small" 
          label={linkCount}
          color={linkCount >= 3 ? 'success' : linkCount >= 1 ? 'warning' : 'default'}
          icon={<GroupsIcon />}
        />
      );
    },
    align: 'center',
    width: '8%'
  },
  { 
    id: 'events', 
    label: 'Events', 
    sortable: false,
    format: (value) => value?.length || 0,
    align: 'center', 
    width: '5%'
  },
];