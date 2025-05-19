import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { Chip, Typography, Paper, CircularProgress, Alert, Box, FormControl, InputLabel, Select, MenuItem, Button } from '@mui/material';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { useState } from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';

// Table column definitions
const columns = [
  { id: 'puzzle', label: 'Puzzle', sortable: true },
  { id: 'owner', label: 'Owner(s)', sortable: true, format: (value) => value?.length || 0 },
  { id: 'timing', label: 'Timing', sortable: true },
  { id: 'rewards', label: 'Rewards', sortable: true, format: (value) => value?.length || 0 },
  { id: 'narrativeThreads', label: 'Narrative Threads', sortable: true, format: (value) => value?.length ? (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {value.map((thread, i) => (
        <Chip key={i} label={thread} size="small" variant="outlined" />
      ))}
    </Box>
  ) : 'None' },
];

// Add filter options
const TIMING_OPTIONS = ['All Timings', 'Act 1', 'Act 2'];

function Puzzles() {
  const navigate = useNavigate();

  // State for filters
  const [timing, setTiming] = useState('All Timings');
  // Build filters object
  const filters = {};
  if (timing !== 'All Timings') filters.timing = timing;

  // Fetch puzzles data with all filters
  const { data: puzzles, isLoading, error, refetch } = useQuery(
    ['puzzles', filters],
    () => api.getPuzzles(filters),
    { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
  );

  // Handle row click to navigate to puzzle details
  const handleRowClick = (row) => {
    navigate(`/puzzles/${row.id}`);
  };

  // Handle filter change
  const handleTimingChange = (event) => setTiming(event.target.value);

  return (
    <div>
      <PageHeader 
        title="Puzzles"
      />
      <Paper sx={{ p: 2, mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="puzzle-timing-label">Timing</InputLabel>
          <Select
            labelId="puzzle-timing-label"
            id="puzzle-timing-select"
            value={timing}
            label="Timing"
            onChange={handleTimingChange}
          >
            {TIMING_OPTIONS.map((t) => (
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
          data={puzzles}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          initialSortBy="puzzle"
          initialSortDirection="asc"
          emptyMessage="No puzzles found in the database."
        />
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error loading puzzles: {error.message}
          </Alert>
        )}
      </Paper>
    </div>
  );
}

export default Puzzles; 