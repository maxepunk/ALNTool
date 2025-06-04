import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Chip, Typography, Paper, CircularProgress, Alert, FormControl, InputLabel, Select, MenuItem, Button,
  Box, Grid // Added Box, Grid
} from '@mui/material';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { useState, useEffect, useMemo } from 'react'; // Added useEffect, useMemo
import RefreshIcon from '@mui/icons-material/Refresh';

// Table column definitions
const columns = [
  { id: 'description', label: 'Description', sortable: true, width: '40%' },
  { id: 'date', label: 'Date', sortable: true, width: '15%' },
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
  {
    id: 'charactersInvolved', label: 'Characters (Count)', sortable: false, // Sort by length might be complex
    format: (value) => value?.length || 0,
    align: 'center', width: '15%'
  },
];

const MEM_TYPE_OPTIONS = ['All Types', 'Prop', 'Set Dressing', 'Memory Token Video', 'Memory Token Audio', 'Memory Token Physical', 'Corrupted Memory RFID'];
const ACT_FOCUS_OPTIONS = ['All Acts', 'Act 1', 'Act 2', 'Act 3'];

function Timeline() {
  const navigate = useNavigate();

  // State for filters
  const [memType, setMemType] = useState('All Types');
  const [actFocusFilter, setActFocusFilter] = useState('All Acts');
  const [availableThemes, setAvailableThemes] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState({});

  // API filters (server-side)
  const apiFilters = {};
  if (memType !== 'All Types') apiFilters.memType = memType;
  // If actFocus is a server-side filterable 'Select' property in Notion for Timeline:
  // if (actFocusFilter !== 'All Acts') apiFilters.actFocus = actFocusFilter;

  const { data: events, isLoading, error, refetch } = useQuery(
    ['timelineEvents', apiFilters],
    () => api.getTimelineEvents(apiFilters),
    { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
  );

  useEffect(() => {
    if (events) {
      const themes = new Set();
      events.forEach(event => {
        event.properties?.themes?.forEach(theme => themes.add(theme));
      });
      const sortedThemes = Array.from(themes).sort();
      setAvailableThemes(sortedThemes);
      if (Object.keys(selectedThemes).length === 0 && sortedThemes.length > 0) {
        const initialSelectedThemes = {};
        sortedThemes.forEach(theme => initialSelectedThemes[theme] = true);
        setSelectedThemes(initialSelectedThemes);
      }
    }
  }, [events, selectedThemes]);

  const handleRowClick = (row) => navigate(`/timelines/${row.id}`);

  const handleMemTypeChange = (event) => setMemType(event.target.value);
  const handleActFocusChange = (event) => setActFocusFilter(event.target.value);
  const handleThemeChange = (themeName) => setSelectedThemes(prev => ({ ...prev, [themeName]: !prev[themeName] }));
  const handleSelectAllThemes = (selectAll) => {
    const newSelectedThemes = {};
    availableThemes.forEach(theme => newSelectedThemes[theme] = selectAll);
    setSelectedThemes(newSelectedThemes);
  };

  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let currentEvents = [...events];

    if (actFocusFilter !== 'All Acts') {
      currentEvents = currentEvents.filter(event => event.properties?.actFocus === actFocusFilter);
    }

    const activeThemeFilters = Object.entries(selectedThemes)
      .filter(([,isSelected]) => isSelected)
      .map(([themeName]) => themeName);
    if (activeThemeFilters.length > 0) {
      currentEvents = currentEvents.filter(event =>
        event.properties?.themes?.some(theme => activeThemeFilters.includes(theme))
      );
    }
    return currentEvents;
  }, [events, actFocusFilter, selectedThemes]);

  const currentFilterCount = [memType, actFocusFilter]
    .filter(f => !f.startsWith('All ')).length +
    Object.values(selectedThemes).filter(Boolean).length;

  const emptyMessage = currentFilterCount > 0
    ? "No timeline events match your current filter criteria."
    : "No timeline events found.";

  return (
    <div>
      <PageHeader title="Timeline Events" />
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 'medium'}}>Filter Options</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="timeline-memtype-label">Memory/Evidence Type</InputLabel>
              <Select labelId="timeline-memtype-label" value={memType} label="Memory/Evidence Type" onChange={handleMemTypeChange}>
                {MEM_TYPE_OPTIONS.map((t) => (<MenuItem key={t} value={t}>{t}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="timeline-actfocus-label">Act Focus</InputLabel>
              <Select labelId="timeline-actfocus-label" value={actFocusFilter} label="Act Focus" onChange={handleActFocusChange}>
                {ACT_FOCUS_OPTIONS.map((act) => (<MenuItem key={act} value={act}>{act}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={4} sx={{alignSelf: 'center'}}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} fullWidth>Refresh</Button>
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
      <Paper sx={{ p: {xs:1, sm:2} }}>
        <DataTable
          columns={columns}
          data={filteredEvents || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          initialSortBy="date"
          initialSortDirection="asc"
          emptyMessage={emptyMessage}
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