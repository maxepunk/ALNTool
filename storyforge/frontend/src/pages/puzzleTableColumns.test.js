import { puzzleTableColumns } from './puzzleTableColumns';

describe('puzzleTableColumns', () => {
  it('should export valid column definitions', () => {
    expect(puzzleTableColumns).toBeDefined();
    expect(Array.isArray(puzzleTableColumns)).toBe(true);
    expect(puzzleTableColumns.length).toBeGreaterThan(0);
  });

  it('should have valid column structure', () => {
    puzzleTableColumns.forEach(column => {
      expect(column).toHaveProperty('id');
      expect(column).toHaveProperty('label');
      expect(typeof column.id).toBe('string');
      expect(typeof column.label).toBe('string');
    });
  });

  it('should format actFocus column correctly', () => {
    const actFocusColumn = puzzleTableColumns.find(col => col.id === 'properties.actFocus');
    expect(actFocusColumn).toBeDefined();
    expect(typeof actFocusColumn.format).toBe('function');

    // Test with actFocus property
    const result1 = actFocusColumn.format(null, { properties: { actFocus: 'Act 1' } });
    expect(result1).toBe('Act 1');

    // Test with timing fallback
    const result2 = actFocusColumn.format(null, { timing: 'Act 2' });
    expect(result2).toBe('Act 2');

    // Test with neither
    const result3 = actFocusColumn.format(null, {});
    expect(result3).toBe('N/A');
  });

  it('should format themes column correctly', () => {
    const themesColumn = puzzleTableColumns.find(col => col.id === 'properties.themes');
    expect(themesColumn).toBeDefined();
    expect(typeof themesColumn.format).toBe('function');

    // Test with themes
    const result1 = themesColumn.format(null, { properties: { themes: ['Mystery', 'Investigation'] } });
    expect(result1).toBe('Mystery, Investigation');

    // Test without themes
    const result2 = themesColumn.format(null, {});
    expect(result2).toBe('No themes');
  });

  it('should format owner column correctly', () => {
    const ownerColumn = puzzleTableColumns.find(col => col.id === 'owner');
    expect(ownerColumn).toBeDefined();
    expect(typeof ownerColumn.format).toBe('function');

    // Test with owner array
    const result1 = ownerColumn.format(null, { owner: ['Alice', 'Bob'] });
    expect(result1).toBe('Alice, Bob');

    // Test without owner
    const result2 = ownerColumn.format(null, {});
    expect(result2).toBe('Unassigned');
  });

  it('should format rewards column correctly', () => {
    const rewardsColumn = puzzleTableColumns.find(col => col.id === 'rewards');
    expect(rewardsColumn).toBeDefined();
    expect(typeof rewardsColumn.format).toBe('function');

    // Test with rewards
    const result1 = rewardsColumn.format(null, { rewards: [{}, {}, {}] });
    expect(result1).toBe(3);

    // Test without rewards
    const result2 = rewardsColumn.format(null, {});
    expect(result2).toBe(0);
  });

  it('should format narrativeThreads column correctly', () => {
    const threadsColumn = puzzleTableColumns.find(col => col.id === 'narrativeThreads');
    expect(threadsColumn).toBeDefined();
    expect(typeof threadsColumn.format).toBe('function');

    // Test with threads
    const result1 = threadsColumn.format(null, { narrativeThreads: ['Main Mystery', 'Side Quest'] });
    expect(result1).toBe('Main Mystery, Side Quest');

    // Test without threads
    const result2 = threadsColumn.format(null, {});
    expect(result2).toBe('No threads');
  });
});