import { render, screen, fireEvent } from '@testing-library/react';
import PuzzleFilters from './PuzzleFilters';

// Mock useGameConstants hook
jest.mock('../hooks/useGameConstants', () => ({
  getConstant: jest.fn((constants, path, defaultValue) => {
    if (path === 'ACT_FOCUS_OPTIONS') {
      return ['Act 1', 'Act 2', 'Act 3', 'Multi-Act'];
    }
    return defaultValue;
  })
}));

const mockProps = {
  actFocusFilter: 'All Acts',
  onActFocusChange: jest.fn(),
  availableThemes: ['Mystery', 'Investigation', 'Crime'],
  selectedThemes: { 'Mystery': true, 'Investigation': true, 'Crime': false },
  onThemeChange: jest.fn(),
  onSelectAllThemes: jest.fn(),
  selectedNarrativeThread: 'All Threads',
  availableNarrativeThreads: ['Main Mystery', 'Crime Ring', 'Side Quest'],
  onNarrativeThreadChange: jest.fn(),
  gameConstants: {
    ACT_FOCUS_OPTIONS: ['Act 1', 'Act 2', 'Act 3', 'Multi-Act']
  }
};

describe('PuzzleFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render filter controls', () => {
    render(<PuzzleFilters {...mockProps} />);

    expect(screen.getByText('Filter Puzzles')).toBeInTheDocument();
    expect(screen.getByLabelText('Act Focus')).toBeInTheDocument();
    expect(screen.getByLabelText('Narrative Thread')).toBeInTheDocument();
    expect(screen.getByText('Select All')).toBeInTheDocument();
    expect(screen.getByText('Clear All')).toBeInTheDocument();
  });

  it('should render theme chips', () => {
    render(<PuzzleFilters {...mockProps} />);

    expect(screen.getByText('Mystery')).toBeInTheDocument();
    expect(screen.getByText('Investigation')).toBeInTheDocument();
    expect(screen.getByText('Crime')).toBeInTheDocument();
  });

  it('should handle act focus change', () => {
    render(<PuzzleFilters {...mockProps} />);

    const actSelect = screen.getByLabelText('Act Focus');
    fireEvent.mouseDown(actSelect);
    
    const act1Option = screen.getByText('Act 1');
    fireEvent.click(act1Option);

    expect(mockProps.onActFocusChange).toHaveBeenCalled();
  });

  it('should handle narrative thread change', () => {
    render(<PuzzleFilters {...mockProps} />);

    const threadSelect = screen.getByLabelText('Narrative Thread');
    fireEvent.mouseDown(threadSelect);
    
    const mainMysteryOption = screen.getByText('Main Mystery');
    fireEvent.click(mainMysteryOption);

    expect(mockProps.onNarrativeThreadChange).toHaveBeenCalled();
  });

  it('should handle theme selection', () => {
    render(<PuzzleFilters {...mockProps} />);

    const crimeChip = screen.getByText('Crime');
    fireEvent.click(crimeChip);

    expect(mockProps.onThemeChange).toHaveBeenCalledWith('Crime');
  });

  it('should handle select all themes', () => {
    render(<PuzzleFilters {...mockProps} />);

    const selectAllButton = screen.getByText('Select All');
    fireEvent.click(selectAllButton);

    expect(mockProps.onSelectAllThemes).toHaveBeenCalledWith(true);
  });

  it('should handle clear all themes', () => {
    render(<PuzzleFilters {...mockProps} />);

    const clearAllButton = screen.getByText('Clear All');
    fireEvent.click(clearAllButton);

    expect(mockProps.onSelectAllThemes).toHaveBeenCalledWith(false);
  });

  it('should show correct filter summary', () => {
    render(<PuzzleFilters {...mockProps} />);

    // Should show "2 themes" since Mystery and Investigation are selected
    expect(screen.getByText('2 themes')).toBeInTheDocument();
  });

  it('should disable select all when all themes selected', () => {
    const propsWithAllThemes = {
      ...mockProps,
      selectedThemes: { 'Mystery': true, 'Investigation': true, 'Crime': true }
    };

    render(<PuzzleFilters {...propsWithAllThemes} />);

    const selectAllButton = screen.getByText('Select All');
    expect(selectAllButton).toBeDisabled();
  });

  it('should disable clear all when no themes selected', () => {
    const propsWithNoThemes = {
      ...mockProps,
      selectedThemes: { 'Mystery': false, 'Investigation': false, 'Crime': false }
    };

    render(<PuzzleFilters {...propsWithNoThemes} />);

    const clearAllButton = screen.getByText('Clear All');
    expect(clearAllButton).toBeDisabled();
  });
});