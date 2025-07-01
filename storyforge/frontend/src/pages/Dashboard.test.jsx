// RED PHASE: Failing tests for Dashboard.jsx component extraction and performance
// Following TDD principles - write tests for behavior we want to achieve

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Dashboard from './Dashboard';

// Mock API
jest.mock('../services/api', () => ({
  api: {
    getCharacters: jest.fn(),
    getElements: jest.fn(),
    getPuzzles: jest.fn(),
    getTimelineEventsList: jest.fn(),
    getGameConstants: jest.fn()
  }
}));

// Mock game constants hook
jest.mock('../hooks/useGameConstants', () => ({
  useGameConstants: jest.fn(),
  getConstant: jest.fn((constants, key, defaultValue) => defaultValue)
}));

describe('Dashboard Component Extraction (RED PHASE)', () => {
  let queryClient;

  const renderWithProviders = (component) => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, cacheTime: 0 },
      },
    });

    return render(
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          {component}
        </QueryClientProvider>
      </BrowserRouter>
    );
  };

  const mockApiData = {
    characters: [
      { id: 'char1', name: 'John', tier: 'Core', resolution_paths: ['Black Market'] },
      { id: 'char2', name: 'Jane', tier: 'Secondary', resolution_paths: ['Detective'] },
      { id: 'char3', name: 'Bob', tier: 'Core', resolution_paths: ['Third Path'] }
    ],
    elements: [
      { id: 'elem1', properties: { basicType: 'Memory Token', status: 'Ready' } },
      { id: 'elem2', properties: { basicType: 'RFID Card', status: 'Complete' } },
      { id: 'elem3', properties: { basicType: 'Prop', status: 'To Design' } },
      { id: 'elem4', properties: { basicType: 'Tool', status: 'To Build' } }
    ],
    puzzles: [
      { id: 'puzzle1', puzzleElements: [{ id: 'elem1' }, { id: 'elem2' }] },
      { id: 'puzzle2', puzzleElements: [{ id: 'elem3' }] }
    ],
    timelineEvents: [
      { id: 'event1', act_focus: 'Act 1' },
      { id: 'event2', act_focus: 'Act 2' },
      { id: 'event3', act_focus: null }
    ]
  };

  beforeEach(() => {
    const { api } = require('../services/api');
    const { useGameConstants } = require('../hooks/useGameConstants');
    
    api.getCharacters.mockResolvedValue(mockApiData.characters);
    api.getElements.mockResolvedValue(mockApiData.elements);
    api.getPuzzles.mockResolvedValue(mockApiData.puzzles);
    api.getTimelineEventsList.mockResolvedValue(mockApiData.timelineEvents);
    
    useGameConstants.mockReturnValue({
      data: {
        MEMORY_VALUE: { TARGET_TOKEN_COUNT: 55 },
        RESOLUTION_PATHS: { TYPES: ['Black Market', 'Detective', 'Third Path'] },
        CHARACTERS: { TIERS: ['Core', 'Secondary', 'Tertiary'] },
        ACTS: { TYPES: ['Act 1', 'Act 2'], DEFAULT: 'Unassigned' }
      },
      isLoading: false
    });
  });

  describe('Performance Tests', () => {
    test('should render Dashboard within performance target (<3 seconds)', async () => {
      const startTime = performance.now();
      
      renderWithProviders(<Dashboard />);
      
      // Wait for main heading to appear
      await waitFor(() => {
        expect(screen.getByText(/production command center/i)).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should render within 3 seconds (3000ms)
      expect(renderTime).toBeLessThan(3000);
    });

    test('should update efficiently when data changes', async () => {
      const { rerender } = renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/production command center/i)).toBeInTheDocument();
      });
      
      const startTime = performance.now();
      
      // Simulate data update
      rerender(<Dashboard />);
      
      const endTime = performance.now();
      const updateTime = endTime - startTime;
      
      // Should update within 500ms
      expect(updateTime).toBeLessThan(500);
    });
  });

  describe('MemoryEconomySection Component Extraction', () => {
    test('should fail - MemoryEconomySection component does not exist yet', () => {
      // This test will fail because we haven't extracted MemoryEconomySection yet
      expect(() => {
        require('../components/Dashboard/MemoryEconomySection');
      }).toThrow();
    });

    test('should render memory economy data when MemoryEconomySection exists', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
      });

      // Should show completion data
      expect(screen.getByText(/2/)).toBeInTheDocument(); // completed tokens
      expect(screen.getByText(/of 55 tokens/i)).toBeInTheDocument(); // total tokens
      expect(screen.getByText(/4% complete/i)).toBeInTheDocument(); // percentage
    });

    test('should handle memory economy props correctly when extracted', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
      });

      // Memory economy section should be clickable/interactive
      const memorySection = screen.getByText(/memory economy/i).closest('div');
      expect(memorySection).toBeInTheDocument();
    });

    test('should show progress bar for memory token completion', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
      });

      // Should have a progress indicator
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });
  });

  describe('ProductionMetrics Component Extraction', () => {
    test('should fail - ProductionMetrics component does not exist yet', () => {
      // This test will fail because we haven't extracted ProductionMetrics yet
      expect(() => {
        require('../components/Dashboard/ProductionMetrics');
      }).toThrow();
    });

    test('should render three-path balance metrics when ProductionMetrics exists', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
      });

      // Should show all three paths
      expect(screen.getByText(/black market/i)).toBeInTheDocument();
      expect(screen.getByText(/detective/i)).toBeInTheDocument();
      expect(screen.getByText(/third path/i)).toBeInTheDocument();
      
      // Should show path counts
      expect(screen.getByText('1')).toBeInTheDocument(); // Each path has 1 character
    });

    test('should show balance alert when paths are imbalanced', async () => {
      // Mock imbalanced data
      const { api } = require('../services/api');
      api.getCharacters.mockResolvedValue([
        { id: 'char1', resolution_paths: ['Black Market'] },
        { id: 'char2', resolution_paths: ['Black Market'] },
        { id: 'char3', resolution_paths: ['Black Market'] },
        { id: 'char4', resolution_paths: ['Black Market'] },
        { id: 'char5', resolution_paths: ['Detective'] }, // Only 1 detective vs 4 black market
      ]);

      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
      });

      // Should show warning for imbalance
      expect(screen.getByText(/path imbalance detected/i)).toBeInTheDocument();
    });

    test('should handle ProductionMetrics props correctly when extracted', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
      });

      // ProductionMetrics should receive character data
      const metricsSection = screen.getByText(/three-path balance monitor/i).closest('div');
      expect(metricsSection).toBeInTheDocument();
    });
  });

  describe('Main Dashboard Integration', () => {
    test('should render main dashboard structure', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/production command center/i)).toBeInTheDocument();
      });

      // Main sections should be present
      expect(screen.getByText(/design & prep orchestration/i)).toBeInTheDocument();
      expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
      expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
      expect(screen.getByText(/discovery coverage & act flow/i)).toBeInTheDocument();
      expect(screen.getByText(/design & prep tools/i)).toBeInTheDocument();
    });

    test('should handle loading states properly', () => {
      const { useGameConstants } = require('../hooks/useGameConstants');
      useGameConstants.mockReturnValue({
        data: null,
        isLoading: true
      });

      renderWithProviders(<Dashboard />);

      expect(screen.getByText(/loading production command center/i)).toBeInTheDocument();
    });

    test('should have proper grid layout structure', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/production command center/i)).toBeInTheDocument();
      });

      // Should have grid container
      const gridContainer = screen.getByText(/production command center/i).closest('div');
      expect(gridContainer).toBeInTheDocument();
    });
  });

  describe('Component Size Validation', () => {
    test('should fail - Dashboard.jsx still over optimal size', async () => {
      // Read the Dashboard.jsx file to check line count
      const fs = require('fs');
      const path = require('path');
      const dashboardPath = path.join(__dirname, 'Dashboard.jsx');
      const content = fs.readFileSync(dashboardPath, 'utf8');
      const lineCount = content.split('\n').length;
      
      // Should be under 350 lines after extraction (currently 414)
      expect(lineCount).toBeLessThan(350);
    });

    test('should have extracted components under size limits', () => {
      // This will fail until we extract the components
      const fs = require('fs');
      const path = require('path');
      
      // MemoryEconomySection should be under 50 lines
      const memoryPath = path.join(__dirname, '../components/Dashboard/MemoryEconomySection.jsx');
      expect(() => {
        const content = fs.readFileSync(memoryPath, 'utf8');
        expect(content.split('\n').length).toBeLessThan(50);
      }).not.toThrow();
      
      // ProductionMetrics should be under 80 lines  
      const metricsPath = path.join(__dirname, '../components/Dashboard/ProductionMetrics.jsx');
      expect(() => {
        const content = fs.readFileSync(metricsPath, 'utf8');
        expect(content.split('\n').length).toBeLessThan(80);
      }).not.toThrow();
    });
  });

  describe('Accessibility and Performance', () => {
    test('should have proper heading structure', async () => {
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /production command center/i })).toBeInTheDocument();
      });

      // Should have section headings
      expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
      expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
    });

    test('should not have performance bottlenecks in render', async () => {
      // Mock large dataset to test performance
      const { api } = require('../services/api');
      const largeCharacterSet = Array.from({ length: 100 }, (_, i) => ({
        id: `char${i}`,
        name: `Character ${i}`,
        tier: i % 3 === 0 ? 'Core' : i % 3 === 1 ? 'Secondary' : 'Tertiary',
        resolution_paths: [['Black Market', 'Detective', 'Third Path'][i % 3]]
      }));
      
      api.getCharacters.mockResolvedValue(largeCharacterSet);

      const startTime = performance.now();
      renderWithProviders(<Dashboard />);
      
      await waitFor(() => {
        expect(screen.getByText(/production command center/i)).toBeInTheDocument();
      });
      
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      // Should handle large datasets efficiently
      expect(renderTime).toBeLessThan(2000);
    });
  });
});