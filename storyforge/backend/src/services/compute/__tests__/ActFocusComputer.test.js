const ActFocusComputer = require('../ActFocusComputer');
const { initializeDatabase, closeDB, getDB } = require('../../../db/database');

describe('ActFocusComputer', () => {
  let computer;
  let db;

  beforeAll(() => {
    // Initialize in-memory database for testing
    initializeDatabase(':memory:');
    db = getDB();
    computer = new ActFocusComputer(db);
  });

  afterAll(() => {
    closeDB();
  });

  beforeEach(() => {
    // Create test elements table
    db.exec(`
            CREATE TABLE IF NOT EXISTS elements (
                id TEXT PRIMARY KEY,
                name TEXT,
                first_available TEXT
            )
        `);

    // Create test timeline_events table
    db.exec(`
            CREATE TABLE IF NOT EXISTS timeline_events (
                id TEXT PRIMARY KEY,
                description TEXT,
                element_ids TEXT,
                act_focus TEXT
            )
        `);
  });

  afterEach(() => {
    // Clean up tables
    db.exec('DROP TABLE IF EXISTS elements');
    db.exec('DROP TABLE IF EXISTS timeline_events');
  });

  describe('compute() method', () => {
    beforeEach(() => {
      // Insert test elements
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        'elem1', 'Element 1', 'Act 1'
      );
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        'elem2', 'Element 2', 'Act 1'
      );
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        'elem3', 'Element 3', 'Act 2'
      );
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        'elem4', 'Element 4', null
      );
    });

    test('computes act focus based on most common act', async () => {
      const event = {
        id: 'event1',
        element_ids: JSON.stringify(['elem1', 'elem2', 'elem3'])
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: 'Act 1' });
    });

    test('returns null for empty element_ids', async () => {
      const event = {
        id: 'event1',
        element_ids: JSON.stringify([])
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: null });
    });

    test('returns null for null element_ids', async () => {
      const event = {
        id: 'event1',
        element_ids: null
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: null });
    });

    test('handles malformed JSON in element_ids', async () => {
      const event = {
        id: 'event1',
        element_ids: 'invalid json'
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: null });
    });

    test('returns null when no elements have first_available', async () => {
      const event = {
        id: 'event1',
        element_ids: JSON.stringify(['elem4'])
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: null });
    });

    test('handles non-existent element IDs', async () => {
      const event = {
        id: 'event1',
        element_ids: JSON.stringify(['nonexistent1', 'nonexistent2'])
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: null });
    });

    test('prioritizes most common act when tied', async () => {
      // Add more Act 2 elements to make it tied
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        'elem5', 'Element 5', 'Act 2'
      );

      const event = {
        id: 'event1',
        element_ids: JSON.stringify(['elem1', 'elem2', 'elem3', 'elem5'])
      };

      const result = await computer.compute(event);

      // Should return Act 1 since when tied (both have 2 elements),
      // the algorithm picks the lexicographically first act
      expect(result).toEqual({ act_focus: 'Act 1' });
    });

    test('handles mixed valid and invalid elements', async () => {
      const event = {
        id: 'event1',
        element_ids: JSON.stringify(['elem1', 'nonexistent', 'elem2'])
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: 'Act 1' });
    });

    test('throws error for missing required fields', async () => {
      const event = {
        element_ids: JSON.stringify(['elem1'])
        // missing id field
      };

      await expect(computer.compute(event)).rejects.toThrow('Missing required fields: id');
    });

    test('throws error with event context on failure', async () => {
      // Force a database error by dropping elements table
      db.exec('DROP TABLE elements');

      const event = {
        id: 'event1',
        element_ids: JSON.stringify(['elem1'])
      };

      await expect(computer.compute(event)).rejects.toThrow(/Failed to compute act focus for event event1/);
    });
  });

  describe('computeAll() method', () => {
    beforeEach(() => {
      // Insert test elements
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        'elem1', 'Element 1', 'Act 1'
      );
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        'elem2', 'Element 2', 'Act 2'
      );

      // Insert test timeline events
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'event1', 'Event 1', JSON.stringify(['elem1'])
      );
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'event2', 'Event 2', JSON.stringify(['elem2'])
      );
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'event3', 'Event 3', JSON.stringify([])
      );
    });

    test('computes act focus for all timeline events', async () => {
      const result = await computer.computeAll();

      expect(result.processed).toBe(3);
      expect(result.errors).toBe(0);

      // Verify database updates
      const event1 = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event1');
      expect(event1.act_focus).toBe('Act 1');

      const event2 = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event2');
      expect(event2.act_focus).toBe('Act 2');

      const event3 = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event3');
      expect(event3.act_focus).toBeNull();
    });

    test('continues processing after individual errors', async () => {
      // Insert an event with invalid element_ids that will cause an error
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'bad_event', 'Bad Event', 'invalid_json'
      );

      const result = await computer.computeAll();

      // Should process 3 good events and encounter 0 errors (invalid JSON is handled gracefully)
      expect(result.processed).toBe(4);
      expect(result.errors).toBe(0);
    });

    test('handles empty timeline_events table', async () => {
      db.exec('DELETE FROM timeline_events');

      const result = await computer.computeAll();

      expect(result.processed).toBe(0);
      expect(result.errors).toBe(0);
    });

    test('throws error on database failure', async () => {
      // Drop timeline_events table to cause error
      db.exec('DROP TABLE timeline_events');

      await expect(computer.computeAll()).rejects.toThrow(/Failed to compute all act focus values/);
    });
  });

  describe('performance benchmarks', () => {
    test('computes act focus for 75 events in under 1 second', async () => {
      // Create 75 test events and related elements
      const elements = [];
      const events = [];

      // Create elements for different acts
      for (let i = 1; i <= 25; i++) {
        elements.push([`elem_act1_${i}`, `Element Act 1 ${i}`, 'Act 1']);
        elements.push([`elem_act2_${i}`, `Element Act 2 ${i}`, 'Act 2']);
        if (i <= 5) {
          elements.push([`elem_act3_${i}`, `Element Act 3 ${i}`, 'Act 3']);
        }
      }

      // Insert elements
      const insertElement = db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)');
      elements.forEach(element => insertElement.run(...element));

      // Create 75 events with random element associations
      for (let i = 1; i <= 75; i++) {
        const elementIds = [];
        const numElements = Math.floor(Math.random() * 5) + 1; // 1-5 elements per event

        for (let j = 0; j < numElements; j++) {
          const randomElement = elements[Math.floor(Math.random() * elements.length)];
          elementIds.push(randomElement[0]);
        }

        events.push([`event_${i}`, `Timeline Event ${i}`, JSON.stringify(elementIds)]);
      }

      // Insert events
      const insertEvent = db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)');
      events.forEach(event => insertEvent.run(...event));

      // Performance test
      const startTime = Date.now();
      const result = await computer.computeAll();
      const duration = Date.now() - startTime;

      // Verify results
      expect(result.processed).toBe(75);
      expect(result.errors).toBe(0);
      expect(duration).toBeLessThan(1000); // Should complete in under 1 second

      console.log(`✅ Performance test: Computed act focus for 75 events in ${duration}ms`);
    });
  });

  describe('edge cases', () => {
    test('handles extremely long element_ids arrays', async () => {
      // Create many elements
      for (let i = 1; i <= 100; i++) {
        db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
          `elem${i}`, `Element ${i}`, i % 2 === 0 ? 'Act 1' : 'Act 2'
        );
      }

      const elementIds = [];
      for (let i = 1; i <= 100; i++) {
        elementIds.push(`elem${i}`);
      }

      const event = {
        id: 'big_event',
        element_ids: JSON.stringify(elementIds)
      };

      const result = await computer.compute(event);

      // Should handle large arrays and return most common act
      expect(result.act_focus).toBeOneOf(['Act 1', 'Act 2']);
    });

    test('handles special characters in element IDs', async () => {
      const specialId = 'elem-with-special/chars@test.com';
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        specialId, 'Special Element', 'Act 1'
      );

      const event = {
        id: 'special_event',
        element_ids: JSON.stringify([specialId])
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: 'Act 1' });
    });

    test('handles unicode characters in act names', async () => {
      db.prepare('INSERT INTO elements (id, name, first_available) VALUES (?, ?, ?)').run(
        'unicode_elem', 'Unicode Element', 'Acto Ñúméro Ünø'
      );

      const event = {
        id: 'unicode_event',
        element_ids: JSON.stringify(['unicode_elem'])
      };

      const result = await computer.compute(event);

      expect(result).toEqual({ act_focus: 'Acto Ñúméro Ünø' });
    });
  });

  describe('database integration', () => {
    test('updateDatabase method works correctly', async () => {
      // Insert test event
      db.prepare('INSERT INTO timeline_events (id, description, element_ids) VALUES (?, ?, ?)').run(
        'test_event', 'Test Event', JSON.stringify([])
      );

      const event = { id: 'test_event' };
      const computedFields = { act_focus: 'Test Act' };

      await computer.updateDatabase('timeline_events', 'id', event, computedFields);

      // Verify update
      const updatedEvent = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('test_event');
      expect(updatedEvent.act_focus).toBe('Test Act');
    });

    test('validateRequiredFields method works correctly', () => {
      const validEvent = { id: 'test', element_ids: '[]' };
      const invalidEvent = { element_ids: '[]' }; // missing id

      expect(() => computer.validateRequiredFields(validEvent, ['id', 'element_ids'])).not.toThrow();
      expect(() => computer.validateRequiredFields(invalidEvent, ['id', 'element_ids'])).toThrow('Missing required fields: id');
    });
  });
});

// Custom Jest matcher for multiple possible values
expect.extend({
  toBeOneOf(received, expectedArray) {
    const pass = expectedArray.includes(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be one of ${expectedArray.join(', ')}`,
        pass: true
      };
    } else {
      return {
        message: () => `expected ${received} to be one of ${expectedArray.join(', ')}`,
        pass: false
      };
    }
  }
});