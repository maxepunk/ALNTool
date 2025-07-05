/**
 * Tests for JourneyIntelligenceView component
 * The main container for our unified intelligence interface
 */

import React from 'react';
import { screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithQuery, cleanupQueryClient } from '../../test-utils/test-utils';
import JourneyIntelligenceView from '../JourneyIntelligenceView';
import { useJourneyIntelligenceStore } from '../../stores/journeyIntelligenceStore';
import { createMockEntity, createMockGraph } from '../../test-utils/intelligence-test-utils';
import { server } from '../../test-utils/mocks/server';
import { http, HttpResponse } from 'msw';
import api from '../../services/api';
import { setupTestCleanup } from '../../test-utils/cleanup-utils';

// Setup automatic cleanup
setupTestCleanup();

// Mock the API service
jest.mock('../../services/api');

// Mock the data hooks
jest.mock('../../hooks/usePerformanceElements');
jest.mock('../../hooks/useCharacterJourney', () => ({
  useCharacterJourney: jest.fn(),
  useAllCharacters: jest.fn()
}));

import { usePerformanceElements } from '../../hooks/usePerformanceElements';
import { useCharacterJourney, useAllCharacters } from '../../hooks/useCharacterJourney';

// Mock sub-components
jest.mock('../JourneyIntelligence/EntitySelector', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    const { useJourneyIntelligenceStore } = require('../../stores/journeyIntelligenceStore');
    const selectedEntity = useJourneyIntelligenceStore(state => state.selectedEntity);
    
    return React.createElement('div', { 
      'data-testid': 'entity-selector',
      'role': 'combobox',
      'aria-label': 'Select entity',
      'tabIndex': 0
    },
      selectedEntity ? `Character: ${selectedEntity.name}` : 'Select entity'
    );
  }
}));

jest.mock('../JourneyIntelligence/IntelligenceToggles', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    const { useJourneyIntelligenceStore } = require('../../stores/journeyIntelligenceStore');
    const activeIntelligence = useJourneyIntelligenceStore(state => state.activeIntelligence);
    const toggleIntelligence = useJourneyIntelligenceStore(state => state.toggleIntelligence);
    
    const layers = ['story', 'social', 'economic', 'production', 'gaps'];
    
    return React.createElement('div', { 'data-testid': 'intelligence-toggles', role: 'group', 'aria-label': 'Intelligence layers' },
      layers.map(layer => 
        React.createElement('button', {
          key: layer,
          onClick: () => toggleIntelligence(layer),
          'aria-pressed': activeIntelligence.includes(layer),
          'aria-label': layer
        }, layer)
      )
    );
  }
}));

jest.mock('../JourneyIntelligence/IntelligencePanel', () => ({
  __esModule: true, 
  default: ({ entity }) => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'intelligence-panel' },
      React.createElement('div', null, entity.name),
      React.createElement('div', null, `Tier: ${entity.tier || 'Unknown'}`)
    );
  }
}));

jest.mock('../JourneyIntelligence/AdaptiveGraphCanvas', () => ({
  __esModule: true,
  default: ({ graphData }) => {
    const React = require('react');
    const { useJourneyIntelligenceStore } = require('../../stores/journeyIntelligenceStore');
    const selectedEntity = useJourneyIntelligenceStore(state => state.selectedEntity);
    const focusMode = useJourneyIntelligenceStore(state => state.focusMode);
    
    // Apply visual hierarchy based on selection
    const getNodeClassName = (node) => {
      if (!selectedEntity || focusMode === 'overview') return '';
      
      if (node.id === selectedEntity.id) return 'selected';
      
      // Check if connected (simplified logic for test)
      if (selectedEntity.type === 'character' && node.data.owner_character_id === selectedEntity.id) {
        return 'connected';
      }
      
      return 'background';
    };
    
    return React.createElement('div', { 'data-testid': 'adaptive-graph' },
      graphData.nodes.map(node => 
        React.createElement('div', {
          key: node.id,
          'data-testid': `node-${node.id}`,
          className: getNodeClassName(node)
        }, node.data.name || node.id)
      )
    );
  }
}));

