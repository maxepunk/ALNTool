import '@testing-library/jest-dom';

const KNOWN_RESOLUTION_PATHS = ["Black Market", "Detective", "Third Path"];
const UNASSIGNED_PATH = "Unassigned";

// Replicated aggregation logic from ResolutionPathAnalyzerPage.jsx for testing
const aggregatePathData = (characters, puzzles, elements) => {
  const aggregator = {};
  [...KNOWN_RESOLUTION_PATHS, UNASSIGNED_PATH].forEach(path => {
    aggregator[path] = { count: 0, characters: [], puzzles: [], elements: [] };
  });

  (characters || []).forEach(char => {
    const paths = char.resolutionPaths || [];
    if (paths.length === 0) {
      aggregator[UNASSIGNED_PATH].characters.push(char);
      aggregator[UNASSIGNED_PATH].count++;
    } else {
      paths.forEach(path => {
        if (aggregator[path]) {
          aggregator[path].characters.push(char);
          aggregator[path].count++;
        } else {
          // console.warn(`Unknown path "${path}" found in character ${char.id}`);
          // For testing, we might want to ensure only known paths are processed,
          // or have a specific test for how unknown paths are handled if they shouldn't be ignored.
          // Current component logic ignores unknown paths silently.
        }
      });
    }
  });

  (puzzles || []).forEach(puzzle => {
    const paths = puzzle.resolutionPaths || [];
    if (paths.length === 0) {
      aggregator[UNASSIGNED_PATH].puzzles.push(puzzle);
      aggregator[UNASSIGNED_PATH].count++;
    } else {
      paths.forEach(path => {
        if (aggregator[path]) {
          aggregator[path].puzzles.push(puzzle);
          aggregator[path].count++;
        }
      });
    }
  });

  (elements || []).forEach(el => {
    // Elements have resolutionPaths nested under properties in the component
    const paths = el.properties?.resolutionPaths || [];
    if (paths.length === 0) {
      aggregator[UNASSIGNED_PATH].elements.push(el);
      aggregator[UNASSIGNED_PATH].count++;
    } else {
      paths.forEach(path => {
        if (aggregator[path]) {
          aggregator[path].elements.push(el);
          aggregator[path].count++;
        }
      });
    }
  });
  return aggregator;
};

describe('ResolutionPathAnalyzerPage Data Aggregation', () => {
  const mockCharacters = [
    { id: 'c1', name: 'Character 1', resolutionPaths: ['Detective'] },
    { id: 'c2', name: 'Character 2', resolutionPaths: ['Black Market', 'Third Path'] },
    { id: 'c3', name: 'Character 3', resolutionPaths: [] }, // Unassigned
    { id: 'c4', name: 'Character 4', resolutionPaths: ['Detective'] },
    { id: 'c5', name: 'Character 5', resolutionPaths: null }, // Unassigned (null paths)
  ];
  const mockPuzzles = [
    { id: 'p1', puzzle: 'Puzzle 1', resolutionPaths: ['Black Market'] },
    { id: 'p2', puzzle: 'Puzzle 2', resolutionPaths: ['Detective', 'Third Path'] },
    { id: 'p3', puzzle: 'Puzzle 3', resolutionPaths: undefined }, // Unassigned (undefined paths)
  ];
  const mockElements = [
    // Elements have resolutionPaths under properties
    { id: 'e1', properties: { name: 'Element 1', resolutionPaths: ['Third Path'] } },
    { id: 'e2', properties: { name: 'Element 2', resolutionPaths: ['Detective'] } },
    { id: 'e3', properties: { name: 'Element 3', resolutionPaths: [] } }, // Unassigned
  ];

  it('should return empty structure for empty inputs', () => {
    const result = aggregatePathData([], [], []);
    KNOWN_RESOLUTION_PATHS.forEach(path => {
      expect(result[path].count).toBe(0);
      expect(result[path].characters.length).toBe(0);
      expect(result[path].puzzles.length).toBe(0);
      expect(result[path].elements.length).toBe(0);
    });
    expect(result[UNASSIGNED_PATH].count).toBe(0);
  });

  it('should correctly aggregate items into their respective paths', () => {
    const result = aggregatePathData(mockCharacters, mockPuzzles, mockElements);

    // Detective Path
    expect(result['Detective'].count).toBe(4); // c1, c2(also BM,TP), p2(also TP), e2
    expect(result['Detective'].characters.map(c => c.id).sort()).toEqual(['c1', 'c4'].sort()); // c2 is not solely Detective for characters list here based on component's current logic
    expect(result['Detective'].puzzles.map(p => p.id).sort()).toEqual(['p2'].sort());
    expect(result['Detective'].elements.map(e => e.id).sort()).toEqual(['e2'].sort());

    // Black Market Path
    expect(result['Black Market'].count).toBe(2); // c2, p1
    expect(result['Black Market'].characters.map(c => c.id).sort()).toEqual(['c2'].sort());
    expect(result['Black Market'].puzzles.map(p => p.id).sort()).toEqual(['p1'].sort());
    expect(result['Black Market'].elements.length).toBe(0);

    // Third Path
    expect(result['Third Path'].count).toBe(3); // c2, p2, e1
    expect(result['Third Path'].characters.map(c => c.id).sort()).toEqual(['c2'].sort());
    expect(result['Third Path'].puzzles.map(p => p.id).sort()).toEqual(['p2'].sort());
    expect(result['Third Path'].elements.map(e => e.id).sort()).toEqual(['e1'].sort());

    // Unassigned Path
    expect(result[UNASSIGNED_PATH].count).toBe(3); // c3, c5, p3, e3 - wait, c5 is null, p3 is undefined. c3,p3,e3 = 3
    expect(result[UNASSIGNED_PATH].characters.map(c => c.id).sort()).toEqual(['c3', 'c5'].sort());
    expect(result[UNASSIGNED_PATH].puzzles.map(p => p.id).sort()).toEqual(['p3'].sort());
    expect(result[UNASSIGNED_PATH].elements.map(e => e.id).sort()).toEqual(['e3'].sort());
  });

  it('should handle items belonging to multiple paths correctly', () => {
    const result = aggregatePathData(mockCharacters, mockPuzzles, mockElements);
    // Character c2 is in Black Market and Third Path
    expect(result['Black Market'].characters.find(c => c.id === 'c2')).toBeDefined();
    expect(result['Third Path'].characters.find(c => c.id === 'c2')).toBeDefined();
    // Puzzle p2 is in Detective and Third Path
    expect(result['Detective'].puzzles.find(p => p.id === 'p2')).toBeDefined();
    expect(result['Third Path'].puzzles.find(p => p.id === 'p2')).toBeDefined();
  });

  it('should correctly count items even if they belong to multiple paths for the total count', () => {
    const result = aggregatePathData(mockCharacters, mockPuzzles, mockElements);
    // Total count for Detective path should include c2 and p2 even if they are elsewhere
    expect(result['Detective'].count).toBe(4); // c1, c4, p2, e2
    // Total count for Black Market
    expect(result['Black Market'].count).toBe(2); // c2, p1
     // Total count for Third Path
    expect(result['Third Path'].count).toBe(3); // c2, p2, e1
  });

});
