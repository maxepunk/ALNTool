import { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, Container, CircularProgress, Typography, Button } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import ErrorBoundary from './components/ErrorBoundary';
import AppLayout from './layouts/AppLayout';
import { api } from './services/api';

// Lazy load components for code splitting
const JourneyIntelligenceView = lazy(() => import('./components/JourneyIntelligenceView'));
const NotFound = lazy(() => import('./pages/NotFound'));
const TestGraph = lazy(() => import('./components/JourneyIntelligence/TestGraph'));

// Loading component for Suspense
const RouteLoading = () => (
  <Box 
    sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}
  >
    <CircularProgress size={40} sx={{ mb: 2 }} />
    <Typography variant="body1">Loading...</Typography>
  </Box>
);

function App() {
  const [initialLoading, setInitialLoading] = useState(true);
  
  // Fetch database metadata on app load
  const { data: metadata, error: metadataError, isSuccess, isError } = useQuery({
    queryKey: ['metadata'],
    queryFn: () => api.getDatabasesMetadata(),
    retry: (failureCount, error) => {
      // Don't retry on 429 rate limit errors or 404/403 client errors
      if (error?.status === 429 || error?.status === 404 || error?.status === 403) {
        return false;
      }
      // Only retry once for other errors (reduced from 2)
      return failureCount < 1;
    },
    retryDelay: 2000, // Wait 2 seconds between retries
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Handle query completion
  useEffect(() => {
    if (isSuccess) {
      console.log('Metadata loaded successfully:', metadata);
      setInitialLoading(false);
    } else if (isError) {
      console.error('Metadata query failed:', metadataError);
      setInitialLoading(false);
    }
  }, [isSuccess, isError, metadata, metadataError]);

  // Add timeout fallback in case the query hangs
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (initialLoading) {
        console.warn('Metadata query timeout - forcing load');
        setInitialLoading(false);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [initialLoading]);

  // If metadata fails to load after retries, show a more persistent error
  if (metadataError && initialLoading === false) {
    return (
      <Container sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        textAlign: 'center',
        p: 4 
      }}>
        <Typography variant="h4" component="h1" gutterBottom color="error">
          Connection Error
        </Typography>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Could not connect to the StoryForge API. Please ensure the backend server is running and accessible.
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mb: 3 }}>
          Error: {metadataError.message}
        </Typography>
        <Button variant="contained" onClick={() => window.location.reload()}>
          Retry Connection
        </Button>
      </Container>
    );
  }

  // Show loading spinner while initial metadata is being fetched
  if (initialLoading) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh' 
        }}
      >
        <CircularProgress size={60} sx={{ mb: 2 }} />
        <Typography variant="h6">Loading StoryForge...</Typography>
      </Box>
    );
  }

  return (
    <AppLayout>
      <ErrorBoundary level="route">
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            {/* Journey Intelligence IS the application */}
            <Route path="/" element={<JourneyIntelligenceView />} />
            
            {/* Debug route for testing graph */}
            <Route path="/test-graph" element={<TestGraph />} />
            
            {/* Redirect all old routes to Journey Intelligence */}
            <Route path="/journey-intelligence" element={<Navigate to="/" replace />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/characters" element={<Navigate to="/" replace />} />
            <Route path="/characters/:id" element={<Navigate to="/" replace />} />
            <Route path="/timelines" element={<Navigate to="/" replace />} />
            <Route path="/timelines/:id" element={<Navigate to="/" replace />} />
            <Route path="/puzzles" element={<Navigate to="/" replace />} />
            <Route path="/puzzles/:id" element={<Navigate to="/" replace />} />
            <Route path="/puzzles/:id/flow" element={<Navigate to="/" replace />} />
            <Route path="/elements" element={<Navigate to="/" replace />} />
            <Route path="/elements/:id" element={<Navigate to="/" replace />} />
            <Route path="/memory-economy" element={<Navigate to="/" replace />} />
            <Route path="/element-puzzle-economy" element={<Navigate to="/" replace />} />
            <Route path="/character-sociogram" element={<Navigate to="/" replace />} />
            <Route path="/narrative-thread-tracker" element={<Navigate to="/" replace />} />
            <Route path="/resolution-path-analyzer" element={<Navigate to="/" replace />} />
            <Route path="/player-journey" element={<Navigate to="/" replace />} />
            
            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </AppLayout>
  );
}

export default App;