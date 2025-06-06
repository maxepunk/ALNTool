const { computeCharacterPaths, computeEventActFocus } = require('../../src/services/compute/computeServices');
const TestDbSetup = require('../utils/testDbSetup');

let testDb;

beforeAll(async () => {
  testDb = new TestDbSetup();
  await testDb.initialize();
});

beforeEach(async () => {
  await testDb.clearData();
});

afterAll(async () => {
  if (testDb && testDb.db) {
    await testDb.db.close();
  }
});

describe('Compute Services', () => {
  describe('ActFocusComputer', () => {
    it('computes act focus based on most common act from elements', async () => {
      // Insert test data
      await testDb.insertTestElement('elem1', 'Act 1 Element', 'Act 1');
      await testDb.insertTestElement('elem2', 'Act 1 Element 2', 'Act 1');
      await testDb.insertTestElement('elem3', 'Act 2 Element', 'Act 2');
      await testDb.insertTestTimelineEvent('event1', 'Test Event', 'Act 1');
      await testDb.createCharacterElementLink('char1', 'elem1');
      await testDb.createCharacterElementLink('char1', 'elem2');
      await testDb.createCharacterElementLink('char1', 'elem3');

      const actFocus = await computeEventActFocus('event1');
      expect(actFocus).toBe('Act 1');
    });

    it('returns null for events with no elements', async () => {
      await testDb.insertTestTimelineEvent('event1', 'Test Event', 'Act 1');
      const actFocus = await computeEventActFocus('event1');
      expect(actFocus).toBeNull();
    });
  });

  describe('ResolutionPathComputer', () => {
    it('computes character paths based on owned elements', async () => {
      // Insert test data
      await testDb.insertTestCharacter('char1', 'Test Character');
      await testDb.insertTestElement('elem1', 'Black Market Element', 'Act 1', 'black_market');
      await testDb.insertTestElement('elem2', 'Detective Element', 'Act 1', 'detective');
      await testDb.createCharacterElementLink('char1', 'elem1', true);
      await testDb.createCharacterElementLink('char1', 'elem2', true);

      const paths = await computeCharacterPaths('char1');
      expect(paths).toContain('black_market');
      expect(paths).toContain('detective');
    });

    it('computes puzzle paths based on narrative threads', async () => {
      // Insert test data
      await testDb.insertTestPuzzle('puzzle1', 'Test Puzzle', ['black_market', 'detective']);
      const paths = await computeCharacterPaths('puzzle1');
      expect(paths).toContain('black_market');
      expect(paths).toContain('detective');
    });

    it('computes element paths based on type and name', async () => {
      // Insert test elements
      await testDb.insertTestElement({
        id: 'elem1',
        name: 'Black Market Deal',
        type: 'Interaction',
        description: 'A black market deal',
        status: 'Active'
      });
      
      await testDb.insertTestElement({
        id: 'elem2',
        name: 'Detective Clue',
        type: 'Evidence',
        description: 'A detective clue',
        status: 'Active'
      });
      
      // Compute paths
      const paths1 = await computeCharacterPaths('elem1');
      const paths2 = await computeCharacterPaths('elem2');
      
      expect(paths1).toContain('Black Market');
      expect(paths2).toContain('Detective');
    });
  });

  describe('ComputeOrchestrator', () => {
    it('computes all derived fields for all entities', async () => {
      // Insert test data
      await testDb.insertTestCharacter('char1', 'Test Character');
      await testDb.insertTestElement('elem1', 'Test Element', 'Act 1');
      await testDb.insertTestPuzzle('puzzle1', 'Test Puzzle');
      await testDb.insertTestTimelineEvent('event1', 'Test Event', 'Act 1');

      // Compute all fields
      const results = await Promise.all([
        computeCharacterPaths('char1'),
        computeEventActFocus('event1')
      ]);
      
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
    });

    it('handles errors gracefully during computation', async () => {
      const result = await computeCharacterPaths('nonexistent');
      expect(result).toEqual([]);
    });
  });
}); 