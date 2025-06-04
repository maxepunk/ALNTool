import '@testing-library/jest-dom';

// This is the filtering logic extracted from Elements.jsx's useMemo hook for testing.
// In a real scenario, you might refactor Elements.jsx to export this function,
// or use @testing-library/react to test the component more directly.
const applyClientSideFilters = (
  elements,
  elementType,
  status,
  firstAvailable, // This is an existing server-side filter in the component, but we can test its client-side equivalent if needed
  actFocusFilter,
  selectedThemes,
  selectedMemorySet
) => {
  if (!elements) return [];
  let currentElements = [...elements];

  // Simulate existing server-side filters (if they were also client-side or for comprehensive testing)
  // For this test, we'll assume `elements` is the array *after* server-side filters have been applied
  // or that these filters are also being tested client-side.
  if (elementType !== 'All Types') {
    currentElements = currentElements.filter(el => el.properties?.basicType === elementType);
  }
  if (status !== 'All Statuses') {
    currentElements = currentElements.filter(el => el.properties?.status === status);
  }
  if (firstAvailable !== 'All Acts') { // Assuming 'firstAvailable' from Notion is on properties
    currentElements = currentElements.filter(el => el.properties?.firstAvailable === firstAvailable);
  }

  // New client-side filters
  if (actFocusFilter !== 'All Acts') {
    currentElements = currentElements.filter(el => el.properties?.actFocus === actFocusFilter);
  }

  const activeThemeFilters = Object.entries(selectedThemes || {})
    .filter(([,isSelected]) => isSelected)
    .map(([themeName]) => themeName);

  if (activeThemeFilters.length > 0) {
    currentElements = currentElements.filter(el =>
      el.properties?.themes?.some(theme => activeThemeFilters.includes(theme))
    );
  }

  if (selectedMemorySet !== 'All Sets') {
    currentElements = currentElements.filter(el =>
      el.properties?.memorySets?.includes(selectedMemorySet)
    );
  }
  return currentElements;
};

const mockElements = [
  {
    id: 'el1',
    properties: {
      name: 'Element 1', basicType: 'Prop', status: 'Done', firstAvailable: 'Act 1',
      actFocus: 'Act 1', themes: ['ThemeA', 'ThemeB'], memorySets: ['SetX']
    }
  },
  {
    id: 'el2',
    properties: {
      name: 'Element 2', basicType: 'Memory Token Video', status: 'In development', firstAvailable: 'Act 2',
      actFocus: 'Act 2', themes: ['ThemeB'], memorySets: ['SetY']
    }
  },
  {
    id: 'el3',
    properties: {
      name: 'Element 3', basicType: 'Prop', status: 'Done', firstAvailable: 'Act 1',
      actFocus: 'Act 1', themes: ['ThemeA'], memorySets: ['SetX', 'SetZ']
    }
  },
  {
    id: 'el4',
    properties: {
      name: 'Element 4', basicType: 'Set Dressing', status: 'To Design', firstAvailable: 'Act 3',
      actFocus: 'Act 3', themes: ['ThemeC'], memorySets: [] // No memory sets
    }
  },
  {
    id: 'el5',
    properties: {
      name: 'Element 5', basicType: 'Prop', status: 'Done', firstAvailable: 'Act 1',
      actFocus: 'Act 1', themes: ['ThemeA'], memorySets: ['SetZ']
      // No themes property
    }
  }
];

