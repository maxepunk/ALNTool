import { useQuery } from '@tanstack/react-query';
import { Grid, Card, CardContent, Typography, Box, CircularProgress, Tooltip, Paper, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Chip, Alert, LinearProgress } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PeopleIcon from '@mui/icons-material/People';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import MemoryIcon from '@mui/icons-material/Memory';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import ConstructionIcon from '@mui/icons-material/Construction';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import CategoryIcon from '@mui/icons-material/Category';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Black Market
import SearchIcon from '@mui/icons-material/Search'; // Detective
import GroupsIcon from '@mui/icons-material/Groups'; // Third Path
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; // Act Transition
import VisibilityIcon from '@mui/icons-material/Visibility'; // Discovery Coverage
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import { Link as RouterLink } from 'react-router-dom';
import { Divider } from '@mui/material';
import { useGameConstants, getConstant } from '../hooks/useGameConstants';
import ErrorBoundary from '../components/ErrorBoundary';
import MemoryEconomySection from '../components/Dashboard/MemoryEconomySection';
import ProductionMetrics from '../components/Dashboard/ProductionMetrics';

function StatCard({ title, count, icon, color = "primary", navigateTo, queryParams, isLoading, warning = false }) {
  const navigate = useNavigate();
  const handleClick = () => {
    if (navigateTo) {
      let path = navigateTo;
      if (queryParams) {
        path += `?${new URLSearchParams(queryParams).toString()}`;
      }
      navigate(path);
    }
  };

  return (
    <Card 
      sx={{ 
        height: '100%', 
        cursor: navigateTo ? 'pointer' : 'default',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': navigateTo ? { transform: 'translateY(-4px)', boxShadow: (theme) => theme.shadows[4] } : {},
        display: 'flex',
        flexDirection: 'column',
      }}
      onClick={handleClick}
      elevation={2}
    >
      <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
          <Box 
            sx={{ 
              bgcolor: `${color}.main`, // Use main color for icon background
              color: `${color}.contrastText`,
              p: 1.5,
              borderRadius: '50%', // Circular icon background
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mr: 2,
              boxShadow: 1,
            }}
          >
            {icon}
          </Box>
          <Typography variant="h6" color="text.primary" sx={{fontWeight: 500}}>
            {title}
          </Typography>
        </Box>
        <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: `${color}.dark`, textAlign: 'right' }}>
          {isLoading ? <CircularProgress size={36} color="inherit" /> : (count !== undefined ? count : 'N/A')}
        </Typography>
      </CardContent>
    </Card>
  );
}

const QuickAccessItem = ({ icon, text, to, queryParams, subtitle }) => {
  const navigate = useNavigate();
  const handleClick = () => {
    let path = to;
    if (queryParams) {
      path += `?${new URLSearchParams(queryParams).toString()}`;
    }
    navigate(path);
  };

  return (
    <ListItem disablePadding>
      <ListItemButton onClick={handleClick} sx={{ borderRadius: 1, '&:hover': { bgcolor: 'action.hover'} }}>
        <ListItemIcon sx={{minWidth: 36, color: 'primary.main'}}>{icon}</ListItemIcon>
        <ListItemText 
          primary={text} 
          secondary={subtitle}
          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
        />
      </ListItemButton>
    </ListItem>
  );
};

