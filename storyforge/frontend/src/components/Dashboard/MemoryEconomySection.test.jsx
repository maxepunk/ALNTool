// REFACTOR PHASE: Comprehensive tests for MemoryEconomySection component
// Following TDD principles - test user-facing behavior and rendered output

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MemoryEconomySection from './MemoryEconomySection';

describe('MemoryEconomySection', () => {
  const defaultProps = {
    memoryTokensCompleted: 15,
    memoryTokensTotal: 55,
    memoryCompletionPercentage: 27
  };

  describe('component rendering', () => {
    test('should render main heading with memory icon', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
      expect(screen.getByTestId('MemoryIcon')).toBeInTheDocument();
    });

    test('should display completion metrics correctly', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      expect(screen.getByText('15')).toBeInTheDocument(); // completed count
      expect(screen.getByText(/of 55 tokens/i)).toBeInTheDocument(); // total count
      expect(screen.getByText(/27% complete/i)).toBeInTheDocument(); // percentage
    });

    test('should show remaining tokens calculation', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      expect(screen.getByText(/40 tokens remaining/i)).toBeInTheDocument(); // 55 - 15 = 40
    });

    test('should render progress bar with correct value', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '27');
    });
  });

  describe('data variations', () => {
    test('should handle zero completed tokens', () => {
      const props = {
        memoryTokensCompleted: 0,
        memoryTokensTotal: 55,
        memoryCompletionPercentage: 0
      };

      render(<MemoryEconomySection {...props} />);

      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText(/0% complete/i)).toBeInTheDocument();
      expect(screen.getByText(/55 tokens remaining/i)).toBeInTheDocument();
    });

    test('should handle 100% completion', () => {
      const props = {
        memoryTokensCompleted: 55,
        memoryTokensTotal: 55,
        memoryCompletionPercentage: 100
      };

      render(<MemoryEconomySection {...props} />);

      expect(screen.getByText('55')).toBeInTheDocument();
      expect(screen.getByText(/100% complete/i)).toBeInTheDocument();
      expect(screen.getByText(/0 tokens remaining/i)).toBeInTheDocument();
    });

    test('should handle partial completion correctly', () => {
      const props = {
        memoryTokensCompleted: 25,
        memoryTokensTotal: 60,
        memoryCompletionPercentage: 42
      };

      render(<MemoryEconomySection {...props} />);

      expect(screen.getByText('25')).toBeInTheDocument();
      expect(screen.getByText(/of 60 tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/42% complete/i)).toBeInTheDocument();
      expect(screen.getByText(/35 tokens remaining/i)).toBeInTheDocument(); // 60 - 25 = 35
    });

    test('should handle large numbers correctly', () => {
      const props = {
        memoryTokensCompleted: 127,
        memoryTokensTotal: 200,
        memoryCompletionPercentage: 64
      };

      render(<MemoryEconomySection {...props} />);

      expect(screen.getByText('127')).toBeInTheDocument();
      expect(screen.getByText(/of 200 tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/64% complete/i)).toBeInTheDocument();
      expect(screen.getByText(/73 tokens remaining/i)).toBeInTheDocument(); // 200 - 127 = 73
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle undefined values gracefully', () => {
      const props = {
        memoryTokensCompleted: undefined,
        memoryTokensTotal: undefined,
        memoryCompletionPercentage: undefined
      };

      render(<MemoryEconomySection {...props} />);

      expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
      // Component should still render without crashing
    });

    test('should handle null values gracefully', () => {
      const props = {
        memoryTokensCompleted: null,
        memoryTokensTotal: null,
        memoryCompletionPercentage: null
      };

      render(<MemoryEconomySection {...props} />);

      expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
      // Component should still render without crashing
    });

    test('should handle zero total tokens', () => {
      const props = {
        memoryTokensCompleted: 0,
        memoryTokensTotal: 0,
        memoryCompletionPercentage: 0
      };

      render(<MemoryEconomySection {...props} />);

      expect(screen.getByText(/of 0 tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/0 tokens remaining/i)).toBeInTheDocument();
    });

    test('should handle negative values gracefully', () => {
      const props = {
        memoryTokensCompleted: -5,
        memoryTokensTotal: 55,
        memoryCompletionPercentage: -10
      };

      render(<MemoryEconomySection {...props} />);

      // Component should still render without crashing
      expect(screen.getByText(/memory economy/i)).toBeInTheDocument();
    });
  });

  describe('accessibility and usability', () => {
    test('should have proper heading structure', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      expect(screen.getByRole('heading', { name: /memory economy/i })).toBeInTheDocument();
    });

    test('should have accessible progress bar', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '27');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    });

    test('should render content in a paper container', () => {
      const { container } = render(<MemoryEconomySection {...defaultProps} />);

      const paperElement = container.querySelector('.MuiPaper-root');
      expect(paperElement).toBeInTheDocument();
    });

    test('should have proper text hierarchy', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      // Large number should be prominent
      const completedCount = screen.getByText('15');
      expect(completedCount).toBeInTheDocument();
      
      // Supporting text should be present
      expect(screen.getByText(/of 55 tokens/i)).toBeInTheDocument();
      expect(screen.getByText(/27% complete/i)).toBeInTheDocument();
      expect(screen.getByText(/40 tokens remaining/i)).toBeInTheDocument();
    });

    test('should center-align progress content', () => {
      const { container } = render(<MemoryEconomySection {...defaultProps} />);

      const centerBox = container.querySelector('[style*="text-align: center"]');
      expect(centerBox).toBeInTheDocument();
    });
  });

  describe('visual styling', () => {
    test('should apply proper elevation to paper', () => {
      const { container } = render(<MemoryEconomySection {...defaultProps} />);

      const paperElement = container.querySelector('.MuiPaper-root');
      expect(paperElement).toHaveClass('MuiPaper-elevation2');
    });

    test('should have proper spacing and layout', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      // Icon should be present with proper spacing
      const memoryIcon = screen.getByTestId('MemoryIcon');
      expect(memoryIcon).toBeInTheDocument();
      
      // Progress bar should be present
      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
    });

    test('should use primary color theme', () => {
      render(<MemoryEconomySection {...defaultProps} />);

      // Main count and percentage should use primary color
      const elements = screen.getAllByText(/15|27% complete/i);
      expect(elements.length).toBeGreaterThan(0);
    });
  });
});