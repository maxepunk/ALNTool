import useJourneyStore from './journeyStore';
import * as apiService from '../services/api'; // To mock getJourney

// Mock the api service
jest.mock('../services/api', () => ({
  getJourney: jest.fn(),
}));

// Helper to get a fresh state before each test or for specific scenarios
const getFreshState = () => useJourneyStore.getState();

describe('journeyStore', () => {
  let initialState;

  beforeEach(() => {
    // Reset store to initial state before each test
    useJourneyStore.setState(getFreshState(), true); // Replace state with initial state
    initialState = getFreshState(); // Capture it for reference in tests
    apiService.getJourney.mockClear(); // Clear mock call history
  });

  test('should have correct initial state', () => {
    expect(initialState.selectedTimeRange).toEqual([0, 90]);
    expect(initialState.selectedItemId).toBeNull();
    expect(initialState.breadcrumbs).toEqual([{ label: "Game", path: "/" }]);
    expect(initialState.activeGapDetails).toBeNull();
    expect(initialState.journeyData).toBeInstanceOf(Map);
    expect(initialState.journeyData.size).toBe(0);
    expect(initialState.gaps).toBeInstanceOf(Map);
    expect(initialState.gaps.size).toBe(0);
    expect(initialState.activeCharacterId).toBeNull();
    expect(initialState.loadingJourney).toBe(false);
  });

  describe('selectedTimeRange actions', () => {
    test('setSelectedTimeRange updates selectedTimeRange', () => {
      const newRange = [10, 50];
      initialState.setSelectedTimeRange(newRange);
      expect(getFreshState().selectedTimeRange).toEqual(newRange);
    });

    test('setSelectedTimeRange handles invalid range gracefully', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const originalRange = getFreshState().selectedTimeRange;

      initialState.setSelectedTimeRange([50, 10]); // Invalid: start > end
      expect(getFreshState().selectedTimeRange).toEqual(originalRange); // Should not change
      expect(consoleWarnSpy).toHaveBeenCalledWith('setSelectedTimeRange received an invalid range:', [50, 10]);

      initialState.setSelectedTimeRange([0]); // Invalid: not length 2
      expect(getFreshState().selectedTimeRange).toEqual(originalRange);
      expect(consoleWarnSpy).toHaveBeenCalledWith('setSelectedTimeRange received an invalid range:', [0]);

      consoleWarnSpy.mockRestore();
    });
  });

  describe('selectedItemId actions', () => {
    test('setSelectedItemId updates selectedItemId', () => {
      const newItemId = 'item-abc-123';
      initialState.setSelectedItemId(newItemId);
      expect(getFreshState().selectedItemId).toBe(newItemId);

      initialState.setSelectedItemId(null);
      expect(getFreshState().selectedItemId).toBeNull();
    });
  });

  describe('breadcrumb actions', () => {
    test('setBreadcrumbs updates breadcrumbs', () => {
      const newCrumbs = [{ label: 'Home', path: '/' }, { label: 'Chapter 1', path: '/ch1' }];
      initialState.setBreadcrumbs(newCrumbs);
      expect(getFreshState().breadcrumbs).toEqual(newCrumbs);
    });

    test('addBreadcrumb adds a crumb', () => {
      const newCrumb = { label: 'Detail', path: '/detail' };
      const expectedCrumbs = [...initialState.breadcrumbs, newCrumb];
      initialState.addBreadcrumb(newCrumb);
      expect(getFreshState().breadcrumbs).toEqual(expectedCrumbs);
    });

    test('removeBreadcrumbAfter removes crumbs correctly', () => {
      const crumbs = [
        { label: "Game", path: "/" },
        { label: "Act 1", path: "/act1" },
        { label: "Scene 5", path: "/act1/scene5" }
      ];
      initialState.setBreadcrumbs(crumbs);

      initialState.removeBreadcrumbAfter("/act1");
      expect(getFreshState().breadcrumbs).toEqual([
        { label: "Game", path: "/" },
        { label: "Act 1", path: "/act1" },
      ]);

      // Test removing up to root
      initialState.removeBreadcrumbAfter("/");
      expect(getFreshState().breadcrumbs).toEqual([{ label: "Game", path: "/" }]);
    });
     test('removeBreadcrumbAfter resets to root if path not found', () => {
      const crumbs = [ { label: "Game", path: "/" }, { label: "Act 1", path: "/act1" }];
      initialState.setBreadcrumbs(crumbs);
      initialState.removeBreadcrumbAfter("/unknown");
      expect(getFreshState().breadcrumbs).toEqual([{ label: "Game", path: "/" }]);
    });
  });

  describe('activeGapDetails actions', () => {
    test('setActiveGapDetails updates activeGapDetails', () => {
      const gap = { id: 'gap-1', description: 'A test gap' };
      initialState.setActiveGapDetails(gap);
      expect(getFreshState().activeGapDetails).toEqual(gap);

      initialState.setActiveGapDetails(null);
      expect(getFreshState().activeGapDetails).toBeNull();
    });
  });

  describe('journey loading actions (loadJourney, setActiveCharacterId)', () => {
    const mockCharacterId = 'charTest';
    const mockJourneyData = {
      id: mockCharacterId,
      name: 'Test Character',
      segments: [{ time: '0-10', activity: 'Testing' }],
      gaps: [{ id: 'gap-test-1', description: 'A test gap in journey' }],
    };

    beforeEach(() => {
      // Setup mock return value for getJourney for these tests
      apiService.getJourney.mockResolvedValue(mockJourneyData);
    });

    test('setActiveCharacterId updates activeCharacterId and triggers loadJourney', async () => {
      // Spy on loadJourney to ensure it's called by setActiveCharacterId
      const loadJourneySpy = jest.spyOn(useJourneyStore.getState(), 'loadJourney');

      initialState.setActiveCharacterId(mockCharacterId);

      expect(getFreshState().activeCharacterId).toBe(mockCharacterId);
      expect(getFreshState().loadingJourney).toBe(true); // Set by setActiveCharacterId
      expect(loadJourneySpy).toHaveBeenCalledWith(mockCharacterId);

      // Wait for loadJourney to complete
      // Need to use a timeout or a more sophisticated way to await Zustand state changes if depending on async updates
      // For now, we'll check the state after the promise that loadJourney returns would resolve
      // (though loadJourney itself in the store doesn't return a promise to the caller of setActiveCharacterId)

      // This part tests the eventual outcome of loadJourney
      await new Promise(process.nextTick); // Allow microtasks (like promises) to settle

      expect(getFreshState().loadingJourney).toBe(false); // Reset by loadJourney
      expect(apiService.getJourney).toHaveBeenCalledWith(mockCharacterId);
      expect(getFreshState().journeyData.get(mockCharacterId)).toEqual(mockJourneyData);
      expect(getFreshState().gaps.get(mockCharacterId)).toEqual(mockJourneyData.gaps);

      loadJourneySpy.mockRestore();
    });

    test('loadJourney updates journeyData, gaps, and loading state', async () => {
      expect(getFreshState().loadingJourney).toBe(false);

      // Directly call loadJourney
      // Store the promise returned by the mocked getJourney if needed, but here we await the action's effect
      await initialState.loadJourney(mockCharacterId);

      expect(getFreshState().loadingJourney).toBe(false);
      expect(apiService.getJourney).toHaveBeenCalledWith(mockCharacterId);
      expect(getFreshState().journeyData.get(mockCharacterId)).toEqual(mockJourneyData);
      expect(getFreshState().gaps.get(mockCharacterId)).toEqual(mockJourneyData.gaps);
    });

    test('loadJourney handles API failure gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      apiService.getJourney.mockRejectedValueOnce(new Error('API Error'));

      await initialState.loadJourney('charFail');

      expect(getFreshState().loadingJourney).toBe(false);
      expect(getFreshState().journeyData.has('charFail')).toBe(false);
      expect(getFreshState().gaps.has('charFail')).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[journeyStore] Failed to load journey for charFail:', expect.any(Error));

      consoleErrorSpy.mockRestore();
    });
     test('loadJourney with no characterId does not attempt to load', async () => {
      await initialState.loadJourney(null);
      expect(getFreshState().loadingJourney).toBe(false);
      expect(apiService.getJourney).not.toHaveBeenCalled();
    });
  });
});
