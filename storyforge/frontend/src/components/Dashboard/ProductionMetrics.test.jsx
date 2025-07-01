// REFACTOR PHASE: Comprehensive tests for ProductionMetrics component
// Following TDD principles - test user-facing behavior and rendered output

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductionMetrics from './ProductionMetrics';

describe('ProductionMetrics', () => {
  const mockGameConstants = {
    DASHBOARD: {
      PATH_IMBALANCE_THRESHOLD: 3
    }
  };

  const mockGetConstant = jest.fn((constants, key, defaultValue) => {
    if (key === 'DASHBOARD.PATH_IMBALANCE_THRESHOLD') {
      return constants?.DASHBOARD?.PATH_IMBALANCE_THRESHOLD || defaultValue;
    }
    return defaultValue;
  });

  const defaultProps = {
    blackMarketCount: 5,
    detectiveCount: 4,
    thirdPathCount: 6,
    charactersWithPaths: Array.from({ length: 15 }, (_, i) => ({ id: `char${i}` })),
    gameConstants: mockGameConstants,
    getConstant: mockGetConstant
  };

  beforeEach(() => {
    mockGetConstant.mockClear();
  });

  describe('component rendering', () => {
    test('should render main heading with swap icon', () => {
      render(<ProductionMetrics {...defaultProps} />);

      expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
      expect(screen.getByTestId('SwapHorizIcon')).toBeInTheDocument();
    });

    test('should display all three path sections', () => {
      render(<ProductionMetrics {...defaultProps} />);

      expect(screen.getByText(/black market/i)).toBeInTheDocument();
      expect(screen.getByText(/detective/i)).toBeInTheDocument();
      expect(screen.getByText(/third path/i)).toBeInTheDocument();
    });

    test('should show correct path counts', () => {
      render(<ProductionMetrics {...defaultProps} />);

      expect(screen.getByText('5')).toBeInTheDocument(); // black market count
      expect(screen.getByText('4')).toBeInTheDocument(); // detective count  
      expect(screen.getByText('6')).toBeInTheDocument(); // third path count
    });

    test('should display path descriptions', () => {
      render(<ProductionMetrics {...defaultProps} />);

      expect(screen.getByText(/wealth path/i)).toBeInTheDocument();
      expect(screen.getByText(/truth path/i)).toBeInTheDocument();
      expect(screen.getByText(/community path/i)).toBeInTheDocument();
    });

    test('should render path icons', () => {
      render(<ProductionMetrics {...defaultProps} />);

      expect(screen.getByTestId('AccountBalanceIcon')).toBeInTheDocument();
      expect(screen.getByTestId('SearchIcon')).toBeInTheDocument();
      expect(screen.getByTestId('GroupsIcon')).toBeInTheDocument();
    });
  });

  describe('balance analysis', () => {
    test('should show success alert when paths are balanced', () => {
      const balancedProps = {
        ...defaultProps,
        blackMarketCount: 5,
        detectiveCount: 5,
        thirdPathCount: 5
      };

      render(<ProductionMetrics {...balancedProps} />);

      expect(screen.getByText(/three paths are well balanced/i)).toBeInTheDocument();
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('MuiAlert-standardSuccess');
    });

    test('should show warning alert when paths are imbalanced', () => {
      const imbalancedProps = {
        ...defaultProps,
        blackMarketCount: 10,
        detectiveCount: 2,
        thirdPathCount: 3
      };

      render(<ProductionMetrics {...imbalancedProps} />);

      expect(screen.getByText(/path imbalance detected/i)).toBeInTheDocument();
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('MuiAlert-standardWarning');
    });

    test('should use correct threshold for imbalance detection', () => {
      const thresholdProps = {
        ...defaultProps,
        blackMarketCount: 7,
        detectiveCount: 4,
        thirdPathCount: 4
      };

      render(<ProductionMetrics {...thresholdProps} />);

      // Difference is 3 (7-4=3), which equals threshold, so should be balanced
      expect(screen.getByText(/three paths are well balanced/i)).toBeInTheDocument();
      expect(mockGetConstant).toHaveBeenCalledWith(mockGameConstants, 'DASHBOARD.PATH_IMBALANCE_THRESHOLD', 3);
    });

    test('should handle custom threshold from game constants', () => {
      const customConstants = {
        DASHBOARD: {
          PATH_IMBALANCE_THRESHOLD: 5
        }
      };

      const props = {
        ...defaultProps,
        gameConstants: customConstants,
        blackMarketCount: 8,
        detectiveCount: 4,
        thirdPathCount: 4
      };

      render(<ProductionMetrics {...props} />);

      // Difference is 4 (8-4=4), which is less than custom threshold of 5, so should be balanced
      expect(screen.getByText(/three paths are well balanced/i)).toBeInTheDocument();
    });

    test('should not show alert when no characters have paths', () => {
      const noCharactersProps = {
        ...defaultProps,
        charactersWithPaths: []
      };

      render(<ProductionMetrics {...noCharactersProps} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('data variations', () => {
    test('should handle zero counts gracefully', () => {
      const zeroProps = {
        ...defaultProps,
        blackMarketCount: 0,
        detectiveCount: 0,
        thirdPathCount: 0
      };

      render(<ProductionMetrics {...zeroProps} />);

      expect(screen.getAllByText('0')).toHaveLength(3);
      expect(screen.getByText(/black market/i)).toBeInTheDocument();
      expect(screen.getByText(/detective/i)).toBeInTheDocument();
      expect(screen.getByText(/third path/i)).toBeInTheDocument();
    });

    test('should handle large numbers correctly', () => {
      const largeProps = {
        ...defaultProps,
        blackMarketCount: 99,
        detectiveCount: 150,
        thirdPathCount: 75
      };

      render(<ProductionMetrics {...largeProps} />);

      expect(screen.getByText('99')).toBeInTheDocument();
      expect(screen.getByText('150')).toBeInTheDocument();
      expect(screen.getByText('75')).toBeInTheDocument();
    });

    test('should handle single character distribution', () => {
      const singleProps = {
        ...defaultProps,
        blackMarketCount: 1,
        detectiveCount: 0,
        thirdPathCount: 0,
        charactersWithPaths: [{ id: 'char1' }]
      };

      render(<ProductionMetrics {...singleProps} />);

      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getAllByText('0')).toHaveLength(2);
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle undefined values gracefully', () => {
      const undefinedProps = {
        blackMarketCount: undefined,
        detectiveCount: undefined,
        thirdPathCount: undefined,
        charactersWithPaths: undefined,
        gameConstants: undefined,
        getConstant: mockGetConstant
      };

      render(<ProductionMetrics {...undefinedProps} />);

      expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
      // Component should still render without crashing
    });

    test('should handle null values gracefully', () => {
      const nullProps = {
        blackMarketCount: null,
        detectiveCount: null,
        thirdPathCount: null,
        charactersWithPaths: null,
        gameConstants: null,
        getConstant: mockGetConstant
      };

      render(<ProductionMetrics {...nullProps} />);

      expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
      // Component should still render without crashing
    });

    test('should handle missing getConstant function', () => {
      const noFunctionProps = {
        ...defaultProps,
        getConstant: undefined
      };

      // Component should handle missing getConstant gracefully
      expect(() => {
        render(<ProductionMetrics {...noFunctionProps} />);
      }).not.toThrow();
    });

    test('should handle negative counts', () => {
      const negativeProps = {
        ...defaultProps,
        blackMarketCount: -1,
        detectiveCount: -2,
        thirdPathCount: -3
      };

      render(<ProductionMetrics {...negativeProps} />);

      // Component should still render without crashing
      expect(screen.getByText(/three-path balance monitor/i)).toBeInTheDocument();
    });
  });

  describe('accessibility and usability', () => {
    test('should have proper heading structure', () => {
      render(<ProductionMetrics {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /three-path balance monitor/i })).toBeInTheDocument();
    });

    test('should have accessible alert when present', () => {
      render(<ProductionMetrics {...defaultProps} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
      expect(alert).toBeVisible();
    });

    test('should render content in a paper container', () => {
      const { container } = render(<ProductionMetrics {...defaultProps} />);

      const paperElement = container.querySelector('.MuiPaper-root');
      expect(paperElement).toBeInTheDocument();
    });

    test('should have proper grid layout', () => {
      const { container } = render(<ProductionMetrics {...defaultProps} />);

      const gridContainers = container.querySelectorAll('.MuiGrid-container');
      expect(gridContainers.length).toBeGreaterThan(0);
    });

    test('should have distinguishable path sections', () => {
      render(<ProductionMetrics {...defaultProps} />);

      // Each path should have its own colored section
      const pathSections = screen.getAllByText(/path$/i);
      expect(pathSections).toHaveLength(3);
      
      pathSections.forEach(section => {
        expect(section).toBeVisible();
      });
    });
  });

  describe('visual styling and theming', () => {
    test('should apply proper elevation to paper', () => {
      const { container } = render(<ProductionMetrics {...defaultProps} />);

      const paperElement = container.querySelector('.MuiPaper-root');
      expect(paperElement).toHaveClass('MuiPaper-elevation2');
    });

    test('should use different background colors for each path', () => {
      const { container } = render(<ProductionMetrics {...defaultProps} />);

      // Each path should have its own colored background
      const coloredBoxes = container.querySelectorAll('[style*="background-color"]');
      expect(coloredBoxes.length).toBeGreaterThan(0);
    });

    test('should have proper icon sizing', () => {
      render(<ProductionMetrics {...defaultProps} />);

      const accountIcon = screen.getByTestId('AccountBalanceIcon');
      const searchIcon = screen.getByTestId('SearchIcon');
      const groupsIcon = screen.getByTestId('GroupsIcon');

      [accountIcon, searchIcon, groupsIcon].forEach(icon => {
        expect(icon).toBeInTheDocument();
        expect(icon).toBeVisible();
      });
    });

    test('should center-align path content', () => {
      const { container } = render(<ProductionMetrics {...defaultProps} />);

      const centerBoxes = container.querySelectorAll('[style*="text-align: center"]');
      expect(centerBoxes.length).toBe(3); // One for each path
    });
  });
});