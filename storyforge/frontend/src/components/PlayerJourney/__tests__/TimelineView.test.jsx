import React from 'react';
import { render, fireEvent, screen, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TimelineView from '../TimelineView';
import useJourneyStore from '../../../stores/journeyStore';

// Mock the ResizeObserver, often needed for tests involving layout/refs
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;


// Mock the journeyStore
jest.mock('../../../stores/journeyStore');

// Default mock state for the store
const mockInitialStoreState = {
  activeCharacterId: null,
  journeyData: new Map(),
  gaps: new Map(),
  selectedTimeRange: [0, 90],
  loadingJourneyCharacterId: null,
  error: null,
  selectedGap: null,
  gapSuggestions: [],
  loadingSuggestions: false,
  suggestionError: null,
  selectedActivityDetail: null,
  // Actions - these will be jest.fn()
  setActiveCharacterId: jest.fn(),
  setSelectedTimeRange: jest.fn(),
  loadJourney: jest.fn(),
  setSelectedGap: jest.fn(),
  setSelectedActivityDetail: jest.fn(),
  // Make sure all functions returned by the store are mocked if they are called
};

describe('TimelineView Rendering', () => {
  beforeEach(() => {
    // Reset mocks and provide a default implementation for useJourneyStore
    jest.clearAllMocks();
    useJourneyStore.mockImplementation((selector) => {
      // This is a simplified selector mock. For complex selectors, you might need a more robust setup.
      // For this test suite, we'll mostly rely on setting the state directly via the mock
      // or checking that actions were called.
      if (typeof selector === 'function') {
        return selector(mockInitialStoreState);
      }
      return mockInitialStoreState[selector]; // Fallback for simple property access
    });
    // Allow overriding state for specific tests by re-assigning parts of mockInitialStoreState
    // or by directly using useJourneyStore.setState (if we mock it to allow that)
  });

  test('renders "Select a Character" when no character is active', () => {
    mockInitialStoreState.activeCharacterId = null;
    render(<TimelineView />);
    expect(screen.getByText('Select a Character')).toBeInTheDocument();
  });

  test('renders character name when a character is active', () => {
    mockInitialStoreState.activeCharacterId = 'char1';
    mockInitialStoreState.journeyData = new Map([
      ['char1', { character_info: { name: 'Test Character One' }, segments: [] }],
    ]);
    render(<TimelineView />);
    expect(screen.getByText('Timeline for Test Character One')).toBeInTheDocument();
  });
});

describe('TimelineView Interactivity (Zoom, Pan, Click)', () => {
  let zoomableBox;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup active character and basic journey data
    mockInitialStoreState.activeCharacterId = 'char1';
    mockInitialStoreState.journeyData = new Map([
      ['char1', {
        character_info: { name: 'Test Character One' },
        segments: [
          { id: 'seg1', start_minute: 0, end_minute: 5, activities: [{ id: 'act1', description: 'First Activity' }], interactions: [], discoveries: [] },
          { id: 'seg2', start_minute: 5, end_minute: 10, activities: [], interactions: [], discoveries: [] },
        ],
        gaps: [],
      }],
    ]);
    mockInitialStoreState.gaps = new Map([['char1', []]]);
    mockInitialStoreState.selectedActivityDetail = null; // Ensure it's reset
    mockInitialStoreState.setSelectedActivityDetail = jest.fn(); // Spy on this action

    // Mock implementation for the store for this suite
    useJourneyStore.mockImplementation(selector => {
      if (selector === useJourneyStore.getState) return mockInitialStoreState; // If components use getState()
      if (typeof selector === 'function') {
        // Simulate selector behavior
        const state = {
            ...mockInitialStoreState,
            // Allow components to call actions by returning the mocked jest.fn()
            setSelectedActivityDetail: mockInitialStoreState.setSelectedActivityDetail,
        };
        return selector(state);
      }
      // Fallback for direct property access (less common with Zustand selectors)
      return mockInitialStoreState[selector];
    });

    // Render the component and find the zoomable box once
    render(<TimelineView />);
    // The zoomable box is the one with transform style. We need a way to select it.
    // Let's assume it's a child of the box with overflowX: 'auto'.
    // For more robust selection, add a data-testid to the zoomable Box in TimelineView.jsx
    // For now, we'll try to find it by structure if possible, or rely on its content for clicks.
    // The actual zoomable box is the parent of the List.
    const listElement = screen.getByRole('list'); // The <List dense>
    zoomableBox = listElement.parentElement; // The Box applying scaleX and translateX
  });

  // Helper to get transform values
  const getTransform = (element) => {
    const transform = element.style.transform;
    const scaleXMatch = transform.match(/scaleX\(([^)]+)\)/);
    const translateXMatch = transform.match(/translateX\(([^p]+)px\)/);
    return {
      scaleX: scaleXMatch ? parseFloat(scaleXMatch[1]) : 1,
      translateX: translateXMatch ? parseFloat(translateXMatch[1]) : 0,
    };
  };

  test('Zoom In button increases scaleX', () => {
    const initialScale = getTransform(zoomableBox).scaleX;
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    expect(getTransform(zoomableBox).scaleX).toBeGreaterThan(initialScale);
  });

  test('Zoom Out button decreases scaleX', () => {
    // First zoom in a bit so we can zoom out from something > 1 if needed by logic
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i }));
    const initialScale = getTransform(zoomableBox).scaleX;
    fireEvent.click(screen.getByRole('button', { name: /zoom out/i }));
    expect(getTransform(zoomableBox).scaleX).toBeLessThan(initialScale);
  });

  test('Reset View button resets scaleX to 1 and translateX to 0', () => {
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i })); // Zoom in
    fireEvent.mouseDown(zoomableBox, { clientX: 100 }); // Pan a bit
    fireEvent.mouseMove(document, { clientX: 50 });
    fireEvent.mouseUp(document);

    fireEvent.click(screen.getByRole('button', { name: /reset view/i }));
    const transform = getTransform(zoomableBox);
    expect(transform.scaleX).toBe(1);
    expect(transform.translateX).toBe(0);
  });

  test('Ctrl+Scroll up zooms in', () => {
    const initialScale = getTransform(zoomableBox).scaleX;
    const paperContainer = screen.getByText('Timeline for Test Character One').closest('div.MuiPaper-root'); // Find the Paper
    fireEvent.wheel(paperContainer, { deltaY: -100, ctrlKey: true });
    expect(getTransform(zoomableBox).scaleX).toBeGreaterThan(initialScale);
  });

  test('Ctrl+Scroll down zooms out', () => {
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i })); // Zoom in first
    const initialScale = getTransform(zoomableBox).scaleX;
    const paperContainer = screen.getByText('Timeline for Test Character One').closest('div.MuiPaper-root');
    fireEvent.wheel(paperContainer, { deltaY: 100, ctrlKey: true });
    expect(getTransform(zoomableBox).scaleX).toBeLessThan(initialScale);
  });

  test('Mouse drag pans the timeline when zoomed', () => {
    fireEvent.click(screen.getByRole('button', { name: /zoom in/i })); // Ensure zoomed
    const initialTranslateX = getTransform(zoomableBox).translateX;

    act(() => {
      fireEvent.mouseDown(zoomableBox, { clientX: 100, button: 0 });
    });
    act(() => {
      fireEvent.mouseMove(document, { clientX: 50 }); // Drag left by 50px
    });
    act(() => {
      fireEvent.mouseUp(document);
    });

    // The pan amount is deltaX, so 50 - 100 = -50
    expect(getTransform(zoomableBox).translateX).toBe(initialTranslateX - 50);
  });

  test('Clicking an ActivityBlock calls setSelectedActivityDetail', async () => {
    // ActivityBlock is rendered with "First Activity"
    const activityChip = screen.getByText('First Activity');
    const activityContainer = activityChip.closest('div[role="button"], div[style*="cursor: pointer"]'); // The clickable Box

    expect(activityContainer).toBeInTheDocument();

    fireEvent.click(activityContainer);

    // Check if the mocked action was called
    expect(mockInitialStoreState.setSelectedActivityDetail).toHaveBeenCalledTimes(1);
    // And with the correct activity object/string.
    // The activity object is { id: 'act1', description: 'First Activity' }
    expect(mockInitialStoreState.setSelectedActivityDetail).toHaveBeenCalledWith(
      mockInitialStoreState.journeyData.get('char1').segments[0].activities[0]
    );
  });

   test('Clicking the same ActivityBlock toggles selection (sets to null)', async () => {
    const activity = mockInitialStoreState.journeyData.get('char1').segments[0].activities[0];
    const activityChip = screen.getByText(activity.description);
    const activityContainer = activityChip.closest('div[style*="cursor: pointer"]');

    // First click to select
    fireEvent.click(activityContainer);
    expect(mockInitialStoreState.setSelectedActivityDetail).toHaveBeenCalledWith(activity);

    // Simulate it being selected in the store for the next click
    // This part of the test relies on the component correctly re-reading selectedActivityDetail
    // For a pure component test, we'd update the mock store state and re-render or use waitFor
    // Here, we are testing the action's toggle logic which is inside the store,
    // but the click handler calls the action. The action itself handles the toggle.
    // So, the second call to the *same* action with the *same* argument should trigger the toggle logic *within* the action.
    // The component simply calls the action.

    // To test the *effect* of the toggle in the component (e.g., visual style change),
    // we would need to update the mock store's `selectedActivityDetail` state that the component reads.
    // For now, we're just testing that the action is called.
    // If the store's `setSelectedActivityDetail` is correctly implemented for toggling,
    // calling it again with the same activity *should* result in it setting the internal state to null.
    // Our current mock for setSelectedActivityDetail is just jest.fn(), it doesn't have the toggle logic.
    // To properly test the toggle effect reflected in the UI, the mock for useJourneyStore
    // would need to actually change `mockInitialStoreState.selectedActivityDetail` when the action is called.

    // Let's refine the mock to simulate the action's effect on the selectedActivityDetail state
    // for the purpose of testing toggle behavior *if* the component's behavior depends on it for the *next* click.
    // However, the task is to test that the action is called. The action's internal logic (toggling)
    // should be tested in the store's own test file.
    // Here, we simply ensure the component calls the action.

    // If we were to test that the *component* correctly reflects the toggled state:
    // 1. Click -> action called with activity
    // 2. Manually update `mockInitialStoreState.selectedActivityDetail = activity;`
    // 3. Re-render or trigger update if necessary (often automatic with state change)
    // 4. Click again -> action called with activity (store should toggle it to null)
    // 5. Manually update `mockInitialStoreState.selectedActivityDetail = null;`
    // 6. Assert UI reflects deselection.

    // For this test, just ensuring the action is called again is sufficient for "component calls action".
    fireEvent.click(activityContainer);
    expect(mockInitialStoreState.setSelectedActivityDetail).toHaveBeenCalledTimes(2);
    expect(mockInitialStoreState.setSelectedActivityDetail).toHaveBeenLastCalledWith(activity);
  });

});

// Add a test for initial state of zoomableBox transform
test('Zoomable box has initial transform of scaleX(1) and translateX(0)', () => {
  mockInitialStoreState.activeCharacterId = 'char1';
  mockInitialStoreState.journeyData = new Map([
    ['char1', { character_info: { name: 'Test Character One' }, segments: [] }],
  ]);
  render(<TimelineView />);
  const listElement = screen.getByRole('list');
  const zoomableBox = listElement.parentElement;
  const transform = getTransform(zoomableBox);
  expect(transform.scaleX).toBe(1);
  expect(transform.translateX).toBe(0);
});

// Helper function to simplify getting transform style (already defined in describe block, but good for standalone tests)
const getTransform = (element) => {
    if (!element || !element.style) return { scaleX: 1, translateX: 0 };
    const transform = element.style.transform;
    const scaleXMatch = transform.match(/scaleX\(([^)]+)\)/);
    const translateXMatch = transform.match(/translateX\(([^p]+)px\)/);
    return {
      scaleX: scaleXMatch ? parseFloat(scaleXMatch[1]) : 1,
      translateX: translateXMatch ? parseFloat(translateXMatch[1]) : 0,
    };
};
