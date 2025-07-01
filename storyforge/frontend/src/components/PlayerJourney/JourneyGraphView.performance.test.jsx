// RED PHASE: This test should FAIL first to prove there's a performance problem

import React from 'react';
import { render } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JourneyGraphView from './JourneyGraphView';
import useJourneyStore from '../../stores/journeyStore';
import { useJourney } from '../../hooks/useJourney';

// Mock useJourney hook (data fetching)
jest.mock('../../hooks/useJourney');

// Mock the store (UI state only)
jest.mock('../../stores/journeyStore');

// Mock ReactFlow components
jest.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }) => <div data-testid="react-flow">{children}</div>,
  ReactFlowProvider: ({ children }) => <div>{children}</div>,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  Controls: () => <div />,
  Background: () => <div />,
  MiniMap: () => <div />,
}));

// Mock the auto layout hook
jest.mock('../../hooks/useAutoLayout', () => ({
  __esModule: true,
  default: (nodes) => nodes, // Return nodes as-is, no layout
}));

// Create large test data to stress the component
const createLargeJourneyData = () => {
  const nodes = [];
  const edges = [];
  
  // Create 100+ nodes as per requirement
  for (let i = 0; i < 120; i++) {
    nodes.push({
      id: `node-${i}`,
      type: i % 3 === 0 ? 'activityNode' : i % 3 === 1 ? 'discoveryNode' : 'loreNode',
      position: { x: (i % 10) * 150, y: Math.floor(i / 10) * 100 },
      data: { 
        label: `Node ${i}`,
        act: i < 60 ? 1 : 2,
        type: i % 5 === 0 ? 'memory' : 'regular'
      }
    });
  }
  
  // Create edges to connect nodes
  for (let i = 0; i < 100; i++) {
    edges.push({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'default'
    });
  }
  
  return {
    graph: { nodes, edges },
    character_info: {
      id: 'test-character',
      name: 'Test Character',
      tier: 'A'
    }
  };
};

describe('JourneyGraphView Performance - RED Phase', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  beforeEach(() => {
    // Setup mock journey data from useJourney hook (current architecture)
    const largeJourneyData = createLargeJourneyData();
    
    useJourney.mockReturnValue({
      data: largeJourneyData,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
    
    // Mock UI state only (current architecture)
    useJourneyStore.mockImplementation((selector) => {
      const state = {
        selectedNode: null,
        setSelectedNode: jest.fn(),
        viewMode: 'design',
        setViewMode: jest.fn(),
      };
      return selector ? selector(state) : state;
    });
  });

  test('should render 100+ nodes in under 2 seconds', () => {
    const startTime = performance.now();
    
    const { getByText } = render(
      <QueryClientProvider client={queryClient}>
        <JourneyGraphView characterId="test-character" />
      </QueryClientProvider>
    );
    
    const renderTime = performance.now() - startTime;
    
    // Log the actual time for debugging
    console.log(`JourneyGraphView initial render time with 120 nodes: ${renderTime}ms`);
    
    // Verify component rendered
    expect(getByText('Journey Timeline')).toBeInTheDocument();
    
    // Since mocked rendering is fast, let's test the actual heavy computation
    // The analyzeExperienceFlow function runs on every render with 120 nodes
    expect(renderTime).toBeLessThan(2000);
  });
});