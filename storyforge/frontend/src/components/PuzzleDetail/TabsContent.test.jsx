// REFACTOR PHASE: Comprehensive tests for TabsContent component
// Following TDD principles - test user-facing behavior and rendered output

import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import TabsContent from './TabsContent';

describe('TabsContent', () => {
  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  const mockPuzzle = {
    requiredElements: [
      { id: 'elem1', name: 'Important Clue', basicType: 'Evidence' },
      { id: 'elem2', name: 'Key Item', basicType: 'Tool' }
    ],
    rewards: [
      { id: 'reward1', name: 'Memory Token 1', basicType: 'Memory Token' },
      { id: 'reward2', name: 'Experience Points', basicType: 'Points' }
    ],
    lockedItem: {
      id: 'locked1', name: 'Secret Safe', basicType: 'Container'
    },
    subPuzzles: [
      { id: 'sub1', puzzle: 'Sub Puzzle 1', timing: 'Act 2' },
      { id: 'sub2', puzzle: 'Sub Puzzle 2', timing: 'Act 3' }
    ]
  };

  describe('Required Elements Tab (activeTab = 0)', () => {
    test('should render required elements when activeTab is 0', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={0} />);

      expect(screen.getByText(/important clue/i)).toBeInTheDocument();
      expect(screen.getByText(/key item/i)).toBeInTheDocument();
      expect(screen.getByText(/type: evidence/i)).toBeInTheDocument();
      expect(screen.getByText(/type: tool/i)).toBeInTheDocument();
    });

    test('should show empty state for required elements when none exist', () => {
      const puzzleWithoutRequired = {
        ...mockPuzzle,
        requiredElements: []
      };

      renderWithRouter(<TabsContent puzzle={puzzleWithoutRequired} activeTab={0} />);

      expect(screen.getByText(/no required elements found/i)).toBeInTheDocument();
    });

    test('should create proper links for required elements', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={0} />);

      const clueLink = screen.getByText(/important clue/i).closest('a');
      expect(clueLink).toHaveAttribute('href', '/elements/elem1');

      const keyLink = screen.getByText(/key item/i).closest('a');
      expect(keyLink).toHaveAttribute('href', '/elements/elem2');
    });
  });

  describe('Reward Elements Tab (activeTab = 1)', () => {
    test('should render reward elements when activeTab is 1', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={1} />);

      expect(screen.getByText(/memory token 1/i)).toBeInTheDocument();
      expect(screen.getByText(/experience points/i)).toBeInTheDocument();
      expect(screen.getByText(/type: memory token/i)).toBeInTheDocument();
      expect(screen.getByText(/type: points/i)).toBeInTheDocument();
    });

    test('should show empty state for rewards when none exist', () => {
      const puzzleWithoutRewards = {
        ...mockPuzzle,
        rewards: []
      };

      renderWithRouter(<TabsContent puzzle={puzzleWithoutRewards} activeTab={1} />);

      expect(screen.getByText(/no reward elements found/i)).toBeInTheDocument();
    });

    test('should create proper links for reward elements', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={1} />);

      const tokenLink = screen.getByText(/memory token 1/i).closest('a');
      expect(tokenLink).toHaveAttribute('href', '/elements/reward1');

      const pointsLink = screen.getByText(/experience points/i).closest('a');
      expect(pointsLink).toHaveAttribute('href', '/elements/reward2');
    });
  });

  describe('Locked Item Tab (activeTab = 2, when locked item exists)', () => {
    test('should render locked item when activeTab is 2 and locked item exists', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={2} />);

      expect(screen.getByText(/secret safe/i)).toBeInTheDocument();
      expect(screen.getByText(/type: container/i)).toBeInTheDocument();
    });

    test('should show incomplete data message when locked item lacks id', () => {
      const puzzleWithIncompleteLockedItem = {
        ...mockPuzzle,
        lockedItem: { name: 'Safe', basicType: 'Container' } // Missing id
      };

      renderWithRouter(<TabsContent puzzle={puzzleWithIncompleteLockedItem} activeTab={2} />);

      expect(screen.getByText(/locked item data is incomplete/i)).toBeInTheDocument();
    });

    test('should create proper link for locked item', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={2} />);

      const safeLink = screen.getByText(/secret safe/i).closest('a');
      expect(safeLink).toHaveAttribute('href', '/elements/locked1');
    });

    test('should not render locked item tab content when no locked item exists', () => {
      const puzzleWithoutLockedItem = {
        ...mockPuzzle,
        lockedItem: null
      };

      renderWithRouter(<TabsContent puzzle={puzzleWithoutLockedItem} activeTab={2} />);

      // Should render sub puzzles instead (activeTab 2 becomes sub puzzles when no locked item)
      expect(screen.getByText(/sub puzzle 1/i)).toBeInTheDocument();
    });
  });

  describe('Sub Puzzles Tab', () => {
    test('should render sub puzzles when activeTab matches sub puzzle index (3 with locked item)', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={3} />);

      expect(screen.getByText(/sub puzzle 1/i)).toBeInTheDocument();
      expect(screen.getByText(/sub puzzle 2/i)).toBeInTheDocument();
      expect(screen.getByText(/timing: act 2/i)).toBeInTheDocument();
      expect(screen.getByText(/timing: act 3/i)).toBeInTheDocument();
    });

    test('should render sub puzzles on activeTab 2 when no locked item exists', () => {
      const puzzleWithoutLockedItem = {
        ...mockPuzzle,
        lockedItem: null
      };

      renderWithRouter(<TabsContent puzzle={puzzleWithoutLockedItem} activeTab={2} />);

      expect(screen.getByText(/sub puzzle 1/i)).toBeInTheDocument();
      expect(screen.getByText(/sub puzzle 2/i)).toBeInTheDocument();
    });

    test('should create proper links for sub puzzles', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={3} />);

      const sub1Link = screen.getByText(/sub puzzle 1/i).closest('a');
      expect(sub1Link).toHaveAttribute('href', '/puzzles/sub1');

      const sub2Link = screen.getByText(/sub puzzle 2/i).closest('a');
      expect(sub2Link).toHaveAttribute('href', '/puzzles/sub2');
    });
  });

  describe('edge cases and error handling', () => {
    test('should return null when puzzle is null', () => {
      const { container } = renderWithRouter(<TabsContent puzzle={null} activeTab={0} />);
      expect(container.firstChild).toBeNull();
    });

    test('should return null when puzzle is undefined', () => {
      const { container } = renderWithRouter(<TabsContent puzzle={undefined} activeTab={0} />);
      expect(container.firstChild).toBeNull();
    });

    test('should handle elements without id gracefully', () => {
      const puzzleWithMalformedElements = {
        requiredElements: [
          { name: 'Item without ID', basicType: 'Test' },
          null,
          { id: 'valid1', name: 'Valid Item', basicType: 'Tool' }
        ]
      };

      renderWithRouter(<TabsContent puzzle={puzzleWithMalformedElements} activeTab={0} />);

      // Should only render the valid item
      expect(screen.getByText(/valid item/i)).toBeInTheDocument();
      expect(screen.queryByText(/item without id/i)).not.toBeInTheDocument();
    });

    test('should handle fallback display names when name is missing', () => {
      const puzzleWithIdOnly = {
        requiredElements: [
          { id: 'elem-123', basicType: 'Test' } // Missing name
        ]
      };

      renderWithRouter(<TabsContent puzzle={puzzleWithIdOnly} activeTab={0} />);

      expect(screen.getByText(/element id: elem-123/i)).toBeInTheDocument();
    });

    test('should handle missing basicType gracefully', () => {
      const puzzleWithoutType = {
        requiredElements: [
          { id: 'elem1', name: 'Test Item' } // Missing basicType
        ]
      };

      renderWithRouter(<TabsContent puzzle={puzzleWithoutType} activeTab={0} />);

      expect(screen.getByText(/test item/i)).toBeInTheDocument();
      expect(screen.getByText(/unknown type/i)).toBeInTheDocument();
    });

    test('should return null for invalid activeTab values', () => {
      const { container } = renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={999} />);
      expect(container.firstChild).toBeNull();
    });
  });

  describe('accessibility and usability', () => {
    test('should have proper list structure', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={0} />);

      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();

      // Material-UI ListItem with RouterLink renders as links, not list items
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2); // Two required elements
    });

    test('should have clickable links for navigation', () => {
      renderWithRouter(<TabsContent puzzle={mockPuzzle} activeTab={0} />);

      // Material-UI ListItem with RouterLink renders as links
      const links = screen.getAllByRole('link');
      expect(links.length).toBeGreaterThan(0);

      links.forEach(link => {
        expect(link).toBeVisible();
      });
    });
  });
});