import { useState, useEffect, useMemo } from 'react'; // Added useEffect, useMemo
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Chip, Button, Box, Select, MenuItem, FormControl, InputLabel, Grid, Paper, Alert, Skeleton,
  Typography, List, ListItem, ListItemText, Checkbox, Collapse, Card, CardContent, LinearProgress,
  Tooltip, Avatar, Badge, CircularProgress // Added for production intelligence
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import MemoryIcon from '@mui/icons-material/Memory';
import ExtensionIcon from '@mui/icons-material/Extension';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import AssessmentIcon from '@mui/icons-material/Assessment';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { useGameConstants, getConstant } from '../hooks/useGameConstants';

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
  
  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();
  
  const queryParams = new URLSearchParams(location.search);
  const typeFromQuery = queryParams.get('type');

  // Early return if constants are still loading
  if (constantsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Elements...</Typography>
      </Box>
    );
  }
  
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
  
  const { data: elements, isLoading, error, refetch } = useQuery({
    queryKey: ['elements', apiFilters], // Use apiFilters for query key
    queryFn: () => api.getElements(apiFilters),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

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

  // Production Intelligence Analytics
  const elementAnalytics = useMemo(() => {
    if (!elements) return {
      totalElements: 0,
      memoryTokens: { total: 0, ready: 0, inDevelopment: 0 },
      productionStatus: { ready: 0, inProgress: 0, needsWork: 0 },
      actDistribution: { 'Act 1': 0, 'Act 2': 0, 'Act 3': 0 },
      typeDistribution: {},
      issues: []
    };

    const totalElements = elements.length;

    // Memory token analysis
    const memoryElements = elements.filter(el => 
      el.basicType?.toLowerCase().includes('memory') ||
      el.name?.toLowerCase().includes('memory') ||
      el.basicType?.toLowerCase().includes('token')
    );
    const memoryTokensReady = memoryElements.filter(el => 
      el.status === 'Ready for Playtest' || el.status === 'Done'
    ).length;
    const memoryTokensInDev = memoryElements.filter(el => 
      el.status === 'In development'
    ).length;

    // Production status analysis
    const readyElements = elements.filter(el => 
      el.status === 'Ready for Playtest' || el.status === 'Done'
    ).length;
    const inProgressElements = elements.filter(el => 
      el.status === 'In development' || el.status === 'To Build'
    ).length;
    const needsWorkElements = elements.filter(el => 
      el.status === 'Idea/Placeholder' || el.status === 'To Design'
    ).length;

    // Act distribution
    const actDistribution = {
      'Act 1': elements.filter(el => el.properties?.actFocus === 'Act 1').length,
      'Act 2': elements.filter(el => el.properties?.actFocus === 'Act 2').length,
      'Act 3': elements.filter(el => el.properties?.actFocus === 'Act 3').length
    };

    // Type distribution
    const typeDistribution = {};
    elements.forEach(el => {
      const type = el.basicType || 'Unknown';
      typeDistribution[type] = (typeDistribution[type] || 0) + 1;
    });

    // Identify production issues
    const issues = [];
    
    const memoryWarningThreshold = getConstant(gameConstants, 'ELEMENTS.MEMORY_TOKEN_WARNING_THRESHOLD', 45);
    const targetTokenCount = getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55);
    const memoryReadinessThreshold = getConstant(gameConstants, 'ELEMENTS.MEMORY_READINESS_THRESHOLD', 0.8);
    const overallReadinessThreshold = getConstant(gameConstants, 'ELEMENTS.OVERALL_READINESS_THRESHOLD', 0.7);

    if (memoryElements.length < memoryWarningThreshold) {
      issues.push({
        type: 'memory-shortage',
        severity: 'warning',
        message: `Only ${memoryElements.length} memory tokens found (target: ${targetTokenCount})`,
        action: 'Add more memory tokens to reach target economy'
      });
    }

    if (memoryTokensReady < memoryElements.length * memoryReadinessThreshold) {
      issues.push({
        type: 'memory-production',
        severity: 'warning',
        message: `${memoryElements.length - memoryTokensReady} memory tokens not ready for production`,
        action: 'Complete memory token production pipeline'
      });
    }

    if (readyElements < totalElements * overallReadinessThreshold) {
      issues.push({
        type: 'production-readiness',
        severity: 'info',
        message: `${totalElements - readyElements} elements still in development`,
        action: 'Focus on completing high-priority elements'
      });
    }

    const missingActFocus = elements.filter(el => !el.properties?.actFocus).length;
    if (missingActFocus > 0) {
      issues.push({
        type: 'missing-act-focus',
        severity: 'info',
        message: `${missingActFocus} elements missing act focus assignment`,
        action: 'Assign elements to specific acts for better organization'
      });
    }

    return {
      totalElements,
      memoryTokens: { 
        total: memoryElements.length, 
        ready: memoryTokensReady, 
        inDevelopment: memoryTokensInDev 
      },
      productionStatus: { 
        ready: readyElements, 
        inProgress: inProgressElements, 
        needsWork: needsWorkElements 
      },
      actDistribution,
      typeDistribution,
      issues
    };
  }, [elements]);

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
        title="Element Production Hub" 
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} > Refresh </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddElement} > Add Element </Button>
          </Box>
        }
      />

      {/* Production Intelligence Dashboard */}
      {!isLoading && elements && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Element Overview */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ExtensionIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Element Library</Typography>
                  </Box>
                  <Typography variant="h3" color="primary">{elementAnalytics.totalElements}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total game elements
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">Type Breakdown:</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      {Object.entries(elementAnalytics.typeDistribution).slice(0, 3).map(([type, count]) => (
                        <Chip key={type} label={`${type}: ${count}`} size="small" color="default" />
                      ))}
                      {Object.keys(elementAnalytics.typeDistribution).length > 3 && (
                        <Chip label={`+${Object.keys(elementAnalytics.typeDistribution).length - 3} more`} size="small" color="default" />
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Memory Economy */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MemoryIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Memory Economy</Typography>
                  </Box>
                  <Typography variant="h3" color="secondary">{elementAnalytics.memoryTokens.total}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Memory tokens in game
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(elementAnalytics.memoryTokens.total / getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55)) * 100}
                    sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
                    color={elementAnalytics.memoryTokens.total >= getConstant(gameConstants, 'MEMORY_VALUE.MIN_TOKEN_COUNT', 50) ? 'success' : 'warning'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Target: {getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55)} tokens ({elementAnalytics.memoryTokens.ready} ready)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Production Status */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <BuildIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Production Status</Typography>
                  </Box>
                  <Typography variant="h3" color="success">{elementAnalytics.productionStatus.ready}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Elements ready for production
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={elementAnalytics.totalElements > 0 ? (elementAnalytics.productionStatus.ready / elementAnalytics.totalElements * 100) : 0}
                    sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
                    color="success"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {elementAnalytics.productionStatus.inProgress} in progress, {elementAnalytics.productionStatus.needsWork} need work
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Act Distribution */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Act Distribution</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Act 1</Typography>
                      <Typography variant="h6" color="primary">{elementAnalytics.actDistribution['Act 1']}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Act 2</Typography>
                      <Typography variant="h6" color="secondary">{elementAnalytics.actDistribution['Act 2']}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Act 3</Typography>
                      <Typography variant="h6" color="info">{elementAnalytics.actDistribution['Act 3']}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Production Issues Alert */}
          {elementAnalytics.issues.length > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={() => navigate('/memory-economy')}>
                  View Memory Dashboard
                </Button>
              }
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {elementAnalytics.issues.length} production issue(s) detected:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                {elementAnalytics.issues.slice(0, 2).map((issue, index) => (
                  <li key={index}>
                    <Typography variant="body2">{issue.message}</Typography>
                  </li>
                ))}
                {elementAnalytics.issues.length > 2 && (
                  <li>
                    <Typography variant="body2">+{elementAnalytics.issues.length - 2} more issues</Typography>
                  </li>
                )}
              </Box>
            </Alert>
          )}
        </>
      )}
      
      <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
        <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 'medium'}}>Production Filters</Typography>
        <Grid container spacing={2}>
          {/* Existing Filters */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-type-label">Element Type</InputLabel>
              <Select labelId="element-type-label" value={elementType} label="Element Type" onChange={handleTypeChange}>
                {['All Types'].concat(getConstant(gameConstants, 'ELEMENTS.CATEGORIES', ['Prop', 'Set Dressing', 'Memory Token Video', 'Character Sheet'])).map((type) => (<MenuItem key={type} value={type}>{type}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-status-label">Status</InputLabel>
              <Select labelId="element-status-label" value={status} label="Status" onChange={handleStatusChange}>
                {['All Statuses'].concat(getConstant(gameConstants, 'ELEMENTS.STATUS_TYPES', ['Ready for Playtest', 'Done', 'In development', 'Idea/Placeholder', 'Source Prop/print', 'To Design', 'To Build', 'Needs Repair'])).map((s) => (<MenuItem key={s} value={s}>{s}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-first-available-label">First Available</InputLabel>
              <Select labelId="element-first-available-label" value={firstAvailable} label="First Available" onChange={handleFirstAvailableChange}>
                {['All Acts', 'Act 0'].concat(getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2'])).concat(['Act 3']).map((fa) => (<MenuItem key={fa} value={fa}>{fa}</MenuItem>))}
              </Select>
            </FormControl>
          </Grid>
           {/* New Act Focus Filter */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="element-act-focus-label">Act Focus</InputLabel>
              <Select labelId="element-act-focus-label" value={actFocusFilter} label="Act Focus" onChange={handleActFocusChange}>
                {['All Acts'].concat(getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2'])).concat(['Act 3']).map((act) => (<MenuItem key={act} value={act}>{act}</MenuItem>))}
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