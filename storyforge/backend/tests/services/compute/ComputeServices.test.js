const TestDbSetup = require('../../utils/testDbSetup');
const DerivedFieldComputer = require('../../../src/services/compute/DerivedFieldComputer');
const ActFocusComputer = require('../../../src/services/compute/ActFocusComputer');
const ResolutionPathComputer = require('../../../src/services/compute/ResolutionPathComputer');
const ComputeOrchestrator = require('../../../src/services/compute/ComputeOrchestrator');

describe('Compute Services', () => {
  let dbSetup;
  let db;
  let orchestrator;

  beforeAll(async () => {
    // Initialize test database with migrations
    dbSetup = new TestDbSetup();
    await dbSetup.initialize();
    db = dbSetup.getDb();
  });

  beforeEach(async () => {
    // Clear tables before each test
    await dbSetup.clearData();
    
    // Create orchestrator
    orchestrator = new ComputeOrchestrator(db);
  });

  afterAll(async () => {
    await dbSetup.close();
  });

  describe('ActFocusComputer', () => {
    let computer;

    beforeEach(() => {
      computer = new ActFocusComputer(db);
    });

    it('computes act focus based on most common act from elements', async () => {
      // Insert test data
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('event1', 'Test Event', JSON.stringify(['elem1', 'elem2', 'elem3']));

      db.prepare(`
        INSERT INTO elements (id, name, type, first_available) 
        VALUES (?, ?, ?, ?)
      `).run('elem1', 'Element 1', 'Physical', 'Act 1');

      db.prepare(`
        INSERT INTO elements (id, name, type, first_available) 
        VALUES (?, ?, ?, ?)
      `).run('elem2', 'Element 2', 'Physical', 'Act 1');

      db.prepare(`
        INSERT INTO elements (id, name, type, first_available) 
        VALUES (?, ?, ?, ?)
      `).run('elem3', 'Element 3', 'Physical', 'Act 2');

      // Compute act focus
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event1');
      const result = await computer.compute(event);

      expect(result).toEqual({
        act_focus: 'Act 1'
      });

      // Note: compute() only returns the value, it doesn't save to DB
      // Only computeAll() saves to the database
    });

    it('handles empty element list', async () => {
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('event2', 'Empty Event', JSON.stringify([]));

      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event2');
      const result = await computer.compute(event);

      expect(result).toEqual({
        act_focus: null
      });
    });

    it('handles null element_ids', async () => {
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('event3', 'Null Event', null);

      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event3');
      const result = await computer.compute(event);

      expect(result).toEqual({
        act_focus: null
      });
    });
  });

  describe('ResolutionPathComputer', () => {
    let computer;

    beforeEach(() => {
      computer = new ResolutionPathComputer(db);
    });

    describe('character resolution paths', () => {
      it('assigns Detective path for characters with clue/evidence elements', async () => {
        // Create character and elements
        dbSetup.insertTestCharacter({ id: 'char1', name: 'Detective Character' });
        
        db.prepare(`
          INSERT INTO elements (id, name, type) VALUES (?, ?, ?)
        `).run('elem1', 'Investigation Clue', 'Physical');
        
        db.prepare(`
          INSERT INTO elements (id, name, type) VALUES (?, ?, ?)
        `).run('elem2', 'Evidence Bag', 'evidence');

        // Link elements to character
        dbSetup.createCharacterElementLink('char1', 'elem1', true);
        dbSetup.createCharacterElementLink('char1', 'elem2', true);

        // Compute resolution paths
        const character = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
        const result = await computer.compute(character, 'character');

        expect(result.resolution_paths).toBeDefined();
        const paths = JSON.parse(result.resolution_paths);
        expect(paths).toContain('Detective');
      });

      it('assigns Black Market path for characters with memory elements', async () => {
        // Create character and memory element
        dbSetup.insertTestCharacter({ id: 'char2', name: 'Memory Character' });
        
        db.prepare(`
          INSERT INTO elements (id, name, type) VALUES (?, ?, ?)
        `).run('elem3', 'Memory Token', 'memory');

        dbSetup.createCharacterElementLink('char2', 'elem3', true);

        const character = db.prepare('SELECT * FROM characters WHERE id = ?').get('char2');
        const result = await computer.compute(character, 'character');

        const paths = JSON.parse(result.resolution_paths);
        expect(paths).toContain('Black Market');
      });

      it('assigns Third Path for characters with high connections', async () => {
        // Create character with high connections
        db.prepare(`
          INSERT INTO characters (id, name, connections) VALUES (?, ?, ?)
        `).run('char3', 'Social Character', 7);

        const character = db.prepare('SELECT * FROM characters WHERE id = ?').get('char3');
        const result = await computer.compute(character, 'character');

        const paths = JSON.parse(result.resolution_paths);
        expect(paths).toContain('Third Path');
      });

      it('assigns Unassigned for characters with no qualifying criteria', async () => {
        dbSetup.insertTestCharacter({ id: 'char4', name: 'Basic Character' });

        const character = db.prepare('SELECT * FROM characters WHERE id = ?').get('char4');
        const result = await computer.compute(character, 'character');

        const paths = JSON.parse(result.resolution_paths);
        expect(paths).toContain('Unassigned');
      });
    });

    describe('element resolution paths', () => {
      it('assigns paths based on element type and name', async () => {
        // Create element that should get Detective path
        db.prepare(`
          INSERT INTO elements (id, name, type) VALUES (?, ?, ?)
        `).run('elem4', 'Investigation Clue', 'Physical');

        // Compute element paths
        const element = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem4');
        const result = await computer.compute(element, 'element');

        const paths = JSON.parse(result.resolution_paths);
        expect(paths).toContain('Detective'); // Has 'clue' in name
      });

      it('assigns Memory element types to Black Market', async () => {
        db.prepare(`
          INSERT INTO elements (id, name, type) VALUES (?, ?, ?)
        `).run('elem5', 'Memory Element', 'memory');

        const element = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem5');
        const result = await computer.compute(element, 'element');

        const paths = JSON.parse(result.resolution_paths);
        expect(paths).toContain('Black Market');
      });
    });

    describe('puzzle resolution paths', () => {
      it('assigns paths based on narrative threads', async () => {
        // Create puzzle with narrative threads
        dbSetup.insertTestPuzzle({ 
          id: 'puzzle1', 
          name: 'Test Puzzle',
          puzzle_element_ids: JSON.stringify(['elem6', 'elem7'])
        });
        
        // Update with computed narrative threads
        db.prepare('UPDATE puzzles SET computed_narrative_threads = ? WHERE id = ?')
          .run(JSON.stringify(['Corp. Espionage', 'Memory Drug']), 'puzzle1');

        // Compute puzzle paths
        const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle1');
        const result = await computer.compute(puzzle, 'puzzle');

        const paths = JSON.parse(result.resolution_paths);
        expect(paths).toContain('Detective'); // From Corp. Espionage thread
        expect(paths).toContain('Black Market'); // From Memory Drug thread
      });
    });
  });

  describe('ComputeOrchestrator', () => {
    it('orchestrates computation of all derived fields', async () => {
      // Insert comprehensive test data
      dbSetup.insertTestCharacter({ id: 'char7', name: 'Main Character' });
      dbSetup.insertTestTimelineEvent({ 
        id: 'event4', 
        description: 'Major Event' 
      });
      
      db.prepare(`
        INSERT INTO elements (id, name, type, first_available) 
        VALUES (?, ?, ?, ?)
      `).run('elem8', 'Investigation Clue', 'evidence', 'Act 2');

      db.prepare(`
        INSERT INTO puzzles (id, name, puzzle_element_ids) 
        VALUES (?, ?, ?)
      `).run('puzzle2', 'Story Puzzle', JSON.stringify(['elem8']));

      // Update timeline event with element
      db.prepare(`
        UPDATE timeline_events SET element_ids = ? WHERE id = ?
      `).run(JSON.stringify(['elem8']), 'event4');

      // Link everything together
      dbSetup.createCharacterElementLink('char7', 'elem8', true);

      // Run orchestrator
      const result = await orchestrator.computeAll();

      expect(result.processed).toBeGreaterThan(0);
      expect(result.errors).toBe(0);

      // Verify act focus was computed
      const event = db.prepare('SELECT act_focus FROM timeline_events WHERE id = ?').get('event4');
      expect(event.act_focus).toBe('Act 2');

      // Verify resolution paths were computed
      const character = db.prepare('SELECT resolution_paths FROM characters WHERE id = ?').get('char7');
      expect(character.resolution_paths).toBeDefined();
      const charPaths = JSON.parse(character.resolution_paths);
      expect(charPaths).toContain('Detective'); // Has clue element

      const element = db.prepare('SELECT resolution_paths FROM elements WHERE id = ?').get('elem8');
      expect(element.resolution_paths).toBeDefined();

      const puzzle = db.prepare('SELECT resolution_paths FROM puzzles WHERE id = ?').get('puzzle2');
      expect(puzzle.resolution_paths).toBeDefined();
    });

    it('handles errors gracefully', async () => {
      // Insert data that will cause computation errors
      // Create a timeline event that references non-existent elements
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('bad_event', 'Bad Event', JSON.stringify(['non_existent_element']));

      // Create an entity with invalid JSON in a computed field
      db.prepare(`
        INSERT INTO puzzles (id, name, computed_narrative_threads) 
        VALUES (?, ?, ?)
      `).run('bad_puzzle', 'Bad Puzzle', 'invalid json');

      // Run orchestrator - should not throw
      const result = await orchestrator.computeAll();

      expect(result.errors).toBeGreaterThan(0);
    });
  });
});