import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import { Chip, Button, Typography, Paper, Skeleton, FormControl, InputLabel, Select, MenuItem, Box, Grid, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy'; // For NPC
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { useState } from 'react';

// Table column definitions
const columns = [
  { id: 'name', label: 'Name', sortable: true, width: '20%' },
  { 
    id: 'type', label: 'Type', sortable: true, width: '10%',
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
    id: 'tier', label: 'Tier', sortable: true, width: '10%',
    format: (value) => value ? (
      <Chip 
        size="small" 
        label={value} 
        color={
          value === 'Core' ? 'success' : 
          value === 'Secondary' ? 'info' : 
          'default' // Tertiary or other
        } 
      />
    ) : null
  },
  { 
    id: 'properties.actFocus', // Assuming actFocus is nested under properties
    label: 'Act Focus',
    sortable: true,
    width: '10%',
    format: (value) => value ? (
      <Chip
        size="small"
        label={value}
        color={value === 'Act 1' ? 'warning' : value === 'Act 2' ? 'info' : value === 'Act 3' ? 'secondary' : 'default'}
      />
    ) : <Typography variant="caption" color="textSecondary">N/A</Typography>
  },
  { id: 'logline', label: 'Logline', sortable: true, width: '30%' }, // Adjusted width slightly
  {
    id: 'ownedElements', label: 'Items', sortable: false,
    format: (value) => value?.length || 0, 
    align: 'center', width: '5%'
  },
  { 
    id: 'events', label: 'Events', sortable: false, 
    format: (value) => value?.length || 0,
    align: 'center', width: '5%'
  },
  { 
    id: 'puzzles', label: 'Puzzles', sortable: false, 
    format: (value) => value?.length || 0,
    align: 'center', width: '5%'
  },
];

const TYPE_OPTIONS = ['All Types', 'Player', 'NPC'];
const TIER_OPTIONS = ['All Tiers', 'Core', 'Secondary', 'Tertiary'];

function Characters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [tierFilter, setTierFilter] = useState('All Tiers');
  
  const filters = {};
  if (typeFilter !== 'All Types') filters.type = typeFilter;
  if (tierFilter !== 'All Tiers') filters.tier = tierFilter;
  
  const { data: characters, isLoading, error, refetch, isFetching } = useQuery(
    ['characters', filters],
    () => api.getCharacters(filters)
    // staleTime and cacheTime are set globally in queryClient
  );
  
  const handleRowClick = (row) => {
    navigate(`/characters/${row.id}`);
  };
  
  const handleAddCharacter = () => {
    // This would navigate to a create page or open a modal in Phase 3
    alert('Character creation will be available in Phase 3 (Editing Capabilities).');
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries(['characters', filters]); // More targeted invalidation
    refetch();
  };
  
  return (
    <Box>
      <PageHeader 
        title="Characters" 
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}> {/* Allow wrap for actions */}
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              disabled={isFetching}
              aria-label="Refresh characters list"
            >
              {isFetching ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Tooltip title="Character creation coming in Phase 3">
              <Button 
                variant="contained" 
                startIcon={<AddIcon />}
                onClick={handleAddCharacter}
              >
                Add Character
              </Button>
            </Tooltip>
          </Box>
        }
      />
      
      <Paper sx={{ p: {xs: 1.5, sm:2}, mb: 2.5 }} elevation={1}>
        <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 'medium'}}>Filter Options</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="character-type-label">Type</InputLabel>
              <Select
                labelId="character-type-label"
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {TYPE_OPTIONS.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="character-tier-label">Tier</InputLabel>
              <Select
                labelId="character-tier-label"
                value={tierFilter}
                label="Tier"
                onChange={(e) => setTierFilter(e.target.value)}
              >
                {TIER_OPTIONS.map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>
      
      {isLoading && !characters ? ( // Show skeleton only on initial load
        <Box>
          {[...Array(5)].map((_, i) => ( // Skeleton for a few rows
            <Skeleton key={i} variant="rectangular" height={60} sx={{ borderRadius: 1, mb: 1 }} />
          ))}
        </Box>
      ) : (
        <DataTable 
          columns={columns}
          data={characters || []} // Ensure data is always an array
          isLoading={isFetching} // Use isFetching for subsequent loads
          onRowClick={handleRowClick}
          initialSortBy="name"
          initialSortDirection="asc"
          emptyMessage={
            Object.keys(filters).length > 0 
            ? "No characters match your current filter criteria."
            : "No characters found. Try adding some!"
          }
          searchPlaceholder="Search characters by name, logline..."
        />
      )}
      
      {error && (
         <Paper sx={{p:2, mt:2}}><Typography color="error">Error loading characters: {error.message}</Typography></Paper>
      )}
    </Box>
  );
}

export default Characters; 