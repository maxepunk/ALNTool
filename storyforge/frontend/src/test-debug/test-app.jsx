/**
 * Test app to debug JourneyIntelligenceView with sparse data
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import DebugJourneyView from './debug-journey-view';

// Create root and render
const container = document.getElementById('root');
const root = createRoot(container);

console.log('🚀 Starting debug app...');

root.render(
  <React.StrictMode>
    <DebugJourneyView />
  </React.StrictMode>
);