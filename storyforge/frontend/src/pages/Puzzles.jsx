import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Chip, Typography, Paper, CircularProgress, Alert, Box, FormControl, InputLabel, Select, MenuItem, Button,
  Grid // Added Grid
} from '@mui/material';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { useState, useEffect, useMemo } from 'react'; // Added useEffect, useMemo
import RefreshIcon from '@mui/icons-material/Refresh';

// Table column definitions
const columns = [
  { id: 'puzzle', label: 'Puzzle Name', sortable: true, width: '25%' },
  {
    id: 'properties.actFocus', label: 'Act Focus', sortable: true, width: '10%',
    format: (value) => value ? <Chip size="small" label={value} color={value === 'Act 1' ? 'warning' : value === 'Act 2' ? 'info' : value === 'Act 3' ? 'secondary' : 'default'} /> : <Typography variant="caption" color="textSecondary">N/A</Typography>
  },
  {
    id: 'properties.themes', label: 'Themes', sortable: false, width: '20%',
    format: (themesArray) => themesArray && themesArray.length > 0 ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {themesArray.map((theme, i) => (
          <Chip key={i} label={theme} size="small" variant="outlined" />
        ))}
      </Box>
    ) : <Typography variant="caption" color="textSecondary">N/A</Typography>
  },
  { id: 'owner', label: 'Owner(s)', sortable: false, format: (value) => value?.map(o => o.name).join(', ') || 'N/A', width: '15%' },
  // { id: 'timing', label: 'Timing (Original)', sortable: true, width: '10%' }, // Original timing if needed, actFocus is preferred
  { id: 'rewards', label: 'Rewards (Count)', sortable: false, format: (value) => value?.length || 0, align: 'center', width: '10%' },
  {
    id: 'narrativeThreads', label: 'Narrative Threads', sortable: false, width: '20%',
    format: (value) => value?.length ? (
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {value.map((thread, i) => (
          <Chip key={i} label={thread} size="small" variant="outlined" color="secondary"/>
        ))}
      </Box>
    ) : <Typography variant="caption" color="textSecondary">N/A</Typography>
  },
];

const ACT_FOCUS_OPTIONS = ['All Acts', 'Act 1', 'Act 2', 'Act 3'];

