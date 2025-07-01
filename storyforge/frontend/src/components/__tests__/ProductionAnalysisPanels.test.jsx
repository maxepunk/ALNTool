import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ProductionAnalysisPanels from '../ProductionAnalysisPanels';
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

describe('ProductionAnalysisPanels', () => {
  const mockGameConstants = {
    RESOLUTION_PATHS: {
      TYPES: ['Black Market', 'Detective', 'Third Path'],
      THEMES: {
        'Black Market': { color: 'error', icon: 'AccountBalance' },
        'Detective': { color: 'info', icon: 'Search' },
        'Third Path': { color: 'success', icon: 'Groups' }
      }
    }
  };

  const mockPathDistribution = {
    'Black Market': 15,
    'Detective': 20,
    'Third Path': 10,
    'Unassigned': 5
  };

  const mockProductionStatus = {
    toDesign: 8,
    toBuild: 12,
    ready: 30
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

  it('should render both panels', () => {
    renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('Resolution Path Distribution')).toBeInTheDocument();
    expect(screen.getByText('Production Pipeline')).toBeInTheDocument();
  });

  it('should display path distribution for all paths', () => {
    renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('15')).toBeInTheDocument(); // Black Market
    expect(screen.getByText('20')).toBeInTheDocument(); // Detective
    expect(screen.getByText('10')).toBeInTheDocument(); // Third Path
    expect(screen.getByText('5')).toBeInTheDocument(); // Unassigned
    
    expect(screen.getByText('Black Market')).toBeInTheDocument();
    expect(screen.getByText('Detective')).toBeInTheDocument();
    expect(screen.getByText('Third Path')).toBeInTheDocument();
    expect(screen.getByText('Unassigned')).toBeInTheDocument();
  });

  it('should display production pipeline stages', () => {
    renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    expect(screen.getByText('To Design')).toBeInTheDocument();
    expect(screen.getByText('8 tokens need design work')).toBeInTheDocument();
    
    expect(screen.getByText('To Build')).toBeInTheDocument();
    expect(screen.getByText('12 tokens in fabrication queue')).toBeInTheDocument();
    
    expect(screen.getByText('Production Ready')).toBeInTheDocument();
    expect(screen.getByText('30 tokens completed and ready')).toBeInTheDocument();
  });

  it('should render icons for each path', () => {
    const { container } = renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    // Check that SVG icons are rendered
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should render badges with correct counts', () => {
    renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    // Check badge contents
    const badges = screen.getAllByText(/^\d+$/);
    const badgeValues = badges.map(b => parseInt(b.textContent));
    
    expect(badgeValues).toContain(8); // toDesign
    expect(badgeValues).toContain(12); // toBuild
    expect(badgeValues).toContain(30); // ready
  });

  it('should use correct colors for badges', () => {
    const { container } = renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    // Check for MUI Badge components with colors
    expect(container.querySelector('.MuiBadge-colorWarning')).toBeInTheDocument();
    expect(container.querySelector('.MuiBadge-colorInfo')).toBeInTheDocument();
    expect(container.querySelector('.MuiBadge-colorSuccess')).toBeInTheDocument();
  });

  it('should display in a grid layout', () => {
    const { container } = renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    // Find the top-level grid items (panels)
    const topLevelGrid = container.firstChild;
    const panelItems = topLevelGrid.querySelectorAll(':scope > .MuiGrid-item');
    expect(panelItems).toHaveLength(2); // Two panels
  });

  it('should render path distribution boxes with correct styling', () => {
    const { container } = renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    // Check that path boxes are rendered within a grid
    const pathGrid = container.querySelector('.MuiGrid-container');
    const pathBoxes = pathGrid?.querySelectorAll('.MuiBox-root');
    
    expect(pathBoxes?.length).toBeGreaterThan(0);
  });

  it('should handle zero values correctly', () => {
    const zeroDistribution = {
      'Black Market': 0,
      'Detective': 0,
      'Third Path': 0,
      'Unassigned': 0
    };

    const zeroProduction = {
      toDesign: 0,
      toBuild: 0,
      ready: 0
    };

    renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={zeroDistribution}
        productionStatus={zeroProduction}
        gameConstants={mockGameConstants}
      />
    );

    // Should still render all sections
    expect(screen.getByText('Resolution Path Distribution')).toBeInTheDocument();
    expect(screen.getByText('Production Pipeline')).toBeInTheDocument();
    
    // Check for zero values
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });

  it('should have production pipeline as a list', () => {
    const { container } = renderWithTheme(
      <ProductionAnalysisPanels 
        pathDistribution={mockPathDistribution}
        productionStatus={mockProductionStatus}
        gameConstants={mockGameConstants}
      />
    );

    const list = container.querySelector('.MuiList-root');
    expect(list).toBeInTheDocument();
    
    const listItems = list?.querySelectorAll('.MuiListItem-root');
    expect(listItems).toHaveLength(3); // Three production stages
  });
});