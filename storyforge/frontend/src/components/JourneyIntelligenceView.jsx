/**
 * JourneyIntelligenceView - Main container for unified intelligence interface
 * Provides entity-level design decision support
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { Box, Paper, Typography, CircularProgress, Button, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useJourneyIntelligenceStore } from '../stores/journeyIntelligenceStore';
import api from '../services/api';
import logger from '../utils/logger';
import { 
  createForceSimulation, 
  runSimulation, 
  constrainNodesToViewport, 
  getViewportBounds,
  calculateRadialLayout,
  generateInitialPositions
} from '../utils/layoutUtils';
import { calculateNodeSize, calculateEdgeStyle } from '../utils/nodeSizeCalculator';

// Import data hooks
import { useTransformedElements } from '../hooks/useTransformedElements';
import { useCharacterJourney, useAllCharacters } from '../hooks/useCharacterJourney';
import { 
  transformCharacter, 
  transformPuzzle, 
  transformTimelineEvent,
  createOwnershipEdges,
  createContainerEdges,
  createPuzzleEdges
} from '../utils/dataTransformers';

// Import sub-components (to be created)
import ErrorBoundary from './JourneyIntelligence/ErrorBoundary';
import EntitySelector from './JourneyIntelligence/EntitySelector';
import IntelligenceToggles from './JourneyIntelligence/IntelligenceToggles';
import IntelligencePanel from './JourneyIntelligence/IntelligencePanel';
import AdaptiveGraphCanvas from './JourneyIntelligence/AdaptiveGraphCanvas';
import PerformanceIndicator from './JourneyIntelligence/PerformanceIndicator';
import EntityTypeLoader from './JourneyIntelligence/EntityTypeLoader';

// Import intelligence layer overlays
import EconomicLayer from './JourneyIntelligence/EconomicLayer';
import StoryIntelligenceLayer from './JourneyIntelligence/StoryIntelligenceLayer';
import SocialIntelligenceLayer from './JourneyIntelligence/SocialIntelligenceLayer';
import ProductionIntelligenceLayer from './JourneyIntelligence/ProductionIntelligenceLayer';
import ContentGapsLayer from './JourneyIntelligence/ContentGapsLayer';

const JourneyIntelligenceView = () => {
  logger.debug('JourneyIntelligenceView: Rendering...');
  
  const {
    selectedEntity,
    viewMode,
    activeIntelligence,
    performanceMode,
    visibleNodeCount,
    selectEntity,
    updateNodeCount
  } = useJourneyIntelligenceStore();
  
  // State for progressive entity loading
  const [loadedEntityTypes, setLoadedEntityTypes] = useState([]);
  
  // Handler for progressive entity loading
  const handleLoadEntityType = useCallback((entityType) => {
    setLoadedEntityTypes(prev => {
      if (prev.includes(entityType)) {
        // Remove if already loaded (toggle off)
        return prev.filter(t => t !== entityType);
      } else {
        // Add to loaded types
        return [...prev, entityType];
      }
    });
  }, []);

  // Determine which view mode we're in
  const isCharacterFocused = selectedEntity?.type === 'character';
  const focusedCharacterId = isCharacterFocused ? selectedEntity.id : null;
  
  // Fetch data based on view mode
  // When a character is focused, use Journey API for optimized graph
  const { 
    data: journeyData, 
    isLoading: isLoadingJourney, 
    error: journeyError 
  } = useCharacterJourney(focusedCharacterId, {
    enabled: !!focusedCharacterId
  });
  
  // For overview mode, fetch all entities
  const { 
    data: characters, 
    isLoading: isLoadingCharacters, 
    error: charactersError,
    refetch: refetchCharacters 
  } = useAllCharacters({
    enabled: !focusedCharacterId // Only fetch when not in character focus mode
  });
  
  // Always fetch elements for intelligence analysis - now with proper transformations
  const { 
    data: elements, 
    isLoading: isLoadingElements, 
    error: elementsError,
    refetch: refetchElements 
  } = useTransformedElements({
    includeMemoryTokens: true
  });
  
  // Fetch puzzles for overview mode
  const {
    data: puzzles,
    isLoading: isLoadingPuzzles,
    error: puzzlesError
  } = useQuery({
    queryKey: ['puzzles'],
    queryFn: () => api.getPuzzles(),
    enabled: !focusedCharacterId,
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch timeline events for overview mode
  const {
    data: timelineEvents,
    isLoading: isLoadingTimeline,
    error: timelineError
  } = useQuery({
    queryKey: ['timeline-events'],
    queryFn: () => api.getTimelineEvents(),
    enabled: !focusedCharacterId,
    staleTime: 5 * 60 * 1000
  });
  
  // Fetch character relationships for overview mode
  const {
    data: characterLinks,
    isLoading: isLoadingLinks,
    error: linksError
  } = useQuery({
    queryKey: ['character-links'],
    queryFn: async () => {
      const links = await api.getCharacterLinks();
      // Transform the links to include unique IDs if needed
      return links.map((link, index) => ({
        ...link,
        id: `link-${link.source}-${link.target}-${index}`
      }));
    },
    enabled: !focusedCharacterId,
    staleTime: 5 * 60 * 1000
  });
  
  // Combined loading and error states
  // Only count as loading if the query is actually enabled
  const isLoading = (focusedCharacterId ? isLoadingJourney : (isLoadingCharacters || isLoadingPuzzles || isLoadingTimeline || isLoadingLinks)) || isLoadingElements;
  const error = journeyError || charactersError || elementsError || puzzlesError || timelineError || linksError;
  
  logger.debug('JourneyIntelligenceView: Data state', {
    isLoading,
    hasError: !!error,
    charactersCount: characters?.length || 0,
    elementsCount: elements?.length || 0,
    puzzlesCount: puzzles?.length || 0,
    timelineEventsCount: timelineEvents?.length || 0,
    focusedCharacterId,
    // Debug individual loading states
    isLoadingJourney,
    isLoadingCharacters,
    isLoadingElements,
    isLoadingPuzzles,
    isLoadingTimeline
  });
  
  // State for force simulation
  const simulationRef = useRef(null);
  const [layoutReady, setLayoutReady] = useState(false);
  
  // Prepare data for AdaptiveGraphCanvas based on mode
  const graphData = useMemo(() => {
    if (focusedCharacterId && journeyData) {
      // Use pre-computed journey graph from backend
      // Map backend node types to our frontend types
      const mappedNodes = journeyData.graph.nodes.map(node => {
        // Map backend types to frontend types
        let mappedType = node.type;
        if (node.type === 'loreNode') {
          mappedType = 'timeline_event';
        } else if (node.type === 'discoveryNode') {
          mappedType = 'element';
        } else if (node.type === 'activityNode') {
          mappedType = 'puzzle';
        }
        
        return {
          ...node,
          type: mappedType
        };
      });
      
      // Filter out edges that reference non-existent nodes
      const nodeIds = new Set(mappedNodes.map(n => n.id));
      const validEdges = journeyData.graph.edges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
      
      // Apply edge styling to valid journey edges
      const styledEdges = validEdges.map(edge => ({
        ...edge,
        style: calculateEdgeStyle(edge)
      }));
      
      return {
        nodes: mappedNodes,
        edges: styledEdges,
        metadata: {
          characterInfo: journeyData.character_info,
          isJourneyView: true
        }
      };
    } else {
      // Build overview showing ONLY characters initially
      // This addresses the critical UX issue of overwhelming initial load
      const nodes = [];
      const edges = [];
      
      // Create initial nodes - we'll set positions after creating all nodes
      if (characters && characters.length > 0) {
        // First, calculate relationship counts for each character
        const relationshipCounts = {};
        if (characterLinks && characterLinks.length > 0) {
          characterLinks.forEach(link => {
            relationshipCounts[link.source] = (relationshipCounts[link.source] || 0) + 1;
            relationshipCounts[link.target] = (relationshipCounts[link.target] || 0) + 1;
          });
        }
        
        characters.forEach((char, index) => {
          // Transform character data
          const transformedChar = transformCharacter(char);
          
          const nodeData = {
            ...transformedChar,
            label: char.name,
            relationshipCount: relationshipCounts[char.id] || 0
          };
          
          const node = {
            id: char.id,
            type: 'character', // Use custom character node type
            data: nodeData,
            position: { x: 0, y: 0 } // Temporary, will be set by pre-layout
          };
          
          // Calculate and store the size in the node data
          node.data.size = calculateNodeSize(node);
          
          nodes.push(node);
        });
      }
      
      // Add character relationship edges
      if (characterLinks && characterLinks.length > 0) {
        characterLinks.forEach(link => {
          const edge = {
            id: link.id,
            source: link.source,
            target: link.target,
            type: 'smoothstep',
            animated: false,
            data: {
              strength: link.strength || 1,
              type: link.type || 'character-character'
            }
          };
          
          // Apply dynamic edge styling based on type and strength
          edge.style = calculateEdgeStyle(edge);
          
          edges.push(edge);
        });
      }
      
      // Store other entities for progressive loading
      const hiddenEntities = {
        elements: elements || [],
        puzzles: puzzles || [],
        timelineEvents: timelineEvents || []
      };
      
      // Add progressively loaded entities with temporary positions
      // Pre-layout will organize them properly
      if (loadedEntityTypes.includes('elements') && elements) {
        // Elements are already transformed by useTransformedElements hook
        elements.forEach((elem, index) => {
          const node = {
            id: elem.id,
            type: 'element', // Use custom element node type
            data: {
              ...elem,
              label: elem.name || `Element ${elem.id}`
            },
            position: { x: 0, y: 0 } // Temporary, will be set by pre-layout
          };
          
          // Calculate and store the size in the node data
          node.data.size = calculateNodeSize(node);
          
          nodes.push(node);
        });
        
        // Create ownership and container edges using utility functions
        edges.push(...createOwnershipEdges(elements));
        edges.push(...createContainerEdges(elements));
      }
      
      if (loadedEntityTypes.includes('puzzles') && puzzles) {
        puzzles.forEach((puzzle, index) => {
          // Transform puzzle data
          const transformedPuzzle = transformPuzzle(puzzle);
          
          const node = {
            id: puzzle.id,
            type: 'puzzle', // Use custom puzzle node type
            data: {
              ...transformedPuzzle,
              label: puzzle.puzzle || puzzle.name || `Puzzle ${puzzle.id}`
            },
            position: { x: 0, y: 0 } // Temporary, will be set by pre-layout
          };
          
          // Calculate and store the size in the node data
          node.data.size = calculateNodeSize(node);
          
          nodes.push(node);
        });
        
        // Create puzzle edges using utility function
        edges.push(...createPuzzleEdges(puzzles.map(transformPuzzle)));
      }
      
      if (loadedEntityTypes.includes('timelineEvents') && timelineEvents) {
        timelineEvents.forEach((event, index) => {
          const node = {
            id: event.id,
            type: 'timeline_event', // Use custom timeline event node type
            data: {
              ...event,
              label: event.description || `Timeline Event ${event.id}`,
              type: 'timeline_event',
              entityCategory: 'timeline_event'
            },
            position: { x: 0, y: 0 } // Temporary, will be set by pre-layout
          };
          
          // Calculate and store the size in the node data
          node.data.size = calculateNodeSize(node);
          
          nodes.push(node);
        });
      }
      
      // Apply pre-layout positions to prevent clustering
      const viewportWidth = window.innerWidth * (selectedEntity ? 0.7 : 1); // Account for panel
      const viewportHeight = window.innerHeight - 100; // Account for control bar
      
      const initialPositions = generateInitialPositions(nodes, {
        width: viewportWidth,
        height: viewportHeight
      });
      
      // Update node positions with pre-layout
      nodes.forEach(node => {
        const position = initialPositions[node.id];
        if (position) {
          node.position = position;
        }
      });
      
      // Filter edges to only include those where both source and target nodes exist
      const nodeIds = new Set(nodes.map(n => n.id));
      const validEdges = edges.filter(edge => 
        nodeIds.has(edge.source) && nodeIds.has(edge.target)
      );
      
      // Log any edges that were filtered out for debugging
      const filteredOutCount = edges.length - validEdges.length;
      if (filteredOutCount > 0) {
        logger.debug(`Filtered out ${filteredOutCount} edges with missing nodes`);
      }
      
      return {
        nodes,
        edges: validEdges,
        metadata: {
          isOverviewMode: true,
          isCharactersOnly: loadedEntityTypes.length === 0,
          totalCharacters: characters?.length || 0,
          totalEntities: (characters?.length || 0) + 
                        (elements?.length || 0) + 
                        (puzzles?.length || 0) + 
                        (timelineEvents?.length || 0),
          hiddenEntities,
          loadedTypes: loadedEntityTypes
        }
      };
    }
  }, [focusedCharacterId, journeyData, characters, elements, puzzles, timelineEvents, characterLinks, loadedEntityTypes]);

  // Loading state
  if (isLoading) {
    logger.debug('JourneyIntelligenceView: Showing loading state');
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, p: 4 }}>
        <div data-testid="loading-skeleton">
          <CircularProgress />
        </div>
        <Typography>Loading journey data...</Typography>
      </Box>
    );
  }

  // Error state
  if (error) {
    logger.debug('JourneyIntelligenceView: Showing error state', error);
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">
          <Typography>Unable to load journey data</Typography>
        </Alert>
      </Box>
    );
  }

  // Empty state - check if we have ANY data
  const hasData = (characters && characters.length > 0) || 
                  (elements && elements.length > 0) || 
                  (puzzles && puzzles.length > 0) || 
                  (timelineEvents && timelineEvents.length > 0);
                  
  if (!hasData) {
    logger.debug('JourneyIntelligenceView: Showing empty state', { 
      characters: characters?.length || 0,
      elements: elements?.length || 0,
      puzzles: puzzles?.length || 0,
      timelineEvents: timelineEvents?.length || 0
    });
    
    // Empty state with clear CTAs
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        height: '100vh',
        gap: 3,
        p: 4
      }}>
        <Paper sx={{ p: 4, maxWidth: 600, textAlign: 'center' }}>
          <Typography variant="h5" gutterBottom>
            Welcome to Journey Intelligence
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            No game data found. To get started, you'll need to sync data from Notion.
          </Typography>
          
          <Alert severity="info" sx={{ mb: 3, textAlign: 'left' }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>What this tool does:</strong>
            </Typography>
            <ul style={{ margin: 0, paddingLeft: '20px' }}>
              <li>Visualizes character journeys and relationships</li>
              <li>Shows element dependencies and puzzle connections</li>
              <li>Provides design intelligence for game balancing</li>
              <li>Tracks production requirements and dependencies</li>
            </ul>
          </Alert>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button 
              variant="contained" 
              size="large"
              onClick={async () => {
                try {
                  // Trigger backend sync
                  const response = await fetch('/api/sync/data', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                  });
                  
                  if (response.ok) {
                    // Wait a moment for sync to complete, then refresh
                    setTimeout(() => {
                      refetchCharacters();
                      refetchElements();
                    }, 2000);
                  } else {
                    const error = await response.json();
                    alert(`Sync failed: ${error.message || 'Unknown error'}`);
                  }
                } catch (err) {
                  alert(`Sync error: ${err.message}`);
                }
              }}
            >
              Sync Data from Notion
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => {
                refetchCharacters();
                refetchElements();
              }}
            >
              Refresh Data
            </Button>
            
            <Typography variant="caption" sx={{ mt: 2, color: 'text.secondary' }}>
              Need help? Check the <a href="#" style={{ color: 'inherit' }}>documentation</a> or contact support.
            </Typography>
          </Box>
        </Paper>
      </Box>
    );
  }
  
  logger.debug('JourneyIntelligenceView: Rendering main content with', {
    charactersCount: characters?.length || 0,
    elementsCount: elements?.length || 0,
    puzzlesCount: puzzles?.length || 0,
    timelineEventsCount: timelineEvents?.length || 0,
    totalNodesCount: graphData.nodes.length,
    sampleNodes: graphData.nodes.slice(0, 3).map(n => ({
      id: n.id,
      type: n.type,
      position: n.position,
      hasPosition: !!n.position
    }))
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
              minHeight: 0 // Important for flexbox children
            }}
            role="region"
            aria-label="Journey Graph"
            data-testid="graph-canvas"
          >
            <ErrorBoundary>
              <AdaptiveGraphCanvas
                graphData={graphData}
                elements={elements || []} // Keep for intelligence analysis
              />
            </ErrorBoundary>
            
            {/* Intelligence Layer Overlays */}
            <EconomicLayer nodes={graphData.nodes} />
            <StoryIntelligenceLayer nodes={graphData.nodes} />
            <SocialIntelligenceLayer nodes={graphData.nodes} />
            <ProductionIntelligenceLayer nodes={graphData.nodes} />
            <ContentGapsLayer nodes={graphData.nodes} />
            
            {/* Progressive entity loader in overview mode */}
            {viewMode === 'overview' && !focusedCharacterId && (
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
            )}
            
            {/* Overview text when no selection */}
            {viewMode === 'overview' && (
              <Box sx={{ 
                position: 'absolute', 
                bottom: 20, 
                left: 20, 
                backgroundColor: 'rgba(255,255,255,0.9)',
                p: 2,
                borderRadius: 1
              }}>
                <Typography>Select any entity to explore</Typography>
              </Box>
            )}
          </Box>

          {/* Intelligence Panel */}
          {selectedEntity && (
            <Paper 
              sx={{ flex: '0 0 30%', p: 2, overflow: 'auto' }}
              data-testid="intelligence-panel"
            >
              <IntelligencePanel entity={selectedEntity} />
            </Paper>
          )}
        </Box>
      </Box>
    </ReactFlowProvider>
  );
};

export default JourneyIntelligenceView;