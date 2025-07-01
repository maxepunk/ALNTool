import { renderHook } from '@testing-library/react';
import useMemoryEconomyAnalysis from '../useMemoryEconomyAnalysis';

describe('useMemoryEconomyAnalysis', () => {
  // Create base mock data as functions to avoid shared references
  const createMockGameConstants = () => ({
    MEMORY_VALUE: {
      TARGET_TOKEN_COUNT: 55,
      MIN_TOKEN_COUNT: 50,
      MAX_TOKEN_COUNT: 60,
      BALANCE_WARNING_THRESHOLD: 0.3
    },
    RESOLUTION_PATHS: {
      TYPES: ['Black Market', 'Detective', 'Third Path'],
      THEMES: {
        'Black Market': { color: 'error' },
        'Detective': { color: 'info' },
        'Third Path': { color: 'success' }
      }
    },
    PRODUCTION_STATUS: {
      COLORS: {
        'Ready': 'success',
        'To Build': 'info',
        'To Design': 'warning',
        'Unknown': 'default'
      }
    }
  });

  const createMockElement = (id, overrides = {}) => ({
    id,
    name: `Memory ${id}`,
    properties: {
      parsed_sf_rfid: `RFID${String(id).padStart(3, '0')}`,
      sf_value_rating: 3,
      sf_memory_type: 'Core',
      status: 'Ready',
      ...overrides.properties
    },
    baseValueAmount: 1000,
    typeMultiplierValue: 1.5,
    finalCalculatedValue: 1500,
    rewardedByPuzzle: [],
    timelineEvent: [],
    ...overrides
  });

  const createMockElements = () => [
    createMockElement(1, {
      properties: {
        parsed_sf_rfid: 'RFID001',
        sf_value_rating: 3,
        sf_memory_type: 'Core',
        status: 'Ready'
      },
      rewardedByPuzzle: [{ id: 1, name: 'Puzzle 1' }]
    }),
    createMockElement(2, {
      properties: {
        parsed_sf_rfid: 'RFID002',
        sf_value_rating: 4,
        sf_memory_type: 'Bonus',
        status: 'To Build'
      },
      baseValueAmount: 2000,
      typeMultiplierValue: 2,
      finalCalculatedValue: 4000,
      timelineEvent: [{ name: 'Event 1' }]
    })
  ];

  const createMockCharacters = () => [
    { id: 1, name: 'Character 1' },
    { id: 2, name: 'Character 2' }
  ];

  const createMockPuzzles = () => [
    { id: 1, name: 'Puzzle 1', resolutionPaths: ['Detective'] },
    { id: 2, name: 'Puzzle 2', resolutionPaths: ['Black Market'] }
  ];

  // Clean up after each test to prevent memory accumulation
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return default values when no data is provided', () => {
    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(null, null, null, null)
    );

    expect(result.current).toEqual({
      processedMemoryData: [],
      economyStats: { totalTokens: 0, completedTokens: 0, totalValue: 0 },
      pathDistribution: { 'Black Market': 0, 'Detective': 0, 'Third Path': 0, 'Unassigned': 0 },
      productionStatus: { toDesign: 0, toBuild: 0, ready: 0 },
      balanceAnalysis: { issues: [], recommendations: [] }
    });
  });

  it('should process memory data correctly', () => {
    const mockElements = createMockElements();
    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(mockElements, mockCharacters, mockPuzzles, mockGameConstants)
    );

    expect(result.current.processedMemoryData).toHaveLength(2);
    expect(result.current.processedMemoryData[0]).toMatchObject({
      id: 1,
      name: 'Memory 1',
      parsed_sf_rfid: 'RFID001',
      sf_value_rating: 3,
      baseValueAmount: 1000,
      typeMultiplierValue: 1.5,
      finalCalculatedValue: 1500,
      discoveredVia: 'Puzzle: Puzzle 1',
      resolutionPath: 'Detective',
      productionStage: 'ready',
      status: 'Ready'
    });
  });

  it('should calculate economy statistics correctly', () => {
    const mockElements = createMockElements();
    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(mockElements, mockCharacters, mockPuzzles, mockGameConstants)
    );

    expect(result.current.economyStats).toEqual({
      totalTokens: 2,
      completedTokens: 1,
      totalValue: 5500
    });
  });

  it('should calculate path distribution correctly', () => {
    const mockElements = createMockElements();
    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(mockElements, mockCharacters, mockPuzzles, mockGameConstants)
    );

    expect(result.current.pathDistribution).toEqual({
      'Black Market': 0,
      'Detective': 1,
      'Third Path': 0,
      'Unassigned': 1
    });
  });

  it('should calculate production status correctly', () => {
    const mockElements = createMockElements();
    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(mockElements, mockCharacters, mockPuzzles, mockGameConstants)
    );

    expect(result.current.productionStatus).toEqual({
      toDesign: 0,
      toBuild: 1,
      ready: 1
    });
  });

  it('should detect token count below minimum', () => {
    const mockElements = createMockElements();
    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(mockElements, mockCharacters, mockPuzzles, mockGameConstants)
    );

    expect(result.current.balanceAnalysis.issues).toContain('Token count below target (55 tokens)');
    expect(result.current.balanceAnalysis.recommendations).toContain('Add more memory tokens to reach economy target');
  });

  it('should detect too many tokens', () => {
    // Create elements more efficiently using a smaller test set
    const manyElements = [];
    for (let i = 0; i < 65; i++) {
      manyElements.push(createMockElement(i));
    }

    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(manyElements, mockCharacters, mockPuzzles, mockGameConstants)
    );

    expect(result.current.balanceAnalysis.issues).toContain('Token count above target - may overwhelm players');
    expect(result.current.balanceAnalysis.recommendations).toContain('Consider reducing token count or increasing variety');

    // Clean up large array
    manyElements.length = 0;
  });

  it('should detect too many unassigned tokens', () => {
    // Create a smaller test set
    const unassignedElements = [];
    for (let i = 0; i < 20; i++) {
      unassignedElements.push(createMockElement(i, { 
        rewardedByPuzzle: undefined 
      }));
    }

    const mockCharacters = createMockCharacters();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(unassignedElements, mockCharacters, [], mockGameConstants)
    );

    const unassignedCount = result.current.pathDistribution['Unassigned'];
    expect(unassignedCount).toBeGreaterThan(20 * 0.3);
    expect(result.current.balanceAnalysis.issues).toContain('Too many unassigned tokens');

    // Clean up
    unassignedElements.length = 0;
  });

  it('should detect production behind schedule', () => {
    // Create a smaller test set
    const notReadyElements = [];
    for (let i = 0; i < 10; i++) {
      notReadyElements.push(createMockElement(i, {
        properties: { status: 'To Design' }
      }));
    }

    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(notReadyElements, mockCharacters, mockPuzzles, mockGameConstants)
    );

    expect(result.current.balanceAnalysis.issues).toContain('Production behind schedule');
    expect(result.current.balanceAnalysis.recommendations).toContain('Prioritize completion of memory tokens in design/build phases');

    // Clean up
    notReadyElements.length = 0;
  });

  it('should handle memory discovery via timeline events', () => {
    const mockElements = createMockElements();
    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(mockElements, mockCharacters, mockPuzzles, mockGameConstants)
    );

    const memory2 = result.current.processedMemoryData.find(m => m.id === 2);
    expect(memory2.discoveredVia).toBe('Event: Event 1');
    expect(memory2.resolutionPath).toBe('Unassigned');
  });

  it('should map production stages correctly', () => {
    const elementsWithStatuses = [
      createMockElement(1, { properties: { status: 'To Design' } }),
      createMockElement(2, { properties: { status: 'To Build' } }),
      createMockElement(3, { properties: { status: 'Complete' } }),
      createMockElement(4, { properties: { status: 'Unknown' } })
    ];

    const mockCharacters = createMockCharacters();
    const mockPuzzles = createMockPuzzles();
    const mockGameConstants = createMockGameConstants();

    const { result } = renderHook(() => 
      useMemoryEconomyAnalysis(elementsWithStatuses, mockCharacters, mockPuzzles, mockGameConstants)
    );

    const stages = result.current.processedMemoryData.map(m => m.productionStage);
    expect(stages).toEqual(['design', 'build', 'ready', 'unknown']);
  });
});