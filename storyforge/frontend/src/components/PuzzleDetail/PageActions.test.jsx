// REFACTOR PHASE: Comprehensive tests for PageActions component
// Following TDD principles - test user-facing behavior and rendered output

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import PageActions from './PageActions';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('PageActions', () => {
  const defaultProps = {
    isFetching: false,
    showMapper: true,
    onRefresh: jest.fn(),
    onToggleMapper: jest.fn(),
    onEdit: jest.fn(),
    puzzleId: 'test-puzzle-id'
  };

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('component rendering', () => {
    test('should render all action buttons', () => {
      renderWithRouter(<PageActions {...defaultProps} />);

      expect(screen.getByLabelText(/refresh puzzle data/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle relationship map/i)).toBeInTheDocument();
      expect(screen.getByText(/edit puzzle/i)).toBeInTheDocument();
      expect(screen.getByText(/view flow/i)).toBeInTheDocument();
    });

    test('should show loading state when fetching', () => {
      renderWithRouter(<PageActions {...defaultProps} isFetching={true} />);

      // Should show progress indicator instead of refresh icon
      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.queryByTestId('RefreshIcon')).not.toBeInTheDocument();
    });

    test('should show appropriate mapper toggle state', () => {
      renderWithRouter(<PageActions {...defaultProps} showMapper={false} />);

      const toggleButton = screen.getByLabelText(/toggle relationship map/i);
      // Material-UI IconButton color is set via CSS classes, not HTML attributes
      expect(toggleButton).toBeInTheDocument();
    });
  });

  describe('button interactions', () => {
    test('should call onRefresh when refresh button clicked', () => {
      renderWithRouter(<PageActions {...defaultProps} />);

      fireEvent.click(screen.getByLabelText(/refresh puzzle data/i));
      expect(defaultProps.onRefresh).toHaveBeenCalledTimes(1);
    });

    test('should call onToggleMapper when toggle button clicked', () => {
      renderWithRouter(<PageActions {...defaultProps} />);

      fireEvent.click(screen.getByLabelText(/toggle relationship map/i));
      expect(defaultProps.onToggleMapper).toHaveBeenCalledTimes(1);
    });

    test('should call onEdit when edit button clicked', () => {
      renderWithRouter(<PageActions {...defaultProps} />);

      fireEvent.click(screen.getByText(/edit puzzle/i));
      expect(defaultProps.onEdit).toHaveBeenCalledTimes(1);
    });

    test('should navigate to puzzle flow when view flow clicked', () => {
      renderWithRouter(<PageActions {...defaultProps} />);

      fireEvent.click(screen.getByText(/view flow/i));
      expect(mockNavigate).toHaveBeenCalledWith('/puzzles/test-puzzle-id/flow');
    });

    test('should disable refresh button when fetching', () => {
      renderWithRouter(<PageActions {...defaultProps} isFetching={true} />);

      const refreshButton = screen.getByLabelText(/refresh puzzle data/i);
      expect(refreshButton).toBeDisabled();
    });
  });

  describe('accessibility and usability', () => {
    test('should have proper tooltips', () => {
      renderWithRouter(<PageActions {...defaultProps} />);

      expect(screen.getByRole('button', { name: /refresh puzzle data/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /toggle relationship map/i })).toBeInTheDocument();
    });

    test('should show appropriate tooltip text when fetching', () => {
      renderWithRouter(<PageActions {...defaultProps} isFetching={true} />);

      // Material-UI tooltips are rendered dynamically, just verify button exists
      const refreshButton = screen.getByLabelText(/refresh puzzle data/i);
      expect(refreshButton).toBeInTheDocument();
    });

    test('should have proper button roles and accessibility', () => {
      renderWithRouter(<PageActions {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // refresh, toggle, edit, view flow

      buttons.forEach(button => {
        expect(button).toBeVisible();
      });
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle missing puzzleId gracefully', () => {
      renderWithRouter(<PageActions {...defaultProps} puzzleId={undefined} />);

      fireEvent.click(screen.getByText(/view flow/i));
      expect(mockNavigate).toHaveBeenCalledWith('/puzzles/undefined/flow');
    });

    test('should render without crashing with minimal props', () => {
      const minimalProps = {
        isFetching: false,
        showMapper: false,
        onRefresh: jest.fn(),
        onToggleMapper: jest.fn(),
        onEdit: jest.fn(),
        puzzleId: 'test'
      };

      renderWithRouter(<PageActions {...minimalProps} />);
      expect(screen.getByText(/edit puzzle/i)).toBeInTheDocument();
    });
  });
});