import { calculatePathAnalysis } from './PathAnalysisCalculator';

describe('PathAnalysisCalculator', () => {
  const mockGameConstants = {
    RESOLUTION_PATHS: {
      TYPES: ['Black Market', 'Detective', 'Third Path'],
      DEFAULT: 'Unassigned',
      THEMES: {
        'Black Market': { color: 'error', theme: 'Underground Economy' },
        'Detective': { color: 'info', theme: 'Investigative' },
        'Third Path': { color: 'success', theme: 'Community' }
      }
    },
    MEMORY_VALUE: {
      BASE_VALUES: { 1: 10, 2: 25, 3: 50, 4: 100, 5: 250 },
      TYPE_MULTIPLIERS: { Personal: 1, Shared: 1.5, Collective: 2 },
      BALANCE_WARNING_THRESHOLD: 0.3
    }
  };

  const mockCharacters = [
    { id: '1', name: 'Character 1', resolutionPaths: ['Black Market'] },
    { id: '2', name: 'Character 2', resolutionPaths: ['Detective'] },
    { id: '3', name: 'Character 3', resolutionPaths: ['Third Path'] },
    { id: '4', name: 'Character 4', resolutionPaths: [] },
    { id: '5', name: 'Character 5', resolutionPaths: ['Black Market', 'Detective'] }
  ];

  const mockElements = [
    { 
      id: 'e1', 
      name: 'Element 1', 
      resolutionPaths: ['Black Market'],
      properties: { 
        basicType: 'memory token',
        status: 'Ready',
        sf_value_rating: 3,
        sf_memory_type: 'Personal'
      }
    },
    { 
      id: 'e2', 
      name: 'Element 2', 
      resolutionPaths: ['Detective'],
      properties: { 
        basicType: 'rfid',
        status: 'In Progress',
        sf_value_rating: 2,
        sf_memory_type: 'Shared'
      }
    }
  ];

  const mockPuzzles = [
    { id: 'p1', name: 'Puzzle 1', resolutionPaths: ['Black Market'] },
    { id: 'p2', name: 'Puzzle 2', resolutionPaths: ['Detective', 'Third Path'] }
  ];

  const mockTimelineEvents = [
    { id: 't1', description: 'Event 1', resolutionPaths: ['Black Market'] },
    { id: 't2', description: 'Event 2', resolutionPaths: ['Detective'] }
  ];

  it('should return empty analysis when no data provided', () => {
    const result = calculatePathAnalysis(null, null, null, null, null);
    
    expect(result).toEqual({
      pathDistribution: {},
      pathResources: {},
      crossPathDependencies: [],
      balanceMetrics: {},
      recommendations: []
    });
  });

  it('should calculate path distribution correctly', () => {
    const result = calculatePathAnalysis(
      mockCharacters, 
      mockElements, 
      mockPuzzles, 
      mockTimelineEvents, 
      mockGameConstants
    );

    expect(result.pathDistribution['Black Market']).toHaveLength(2); // Characters 1 and 5
    expect(result.pathDistribution['Detective']).toHaveLength(2); // Characters 2 and 5
    expect(result.pathDistribution['Third Path']).toHaveLength(1); // Character 3
    expect(result.pathDistribution['Unassigned']).toHaveLength(1); // Character 4
  });

  it('should calculate path resources correctly', () => {
    const result = calculatePathAnalysis(
      mockCharacters, 
      mockElements, 
      mockPuzzles, 
      mockTimelineEvents, 
      mockGameConstants
    );

    const blackMarketResources = result.pathResources['Black Market'];
    expect(blackMarketResources.characters).toBe(2);
    expect(blackMarketResources.elements).toBe(1);
    expect(blackMarketResources.puzzles).toBe(1);
    expect(blackMarketResources.timelineEvents).toBe(1);
    expect(blackMarketResources.memoryTokens).toBe(1);
    expect(blackMarketResources.readyElements).toBe(1);
    expect(blackMarketResources.totalValue).toBe(50); // value rating 3 * multiplier 1
  });

  it('should identify cross-path dependencies', () => {
    const result = calculatePathAnalysis(
      mockCharacters, 
      mockElements, 
      mockPuzzles, 
      mockTimelineEvents, 
      mockGameConstants
    );

    expect(result.crossPathDependencies).toHaveLength(2);
    
    const characterDep = result.crossPathDependencies.find(d => d.type === 'Cross-Path Character');
    expect(characterDep.name).toBe('Character 5');
    expect(characterDep.paths).toEqual(['Black Market', 'Detective']);
    
    const puzzleDep = result.crossPathDependencies.find(d => d.type === 'Shared Puzzle');
    expect(puzzleDep.name).toBe('Puzzle 2');
    expect(puzzleDep.paths).toEqual(['Detective', 'Third Path']);
  });

  it('should calculate balance metrics correctly', () => {
    const result = calculatePathAnalysis(
      mockCharacters, 
      mockElements, 
      mockPuzzles, 
      mockTimelineEvents, 
      mockGameConstants
    );

    expect(result.balanceMetrics.characterBalance).toBeGreaterThan(0);
    expect(result.balanceMetrics.characterBalance).toBeLessThanOrEqual(100);
    expect(result.balanceMetrics.crossPathComplexity).toBe(2);
    
    expect(result.balanceMetrics.resourceBalance['Black Market']).toBeDefined();
    expect(result.balanceMetrics.resourceBalance['Black Market'].completion).toBe(100); // 1 ready / 1 total
    expect(result.balanceMetrics.resourceBalance['Black Market'].memoryDensity).toBe(0.5); // 1 token / 2 characters
  });

  it('should generate appropriate recommendations', () => {
    const result = calculatePathAnalysis(
      mockCharacters, 
      mockElements, 
      mockPuzzles, 
      mockTimelineEvents, 
      mockGameConstants
    );

    const unassignedRec = result.recommendations.find(r => r.type === 'unassigned-characters');
    expect(unassignedRec).toBeUndefined(); // Only 1 unassigned out of 5 (20% < 30% threshold)

    const memoryRecs = result.recommendations.filter(r => r.type === 'memory-economy');
    expect(memoryRecs.length).toBeGreaterThan(0); // Should have memory density warnings
  });

  it('should handle empty resolution paths arrays', () => {
    const charactersWithoutPaths = mockCharacters.map(c => ({ ...c, resolutionPaths: [] }));
    
    const result = calculatePathAnalysis(
      charactersWithoutPaths, 
      [], 
      [], 
      [], 
      mockGameConstants
    );

    expect(result.pathDistribution['Unassigned']).toHaveLength(5);
    expect(result.pathDistribution['Black Market']).toHaveLength(0);
  });

  it('should use getConstant helper for safe constant access', () => {
    const incompleteConstants = { RESOLUTION_PATHS: { TYPES: ['Path1'] } };
    
    const result = calculatePathAnalysis(
      mockCharacters, 
      mockElements, 
      mockPuzzles, 
      mockTimelineEvents, 
      incompleteConstants
    );

    // Should still work with default values
    expect(result.pathDistribution).toBeDefined();
    expect(result.pathDistribution['Unassigned']).toBeDefined();
  });
});