function Puzzles() {
  const navigate = useNavigate();

  // State for filters
  const [actFocusFilter, setActFocusFilter] = useState('All Acts'); // Renamed from timing
  const [availableThemes, setAvailableThemes] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState({});
  const [availableNarrativeThreads, setAvailableNarrativeThreads] = useState([]);
  const [selectedNarrativeThread, setSelectedNarrativeThread] = useState('All Threads');

  // API filters (server-side) - For Puzzles, 'timing' was the only server-side filter.
  // If 'actFocus' in Notion is a different property than 'Timing', this needs adjustment.
  // For now, focusing on client-side filtering for new properties.
  const apiFilters = {};
  // if (actFocusFilter !== 'All Acts') apiFilters.actFocus = actFocusFilter; // Or apiFilters.timing = actFocusFilter if they are the same

  const { data: puzzles, isLoading, error, refetch } = useQuery(
    ['puzzles', apiFilters], // apiFilters might be empty if only doing client-side for new fields
    () => api.getPuzzles(apiFilters),
    { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
  );

  useEffect(() => {
    if (puzzles) {
      const themes = new Set();
      const narrativeThreads = new Set();
      puzzles.forEach(puzzle => {
        puzzle.properties?.themes?.forEach(theme => themes.add(theme));
        puzzle.narrativeThreads?.forEach(thread => narrativeThreads.add(thread));
      });

      const sortedThemes = Array.from(themes).sort();
      setAvailableThemes(sortedThemes);
      if (Object.keys(selectedThemes).length === 0 && sortedThemes.length > 0) {
        const initialSelectedThemes = {};
        sortedThemes.forEach(theme => initialSelectedThemes[theme] = true);
        setSelectedThemes(initialSelectedThemes);
      }

      setAvailableNarrativeThreads(Array.from(narrativeThreads).sort());
    }
  }, [puzzles, selectedThemes]);

  const handleRowClick = (row) => navigate(`/puzzles/${row.id}`);

  const handleActFocusChange = (event) => setActFocusFilter(event.target.value);
  const handleThemeChange = (themeName) => setSelectedThemes(prev => ({ ...prev, [themeName]: !prev[themeName] }));
  const handleSelectAllThemes = (selectAll) => {
    const newSelectedThemes = {};
    availableThemes.forEach(theme => newSelectedThemes[theme] = selectAll);
    setSelectedThemes(newSelectedThemes);
  };
  const handleNarrativeThreadChange = (event) => setSelectedNarrativeThread(event.target.value);

  const filteredPuzzles = useMemo(() => {
    if (!puzzles) return [];
    let currentPuzzles = [...puzzles];

    if (actFocusFilter !== 'All Acts') {
      currentPuzzles = currentPuzzles.filter(p => p.properties?.actFocus === actFocusFilter || p.timing === actFocusFilter); // Check both for transition
    }

    const activeThemeFilters = Object.entries(selectedThemes)
      .filter(([,isSelected]) => isSelected)
      .map(([themeName]) => themeName);
    if (activeThemeFilters.length > 0) {
      currentPuzzles = currentPuzzles.filter(p =>
        p.properties?.themes?.some(theme => activeThemeFilters.includes(theme))
      );
    }

    if (selectedNarrativeThread !== 'All Threads') {
      currentPuzzles = currentPuzzles.filter(p =>
        p.narrativeThreads?.includes(selectedNarrativeThread)
      );
    }
    return currentPuzzles;
  }, [puzzles, actFocusFilter, selectedThemes, selectedNarrativeThread]);

  const currentFilterCount = [actFocusFilter, selectedNarrativeThread]
    .filter(f => !f.startsWith('All ')).length +
    Object.values(selectedThemes).filter(Boolean).length;

  const emptyMessage = currentFilterCount > 0
    ? "No puzzles match your current filter criteria."
    : "No puzzles found.";

  return (
    <div>
      <PageHeader title="Puzzles" />
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 'medium'}}>Filter Options</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="puzzle-actfocus-label">Act Focus / Timing</InputLabel>
              <Select labelId="puzzle-actfocus-label" value={actFocusFilter} label="Act Focus / Timing" onChange={handleActFocusChange}>
                {ACT_FOCUS_OPTIONS.map((act) => (<MenuItem key={act} value={act}>{act}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="puzzle-narrative-thread-label">Narrative Thread</InputLabel>
              <Select labelId="puzzle-narrative-thread-label" value={selectedNarrativeThread} label="Narrative Thread" onChange={handleNarrativeThreadChange}>
                <MenuItem value="All Threads">All Threads</MenuItem>
                {availableNarrativeThreads.map((thread) => (<MenuItem key={thread} value={thread}>{thread}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} sx={{alignSelf: 'center'}}> {/* Refresh button aligned with other controls */}
             <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} fullWidth > Refresh </Button>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="caption" display="block" sx={{mb:0.5, ml:0.5}}>Filter by Themes</Typography>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1}}>
                 <Button size="small" variant="outlined" onClick={() => handleSelectAllThemes(true)} sx={{textTransform: 'none', fontSize: '0.75rem'}}>All</Button>
                 <Button size="small" variant="outlined" onClick={() => handleSelectAllThemes(false)} sx={{textTransform: 'none', fontSize: '0.75rem'}}>None</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {availableThemes.map((theme) => (
                <Chip key={theme} label={theme} clickable onClick={() => handleThemeChange(theme)}
                  color={selectedThemes[theme] ? 'primary' : 'default'}
                  variant={selectedThemes[theme] ? 'filled' : 'outlined'}
                  size="small"
                />
              ))}
              {availableThemes.length === 0 && <Typography variant="caption" color="textSecondary">No themes found in current data.</Typography>}
            </Box>
          </Grid>
        </Grid>
      </Paper>
      <Paper sx={{ p: {xs: 1, sm: 2} }}> {/* Adjusted padding */}
        <DataTable
          columns={columns}
          data={filteredPuzzles || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          initialSortBy="puzzle"
          initialSortDirection="asc"
          emptyMessage={emptyMessage}
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