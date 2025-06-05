import React from 'react';
import { render, screen } from '@testing-library/react';
import ContextWorkspace from './ContextWorkspace';
import useJourneyStore from '../../stores/journeyStore';

// Mock the useJourneyStore hook
jest.mock('../../stores/journeyStore');

describe('ContextWorkspace', () => {
  let mockSelectedGapDetails;
  let mockCurrentGapSuggestions;
  let mockLoadingSuggestions;
  let mockSuggestionError;

  // Helper to setup mock implementations
  const setupMockStore = () => {
    useJourneyStore.mockImplementation(selector => {
      // This simplified mock directly calls the selector with a snapshot of the state.
      // It assumes selectors are functions like `state => state.property`.
      // For selectors that are themselves functions like `state => () => state.property()`
      // or `state => param => state.property[param]`, this needs adjustment.
      // Given the component code:
      // `useJourneyStore(state => state.selectedGapDetails())`
      // The selector is `state => state.selectedGapDetails`, and it's called, so the selector should return a function.
      const mockState = {
        selectedGapDetails: () => mockSelectedGapDetails,
        currentGapSuggestions: () => mockCurrentGapSuggestions,
        loadingSuggestions: mockLoadingSuggestions,
        suggestionError: mockSuggestionError,
      };
      return selector(mockState);
    });
  };

  beforeEach(() => {
    // Reset mocks for each test
    mockSelectedGapDetails = null;
    mockCurrentGapSuggestions = [];
    mockLoadingSuggestions = false;
    mockSuggestionError = null;
    setupMockStore(); // Apply default mocks
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('displays "Select a gap..." when selectedGap is null', () => {
    render(<ContextWorkspace />);
    expect(screen.getByText(/Select a gap in the timeline to see details and suggestions here./i)).toBeInTheDocument();
  });

  test('displays gap details when a gap is selected', () => {
    const fullId = 'gap123abcdeffedcba321';
    mockSelectedGapDetails = {
      id: fullId,
      start_minute: 10,
      end_minute: 25,
      severity: 'high',
    };
    setupMockStore(); // Re-apply mocks with new values

    render(<ContextWorkspace />);
    const expectedIdDisplay = `${fullId.slice(0, 8)}...${fullId.slice(-8)}`;
    expect(screen.getByText(`ID: ${expectedIdDisplay}`)).toBeInTheDocument();
    expect(screen.getByText(/Minutes: 10 - 25 \(Duration: 15 min\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Severity:/i)).toBeInTheDocument();
    expect(screen.getByLabelText('high')).toBeInTheDocument(); // Chip label used for severity
  });

  test('displays "Loading suggestions..." when loadingSuggestions is true and a gap is selected', () => {
    mockSelectedGapDetails = { id: 'gap123', start_minute: 10, end_minute: 25, severity: 'high' };
    mockLoadingSuggestions = true;
    setupMockStore();

    render(<ContextWorkspace />);
    expect(screen.getByText(/Loading suggestions.../i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument(); // MUI CircularProgress
  });

  test('displays suggestions when gapSuggestions are provided', () => {
    mockSelectedGapDetails = { id: 'gap123', start_minute: 10, end_minute: 25, severity: 'high' };
    mockCurrentGapSuggestions = [
      { id: 'sug1', description: 'First amazing suggestion', type: 'content' },
      { id: 'sug2', description: 'Second brilliant idea', type: 'system' },
    ];
    setupMockStore();

    render(<ContextWorkspace />);
    expect(screen.getByText(/First amazing suggestion/i)).toBeInTheDocument();
    expect(screen.getByText(/Type: content/i)).toBeInTheDocument();
    expect(screen.getByText(/Second brilliant idea/i)).toBeInTheDocument();
    expect(screen.getByText(/Type: system/i)).toBeInTheDocument();
  });

  test('displays "No suggestions available..." when gapSuggestions is empty, not loading, and no error, and a gap is selected', () => {
    mockSelectedGapDetails = { id: 'gap123', start_minute: 10, end_minute: 25, severity: 'high' };
    mockLoadingSuggestions = false;
    mockCurrentGapSuggestions = [];
    mockSuggestionError = null;
    setupMockStore();

    render(<ContextWorkspace />);
    expect(screen.getByText(/No suggestions available for this gap./i)).toBeInTheDocument();
  });

  test('displays error message when suggestionError is present and a gap is selected', () => {
    mockSelectedGapDetails = { id: 'gap123', start_minute: 10, end_minute: 25, severity: 'high' };
    mockSuggestionError = 'Failed to load suggestions.';
    setupMockStore();

    render(<ContextWorkspace />);
    expect(screen.getByText(/Failed to load suggestions./i)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument(); // MUI Alert
  });

  test('does not display suggestions section if no gap is selected', () => {
    // mockSelectedGapDetails is null by default
    render(<ContextWorkspace />);
    expect(screen.queryByText(/Loading suggestions.../i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Suggestions:/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/No suggestions available for this gap./i)).not.toBeInTheDocument();
  });
});
