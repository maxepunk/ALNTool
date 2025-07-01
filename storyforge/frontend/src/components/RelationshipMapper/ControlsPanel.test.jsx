import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ControlsPanel from './ControlsPanel';

describe('ControlsPanel', () => {
  const mockUi = {
    depth: 2,
    setDepth: jest.fn(),
    maxDepth: 3,
    nodeFilters: { Character: true, Element: false, Puzzle: true },
    toggleNodeFilter: jest.fn(),
    edgeFilters: { dependency: true, character: false },
    toggleEdgeFilter: jest.fn(),
    showLowSignal: false,
    toggleShowLowSignal: jest.fn(),
    openInfoModal: jest.fn(),
    actFocusFilter: 'All',
    setActFocusFilter: jest.fn(),
    availableThemes: ['UV', 'Business', 'Tech'],
    themeFilters: { UV: true, Business: true, Tech: false },
    toggleThemeFilter: jest.fn(),
    setAllThemeFilters: jest.fn(),
    availableMemorySets: ['Set A', 'Set B'],
    memorySetFilter: 'All',
    setMemorySetFilter: jest.fn(),
  };

  const mockHandlers = {
    onZoomIn: jest.fn(),
    onZoomOut: jest.fn(),
    onFitView: jest.fn(),
  };

  const defaultProps = {
    ui: mockUi,
    onZoomIn: mockHandlers.onZoomIn,
    onZoomOut: mockHandlers.onZoomOut,
    onFitView: mockHandlers.onFitView,
    dependencyAnalysisMode: false,
  };

  it('should render controls title', () => {
    render(<ControlsPanel {...defaultProps} />);
    expect(screen.getByText('Controls')).toBeInTheDocument();
  });

  it('should render Production Controls title when in dependency analysis mode', () => {
    render(<ControlsPanel {...defaultProps} dependencyAnalysisMode={true} />);
    expect(screen.getByText('Production Controls')).toBeInTheDocument();
  });

  it('should render view controls', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom Out')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit View')).toBeInTheDocument();
  });

  it('should call zoom handlers when view buttons are clicked', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText('Zoom In'));
    expect(mockHandlers.onZoomIn).toHaveBeenCalled();
    
    fireEvent.click(screen.getByLabelText('Zoom Out'));
    expect(mockHandlers.onZoomOut).toHaveBeenCalled();
    
    fireEvent.click(screen.getByLabelText('Fit View'));
    expect(mockHandlers.onFitView).toHaveBeenCalled();
  });

  it('should render depth slider', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    expect(screen.getByText('Exploration Depth: 2')).toBeInTheDocument();
    const slider = screen.getByRole('slider', { name: /exploration depth/i });
    expect(slider).toHaveValue('2');
    expect(slider).toHaveAttribute('max', '3');
  });

  it('should call setDepth when slider value changes', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    const slider = screen.getByRole('slider', { name: /exploration depth/i });
    fireEvent.change(slider, { target: { value: '3' } });
    
    expect(mockUi.setDepth).toHaveBeenCalledWith(3);
  });

  it('should render node type filters', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    expect(screen.getByText('Filter Nodes by Type')).toBeInTheDocument();
    // Use more specific queries to avoid conflicts with edge filters
    const nodeFiltersSection = screen.getByText('Filter Nodes by Type').parentElement;
    expect(nodeFiltersSection.textContent).toContain('Character');
    expect(nodeFiltersSection.textContent).toContain('Element');
    expect(nodeFiltersSection.textContent).toContain('Puzzle');
  });

  it('should show correct node filter states', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    // Get all Character chips and find the one in node filters (first one)
    const characterChips = screen.getAllByText('Character');
    const nodeFilterCharacterChip = characterChips[0].closest('[role="button"]');
    expect(nodeFilterCharacterChip).toHaveClass('MuiChip-colorPrimary');
    
    // Element is unchecked (default color) 
    const elementChip = screen.getByText('Element').closest('[role="button"]');
    expect(elementChip).toHaveClass('MuiChip-colorDefault');
  });

  it('should call toggleNodeFilter when node filter is clicked', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    // Get the first Character chip (node filter)
    const characterChips = screen.getAllByText('Character');
    fireEvent.click(characterChips[0]);
    expect(mockUi.toggleNodeFilter).toHaveBeenCalledWith('Character');
  });

  it('should render act focus filter', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    expect(screen.getByText('Filter by Act Focus')).toBeInTheDocument();
    expect(screen.getByLabelText('Act Focus')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /act focus/i })).toHaveTextContent('All Acts');
  });

  it('should render act focus options when clicked', async () => {
    const user = userEvent.setup();
    render(<ControlsPanel {...defaultProps} />);
    
    await user.click(screen.getByRole('combobox', { name: /act focus/i }));
    
    expect(screen.getByRole('option', { name: 'All Acts' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Act 1' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Act 2' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Act 3' })).toBeInTheDocument();
  });

  it('should render theme filters', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    expect(screen.getByText('Filter by Theme')).toBeInTheDocument();
    expect(screen.getByText('UV')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
    expect(screen.getByText('Tech')).toBeInTheDocument();
  });

  it('should render theme filter all/none buttons', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    const allButton = screen.getByRole('button', { name: 'All' });
    const noneButton = screen.getByRole('button', { name: 'None' });
    
    expect(allButton).toBeInTheDocument();
    expect(noneButton).toBeInTheDocument();
  });

  it('should call setAllThemeFilters when all/none buttons are clicked', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(mockUi.setAllThemeFilters).toHaveBeenCalledWith(true);
    
    fireEvent.click(screen.getByRole('button', { name: 'None' }));
    expect(mockUi.setAllThemeFilters).toHaveBeenCalledWith(false);
  });

  it('should render memory set filter', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    expect(screen.getByText('Filter by Memory Set')).toBeInTheDocument();
    expect(screen.getByLabelText('Memory Set')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: /memory set/i })).toHaveTextContent('All Sets');
  });

  it('should render edge type filters', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    expect(screen.getByText('Filter Edges by Type')).toBeInTheDocument();
    expect(screen.getByText('Dependency')).toBeInTheDocument();
    // Edge filter 'character' is capitalized in display
    const edgeFiltersSection = screen.getByText('Filter Edges by Type').parentElement;
    expect(edgeFiltersSection.textContent).toContain('Character');
  });

  it('should render signal strength toggle', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    // The button shows different text based on showLowSignal state
    // When showLowSignal is false, it shows 'Focus on Key Links'
    const button = screen.getByText('Focus on Key Links');
    expect(button).toBeInTheDocument();
  });

  it('should toggle signal strength text when clicked', () => {
    const { rerender } = render(<ControlsPanel {...defaultProps} />);
    
    fireEvent.click(screen.getByText('Focus on Key Links'));
    expect(mockUi.toggleShowLowSignal).toHaveBeenCalled();
    
    // Simulate prop update
    const updatedProps = {
      ...defaultProps,
      ui: { ...mockUi, showLowSignal: true }
    };
    rerender(<ControlsPanel {...updatedProps} />);
    
    expect(screen.getByText('Show All Connections')).toBeInTheDocument();
  });

  it('should call openInfoModal when info button is clicked', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    fireEvent.click(screen.getByLabelText('Map Information & Help'));
    expect(mockUi.openInfoModal).toHaveBeenCalled();
  });

  it('should have proper section dividers', () => {
    render(<ControlsPanel {...defaultProps} />);
    
    const dividers = screen.getAllByRole('separator');
    expect(dividers.length).toBeGreaterThan(5); // Should have dividers between sections
  });
});