import useJourneyStore from './journeyStore';
import { act } from '@testing-library/react'; // Though Zustand handles act for async, good for consistency

// Mock the api service used by other parts of the store
jest.mock('../services/api', () => ({
  get: jest.fn(),
  // Add other methods like post, put, delete if they are used by actions being tested
}));

// Mock setTimeout and other timer functions
jest.useFakeTimers();

describe('journeyStore', () => {
  const initialGlobalState = useJourneyStore.getState();

  beforeEach(() => {
    // Reset store to initial state before each test
    useJourneyStore.setState(initialGlobalState, true);
    // Clear any mock calls
    jest.clearAllMocks();
    // Clear all timers
    jest.clearAllTimers();
  });

  const gap1 = { id: 'gap1', start_minute: 0, end_minute: 5, severity: 'low' };
  const gap2 = { id: 'gap2', start_minute: 10, end_minute: 20, severity: 'medium' };

  describe('Initial state', () => {
    test('should have null selectedGap initially', () => {
      expect(useJourneyStore.getState().selectedGap).toBeNull();
    });
    test('should have empty gapSuggestions initially', () => {
      expect(useJourneyStore.getState().gapSuggestions).toEqual([]);
    });
    test('should have loadingSuggestions false initially', () => {
      expect(useJourneyStore.getState().loadingSuggestions).toBe(false);
    });
    test('should have null suggestionError initially', () => {
      expect(useJourneyStore.getState().suggestionError).toBeNull();
    });
  });

  describe('setSelectedGap action', () => {
    test('correctly updates selectedGap and triggers suggestion loading', () => {
      // Initial state check
      expect(useJourneyStore.getState().selectedGap).toBeNull();
      expect(useJourneyStore.getState().loadingSuggestions).toBe(false);

      // Select a gap
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap1);
      });

      // Check selectedGap is set and loadingSuggestions is true (because loadGapSuggestions is called)
      expect(useJourneyStore.getState().selectedGap).toEqual(gap1);
      expect(useJourneyStore.getState().loadingSuggestions).toBe(true);
      expect(useJourneyStore.getState().suggestionError).toBeNull(); // Should be reset

      // Fast-forward timers to resolve loadGapSuggestions
      act(() => {
        jest.runAllTimers();
      });

      // Check suggestions are loaded and loading is false
      expect(useJourneyStore.getState().loadingSuggestions).toBe(false);
      expect(useJourneyStore.getState().gapSuggestions.length).toBeGreaterThan(0);
    });

    test('deselects the gap if called with the currently selected gap', () => {
      // First, select a gap and let suggestions load
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap1);
        jest.runAllTimers(); // Complete suggestion loading
      });

      expect(useJourneyStore.getState().selectedGap).toEqual(gap1);
      expect(useJourneyStore.getState().gapSuggestions.length).toBeGreaterThan(0);

      // Now, call setSelectedGap with the same gap
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap1);
      });

      // Check gap is deselected and suggestions/loading state are cleared
      expect(useJourneyStore.getState().selectedGap).toBeNull();
      expect(useJourneyStore.getState().gapSuggestions).toEqual([]);
      expect(useJourneyStore.getState().loadingSuggestions).toBe(false);
      expect(useJourneyStore.getState().suggestionError).toBeNull();
    });

    test('selects a new gap if a different gap is already selected, and loads its suggestions', () => {
      // Select gap1 and let suggestions load
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap1);
        jest.runAllTimers();
      });
      const suggestionsForGap1 = useJourneyStore.getState().gapSuggestions;
      expect(useJourneyStore.getState().selectedGap).toEqual(gap1);
      expect(suggestionsForGap1.length).toBeGreaterThan(0);

      // Select gap2
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap2);
      });

      // Check selectedGap is gap2, loading is true
      expect(useJourneyStore.getState().selectedGap).toEqual(gap2);
      expect(useJourneyStore.getState().loadingSuggestions).toBe(true); // New suggestions loading
      expect(useJourneyStore.getState().gapSuggestions).toEqual([]); // Old suggestions cleared immediately

      // Fast-forward timers
      act(() => {
        jest.runAllTimers();
      });

      // Check new suggestions are loaded
      expect(useJourneyStore.getState().loadingSuggestions).toBe(false);
      const suggestionsForGap2 = useJourneyStore.getState().gapSuggestions;
      expect(suggestionsForGap2.length).toBeGreaterThan(0);
      expect(suggestionsForGap2).not.toEqual(suggestionsForGap1); // Ensure they are different
    });

    test('clears selectedGap and suggestions if called with null', () => {
      // Select a gap first
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap1);
        jest.runAllTimers();
      });
      expect(useJourneyStore.getState().selectedGap).toEqual(gap1);

      // Call with null
      act(() => {
        useJourneyStore.getState().setSelectedGap(null);
      });

      expect(useJourneyStore.getState().selectedGap).toBeNull();
      expect(useJourneyStore.getState().gapSuggestions).toEqual([]);
      expect(useJourneyStore.getState().loadingSuggestions).toBe(false);
      expect(useJourneyStore.getState().suggestionError).toBeNull();
    });
  });

  describe('loadGapSuggestions action (tested via setSelectedGap)', () => {
    test('sets loadingSuggestions to true, then false, and populates suggestions', () => {
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap1); // This calls loadGapSuggestions
      });
      expect(useJourneyStore.getState().loadingSuggestions).toBe(true);
      expect(useJourneyStore.getState().gapSuggestions).toEqual([]); // Cleared initially

      act(() => {
        jest.runAllTimers(); // Resolve the setTimeout in loadGapSuggestions
      });

      expect(useJourneyStore.getState().loadingSuggestions).toBe(false);
      expect(useJourneyStore.getState().gapSuggestions.length).toBeGreaterThan(0);
      // Example check for a suggestion detail (depends on mock logic in store)
      const duration = gap1.end_minute - gap1.start_minute;
      const expectedDescriptionPart = `Gap (${duration}m):`;
      expect(
        useJourneyStore.getState().gapSuggestions.some(s => s.description.includes(expectedDescriptionPart))
      ).toBe(true);
    });

    test('handles case where gap is null in loadGapSuggestions (e.g., if called directly)', () => {
        // Manually calling loadGapSuggestions with null, though setSelectedGap(null) is the typical path
        act(() => {
            useJourneyStore.getState().loadGapSuggestions(null);
        });
        expect(useJourneyStore.getState().loadingSuggestions).toBe(true); // Initially true

        act(() => {
            jest.runAllTimers();
        });
        expect(useJourneyStore.getState().loadingSuggestions).toBe(false);
        expect(useJourneyStore.getState().gapSuggestions).toEqual([]);
    });
  });

  // Test the getters
  describe('Getters', () => {
    test('selectedGapDetails returns the current selectedGap', () => {
      expect(useJourneyStore.getState().selectedGapDetails()).toBeNull();
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap1);
      });
      expect(useJourneyStore.getState().selectedGapDetails()).toEqual(gap1);
    });

    test('currentGapSuggestions returns the current gapSuggestions', () => {
      expect(useJourneyStore.getState().currentGapSuggestions()).toEqual([]);
      act(() => {
        useJourneyStore.getState().setSelectedGap(gap1);
        jest.runAllTimers();
      });
      expect(useJourneyStore.getState().currentGapSuggestions().length).toBeGreaterThan(0);
    });
  });

});
