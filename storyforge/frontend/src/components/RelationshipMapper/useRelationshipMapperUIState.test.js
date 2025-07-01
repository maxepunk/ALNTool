import { renderHook, act } from '@testing-library/react';
import useRelationshipMapperUIState from './useRelationshipMapperUIState';

describe('useRelationshipMapperUIState', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useRelationshipMapperUIState({}));
    expect(result.current.viewMode).toBe('default');
    expect(result.current.depth).toBe(2);
    expect(result.current.isFullScreen).toBe(false);
    expect(result.current.nodeFilters.Character).toBe(true);
    expect(result.current.edgeFilters.dependency).toBe(true);
    expect(result.current.showLowSignal).toBe(true);
    expect(result.current.snackbar.open).toBe(false);
  });

  it('toggles node filter', () => {
    const { result } = renderHook(() => useRelationshipMapperUIState({}));
    act(() => {
      result.current.toggleNodeFilter('Character');
    });
    expect(result.current.nodeFilters.Character).toBe(false);
  });

  it('toggles edge filter', () => {
    const { result } = renderHook(() => useRelationshipMapperUIState({}));
    act(() => {
      result.current.toggleEdgeFilter('dependency');
    });
    expect(result.current.edgeFilters.dependency).toBe(false);
  });

  it('changes view mode and closes filter menu', () => {
    const { result } = renderHook(() => useRelationshipMapperUIState({}));
    act(() => {
      result.current.setFilterMenuAnchor({ currentTarget: 'anchor' });
      result.current.changeViewMode('character-focus');
    });
    expect(result.current.viewMode).toBe('character-focus');
    expect(result.current.filterMenuAnchor).toBe(null);
  });

  it('toggles fullscreen', () => {
    const { result } = renderHook(() => useRelationshipMapperUIState({}));
    act(() => {
      result.current.toggleFullScreen();
    });
    expect(result.current.isFullScreen).toBe(true);
  });

  it('opens and closes filter menu', () => {
    const { result } = renderHook(() => useRelationshipMapperUIState({}));
    act(() => {
      result.current.openFilterMenu({ currentTarget: 'anchor' });
    });
    expect(result.current.filterMenuAnchor).toBe('anchor');
    act(() => {
      result.current.closeFilterMenu();
    });
    expect(result.current.filterMenuAnchor).toBe(null);
  });

  it('toggles low signal', () => {
    const { result } = renderHook(() => useRelationshipMapperUIState({}));
    // Initial state is true
    expect(result.current.showLowSignal).toBe(true);
    act(() => {
      result.current.toggleLowSignal();
    });
    // After toggle should be false
    expect(result.current.showLowSignal).toBe(false);
  });

  it('handles snackbar open/close', () => {
    const { result } = renderHook(() => useRelationshipMapperUIState({}));
    act(() => {
      result.current.setSnackbar({ open: true, message: 'Test', severity: 'info' });
    });
    expect(result.current.snackbar.open).toBe(true);
    act(() => {
      result.current.handleCloseSnackbar();
    });
    expect(result.current.snackbar.open).toBe(false);
  });
}); 