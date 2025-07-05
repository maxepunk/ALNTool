/**
 * Debug component to test JourneyIntelligenceView with real API data
 */

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import JourneyIntelligenceView from '../components/JourneyIntelligenceView';

// Create a fresh query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

const DebugJourneyView = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ width: '100vw', height: '100vh' }}>
        <h1>Debug Journey Intelligence View</h1>
        <div style={{ height: 'calc(100vh - 100px)', border: '2px solid red' }}>
          <JourneyIntelligenceView />
        </div>
      </div>
    </QueryClientProvider>
  );
};

export default DebugJourneyView;