function ProductionCommandCenter() {
  // All hooks must be called before any conditional returns
  const navigate = useNavigate();
  
  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();
  
  // Fetch core game data for orchestration insights
  const { data: charactersData, isLoading: charactersLoading } = useQuery({
    queryKey: ['charactersSummary'],
    queryFn: () => api.getCharacters({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  const { data: elementsData, isLoading: elementsLoading } = useQuery({
    queryKey: ['elementsSummary'],
    queryFn: () => api.getElements({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  const { data: puzzlesData, isLoading: puzzlesLoading } = useQuery({
    queryKey: ['puzzlesSummary'],
    queryFn: () => api.getPuzzles({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  const { data: timelineEventsData, isLoading: timelineLoading } = useQuery({
    queryKey: ['timelineEventsSummary'],
    queryFn: () => api.getTimelineEventsList({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });

  // Calculate values using optional chaining to avoid errors when data is loading
  const memoryTokens = elementsData?.filter(el => 
    el.properties?.basicType?.toLowerCase().includes('memory') || 
    el.properties?.basicType?.toLowerCase().includes('token') ||
    el.properties?.basicType?.toLowerCase().includes('rfid')
  ) || [];

  const memoryTokensCompleted = memoryTokens.filter(token => 
    token.properties?.status === 'Ready' || token.properties?.status === 'Complete'
  ).length;

  // Get target from game constants with safe fallback
  const memoryTokensTotal = constantsLoading ? 55 : getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55);
  const memoryCompletionPercentage = Math.round((memoryTokensCompleted / memoryTokensTotal) * 100);

  // Three-Path Balance Analysis (using computed resolution_paths from backend)
  const knownPaths = constantsLoading ? ['Black Market', 'Detective', 'Third Path'] : getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path']);
  const charactersWithPaths = charactersData?.filter(char => char.resolution_paths && char.resolution_paths.length > 0) || [];
  const blackMarketCount = charactersWithPaths.filter(char => char.resolution_paths.includes(knownPaths[0] || 'Black Market')).length;
  const detectiveCount = charactersWithPaths.filter(char => char.resolution_paths.includes(knownPaths[1] || 'Detective')).length;
  const thirdPathCount = charactersWithPaths.filter(char => char.resolution_paths.includes(knownPaths[2] || 'Third Path')).length;

  // Character Tier Analysis
  const characterTiers = constantsLoading ? ['Core', 'Secondary', 'Tertiary'] : getConstant(gameConstants, 'CHARACTERS.TIERS', ['Core', 'Secondary', 'Tertiary']);
  const tierCounts = {};
  characterTiers.forEach(tier => {
    tierCounts[tier] = charactersData?.filter(char => char.tier === tier).length || 0;
  });

  // Act Focus Analysis
  const actTypes = constantsLoading ? ['Act 1', 'Act 2'] : getConstant(gameConstants, 'ACTS.TYPES', ['Act 1', 'Act 2']);
  const unassignedActValue = constantsLoading ? 'Unassigned' : getConstant(gameConstants, 'ACTS.DEFAULT', 'Unassigned');
  const act1Events = timelineEventsData?.filter(event => event.act_focus === actTypes[0]).length || 0;
  const act2Events = timelineEventsData?.filter(event => event.act_focus === actTypes[1]).length || 0;
  const unassignedEvents = timelineEventsData?.filter(event => !event.act_focus || event.act_focus === unassignedActValue).length || 0;

  // Critical Dependencies Analysis
  const collaborativePuzzles = puzzlesData?.filter(puzzle => 
    puzzle.puzzleElements && puzzle.puzzleElements.length >= 2
  ).length || 0;

  const elementsToDesignCount = elementsData?.filter(el => el.properties?.status === 'To Design').length || 0;
  const elementsToBuildCount = elementsData?.filter(el => el.properties?.status === 'To Build').length || 0;

  // Early return if constants are still loading to prevent errors with getConstant calls
  if (constantsLoading) {
    return (
      <ErrorBoundary level="page">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
          <CircularProgress /> <Typography sx={{ml:2}}>Loading Production Command Center...</Typography>
        </Box>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page">
      <Box>
        <PageHeader title="About Last Night - Production Command Center" />
      
      <Typography variant="subtitle1" sx={{ mb: 3 }}>
        Design & Prep orchestration for the 90-minute murder mystery experience. Monitor three-path balance, memory economy, and critical dependencies.
      </Typography>
      
      <Grid container spacing={3}>
        {/* Three-Path Balance Monitor */}
        <Grid item xs={12} md={8}>
          <ProductionMetrics
            blackMarketCount={blackMarketCount}
            detectiveCount={detectiveCount}
            thirdPathCount={thirdPathCount}
            charactersWithPaths={charactersWithPaths}
            gameConstants={gameConstants}
            getConstant={getConstant}
          />
        </Grid>

        {/* Memory Economy Status */}
        <Grid item xs={12} md={4}>
          <MemoryEconomySection
            memoryTokensCompleted={memoryTokensCompleted}
            memoryTokensTotal={memoryTokensTotal}
            memoryCompletionPercentage={memoryCompletionPercentage}
          />
        </Grid>

        {/* Act Focus & Discovery Coverage */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <VisibilityIcon sx={{ mr: 1 }} />
              Discovery Coverage & Act Flow
            </Typography>
            
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>Act Distribution:</Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText' }}>
                  <Typography variant="h6">{act1Events}</Typography>
                  <Typography variant="caption">Act 1</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'secondary.light', borderRadius: 1, color: 'secondary.contrastText' }}>
                  <Typography variant="h6">{act2Events}</Typography>
                  <Typography variant="caption">Act 2</Typography>
                </Box>
              </Grid>
              <Grid item xs={4}>
                <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'grey.500', borderRadius: 1, color: 'common.white' }}>
                  <Typography variant="h6">{unassignedEvents}</Typography>
                  <Typography variant="caption">Unassigned</Typography>
                </Box>
              </Grid>
            </Grid>

            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'medium' }}>Character Tier Balance:</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip 
                icon={<PeopleIcon />} 
                label={`Core: ${tierCounts.Core}`} 
                color="primary" 
                onClick={() => navigate('/characters?tier=Core')}
                clickable
              />
              <Chip 
                icon={<PeopleIcon />} 
                label={`Secondary: ${tierCounts.Secondary}`} 
                color="secondary" 
                onClick={() => navigate('/characters?tier=Secondary')}
                clickable
              />
              <Chip 
                icon={<PeopleIcon />} 
                label={`Tertiary: ${tierCounts.Tertiary}`} 
                color="default" 
                onClick={() => navigate('/characters?tier=Tertiary')}
                clickable
              />
            </Box>

            {collaborativePuzzles > 0 && (
              <Alert severity="info" sx={{ mt: 2 }}>
                {collaborativePuzzles} collaborative puzzles require 2+ players - monitor for bottlenecks
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Production Orchestration Tools */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 2, borderBottom: 1, borderColor: 'divider', pb:1 }}>Design & Prep Tools</Typography>
            <List dense>
              <QuickAccessItem 
                icon={<MemoryIcon />} 
                text="Memory Token Workshop" 
                to="/memory-economy" 
                subtitle={`${memoryTokensTotal - memoryTokensCompleted} tokens to complete`}
              />
              <QuickAccessItem 
                icon={<ExtensionIcon />} 
                text="Dependency Choreographer" 
                to="/character-sociogram" 
                subtitle="Critical dependencies & bottlenecks"
              />
              <QuickAccessItem 
                icon={<SearchIcon />} 
                text="Resolution Path Analyzer" 
                to="/resolution-path-analyzer" 
                subtitle="Balance three narrative paths"
              />
              <QuickAccessItem 
                icon={<TimelineIcon />} 
                text="Narrative Thread Tracker" 
                to="/narrative-thread-tracker" 
                subtitle="Story coherence analysis"
              />
              <QuickAccessItem 
                icon={<VisibilityIcon />} 
                text="Experience Flow Analyzer" 
                to="/player-journey" 
                subtitle="Pacing & experience quality analysis"
              />
              <QuickAccessItem 
                icon={<DesignServicesIcon />} 
                text={`Asset Design Queue (${elementsToDesignCount})`} 
                to="/elements" 
                queryParams={{ status: 'To Design' }}
                subtitle="Props and memory tokens to design"
              />
              <QuickAccessItem 
                icon={<ConstructionIcon />} 
                text={`Fabrication Queue (${elementsToBuildCount})`} 
                to="/elements" 
                queryParams={{ status: 'To Build' }}
                subtitle="Physical assets to build"
              />
            </List>
            
            <Divider sx={{my: 2}}/>
            
            <Typography variant="subtitle2" sx={{fontWeight: 'medium', mb: 1}}>Next Priority Actions:</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {memoryCompletionPercentage < getConstant(gameConstants, 'DASHBOARD.MEMORY_COMPLETION_WARNING_THRESHOLD', 50) && (
                <Alert severity="warning" sx={{ p: 1 }}>
                  <Typography variant="body2">
                    Memory token completion below {getConstant(gameConstants, 'DASHBOARD.MEMORY_COMPLETION_WARNING_THRESHOLD', 50)}% - prioritize token design
                  </Typography>
                </Alert>
              )}
              
              {unassignedEvents > getConstant(gameConstants, 'DASHBOARD.UNASSIGNED_EVENTS_WARNING_THRESHOLD', 5) && (
                <Alert severity="info" sx={{ p: 1 }}>
                  <Typography variant="body2">
                    {unassignedEvents} timeline events need Act Focus assignment
                  </Typography>
                </Alert>
              )}
              
              {Math.max(blackMarketCount, detectiveCount, thirdPathCount) - Math.min(blackMarketCount, detectiveCount, thirdPathCount) > getConstant(gameConstants, 'DASHBOARD.PATH_IMBALANCE_THRESHOLD', 3) && (
                <Alert severity="warning" sx={{ p: 1 }}>
                  <Typography variant="body2">
                    Character path imbalance - review resolution assignments
                  </Typography>
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>

      </Grid>
    </Box>
    </ErrorBoundary>
  );
}

export default ProductionCommandCenter;