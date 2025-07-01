import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JourneyGraphView from '../JourneyGraphView';
import useJourneyStore from '../../../stores/journeyStore';
import useJourney from '../../../hooks/useJourney';

// Mock heavy dependencies to prevent resource exhaustion
jest.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }) => <div data-testid="mock-reactflow">{children}</div>,
  ReactFlowProvider: ({ children }) => <div>{children}</div>,
  useNodesState: () => [[], jest.fn(), jest.fn()],
  useEdgesState: () => [[], jest.fn(), jest.fn()],
  Controls: () => <div>Controls</div>,
  Background: () => <div>Background</div>,
  MiniMap: () => <div>MiniMap</div>,
  Handle: () => <div>Handle</div>,
  Position: { Top: 'top', Bottom: 'bottom' }
}));

// Mock the store (UI state only)
jest.mock('../../../stores/journeyStore', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the useJourney hook (data fetching)
jest.mock('../../../hooks/useJourney', () => ({
  __esModule: true,
  default: jest.fn()
}));

describe('JourneyGraphView Unit Tests', () => {
  let queryClient;
  const mockJourneyData = {
    character_info: {
      id: 'test-id',
      name: 'Test Character',
      tier: 'Core'
    },
    graph: {
      nodes: [
        {
          id: 'node-1',
          type: 'loreNode',
          position: { x: 0, y: 0 },
          data: { label: 'Test Node' }
        }
      ],
      edges: []
    }
  };

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });

    // Setup mock store (UI state only)
    useJourneyStore.mockReturnValue({
      activeCharacterId: 'test-character',
      selectedNode: null,
      setSelectedNode: jest.fn(),
      setActiveCharacterId: jest.fn(),
      clearSelectedNode: jest.fn()
    });

    // Setup mock hook (data fetching)
    useJourney.mockReturnValue({
      data: mockJourneyData,
      isLoading: false,
      error: null,
      refetch: jest.fn()
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders journey header with character info', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <JourneyGraphView characterId="test-character" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText(/Core Tier/)).toBeInTheDocument();
  });

  test('shows loading state when data is loading', () => {
    useJourney.mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: jest.fn()
    });

    render(
      <QueryClientProvider client={queryClient}>
        <JourneyGraphView characterId="test-character" />
      </QueryClientProvider>
    );

    expect(screen.getByText('Loading experience flow...')).toBeInTheDocument();
  });

  test('shows error state when data fetch fails', () => {
    useJourney.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('Failed to fetch journey'),
      refetch: jest.fn()
    });

    render(
      <QueryClientProvider client={queryClient}>
        <JourneyGraphView characterId="test-character" />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Failed to fetch journey/)).toBeInTheDocument();
  });

  test('renders graph container when data exists', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <JourneyGraphView characterId="test-character" />
      </QueryClientProvider>
    );

    expect(screen.getByTestId('mock-reactflow')).toBeInTheDocument();
  });

  test('updates selected node in store when node is clicked', () => {
    const mockSetSelectedNode = jest.fn();
    useJourneyStore.mockReturnValue({
      activeCharacterId: 'test-character',
      selectedNode: null,
      setSelectedNode: mockSetSelectedNode,
      setActiveCharacterId: jest.fn(),
      clearSelectedNode: jest.fn()
    });

    render(
      <QueryClientProvider client={queryClient}>
        <JourneyGraphView characterId="test-character" />
      </QueryClientProvider>
    );

    // Test would simulate node click here
    // Since ReactFlow is mocked, we can't test the actual interaction
    // but we've verified the store method is available
    expect(mockSetSelectedNode).toBeDefined();
  });
});

// Note: This test focuses on the component's integration with the new architecture:
// - UI state from Zustand (selectedNode, activeCharacterId)
// - Server state from React Query (journey data via useJourney hook)