// RED PHASE: Test the ExperienceAnalysisPanel component
// Following TDD principles - test user-facing behavior and rendered output

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExperienceAnalysisPanel from './ExperienceAnalysisPanel';

describe('ExperienceAnalysisPanel', () => {
  const mockAnalysis = {
    pacing: {
      score: 80,
      issues: ['Minor pacing issue in Act 1']
    },
    memoryTokenFlow: {
      collected: 7,
      total: 10,
      progression: []
    },
    qualityMetrics: {
      discoveryRatio: 65,
      actionRatio: 35,
      balance: 'good'
    },
    actTransitions: {
      smooth: true,
      issues: []
    },
    bottlenecks: ['Memory Token bottleneck at midpoint']
  };

  describe('component rendering', () => {
    test('should render analysis panel with main sections', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      // Should show main heading
      expect(screen.getByText(/flow analysis/i)).toBeInTheDocument();
    });

    test('should display pacing score', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      // Should show pacing score
      expect(screen.getByText(/pacing score: 80\/100/i)).toBeInTheDocument();
    });

    test('should show memory token progress', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      // Should display memory token counts
      expect(screen.getByText(/memory tokens: 7\/10/i)).toBeInTheDocument();
    });

    test('should render without crashing when analysis is empty', () => {
      const emptyAnalysis = {
        pacing: { score: 0, issues: [] },
        memoryTokenFlow: { collected: 0, total: 0, progression: [] },
        qualityMetrics: { discoveryRatio: 0, actionRatio: 0, balance: 'unknown' },
        actTransitions: { smooth: true, issues: [] },
        bottlenecks: []
      };

      render(<ExperienceAnalysisPanel experienceAnalysis={emptyAnalysis} />);

      expect(screen.getByText(/flow analysis/i)).toBeInTheDocument();
    });
  });

  describe('data visualization', () => {
    test('should show pacing issues when they exist', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      expect(screen.getByText(/minor pacing issue in act 1/i)).toBeInTheDocument();
    });

    test('should display quality metrics', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      expect(screen.getByText(/experience balance: good/i)).toBeInTheDocument();
      expect(screen.getByText(/discovery: 65%/i)).toBeInTheDocument();
      expect(screen.getByText(/action: 35%/i)).toBeInTheDocument();
    });

    test('should show bottlenecks when they exist', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      expect(screen.getByText(/memory token bottleneck at midpoint/i)).toBeInTheDocument();
    });

    test('should display appropriate success message when no pacing issues', () => {
      const noPacingIssuesAnalysis = {
        ...mockAnalysis,
        pacing: { score: 85, issues: [] }
      };

      render(<ExperienceAnalysisPanel experienceAnalysis={noPacingIssuesAnalysis} />);

      expect(screen.getByText(/pacing looks good!/i)).toBeInTheDocument();
    });

    test('should show visual legend', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      expect(screen.getByText(/visual legend:/i)).toBeInTheDocument();
      // Use getAllByText since there are multiple "Memory Tokens" mentions
      const memoryTokensElements = screen.getAllByText(/memory tokens/i);
      expect(memoryTokensElements.length).toBeGreaterThan(0);
      expect(screen.getByText(/potential bottlenecks/i)).toBeInTheDocument();
    });
  });

  describe('edge cases and error handling', () => {
    test('should handle missing bottlenecks gracefully', () => {
      const noBottlenecksAnalysis = {
        ...mockAnalysis,
        bottlenecks: []
      };

      render(<ExperienceAnalysisPanel experienceAnalysis={noBottlenecksAnalysis} />);

      // Should render without showing bottlenecks accordion section
      expect(screen.getByText(/flow analysis/i)).toBeInTheDocument();
      // The word "bottlenecks" appears in the legend, so check for the accordion specifically
      expect(screen.queryByText(/bottlenecks \(/i)).toBeNull(); // The count parentheses only appear in accordion
    });

    test('should show zero state appropriately', () => {
      const zeroAnalysis = {
        pacing: { score: 0, issues: [] },
        memoryTokenFlow: { collected: 0, total: 8, progression: [] },
        qualityMetrics: { discoveryRatio: 0, actionRatio: 0, balance: 'needs-attention' },
        actTransitions: { smooth: true, issues: [] },
        bottlenecks: []
      };

      render(<ExperienceAnalysisPanel experienceAnalysis={zeroAnalysis} />);

      expect(screen.getByText(/pacing score: 0\/100/i)).toBeInTheDocument();
      expect(screen.getByText(/memory tokens: 0\/8/i)).toBeInTheDocument();
    });

    test('should handle different balance states', () => {
      const excellentAnalysis = {
        ...mockAnalysis,
        qualityMetrics: { ...mockAnalysis.qualityMetrics, balance: 'excellent' }
      };

      render(<ExperienceAnalysisPanel experienceAnalysis={excellentAnalysis} />);

      expect(screen.getByText(/perfect discovery\/action balance/i)).toBeInTheDocument();
    });

    test('should show warning for needs-attention balance', () => {
      const needsAttentionAnalysis = {
        ...mockAnalysis,
        qualityMetrics: { ...mockAnalysis.qualityMetrics, balance: 'needs-attention' }
      };

      render(<ExperienceAnalysisPanel experienceAnalysis={needsAttentionAnalysis} />);

      expect(screen.getByText(/balance needs attention/i)).toBeInTheDocument();
    });
  });

  describe('accessibility and usability', () => {
    test('should have proper headings structure', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      // Should have main heading
      expect(screen.getByText(/flow analysis/i)).toBeInTheDocument();
    });

    test('should render content in a scrollable container', () => {
      const { container } = render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      // Should be wrapped in a Paper with overflow handling
      const paperElement = container.querySelector('.MuiPaper-root');
      expect(paperElement).toBeInTheDocument();
    });

    test('should have expandable sections', () => {
      render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);

      // Should have accordion components for expandable sections
      const { container } = render(<ExperienceAnalysisPanel experienceAnalysis={mockAnalysis} />);
      const accordions = container.querySelectorAll('.MuiAccordion-root');
      expect(accordions.length).toBeGreaterThan(0);
    });
  });
});