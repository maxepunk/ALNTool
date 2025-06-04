import { useState, useEffect, useMemo } from 'react'; // Added useEffect, useMemo
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from 'react-query';
import {
  Chip, Button, Box, Select, MenuItem, FormControl, InputLabel, Grid, Paper, Alert, Skeleton,
  Typography, List, ListItem, ListItemText, Checkbox, Collapse // Added for Theme filter
} from '@mui/material';
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
  'Act 3', // Added Act 3
];

const ACT_FOCUS_OPTIONS = ['All Acts', 'Act 1', 'Act 2', 'Act 3']; // For new Act Focus filter

// Table column definitions
const columns = [
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
  // { id: 'description', label: 'Description', sortable: true }, // Too long for main view, visible in detail
  // { id: 'owner', label: 'Owner', sortable: true,
  //   format: (value) => value?.length ? `${value.length} Character(s)` : 'None'
  // },
];

function Elements() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const typeFromQuery = queryParams.get('type');
  
  // Existing Filters
  const [elementType, setElementType] = useState(typeFromQuery || 'All Types');
  const [status, setStatus] = useState('All Statuses');
  const [firstAvailable, setFirstAvailable] = useState('All Acts'); // This might be redundant if Act Focus is used

  // New Filters State
  const [actFocusFilter, setActFocusFilter] = useState('All Acts');
  const [availableThemes, setAvailableThemes] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState({}); // {'Theme Name': true/false}
  const [availableMemorySets, setAvailableMemorySets] = useState([]);
  const [selectedMemorySet, setSelectedMemorySet] = useState('All Sets');
  
  // Build filters object for API (currently only supports exact matches on predefined fields)
  const apiFilters = {};
  if (elementType !== 'All Types') apiFilters.type = elementType;
  if (status !== 'All Statuses') apiFilters.status = status;
  // 'firstAvailable' is also a server-side filter, keep if still needed alongside actFocusFilter
  if (firstAvailable !== 'All Acts') apiFilters.firstAvailable = firstAvailable;
  
  const { data: elements, isLoading, error, refetch } = useQuery(
    ['elements', apiFilters], // Use apiFilters for query key
    () => api.getElements(apiFilters),
    { staleTime: 5 * 60 * 1000, cacheTime: 10 * 60 * 1000 }
  );

  // Effect to populate available themes and memory sets for client-side filtering
  useEffect(() => {
    if (elements) {
      const themes = new Set();
      const memorySets = new Set();
      elements.forEach(el => {
        el.properties?.themes?.forEach(theme => themes.add(theme));
        el.properties?.memorySets?.forEach(set => memorySets.add(set));
      });

      const sortedThemes = Array.from(themes).sort();
      setAvailableThemes(sortedThemes);
      // Initialize selectedThemes: all true by default
      if (Object.keys(selectedThemes).length === 0 && sortedThemes.length > 0) {
        const initialSelectedThemes = {};
        sortedThemes.forEach(theme => initialSelectedThemes[theme] = true);
        setSelectedThemes(initialSelectedThemes);
      }

      setAvailableMemorySets(Array.from(memorySets).sort());
    }
  }, [elements, selectedThemes]); // selectedThemes added to prevent re-init if already set

  const handleRowClick = (row) => {
    navigate(`/elements/${row.id}`);
  };
  
  // Filter handlers
  const handleTypeChange = (event) => {
    const newType = event.target.value;
    setElementType(newType);
    const params = new URLSearchParams();
    if (newType !== 'All Types') params.set('type', newType);
    navigate({ pathname: '/elements', search: params.toString() });
  };
  const handleStatusChange = (event) => setStatus(event.target.value);
  const handleFirstAvailableChange = (event) => setFirstAvailable(event.target.value);
  const handleActFocusChange = (event) => setActFocusFilter(event.target.value);
  const handleThemeChange = (themeName) => {
    setSelectedThemes(prev => ({ ...prev, [themeName]: !prev[themeName] }));
  };
  const handleSelectAllThemes = (selectAll) => {
    const newSelectedThemes = {};
    availableThemes.forEach(theme => newSelectedThemes[theme] = selectAll);
    setSelectedThemes(newSelectedThemes);
  };
  const handleMemorySetChange = (event) => setSelectedMemorySet(event.target.value);

  const filteredElements = useMemo(() => {
    if (!elements) return [];
    let currentElements = [...elements];

    // Apply server-side fetched filters first (already handled by useQuery keying)
    // Then apply client-side filters
    if (actFocusFilter !== 'All Acts') {
      currentElements = currentElements.filter(el => el.properties?.actFocus === actFocusFilter);
    }

    const activeThemeFilters = Object.entries(selectedThemes)
      .filter(([,isSelected]) => isSelected)
      .map(([themeName]) => themeName);

    if (activeThemeFilters.length > 0) {
      currentElements = currentElements.filter(el =>
        el.properties?.themes?.some(theme => activeThemeFilters.includes(theme))
      );
    }

    if (selectedMemorySet !== 'All Sets') {
      currentElements = currentElements.filter(el =>
        el.properties?.memorySets?.includes(selectedMemorySet)
      );
    }
    return currentElements;
  }, [elements, actFocusFilter, selectedThemes, selectedMemorySet]);

  const handleAddElement = () => alert('This feature will be available in Phase 3 (Editing Capabilities)');
  
  const currentFilterCount = [elementType, status, firstAvailable, actFocusFilter, selectedMemorySet]
    .filter(f => !f.startsWith('All ')).length +
    Object.values(selectedThemes).filter(Boolean).length;

  const emptyMessage = currentFilterCount > 0
    ? "No elements match your current filter criteria."
    : "No elements found. Try adding some!";

  return (
    <div>
      <PageHeader 
        title="Elements & Memories" 
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} > Refresh </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddElement} > Add Element </Button>
          </Box>
        }
      />
      
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 'medium'}}>Filter Options</Typography>
        <Grid container spacing={2}>
          {/* Existing Filters */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-type-label">Element Type</InputLabel>
              <Select labelId="element-type-label" value={elementType} label="Element Type" onChange={handleTypeChange}>
                {ELEMENT_TYPES.map((type) => (<MenuItem key={type} value={type}>{type}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-status-label">Status</InputLabel>
              <Select labelId="element-status-label" value={status} label="Status" onChange={handleStatusChange}>
                {STATUS_OPTIONS.map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-first-available-label">First Available</InputLabel>
              <Select labelId="element-first-available-label" value={firstAvailable} label="First Available" onChange={handleFirstAvailableChange}>
                {FIRST_AVAILABLE_OPTIONS.map((fa) => (<MenuItem key={fa} value={fa}>{fa}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
           {/* New Act Focus Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-act-focus-label">Act Focus</InputLabel>
              <Select labelId="element-act-focus-label" value={actFocusFilter} label="Act Focus" onChange={handleActFocusChange}>
                {ACT_FOCUS_OPTIONS.map((act) => (<MenuItem key={act} value={act}>{act}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          {/* New Memory Set Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-memory-set-label">Memory Set</InputLabel>
              <Select labelId="element-memory-set-label" value={selectedMemorySet} label="Memory Set" onChange={handleMemorySetChange}>
                <MenuItem value="All Sets">All Sets</MenuItem>
                {availableMemorySets.map((set) => (<MenuItem key={set} value={set}>{set}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
           {/* New Themes Filter */}
          <Grid item xs={12} md={9}> {/* Wider for theme chips */}
            <Typography variant="caption" display="block" sx={{mb:0.5, ml:0.5}}>Filter by Themes</Typography>
            <Box sx={{display: 'flex', alignItems: 'center', gap: 1, mb: 1}}>
                 <Button size="small" variant="outlined" onClick={() => handleSelectAllThemes(true)} sx={{textTransform: 'none', fontSize: '0.75rem'}}>All</Button>
                 <Button size="small" variant="outlined" onClick={() => handleSelectAllThemes(false)} sx={{textTransform: 'none', fontSize: '0.75rem'}}>None</Button>
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {availableThemes.map((theme) => (
                <Chip
                  key={theme}
                  label={theme}
                  clickable
                  onClick={() => handleThemeChange(theme)}
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
      
      {isLoading && !elements ? (
        <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 1, mb: 1 }} />
      ) : (
        <DataTable 
          columns={columns}
          data={filteredElements || []}
          isLoading={isLoading}
          onRowClick={handleRowClick}
          initialSortBy="name"
          initialSortDirection="asc"
          emptyMessage={emptyMessage}
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