import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CharacterFilters from '../CharacterFilters';

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

// Mock the useGameConstants hook
jest.mock('../../hooks/useGameConstants', () => ({
  getConstant: jest.fn((constants, key, defaultValue) => {
    const mockConstants = {
      'CHARACTERS.TYPES': ['Player', 'NPC'],
      'CHARACTERS.TIERS': ['Core', 'Secondary', 'Tertiary'],
      'RESOLUTION_PATHS.TYPES': ['Black Market', 'Detective', 'Third Path'],
      'RESOLUTION_PATHS.DEFAULT': 'Unassigned'
    };
    return mockConstants[key] || defaultValue;
  })
}));

describe('CharacterFilters', () => {
  const mockGameConstants = {};
  const defaultProps = {
    typeFilter: 'All Types',
    tierFilter: 'All Tiers',
    pathFilter: 'All Paths',
    onTypeFilterChange: jest.fn(),
    onTierFilterChange: jest.fn(),
    onPathFilterChange: jest.fn(),
    gameConstants: mockGameConstants
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render all filter controls', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Tier')).toBeInTheDocument();
    expect(screen.getByLabelText('Resolution Path')).toBeInTheDocument();
  });

  it('should display current filter values', () => {
    const props = {
      ...defaultProps,
      typeFilter: 'Player',
      tierFilter: 'Core',
      pathFilter: 'Black Market'
    };
    
    renderWithTheme(<CharacterFilters {...props} />);
    
    expect(screen.getByDisplayValue('Player')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Core')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Black Market')).toBeInTheDocument();
  });

  it('should render type filter options', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeSelect);
    
    expect(screen.getAllByText('All Types')).toHaveLength(2); // One in select, one in dropdown
    expect(screen.getByRole('option', { name: 'Player' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'NPC' })).toBeInTheDocument();
  });

  it('should render tier filter options', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    const tierSelect = screen.getByLabelText('Tier');
    fireEvent.mouseDown(tierSelect);
    
    expect(screen.getAllByText('All Tiers')).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'Core' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Secondary' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Tertiary' })).toBeInTheDocument();
  });

  it('should render path filter options', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    const pathSelect = screen.getByLabelText('Resolution Path');
    fireEvent.mouseDown(pathSelect);
    
    expect(screen.getAllByText('All Paths')).toHaveLength(2);
    expect(screen.getByRole('option', { name: 'Black Market' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Detective' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Third Path' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Unassigned' })).toBeInTheDocument();
  });

  it('should call onTypeFilterChange when type filter changes', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText('Type');
    fireEvent.mouseDown(typeSelect);
    
    const playerOption = screen.getByRole('option', { name: 'Player' });
    fireEvent.click(playerOption);
    
    expect(defaultProps.onTypeFilterChange).toHaveBeenCalled();
  });

  it('should call onTierFilterChange when tier filter changes', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    const tierSelect = screen.getByLabelText('Tier');
    fireEvent.mouseDown(tierSelect);
    
    const coreOption = screen.getByRole('option', { name: 'Core' });
    fireEvent.click(coreOption);
    
    expect(defaultProps.onTierFilterChange).toHaveBeenCalled();
  });

  it('should call onPathFilterChange when path filter changes', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    const pathSelect = screen.getByLabelText('Resolution Path');
    fireEvent.mouseDown(pathSelect);
    
    const blackMarketOption = screen.getByRole('option', { name: 'Black Market' });
    fireEvent.click(blackMarketOption);
    
    expect(defaultProps.onPathFilterChange).toHaveBeenCalled();
  });

  it('should render in proper grid layout', () => {
    const { container } = renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    // Should have Paper wrapper
    const paper = container.querySelector('.MuiPaper-root');
    expect(paper).toBeInTheDocument();
    
    // Should have Grid container
    const gridContainer = container.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();
    
    // Should have 3 Grid items for the 3 filters
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems).toHaveLength(3);
  });

  it('should display production filters title', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    expect(screen.getByText('Production Filters')).toBeInTheDocument();
  });

  it('should handle empty game constants gracefully', () => {
    const propsWithEmptyConstants = {
      ...defaultProps,
      gameConstants: null
    };
    
    renderWithTheme(<CharacterFilters {...propsWithEmptyConstants} />);
    
    // Should still render the filter controls
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Tier')).toBeInTheDocument();
    expect(screen.getByLabelText('Resolution Path')).toBeInTheDocument();
  });

  it('should use correct select sizes', () => {
    renderWithTheme(<CharacterFilters {...defaultProps} />);
    
    // All selects should have small size - check for the input size class
    const selects = screen.getAllByRole('combobox');
    selects.forEach(select => {
      expect(select).toHaveClass('MuiInputBase-inputSizeSmall');
    });
  });
});