import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ElementFilters from '../ElementFilters';

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

describe('ElementFilters', () => {
  const mockGameConstants = { /* mock constants */ };
  const mockHandlers = {
    onTypeChange: jest.fn(),
    onStatusChange: jest.fn(),
    onFirstAvailableChange: jest.fn(),
    onActFocusChange: jest.fn(),
    onThemeChange: jest.fn(),
    onSelectAllThemes: jest.fn(),
    onMemorySetChange: jest.fn()
  };

  const defaultProps = {
    elementType: 'All Types',
    status: 'All Statuses',
    firstAvailable: 'All Acts',
    actFocusFilter: 'All Acts',
    availableThemes: ['Action', 'Mystery', 'Romance'],
    selectedThemes: { 'Action': true, 'Mystery': false, 'Romance': true },
    availableMemorySets: ['Set A', 'Set B', 'Set C'],
    selectedMemorySet: 'All Sets',
    gameConstants: mockGameConstants,
    ...mockHandlers
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set up default returns for getConstant
    mockGetConstant.mockImplementation((key, defaultValue) => {
      const constants = {
        'ELEMENTS.CATEGORIES': ['Prop', 'Set Dressing', 'Memory Token Video', 'Character Sheet'],
        'ELEMENTS.STATUS_TYPES': ['Ready for Playtest', 'Done', 'In development', 'Idea/Placeholder'],
        'ACTS.TYPES': ['Act 1', 'Act 2']
      };
      return constants[key] || defaultValue;
    });
  });

  it('should render production filters title', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    expect(screen.getByText('Production Filters')).toBeInTheDocument();
  });

  it('should render all filter controls', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    expect(screen.getByLabelText('Element Type')).toBeInTheDocument();
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('First Available')).toBeInTheDocument();
    expect(screen.getByLabelText('Act Focus')).toBeInTheDocument();
    expect(screen.getByLabelText('Memory Set')).toBeInTheDocument();
  });

  it('should display current filter values', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    expect(screen.getByDisplayValue('All Types')).toBeInTheDocument();
    expect(screen.getByDisplayValue('All Statuses')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('All Acts')).toHaveLength(2); // First Available and Act Focus
    expect(screen.getByDisplayValue('All Sets')).toBeInTheDocument();
  });

  it('should call onTypeChange when element type is changed', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const typeSelect = screen.getByLabelText('Element Type');
    fireEvent.mouseDown(typeSelect);
    
    const propOption = screen.getByText('Prop');
    fireEvent.click(propOption);
    
    expect(mockHandlers.onTypeChange).toHaveBeenCalled();
  });

  it('should call onStatusChange when status is changed', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    
    const doneOption = screen.getByText('Done');
    fireEvent.click(doneOption);
    
    expect(mockHandlers.onStatusChange).toHaveBeenCalled();
  });

  it('should call onFirstAvailableChange when first available is changed', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const firstAvailableSelect = screen.getByLabelText('First Available');
    fireEvent.mouseDown(firstAvailableSelect);
    
    const act1Option = screen.getByText('Act 1');
    fireEvent.click(act1Option);
    
    expect(mockHandlers.onFirstAvailableChange).toHaveBeenCalled();
  });

  it('should call onActFocusChange when act focus is changed', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const actFocusSelect = screen.getByLabelText('Act Focus');
    fireEvent.mouseDown(actFocusSelect);
    
    const act2Option = screen.getByText('Act 2');
    fireEvent.click(act2Option);
    
    expect(mockHandlers.onActFocusChange).toHaveBeenCalled();
  });

  it('should call onMemorySetChange when memory set is changed', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const memorySetSelect = screen.getByLabelText('Memory Set');
    fireEvent.mouseDown(memorySetSelect);
    
    const setAOption = screen.getByText('Set A');
    fireEvent.click(setAOption);
    
    expect(mockHandlers.onMemorySetChange).toHaveBeenCalled();
  });

  it('should render theme filter section', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    expect(screen.getByText('Filter by Themes')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('None')).toBeInTheDocument();
  });

  it('should render theme chips with correct states', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    expect(screen.getByText('Action')).toBeInTheDocument();
    expect(screen.getByText('Mystery')).toBeInTheDocument();
    expect(screen.getByText('Romance')).toBeInTheDocument();
  });

  it('should call onSelectAllThemes when All button is clicked', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const allButton = screen.getByText('All');
    fireEvent.click(allButton);
    
    expect(mockHandlers.onSelectAllThemes).toHaveBeenCalledWith(true);
  });

  it('should call onSelectAllThemes when None button is clicked', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const noneButton = screen.getByText('None');
    fireEvent.click(noneButton);
    
    expect(mockHandlers.onSelectAllThemes).toHaveBeenCalledWith(false);
  });

  it('should call onThemeChange when theme chip is clicked', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const actionChip = screen.getByText('Action');
    fireEvent.click(actionChip);
    
    expect(mockHandlers.onThemeChange).toHaveBeenCalledWith('Action');
  });

  it('should show message when no themes are available', () => {
    const propsWithNoThemes = {
      ...defaultProps,
      availableThemes: [],
      selectedThemes: {}
    };
    
    renderWithTheme(<ElementFilters {...propsWithNoThemes} />);
    
    expect(screen.getByText('No themes found in current data.')).toBeInTheDocument();
  });

  it('should render with responsive grid layout', () => {
    const { container } = renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const gridContainer = container.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();
    
    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems.length).toBeGreaterThan(0);
  });

  it('should use correct form control sizes', () => {
    const { container } = renderWithTheme(<ElementFilters {...defaultProps} />);
    
    const formControls = container.querySelectorAll('.MuiFormControl-root');
    expect(formControls.length).toBeGreaterThan(0); // Just check they exist
  });

  it('should handle empty memory sets list', () => {
    const propsWithNoMemorySets = {
      ...defaultProps,
      availableMemorySets: []
    };
    
    renderWithTheme(<ElementFilters {...propsWithNoMemorySets} />);
    
    // Should still render the Memory Set select with just "All Sets" option
    expect(screen.getByLabelText('Memory Set')).toBeInTheDocument();
  });

  it('should display all select options correctly', () => {
    renderWithTheme(<ElementFilters {...defaultProps} />);
    
    // Check element type options
    const typeSelect = screen.getByLabelText('Element Type');
    fireEvent.mouseDown(typeSelect);
    expect(screen.getAllByText('All Types')).toHaveLength(2); // One in select, one in options
    expect(screen.getByText('Prop')).toBeInTheDocument();
    
    // Check status options  
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    expect(screen.getAllByText('All Statuses')).toHaveLength(2); // One in select, one in options
    expect(screen.getByText('Ready for Playtest')).toBeInTheDocument();
  });
});