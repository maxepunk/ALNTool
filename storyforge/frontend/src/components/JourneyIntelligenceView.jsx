/**
 * JourneyIntelligenceView - Main container for unified intelligence interface
 * Provides entity-level design decision support
 */

import React, { useState, useCallback, lazy, Suspense } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Box, Paper, Typography, CircularProgress } from '@mui/material';
import { useJourneyIntelligenceStore } from '../stores/journeyIntelligenceStore';
import logger from '../utils/logger';

// Import critical components directly
import ErrorBoundary from './JourneyIntelligence/ErrorBoundary';
import EntitySelector from './JourneyIntelligence/EntitySelector';
import IntelligenceToggles from './JourneyIntelligence/IntelligenceToggles';
import PerformanceIndicator from './JourneyIntelligence/PerformanceIndicator';
import EntityTypeLoader from './JourneyIntelligence/EntityTypeLoader';

// Lazy load heavy components
const IntelligencePanel = lazy(() => import('./JourneyIntelligence/IntelligencePanel'));
const AdaptiveGraphCanvas = lazy(() => import('./JourneyIntelligence/AdaptiveGraphCanvas'));
const IntelligenceLayerManager = lazy(() => import('./JourneyIntelligence/IntelligenceManager'));

// Import managers
import useEntityManager from './JourneyIntelligence/EntityManager';
import useGraphManager from './JourneyIntelligence/GraphManager';

// Import common components
import { LoadingSpinner } from './common/LoadingStates';
import ErrorManager from './common/ErrorManager';
import EmptyStateManager from './common/EmptyStateManager';

// Component loading placeholder
const ComponentLoading = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    <CircularProgress size={30} />
  </Box>
);

const JourneyIntelligenceView = () => {
  logger.debug('JourneyIntelligenceView: Rendering...');
  
  const { selectedEntity, viewMode } = useJourneyIntelligenceStore();
  
  // State for progressive entity loading
  const [loadedEntityTypes, setLoadedEntityTypes] = useState([]);
  
  // Handler for progressive entity loading
  const handleLoadEntityType = useCallback((entityType) => {
    setLoadedEntityTypes(prev => 
      prev.includes(entityType) 
        ? prev.filter(t => t !== entityType)
        : [...prev, entityType]
    );
  }, []);

  // Use entity manager for data fetching
  const {
    journeyData,
    characters,
    elements,
    puzzles,
    timelineEvents,
    characterLinks,
    isLoading,
    error,
    focusedCharacterId,
    refreshData,
    syncData
  } = useEntityManager();
  
  // Use graph manager for data processing
  const { graphData, hasData } = useGraphManager({
    journeyData,
    characters,
    elements,
    puzzles,
    timelineEvents,
    characterLinks,
    loadedEntityTypes
  });

  // Loading state
  if (isLoading) {
    return <LoadingSpinner message="Loading journey data..." />;
  }

  // Error state
  if (error) {
    return <ErrorManager error={error} onRetry={refreshData} />;
  }

  // Empty state
  if (!hasData) {
    return (
      <EmptyStateManager 
        onSync={async () => {
          const result = await syncData();
          if (!result.success) {
            alert(`Sync failed: ${result.error}`);
          }
        }}
        onRefresh={refreshData}
      />
    );
  }
  
  logger.debug('JourneyIntelligenceView: Rendering main content', {
    totalNodes: graphData.nodes.length,
    hasData
  });

  return (
    <ReactFlowProvider>
      <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* Control Bar */}
        <Paper sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, zIndex: 10 }}>
          <ErrorBoundary>
            <EntitySelector />
          </ErrorBoundary>
          <ErrorBoundary>
            <IntelligenceToggles />
          </ErrorBoundary>
          <Box sx={{ flex: 1 }} />
          <ErrorBoundary>
            <PerformanceIndicator />
          </ErrorBoundary>
        </Paper>

        {/* Main Content Area */}
        <Box sx={{ flex: 1, display: 'flex', position: 'relative' }}>
          {/* Graph Canvas */}
          <Box 
            sx={{ 
              flex: selectedEntity ? '1 1 70%' : '1 1 100%', 
              height: '100%', 
              position: 'relative',
              width: '100%',
              minHeight: 0,
              backgroundColor: '#0a0a0a', // Ensure graph area has background
              '& .react-flow': {
                backgroundColor: '#0a0a0a'
              }
            }}
            role="region"
            aria-label="Journey Graph"
            data-testid="graph-canvas"
          >
            <ErrorBoundary>
              <Suspense fallback={<ComponentLoading />}>
                <AdaptiveGraphCanvas
                  graphData={graphData}
                  elements={elements || []}
                />
              </Suspense>
            </ErrorBoundary>
            
            {/* Intelligence Layer Overlays */}
            <Suspense fallback={null}>
              <IntelligenceLayerManager nodes={graphData.nodes} />
            </Suspense>
            
            {/* Progressive entity loader */}
            <Box sx={{ 
              position: 'absolute', 
              top: 20, 
              left: 20,
              zIndex: 10
            }}>
              <EntityTypeLoader
                metadata={graphData.metadata}
                onLoadEntityType={handleLoadEntityType}
                loadedTypes={loadedEntityTypes}
              />
            </Box>
          </Box>

          {/* Intelligence Panel */}
          {selectedEntity && (
            <Paper 
              sx={{ flex: '0 0 30%', p: 2, overflow: 'auto' }}
              data-testid="intelligence-panel"
            >
              <Suspense fallback={<ComponentLoading />}>
                <IntelligencePanel entity={selectedEntity} />
              </Suspense>
            </Paper>
          )}
        </Box>
        
        {/* Debug Panel - Remove in production */}
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 20, 
            left: 20, 
            p: 2, 
            maxWidth: 400,
            maxHeight: 300,
            overflow: 'auto',
            bgcolor: 'rgba(0,0,0,0.8)',
            color: 'white',
            zIndex: 9999
          }}
        >
          <Typography variant="caption" display="block">Debug Info</Typography>
          <Typography variant="caption" display="block">
            Graph Nodes: {graphData?.nodes?.length || 0}
          </Typography>
          <Typography variant="caption" display="block">
            Graph Edges: {graphData?.edges?.length || 0}
          </Typography>
          <Typography variant="caption" display="block">
            Character Links: {characterLinks?.length || 0}
          </Typography>
          {characterLinks?.length > 0 && (
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              First Link: {JSON.stringify(characterLinks[0])}
            </Typography>
          )}
        </Paper>
      </Box>
    </ReactFlowProvider>
  );
};

export default JourneyIntelligenceView;