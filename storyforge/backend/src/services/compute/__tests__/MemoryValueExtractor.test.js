const MemoryValueExtractor = require('../MemoryValueExtractor');
const { getDB, initializeDatabase, closeDB } = require('../../../db/database');
const GameConstants = require('../../../config/GameConstants');

describe('MemoryValueExtractor', () => {
  let extractor;
  let db;

  beforeAll(() => {
    initializeDatabase(':memory:');
    db = getDB();
    extractor = new MemoryValueExtractor(db);
  });

  afterAll(() => {
    closeDB();
  });

  describe('SF_ field extraction', () => {
    test('extractRFIDTag', () => {
      // Without brackets
      expect(extractor.extractRFIDTag('SF_RFID: ABC123 - some description')).toBe('ABC123');
      expect(extractor.extractRFIDTag('sf_rfid: xyz789')).toBe('xyz789');
      // With brackets (production format)
      expect(extractor.extractRFIDTag('SF_RFID: [MEM001]')).toBe('MEM001');
      // TBD should be ignored
      expect(extractor.extractRFIDTag('SF_RFID: [TBD]')).toBeNull();
      expect(extractor.extractRFIDTag('SF_RFID: TBD')).toBeNull();
      // Missing
      expect(extractor.extractRFIDTag('No RFID here')).toBeNull();
      expect(extractor.extractRFIDTag('')).toBeNull();
    });

    test('extractValueRating', () => {
      // Without brackets
      expect(extractor.extractValueRating('SF_ValueRating: 3')).toBe(3);
      expect(extractor.extractValueRating('sf_valuerating: 5')).toBe(5);
      // With brackets (production format)
      expect(extractor.extractValueRating('SF_ValueRating: [1]')).toBe(1);
      expect(extractor.extractValueRating('SF_ValueRating: [4]')).toBe(4);
      // Invalid values
      expect(extractor.extractValueRating('SF_ValueRating: 0')).toBe(0); // Invalid
      expect(extractor.extractValueRating('SF_ValueRating: [0]')).toBe(0); // Invalid
      expect(extractor.extractValueRating('SF_ValueRating: 6')).toBe(0); // Invalid
      expect(extractor.extractValueRating('SF_ValueRating: [6]')).toBe(0); // Invalid
      expect(extractor.extractValueRating('No rating here')).toBe(0);
    });

    test('extractMemoryType', () => {
      // Without brackets
      expect(extractor.extractMemoryType('SF_MemoryType: Personal')).toBe('Personal');
      expect(extractor.extractMemoryType('sf_memorytype: Business')).toBe('Business');
      expect(extractor.extractMemoryType('SF_MemoryType: Technical')).toBe('Technical');
      // With brackets (production format)
      expect(extractor.extractMemoryType('SF_MemoryType: [Personal]')).toBe('Personal');
      expect(extractor.extractMemoryType('SF_MemoryType: [Business]')).toBe('Business');
      expect(extractor.extractMemoryType('SF_MemoryType: [Technical]')).toBe('Technical');
      // Invalid
      expect(extractor.extractMemoryType('SF_MemoryType: Invalid')).toBeNull();
      expect(extractor.extractMemoryType('SF_MemoryType: [Invalid]')).toBeNull();
      expect(extractor.extractMemoryType('No type here')).toBeNull();
    });

    test('extractMemoryGroup', () => {
      // Without brackets
      expect(extractor.extractMemoryGroup('SF_Group: Ephemeral Echo (10x)'))
        .toEqual({ group: 'Ephemeral Echo', multiplier: 10.0 });
      expect(extractor.extractMemoryGroup('sf_group: Test Group (2.5x)'))
        .toEqual({ group: 'Test Group', multiplier: 2.5 });
      // With brackets (production format)
      expect(extractor.extractMemoryGroup('SF_Group: [Ephemeral Echo (x10)]'))
        .toEqual({ group: 'Ephemeral Echo', multiplier: 10.0 });
      expect(extractor.extractMemoryGroup('SF_Group: [Digital Archive (5x)]'))
        .toEqual({ group: 'Digital Archive', multiplier: 5.0 });
      // Missing
      expect(extractor.extractMemoryGroup('No group here'))
        .toEqual({ group: null, multiplier: 1.0 });
    });
  });

  describe('value calculations', () => {
    test('getBaseValue', () => {
      expect(extractor.getBaseValue(1)).toBe(GameConstants.MEMORY_VALUE.BASE_VALUES[1]);
      expect(extractor.getBaseValue(2)).toBe(GameConstants.MEMORY_VALUE.BASE_VALUES[2]);
      expect(extractor.getBaseValue(3)).toBe(GameConstants.MEMORY_VALUE.BASE_VALUES[3]);
      expect(extractor.getBaseValue(4)).toBe(GameConstants.MEMORY_VALUE.BASE_VALUES[4]);
      expect(extractor.getBaseValue(5)).toBe(GameConstants.MEMORY_VALUE.BASE_VALUES[5]);
      expect(extractor.getBaseValue(0)).toBe(0);
      expect(extractor.getBaseValue(6)).toBe(0);
    });

    test('getTypeMultiplier', () => {
      expect(extractor.getTypeMultiplier('Personal')).toBe(GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS.Personal);
      expect(extractor.getTypeMultiplier('Business')).toBe(GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS.Business);
      expect(extractor.getTypeMultiplier('Technical')).toBe(GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS.Technical);
      expect(extractor.getTypeMultiplier('Invalid')).toBe(1.0);
      expect(extractor.getTypeMultiplier(null)).toBe(1.0);
    });

    test('calculateIndividualTokenValue', () => {
      // Base cases - calculate expected values from GameConstants
      const expected3Personal = GameConstants.MEMORY_VALUE.BASE_VALUES[3] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS.Personal;
      const expected2Business = GameConstants.MEMORY_VALUE.BASE_VALUES[2] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS.Business;
      const expected1Technical = GameConstants.MEMORY_VALUE.BASE_VALUES[1] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS.Technical;
      const expected2Personal = GameConstants.MEMORY_VALUE.BASE_VALUES[2] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS.Personal;
      const expected3Default = GameConstants.MEMORY_VALUE.BASE_VALUES[3] * 1;

      expect(extractor.calculateIndividualTokenValue(3, 'Personal')).toBe(expected3Personal);
      expect(extractor.calculateIndividualTokenValue(2, 'Business')).toBe(expected2Business);
      expect(extractor.calculateIndividualTokenValue(1, 'Technical')).toBe(expected1Technical);

      // Group multiplier should NOT be applied (that's for completion bonuses)
      expect(extractor.calculateIndividualTokenValue(2, 'Personal', 10)).toBe(expected2Personal);

      // Edge cases
      expect(extractor.calculateIndividualTokenValue(0, 'Personal')).toBe(0);
      expect(extractor.calculateIndividualTokenValue(3, null)).toBe(expected3Default);
    });
  });

  describe('comprehensive extraction', () => {
    test('extractMemoryData - complete token', () => {
      const description = `A memory token containing critical information.
                SF_RFID: MEM001
                SF_ValueRating: 4
                SF_MemoryType: Technical
                SF_Group: Ephemeral Echo (10x)
                Additional description here.`;

      const result = extractor.extractMemoryData(description);

      expect(result).toEqual({
        rfidTag: 'MEM001',
        valueRating: 4,
        memoryType: 'Technical',
        memoryGroup: 'Ephemeral Echo',
        groupMultiplier: 10.0,
        calculatedValue: 50000 // $5000 * 10 (Technical)
      });
    });

    test('extractMemoryData - partial token', () => {
      const description = `SF_RFID: ABC123
                SF_ValueRating: 2
                Some other content.`;

      const result = extractor.extractMemoryData(description);

      expect(result).toEqual({
        rfidTag: 'ABC123',
        valueRating: 2,
        memoryType: null,
        memoryGroup: null,
        groupMultiplier: 1.0,
        calculatedValue: 500 // $500 * 1 (no type)
      });
    });

    test('extractMemoryData - no memory data', () => {
      const description = 'Just a regular element with no memory fields.';

      const result = extractor.extractMemoryData(description);

      expect(result).toEqual({
        rfidTag: null,
        valueRating: 0,
        memoryType: null,
        memoryGroup: null,
        groupMultiplier: 1.0,
        calculatedValue: 0
      });
    });

    test('extractMemoryData - empty/null input', () => {
      expect(extractor.extractMemoryData('')).toEqual({
        rfidTag: null,
        valueRating: 0,
        memoryType: null,
        memoryGroup: null,
        groupMultiplier: 1.0,
        calculatedValue: 0
      });

      expect(extractor.extractMemoryData(null)).toEqual({
        rfidTag: null,
        valueRating: 0,
        memoryType: null,
        memoryGroup: null,
        groupMultiplier: 1.0,
        calculatedValue: 0
      });
    });
  });

  describe('database integration', () => {
    beforeEach(() => {
      // Create test elements table
      db.exec(`
                CREATE TABLE IF NOT EXISTS elements (
                    id TEXT PRIMARY KEY,
                    name TEXT,
                    description TEXT,
                    rfid_tag TEXT,
                    value_rating INTEGER DEFAULT 0,
                    memory_type TEXT,
                    memory_group TEXT,
                    group_multiplier REAL DEFAULT 1.0,
                    calculated_memory_value INTEGER DEFAULT 0
                )
            `);

      // Insert test data
      db.prepare('INSERT INTO elements (id, name, description) VALUES (?, ?, ?)').run(
        'test1',
        'Test Memory Token',
        'SF_RFID: MEM001\nSF_ValueRating: 3\nSF_MemoryType: Business\nSF_Group: Ephemeral Echo (5x)'
      );

      db.prepare('INSERT INTO elements (id, name, description) VALUES (?, ?, ?)').run(
        'test2',
        'Regular Element',
        'Just a regular element with no memory data.'
      );
    });

    afterEach(() => {
      db.exec('DROP TABLE IF EXISTS elements');
    });

    test('extractAllMemoryValues updates database correctly', async () => {
      const updatedCount = await extractor.extractAllMemoryValues();

      expect(updatedCount).toBe(1); // Only memory token should be updated

      const memoryToken = db.prepare('SELECT * FROM elements WHERE id = ?').get('test1');
      expect(memoryToken.rfid_tag).toBe('MEM001');
      expect(memoryToken.value_rating).toBe(3);
      expect(memoryToken.memory_type).toBe('Business');
      expect(memoryToken.memory_group).toBe('Ephemeral Echo');
      expect(memoryToken.group_multiplier).toBe(5.0);
      const expectedBusinessValue = GameConstants.MEMORY_VALUE.BASE_VALUES[3] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS.Business;
      expect(memoryToken.calculated_memory_value).toBe(expectedBusinessValue);

      const regularElement = db.prepare('SELECT * FROM elements WHERE id = ?').get('test2');
      expect(regularElement.rfid_tag).toBeNull();
      expect(regularElement.value_rating).toBe(0);
      expect(regularElement.calculated_memory_value).toBe(0);
    });

    test('Howie memory token scenario from production', async () => {
      // Insert Howie's actual memory token from production
      db.prepare('INSERT INTO elements (id, name, description) VALUES (?, ?, ?)').run(
        'howie-token',
        'Howie\'s Memory Token: "Elara Vance - Soil of Insight" Lecture Excerpt',
        `Audio memory token from Howie's lecture containing his passionate explanation of Elara Vance's methods. Content: "...Elara Vance didn't force genius; she *cultivated its soil*. Specific sound frequencies – birdsong at dawn, for instance. Botanical infusions – her 'Lucidity Bloom' tea, not for sedation but for *expansion*. She understood: our minds are gardens, not machines." The recording captures his gentle intensity and philosophical approach.

SF_RFID: [TBD]
SF_ValueRating: [1]
SF_MemoryType: [Personal]
SF_Group: [Ephemeral Echo (x10)]`
      );

      const updatedCount = await extractor.extractAllMemoryValues();
      expect(updatedCount).toBeGreaterThan(0);

      const howieToken = db.prepare('SELECT * FROM elements WHERE id = ?').get('howie-token');
      expect(howieToken.rfid_tag).toBeNull(); // TBD should be ignored
      expect(howieToken.value_rating).toBe(1);
      expect(howieToken.memory_type).toBe('Personal');
      expect(howieToken.memory_group).toBe('Ephemeral Echo');
      expect(howieToken.group_multiplier).toBe(10.0);
      expect(howieToken.calculated_memory_value).toBe(200); // $100 * 2 (Personal)
    });
  });
});