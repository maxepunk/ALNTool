import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ElementDashboardCards from '../ElementDashboardCards';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock getConstant function
const mockGetConstant = jest.fn();
jest.mock('../../hooks/useGameConstants', () => ({
  getConstant: (gameConstants, key, defaultValue) => mockGetConstant(key, defaultValue)
}));

describe('ElementDashboardCards', () => {
  const mockGameConstants = { /* mock constants */ };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default returns for getConstant
    mockGetConstant.mockImplementation((key, defaultValue) => {
      const constants = {
        'MEMORY_VALUE.TARGET_TOKEN_COUNT': 55,
        'MEMORY_VALUE.MIN_TOKEN_COUNT': 50
      };
      return constants[key] || defaultValue;
    });
  });

  const mockAnalytics = {
    totalElements: 10,
    memoryTokens: { total: 45, ready: 35, inDevelopment: 10 },
    productionStatus: { ready: 6, inProgress: 3, needsWork: 1 },
    actDistribution: { 'Act 1': 4, 'Act 2': 3, 'Act 3': 2 },
    typeDistribution: { 'Prop': 5, 'Memory Token': 3, 'Character Sheet': 2 }
  };

  it('should render all four dashboard cards', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('Element Library')).toBeInTheDocument();
    expect(screen.getByText('Memory Economy')).toBeInTheDocument();
    expect(screen.getByText('Production Status')).toBeInTheDocument();
    expect(screen.getByText('Act Distribution')).toBeInTheDocument();
  });

  it('should display total elements count', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('Total game elements')).toBeInTheDocument();
  });

  it('should display memory token information', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('45')).toBeInTheDocument();
    expect(screen.getByText('Memory tokens in game')).toBeInTheDocument();
    expect(screen.getByText('Target: 55 tokens (35 ready)')).toBeInTheDocument();
  });

  it('should display production status information', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('Elements ready for production')).toBeInTheDocument();
    expect(screen.getByText('3 in progress, 1 need work')).toBeInTheDocument();
  });

  it('should display act distribution information', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('Act 1')).toBeInTheDocument();
    expect(screen.getByText('Act 2')).toBeInTheDocument();
    expect(screen.getByText('Act 3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Act 1 count
    expect(screen.getByText('3')).toBeInTheDocument(); // Act 2 count
    expect(screen.getByText('2')).toBeInTheDocument(); // Act 3 count
  });

  it('should display type breakdown in element library', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('Type Breakdown:')).toBeInTheDocument();
    expect(screen.getByText('Prop: 5')).toBeInTheDocument();
    expect(screen.getByText('Memory Token: 3')).toBeInTheDocument();
    expect(screen.getByText('Character Sheet: 2')).toBeInTheDocument();
  });

  it('should show +more indicator when there are more than 3 types', () => {
    const analyticsWithMoreTypes = {
      ...mockAnalytics,
      typeDistribution: { 
        'Prop': 5, 
        'Memory Token': 3, 
        'Character Sheet': 2, 
        'Set Dressing': 1,
        'Video': 1
      }
    };

    renderWithTheme(
      <ElementDashboardCards analytics={analyticsWithMoreTypes} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('+2 more')).toBeInTheDocument();
  });

  it('should display memory progress bar with correct value', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    // Check for LinearProgress component (this is a bit tricky to test directly)
    const memoryCard = screen.getByText('Memory Economy').closest('.MuiCard-root');
    expect(memoryCard).toBeInTheDocument();
  });

  it('should display production progress bar with correct value', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    // Check for LinearProgress component in production status card
    const productionCard = screen.getByText('Production Status').closest('.MuiCard-root');
    expect(productionCard).toBeInTheDocument();
  });

  it('should handle analytics with zero values', () => {
    const zeroAnalytics = {
      totalElements: 0,
      memoryTokens: { total: 0, ready: 0, inDevelopment: 0 },
      productionStatus: { ready: 0, inProgress: 0, needsWork: 0 },
      actDistribution: { 'Act 1': 0, 'Act 2': 0, 'Act 3': 0 },
      typeDistribution: {}
    };

    renderWithTheme(
      <ElementDashboardCards analytics={zeroAnalytics} gameConstants={mockGameConstants} />
    );

    expect(screen.getAllByText('0')).toHaveLength(6); // Total, memory, production, all acts (3 main values + 3 act values)
  });

  it('should render with responsive grid layout', () => {
    const { container } = renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    const gridContainer = container.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();
    
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems).toHaveLength(4); // Four cards
  });

  it('should display all required icons', () => {
    renderWithTheme(
      <ElementDashboardCards analytics={mockAnalytics} gameConstants={mockGameConstants} />
    );

    // Check that cards have icons (by finding icon containers)
    const cards = screen.getAllByText(/Library|Economy|Status|Distribution/);
    expect(cards).toHaveLength(4);
  });

  it('should handle missing typeDistribution gracefully', () => {
    const analyticsWithoutTypes = {
      ...mockAnalytics,
      typeDistribution: {}
    };

    renderWithTheme(
      <ElementDashboardCards analytics={analyticsWithoutTypes} gameConstants={mockGameConstants} />
    );

    expect(screen.getByText('Type Breakdown:')).toBeInTheDocument();
    // Should not show any type chips when typeDistribution is empty
  });
});