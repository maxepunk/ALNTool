const TestDbSetup = require('../../../../tests/utils/testDbSetup');
const ActFocusComputer = require('../ActFocusComputer');

describe('ActFocusComputer Integration Tests', () => {
  let db;
  let computer;
  let testSetup;

  beforeEach(() => {
    testSetup = new TestDbSetup();
    testSetup.initialize();
    db = testSetup.getDb();
    computer = new ActFocusComputer(db);

    // Create test data
    // Elements with different acts
    db.prepare(`
      INSERT INTO elements (id, name, first_available) VALUES
      ('el1', 'Act 1 Element 1', 'Act 1'),
      ('el2', 'Act 1 Element 2', 'Act 1'),
      ('el3', 'Act 2 Element', 'Act 2'),
      ('el4', 'No Act Element', NULL),
      ('el5', 'Act 1 Element 3', 'Act 1')
    `).run();

    // Timeline events with different element combinations
    db.prepare(`
      INSERT INTO timeline_events (id, description, element_ids) VALUES
      ('ev1', 'Event with Act 1 elements only', '["el1", "el2"]'),
      ('ev2', 'Event with mixed acts', '["el1", "el3"]'),
      ('ev3', 'Event with Act 1 majority', '["el1", "el2", "el3"]'),
      ('ev4', 'Event with no act elements', '["el4"]'),
      ('ev5', 'Event with no elements', '[]'),
      ('ev6', 'Event with invalid JSON', '[invalid json'),
      ('ev7', 'Event with Act 2 element', '["el3"]')
    `).run();
  });

  afterEach(async () => {
    if (testSetup) {
      await testSetup.close();
    }
  });

  describe('compute', () => {
    it('should return Act 1 for events with only Act 1 elements', async () => {
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev1');
      const result = await computer.compute(event);
      expect(result.act_focus).toBe('Act 1');
    });

    it('should return Act 1 when Act 1 is more common', async () => {
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev3');
      const result = await computer.compute(event);
      expect(result.act_focus).toBe('Act 1');
    });

    it('should return Act 1 for tie (lexicographic ordering)', async () => {
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev2');
      const result = await computer.compute(event);
      expect(result.act_focus).toBe('Act 1'); // Act 1 comes before Act 2 lexicographically
    });

    it('should return null for elements without acts', async () => {
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev4');
      const result = await computer.compute(event);
      expect(result.act_focus).toBeNull();
    });

    it('should return null for events with no elements', async () => {
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev5');
      const result = await computer.compute(event);
      expect(result.act_focus).toBeNull();
    });

    it('should handle invalid JSON gracefully', async () => {
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev6');
      const result = await computer.compute(event);
      expect(result.act_focus).toBeNull();
    });

    it('should return Act 2 for Act 2 only events', async () => {
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev7');
      const result = await computer.compute(event);
      expect(result.act_focus).toBe('Act 2');
    });
  });

  describe('computeAll', () => {
    it('should compute act focus for all events', async () => {
      const stats = await computer.computeAll();

      expect(stats.processed).toBe(7);
      expect(stats.errors).toBe(0);

      // Verify the updates
      const ev1 = db.prepare('SELECT act_focus FROM timeline_events WHERE id = ?').get('ev1');
      expect(ev1.act_focus).toBe('Act 1');

      const ev4 = db.prepare('SELECT act_focus FROM timeline_events WHERE id = ?').get('ev4');
      expect(ev4.act_focus).toBeNull();

      const ev7 = db.prepare('SELECT act_focus FROM timeline_events WHERE id = ?').get('ev7');
      expect(ev7.act_focus).toBe('Act 2');
    });

    it('should handle errors gracefully', async () => {
      // Insert an event that will cause an error (missing required field)
      db.prepare(`
        INSERT INTO timeline_events (id, description) VALUES
        ('ev_bad', 'Event without element_ids')
      `).run();

      const stats = await computer.computeAll();

      // The event without element_ids will be processed successfully (returns null act_focus)
      expect(stats.processed).toBe(8); // All events including the bad one
      expect(stats.errors).toBe(0); // No errors because missing element_ids is handled gracefully
    });
  });

  describe('edge cases', () => {
    it('should handle elements that do not exist', async () => {
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) VALUES
        ('ev_missing', 'Event with missing elements', '["missing1", "missing2"]')
      `).run();

      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev_missing');
      const result = await computer.compute(event);
      expect(result.act_focus).toBeNull();
    });

    it('should handle mixed existing and non-existing elements', async () => {
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) VALUES
        ('ev_mixed', 'Event with mixed elements', '["el1", "missing", "el2"]')
      `).run();

      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('ev_mixed');
      const result = await computer.compute(event);
      expect(result.act_focus).toBe('Act 1'); // Should still work with existing elements
    });
  });
});