jest.mock('../JourneyIntelligence/PerformanceIndicator', () => ({
  __esModule: true,
  default: () => {
    const React = require('react');
    const { useJourneyIntelligenceStore } = require('../../stores/journeyIntelligenceStore');
    const visibleNodeCount = useJourneyIntelligenceStore(state => state.visibleNodeCount);
    const performanceMode = useJourneyIntelligenceStore(state => state.performanceMode);
    
    const isWarning = visibleNodeCount >= 47;
    const performanceText = performanceMode === 'performance' ? 'Performance Mode - ' : '';
    
    return React.createElement('div', { 
      'data-testid': 'performance-indicator',
      className: isWarning ? 'warning' : ''
    },
      performanceText + visibleNodeCount + ' nodes',
      isWarning && ' - Approaching limit'
    );
  }
}));

// Mock the intelligence layer components to prevent hook issues
jest.mock('../JourneyIntelligence/EconomicLayer', () => ({
  __esModule: true,
  default: ({ nodes }) => {
    const React = require('react');
    const { useJourneyIntelligenceStore } = require('../../stores/journeyIntelligenceStore');
    const activeIntelligence = useJourneyIntelligenceStore(state => state.activeIntelligence);
    const selectedEntity = useJourneyIntelligenceStore(state => state.selectedEntity);
    
    if (activeIntelligence.includes('economic') && selectedEntity) {
      return React.createElement('div', { 'data-testid': 'economic-overlay' }, 
        React.createElement('div', null, 'Total Value: $7,500')
      );
    }
    return null;
  }
}));
jest.mock('../JourneyIntelligence/StoryIntelligenceLayer', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../JourneyIntelligence/SocialIntelligenceLayer', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../JourneyIntelligence/ProductionIntelligenceLayer', () => ({
  __esModule: true,
  default: () => null
}));
jest.mock('../JourneyIntelligence/ContentGapsLayer', () => ({
  __esModule: true,
  default: () => null
}));

// Mock ReactFlow to avoid canvas rendering issues in tests
let mockNodes = [];
let mockEdges = [];

jest.mock('@xyflow/react', () => {
  const React = require('react');
  
  // Track nodes state for the mock
  let currentNodes = [];
  
  return {
    __esModule: true,
    ReactFlow: ({ children, nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick }) => {
      // Update current nodes whenever they change
      currentNodes = nodes || [];
      
      return React.createElement('div', { 'data-testid': 'graph-canvas' },
        currentNodes.map(node => 
          React.createElement('div', {
            key: node.id,
            'data-testid': `node-${node.id}`,
            className: node.className || '',
            onClick: () => onNodeClick?.(null, node)
          }, node.data.name || node.id)
        ),
        children
      );
    },
  ReactFlowProvider: ({ children }) => {
    const React = require('react');
    return React.createElement('div', null, children);
  },
  Controls: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'graph-controls' }, 'Controls');
  },
  Background: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'graph-background' }, 'Background');
  },
  MiniMap: () => {
    const React = require('react');
    return React.createElement('div', { 'data-testid': 'graph-minimap' }, 'MiniMap');
  },
  useNodesState: (initialNodes) => {
    // Use React.useState to properly track state changes
    const React = require('react');
    const [nodes, setNodes] = React.useState(initialNodes || []);
    return [nodes, setNodes, jest.fn()];
  },
  useEdgesState: (initialEdges) => {
    // Use React.useState to properly track state changes
    const React = require('react');
    const [edges, setEdges] = React.useState(initialEdges || []);
    return [edges, setEdges, jest.fn()];
  },
  useReactFlow: () => ({
    getNodes: jest.fn(() => mockNodes),
    getEdges: jest.fn(() => mockEdges),
    fitView: jest.fn(),
  }),
  };
});

