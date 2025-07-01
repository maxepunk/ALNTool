import React, { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Box, 
  Container, 
  CircularProgress, 
  Typography, 
  Paper, 
  Alert, 
  Switch,
  FormControlLabel,
  Button
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import InfoIcon from '@mui/icons-material/Info';

import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import MemoryEconomyDashboard from '../components/MemoryEconomyDashboard';
import ProductionAnalysisPanels from '../components/ProductionAnalysisPanels';
import BalanceAnalysisAccordion from '../components/BalanceAnalysisAccordion';
import { getMemoryTokenTableColumns } from '../components/MemoryEconomy/memoryTokenTableColumns';
import useMemoryEconomyAnalysis from '../hooks/useMemoryEconomyAnalysis';
import { api } from '../services/api';
import { useGameConstants } from '../hooks/useGameConstants';
import ErrorBoundary from '../components/ErrorBoundary';

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
    queryFn: () => api.getCharacters({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: puzzlesData, isLoading: puzzlesLoading } = useQuery({
    queryKey: ['puzzlesForMemoryEconomy'],
    queryFn: () => api.getPuzzles({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  
  const isLoading = elementsLoading || charactersLoading || puzzlesLoading || constantsLoading;
  const error = elementsError;

  // Use the extracted hook for memory economy analysis
  const memoryEconomyAnalysis = useMemoryEconomyAnalysis(
    memoryElementsData, 
    charactersData, 
    puzzlesData, 
    gameConstants
  );

  // Use the extracted columns function
  const columns = useMemo(() => 
    getMemoryTokenTableColumns(workshopMode, gameConstants),
    [workshopMode, gameConstants]
  );

  if (isLoading) {
    return (
      <ErrorBoundary level="page">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4, height: 'calc(100vh - 200px)' }}>
          <CircularProgress /> <Typography sx={{ml:2}}>Loading Memory Economy Workshop...</Typography>
        </Box>
      </ErrorBoundary>
    );
  }

  if (error) {
    return (
      <ErrorBoundary level="page">
        <Container maxWidth="lg" sx={{mt: 2}}>
          <Alert severity="error">Error loading data: {error.message}</Alert>
        </Container>
      </ErrorBoundary>
    );
  }

  const { processedMemoryData, economyStats, pathDistribution, productionStatus, balanceAnalysis } = memoryEconomyAnalysis;

  return (
    <ErrorBoundary level="page">
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
          <MemoryEconomyDashboard 
            analytics={memoryEconomyAnalysis} 
            gameConstants={gameConstants} 
          />
          <ProductionAnalysisPanels 
            pathDistribution={pathDistribution} 
            productionStatus={productionStatus} 
            gameConstants={gameConstants} 
          />
          <BalanceAnalysisAccordion 
            balanceAnalysis={balanceAnalysis} 
          />
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
    </ErrorBoundary>
  );
}


// Keep backwards compatibility
const MemoryEconomyPage = MemoryEconomyWorkshop;

export default MemoryEconomyPage;
export { MemoryEconomyWorkshop };
