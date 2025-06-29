import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Chip, Button, Typography, Paper, Skeleton, FormControl, InputLabel, Select, MenuItem, 
  Box, Grid, Tooltip, Card, CardContent, LinearProgress, Alert, Avatar, AvatarGroup,
  List, ListItem, ListItemText, ListItemIcon, Divider, Badge, CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import PersonIcon from '@mui/icons-material/Person';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Black Market
import SearchIcon from '@mui/icons-material/Search'; // Detective
import GroupsIcon from '@mui/icons-material/Groups'; // Third Path
import MemoryIcon from '@mui/icons-material/Memory';
import ExtensionIcon from '@mui/icons-material/Extension';
import TimelineIcon from '@mui/icons-material/Timeline';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import DataTable from '../components/DataTable';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { useState, useMemo } from 'react';
import { useGameConstants, getConstant } from '../hooks/useGameConstants';

// Enhanced table columns with production intelligence
const columns = [
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

function Characters() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();
  
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [tierFilter, setTierFilter] = useState('All Tiers');
  const [pathFilter, setPathFilter] = useState('All Paths');

  // Early return if constants are still loading
  if (constantsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Characters...</Typography>
      </Box>
    );
  }
  
  const filters = {};
  if (typeFilter !== 'All Types') filters.type = typeFilter;
  if (tierFilter !== 'All Tiers') filters.tier = tierFilter;
  
  const { data: characters, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['characters', filters],
    queryFn: () => api.getAllCharactersWithSociogramData(filters),
    staleTime: 5 * 60 * 1000
  });

  // Production Intelligence Analytics
  const characterAnalytics = useMemo(() => {
    if (!characters) return {
      totalCharacters: 0,
      pathDistribution: {},
      tierDistribution: {},
      productionReadiness: { ready: 0, needsWork: 0 },
      memoryEconomy: { totalTokens: 0, avgPerCharacter: 0 },
      socialNetwork: { connected: 0, isolated: 0 },
      issues: []
    };

    // Filter characters based on path filter
    let filteredCharacters = characters;
    if (pathFilter !== 'All Paths') {
      if (pathFilter === 'Unassigned') {
        filteredCharacters = characters.filter(char => !char.resolutionPaths || char.resolutionPaths.length === 0);
      } else {
        filteredCharacters = characters.filter(char => char.resolutionPaths && char.resolutionPaths.includes(pathFilter));
      }
    }

    const totalCharacters = filteredCharacters.length;

    // Path distribution analysis
    const knownPaths = getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path']);
    const unassignedPath = getConstant(gameConstants, 'RESOLUTION_PATHS.DEFAULT', 'Unassigned');
    
    const pathDistribution = {};
    knownPaths.forEach(path => {
      pathDistribution[path] = filteredCharacters.filter(char => char.resolutionPaths?.includes(path)).length;
    });
    pathDistribution[unassignedPath] = filteredCharacters.filter(char => !char.resolutionPaths || char.resolutionPaths.length === 0).length;

    // Tier distribution
    const characterTiers = getConstant(gameConstants, 'CHARACTERS.TIERS', ['Core', 'Secondary', 'Tertiary']);
    const tierDistribution = {};
    characterTiers.forEach(tier => {
      tierDistribution[tier] = filteredCharacters.filter(char => char.tier === tier).length;
    });

    // Production readiness (characters with proper path assignments and connections)
    const ready = filteredCharacters.filter(char => 
      char.resolutionPaths && char.resolutionPaths.length > 0 && 
      char.character_links && char.character_links.length > 0
    ).length;
    const needsWork = totalCharacters - ready;

    // Memory economy analysis
    const totalMemoryTokens = filteredCharacters.reduce((sum, char) => {
      const memoryTokens = char.ownedElements?.filter(el => 
        el.properties?.basicType?.toLowerCase().includes('memory') ||
        el.properties?.basicType?.toLowerCase().includes('token') ||
        el.properties?.basicType?.toLowerCase().includes('rfid')
      ) || [];
      return sum + memoryTokens.length;
    }, 0);
    const avgPerCharacter = totalCharacters > 0 ? (totalMemoryTokens / totalCharacters).toFixed(1) : 0;

    // Social network analysis
    const connected = filteredCharacters.filter(char => char.character_links && char.character_links.length > 0).length;
    const isolated = totalCharacters - connected;

    // Identify production issues
    const issues = [];
    const unassignedWarningThreshold = getConstant(gameConstants, 'CHARACTERS.UNASSIGNED_WARNING_THRESHOLD', 0.2);
    const isolatedWarningThreshold = getConstant(gameConstants, 'CHARACTERS.ISOLATED_WARNING_THRESHOLD', 0.15);
    const pathImbalanceThreshold = getConstant(gameConstants, 'CHARACTERS.PATH_IMBALANCE_THRESHOLD', 0.4);
    const memoryWarningThreshold = getConstant(gameConstants, 'ELEMENTS.MEMORY_TOKEN_WARNING_THRESHOLD', 45);
    const targetTokenCount = getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55);

    if (pathDistribution[unassignedPath] > totalCharacters * unassignedWarningThreshold) {
      issues.push({
        type: 'path-assignment',
        severity: 'warning',
        message: `${pathDistribution[unassignedPath]} characters need resolution path assignment`,
        action: 'Assign characters to narrative paths'
      });
    }

    if (isolated > totalCharacters * isolatedWarningThreshold) {
      issues.push({
        type: 'social-isolation',
        severity: 'warning', 
        message: `${isolated} characters have no social connections`,
        action: 'Add character relationships and interactions'
      });
    }

    const maxPath = Math.max(...Object.values(pathDistribution));
    const minPath = Math.min(...Object.values(pathDistribution));
    if (maxPath - minPath > totalCharacters * pathImbalanceThreshold) {
      issues.push({
        type: 'path-imbalance',
        severity: 'info',
        message: 'Uneven distribution across resolution paths',
        action: 'Redistribute characters for better balance'
      });
    }

    if (totalMemoryTokens < memoryWarningThreshold) {
      issues.push({
        type: 'memory-economy',
        severity: 'info',
        message: `Memory token count below target (${targetTokenCount} tokens)`,
        action: 'Add more memory tokens to character inventories'
      });
    }

    return {
      totalCharacters,
      pathDistribution,
      tierDistribution,
      productionReadiness: { ready, needsWork },
      memoryEconomy: { totalTokens: totalMemoryTokens, avgPerCharacter },
      socialNetwork: { connected, isolated },
      issues
    };
  }, [characters, pathFilter]);
  
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
  
  // Filter characters for table display based on path filter
  const filteredCharactersForTable = useMemo(() => {
    if (!characters || pathFilter === 'All Paths') return characters || [];
    
    if (pathFilter === 'Unassigned') {
      return characters.filter(char => !char.resolutionPaths || char.resolutionPaths.length === 0);
    } else {
      return characters.filter(char => char.resolutionPaths && char.resolutionPaths.includes(pathFilter));
    }
  }, [characters, pathFilter]);

  return (
    <Box>
      <PageHeader 
        title="Character Production Hub" 
        action={
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
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

      {/* Production Intelligence Dashboard */}
      {!isLoading && characters && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Character Overview */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <PersonIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Character Roster</Typography>
                  </Box>
                  <Typography variant="h3" color="primary">{characterAnalytics.totalCharacters}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total characters in About Last Night
                  </Typography>
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">Tier Distribution:</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>
                      <Chip label={`Core: ${characterAnalytics.tierDistribution.Core || 0}`} size="small" color="success" />
                      <Chip label={`Sec: ${characterAnalytics.tierDistribution.Secondary || 0}`} size="small" color="info" />
                      <Chip label={`Ter: ${characterAnalytics.tierDistribution.Tertiary || 0}`} size="small" color="default" />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Three-Path Balance */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="secondary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Path Balance</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <AccountBalanceIcon sx={{ fontSize: 16, mr: 0.5, color: 'warning.main' }} />
                        <Typography variant="body2">Black Market</Typography>
                      </Box>
                      <Typography variant="h6" color="warning.main">{characterAnalytics.pathDistribution['Black Market'] || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <SearchIcon sx={{ fontSize: 16, mr: 0.5, color: 'error.main' }} />
                        <Typography variant="body2">Detective</Typography>
                      </Box>
                      <Typography variant="h6" color="error.main">{characterAnalytics.pathDistribution['Detective'] || 0}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <GroupsIcon sx={{ fontSize: 16, mr: 0.5, color: 'secondary.main' }} />
                        <Typography variant="body2">Third Path</Typography>
                      </Box>
                      <Typography variant="h6" color="secondary.main">{characterAnalytics.pathDistribution['Third Path'] || 0}</Typography>
                    </Box>
                    {characterAnalytics.pathDistribution['Unassigned'] > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <WarningIcon sx={{ fontSize: 16, mr: 0.5, color: 'grey.500' }} />
                          <Typography variant="body2">Unassigned</Typography>
                        </Box>
                        <Typography variant="h6" color="warning.main">{characterAnalytics.pathDistribution['Unassigned'] || 0}</Typography>
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Memory Economy */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MemoryIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Memory Economy</Typography>
                  </Box>
                  <Typography variant="h3" color="info">{characterAnalytics.memoryEconomy.totalTokens}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total memory tokens
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(characterAnalytics.memoryEconomy.totalTokens / 55) * 100}
                    sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
                    color={characterAnalytics.memoryEconomy.totalTokens >= 50 ? 'success' : 'warning'}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {characterAnalytics.memoryEconomy.avgPerCharacter} avg per character
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            {/* Production Readiness */}
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AssessmentIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Production Ready</Typography>
                  </Box>
                  <Typography variant="h3" color="success">{characterAnalytics.productionReadiness.ready}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Characters fully configured
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={characterAnalytics.totalCharacters > 0 ? (characterAnalytics.productionReadiness.ready / characterAnalytics.totalCharacters * 100) : 0}
                    sx={{ mt: 1, mb: 1, height: 6, borderRadius: 3 }}
                    color="success"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {characterAnalytics.productionReadiness.needsWork} need configuration
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Production Issues Alert */}
          {characterAnalytics.issues.length > 0 && (
            <Alert 
              severity="warning" 
              sx={{ mb: 3 }}
              action={
                <Button color="inherit" size="small" onClick={() => navigate('/resolution-path-analyzer')}>
                  View Path Analyzer
                </Button>
              }
            >
              <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                {characterAnalytics.issues.length} production issue(s) detected:
              </Typography>
              <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                {characterAnalytics.issues.slice(0, 2).map((issue, index) => (
                  <li key={index}>
                    <Typography variant="body2">{issue.message}</Typography>
                  </li>
                ))}
                {characterAnalytics.issues.length > 2 && (
                  <li>
                    <Typography variant="body2">+{characterAnalytics.issues.length - 2} more issues</Typography>
                  </li>
                )}
              </Box>
            </Alert>
          )}
        </>
      )}
      
      <Paper sx={{ p: {xs: 1.5, sm:2}, mb: 2.5 }} elevation={1}>
        <Typography variant="subtitle1" gutterBottom sx={{fontWeight: 'medium'}}>Production Filters</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="character-type-label">Type</InputLabel>
              <Select
                labelId="character-type-label"
                value={typeFilter}
                label="Type"
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {['All Types'].concat(getConstant(gameConstants, 'CHARACTERS.TYPES', ['Player', 'NPC'])).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="character-tier-label">Tier</InputLabel>
              <Select
                labelId="character-tier-label"
                value={tierFilter}
                label="Tier"
                onChange={(e) => setTierFilter(e.target.value)}
              >
                {['All Tiers'].concat(getConstant(gameConstants, 'CHARACTERS.TIERS', ['Core', 'Secondary', 'Tertiary'])).map((t) => (
                  <MenuItem key={t} value={t}>{t}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel id="character-path-label">Resolution Path</InputLabel>
              <Select
                labelId="character-path-label"
                value={pathFilter}
                label="Resolution Path"
                onChange={(e) => setPathFilter(e.target.value)}
              >
                {['All Paths'].concat(getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path'])).concat([getConstant(gameConstants, 'RESOLUTION_PATHS.DEFAULT', 'Unassigned')]).map((t) => (
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
          data={filteredCharactersForTable} // Use filtered data including path filter
          isLoading={isFetching} // Use isFetching for subsequent loads
          onRowClick={handleRowClick}
          initialSortBy="name"
          initialSortDirection="asc"
          emptyMessage={
            pathFilter !== 'All Paths' || Object.keys(filters).length > 0
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