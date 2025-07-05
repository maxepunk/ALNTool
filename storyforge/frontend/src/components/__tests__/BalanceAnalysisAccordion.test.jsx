import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import BalanceAnalysisAccordion from '../BalanceAnalysisAccordion';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('BalanceAnalysisAccordion', () => {
  const mockBalanceAnalysis = {
    issues: ['Token count below target', 'Too many unassigned tokens'],
    recommendations: ['Add more memory tokens', 'Assign tokens to resolution paths']
  };

  it('should not render when there are no issues or recommendations', () => {
    const emptyAnalysis = {
      issues: [],
      recommendations: []
    };

    const { container } = renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={emptyAnalysis} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('should render accordion when there are issues', () => {
    renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    expect(screen.getByText(/Production Analysis/)).toBeInTheDocument();
    // The text is broken up across multiple elements
    expect(screen.getByText(/2 issues, 2 recommendations/)).toBeInTheDocument();
  });

  it('should display AssessmentIcon', () => {
    const { container } = renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    const icon = container.querySelector('[data-testid="AssessmentIcon"]');
    expect(icon).toBeInTheDocument();
  });

  it('should be expandable', () => {
    renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    const expandButton = screen.getByRole('button');
    expect(expandButton).toHaveAttribute('aria-expanded', 'false');
    
    fireEvent.click(expandButton);
    expect(expandButton).toHaveAttribute('aria-expanded', 'true');
  });

  it('should display all issues when expanded', () => {
    renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(screen.getByText('Token count below target')).toBeInTheDocument();
    expect(screen.getByText('Too many unassigned tokens')).toBeInTheDocument();
  });

  it('should display all recommendations when expanded', () => {
    renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(screen.getByText('Add more memory tokens')).toBeInTheDocument();
    expect(screen.getByText('Assign tokens to resolution paths')).toBeInTheDocument();
  });

  it('should display issues header when issues exist', () => {
    renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(screen.getByText('Issues Detected:')).toBeInTheDocument();
  });

  it('should display recommendations header when recommendations exist', () => {
    renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    expect(screen.getByText('Recommendations:')).toBeInTheDocument();
  });

  it('should render only issues when no recommendations', () => {
    const issuesOnly = {
      issues: ['Issue 1', 'Issue 2'],
      recommendations: []
    };

    renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={issuesOnly} />
    );

    expect(screen.getByText(/2 issues, 0 recommendations/)).toBeInTheDocument();
  });

  it('should render only recommendations when no issues', () => {
    const recommendationsOnly = {
      issues: [],
      recommendations: ['Recommendation 1', 'Recommendation 2']
    };

    renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={recommendationsOnly} />
    );

    expect(screen.getByText(/0 issues, 2 recommendations/)).toBeInTheDocument();
  });

  it('should use warning alerts for issues', () => {
    const { container } = renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    const warningAlerts = container.querySelectorAll('.MuiAlert-standardWarning');
    expect(warningAlerts).toHaveLength(2);
  });

  it('should use info alerts for recommendations', () => {
    const { container } = renderWithTheme(
      <BalanceAnalysisAccordion balanceAnalysis={mockBalanceAnalysis} />
    );

    const expandButton = screen.getByRole('button');
    fireEvent.click(expandButton);

    const infoAlerts = container.querySelectorAll('.MuiAlert-standardInfo');
    expect(infoAlerts).toHaveLength(2);
  });
});