describe('Elements.jsx Client-Side Filtering Logic', () => {
  it('should return all elements if no filters are applied (or "All" selected)', () => {
    const result = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'All Acts', {}, 'All Sets');
    expect(result.length).toBe(5);
  });

  it('should filter by Act Focus', () => {
    const result = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'Act 1', {}, 'All Sets');
    expect(result.length).toBe(3);
    expect(result.every(el => el.properties.actFocus === 'Act 1')).toBe(true);
  });

  it('should filter by a single selected theme', () => {
    const result = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'All Acts', { 'ThemeB': true }, 'All Sets');
    expect(result.length).toBe(2); // el1, el2
    expect(result.find(el => el.id === 'el1')).toBeDefined();
    expect(result.find(el => el.id === 'el2')).toBeDefined();
  });

  it('should filter by multiple selected themes (OR logic)', () => {
    const result = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'All Acts', { 'ThemeA': true, 'ThemeC': true }, 'All Sets');
    expect(result.length).toBe(4); // el1, el3, el4, el5
  });

  it('should return all elements if all themes are selected (or selectedThemes is empty/all false, effectively)', () => {
    // Current logic: if activeThemeFilters.length is 0, it doesn't filter by theme.
    const resultAllTrue = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'All Acts', { 'ThemeA': true, 'ThemeB': true, 'ThemeC': true }, 'All Sets');
    expect(resultAllTrue.length).toBe(mockElements.length);

    const resultEmpty = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'All Acts', {}, 'All Sets');
    expect(resultEmpty.length).toBe(mockElements.length);

    const resultAllFalse = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'All Acts', { 'ThemeA': false }, 'All Sets');
    expect(resultAllFalse.length).toBe(mockElements.length);
  });


  it('should filter by Memory Set', () => {
    const result = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'All Acts', {}, 'SetX');
    expect(result.length).toBe(2); // el1, el3
    expect(result.every(el => el.properties.memorySets.includes('SetX'))).toBe(true);
  });

  it('should combine Act Focus and Theme filters', () => {
    const result = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'Act 1', { 'ThemeA': true }, 'All Sets');
    expect(result.length).toBe(3); // el1, el3, el5 (all are Act 1 and have ThemeA)
    expect(result.every(el => el.properties.actFocus === 'Act 1' && el.properties.themes.includes('ThemeA'))).toBe(true);
  });

  it('should combine Act Focus, Theme, and Memory Set filters', () => {
    const result = applyClientSideFilters(mockElements, 'All Types', 'All Statuses', 'All Acts', 'Act 1', { 'ThemeA': true }, 'SetX');
    expect(result.length).toBe(2); // el1, el3
    expect(result.every(el =>
      el.properties.actFocus === 'Act 1' &&
      el.properties.themes.includes('ThemeA') &&
      el.properties.memorySets.includes('SetX')
    )).toBe(true);
  });

  it('should combine with existing elementType filter', () => {
    const result = applyClientSideFilters(mockElements, 'Prop', 'All Statuses', 'All Acts', 'Act 1', { 'ThemeA': true }, 'All Sets');
    expect(result.length).toBe(3); // el1, el3, el5
    expect(result.every(el => el.properties.basicType === 'Prop' && el.properties.actFocus === 'Act 1' && el.properties.themes.includes('ThemeA'))).toBe(true);
  });

  it('should return empty array if no elements match combined filters', () => {
    const result = applyClientSideFilters(mockElements, 'Memory Token Video', 'All Statuses', 'All Acts', 'Act 3', { 'ThemeA': true }, 'SetX');
    expect(result.length).toBe(0);
  });
   it('should handle elements with missing theme or memorySet properties gracefully when filtering', () => {
    const elementsWithMissing = [
      ...mockElements,
      { id: 'el6', properties: { name: 'Element 6', basicType: 'Prop', actFocus: 'Act 1' /* no themes, no memorySets */ } }
    ];
    let result = applyClientSideFilters(elementsWithMissing, 'All Types', 'All Statuses', 'All Acts', 'All Acts', { 'ThemeA': true }, 'All Sets');
    // el6 should be filtered out as it doesn't have ThemeA
    expect(result.find(el => el.id === 'el6')).toBeUndefined();
    expect(result.length).toBe(3); // el1, el3, el5

    result = applyClientSideFilters(elementsWithMissing, 'All Types', 'All Statuses', 'All Acts', 'All Acts', {}, 'SetX');
    // el6 should be filtered out
    expect(result.find(el => el.id === 'el6')).toBeUndefined();
    expect(result.length).toBe(2); // el1, el3
  });
});
