import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Chip, Button, Box, Select, MenuItem, FormControl, InputLabel, Grid, Paper, Alert, Skeleton } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';

// Element types
const ELEMENT_TYPES = [
  'All Types',
  'Prop', 
  'Set Dressing', 
  'Memory Token Video', 
  'Character Sheet'
];

// Add filter options
const STATUS_OPTIONS = [
  'All Statuses',
  'Ready for Playtest',
  'Done',
  'In development',
  'Idea/Placeholder',
  'Source Prop/print',
  'To Design',
  'To Build',
  'Needs Repair',
];
const FIRST_AVAILABLE_OPTIONS = [
  'All Acts',
  'Act 0',
  'Act 1',
  'Act 2',
];

// Table column definitions
const columns = [
  { id: 'name', label: 'Name', sortable: true },
  { id: 'basicType', label: 'Type', sortable: true, 
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
  { id: 'status', label: 'Status', sortable: true,
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
  { id: 'firstAvailable', label: 'First Available', sortable: true },
  { id: 'description', label: 'Description', sortable: true },
  { id: 'owner', label: 'Owner', sortable: true, 
    format: (value) => value?.length ? `${value.length} Character(s)` : 'None'
  },
  { id: 'narrativeThreads', label: 'Narrative Threads', sortable: true, 
    format: (value) => value?.length ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {value.map((thread, i) => (
          <Chip key={i} label={thread} size="small" variant="outlined" />
        ))}
      </Box>
    ) : 'None'
  },
];

function Elements() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get type filter from URL query param
  const queryParams = new URLSearchParams(location.search);
  const typeFromQuery = queryParams.get('type');
  
  // State for element type filter
  const [elementType, setElementType] = useState(typeFromQuery || 'All Types');
  const [status, setStatus] = useState('All Statuses');
  const [firstAvailable, setFirstAvailable] = useState('All Acts');
  
  // Build filters object
  const filters = {};
  if (elementType !== 'All Types') filters.type = elementType;
  if (status !== 'All Statuses') filters.status = status;
  if (firstAvailable !== 'All Acts') filters.firstAvailable = firstAvailable;
  
  // Fetch elements data with all filters
  const { data: elements, isLoading, error, refetch } = useQuery(
    ['elements', filters],
    () => api.getElements(filters),
    { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
  );
  
  // Handle row click to navigate to element details
  const handleRowClick = (row) => {
    navigate(`/elements/${row.id}`);
  };
  
  // Handle filter changes
  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setElementType(newType);
    // Update URL query parameter for type only
    const params = new URLSearchParams();
    if (newType !== 'All Types') params.set('type', newType);
    navigate({ pathname: '/elements', search: params.toString() });
  };
  const handleStatusChange = (event) => setStatus(event.target.value);
  const handleFirstAvailableChange = (event) => setFirstAvailable(event.target.value);
  
  // Future feature: Add new element (Phase 3)
  const handleAddElement = () => {
    alert('This feature will be available in Phase 3 (Editing Capabilities)');
  };
  
  return (
    <div>
      <PageHeader 
        title="Elements & Memories" 
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => refetch()}
            >
              Refresh
            </Button>
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={handleAddElement}
            >
              Add Element
            </Button>
          </Box>
        }
      />
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, mb: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="element-type-label">Element Type</InputLabel>
              <Select
                labelId="element-type-label"
                id="element-type-select"
                value={elementType}
                label="Element Type"
                onChange={handleTypeChange}
              >
                {ELEMENT_TYPES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="element-status-label">Status</InputLabel>
              <Select
                labelId="element-status-label"
                id="element-status-select"
                value={status}
                label="Status"
                onChange={handleStatusChange}
              >
                {STATUS_OPTIONS.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel id="element-first-available-label">First Available</InputLabel>
              <Select
                labelId="element-first-available-label"
                id="element-first-available-select"
                value={firstAvailable}
                label="First Available"
                onChange={handleFirstAvailableChange}
              >
                {FIRST_AVAILABLE_OPTIONS.map((fa) => (
                  <MenuItem key={fa} value={fa}>{fa}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
        </Grid>
      </Grid>
      
      {isLoading ? (
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2, mb: 2 }} />
      ) : (
        <DataTable 
          columns={columns}
          data={elements}
          isLoading={false}
          onRowClick={handleRowClick}
          initialSortBy="name"
          initialSortDirection="asc"
          emptyMessage={
            elementType === 'All Types' 
              ? "No elements found in the database." 
              : `No ${elementType} elements found in the database.`
          }
        />
      )}
      
      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          Error loading elements: {error.message}
        </Alert>
      )}
    </div>
  );
}

export default Elements; 