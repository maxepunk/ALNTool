import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Chip, Typography, Paper, CircularProgress, Alert, Box, FormControl, InputLabel, Select, MenuItem, Button,
  Grid, Card, CardContent, LinearProgress, Tooltip, Avatar // Added for production intelligence
} from '@mui/material';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { useState, useEffect, useMemo } from 'react'; // Added useEffect, useMemo
import { useGameConstants, getConstant } from '../hooks/useGameConstants';
import RefreshIcon from '@mui/icons-material/Refresh';
import ExtensionIcon from '@mui/icons-material/Extension';
import GroupWorkIcon from '@mui/icons-material/GroupWork';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AddIcon from '@mui/icons-material/Add';

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

function Puzzles() {
  const navigate = useNavigate();

  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();

  // State for filters
  const [actFocusFilter, setActFocusFilter] = useState('All Acts'); // Renamed from timing

  // Early return if constants are still loading
  if (constantsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Puzzles...</Typography>
      </Box>
    );
  }
  const [availableThemes, setAvailableThemes] = useState([]);
  const [selectedThemes, setSelectedThemes] = useState({});
  const [availableNarrativeThreads, setAvailableNarrativeThreads] = useState([]);
  const [selectedNarrativeThread, setSelectedNarrativeThread] = useState('All Threads');

  // API filters (server-side) - For Puzzles, 'timing' was the only server-side filter.
  // If 'actFocus' in Notion is a different property than 'Timing', this needs adjustment.
  // For now, focusing on client-side filtering for new properties.
  const apiFilters = {};
  // if (actFocusFilter !== 'All Acts') apiFilters.actFocus = actFocusFilter; // Or apiFilters.timing = actFocusFilter if they are the same

  const { data: puzzles, isLoading, error, refetch } = useQuery({
    queryKey: ['puzzles', apiFilters], // apiFilters might be empty if only doing client-side for new fields
    queryFn: () => api.getPuzzles(apiFilters),
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000
  });

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

  // Production Intelligence Analytics
  const puzzleAnalytics = useMemo(() => {
    if (!puzzles) {
      const emptyActDistribution = {};
      const actTypes = getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2']);
      actTypes.forEach(act => {
        emptyActDistribution[act] = 0;
      });
      emptyActDistribution['Act 3'] = 0; // Legacy support
      
      return {
        totalPuzzles: 0,
        collaborativePuzzles: 0,
        soloExperiences: 0,
        actDistribution: emptyActDistribution,
        narrativeDistribution: {},
        rewardAnalysis: { totalRewards: 0, avgRewardsPerPuzzle: 0 },
        ownershipAnalysis: { assigned: 0, unassigned: 0 },
        complexityDistribution: {},
        issues: []
      };
    }

    const totalPuzzles = puzzles.length;

    // Collaborative vs solo analysis
    const collaborativePuzzles = puzzles.filter(p => 
      p.owner && p.owner.length > 1
    ).length;
    const soloExperiences = puzzles.filter(p => 
      !p.owner || p.owner.length <= 1
    ).length;

    // Act distribution
    const actTypes = getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2']);
    const actDistribution = {};
    actTypes.forEach(act => {
      actDistribution[act] = puzzles.filter(p => p.properties?.actFocus === act || p.timing === act).length;
    });
    // Include Act 3 as legacy support
    actDistribution['Act 3'] = puzzles.filter(p => p.properties?.actFocus === 'Act 3' || p.timing === 'Act 3').length;

    // Narrative thread distribution
    const narrativeDistribution = {};
    puzzles.forEach(p => {
      if (p.narrativeThreads && p.narrativeThreads.length > 0) {
        p.narrativeThreads.forEach(thread => {
          narrativeDistribution[thread] = (narrativeDistribution[thread] || 0) + 1;
        });
      }
    });

    // Reward analysis
    const totalRewards = puzzles.reduce((sum, p) => sum + (p.rewards?.length || 0), 0);
    const avgRewardsPerPuzzle = totalPuzzles > 0 ? (totalRewards / totalPuzzles).toFixed(1) : 0;

    // Ownership analysis
    const assigned = puzzles.filter(p => p.owner && p.owner.length > 0).length;
    const unassigned = totalPuzzles - assigned;

    // Complexity analysis (based on multiple factors)
    const highComplexityOwnersThreshold = getConstant(gameConstants, 'PUZZLES.HIGH_COMPLEXITY_OWNERS_THRESHOLD', 1);
    const highComplexityRewardsThreshold = getConstant(gameConstants, 'PUZZLES.HIGH_COMPLEXITY_REWARDS_THRESHOLD', 2);
    const mediumComplexityRewardsThreshold = getConstant(gameConstants, 'PUZZLES.MEDIUM_COMPLEXITY_REWARDS_THRESHOLD', 1);
    
    const complexityDistribution = {
      'High Complexity': puzzles.filter(p => 
        (p.owner?.length > highComplexityOwnersThreshold) && (p.rewards?.length > highComplexityRewardsThreshold)
      ).length,
      'Medium Complexity': puzzles.filter(p => 
        (p.owner?.length === 1 && p.rewards?.length > mediumComplexityRewardsThreshold) || 
        (p.owner?.length > highComplexityOwnersThreshold && p.rewards?.length <= highComplexityRewardsThreshold)
      ).length,
      'Low Complexity': puzzles.filter(p => 
        (!p.owner || p.owner.length === 0) || 
        (!p.rewards || p.rewards.length <= mediumComplexityRewardsThreshold)
      ).length
    };

    // Identify production issues
    const issues = [];
    
    const missingActFocus = puzzles.filter(p => 
      !p.properties?.actFocus && !p.timing
    ).length;
    if (missingActFocus > 0) {
      issues.push({
        type: 'missing-timing',
        severity: 'warning',
        message: `${missingActFocus} puzzles missing act/timing assignment`,
        action: 'Assign puzzles to specific acts for proper flow'
      });
    }

    const unassignedWarningThreshold = getConstant(gameConstants, 'PUZZLES.UNASSIGNED_WARNING_THRESHOLD', 0.3);
    if (unassigned > totalPuzzles * unassignedWarningThreshold) {
      issues.push({
        type: 'ownership-gaps',
        severity: 'warning',
        message: `${unassigned} puzzles have no assigned characters`,
        action: 'Assign character owners to improve narrative integration'
      });
    }

    const noRewards = puzzles.filter(p => !p.rewards || p.rewards.length === 0).length;
    const noRewardsWarningThreshold = getConstant(gameConstants, 'PUZZLES.NO_REWARDS_WARNING_THRESHOLD', 0.2);
    if (noRewards > totalPuzzles * noRewardsWarningThreshold) {
      issues.push({
        type: 'reward-economy',
        severity: 'info',
        message: `${noRewards} puzzles have no rewards defined`,
        action: 'Add meaningful rewards to enhance player motivation'
      });
    }

    const noNarrativeThreads = puzzles.filter(p => !p.narrativeThreads || p.narrativeThreads.length === 0).length;
    const noNarrativeThreadsWarningThreshold = getConstant(gameConstants, 'PUZZLES.NO_NARRATIVE_THREADS_WARNING_THRESHOLD', 0.4);
    if (noNarrativeThreads > totalPuzzles * noNarrativeThreadsWarningThreshold) {
      issues.push({
        type: 'narrative-isolation',
        severity: 'info',
        message: `${noNarrativeThreads} puzzles not connected to narrative threads`,
        action: 'Link puzzles to story elements for better coherence'
      });
    }

    return {
      totalPuzzles,
      collaborativePuzzles,
      soloExperiences,
      actDistribution,
      narrativeDistribution,
      rewardAnalysis: { totalRewards, avgRewardsPerPuzzle },
      ownershipAnalysis: { assigned, unassigned },
      complexityDistribution,
      issues
    };
  }, [puzzles, gameConstants]);

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

  const handleAddPuzzle = () => alert('This feature will be available in Phase 3 (Editing Capabilities)');

  return (
    <div>
      <PageHeader 
        title="Puzzle Design Hub" 
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<RefreshIcon />} onClick={() => refetch()} > Refresh </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleAddPuzzle} > Add Puzzle </Button>
          </Box>
        }
      />

      {/* Production Intelligence Dashboard */}
      {!isLoading && puzzles && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Puzzle Overview */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <ExtensionIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Puzzle Collection</Typography>
                  </Box>
                  <Typography variant="h3" color="primary">{puzzleAnalytics.totalPuzzles}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total game puzzles
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">Complexity:</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip label={`High: ${puzzleAnalytics.complexityDistribution['High Complexity'] || 0}`} size="small" color="error" />
                      <Chip label={`Med: ${puzzleAnalytics.complexityDistribution['Medium Complexity'] || 0}`} size="small" color="warning" />
                      <Chip label={`Low: ${puzzleAnalytics.complexityDistribution['Low Complexity'] || 0}`} size="small" color="success" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Collaboration Analysis */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupWorkIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Social Dynamics</Typography>
                  </Box>
                  <Typography variant="h3" color="secondary">{puzzleAnalytics.collaborativePuzzles}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Collaborative puzzles
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={puzzleAnalytics.totalPuzzles > 0 ? (puzzleAnalytics.collaborativePuzzles / puzzleAnalytics.totalPuzzles * 100) : 0}
                    sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
                    color="secondary"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {puzzleAnalytics.soloExperiences} solo experiences
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Reward Economy */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AccountTreeIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Reward Economy</Typography>
                  </Box>
                  <Typography variant="h3" color="warning">{puzzleAnalytics.rewardAnalysis.totalRewards}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total puzzle rewards
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      {puzzleAnalytics.rewardAnalysis.avgRewardsPerPuzzle} avg per puzzle
                    </Typography>
                  </Box>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Ownership: {puzzleAnalytics.ownershipAnalysis.assigned} assigned
                    </Typography>
                  </Box>
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
                      <Typography variant="h6" color="primary">{puzzleAnalytics.actDistribution['Act 1']}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Act 2</Typography>
                      <Typography variant="h6" color="secondary">{puzzleAnalytics.actDistribution['Act 2']}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2">Act 3</Typography>
                      <Typography variant="h6" color="info">{puzzleAnalytics.actDistribution['Act 3']}</Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Production Issues Alert */}
          {puzzleAnalytics.issues.length > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={() => navigate('/puzzle-flow')}>
                  View Puzzle Flow
                </Button>
              }
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {puzzleAnalytics.issues.length} design issue(s) detected:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                {puzzleAnalytics.issues.slice(0, 2).map((issue, index) => (
                  <li key={index}>
                    <Typography variant="body2">{issue.message}</Typography>
                  </li>
                ))}
                {puzzleAnalytics.issues.length > 2 && (
                  <li>
                    <Typography variant="body2">+{puzzleAnalytics.issues.length - 2} more issues</Typography>
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
          <Grid item xs={12} sm={6} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel id="puzzle-actfocus-label">Act Focus / Timing</InputLabel>
              <Select labelId="puzzle-actfocus-label" value={actFocusFilter} label="Act Focus / Timing" onChange={handleActFocusChange}>
                {['All Acts'].concat(getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2'])).concat(['Act 3']).map((act) => (<MenuItem key={act} value={act}>{act}</MenuItem>))}
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