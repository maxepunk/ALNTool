import { act } from '@testing-library/react';
import useJourneyStore from './journeyStore';

describe('journeyStore', () => {
  // Clear store state before each test
  beforeEach(() => {
    useJourneyStore.setState({
      activeCharacterId: null,
      selectedNode: null,
    });
  });

  describe('Initial state', () => {
    test('should have null activeCharacterId initially', () => {
      expect(useJourneyStore.getState().activeCharacterId).toBeNull();
    });

    test('should have null selectedNode initially', () => {
      expect(useJourneyStore.getState().selectedNode).toBeNull();
    });
  });

  describe('setActiveCharacterId', () => {
    test('should set activeCharacterId', () => {
      const characterId = 'char-alex-reeves';
      
      act(() => {
        useJourneyStore.getState().setActiveCharacterId(characterId);
      });

      expect(useJourneyStore.getState().activeCharacterId).toBe(characterId);
    });

    test('should clear selectedNode when setting new activeCharacterId', () => {
      // First set a selected node
      act(() => {
        useJourneyStore.setState({ selectedNode: { id: 'node-1' } });
      });

      expect(useJourneyStore.getState().selectedNode).toEqual({ id: 'node-1' });

      // Then set active character
      act(() => {
        useJourneyStore.getState().setActiveCharacterId('char-alex-reeves');
      });

      expect(useJourneyStore.getState().selectedNode).toBeNull();
    });

    test('should handle null characterId', () => {
      act(() => {
        useJourneyStore.getState().setActiveCharacterId(null);
      });

      expect(useJourneyStore.getState().activeCharacterId).toBeNull();
    });
  });

  describe('setSelectedNode', () => {
    test('should set selectedNode', () => {
      const node = { id: 'node-1', type: 'puzzle' };
      
      act(() => {
        useJourneyStore.getState().setSelectedNode(node);
      });

      expect(useJourneyStore.getState().selectedNode).toEqual(node);
    });

    test('should handle null node', () => {
      act(() => {
        useJourneyStore.getState().setSelectedNode(null);
      });

      expect(useJourneyStore.getState().selectedNode).toBeNull();
    });
  });

  describe('clearSelectedNode', () => {
    test('should clear selectedNode', () => {
      // First set a node
      act(() => {
        useJourneyStore.setState({ selectedNode: { id: 'node-1' } });
      });

      expect(useJourneyStore.getState().selectedNode).toEqual({ id: 'node-1' });

      // Then clear it
      act(() => {
        useJourneyStore.getState().clearSelectedNode();
      });

      expect(useJourneyStore.getState().selectedNode).toBeNull();
    });
  });

  describe('Store subscriptions', () => {
    test('should notify subscribers when activeCharacterId changes', () => {
      const listener = jest.fn();
      const unsubscribe = useJourneyStore.subscribe(listener);

      act(() => {
        useJourneyStore.getState().setActiveCharacterId('char-alex-reeves');
      });

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
    });

    test('should notify subscribers when selectedNode changes', () => {
      const listener = jest.fn();
      const unsubscribe = useJourneyStore.subscribe(listener);

      act(() => {
        useJourneyStore.getState().setSelectedNode({ id: 'node-1' });
      });

      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
    });
  });
});

// Note: Server state (journey data) is now managed by React Query hooks
// See src/hooks/useJourney.js for data fetching tests