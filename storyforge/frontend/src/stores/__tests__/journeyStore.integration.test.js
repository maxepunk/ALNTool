import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import useJourneyStore from '../journeyStore';
import useJourney from '../../hooks/useJourney';

// Mock the useJourney hook
jest.mock('../../hooks/useJourney');

describe('journeyStore integration with React Query', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  test('UI state updates independently of data fetching', async () => {
    const mockJourneyData = {
      nodes: [{ id: '1', data: { label: 'Start' } }],
      edges: [],
    };

    useJourney.mockReturnValue({
      data: mockJourneyData,
      isLoading: false,
      error: null,
    });

    const { result } = renderHook(() => ({
      journey: useJourney('char-alex-reeves'),
      store: useJourneyStore(),
    }), { wrapper });

    // Set active character in store
    result.current.store.setActiveCharacterId('char-alex-reeves');
    
    await waitFor(() => {
      expect(result.current.store.activeCharacterId).toBe('char-alex-reeves');
      expect(result.current.journey.data).toEqual(mockJourneyData);
    });
  });

  test('selected node state persists across data refetches', async () => {
    const mockJourneyData = {
      nodes: [{ id: 'node-1', data: { label: 'Node 1' } }],
      edges: [],
    };

    useJourney.mockReturnValue({
      data: mockJourneyData,
      isLoading: false,
      error: null,
      refetch: jest.fn(),
    });

    const { result } = renderHook(() => ({
      journey: useJourney('char-alex-reeves'),
      store: useJourneyStore(),
    }), { wrapper });

    // Select a node
    const selectedNode = { id: 'node-1', data: { label: 'Node 1' } };
    result.current.store.setSelectedNode(selectedNode);

    expect(result.current.store.selectedNode).toEqual(selectedNode);

    // Simulate data refetch
    await result.current.journey.refetch();

    // Selected node should still be there
    expect(result.current.store.selectedNode).toEqual(selectedNode);
  });

  test('clearing active character clears selected node', () => {
    const { result } = renderHook(() => useJourneyStore());

    // Set up initial state
    result.current.setActiveCharacterId('char-alex-reeves');
    result.current.setSelectedNode({ id: 'node-1' });

    expect(result.current.activeCharacterId).toBe('char-alex-reeves');
    expect(result.current.selectedNode).toEqual({ id: 'node-1' });

    // Clear active character
    result.current.setActiveCharacterId(null);

    expect(result.current.activeCharacterId).toBeNull();
    expect(result.current.selectedNode).toBeNull();
  });
});

// Note: This test file focuses on the integration between UI state (Zustand)
// and server state (React Query). Data fetching logic is tested in the
// useJourney hook tests.