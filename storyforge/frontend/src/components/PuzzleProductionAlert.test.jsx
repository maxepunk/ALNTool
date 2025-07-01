import { render, screen, fireEvent } from '@testing-library/react';
import PuzzleProductionAlert from './PuzzleProductionAlert';

const mockAnalyticsWithIssues = {
  issues: [
    {
      type: 'production',
      severity: 'error',
      message: 'High percentage of puzzles not production ready',
      action: 'Review puzzle status and complete missing designs'
    },
    {
      type: 'balance',
      severity: 'warning',
      message: 'Uneven distribution across narrative threads',
      action: 'Add more puzzles to underrepresented threads'
    },
    {
      type: 'ownership',
      severity: 'info',
      message: 'Some puzzles lack assigned owners',
      action: 'Assign owners to unowned puzzles'
    }
  ]
};

const mockAnalyticsNoIssues = {
  issues: []
};

describe('PuzzleProductionAlert', () => {
  it('should not render when no issues', () => {
    const { container } = render(<PuzzleProductionAlert analytics={mockAnalyticsNoIssues} />);
    expect(container.firstChild).toBeNull();
  });

  it('should not render when analytics is null', () => {
    const { container } = render(<PuzzleProductionAlert analytics={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render alert with issues', () => {
    render(<PuzzleProductionAlert analytics={mockAnalyticsWithIssues} />);

    expect(screen.getByText('Production Intelligence Alert')).toBeInTheDocument();
    expect(screen.getByText('3 production issues detected in puzzle design')).toBeInTheDocument();
  });

  it('should render severity chips', () => {
    render(<PuzzleProductionAlert analytics={mockAnalyticsWithIssues} />);

    expect(screen.getByText('1 error')).toBeInTheDocument();
    expect(screen.getByText('1 warning')).toBeInTheDocument();
    expect(screen.getByText('1 info')).toBeInTheDocument();
  });

  it('should use highest severity for alert color', () => {
    render(<PuzzleProductionAlert analytics={mockAnalyticsWithIssues} />);

    // Since there's an error issue, the alert should be error severity
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardError');
  });

  it('should expand and collapse issue details', () => {
    render(<PuzzleProductionAlert analytics={mockAnalyticsWithIssues} />);

    // Initially collapsed - issue details not visible
    expect(screen.queryByText('High percentage of puzzles not production ready')).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByLabelText('Show more');
    fireEvent.click(expandButton);

    // Now details should be visible
    expect(screen.getByText('High percentage of puzzles not production ready')).toBeInTheDocument();
    expect(screen.getByText('Uneven distribution across narrative threads')).toBeInTheDocument();
    expect(screen.getByText('Some puzzles lack assigned owners')).toBeInTheDocument();

    // Click collapse button
    const collapseButton = screen.getByLabelText('Show less');
    fireEvent.click(collapseButton);

    // Details should be hidden again
    expect(screen.queryByText('High percentage of puzzles not production ready')).not.toBeInTheDocument();
  });

  it('should render issue recommendations', () => {
    render(<PuzzleProductionAlert analytics={mockAnalyticsWithIssues} />);

    // Expand to see details
    const expandButton = screen.getByLabelText('Show more');
    fireEvent.click(expandButton);

    expect(screen.getByText('Recommendation: Review puzzle status and complete missing designs')).toBeInTheDocument();
    expect(screen.getByText('Recommendation: Add more puzzles to underrepresented threads')).toBeInTheDocument();
    expect(screen.getByText('Recommendation: Assign owners to unowned puzzles')).toBeInTheDocument();
  });

  it('should render issue type chips', () => {
    render(<PuzzleProductionAlert analytics={mockAnalyticsWithIssues} />);

    // Expand to see details
    const expandButton = screen.getByLabelText('Show more');
    fireEvent.click(expandButton);

    expect(screen.getByText('production')).toBeInTheDocument();
    expect(screen.getByText('balance')).toBeInTheDocument();
    expect(screen.getByText('ownership')).toBeInTheDocument();
  });

  it('should handle single issue correctly', () => {
    const singleIssueAnalytics = {
      issues: [
        {
          type: 'production',
          severity: 'warning',
          message: 'Single issue',
          action: 'Fix it'
        }
      ]
    };

    render(<PuzzleProductionAlert analytics={singleIssueAnalytics} />);

    expect(screen.getByText('1 production issue detected in puzzle design')).toBeInTheDocument();
  });

  it('should prioritize error over warning for alert severity', () => {
    const warningOnlyAnalytics = {
      issues: [
        {
          type: 'balance',
          severity: 'warning',
          message: 'Warning issue',
          action: 'Fix warning'
        }
      ]
    };

    render(<PuzzleProductionAlert analytics={warningOnlyAnalytics} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('MuiAlert-standardWarning');
  });
});