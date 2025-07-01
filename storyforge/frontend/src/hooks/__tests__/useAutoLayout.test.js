import { renderHook } from '@testing-library/react';
import useAutoLayout from '../useAutoLayout';

describe('useAutoLayout', () => {
  test('creates timeline edges when no edges provided', () => {
    const nodes = [
      {
        id: 'event-1',
        type: 'loreNode',
        position: { x: 0, y: 0 },
        data: { 
          label: 'Event 1',
          date: '2020-01-22'
        }
      },
      {
        id: 'event-2', 
        type: 'loreNode',
        position: { x: 0, y: 0 },
        data: {
          label: 'Event 2', 
          date: '2020-02-15'
        }
      },
      {
        id: 'event-3',
        type: 'loreNode', 
        position: { x: 0, y: 0 },
        data: {
          label: 'Event 3',
          date: '2020-03-10'
        }
      }
    ];
    const edges = []; // No edges!

    const { result } = renderHook(() => useAutoLayout(nodes, edges));
    
    // Should return nodes with different positions
    const layoutedNodes = result.current;
    
    // Check nodes have been repositioned
    expect(layoutedNodes.length).toBe(3);
    
    // All nodes should NOT be at 0,0
    const allAtOrigin = layoutedNodes.every(
      node => node.position.x === 0 && node.position.y === 0
    );
    expect(allAtOrigin).toBe(false);
    
    // Nodes should be arranged vertically (different y positions)
    const yPositions = layoutedNodes.map(n => n.position.y);
    const uniqueYPositions = new Set(yPositions);
    expect(uniqueYPositions.size).toBeGreaterThan(1);
  });

  test('preserves original node data after layout', () => {
    const nodes = [
      {
        id: 'node-1',
        type: 'activityNode',
        position: { x: 0, y: 0 },
        data: { 
          label: 'Test Activity',
          customField: 'preserved'
        }
      }
    ];
    
    const { result } = renderHook(() => useAutoLayout(nodes, []));
    const layoutedNodes = result.current;
    
    // Original data should be preserved
    expect(layoutedNodes[0].data.customField).toBe('preserved');
    expect(layoutedNodes[0].type).toBe('activityNode');
  });
});