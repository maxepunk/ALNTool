import React, { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, CircularProgress, Alert, Paper, Grid, List, ListItem, ListItemText,
  Chip, Divider, Tabs, Tab, ListItemIcon, ListItemButton, Container, Card, CardContent,
  LinearProgress, Switch, FormControlLabel, Button, Accordion, AccordionSummary,
  AccordionDetails, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tooltip, Badge
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PageHeader from '../components/PageHeader';
import { api } from '../services/api';
import PeopleIcon from '@mui/icons-material/People';
import ExtensionIcon from '@mui/icons-material/Extension';
import InventoryIcon from '@mui/icons-material/Inventory';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance'; // Black Market
import SearchIcon from '@mui/icons-material/Search'; // Detective
import GroupsIcon from '@mui/icons-material/Groups'; // Third Path
import BalanceIcon from '@mui/icons-material/Balance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';
import MemoryIcon from '@mui/icons-material/Memory';
import TimelineIcon from '@mui/icons-material/Timeline';
import InfoIcon from '@mui/icons-material/Info';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import BuildIcon from '@mui/icons-material/Build';

const KNOWN_RESOLUTION_PATHS = ["Black Market", "Detective", "Third Path"];
const UNASSIGNED_PATH = "Unassigned";

const PATH_COLORS = {
  'Black Market': { color: 'warning', icon: AccountBalanceIcon, theme: 'Wealth & Power' },
  'Detective': { color: 'error', icon: SearchIcon, theme: 'Truth & Justice' },
  'Third Path': { color: 'secondary', icon: GroupsIcon, theme: 'Community & Cooperation' }
};

const VALUE_RATING_MAP = {
  1: 100,
  2: 500,
  3: 1000,
  4: 5000,
  5: 10000,
};

const TYPE_MULTIPLIER_MAP = {
  Personal: 1,
  Business: 3,
  Technical: 5,
};

const ResolutionPathAnalyzerPage = () => {
  const navigate = useNavigate();
  const [selectedPathTab, setSelectedPathTab] = useState(0);
  const [analysisMode, setAnalysisMode] = useState(true);
  
  // Fetch all data needed for comprehensive path analysis
  const { data: charactersData, isLoading: charactersLoading, error: charactersError } = useQuery(
    'charactersForPathAnalysis',
    () => api.getAllCharactersWithSociogramData({ limit: 1000 }),
    { staleTime: 5 * 60 * 1000 }
  );
  
  const { data: elementsData, isLoading: elementsLoading } = useQuery(
    'elementsForPathAnalysis',
    () => api.getElements({ limit: 1000 }),
    { staleTime: 5 * 60 * 1000 }
  );
  
  const { data: puzzlesData, isLoading: puzzlesLoading } = useQuery(
    'puzzlesForPathAnalysis',
    () => api.getPuzzles({ limit: 1000 }),
    { staleTime: 5 * 60 * 1000 }
  );
  
  const { data: timelineEventsData, isLoading: timelineLoading } = useQuery(
    'timelineEventsForPathAnalysis',
    () => api.getTimelineEvents({ limit: 1000 }),
    { staleTime: 5 * 60 * 1000 }
  );
  
  const isLoading = charactersLoading || elementsLoading || puzzlesLoading || timelineLoading;
  const error = charactersError;

  const characters = charactersData || [];
  const puzzles = puzzlesData || [];
  const elements = elementsData || [];
  const timelineEvents = timelineEventsData || [];

  // Comprehensive Path Analysis for Production Intelligence
  const pathAnalysis = useMemo(() => {
    if (!characters || !elements || !puzzles || !timelineEvents) return {
      pathDistribution: {},
      pathResources: {},
      crossPathDependencies: [],
      balanceMetrics: {},
      recommendations: []
    };

    // Character path distribution
    const charactersWithPaths = characters.filter(char => 
      char.resolutionPaths && char.resolutionPaths.length > 0
    );
    
    const pathDistribution = {
      'Black Market': charactersWithPaths.filter(char => char.resolutionPaths.includes('Black Market')),
      'Detective': charactersWithPaths.filter(char => char.resolutionPaths.includes('Detective')),
      'Third Path': charactersWithPaths.filter(char => char.resolutionPaths.includes('Third Path')),
      'Unassigned': characters.filter(char => !char.resolutionPaths || char.resolutionPaths.length === 0)
    };

    // Resource allocation per path (elements, puzzles, timeline events)
    const pathResources = {};
    Object.keys(PATH_COLORS).forEach(path => {
      const pathElements = elements.filter(el => 
        el.resolutionPaths && el.resolutionPaths.includes(path)
      );
      const pathPuzzles = puzzles.filter(puzzle => 
        puzzle.resolutionPaths && puzzle.resolutionPaths.includes(path)
      );
      const pathEvents = timelineEvents.filter(event => 
        event.resolutionPaths && event.resolutionPaths.includes(path)
      );

      // Calculate memory token allocation
      const memoryTokens = pathElements.filter(el => 
        el.properties?.basicType?.toLowerCase().includes('memory') ||
        el.properties?.basicType?.toLowerCase().includes('token') ||
        el.properties?.basicType?.toLowerCase().includes('rfid')
      );

      const totalValue = pathElements.reduce((sum, el) => {
        const valueRating = el.properties?.sf_value_rating || 0;
        const memoryType = el.properties?.sf_memory_type || 'Personal';
        const baseValue = VALUE_RATING_MAP[valueRating] || 0;
        const multiplier = TYPE_MULTIPLIER_MAP[memoryType] || 1;
        return sum + (baseValue * multiplier);
      }, 0);

      pathResources[path] = {
        characters: pathDistribution[path]?.length || 0,
        elements: pathElements.length,
        puzzles: pathPuzzles.length,
        timelineEvents: pathEvents.length,
        memoryTokens: memoryTokens.length,
        totalValue,
        readyElements: pathElements.filter(el => 
          el.properties?.status === 'Ready' || el.properties?.status === 'Complete'
        ).length,
        elementList: pathElements,
        puzzleList: pathPuzzles,
        characterList: pathDistribution[path] || []
      };
    });

    // Cross-path dependencies analysis
    const crossPathDependencies = [];
    
    // Find shared puzzles
    puzzles.forEach(puzzle => {
      if (puzzle.resolutionPaths && puzzle.resolutionPaths.length > 1) {
        crossPathDependencies.push({
          type: 'Shared Puzzle',
          name: puzzle.name,
          paths: puzzle.resolutionPaths,
          impact: 'high',
          description: 'Puzzle accessible from multiple paths'
        });
      }
    });

    // Find character interactions across paths
    characters.forEach(char => {
      if (char.resolutionPaths && char.resolutionPaths.length > 1) {
        crossPathDependencies.push({
          type: 'Cross-Path Character',
          name: char.name,
          paths: char.resolutionPaths,
          impact: 'medium',
          description: 'Character participates in multiple resolution paths'
        });
      }
    });

    // Balance metrics calculation
    const totalCharacters = Object.values(pathDistribution).reduce((sum, chars) => sum + (chars?.length || 0), 0);
    const pathCounts = Object.keys(PATH_COLORS).map(path => pathResources[path].characters);
    const maxCount = Math.max(...pathCounts);
    const minCount = Math.min(...pathCounts);
    const balanceScore = totalCharacters > 0 ? Math.max(0, 100 - ((maxCount - minCount) / totalCharacters * 100)) : 0;

    const balanceMetrics = {
      characterBalance: balanceScore,
      resourceBalance: Object.keys(PATH_COLORS).reduce((acc, path) => {
        acc[path] = {
          completion: pathResources[path].elements > 0 ? 
            (pathResources[path].readyElements / pathResources[path].elements * 100) : 0,
          memoryDensity: pathResources[path].characters > 0 ? 
            (pathResources[path].memoryTokens / pathResources[path].characters) : 0
        };
        return acc;
      }, {}),
      crossPathComplexity: crossPathDependencies.length
    };

    // Generate recommendations
    const recommendations = [];
    
    if (balanceScore < 70) {
      recommendations.push({
        type: 'character-balance',
        severity: 'warning',
        message: 'Character distribution is unbalanced across paths',
        action: 'Redistribute characters to achieve better path balance'
      });
    }

    if (pathDistribution['Unassigned'].length > totalCharacters * 0.2) {
      recommendations.push({
        type: 'unassigned-characters',
        severity: 'info',
        message: `${pathDistribution['Unassigned'].length} characters not assigned to resolution paths`,
        action: 'Assign characters to appropriate resolution paths'
      });
    }

    Object.keys(PATH_COLORS).forEach(path => {
      const metrics = balanceMetrics.resourceBalance[path];
      if (metrics.completion < 50) {
        recommendations.push({
          type: 'production-readiness',
          severity: 'warning',
          message: `${path} path only ${Math.round(metrics.completion)}% production ready`,
          action: `Prioritize completion of ${path} path elements`
        });
      }
      
      if (metrics.memoryDensity < 2) {
        recommendations.push({
          type: 'memory-economy',
          severity: 'info',
          message: `${path} path has low memory token density (${metrics.memoryDensity.toFixed(1)} per character)`,
          action: `Consider adding more memory tokens to ${path} path`
        });
      }
    });

    if (crossPathDependencies.length > 8) {
      recommendations.push({
        type: 'complexity',
        severity: 'warning',
        message: 'High cross-path complexity may cause production challenges',
        action: 'Review shared elements and consider simplifying dependencies'
      });
    }

    return {
      pathDistribution,
      pathResources,
      crossPathDependencies,
      balanceMetrics,
      recommendations
    };
  }, [characters, elements, puzzles, timelineEvents]);

  // Legacy compatibility for existing UI
  const pathData = useMemo(() => {
    const aggregator = {};
    [...KNOWN_RESOLUTION_PATHS, UNASSIGNED_PATH].forEach(path => {
      if (path === UNASSIGNED_PATH) {
        aggregator[path] = { 
          count: pathAnalysis.pathDistribution?.['Unassigned']?.length || 0, 
          characters: pathAnalysis.pathDistribution?.['Unassigned'] || [],
          puzzles: [],
          elements: []
        };
      } else {
        const resources = pathAnalysis.pathResources?.[path] || {};
        aggregator[path] = { 
          count: (resources.characters || 0) + (resources.elements || 0) + (resources.puzzles || 0),
          characters: resources.characterList || [],
          puzzles: resources.puzzleList || [],
          elements: resources.elementList || []
        };
      }
    });
    return aggregator;
  }, [pathAnalysis]);

  const handleTabChange = (event, newValue) => {
    setSelectedPathTab(newValue);
  };

  const allPathsForTabs = [...KNOWN_RESOLUTION_PATHS, UNASSIGNED_PATH];
  const currentSelectedPathName = allPathsForTabs[selectedPathTab];
  const currentPathData = pathData[currentSelectedPathName];

  const renderEntityList = (items, itemType, icon) => {
    if (!items || items.length === 0) {
      return <Typography color="text.secondary" sx={{pl:2, fontStyle:'italic'}}>No {itemType.toLowerCase()} contribute to this path.</Typography>;
    }
    return (
      <List dense disablePadding>
        {items.map(item => (
          <ListItemButton
            key={item.id}
            onClick={() => navigate(`/${itemType.toLowerCase()}/${item.id}`)}
            sx={{borderRadius:1}}
          >
            <ListItemIcon sx={{minWidth: 36}}>{icon}</ListItemIcon>
            <ListItemText primary={item.name || item.puzzle || item.description /* puzzles use .puzzle, timeline .description */} />
          </ListItemButton>
        ))}
      </List>
    );
  };


  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Resolution Path Analysis...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{mt: 2}}>
        <Alert severity="error">Error loading data: {error.message}</Alert>
      </Container>
    );
  }

  const { pathDistribution, pathResources, crossPathDependencies, balanceMetrics, recommendations } = pathAnalysis;

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader title="Resolution Path Analyzer" />
        <FormControlLabel
          control={
            <Switch 
              checked={analysisMode} 
              onChange={(e) => setAnalysisMode(e.target.checked)}
            />
          }
          label="Advanced Analysis Mode"
        />
      </Box>
      
      <Typography variant="subtitle1" sx={{ mb: 3, color: 'text.secondary' }}>
        Monitor and balance the three narrative resolution paths for About Last Night. Ensure equitable distribution of characters, resources, and production readiness.
      </Typography>

      {/* Path Balance Overview */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <BalanceIcon sx={{ mr: 1 }} />
              Three-Path Balance Overview
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(PATH_COLORS).map(path => {
                const pathConfig = PATH_COLORS[path];
                const IconComponent = pathConfig.icon;
                const resources = pathResources[path] || {};
                
                return (
                  <Grid item xs={12} md={4} key={path}>
                    <Card sx={{ height: '100%', bgcolor: `${pathConfig.color}.light`, color: `${pathConfig.color}.contrastText` }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                          <IconComponent sx={{ fontSize: 28, mr: 1 }} />
                          <Box>
                            <Typography variant="h6">{path}</Typography>
                            <Typography variant="caption">{pathConfig.theme}</Typography>
                          </Box>
                        </Box>
                        
                        <Typography variant="h3" sx={{ mb: 1 }}>{resources.characters || 0}</Typography>
                        <Typography variant="body2" sx={{ mb: 2 }}>Characters</Typography>
                        
                        <Grid container spacing={1} sx={{ fontSize: 'small' }}>
                          <Grid item xs={6}>
                            <Typography variant="caption">Elements: {resources.elements || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption">Puzzles: {resources.puzzles || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption">Memory: {resources.memoryTokens || 0}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption">Ready: {resources.readyElements || 0}</Typography>
                          </Grid>
                        </Grid>
                        
                        <LinearProgress 
                          variant="determinate" 
                          value={resources.elements > 0 ? (resources.readyElements / resources.elements * 100) : 0}
                          sx={{ mt: 2, height: 6, borderRadius: 3 }}
                          color="inherit"
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }} elevation={2}>
            <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
              <AssessmentIcon sx={{ mr: 1 }} />
              Balance Metrics
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Character Balance</Typography>
              <LinearProgress 
                variant="determinate" 
                value={balanceMetrics.characterBalance}
                sx={{ height: 8, borderRadius: 4, mb: 1 }}
                color={balanceMetrics.characterBalance >= 80 ? 'success' : balanceMetrics.characterBalance >= 60 ? 'warning' : 'error'}
              />
              <Typography variant="body2" color="text.secondary">
                {Math.round(balanceMetrics.characterBalance)}% balanced
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Cross-Path Dependencies</Typography>
              <Chip 
                label={`${crossPathDependencies.length} dependencies`}
                color={crossPathDependencies.length <= 5 ? 'success' : crossPathDependencies.length <= 8 ? 'warning' : 'error'}
                icon={<SwapHorizIcon />}
              />
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>Unassigned Characters</Typography>
              <Typography variant="h4" color={pathDistribution['Unassigned']?.length > 0 ? 'warning.main' : 'success.main'}>
                {pathDistribution['Unassigned']?.length || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Need path assignment
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {analysisMode && (
        <>
          {/* Detailed Analysis Tabs */}
          <Paper sx={{ mb: 3 }} elevation={2}>
            <Tabs value={selectedPathTab} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tab label="Resource Distribution" />
              <Tab label="Cross-Path Dependencies" />
              <Tab label="Character Assignments" />
            </Tabs>
            
            {/* Resource Distribution Tab */}
            {selectedPathTab === 0 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Resource Allocation by Path</Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Resolution Path</TableCell>
                        <TableCell align="right">Characters</TableCell>
                        <TableCell align="right">Elements</TableCell>
                        <TableCell align="right">Memory Tokens</TableCell>
                        <TableCell align="right">Puzzles</TableCell>
                        <TableCell align="right">Timeline Events</TableCell>
                        <TableCell align="right">Total Value</TableCell>
                        <TableCell align="right">Production Ready</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.keys(PATH_COLORS).map(path => {
                        const resources = pathResources[path] || {};
                        const pathConfig = PATH_COLORS[path];
                        
                        return (
                          <TableRow key={path}>
                            <TableCell>
                              <Chip 
                                label={path} 
                                color={pathConfig.color}
                                icon={React.createElement(pathConfig.icon)}
                              />
                            </TableCell>
                            <TableCell align="right">{resources.characters || 0}</TableCell>
                            <TableCell align="right">{resources.elements || 0}</TableCell>
                            <TableCell align="right">{resources.memoryTokens || 0}</TableCell>
                            <TableCell align="right">{resources.puzzles || 0}</TableCell>
                            <TableCell align="right">{resources.timelineEvents || 0}</TableCell>
                            <TableCell align="right">${(resources.totalValue || 0).toLocaleString()}</TableCell>
                            <TableCell align="right">
                              <Chip 
                                label={`${resources.readyElements || 0}/${resources.elements || 0}`}
                                color={resources.elements > 0 && resources.readyElements / resources.elements >= 0.7 ? 'success' : 'warning'}
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
            
            {/* Cross-Path Dependencies Tab */}
            {selectedPathTab === 1 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Cross-Path Dependencies</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Elements and characters that affect multiple resolution paths
                </Typography>
                
                {crossPathDependencies.length === 0 ? (
                  <Alert severity="success">No cross-path dependencies detected. All paths are independent.</Alert>
                ) : (
                  <List>
                    {crossPathDependencies.map((dependency, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemIcon>
                            <Chip 
                              label={dependency.type}
                              color={dependency.impact === 'high' ? 'error' : dependency.impact === 'medium' ? 'warning' : 'info'}
                              size="small"
                            />
                          </ListItemIcon>
                          <ListItemText 
                            primary={dependency.name}
                            secondary={
                              <Box>
                                <Typography variant="body2">{dependency.description}</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                  {dependency.paths.map(path => (
                                    <Chip 
                                      key={path}
                                      label={path} 
                                      size="small" 
                                      color={PATH_COLORS[path]?.color || 'default'}
                                      variant="outlined"
                                    />
                                  ))}
                                </Box>
                              </Box>
                            }
                          />
                        </ListItem>
                        {index < crossPathDependencies.length - 1 && <Divider />}
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>
            )}
            
            {/* Character Assignments Tab */}
            {selectedPathTab === 2 && (
              <Box sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Character Path Assignments</Typography>
                
                {pathDistribution['Unassigned']?.length > 0 && (
                  <Alert severity="warning" sx={{ mb: 2 }}>
                    {pathDistribution['Unassigned'].length} characters need resolution path assignment
                  </Alert>
                )}
                
                <Grid container spacing={2}>
                  {Object.keys(PATH_COLORS).concat(['Unassigned']).map(path => {
                    const characters = pathDistribution[path] || [];
                    const pathConfig = PATH_COLORS[path];
                    
                    return (
                      <Grid item xs={12} md={6} lg={3} key={path}>
                        <Paper sx={{ p: 2 }} variant="outlined">
                          <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center' }}>
                            {pathConfig ? (
                              <>
                                <pathConfig.icon sx={{ mr: 1, fontSize: 20 }} />
                                {path}
                              </>
                            ) : (
                              <>
                                <WarningIcon sx={{ mr: 1, fontSize: 20, color: 'warning.main' }} />
                                {path}
                              </>
                            )}
                          </Typography>
                          
                          <Typography variant="h4" color={pathConfig?.color ? `${pathConfig.color}.main` : 'warning.main'}>
                            {characters.length}
                          </Typography>
                          
                          <Typography variant="caption" color="text.secondary" gutterBottom>
                            characters assigned
                          </Typography>
                          
                          {characters.length > 0 && (
                            <Box sx={{ mt: 1, maxHeight: 150, overflowY: 'auto' }}>
                              {characters.slice(0, 5).map(char => (
                                <Chip 
                                  key={char.id}
                                  label={char.name}
                                  size="small"
                                  sx={{ mr: 0.5, mb: 0.5 }}
                                  component={RouterLink}
                                  to={`/characters/${char.id}`}
                                  clickable
                                />
                              ))}
                              {characters.length > 5 && (
                                <Typography variant="caption" color="text.secondary">
                                  +{characters.length - 5} more
                                </Typography>
                              )}
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    );
                  })}
                </Grid>
              </Box>
            )}
          </Paper>

          {/* Recommendations Panel */}
          {recommendations.length > 0 && (
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUpIcon color="info" />
                  Production Recommendations ({recommendations.length})
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {recommendations.map((rec, index) => (
                  <Alert 
                    key={index} 
                    severity={rec.severity}
                    sx={{ mb: 1 }}
                    action={
                      <Button size="small" color="inherit">
                        View Details
                      </Button>
                    }
                  >
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{rec.message}</Typography>
                    <Typography variant="caption">{rec.action}</Typography>
                  </Alert>
                ))}
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}
      
      {/* Quick Actions */}
      <Paper sx={{ p: 3, mt: 3 }} elevation={2}>
        <Typography variant="h6" sx={{ mb: 2 }}>Quick Actions</Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/characters" 
              variant="outlined" 
              startIcon={<PeopleIcon />}
            >
              Manage Characters
            </Button>
          </Grid>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/memory-economy" 
              variant="outlined" 
              startIcon={<MemoryIcon />}
            >
              Memory Economy
            </Button>
          </Grid>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/character-sociogram" 
              variant="outlined" 
              startIcon={<ExtensionIcon />}
            >
              Dependency Analysis
            </Button>
          </Grid>
          <Grid item>
            <Button 
              component={RouterLink} 
              to="/" 
              variant="contained" 
              startIcon={<AssessmentIcon />}
            >
              Production Dashboard
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default ResolutionPathAnalyzerPage;
