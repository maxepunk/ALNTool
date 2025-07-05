/**
 * Unit tests for GameConstants module
 * Ensures our single source of truth is properly structured and accessible
 */

const GameConstants = require('../GameConstants');

describe('GameConstants', () => {
  test('should be frozen to prevent accidental modifications', () => {
    expect(Object.isFrozen(GameConstants)).toBe(true);

    // Attempt to modify should fail silently or throw in strict mode
    expect(() => {
      GameConstants.MEMORY_VALUE.TARGET_TOKEN_COUNT = 999;
    }).not.toThrow();

    // Value should remain unchanged
    expect(GameConstants.MEMORY_VALUE.TARGET_TOKEN_COUNT).toBe(55);
  });

  describe('MEMORY_VALUE constants', () => {
    test('should have all required memory value properties', () => {
      expect(GameConstants.MEMORY_VALUE).toMatchObject({
        BASE_VALUES: expect.any(Object),
        TYPE_MULTIPLIERS: expect.any(Object),
        GROUP_COMPLETION_MULTIPLIER: expect.any(Number),
        TARGET_TOKEN_COUNT: expect.any(Number),
        MIN_TOKEN_COUNT: expect.any(Number),
        MAX_TOKEN_COUNT: expect.any(Number),
        BALANCE_WARNING_THRESHOLD: expect.any(Number),
        MEMORY_ELEMENT_TYPES: expect.any(Array)
      });
    });

    test('should have correct base values for all rating levels', () => {
      const { BASE_VALUES } = GameConstants.MEMORY_VALUE;
      expect(BASE_VALUES[1]).toBe(100);
      expect(BASE_VALUES[2]).toBe(500);
      expect(BASE_VALUES[3]).toBe(1000);
      expect(BASE_VALUES[4]).toBe(5000);
      expect(BASE_VALUES[5]).toBe(10000);
    });

    test('should have type multipliers for all memory types', () => {
      const { TYPE_MULTIPLIERS } = GameConstants.MEMORY_VALUE;
      expect(TYPE_MULTIPLIERS['Personal']).toBe(2.0);
      expect(TYPE_MULTIPLIERS['Business']).toBe(5.0);
      expect(TYPE_MULTIPLIERS['Technical']).toBe(10.0);
    });

    test('should have logical token count thresholds', () => {
      const { MIN_TOKEN_COUNT, TARGET_TOKEN_COUNT, MAX_TOKEN_COUNT } = GameConstants.MEMORY_VALUE;
      expect(MIN_TOKEN_COUNT).toBeLessThan(TARGET_TOKEN_COUNT);
      expect(TARGET_TOKEN_COUNT).toBeLessThan(MAX_TOKEN_COUNT);
      expect(MIN_TOKEN_COUNT).toBe(50);
      expect(TARGET_TOKEN_COUNT).toBe(55);
      expect(MAX_TOKEN_COUNT).toBe(60);
    });

    test('should have valid memory element types', () => {
      const { MEMORY_ELEMENT_TYPES } = GameConstants.MEMORY_VALUE;
      expect(MEMORY_ELEMENT_TYPES).toContain('Memory Token Video');
      expect(MEMORY_ELEMENT_TYPES).toContain('Memory Token Audio');
      expect(MEMORY_ELEMENT_TYPES).toContain('Memory Token Physical');
      expect(MEMORY_ELEMENT_TYPES).toContain('Corrupted Memory RFID');
      expect(MEMORY_ELEMENT_TYPES.length).toBeGreaterThan(0);
    });
  });

  describe('RESOLUTION_PATHS constants', () => {
    test('should have three main resolution paths', () => {
      const { TYPES } = GameConstants.RESOLUTION_PATHS;
      expect(TYPES).toHaveLength(3);
      expect(TYPES).toContain('Black Market');
      expect(TYPES).toContain('Detective');
      expect(TYPES).toContain('Third Path');
    });

    test('should have default path assignment', () => {
      expect(GameConstants.RESOLUTION_PATHS.DEFAULT).toBe('Unassigned');
    });

    test('should have UI themes for all paths', () => {
      const { THEMES } = GameConstants.RESOLUTION_PATHS;
      const paths = [...GameConstants.RESOLUTION_PATHS.TYPES, GameConstants.RESOLUTION_PATHS.DEFAULT];

      paths.forEach(path => {
        expect(THEMES[path]).toMatchObject({
          color: expect.any(String),
          icon: expect.any(String),
          theme: expect.any(String)
        });
      });
    });
  });

  describe('ACTS constants', () => {
    test('should have two main acts', () => {
      const { TYPES } = GameConstants.ACTS;
      expect(TYPES).toHaveLength(2);
      expect(TYPES).toContain('Act 1');
      expect(TYPES).toContain('Act 2');
    });

    test('should have sequence mapping for sorting', () => {
      const { SEQUENCE } = GameConstants.ACTS;
      expect(SEQUENCE['Act 1']).toBe(1);
      expect(SEQUENCE['Act 2']).toBe(2);
      expect(SEQUENCE['Unassigned']).toBe(999); // Should sort last
    });
  });

  describe('CHARACTER constants', () => {
    test('should have valid character types and tiers', () => {
      const { TYPES, TIERS } = GameConstants.CHARACTERS;
      expect(TYPES).toContain('Player');
      expect(TYPES).toContain('NPC');
      expect(TIERS).toContain('Core');
      expect(TIERS).toContain('Secondary');
      expect(TIERS).toContain('Tertiary');
    });

    test('should have logical warning thresholds (0-1 range)', () => {
      const { UNASSIGNED_WARNING_THRESHOLD, ISOLATED_WARNING_THRESHOLD, PATH_IMBALANCE_THRESHOLD } = GameConstants.CHARACTERS;

      [UNASSIGNED_WARNING_THRESHOLD, ISOLATED_WARNING_THRESHOLD, PATH_IMBALANCE_THRESHOLD].forEach(threshold => {
        expect(threshold).toBeGreaterThan(0);
        expect(threshold).toBeLessThan(1);
      });
    });
  });

  describe('ELEMENTS constants', () => {
    test('should have comprehensive status types', () => {
      const { STATUS_TYPES } = GameConstants.ELEMENTS;
      expect(STATUS_TYPES).toContain('Ready for Playtest');
      expect(STATUS_TYPES).toContain('Done');
      expect(STATUS_TYPES).toContain('In development');
      expect(STATUS_TYPES.length).toBeGreaterThan(3);
    });

    test('should have logical readiness thresholds', () => {
      const { MEMORY_READINESS_THRESHOLD, OVERALL_READINESS_THRESHOLD } = GameConstants.ELEMENTS;
      expect(MEMORY_READINESS_THRESHOLD).toBeGreaterThan(0);
      expect(MEMORY_READINESS_THRESHOLD).toBeLessThanOrEqual(1);
      expect(OVERALL_READINESS_THRESHOLD).toBeGreaterThan(0);
      expect(OVERALL_READINESS_THRESHOLD).toBeLessThanOrEqual(1);
    });

    test('should have element categories including memory types', () => {
      const { CATEGORIES } = GameConstants.ELEMENTS;
      expect(CATEGORIES).toContain('Prop');
      expect(CATEGORIES).toContain('Memory Token Video');
      expect(CATEGORIES).toContain('Memory Token Audio');
      expect(CATEGORIES).toContain('Memory Token Physical');
    });
  });

  describe('PUZZLES constants', () => {
    test('should have complexity thresholds', () => {
      const { HIGH_COMPLEXITY_OWNERS_THRESHOLD, HIGH_COMPLEXITY_REWARDS_THRESHOLD, MEDIUM_COMPLEXITY_REWARDS_THRESHOLD } = GameConstants.PUZZLES;

      expect(HIGH_COMPLEXITY_OWNERS_THRESHOLD).toBeGreaterThan(0);
      expect(HIGH_COMPLEXITY_REWARDS_THRESHOLD).toBeGreaterThan(MEDIUM_COMPLEXITY_REWARDS_THRESHOLD);
      expect(MEDIUM_COMPLEXITY_REWARDS_THRESHOLD).toBeGreaterThanOrEqual(1);
    });

    test('should have production issue warning thresholds', () => {
      const { UNASSIGNED_WARNING_THRESHOLD, NO_REWARDS_WARNING_THRESHOLD, NO_NARRATIVE_THREADS_WARNING_THRESHOLD } = GameConstants.PUZZLES;

      [UNASSIGNED_WARNING_THRESHOLD, NO_REWARDS_WARNING_THRESHOLD, NO_NARRATIVE_THREADS_WARNING_THRESHOLD].forEach(threshold => {
        expect(threshold).toBeGreaterThan(0);
        expect(threshold).toBeLessThan(1);
      });
    });
  });

  describe('SYSTEM constants', () => {
    test('should have reasonable batch and cache settings', () => {
      const { MAX_BATCH_SIZE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } = GameConstants.SYSTEM;

      expect(MAX_BATCH_SIZE).toBeGreaterThan(0);
      expect(DEFAULT_PAGE_SIZE).toBeGreaterThan(0);
      expect(MAX_PAGE_SIZE).toBeGreaterThan(DEFAULT_PAGE_SIZE);
      expect(MAX_PAGE_SIZE).toBeGreaterThan(MAX_BATCH_SIZE);
    });

    test('should have cache durations in milliseconds', () => {
      const { CACHE_DURATIONS } = GameConstants.SYSTEM;

      expect(CACHE_DURATIONS.SHORT).toBeLessThan(CACHE_DURATIONS.MEDIUM);
      expect(CACHE_DURATIONS.MEDIUM).toBeLessThan(CACHE_DURATIONS.LONG);

      // Should be reasonable millisecond values
      expect(CACHE_DURATIONS.SHORT).toBeGreaterThan(60000); // > 1 minute
      expect(CACHE_DURATIONS.LONG).toBeLessThan(7 * 24 * 60 * 60 * 1000); // < 1 week
    });
  });

  test('should export a complete frozen object', () => {
    expect(typeof GameConstants).toBe('object');
    expect(GameConstants).not.toBeNull();
    expect(Object.keys(GameConstants).length).toBeGreaterThan(5);
  });

  test('should be importable as CommonJS module', () => {
    const ImportedConstants = require('../GameConstants');
    expect(ImportedConstants).toBe(GameConstants);
  });
});