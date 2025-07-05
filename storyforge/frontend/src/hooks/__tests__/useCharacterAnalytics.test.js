import { renderHook } from '@testing-library/react';
import useCharacterAnalytics from '../useCharacterAnalytics';

// Mock the useGameConstants hook
jest.mock('../useGameConstants', () => ({
  getConstant: jest.fn((constants, key, defaultValue) => {
    const mockConstants = {
      'RESOLUTION_PATHS.TYPES': ['Black Market', 'Detective', 'Third Path'],
      'RESOLUTION_PATHS.DEFAULT': 'Unassigned',
      'CHARACTERS.TIERS': ['Core', 'Secondary', 'Tertiary'],
      'CHARACTERS.UNASSIGNED_WARNING_THRESHOLD': 0.2,
      'CHARACTERS.ISOLATED_WARNING_THRESHOLD': 0.15,
      'CHARACTERS.PATH_IMBALANCE_THRESHOLD': 0.4,
      'ELEMENTS.MEMORY_TOKEN_WARNING_THRESHOLD': 45,
      'MEMORY_VALUE.TARGET_TOKEN_COUNT': 55
    };
    return mockConstants[key] || defaultValue;
  })
}));

describe('useCharacterAnalytics', () => {
  const mockGameConstants = {}; // Mock game constants object

  const createMockCharacter = (overrides = {}) => ({
    id: '1',
    name: 'Test Character',
    tier: 'Core',
    resolutionPaths: ['Black Market'],
    character_links: [{ id: '2' }],
    ownedElements: [
      { id: '1', properties: { basicType: 'Memory Token' } },
      { id: '2', properties: { basicType: 'Physical Object' } }
    ],
    ...overrides
  });

  it('should return default analytics for empty characters array', () => {
    const { result } = renderHook(() => 
      useCharacterAnalytics([], 'All Paths', mockGameConstants)
    );

    expect(result.current).toEqual({
      totalCharacters: 0,
      pathDistribution: {
        'Black Market': 0,
        'Detective': 0,
        'Third Path': 0,
        'Unassigned': 0
      },
      tierDistribution: {
        'Core': 0,
        'Secondary': 0,
        'Tertiary': 0
      },
      productionReadiness: { ready: 0, needsWork: 0 },
      memoryEconomy: { totalTokens: 0, avgPerCharacter: 0 },
      socialNetwork: { connected: 0, isolated: 0 },
      issues: [
        {
          type: 'memory-economy',
          severity: 'info',
          message: 'Memory token count below target (55 tokens)',
          action: 'Add more memory tokens to character inventories'
        }
      ]
    });
  });

  it('should calculate correct analytics for characters array', () => {
    const characters = [
      createMockCharacter({
        id: '1',
        tier: 'Core',
        resolutionPaths: ['Black Market'],
        character_links: [{ id: '2' }],
        ownedElements: [
          { id: '1', properties: { basicType: 'Memory Token' } },
          { id: '2', properties: { basicType: 'RFID Card' } }
        ]
      }),
      createMockCharacter({
        id: '2',
        tier: 'Secondary',
        resolutionPaths: ['Detective'],
        character_links: [],
        ownedElements: []
      })
    ];

    const { result } = renderHook(() => 
      useCharacterAnalytics(characters, 'All Paths', mockGameConstants)
    );

    expect(result.current.totalCharacters).toBe(2);
    expect(result.current.pathDistribution['Black Market']).toBe(1);
    expect(result.current.pathDistribution['Detective']).toBe(1);
    expect(result.current.tierDistribution['Core']).toBe(1);
    expect(result.current.tierDistribution['Secondary']).toBe(1);
    expect(result.current.memoryEconomy.totalTokens).toBe(2);
    expect(result.current.socialNetwork.connected).toBe(1);
    expect(result.current.socialNetwork.isolated).toBe(1);
  });

  it('should filter characters by path when pathFilter is set', () => {
    const characters = [
      createMockCharacter({
        id: '1',
        resolutionPaths: ['Black Market']
      }),
      createMockCharacter({
        id: '2',
        resolutionPaths: ['Detective']
      })
    ];

    const { result } = renderHook(() => 
      useCharacterAnalytics(characters, 'Black Market', mockGameConstants)
    );

    expect(result.current.totalCharacters).toBe(1);
  });

  it('should handle unassigned path filter', () => {
    const characters = [
      createMockCharacter({
        id: '1',
        resolutionPaths: ['Black Market']
      }),
      createMockCharacter({
        id: '2',
        resolutionPaths: []
      }),
      createMockCharacter({
        id: '3',
        resolutionPaths: null
      })
    ];

    const { result } = renderHook(() => 
      useCharacterAnalytics(characters, 'Unassigned', mockGameConstants)
    );

    expect(result.current.totalCharacters).toBe(2);
  });

  it('should identify production issues', () => {
    // Create characters that trigger various issues
    const characters = [
      // Unassigned character (should trigger path-assignment issue)
      createMockCharacter({
        id: '1',
        resolutionPaths: [],
        character_links: []
      }),
      createMockCharacter({
        id: '2',
        resolutionPaths: [],
        character_links: []
      }),
      createMockCharacter({
        id: '3',
        resolutionPaths: [],
        character_links: []
      }),
      // Connected character
      createMockCharacter({
        id: '4',
        resolutionPaths: ['Black Market'],
        character_links: [{ id: '5' }]
      })
    ];

    const { result } = renderHook(() => 
      useCharacterAnalytics(characters, 'All Paths', mockGameConstants)
    );

    expect(result.current.issues.length).toBeGreaterThan(0);
    
    // Should have path-assignment issue (3/4 = 75% unassigned > 20% threshold)
    const pathIssue = result.current.issues.find(issue => issue.type === 'path-assignment');
    expect(pathIssue).toBeDefined();
    expect(pathIssue.message).toContain('3 characters need resolution path assignment');
  });

  it('should calculate memory economy correctly', () => {
    const characters = [
      createMockCharacter({
        id: '1',
        ownedElements: [
          { id: '1', properties: { basicType: 'Memory Token' } },
          { id: '2', properties: { basicType: 'memory card' } }, // lowercase
          { id: '3', properties: { basicType: 'RFID token' } },
          { id: '4', properties: { basicType: 'Physical Object' } }
        ]
      }),
      createMockCharacter({
        id: '2',
        ownedElements: [
          { id: '5', properties: { basicType: 'Token' } }
        ]
      })
    ];

    const { result } = renderHook(() => 
      useCharacterAnalytics(characters, 'All Paths', mockGameConstants)
    );

    expect(result.current.memoryEconomy.totalTokens).toBe(4); // memory, token, rfid items
    expect(result.current.memoryEconomy.avgPerCharacter).toBe('2.0');
  });

  it('should calculate production readiness correctly', () => {
    const characters = [
      // Ready character: has paths and connections
      createMockCharacter({
        id: '1',
        resolutionPaths: ['Black Market'],
        character_links: [{ id: '2' }]
      }),
      // Not ready: no paths
      createMockCharacter({
        id: '2',
        resolutionPaths: [],
        character_links: [{ id: '1' }]
      }),
      // Not ready: no connections
      createMockCharacter({
        id: '3',
        resolutionPaths: ['Detective'],
        character_links: []
      })
    ];

    const { result } = renderHook(() => 
      useCharacterAnalytics(characters, 'All Paths', mockGameConstants)
    );

    expect(result.current.productionReadiness.ready).toBe(1);
    expect(result.current.productionReadiness.needsWork).toBe(2);
  });

  it('should handle null characters gracefully', () => {
    const { result } = renderHook(() => 
      useCharacterAnalytics(null, 'All Paths', mockGameConstants)
    );

    expect(result.current.totalCharacters).toBe(0);
    expect(result.current.issues).toEqual([]);
  });

  it('should handle undefined characters gracefully', () => {
    const { result } = renderHook(() => 
      useCharacterAnalytics(undefined, 'All Paths', mockGameConstants)
    );

    expect(result.current.totalCharacters).toBe(0);
    expect(result.current.issues).toEqual([]);
  });
});