import { act } from '@testing-library/react';
import useJourneyStore from './journeyStore';
import api from '../services/api';

// Mock the API
jest.mock('../services/api', () => {
  const mockApi = {
    getJourneyByCharacterId: jest.fn(),
  };
  return {
    __esModule: true,
    default: mockApi,
    api: mockApi,
  };
});

describe('journeyStore', () => {
  // Clear store state before each test
  beforeEach(() => {
    useJourneyStore.setState({
      activeCharacterId: null,
      journeyData: new Map(),
      loadingJourneyCharacterId: null,
      error: null,
      selectedNode: null,
    });
    jest.clearAllMocks();
  });

  describe('Initial state', () => {
    test('should have null activeCharacterId initially', () => {
      expect(useJourneyStore.getState().activeCharacterId).toBeNull();
    });

    test('should have empty journeyData map initially', () => {
      expect(useJourneyStore.getState().journeyData.size).toBe(0);
    });

    test('should have null loadingJourneyCharacterId initially', () => {
      expect(useJourneyStore.getState().loadingJourneyCharacterId).toBeNull();
    });

    test('should have null error initially', () => {
      expect(useJourneyStore.getState().error).toBeNull();
    });

    test('should have null selectedNode initially', () => {
      expect(useJourneyStore.getState().selectedNode).toBeNull();
    });
  });

  describe('setActiveCharacterId action', () => {
    test('updates activeCharacterId and clears error and selectedNode', () => {
      const characterId = 'char-123';
      
      // Set some initial state
      useJourneyStore.setState({ 
        error: 'Some error',
        selectedNode: { id: 'node-1' }
      });

      act(() => {
        useJourneyStore.getState().setActiveCharacterId(characterId);
      });

      expect(useJourneyStore.getState().activeCharacterId).toBe(characterId);
      expect(useJourneyStore.getState().error).toBeNull();
      expect(useJourneyStore.getState().selectedNode).toBeNull();
    });
  });

  describe('setSelectedNode action', () => {
    test('updates selectedNode', () => {
      const node = { id: 'node-1', type: 'activity', label: 'Test Node' };

      act(() => {
        useJourneyStore.getState().setSelectedNode(node);
      });

      expect(useJourneyStore.getState().selectedNode).toEqual(node);
    });
  });

  describe('loadJourney action', () => {
    const mockCharacterId = 'char-123';
    const mockJourneyData = {
      character_info: { id: mockCharacterId, name: 'Test Character' },
      graph: {
        nodes: [{ id: 'node-1' }],
        edges: [],
      },
    };

    test('successfully loads journey data', async () => {
      api.getJourneyByCharacterId.mockResolvedValueOnce(mockJourneyData);

      await act(async () => {
        await useJourneyStore.getState().loadJourney(mockCharacterId);
      });

      const state = useJourneyStore.getState();
      expect(state.journeyData.has(mockCharacterId)).toBe(true);
      expect(state.journeyData.get(mockCharacterId)).toEqual(mockJourneyData);
      expect(state.loadingJourneyCharacterId).toBeNull();
      expect(state.error).toBeNull();
    });

    test('does not reload if journey data already exists', async () => {
      // Pre-populate journey data
      useJourneyStore.setState({
        journeyData: new Map([[mockCharacterId, mockJourneyData]]),
      });

      await act(async () => {
        await useJourneyStore.getState().loadJourney(mockCharacterId);
      });

      expect(api.getJourneyByCharacterId).not.toHaveBeenCalled();
    });

    test('does not make duplicate requests while loading', async () => {
      api.getJourneyByCharacterId.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockJourneyData), 100))
      );

      // Start first load
      act(() => {
        useJourneyStore.getState().loadJourney(mockCharacterId);
      });

      // Try to load again while first is in progress
      act(() => {
        useJourneyStore.getState().loadJourney(mockCharacterId);
      });

      // Only one API call should be made
      expect(api.getJourneyByCharacterId).toHaveBeenCalledTimes(1);
    });

    test('handles errors properly', async () => {
      const errorMessage = 'Failed to fetch journey';
      api.getJourneyByCharacterId.mockRejectedValueOnce(new Error(errorMessage));

      await act(async () => {
        await useJourneyStore.getState().loadJourney(mockCharacterId);
      });

      const state = useJourneyStore.getState();
      expect(state.error).toBe(errorMessage);
      expect(state.loadingJourneyCharacterId).toBeNull();
      expect(state.journeyData.has(mockCharacterId)).toBe(false);
    });

    test('does nothing if characterId is null', async () => {
      await act(async () => {
        await useJourneyStore.getState().loadJourney(null);
      });

      expect(api.getJourneyByCharacterId).not.toHaveBeenCalled();
    });
  });

  describe('clearJourneyData action', () => {
    test('removes specific journey data and clears selectedNode', () => {
      const charId1 = 'char-1';
      const charId2 = 'char-2';
      const journey1 = { character_info: { id: charId1 } };
      const journey2 = { character_info: { id: charId2 } };

      useJourneyStore.setState({
        journeyData: new Map([
          [charId1, journey1],
          [charId2, journey2],
        ]),
        selectedNode: { id: 'node-1' },
      });

      act(() => {
        useJourneyStore.getState().clearJourneyData(charId1);
      });

      const state = useJourneyStore.getState();
      expect(state.journeyData.has(charId1)).toBe(false);
      expect(state.journeyData.has(charId2)).toBe(true);
      expect(state.selectedNode).toBeNull();
    });
  });

  describe('clearAllJourneyData action', () => {
    test('clears all journey data and resets state', () => {
      useJourneyStore.setState({
        journeyData: new Map([
          ['char-1', { character_info: { id: 'char-1' } }],
          ['char-2', { character_info: { id: 'char-2' } }],
        ]),
        activeCharacterId: 'char-1',
        error: 'Some error',
        selectedNode: { id: 'node-1' },
      });

      act(() => {
        useJourneyStore.getState().clearAllJourneyData();
      });

      const state = useJourneyStore.getState();
      expect(state.journeyData.size).toBe(0);
      expect(state.activeCharacterId).toBeNull();
      expect(state.error).toBeNull();
      expect(state.selectedNode).toBeNull();
    });
  });

  describe('activeJourney getter', () => {
    test('returns journey data for active character', () => {
      const charId = 'char-1';
      const journeyData = { character_info: { id: charId, name: 'Test' } };

      useJourneyStore.setState({
        activeCharacterId: charId,
        journeyData: new Map([[charId, journeyData]]),
      });

      const activeJourney = useJourneyStore.getState().activeJourney();
      expect(activeJourney).toEqual(journeyData);
    });

    test('returns null if no active character', () => {
      useJourneyStore.setState({
        activeCharacterId: null,
        journeyData: new Map([['char-1', { character_info: { id: 'char-1' } }]]),
      });

      const activeJourney = useJourneyStore.getState().activeJourney();
      expect(activeJourney).toBeNull();
    });

    test('returns null if active character has no journey data', () => {
      useJourneyStore.setState({
        activeCharacterId: 'char-1',
        journeyData: new Map(),
      });

      const activeJourney = useJourneyStore.getState().activeJourney();
      expect(activeJourney).toBeNull();
    });
  });
});