// RED PHASE: Tests for PuzzleDetail.jsx component extraction
// Following TDD principles - these tests should FAIL initially
// Target: Reduce PuzzleDetail.jsx from 518 lines to <500 lines by extracting components

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

describe('PuzzleDetail Component Extraction - RED PHASE', () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  const renderWithProviders = (component) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  describe('PageActions component (should not exist yet)', () => {
    test('should import PageActions component', () => {
      // This should fail because PageActions doesn't exist yet
      expect(() => {
        require('../components/PuzzleDetail/PageActions').default;
      }).not.toThrow();
    });

    test('should render page actions with proper buttons', () => {
      const PageActions = require('../components/PuzzleDetail/PageActions').default;
      const mockProps = {
        isFetching: false,
        showMapper: true,
        onRefresh: jest.fn(),
        onToggleMapper: jest.fn(),
        onEdit: jest.fn(),
        onViewFlow: jest.fn(),
        puzzleId: 'test-id'
      };

      renderWithProviders(<PageActions {...mockProps} />);

      expect(screen.getByLabelText(/refresh puzzle data/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle relationship map/i)).toBeInTheDocument();
      expect(screen.getByText(/edit puzzle/i)).toBeInTheDocument();
      expect(screen.getByText(/view flow/i)).toBeInTheDocument();
    });
  });

  describe('NarrativeImpactSection component (should not exist yet)', () => {
    test('should import NarrativeImpactSection component', () => {
      // This should fail because NarrativeImpactSection doesn't exist yet
      expect(() => {
        require('../components/PuzzleDetail/NarrativeImpactSection').default;
      }).not.toThrow();
    });

    test('should render narrative impact content', () => {
      const NarrativeImpactSection = require('../components/PuzzleDetail/NarrativeImpactSection').default;
      const mockPuzzle = {
        storyReveals: 'Test story reveals',
        impactedCharacters: [
          { id: '1', name: 'Character 1' },
          { id: '2', name: 'Character 2' }
        ],
        relatedTimelineEvents: [
          { id: '1', name: 'Event 1' }
        ],
        resolutionPaths: [
          { id: '1', name: 'Path 1' }
        ]
      };

      renderWithProviders(<NarrativeImpactSection puzzle={mockPuzzle} />);

      expect(screen.getByText(/narrative impact & cohesion/i)).toBeInTheDocument();
      expect(screen.getByText(/test story reveals/i)).toBeInTheDocument();
      expect(screen.getByText(/character 1/i)).toBeInTheDocument();
      expect(screen.getByText(/event 1/i)).toBeInTheDocument();
    });
  });

  describe('TabsContent component (should not exist yet)', () => {
    test('should import TabsContent component', () => {
      // This should fail because TabsContent doesn't exist yet
      expect(() => {
        require('../components/PuzzleDetail/TabsContent').default;
      }).not.toThrow();
    });

    test('should render tabs with proper content', () => {
      const TabsContent = require('../components/PuzzleDetail/TabsContent').default;
      const mockPuzzle = {
        requiredElements: [
          { id: '1', name: 'Element 1', basicType: 'Tool' }
        ],
        rewards: [
          { id: '2', name: 'Reward 1', basicType: 'Memory Token' }
        ],
        lockedItem: {
          id: '3', name: 'Locked Item', basicType: 'Key'
        },
        subPuzzles: [
          { id: '4', puzzle: 'Sub Puzzle 1', timing: 'Act 2' }
        ]
      };

      renderWithProviders(<TabsContent puzzle={mockPuzzle} activeTab={0} />);

      expect(screen.getByText(/element 1/i)).toBeInTheDocument();
    });
  });

  describe('File size reduction verification', () => {
    test('should verify PuzzleDetail.jsx is under 500 lines after extraction', () => {
      // This test will verify the actual file size after extraction
      const fs = require('fs');
      const path = require('path');
      
      const puzzleDetailPath = path.join(__dirname, 'PuzzleDetail.jsx');
      const content = fs.readFileSync(puzzleDetailPath, 'utf8');
      const lineCount = content.split('\n').length;
      
      expect(lineCount).toBeLessThan(500);
    });

    test('should verify extracted components directory exists', () => {
      const fs = require('fs');
      const path = require('path');
      
      const puzzleDetailDir = path.join(__dirname, '..', 'components', 'PuzzleDetail');
      expect(fs.existsSync(puzzleDetailDir)).toBe(true);
    });
  });
});