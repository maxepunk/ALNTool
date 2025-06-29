import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Container, 
  CircularProgress, 
  Typography, 
  Paper, 
  Alert, 
  Chip, 
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Tooltip,
  IconButton,
  Switch,
  FormControlLabel,
  Badge,
  Button
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import MemoryIcon from '@mui/icons-material/Memory';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SearchIcon from '@mui/icons-material/Search';
import GroupsIcon from '@mui/icons-material/Groups';
import AssessmentIcon from '@mui/icons-material/Assessment';
import BuildIcon from '@mui/icons-material/Build';
import DesignServicesIcon from '@mui/icons-material/DesignServices';
import FlashOnIcon from '@mui/icons-material/FlashOn';
import InfoIcon from '@mui/icons-material/Info';

import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import { api } from '../services/api';
import { useGameConstants, getConstant } from '../hooks/useGameConstants';

function MemoryEconomyWorkshop() {
  const [workshopMode, setWorkshopMode] = useState(true);
  const [selectedResolutionPath, setSelectedResolutionPath] = useState('All');
  
  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();
  
  // Fetch all necessary data for comprehensive memory economy analysis
  const { data: memoryElementsData, isLoading: elementsLoading, error: elementsError } = useQuery({
    queryKey: ['memoryTypeElementsForEconomy'],
    queryFn: () => api.getElements({ filterGroup: 'memoryTypes' }),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: charactersData, isLoading: charactersLoading } = useQuery({
    queryKey: ['charactersForMemoryEconomy'],
    queryFn: () => api.getAllCharactersWithSociogramData({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: puzzlesData, isLoading: puzzlesLoading } = useQuery({
    queryKey: ['puzzlesForMemoryEconomy'],
    queryFn: () => api.getPuzzles({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  
  const isLoading = elementsLoading || charactersLoading || puzzlesLoading || constantsLoading;
  const error = elementsError;

  // Memory Economy Analysis
  const memoryEconomyAnalysis = useMemo(() => {
    if (!memoryElementsData || !charactersData || !puzzlesData || !gameConstants) return {
      processedMemoryData: [],
      economyStats: { totalTokens: 0, completedTokens: 0, totalValue: 0 },
      pathDistribution: { 'Black Market': 0, 'Detective': 0, 'Third Path': 0, 'Unassigned': 0 },
      productionStatus: { toDesign: 0, toBuild: 0, ready: 0 },
      balanceAnalysis: { issues: [], recommendations: [] }
    };

    const processedMemoryData = memoryElementsData.map(element => {
      const properties = element.properties || {};
      const valueRating = properties.sf_value_rating;
      const memoryType = properties.sf_memory_type;

      // Use backend-calculated values instead of recalculating
      const baseValueAmount = element.baseValueAmount || 0;
      const typeMultiplierValue = element.typeMultiplierValue || 1;
      const finalCalculatedValue = element.finalCalculatedValue || 0;

      // Enhanced discovery analysis
      let discoveredVia = 'Direct Discovery';
      let resolutionPath = 'Unassigned';
      
      if (element.rewardedByPuzzle && element.rewardedByPuzzle.length > 0) {
        discoveredVia = `Puzzle: ${element.rewardedByPuzzle[0].name || element.rewardedByPuzzle[0].puzzle}`;
        // Try to infer resolution path from puzzle themes or related characters
        const puzzle = puzzlesData.find(p => p.id === element.rewardedByPuzzle[0].id);
        if (puzzle?.resolutionPaths && puzzle.resolutionPaths.length > 0) {
          resolutionPath = puzzle.resolutionPaths[0];
        }
      } else if (element.timelineEvent && element.timelineEvent.length > 0) {
        discoveredVia = `Event: ${element.timelineEvent[0].name || element.timelineEvent[0].description}`;
      }

      // Production status analysis
      const status = properties.status || 'Unknown';
      const productionStage = status === 'To Design' ? 'design' :
                             status === 'To Build' ? 'build' :
                             status === 'Ready' || status === 'Complete' ? 'ready' : 'unknown';

      return {
        ...element,
        id: element.id,
        name: element.name,
        parsed_sf_rfid: properties.parsed_sf_rfid,
        sf_value_rating: valueRating,
        baseValueAmount,
        sf_memory_type: memoryType,
        typeMultiplierValue,
        finalCalculatedValue,
        discoveredVia,
        resolutionPath,
        productionStage,
        status
      };
    });

    // Calculate economy statistics
    const totalTokens = processedMemoryData.length;
    const completedTokens = processedMemoryData.filter(token => 
      token.status === 'Ready' || token.status === 'Complete'
    ).length;
    const totalValue = processedMemoryData.reduce((sum, token) => sum + token.finalCalculatedValue, 0);

    // Path distribution analysis
    const pathDistribution = processedMemoryData.reduce((acc, token) => {
      acc[token.resolutionPath] = (acc[token.resolutionPath] || 0) + 1;
      return acc;
    }, { 'Black Market': 0, 'Detective': 0, 'Third Path': 0, 'Unassigned': 0 });

    // Production status tracking
    const productionStatus = processedMemoryData.reduce((acc, token) => {
      if (token.productionStage === 'design') acc.toDesign++;
      else if (token.productionStage === 'build') acc.toBuild++;
      else if (token.productionStage === 'ready') acc.ready++;
      return acc;
    }, { toDesign: 0, toBuild: 0, ready: 0 });

    // Balance analysis using game constants
    const issues = [];
    const recommendations = [];
    
    const targetTokens = getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55);
    const minTokens = getConstant(gameConstants, 'MEMORY_VALUE.MIN_TOKEN_COUNT', 50);
    const maxTokens = getConstant(gameConstants, 'MEMORY_VALUE.MAX_TOKEN_COUNT', 60);
    const balanceThreshold = getConstant(gameConstants, 'MEMORY_VALUE.BALANCE_WARNING_THRESHOLD', 0.3);
    
    if (totalTokens < minTokens) {
      issues.push(`Token count below target (${targetTokens} tokens)`);
      recommendations.push('Add more memory tokens to reach economy target');
    } else if (totalTokens > maxTokens) {
      issues.push('Token count above target - may overwhelm players');
      recommendations.push('Consider reducing token count or increasing variety');
    }
    
    if (pathDistribution['Unassigned'] > totalTokens * balanceThreshold) {
      issues.push('Too many unassigned tokens');
      recommendations.push('Assign tokens to resolution paths for better balance');
    }
    
    const maxPath = Math.max(...Object.values(pathDistribution));
    const minPath = Math.min(...Object.values(pathDistribution));
    if (maxPath - minPath > totalTokens * 0.4) {
      issues.push('Unbalanced path distribution');
      recommendations.push('Redistribute tokens more evenly across paths');
    }
    
    if (productionStatus.ready < totalTokens * 0.7) {
      issues.push('Production behind schedule');
      recommendations.push('Prioritize completion of memory tokens in design/build phases');
    }

    return {
      processedMemoryData,
      economyStats: { totalTokens, completedTokens, totalValue },
      pathDistribution,
      productionStatus,
      balanceAnalysis: { issues, recommendations }
    };
  }, [memoryElementsData, charactersData, puzzlesData, gameConstants]);

  const columns = useMemo(() => [
    {
      id: 'name',
      label: 'Memory Name',
      sortable: true,
      width: '25%',
      format: (value, row) => <RouterLink to={`/elements/${row.id}`}>{value}</RouterLink>
    },
    {
      id: 'parsed_sf_rfid',
      label: 'RFID',
      sortable: true,
      width: '10%',
      format: (value) => value || 'N/A'
    },
    {
      id: 'sf_value_rating',
      label: 'Value Rating',
      sortable: true,
      align: 'center',
      width: '10%',
      format: (value) => value ? <Chip label={value} size="small" color={value >=4 ? "error" : value === 3 ? "warning" : "default"}/> : 'N/A'
    },
    {
      id: 'baseValueAmount',
      label: 'Base Value ($)',
      sortable: true,
      align: 'right',
      width: '10%',
      format: (value) => value.toLocaleString()
    },
    {
      id: 'sf_memory_type',
      label: 'Memory Type',
      sortable: true,
      width: '10%',
      format: (value) => value ? <Chip label={value} size="small" variant="outlined" /> : 'N/A'
    },
    {
      id: 'typeMultiplierValue',
      label: 'Multiplier',
      sortable: true,
      align: 'center',
      width: '10%',
      format: (value) => `x${value}`
    },
    {
      id: 'finalCalculatedValue',
      label: 'Final Value ($)',
      sortable: true,
      align: 'right',
      width: '10%',
      format: (value) => value.toLocaleString()
    },
    {
      id: 'discoveredVia',
      label: 'Discovered Via',
      sortable: true,
      width: '15%',
      format: (value) => value || 'N/A'
    }
  ].concat(workshopMode ? [
    {
      id: 'resolutionPath',
      label: 'Resolution Path',
      sortable: true,
      width: '10%',
      format: (value) => {
        const pathThemes = getConstant(gameConstants, 'RESOLUTION_PATHS.THEMES', {});
        const color = pathThemes[value]?.color || 'default';
        return <Chip label={value} size="small" color={color} variant="outlined" />;
      }
    },
    {
      id: 'status',
      label: 'Production Status',
      sortable: true,
      width: '8%',
      format: (value) => {
        const statusColors = getConstant(gameConstants, 'PRODUCTION_STATUS.COLORS', {});
        const color = statusColors[value] || statusColors['Unknown'] || 'default';
        return <Chip label={value || 'Unknown'} size="small" color={color} />;
      }
    }
  ] : []), [workshopMode, gameConstants]);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
        <CircularProgress /> <Typography sx={{ml:2}}>Loading Memory Economy Workshop...</Typography>
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

  const { processedMemoryData, economyStats, pathDistribution, productionStatus, balanceAnalysis } = memoryEconomyAnalysis;

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <PageHeader title={workshopMode ? "Memory Economy Workshop" : "Memory Economy Dashboard"} />
        <FormControlLabel
          control={
            <Switch 
              checked={workshopMode} 
              onChange={(e) => setWorkshopMode(e.target.checked)}
            />
          }
          label="Production Workshop Mode"
        />
      </Box>
      
      {workshopMode && (
        <>
          {/* Economy Overview Cards */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <MemoryIcon color="primary" sx={{ mr: 1 }} />
                    <Typography variant="h6">Token Economy</Typography>
                  </Box>
                  <Typography variant="h3" color="primary">{economyStats.totalTokens}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    of {getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55)} target tokens
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(economyStats.totalTokens / getConstant(gameConstants, 'MEMORY_VALUE.TARGET_TOKEN_COUNT', 55)) * 100} 
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    color={
                      economyStats.totalTokens >= getConstant(gameConstants, 'MEMORY_VALUE.MIN_TOKEN_COUNT', 50) && 
                      economyStats.totalTokens <= getConstant(gameConstants, 'MEMORY_VALUE.MAX_TOKEN_COUNT', 60) ? 
                      'success' : 'warning'
                    }
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                    <Typography variant="h6">Production Ready</Typography>
                  </Box>
                  <Typography variant="h3" color="success">{productionStatus.ready}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Math.round((productionStatus.ready / economyStats.totalTokens) * 100)}% complete
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={(productionStatus.ready / economyStats.totalTokens) * 100} 
                    sx={{ mt: 1, height: 8, borderRadius: 4 }}
                    color="success"
                  />
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TrendingUpIcon color="info" sx={{ mr: 1 }} />
                    <Typography variant="h6">Total Value</Typography>
                  </Box>
                  <Typography variant="h3" color="info">${economyStats.totalValue.toLocaleString()}</Typography>
                  <Typography variant="body2" color="text.secondary">Economic potential</Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={3}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <AssessmentIcon color="warning" sx={{ mr: 1 }} />
                    <Typography variant="h6">Balance Score</Typography>
                  </Box>
                  <Typography variant="h3" color={balanceAnalysis.issues.length === 0 ? "success" : "warning"}>
                    {balanceAnalysis.issues.length === 0 ? 'A+' : balanceAnalysis.issues.length === 1 ? 'B' : 'C'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {balanceAnalysis.issues.length} issues detected
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Production Analysis Panels */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Path Distribution Analysis */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }} elevation={2}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <FlashOnIcon sx={{ mr: 1 }} />
                  Resolution Path Distribution
                </Typography>
                <Grid container spacing={2}>
                  {getConstant(gameConstants, 'RESOLUTION_PATHS.TYPES', ['Black Market', 'Detective', 'Third Path']).concat(['Unassigned']).map(path => {
                    const pathThemes = getConstant(gameConstants, 'RESOLUTION_PATHS.THEMES', {});
                    const theme = pathThemes[path] || { color: 'default', icon: 'Help' };
                    const IconComponent = path === 'Black Market' ? AccountBalanceIcon :
                                         path === 'Detective' ? SearchIcon :
                                         path === 'Third Path' ? GroupsIcon : WarningIcon;
                    
                    return (
                      <Grid key={path} item xs={6}>
                        <Box sx={{ 
                          textAlign: 'center', 
                          p: 2, 
                          bgcolor: `${theme.color}.light`, 
                          borderRadius: 1, 
                          color: `${theme.color}.contrastText` 
                        }}>
                          <IconComponent sx={{ fontSize: 24, mb: 1 }} />
                          <Typography variant="h5">{pathDistribution[path] || 0}</Typography>
                          <Typography variant="caption">{path}</Typography>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Grid>

            {/* Production Pipeline */}
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 3 }} elevation={2}>
                <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                  <BuildIcon sx={{ mr: 1 }} />
                  Production Pipeline
                </Typography>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <Badge badgeContent={productionStatus.toDesign} color="warning">
                        <DesignServicesIcon />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText 
                      primary="To Design" 
                      secondary={`${productionStatus.toDesign} tokens need design work`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Badge badgeContent={productionStatus.toBuild} color="info">
                        <BuildIcon />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText 
                      primary="To Build" 
                      secondary={`${productionStatus.toBuild} tokens in fabrication queue`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon>
                      <Badge badgeContent={productionStatus.ready} color="success">
                        <CheckCircleIcon />
                      </Badge>
                    </ListItemIcon>
                    <ListItemText 
                      primary="Production Ready" 
                      secondary={`${productionStatus.ready} tokens completed and ready`}
                    />
                  </ListItem>
                </List>
              </Paper>
            </Grid>
          </Grid>

          {/* Balance Analysis & Recommendations */}
          {(balanceAnalysis.issues.length > 0 || balanceAnalysis.recommendations.length > 0) && (
            <Accordion sx={{ mb: 3 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon color="warning" />
                  Production Analysis ({balanceAnalysis.issues.length} issues, {balanceAnalysis.recommendations.length} recommendations)
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {balanceAnalysis.issues.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" color="error.main" gutterBottom>Issues Detected:</Typography>
                    {balanceAnalysis.issues.map((issue, index) => (
                      <Alert key={index} severity="warning" sx={{ mb: 1 }}>{issue}</Alert>
                    ))}
                  </Box>
                )}
                {balanceAnalysis.recommendations.length > 0 && (
                  <Box>
                    <Typography variant="subtitle2" color="info.main" gutterBottom>Recommendations:</Typography>
                    {balanceAnalysis.recommendations.map((rec, index) => (
                      <Alert key={index} severity="info" sx={{ mb: 1 }}>{rec}</Alert>
                    ))}
                  </Box>
                )}
              </AccordionDetails>
            </Accordion>
          )}
        </>
      )}
      
      {/* Memory Tokens Table */}
      <Paper sx={{ p: { xs: 1, sm: 2 } }} elevation={2}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Memory Token Details</Typography>
          <Button 
            component={RouterLink} 
            to="/elements" 
            variant="outlined" 
            size="small"
            startIcon={<InfoIcon />}
          >
            Manage Elements
          </Button>
        </Box>
        
        {processedMemoryData.length === 0 && !isLoading && (
          <Alert severity="info" sx={{mb: 2}}>No memory-type elements found with economic data.</Alert>
        )}
        
        <DataTable
          columns={columns}
          data={processedMemoryData}
          isLoading={isLoading}
          initialSortBy="finalCalculatedValue"
          initialSortDirection="desc"
          emptyMessage="No memory elements match the current criteria."
        />
      </Paper>
    </Container>
  );
}


// Keep backwards compatibility
const MemoryEconomyPage = MemoryEconomyWorkshop;

export default MemoryEconomyPage;
export { MemoryEconomyWorkshop };
