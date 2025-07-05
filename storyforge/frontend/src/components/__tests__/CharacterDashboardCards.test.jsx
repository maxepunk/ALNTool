import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CharacterDashboardCards from '../CharacterDashboardCards';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('CharacterDashboardCards', () => {
  const mockAnalytics = {
    totalCharacters: 15,
    tierDistribution: {
      Core: 5,
      Secondary: 7,
      Tertiary: 3
    },
    pathDistribution: {
      'Black Market': 4,
      'Detective': 6,
      'Third Path': 3,
      'Unassigned': 2
    },
    memoryEconomy: {
      totalTokens: 42,
      avgPerCharacter: '2.8'
    },
    productionReadiness: {
      ready: 10,
      needsWork: 5
    }
  };

  it('should render all dashboard cards', () => {
    renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    expect(screen.getByText('Character Roster')).toBeInTheDocument();
    expect(screen.getByText('Path Balance')).toBeInTheDocument();
    expect(screen.getByText('Memory Economy')).toBeInTheDocument();
    expect(screen.getByText('Production Ready')).toBeInTheDocument();
  });

  it('should display total character count', () => {
    renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('Total characters in About Last Night')).toBeInTheDocument();
  });

  it('should display tier distribution chips', () => {
    renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    expect(screen.getByText('Core: 5')).toBeInTheDocument();
    expect(screen.getByText('Sec: 7')).toBeInTheDocument();
    expect(screen.getByText('Ter: 3')).toBeInTheDocument();
  });

  it('should display path distribution', () => {
    renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    expect(screen.getByText('Black Market')).toBeInTheDocument();
    expect(screen.getByText('Detective')).toBeInTheDocument();
    expect(screen.getByText('Third Path')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument(); // Black Market count
    expect(screen.getByText('6')).toBeInTheDocument(); // Detective count
    expect(screen.getByText('3')).toBeInTheDocument(); // Third Path count
  });

  it('should display unassigned characters when present', () => {
    renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Unassigned count
  });

  it('should not display unassigned section when count is 0', () => {
    const analyticsWithoutUnassigned = {
      ...mockAnalytics,
      pathDistribution: {
        ...mockAnalytics.pathDistribution,
        'Unassigned': 0
      }
    };
    
    renderWithTheme(<CharacterDashboardCards analytics={analyticsWithoutUnassigned} />);
    
    expect(screen.queryByText('Unassigned')).not.toBeInTheDocument();
  });

  it('should display memory economy information', () => {
    renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    expect(screen.getByText('42')).toBeInTheDocument(); // Total tokens
    expect(screen.getByText('Total memory tokens')).toBeInTheDocument();
    expect(screen.getByText('2.8 avg per character')).toBeInTheDocument();
  });

  it('should display production readiness information', () => {
    renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    expect(screen.getByText('10')).toBeInTheDocument(); // Ready count
    expect(screen.getByText('Characters fully configured')).toBeInTheDocument();
    expect(screen.getByText('5 need configuration')).toBeInTheDocument();
  });

  it('should handle zero values gracefully', () => {
    const zeroAnalytics = {
      totalCharacters: 0,
      tierDistribution: { Core: 0, Secondary: 0, Tertiary: 0 },
      pathDistribution: { 'Black Market': 0, 'Detective': 0, 'Third Path': 0, 'Unassigned': 0 },
      memoryEconomy: { totalTokens: 0, avgPerCharacter: '0' },
      productionReadiness: { ready: 0, needsWork: 0 }
    };
    
    renderWithTheme(<CharacterDashboardCards analytics={zeroAnalytics} />);
    
    expect(screen.getByText('Core: 0')).toBeInTheDocument();
    expect(screen.getByText('Sec: 0')).toBeInTheDocument();
    expect(screen.getByText('Ter: 0')).toBeInTheDocument();
    expect(screen.getByText('0 need configuration')).toBeInTheDocument();
  });

  it('should render proper grid layout', () => {
    const { container } = renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    // Should have Grid container
    const gridContainer = container.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();
    
    // Should have 4 Grid items for the 4 cards
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems).toHaveLength(4);
  });

  it('should display correct progress bar colors', () => {
    renderWithTheme(<CharacterDashboardCards analytics={mockAnalytics} />);
    
    // Memory economy progress should be success (42 >= 50 is false, so warning)
    const memoryProgress = screen.getByText('Total memory tokens').closest('.MuiCardContent-root').querySelector('.MuiLinearProgress-root');
    expect(memoryProgress).toBeInTheDocument();
    
    // Production readiness progress should be success
    const productionProgress = screen.getByText('Characters fully configured').closest('.MuiCardContent-root').querySelector('.MuiLinearProgress-root');
    expect(productionProgress).toBeInTheDocument();
  });
});