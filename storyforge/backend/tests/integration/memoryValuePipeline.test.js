const TestDbSetup = require('../utils/testDbSetup');
const MemoryValueExtractor = require('../../src/services/compute/MemoryValueExtractor');
const MemoryValueComputer = require('../../src/services/compute/MemoryValueComputer');
const ComputeOrchestrator = require('../../src/services/compute/ComputeOrchestrator');
const GameConstants = require('../../src/config/GameConstants');

describe('Memory Value Extraction Pipeline Integration', () => {
  let dbSetup;
  let db;
  let extractor;
  let computer;
  let orchestrator;

  beforeAll(async () => {
    dbSetup = new TestDbSetup();
    await dbSetup.initialize();
    db = dbSetup.getDb();
    
    extractor = new MemoryValueExtractor(db);
    computer = new MemoryValueComputer(db);
    orchestrator = new ComputeOrchestrator(db);
  });

  afterEach(async () => {
    await dbSetup.clearData();
  });

  afterAll(async () => {
    await dbSetup.close();
  });

  describe('End-to-End Memory Value Computation', () => {
    it('should extract memory values from element descriptions and compute character totals', async () => {
      // Insert test data matching production format
      const elements = [
        {
          id: 'elem-1',
          name: 'Business Memory Token',
          description: 'A memory of a corporate merger... SF_RFID: [12345] SF_ValueRating: [3] SF_MemoryType: [Business]',
          owner_id: 'char-1'
        },
        {
          id: 'elem-2',
          name: 'Personal Memory Token',
          description: 'A memory of first love... SF_RFID: [67890] SF_ValueRating: [5] SF_MemoryType: [Personal]',
          owner_id: 'char-1'
        },
        {
          id: 'elem-3',
          name: 'Technical Memory Token',
          description: 'Code breakthrough memory... SF_RFID: [11111] SF_ValueRating: [2] SF_MemoryType: [Technical] SF_Group: [Innovations (x1)]',
          owner_id: 'char-2'
        },
        {
          id: 'elem-4',
          name: 'Another Tech Memory',
          description: 'Algorithm discovery... SF_RFID: [22222] SF_ValueRating: [4] SF_MemoryType: [Technical] SF_Group: [Innovations (x1)]',
          owner_id: 'char-2'
        }
      ];

      const characters = [
        { id: 'char-1', name: 'Alex Reeves' },
        { id: 'char-2', name: 'Marcus Blackwood' }
      ];

      // Insert characters
      for (const char of characters) {
        dbSetup.insertTestCharacter(char);
      }

      // Insert elements
      for (const elem of elements) {
        await dbSetup.insertTestElement(elem);
      }

      // Create ownership relationships
      dbSetup.createCharacterElementLink('char-1', 'elem-1', true);
      dbSetup.createCharacterElementLink('char-1', 'elem-2', true);
      dbSetup.createCharacterElementLink('char-2', 'elem-3', true);
      dbSetup.createCharacterElementLink('char-2', 'elem-4', true);

      // Step 1: Extract memory values from descriptions
      const extractionResult = await extractor.extractAllMemoryValues();
      expect(extractionResult).toBe(4);

      // Verify extraction worked correctly using GameConstants
      const elem1 = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem-1');
      const elem1Expected = GameConstants.MEMORY_VALUE.BASE_VALUES[3] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS['Business']; // $1000 * 5
      expect(elem1.calculated_memory_value).toBe(elem1Expected);
      expect(elem1.rfid_tag).toBe('12345');
      expect(elem1.memory_type).toBe('Business');

      const elem2 = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem-2');
      const elem2Expected = GameConstants.MEMORY_VALUE.BASE_VALUES[5] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS['Personal']; // $10000 * 2
      expect(elem2.calculated_memory_value).toBe(elem2Expected);

      const elem3 = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem-3');
      const elem3Expected = GameConstants.MEMORY_VALUE.BASE_VALUES[2] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS['Technical']; // $500 * 10
      expect(elem3.calculated_memory_value).toBe(elem3Expected);
      expect(elem3.memory_group).toBe('Innovations');

      const elem4 = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem-4');
      const elem4Expected = GameConstants.MEMORY_VALUE.BASE_VALUES[4] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS['Technical']; // $5000 * 10
      expect(elem4.calculated_memory_value).toBe(elem4Expected);

      // Step 2: Compute character totals
      const computeResult = await computer.computeAllCharacterMemoryValues();
      expect(computeResult).toBe(2);

      // Verify character totals
      const char1 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char-1');
      const char1Expected = elem1Expected + elem2Expected; // Business + Personal tokens
      expect(char1.total_memory_value).toBe(char1Expected);

      const char2 = db.prepare('SELECT * FROM characters WHERE id = ?').get('char-2');
      const char2Expected = elem3Expected + elem4Expected; // Both Technical tokens
      expect(char2.total_memory_value).toBe(char2Expected);

      // Step 3: Test group completion bonus (same group = 50% bonus)
      // TODO: Implement computeGroupCompletionBonus method in MemoryValueComputer
      // const groupResult = await computer.computeGroupCompletionBonus('char-2');
      // expect(groupResult.groups.Innovations.count).toBe(2);
      // expect(groupResult.groups.Innovations.baseValue).toBe(55000);
      // expect(groupResult.groups.Innovations.bonusValue).toBe(27500); // 50% bonus
      // expect(groupResult.totalBonus).toBe(27500);
    });

    it('should handle full pipeline through ComputeOrchestrator', async () => {
      // Insert test data
      const char = { id: 'char-test', name: 'Test Character' };
      const elem = {
        id: 'elem-test',
        name: 'Test Memory',
        description: 'Memory with SF_ValueRating: [4] SF_MemoryType: Business',
        owner_id: 'char-test'
      };

      dbSetup.insertTestCharacter(char);
      await dbSetup.insertTestElement(elem);
      dbSetup.createCharacterElementLink('char-test', 'elem-test', true);

      // Run full compute pipeline
      const result = await orchestrator.computeAll();

      // Verify results
      expect(result.processed).toBeGreaterThan(0);
      expect(result.errors).toBe(0);

      // Check memory values were computed
      const updatedElem = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem-test');
      expect(updatedElem.calculated_memory_value).toBe(25000); // $5000 * 5

      const updatedChar = db.prepare('SELECT * FROM characters WHERE id = ?').get('char-test');
      expect(updatedChar.total_memory_value).toBe(25000);
    });

    it('should handle edge cases gracefully', async () => {
      const edgeCases = [
        {
          id: 'edge-1',
          name: 'Missing SF tags',
          description: 'A memory with no tags',
          owner_id: null
        },
        {
          id: 'edge-2',
          name: 'Invalid value rating',
          description: 'SF_ValueRating: [99] SF_MemoryType: Personal',
          owner_id: null
        },
        {
          id: 'edge-3',
          name: 'Malformed brackets',
          description: 'SF_ValueRating: ]3[ SF_MemoryType: Business',
          owner_id: null
        }
      ];

      for (const elem of edgeCases) {
        await dbSetup.insertTestElement(elem);
      }

      const result = await extractor.extractAllMemoryValues();
      expect(result).toBe(2); // edge-1 has no tags, edge-2 and edge-3 are invalid but still processed

      // All should have 0 value due to invalid/missing data
      for (const elem of edgeCases) {
        const dbElem = db.prepare('SELECT * FROM elements WHERE id = ?').get(elem.id);
        expect(dbElem.calculated_memory_value).toBe(0);
      }
    });

    it('should update character totals when elements change ownership', async () => {
      // Setup initial state
      const chars = [
        { id: 'owner-1', name: 'Original Owner' },
        { id: 'owner-2', name: 'New Owner' }
      ];
      
      for (const char of chars) {
        dbSetup.insertTestCharacter(char);
      }

      const elem = {
        id: 'transfer-elem',
        name: 'Transferable Memory',
        description: 'SF_ValueRating: [5] SF_MemoryType: Technical',
        owner_id: 'owner-1'
      };
      await dbSetup.insertTestElement(elem);
      dbSetup.createCharacterElementLink('owner-1', 'transfer-elem', true);

      // Extract and compute initial state
      await extractor.extractAllMemoryValues();
      await computer.computeAllCharacterMemoryValues();

      const owner1Before = db.prepare('SELECT * FROM characters WHERE id = ?').get('owner-1');
      // Expected: Rating 5 = $10,000 base * Technical multiplier 10.0 = $100,000
      const expectedValue = GameConstants.MEMORY_VALUE.BASE_VALUES[5] * GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS['Technical'];
      expect(owner1Before.total_memory_value).toBe(expectedValue);

      // Transfer ownership
      db.prepare('DELETE FROM character_owned_elements WHERE element_id = ?').run('transfer-elem');
      dbSetup.createCharacterElementLink('owner-2', 'transfer-elem', true);

      // Recompute
      await computer.computeAllCharacterMemoryValues();

      const owner1After = db.prepare('SELECT * FROM characters WHERE id = ?').get('owner-1');
      const owner2After = db.prepare('SELECT * FROM characters WHERE id = ?').get('owner-2');
      
      expect(owner1After.total_memory_value).toBe(0);
      expect(owner2After.total_memory_value).toBe(expectedValue);
    });
  });

  describe('Performance Requirements', () => {
    it('should meet performance targets for large datasets', async () => {
      // Create 100 elements as per requirements
      const elements = [];
      for (let i = 0; i < 100; i++) {
        const valueRating = (i % 5) + 1;
        const memoryType = ['Personal', 'Business', 'Technical'][i % 3];
        elements.push({
          id: `perf-elem-${i}`,
          name: `Memory ${i}`,
          description: `Test memory SF_ValueRating: [${valueRating}] SF_MemoryType: ${memoryType}`,
          owner_id: `perf-char-${i % 20}` // Distribute among 20 characters
        });
      }

      // Create 20 characters
      for (let i = 0; i < 20; i++) {
        dbSetup.insertTestCharacter({
          id: `perf-char-${i}`,
          name: `Character ${i}`
        });
      }

      // Insert elements and create ownership
      for (const elem of elements) {
        await dbSetup.insertTestElement(elem);
        dbSetup.createCharacterElementLink(elem.owner_id, elem.id, true);
      }

      // Measure extraction performance
      const extractStart = Date.now();
      const extractResult = await extractor.extractAllMemoryValues();
      const extractTime = Date.now() - extractStart;

      expect(extractResult).toBe(100);
      expect(extractTime).toBeLessThan(3000); // Should be well under 3s

      // Measure computation performance
      const computeStart = Date.now();
      const computeResult = await computer.computeAllCharacterMemoryValues();
      const computeTime = Date.now() - computeStart;

      expect(computeResult).toBe(20);
      expect(computeTime).toBeLessThan(2000); // Should be well under 2s
    });
  });
});