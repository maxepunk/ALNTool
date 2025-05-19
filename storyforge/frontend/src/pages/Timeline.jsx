import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Chip, Typography, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';

// Table column definitions
const columns = [
  { id: 'description', label: 'Description', sortable: true },
  { id: 'date', label: 'Date', sortable: true },
  { id: 'charactersInvolved', label: 'Characters Involved', sortable: true,
    format: (value) => value?.length || 0
  },
];

// Add filter options
const MEM_TYPE_OPTIONS = ['All Types', 'Prop', 'Set Dressing', 'Memory Token Video', 'Memory Token Audio', 'Memory Token Physical', 'Corrupted Memory RFID'];

function Timeline() {
  const navigate = useNavigate();

  // State for filters
  const [memType, setMemType] = useState('All Types');
  // Build filters object
  const filters = {};
  if (memType !== 'All Types') filters.memType = memType;

  // Fetch timeline events data with all filters
  const { data: events, isLoading, error, refetch } = useQuery(
    ['timelineEvents', filters],
    () => api.getTimelineEvents(filters),
    { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
  );

  // Handle row click to navigate to event details
  const handleRowClick = (row) => {
    navigate(`/timelines/${row.id}`);
  };

  // Handle filter change
  const handleMemTypeChange = (event) => setMemType(event.target.value);

  return (
    <div>
      <PageHeader 
        title="Timeline Events"
      />
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="timeline-memtype-label">Memory/Evidence Type</InputLabel>
          <Select
            labelId="timeline-memtype-label"
            id="timeline-memtype-select"
            value={memType}
            label="Memory/Evidence Type"
            onChange={handleMemTypeChange}
          >
            {MEM_TYPE_OPTIONS.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={() => refetch()}
        >
          Refresh
        </Button>
      </Paper>
      <Paper sx={{ p: 3 }}>
        <DataTable
          columns={columns}
          data={events}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          initialSortBy="date"
          initialSortDirection="asc"
          emptyMessage="No timeline events found in the database."
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error loading timeline events: {error.message}
          </Alert>
        )}
      </Paper>
    </div>
  );
}

export default Timeline; 