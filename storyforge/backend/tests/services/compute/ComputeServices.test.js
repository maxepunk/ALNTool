const { getDB } = require('../../../src/db/database');
const DerivedFieldComputer = require('../../../src/services/compute/DerivedFieldComputer');
const ActFocusComputer = require('../../../src/services/compute/ActFocusComputer');
const ResolutionPathComputer = require('../../../src/services/compute/ResolutionPathComputer');
const ComputeOrchestrator = require('../../../src/services/compute/ComputeOrchestrator');

describe('Compute Services', () => {
  let db;
  let orchestrator;

  beforeAll(() => {
    // Use test database
    db = getDB(':memory:');
    
    // Create test tables
    db.exec(`
      CREATE TABLE timeline_events (
        id TEXT PRIMARY KEY,
        description TEXT,
        element_ids TEXT,
        act_focus TEXT
      );
      
      CREATE TABLE characters (
        id TEXT PRIMARY KEY,
        name TEXT,
        connections INTEGER,
        resolution_paths TEXT
      );
      
      CREATE TABLE elements (
        id TEXT PRIMARY KEY,
        name TEXT,
        type TEXT,
        first_available TEXT,
        narrative_threads TEXT,
        resolution_paths TEXT
      );
      
      CREATE TABLE puzzles (
        id TEXT PRIMARY KEY,
        name TEXT,
        computed_narrative_threads TEXT,
        resolution_paths TEXT
      );
      
      CREATE TABLE character_owned_elements (
        character_id TEXT,
        element_id TEXT,
        FOREIGN KEY (character_id) REFERENCES characters(id),
        FOREIGN KEY (element_id) REFERENCES elements(id)
      );
    `);
  });

  beforeEach(() => {
    // Clear tables before each test
    db.exec(`
      DELETE FROM timeline_events;
      DELETE FROM characters;
      DELETE FROM elements;
      DELETE FROM puzzles;
      DELETE FROM character_owned_elements;
    `);
    
    // Create orchestrator
    orchestrator = new ComputeOrchestrator(db);
  });

  afterAll(() => {
    db.close();
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
        INSERT INTO elements (id, name, first_available) VALUES 
        (?, ?, ?),
        (?, ?, ?),
        (?, ?, ?)
      `).run(
        'elem1', 'Element 1', 'Act 1',
        'elem2', 'Element 2', 'Act 1',
        'elem3', 'Element 3', 'Act 2'
      );

      // Compute act focus
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event1');
      const { act_focus } = await computer.compute(event);

      // Should be Act 1 since it's most common
      expect(act_focus).toBe('Act 1');
    });

    it('returns null for events with no elements', async () => {
      // Insert test data
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('event2', 'Empty Event', '[]');

      // Compute act focus
      const event = db.prepare('SELECT * FROM timeline_events WHERE id = ?').get('event2');
      const { act_focus } = await computer.compute(event);

      expect(act_focus).toBeNull();
    });
  });

  describe('ResolutionPathComputer', () => {
    let computer;

    beforeEach(() => {
      computer = new ResolutionPathComputer(db);
    });

    it('computes character paths based on owned elements', async () => {
      // Insert test data
      db.prepare(`
        INSERT INTO characters (id, name, connections) 
        VALUES (?, ?, ?)
      `).run('char1', 'Test Character', 3);

      db.prepare(`
        INSERT INTO elements (id, name, type) VALUES 
        (?, ?, ?),
        (?, ?, ?)
      `).run(
        'elem1', 'Black Market Card', 'memory',
        'elem2', 'Investigation Kit', 'evidence'
      );

      db.prepare(`
        INSERT INTO character_owned_elements (character_id, element_id) VALUES 
        (?, ?),
        (?, ?)
      `).run('char1', 'elem1', 'char1', 'elem2');

      // Compute paths
      const character = db.prepare('SELECT * FROM characters WHERE id = ?').get('char1');
      const { resolution_paths } = await computer.compute(character, 'character');
      const paths = JSON.parse(resolution_paths);

      // Should have both Black Market and Detective paths
      expect(paths).toContain('Black Market');
      expect(paths).toContain('Detective');
    });

    it('computes puzzle paths based on narrative threads', async () => {
      // Insert test data
      db.prepare(`
        INSERT INTO puzzles (id, name, computed_narrative_threads) 
        VALUES (?, ?, ?)
      `).run('puzzle1', 'Test Puzzle', JSON.stringify(['Underground Parties', 'Corporate Espionage']));

      // Compute paths
      const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('puzzle1');
      const { resolution_paths } = await computer.compute(puzzle, 'puzzle');
      const paths = JSON.parse(resolution_paths);

      // Should have both Black Market and Detective paths
      expect(paths).toContain('Black Market');
      expect(paths).toContain('Detective');
    });

    it('computes element paths based on type and name', async () => {
      // Insert test data
      db.prepare(`
        INSERT INTO elements (id, name, type) 
        VALUES (?, ?, ?)
      `).run('elem1', 'Community Outreach Program', 'personal');

      // Compute paths
      const element = db.prepare('SELECT * FROM elements WHERE id = ?').get('elem1');
      const { resolution_paths } = await computer.compute(element, 'element');
      const paths = JSON.parse(resolution_paths);

      // Should have Third Path
      expect(paths).toContain('Third Path');
    });
  });

  describe('ComputeOrchestrator', () => {
    it('computes all derived fields for all entities', async () => {
      // Insert test data
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('event1', 'Test Event', JSON.stringify(['elem1']));

      db.prepare(`
        INSERT INTO elements (id, name, type, first_available) 
        VALUES (?, ?, ?, ?)
      `).run('elem1', 'Test Element', 'memory', 'Act 1');

      db.prepare(`
        INSERT INTO characters (id, name, connections) 
        VALUES (?, ?, ?)
      `).run('char1', 'Test Character', 6);

      db.prepare(`
        INSERT INTO puzzles (id, name, computed_narrative_threads) 
        VALUES (?, ?, ?)
      `).run('puzzle1', 'Test Puzzle', JSON.stringify(['Underground Parties']));

      // Compute all fields
      const stats = await orchestrator.computeAll();

      // Verify results
      expect(stats.processed).toBe(4); // 1 event + 1 character + 1 puzzle + 1 element
      expect(stats.errors).toBe(0);

      // Check computed values
      const event = db.prepare('SELECT act_focus FROM timeline_events WHERE id = ?').get('event1');
      expect(event.act_focus).toBe('Act 1');

      const character = db.prepare('SELECT resolution_paths FROM characters WHERE id = ?').get('char1');
      const charPaths = JSON.parse(character.resolution_paths);
      expect(charPaths).toContain('Third Path');

      const puzzle = db.prepare('SELECT resolution_paths FROM puzzles WHERE id = ?').get('puzzle1');
      const puzzlePaths = JSON.parse(puzzle.resolution_paths);
      expect(puzzlePaths).toContain('Black Market');

      const element = db.prepare('SELECT resolution_paths FROM elements WHERE id = ?').get('elem1');
      const elementPaths = JSON.parse(element.resolution_paths);
      expect(elementPaths).toContain('Black Market');
    });

    it('handles errors gracefully during computation', async () => {
      // Insert invalid data
      db.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('event1', 'Invalid Event', 'invalid-json');

      // Compute all fields
      const stats = await orchestrator.computeAll();

      // Should record error but continue processing
      expect(stats.errors).toBeGreaterThan(0);
      expect(stats.processed).toBe(1);
    });
  });
}); 