import React from 'react';
import { render, screen } from '@testing-library/react';
import TimelineView from './TimelineView';
import useJourneyStore from '../../stores/journeyStore';

// Mock the Zustand store
jest.mock('../../stores/journeyStore');

// Default mock state for the store
const mockState = {
  selectedTimeRange: [0, 90],
  setSelectedTimeRange: jest.fn(),
  selectedItemId: null,
  setSelectedItemId: jest.fn(),
  activeGapDetails: null,
  setActiveGapDetails: jest.fn(),
  // Add other states and actions if TimelineView directly uses them
};

describe('TimelineView Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    useJourneyStore.mockImplementation((selector) => {
      // Directly use the selector to get parts of the mockState
      // This is a simplified way to handle selectors for this test.
      // For more complex selectors, you might need a more robust mock.
      return selector(mockState);
    });
    // Also reset call counts for any functions in mockState
    mockState.setSelectedTimeRange.mockClear();
    mockState.setSelectedItemId.mockClear();
    mockState.setActiveGapDetails.mockClear();
  });

  test('renders without crashing', () => {
    render(<TimelineView />);
    // Check if a prominent element or text from the component is present
    expect(screen.getByText(/Player Journey Timeline/i)).toBeInTheDocument();
  });

  test('renders correct number of initial 5-minute timeline segments for 90 minutes', () => {
    render(<TimelineView />);
    // TOTAL_PLAY_TIME is 90 minutes, SEGMENT_DURATION is 5 minutes.
    // Segments are drawn from 0 up to and including 90.
    // So, 0m, 5m, 10m, ..., 85m, 90m. This is 90/5 + 1 = 19 segment lines/markers.
    // The code calculates numSegments = Math.ceil(currentVisibleDuration / SEGMENT_DURATION);
    // And loops for (let i = 0; i <= numSegments; i++)
    // If view is 0-90, currentVisibleDuration = 90. numSegments = 18. Loop i from 0 to 18. (19 iterations)
    // It looks for time marks like "0m", "5m", ... "90m"

    // Let's verify the presence of the first and last expected time markers
    expect(screen.getByText('0m')).toBeInTheDocument();
    expect(screen.getByText('90m')).toBeInTheDocument();

    // And a few in between
    expect(screen.getByText('30m')).toBeInTheDocument();
    expect(screen.getByText('60m')).toBeInTheDocument();

    // Count how many elements with "m" are there (could be fragile if other text has "m")
    // A better way would be to add a specific test-id or class to segment labels.
    // For now, this is a basic check.
    const timeMarkers = screen.getAllByText((content, element) => {
      return element.tagName.toLowerCase() === 'span' && content.endsWith('m') && /^\d+m$/.test(content);
    });
    // Expect 0m, 5m, ..., 90m. This is 19 distinct markers.
    expect(timeMarkers.length).toBe(19);
  });

  test('displays default filter times from store', () => {
    render(<TimelineView />);
    const filterStartTimeInput = screen.getByLabelText(/Filter start time/i);
    const filterEndTimeInput = screen.getByLabelText(/Filter end time/i);
    expect(filterStartTimeInput.value).toBe('0');
    expect(filterEndTimeInput.value).toBe('90');
  });

  test('displays mock event names', () => {
    // This test assumes mockData is statically imported and used by TimelineView
    // If mockData were dynamic or fetched, this test would need adjustment or mocking of the data source.
    render(<TimelineView />);
    expect(screen.getByText('Activity 1')).toBeInTheDocument();
    expect(screen.getByText('Interaction 1')).toBeInTheDocument();
    expect(screen.getByText('Discovery 1')).toBeInTheDocument();
    expect(screen.getByText('Gap 1 (Gap)')).toBeInTheDocument(); // Adjusted for "(Gap)" text
  });

  // Add more tests:
  // - Test clicking on a gap event calls setActiveGapDetails and setSelectedItemId.
  // - Test changing filter inputs calls setSelectedTimeRange.
  // - Test zoom button functionality (this might be harder without more detailed mocking or e2e tests).
});
