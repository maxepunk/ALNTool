import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import GapIndicator from './GapIndicator'; // Default import
import useJourneyStore from '../../stores/journeyStore'; // Adjusted path for store hook

// Mock the useJourneyStore hook
jest.mock('../../stores/journeyStore');

describe('GapIndicator', () => {
  const mockGap = {
    id: 'gap1',
    type: 'travel',
    start_minute: 0,
    end_minute: 60,
    severity: 'medium',
    properties: {},
  };

  // Mock functions for store state and actions
  let mockSetSelectedGap;
  let mockSelectedGap;

  beforeEach(() => {
    mockSetSelectedGap = jest.fn();
    mockSelectedGap = null; // Default to no gap selected

    // Setup the mock implementation for useJourneyStore
    useJourneyStore.mockImplementation(selector => {
      if (selector(state => state.setSelectedGap)) {
        return mockSetSelectedGap;
      }
      if (selector(state => state.selectedGap)) {
        return mockSelectedGap;
      }
      return jest.fn(); // Default mock for other selectors
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('calls setSelectedGap with gap data on click', () => {
    const { container } = render(<GapIndicator gap={mockGap} />);
    // Paper component might not have a default role 'button' accessible like that,
    // let's target the clickable Paper element.
    // MUI Paper with onClick should be clickable.
    const indicatorElement = container.firstChild; // The Paper component is the root
    fireEvent.click(indicatorElement);
    expect(mockSetSelectedGap).toHaveBeenCalledTimes(1);
    expect(mockSetSelectedGap).toHaveBeenCalledWith(mockGap);
  });

  test('applies selected style when selectedGap matches', () => {
    mockSelectedGap = mockGap; // Set the gap as selected
    useJourneyStore.mockImplementation(selector => { // Re-mock for this specific test case
      if (selector(state => state.setSelectedGap)) return mockSetSelectedGap;
      if (selector(state => state.selectedGap)) return mockSelectedGap;
      return jest.fn();
    });

    const { container } = render(<GapIndicator gap={mockGap} />);
    const indicatorElement = container.firstChild;

    // Check for one of the specific styles applied when selected
    // The textColor for medium severity is '#b71c1c'
    // The outline should be `2px solid #b71c1c`
    expect(indicatorElement).toHaveStyle('outline: 2px solid #b71c1c');
    expect(indicatorElement).toHaveStyle('box-shadow: 0 0 10px #b71c1c');
  });

  test('does not apply selected style when another gap is selected', () => {
    mockSelectedGap = { id: 'anotherGap', start_minute: 0, end_minute: 30, severity: 'low' };
    useJourneyStore.mockImplementation(selector => { // Re-mock
      if (selector(state => state.setSelectedGap)) return mockSetSelectedGap;
      if (selector(state => state.selectedGap)) return mockSelectedGap;
      return jest.fn();
    });

    const { container } = render(<GapIndicator gap={mockGap} />);
    const indicatorElement = container.firstChild;
    // The textColor for medium severity is '#b71c1c'
    expect(indicatorElement).not.toHaveStyle('outline: 2px solid #b71c1c');
    expect(indicatorElement).not.toHaveStyle('box-shadow: 0 0 10px #b71c1c');
  });

  test('does not apply selected style when no gap is selected', () => {
    // mockSelectedGap is already null by default from beforeEach
    const { container } = render(<GapIndicator gap={mockGap} />);
    const indicatorElement = container.firstChild;
    // The textColor for medium severity is '#b71c1c'
    expect(indicatorElement).not.toHaveStyle('outline: 2px solid #b71c1c');
    expect(indicatorElement).not.toHaveStyle('box-shadow: 0 0 10px #b71c1c');
  });

  test('renders nothing if gap is not provided', () => {
    const { container } = render(<GapIndicator gap={null} />);
    expect(container.firstChild).toBeNull();
  });
});
