/**
 * Tests for the enhanced journey intelligence store
 * Following TDD principles - tests written before implementation
 */

import { renderHook, act } from '@testing-library/react';
import { useJourneyIntelligenceStore } from '../journeyIntelligenceStore';
import { createMockEntity } from '../../test-utils/intelligence-test-utils';
import { setupTestCleanup } from '../../test-utils/cleanup-utils';

// Setup automatic cleanup
setupTestCleanup();

describe('Journey Intelligence Store', () => {
  // Reset store before each test
  beforeEach(() => {
    useJourneyIntelligenceStore.setState({
      // Selection state
      selectedEntity: null,
      selectionHistory: [],
      
      // View state
      viewMode: 'overview',
      activeIntelligence: ['story', 'social'],
      
      // UI state
      graphConfig: {
        zoom: 1,
        center: { x: 0, y: 0 },
        nodeVisibility: {},
        edgeVisibility: {}
      },
      
      // Performance state
      performanceMode: 'auto',
      visibleNodeCount: 0
    });
  });

  describe('Selection Management', () => {
    it('should select entity and update view mode', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      const mockCharacter = createMockEntity('character');
      
      act(() => {
        result.current.selectEntity(mockCharacter);
      });
      
      expect(result.current.selectedEntity).toEqual(mockCharacter);
      expect(result.current.viewMode).toBe('entity-focus');
    });

    it('should maintain selection history with max 5 entries', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      // Select 7 different entities
      const entities = Array.from({ length: 7 }, (_, i) => 
        createMockEntity('character', { id: `char-${i}` })
      );
      
      entities.forEach(entity => {
        act(() => {
          result.current.selectEntity(entity);
        });
      });
      
      // Should only keep last 5 in history (excluding current)
      expect(result.current.selectionHistory).toHaveLength(5);
      expect(result.current.selectionHistory[0].id).toBe('char-1');
      expect(result.current.selectionHistory[4].id).toBe('char-5');
      expect(result.current.selectedEntity.id).toBe('char-6');
    });

    it('should handle deselection correctly', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      const mockEntity = createMockEntity('element');
      
      // Select then deselect
      act(() => {
        result.current.selectEntity(mockEntity);
      });
      
      act(() => {
        result.current.selectEntity(null);
      });
      
      expect(result.current.selectedEntity).toBeNull();
      expect(result.current.viewMode).toBe('overview');
      expect(result.current.selectionHistory).toContainEqual(mockEntity);
    });

    it('should navigate back through history', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      const entities = [
        createMockEntity('character'),
        createMockEntity('element'),
        createMockEntity('puzzle')
      ];
      
      // Select all entities
      entities.forEach(entity => {
        act(() => {
          result.current.selectEntity(entity);
        });
      });
      
      // Navigate back
      act(() => {
        result.current.navigateBack();
      });
      
      expect(result.current.selectedEntity).toEqual(entities[1]);
      expect(result.current.selectionHistory).toHaveLength(1);
    });
  });

  describe('Intelligence Layer Management', () => {
    it('should toggle intelligence layers on and off', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      // Initially has story and social
      expect(result.current.activeIntelligence).toEqual(['story', 'social']);
      
      // Toggle off story
      act(() => {
        result.current.toggleIntelligence('story');
      });
      
      expect(result.current.activeIntelligence).toEqual(['social']);
      
      // Toggle on economic
      act(() => {
        result.current.toggleIntelligence('economic');
      });
      
      expect(result.current.activeIntelligence).toEqual(['social', 'economic']);
    });

    it('should enforce maximum 3 active intelligence layers', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      // Start with 2, add 2 more
      act(() => {
        result.current.toggleIntelligence('economic');
        result.current.toggleIntelligence('production');
      });
      
      // Should only have 3 active (story was removed as oldest)
      expect(result.current.activeIntelligence).toHaveLength(3);
      expect(result.current.activeIntelligence).toEqual(['social', 'economic', 'production']);
    });

    it('should preserve layer state across entity selections', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      // Set custom layers
      act(() => {
        result.current.toggleIntelligence('story'); // off
        result.current.toggleIntelligence('production'); // on
      });
      
      const activeLayers = result.current.activeIntelligence;
      
      // Select entity
      act(() => {
        result.current.selectEntity(createMockEntity('character'));
      });
      
      // Layers should remain the same
      expect(result.current.activeIntelligence).toEqual(activeLayers);
    });

    it('should clear all intelligence layers', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      act(() => {
        result.current.clearIntelligence();
      });
      
      expect(result.current.activeIntelligence).toEqual([]);
    });
  });

  describe('Performance Mode Management', () => {
    it('should auto-switch to performance mode at 40 nodes', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      act(() => {
        result.current.updateNodeCount(39);
      });
      
      expect(result.current.performanceMode).toBe('auto');
      
      act(() => {
        result.current.updateNodeCount(40);
      });
      
      expect(result.current.performanceMode).toBe('performance');
    });

    it('should track visible node count accurately', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      act(() => {
        result.current.updateNodeCount(25);
      });
      
      expect(result.current.visibleNodeCount).toBe(25);
    });

    it('should preserve user override of performance mode', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      // User sets quality mode
      act(() => {
        result.current.setPerformanceMode('quality');
      });
      
      // Update node count past threshold
      act(() => {
        result.current.updateNodeCount(45);
      });
      
      // Should stay in quality mode (user override)
      expect(result.current.performanceMode).toBe('quality');
    });

    it('should switch back to auto mode when requested', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      act(() => {
        result.current.setPerformanceMode('quality');
        result.current.setPerformanceMode('auto');
        result.current.updateNodeCount(45);
      });
      
      expect(result.current.performanceMode).toBe('performance');
    });
  });

  describe('View Mode Transitions', () => {
    it('should transition through view modes correctly', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      // Start in overview
      expect(result.current.viewMode).toBe('overview');
      
      // Select entity → entity-focus
      act(() => {
        result.current.selectEntity(createMockEntity('character'));
      });
      expect(result.current.viewMode).toBe('entity-focus');
      
      // Activate intelligence deep dive
      act(() => {
        result.current.setViewMode('intelligence-deep-dive');
      });
      expect(result.current.viewMode).toBe('intelligence-deep-dive');
      
      // Deselect → back to overview
      act(() => {
        result.current.selectEntity(null);
      });
      expect(result.current.viewMode).toBe('overview');
    });

    it('should update graph config on zoom and pan', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      act(() => {
        result.current.updateGraphConfig({
          zoom: 1.5,
          center: { x: 100, y: 200 }
        });
      });
      
      expect(result.current.graphConfig.zoom).toBe(1.5);
      expect(result.current.graphConfig.center).toEqual({ x: 100, y: 200 });
    });

    it('should manage node and edge visibility', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      
      act(() => {
        result.current.setNodeVisibility('node-1', false);
        result.current.setEdgeVisibility('edge-1', false);
      });
      
      expect(result.current.graphConfig.nodeVisibility['node-1']).toBe(false);
      expect(result.current.graphConfig.edgeVisibility['edge-1']).toBe(false);
    });
  });

  describe('Subscriptions and Side Effects', () => {
    it('should notify subscribers on selection change', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      const subscriber = jest.fn();
      
      // Subscribe to selection changes
      const unsubscribe = useJourneyIntelligenceStore.subscribe(
        state => state.selectedEntity,
        subscriber
      );
      
      act(() => {
        result.current.selectEntity(createMockEntity('character'));
      });
      
      expect(subscriber).toHaveBeenCalled();
      
      unsubscribe();
    });

    it('should handle multiple state updates efficiently', () => {
      const { result } = renderHook(() => useJourneyIntelligenceStore());
      const mockEntity = createMockEntity('character');
      
      act(() => {
        // Multiple updates in one act
        result.current.selectEntity(mockEntity);
        result.current.toggleIntelligence('economic');
        result.current.updateNodeCount(30);
      });
      
      // Verify all updates were applied
      expect(result.current.selectedEntity).toEqual(mockEntity);
      expect(result.current.activeIntelligence).toContain('economic');
      expect(result.current.visibleNodeCount).toBe(30);
    });
  });
});