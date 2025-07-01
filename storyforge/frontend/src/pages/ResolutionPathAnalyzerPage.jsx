import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';
import {
  Box, Typography, CircularProgress, Alert, Container, Switch, FormControlLabel
} from '@mui/material';
import PageHeader from '../components/PageHeader';
import PathBalanceOverview from '../components/PathBalanceOverview';
import PathAnalysisTabs from '../components/PathAnalysisTabs';
import RecommendationsPanel from '../components/RecommendationsPanel';
import QuickActionsPanel from '../components/QuickActionsPanel';
import { calculatePathAnalysis } from '../utils/PathAnalysisCalculator';
import { api } from '../services/api';
import { useGameConstants } from '../hooks/useGameConstants';


const ResolutionPathAnalyzerPageContent = () => {
  const [selectedPathTab, setSelectedPathTab] = useState(0);
  const [analysisMode, setAnalysisMode] = useState(true);
  
  // Fetch game constants from backend
  const { data: gameConstants, isLoading: constantsLoading } = useGameConstants();
  
  // Fetch all data needed for comprehensive path analysis
  const { data: charactersData, isLoading: charactersLoading, error: charactersError } = useQuery({
    queryKey: ['charactersForPathAnalysis'],
    queryFn: () => api.getCharacters({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: elementsData, isLoading: elementsLoading } = useQuery({
    queryKey: ['elementsForPathAnalysis'],
    queryFn: () => api.getElements({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: puzzlesData, isLoading: puzzlesLoading } = useQuery({
    queryKey: ['puzzlesForPathAnalysis'],
    queryFn: () => api.getPuzzles({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  
  const { data: timelineEventsData, isLoading: timelineLoading } = useQuery({
    queryKey: ['timelineEventsForPathAnalysis'],
    queryFn: () => api.getTimelineEvents({ limit: 1000 }),
    staleTime: 5 * 60 * 1000
  });
  
  const isLoading = charactersLoading || elementsLoading || puzzlesLoading || timelineLoading || constantsLoading;
  const error = charactersError;

  const characters = charactersData || [];
  const puzzles = puzzlesData || [];
  const elements = elementsData || [];
  const timelineEvents = timelineEventsData || [];

  // Comprehensive Path Analysis for Production Intelligence
  const pathAnalysis = useMemo(() => {
    if (!characters || !elements || !puzzles || !timelineEvents || !gameConstants) return {
      pathDistribution: {},
      pathResources: {},
      crossPathDependencies: [],
      balanceMetrics: {},
      recommendations: []
    };
    
    return calculatePathAnalysis(characters, elements, puzzles, timelineEvents, gameConstants);
  }, [characters, elements, puzzles, timelineEvents, gameConstants]);

  const handleTabChange = (event, newValue) => {
    setSelectedPathTab(newValue);
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

      <PathBalanceOverview 
        pathAnalysis={pathAnalysis}
        gameConstants={gameConstants}
      />

      {analysisMode && (
        <>
          <PathAnalysisTabs 
            pathAnalysis={pathAnalysis}
            gameConstants={gameConstants}
            selectedPathTab={selectedPathTab}
            onTabChange={handleTabChange}
          />

          {/* Recommendations Panel */}
          {recommendations.length > 0 && (
            <RecommendationsPanel recommendations={recommendations} />
          )}
        </>
      )}
      
      <QuickActionsPanel />
    </Container>
  );
};

const ResolutionPathAnalyzerPage = () => (
  <ErrorBoundary level="component">
    <ResolutionPathAnalyzerPageContent />
  </ErrorBoundary>
);

export default ResolutionPathAnalyzerPage;
