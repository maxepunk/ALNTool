import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MemoryEconomyDashboard from '../MemoryEconomyDashboard';
import { getConstant } from '../../hooks/useGameConstants';

// Mock the getConstant function
jest.mock('../../hooks/useGameConstants', () => ({
  getConstant: jest.fn()
}));

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('MemoryEconomyDashboard', () => {
  const mockGameConstants = {
    MEMORY_VALUE: {
      TARGET_TOKEN_COUNT: 55,
      MIN_TOKEN_COUNT: 50,
      MAX_TOKEN_COUNT: 60
    }
  };

  const mockAnalytics = {
    economyStats: {
      totalTokens: 45,
      completedTokens: 30,
      totalValue: 125000
    },
    productionStatus: {
      ready: 30,
      toBuild: 10,
      toDesign: 5
    },
    balanceAnalysis: {
      issues: ['Issue 1', 'Issue 2'],
      recommendations: ['Recommendation 1']
    }
  };

  beforeEach(() => {
    getConstant.mockImplementation((constants, path, defaultValue) => {
      const paths = path.split('.');
      let value = constants;
      for (const p of paths) {
        value = value?.[p];
      }
      return value !== undefined ? value : defaultValue;
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render all four dashboard cards', () => {
    renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('Token Economy')).toBeInTheDocument();
    expect(screen.getByText('Production Ready')).toBeInTheDocument();
    expect(screen.getByText('Total Value')).toBeInTheDocument();
    expect(screen.getByText('Balance Score')).toBeInTheDocument();
  });

  it('should display token economy metrics correctly', () => {
    renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('of 55 target tokens')).toBeInTheDocument();
  });

  it('should display production ready metrics correctly', () => {
    renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('67% complete')).toBeInTheDocument();
  });

  it('should display total value correctly', () => {
    renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('$125,000')).toBeInTheDocument();
    expect(screen.getByText('Economic potential')).toBeInTheDocument();
  });

  it('should display balance score as C when issues exist', () => {
    renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('C')).toBeInTheDocument();
    expect(screen.getByText('2 issues detected')).toBeInTheDocument();
  });

  it('should display balance score as A+ when no issues', () => {
    const noIssuesAnalytics = {
      ...mockAnalytics,
      balanceAnalysis: { issues: [] }
    };

    renderWithTheme(
      <MemoryEconomyDashboard analytics={noIssuesAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('A+')).toBeInTheDocument();
    expect(screen.getByText('0 issues detected')).toBeInTheDocument();
  });

  it('should display balance score as B with one issue', () => {
    const oneIssueAnalytics = {
      ...mockAnalytics,
      balanceAnalysis: { issues: ['Issue 1'] }
    };

    renderWithTheme(
      <MemoryEconomyDashboard analytics={oneIssueAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByText('1 issues detected')).toBeInTheDocument();
  });

  it('should render progress bars', () => {
    const { container } = renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    const progressBars = container.querySelectorAll('.MuiLinearProgress-root');
    expect(progressBars).toHaveLength(2); // Token economy and production ready progress bars
  });

  it('should use warning color when token count is below minimum', () => {
    const { container } = renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    const tokenProgressBar = container.querySelector('.MuiLinearProgress-colorWarning');
    expect(tokenProgressBar).toBeInTheDocument();
  });

  it('should use success color when token count is within range', () => {
    const goodAnalytics = {
      ...mockAnalytics,
      economyStats: {
        ...mockAnalytics.economyStats,
        totalTokens: 55
      }
    };

    const { container } = renderWithTheme(
      <MemoryEconomyDashboard analytics={goodAnalytics} gameConstants={mockGameConstants} />
    );

    const tokenProgressBar = container.querySelector('.MuiLinearProgress-colorSuccess');
    expect(tokenProgressBar).toBeInTheDocument();
  });

  it('should display all Material-UI icons', () => {
    const { container } = renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    // Check for SVG icons
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have proper grid layout with 4 columns', () => {
    const { container } = renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems).toHaveLength(4);
  });

  it('should display cards with elevation', () => {
    const { container } = renderWithTheme(
      <MemoryEconomyDashboard analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    const cards = container.querySelectorAll('.MuiCard-root');
    expect(cards).toHaveLength(4);
    cards.forEach(card => {
      expect(card).toHaveClass('MuiPaper-elevation2');
    });
  });
});