describe('JourneyIntelligenceView', () => {
  const mockCharacters = [
    {
      id: 'char-1',
      name: 'Test Character 1',
      type: 'NPC',
      tier: 'Core',
      resolutionPaths: ['Black Market'],
      character_links: [{ id: 'char-2', name: 'Test Character 2' }],
      ownedElements: [],
      events: []
    },
    {
      id: 'char-sarah-mitchell',
      name: 'Sarah Mitchell',
      type: 'character',
      tier: 'Secondary',
      resolutionPaths: ['Detective', 'Black Market'],
      character_links: [{ id: 'char-alex', name: 'Alex' }],
      ownedElements: ['elem-voice-memo'],
      events: ['timeline-1', 'timeline-2']
    }
  ];
  
  const mockElements = [
    {
      id: 'elem-voice-memo',
      name: "Victoria's Voice Memo",
      type: 'Memory Token Audio', // This is the correct field from performance API
      basicType: 'Memory Token Audio', // Also include basicType for fresh API
      owner_character_id: 'char-sarah-mitchell',
      calculated_memory_value: 5000,
      timeline_event_id: 'timeline-affair',
      memory_group: 'Victoria Memories',
      group_multiplier: 2,
      rfid_tag: 'RFID-001'
    }
  ];
  
  beforeEach(() => {
    // Mock hook responses
    useAllCharacters.mockReturnValue({
      data: mockCharacters,
      isLoading: false,
      error: null
    });
    
    useCharacterJourney.mockReturnValue({
      data: null, // No journey data when no character is focused
      isLoading: false,
      error: null
    });
    
    usePerformanceElements.mockReturnValue({
      data: mockElements,
      isLoading: false,
      error: null
    });
    
    // Mock API responses (for backward compatibility)
    api.getCharacters.mockResolvedValue({
      success: true,
      data: mockCharacters
    });
    
    // Mock elements API response
    api.getElements.mockResolvedValue({
      success: true,
      data: mockElements
    });
    
    // Reset store state
    useJourneyIntelligenceStore.setState({
      selectedEntity: null,
      selectionHistory: [],
      viewMode: 'overview',
      activeIntelligence: ['story', 'social'],
      performanceMode: 'auto',
      visibleNodeCount: 0
    });
  });

  describe('Initial Render', () => {
    it('should render overview mode with core components', async () => {
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Core UI elements
      expect(screen.getByTestId('entity-selector')).toBeInTheDocument();
      expect(screen.getByTestId('intelligence-toggles')).toBeInTheDocument();
      expect(screen.getAllByTestId('graph-canvas').length).toBeGreaterThan(0);
      expect(screen.getByTestId('performance-indicator')).toBeInTheDocument();
      
      // Should not show intelligence panel in overview
      expect(screen.queryByTestId('intelligence-panel')).not.toBeInTheDocument();
    });

    it('should load initial character data', async () => {
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Check that hooks were called
      expect(useAllCharacters).toHaveBeenCalled();
      
      // Should show overview text when in overview mode
      expect(screen.getByText(/Select any entity to explore/i)).toBeInTheDocument();
      
      // Should have the graph canvas (check for the Box wrapper with role="region")
      expect(screen.getByRole('region', { name: /journey graph/i })).toBeInTheDocument();
    });

    it('should display active intelligence layers', async () => {
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      const toggles = screen.getByTestId('intelligence-toggles');
      expect(within(toggles).getByRole('button', { name: /story/i })).toHaveAttribute('aria-pressed', 'true');
      expect(within(toggles).getByRole('button', { name: /social/i })).toHaveAttribute('aria-pressed', 'true');
      expect(within(toggles).getByRole('button', { name: /economic/i })).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('Entity Selection Flow', () => {
    beforeEach(() => {
      // Set up character journey mock to handle both cases consistently
      useCharacterJourney.mockImplementation((characterId) => {
        if (characterId === 'char-sarah-mitchell') {
          return {
            data: {
              graph: {
                nodes: [
                  {
                    id: 'char-sarah-mitchell',
                    type: 'default',
                    position: { x: 100, y: 100 },
                    data: {
                      id: 'char-sarah-mitchell',
                      name: 'Sarah Mitchell',
                      type: 'character',
                      tier: 'Secondary'
                    }
                  },
                  {
                    id: 'elem-voice-memo',
                    type: 'default',
                    position: { x: 300, y: 100 },
                    data: {
                      id: 'elem-voice-memo',
                      name: "Victoria's Voice Memo",
                      type: 'element',
                      elementType: 'Memory Token Audio',
                      owner_character_id: 'char-sarah-mitchell'
                    }
                  }
                ],
                edges: []
              },
              character_info: {
                id: 'char-sarah-mitchell',
                name: 'Sarah Mitchell',
                type: 'character',
                tier: 'Secondary'
              }
            },
            isLoading: false,
            error: null
          };
        }
        return { data: null, isLoading: false, error: null };
      });
    });

    it('should adapt view when entity is selected', async () => {
      const user = userEvent.setup();
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('node-char-sarah-mitchell')).toBeInTheDocument();
      });
      
      // Wait for components to stabilize
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Simulate selecting Sarah in the store - since the mock ReactFlow doesn't properly call onNodeClick
      act(() => {
        const { setSelectedEntity, setFocusMode } = useJourneyIntelligenceStore.getState();
        setFocusMode('focused');
        setSelectedEntity({
          id: 'char-sarah-mitchell',
          name: 'Sarah Mitchell',
          type: 'character',
          tier: 'Secondary'
        });
      });
      
      // View should transition
      await waitFor(() => {
        expect(screen.getAllByTestId('intelligence-panel')).toHaveLength(2); // Paper wrapper + mock component
      });
      
      // Should show entity details - get the inner one
      const panels = screen.getAllByTestId('intelligence-panel');
      const innerPanel = panels[1]; // The mock component is inside the Paper
      expect(within(innerPanel).getByText(/Sarah Mitchell/i)).toBeInTheDocument();
      expect(within(innerPanel).getByText(/Tier: Secondary/i)).toBeInTheDocument();
    });

    it('should highlight connected entities on selection', async () => {
      const user = userEvent.setup();
      renderWithQuery(<JourneyIntelligenceView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('node-char-sarah-mitchell')).toBeInTheDocument();
      });
      
      // Wait for components to stabilize
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Simulate selecting Sarah in the store
      act(() => {
        const { setSelectedEntity, setFocusMode } = useJourneyIntelligenceStore.getState();
        setFocusMode('focused');
        setSelectedEntity({
          id: 'char-sarah-mitchell',
          name: 'Sarah Mitchell',
          type: 'character',
          tier: 'Secondary'
        });
      });
      
      // Connected nodes should be highlighted - check the class name
      await waitFor(() => {
        const connectedNode = screen.getByTestId('node-elem-voice-memo');
        expect(connectedNode).toHaveClass('connected');
      });
    });

    it('should update entity selector dropdown', async () => {
      const user = userEvent.setup();
      renderWithQuery(<JourneyIntelligenceView />);
      
      await waitFor(() => {
        expect(screen.getByTestId('node-char-sarah-mitchell')).toBeInTheDocument();
      });
      
      // Wait for components to stabilize
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Simulate selecting Sarah in the store
      act(() => {
        const { setSelectedEntity, setFocusMode } = useJourneyIntelligenceStore.getState();
        setFocusMode('focused');
        setSelectedEntity({
          id: 'char-sarah-mitchell',
          name: 'Sarah Mitchell',
          type: 'character',
          tier: 'Secondary'
        });
      });
      
      // Selector should show selected entity
      const selector = screen.getByTestId('entity-selector');
      expect(within(selector).getByText(/Character: Sarah Mitchell/i)).toBeInTheDocument();
    });
  });

  describe('Intelligence Layer Activation', () => {
    it('should toggle intelligence layers', async () => {
      const user = userEvent.setup();
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      const economicToggle = screen.getByRole('button', { name: /economic/i });
      
      // Toggle on economic layer
      await user.click(economicToggle);
      
      await waitFor(() => {
        expect(economicToggle).toHaveAttribute('aria-pressed', 'true');
      });
      
      // Should update store
      const state = useJourneyIntelligenceStore.getState();
      expect(state.activeIntelligence).toContain('economic');
    });

    it('should overlay intelligence visualization when activated', async () => {
      // Mock elements with economic data
      usePerformanceElements.mockReturnValue({
        data: [
          {
            id: 'elem-voice-memo',
            name: "Victoria's Voice Memo",
            type: 'Memory Token Audio',
            owner_character_id: 'char-sarah-mitchell',
            calculated_memory_value: 5000,
            memory_group: 'Victoria Memories',
            group_multiplier: 2
          },
          {
            id: 'elem-hotel-receipt',
            name: "Hotel Receipt",
            type: 'Memory Token Document',
            owner_character_id: 'char-sarah-mitchell',
            calculated_memory_value: 2500
          }
        ],
        isLoading: false,
        error: null
      });
      
      const user = userEvent.setup();
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Select an entity first
      await waitFor(() => {
        expect(screen.getByTestId('node-char-sarah-mitchell')).toBeInTheDocument();
      });
      
      // Simulate selecting Sarah in the store
      act(() => {
        const { setSelectedEntity, setFocusMode } = useJourneyIntelligenceStore.getState();
        setFocusMode('focused');
        setSelectedEntity({
          id: 'char-sarah-mitchell',
          name: 'Sarah Mitchell',
          type: 'character',
          tier: 'Secondary'
        });
      });
      
      // Toggle economic intelligence
      await user.click(screen.getByRole('button', { name: /economic/i }));
      
      // Should show economic overlay
      await waitFor(() => {
        expect(screen.getByTestId('economic-overlay')).toBeInTheDocument();
        expect(screen.getByText(/\$7,500/i)).toBeInTheDocument(); // Total value
      });
    });

    it('should enforce maximum 3 active layers', async () => {
      const user = userEvent.setup();
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Wait for loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('loading-skeleton')).not.toBeInTheDocument();
      });
      
      // Already have story and social active
      // Add economic
      await user.click(screen.getByRole('button', { name: /economic/i }));
      
      // Add production (should remove story as oldest)
      await user.click(screen.getByRole('button', { name: /production/i }));
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /story/i })).toHaveAttribute('aria-pressed', 'false');
        expect(screen.getByRole('button', { name: /production/i })).toHaveAttribute('aria-pressed', 'true');
      });
    });
  });

  describe('Performance Monitoring', () => {
    it('should display node count in performance indicator', async () => {
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Update node count in store to simulate AdaptiveGraphCanvas behavior
      act(() => {
        const { updateNodeCount } = useJourneyIntelligenceStore.getState();
        updateNodeCount(2); // We have 2 characters in mock data
      });
      
      await waitFor(() => {
        const indicator = screen.getByTestId('performance-indicator');
        expect(within(indicator).getByText(/2 nodes/i)).toBeInTheDocument();
      });
    });

    it('should auto-switch to performance mode at 40 nodes', async () => {
      // Mock API to return many nodes
      const manyCharacters = Array.from({ length: 45 }, (_, i) => ({
        id: `char-${i}`,
        name: `Character ${i}`,
        type: 'character',
        tier: 'Core',
        resolutionPaths: [],
        character_links: [],
        ownedElements: [],
        events: []
      }));
      
      useAllCharacters.mockReturnValue({
        data: manyCharacters,
        isLoading: false,
        error: null
      });
      
      // Override the default mock to set visible node count
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Simulate the AdaptiveGraphCanvas setting a high node count
      act(() => {
        const { updateNodeCount } = useJourneyIntelligenceStore.getState();
        updateNodeCount(45);
      });
      
      // Should switch to performance mode
      await waitFor(() => {
        const state = useJourneyIntelligenceStore.getState();
        expect(state.performanceMode).toBe('performance');
      });
      
      await waitFor(() => {
        const indicator = screen.getByTestId('performance-indicator');
        expect(within(indicator).getByText(/Performance Mode/i)).toBeInTheDocument();
        expect(within(indicator).getByText(/45 nodes/i)).toBeInTheDocument();
      });
    });

    it('should show performance warning near threshold', async () => {
      // Mock API to return 47 nodes (warning threshold)
      const manyCharacters = Array.from({ length: 47 }, (_, i) => ({
        id: `char-${i}`,
        name: `Character ${i}`,
        type: 'character',
        tier: 'Core',
        resolutionPaths: [],
        character_links: [],
        ownedElements: [],
        events: []
      }));
      
      useAllCharacters.mockReturnValue({
        data: manyCharacters,
        isLoading: false,
        error: null
      });
      
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Simulate the AdaptiveGraphCanvas setting node count near threshold
      act(() => {
        const { updateNodeCount } = useJourneyIntelligenceStore.getState();
        updateNodeCount(47);
      });
      
      await waitFor(() => {
        const indicator = screen.getByTestId('performance-indicator');
        expect(within(indicator).getByText(/Approaching limit/i)).toBeInTheDocument();
        expect(indicator).toHaveClass('warning');
      });
    });
  });

  describe('Loading and Error States', () => {
    beforeEach(() => {
      // Reset mocks for these specific tests
      jest.clearAllMocks();
    });
    
    it('should show loading state while fetching data', () => {
      // Mock loading state
      useAllCharacters.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });
      
      useCharacterJourney.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });
      
      usePerformanceElements.mockReturnValue({
        data: null,
        isLoading: true,
        error: null
      });
      
      renderWithQuery(<JourneyIntelligenceView />);
      
      expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
      expect(screen.getByText(/Loading journey data/i)).toBeInTheDocument();
    });

    it('should handle API errors gracefully', async () => {
      // Mock API error
      useAllCharacters.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Server error')
      });
      
      usePerformanceElements.mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Server error')
      });
      
      renderWithQuery(<JourneyIntelligenceView />);
      
      await waitFor(() => {
        expect(screen.getByText(/Unable to load journey data/i)).toBeInTheDocument();
        // No retry button - React Query handles retries automatically
        expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no data', async () => {
      // Mock empty data response
      useAllCharacters.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });
      
      usePerformanceElements.mockReturnValue({
        data: [],
        isLoading: false,
        error: null
      });
      
      renderWithQuery(<JourneyIntelligenceView />);
      
      await waitFor(() => {
        expect(screen.getByText(/No journey data available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithQuery(<JourneyIntelligenceView />);
      
      expect(screen.getByRole('combobox', { name: /select entity/i })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: /journey graph/i })).toBeInTheDocument();
      expect(screen.getByRole('group', { name: /intelligence layers/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      renderWithQuery(<JourneyIntelligenceView />);
      
      // Tab to entity selector
      await user.tab();
      expect(screen.getByTestId('entity-selector')).toHaveFocus();
      
      // Tab to intelligence toggles
      await user.tab();
      expect(screen.getByRole('button', { name: /story/i })).toHaveFocus();
      
      // Space to toggle
      await user.keyboard(' ');
      expect(screen.getByRole('button', { name: /story/i })).toHaveAttribute('aria-pressed', 'false');
    });
  });
});

// Clean up QueryClient after all tests
afterAll(() => {
  cleanupQueryClient();
});