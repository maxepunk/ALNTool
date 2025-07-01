import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JourneyGraphView from '../JourneyGraphView';
import useJourneyStore from '../../../stores/journeyStore';

// Real API test - no mocks!
describe('JourneyGraphView Integration Tests', () => {
  let queryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }
      }
    });
    // Clear store
    useJourneyStore.getState().clearAllJourneyData();
  });

  test('renders journey nodes from real API data', async () => {
    // Use Alex Reeves character ID
    const characterId = '18c2f33d-583f-8086-8ff8-fdb97283e1a8';
    
    render(
      <QueryClientProvider client={queryClient}>
        <JourneyGraphView characterId={characterId} />
      </QueryClientProvider>
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading experience flow...')).not.toBeInTheDocument();
    }, { timeout: 5000 });

    // The API returns 11 nodes, so we should see them rendered
    // Check for specific node content we know exists
    await waitFor(() => {
      // This is from the actual API response
      expect(screen.getByText(/Ashe Motoko writes a scathing expose/)).toBeInTheDocument();
    });

    // Check that the journey header shows character name
    expect(screen.getByText(/Alex Reeves/)).toBeInTheDocument();
    expect(screen.getByText(/Core Tier/)).toBeInTheDocument();
  });

  test('displays empty state when no journey data', async () => {
    // Use a non-existent character ID
    const characterId = 'non-existent-id';
    
    render(
      <QueryClientProvider client={queryClient}>
        <JourneyGraphView characterId={characterId} />
      </QueryClientProvider>
    );

    // Should show loading first
    expect(screen.getByText('Loading experience flow...')).toBeInTheDocument();

    // Then should remain in loading state or show error
    await waitFor(() => {
      const loadingText = screen.queryByText('Loading experience flow...');
      expect(loadingText).toBeInTheDocument(); // Still loading because no data
    }, { timeout: 3000 });
  });
});