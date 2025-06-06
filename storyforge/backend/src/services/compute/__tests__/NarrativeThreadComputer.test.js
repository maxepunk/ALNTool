const Database = require('better-sqlite3');
const NarrativeThreadComputer = require('../NarrativeThreadComputer');

describe('NarrativeThreadComputer', () => {
  let db;
  let computer;

  beforeEach(() => {
    // Create in-memory database for testing
    db = new Database(':memory:');
    
    // Create required tables
    db.exec(`
      CREATE TABLE puzzles (
        id TEXT PRIMARY KEY,
        name TEXT,
        story_reveals TEXT,
        reward_ids TEXT,
        computed_narrative_threads TEXT
      );
      
      CREATE TABLE elements (
        id TEXT PRIMARY KEY,
        name TEXT,
        description TEXT
      );
    `);

    // Insert test data
    db.prepare(`
      INSERT INTO puzzles (id, name, story_reveals, reward_ids) VALUES
      ('p1', 'The Underground Party', 'A secret party in the underground', '["e1", "e2"]'),
      ('p2', 'Corporate Investigation', 'Evidence of corporate espionage', '["e3"]'),
      ('p3', 'Community Gathering', 'A gathering of the community', '[]'),
      ('p4', 'Untitled Puzzle', NULL, NULL)
    `).run();

    db.prepare(`
      INSERT INTO elements (id, name, description) VALUES
      ('e1', 'Memory Drug Sample', 'A sample of the memory-altering drug'),
      ('e2', 'Party Invitation', 'An invitation to an underground party'),
      ('e3', 'Corporate Documents', 'Evidence of corporate espionage')
    `).run();

    computer = new NarrativeThreadComputer(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('compute', () => {
    it('should compute threads from story reveals', async () => {
      const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('p1');
      const result = await computer.compute(puzzle);
      
      const threads = JSON.parse(result.computed_narrative_threads);
      expect(threads).toContain('Underground Parties');
      expect(threads).toContain('Black Market');
    });

    it('should compute threads from reward elements', async () => {
      const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('p2');
      const result = await computer.compute(puzzle);
      
      const threads = JSON.parse(result.computed_narrative_threads);
      expect(threads).toContain('Corporate Espionage');
      expect(threads).toContain('Detective');
    });

    it('should compute threads from puzzle name', async () => {
      const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('p3');
      const result = await computer.compute(puzzle);
      
      const threads = JSON.parse(result.computed_narrative_threads);
      expect(threads).toContain('Community');
      expect(threads).toContain('Third Path');
    });

    it('should handle puzzles with no data', async () => {
      const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('p4');
      const result = await computer.compute(puzzle);
      
      const threads = JSON.parse(result.computed_narrative_threads);
      expect(threads).toEqual(['Unassigned']);
    });

    it('should throw error for missing required fields', async () => {
      const puzzle = { name: 'Test Puzzle' }; // Missing id
      await expect(computer.compute(puzzle)).rejects.toThrow('Missing required fields');
    });

    it('should handle malformed reward_ids JSON', async () => {
      db.prepare(`
        INSERT INTO puzzles (id, name, reward_ids) 
        VALUES ('p5', 'Test Puzzle', 'invalid json')
      `).run();

      const puzzle = db.prepare('SELECT * FROM puzzles WHERE id = ?').get('p5');
      const result = await computer.compute(puzzle);
      
      const threads = JSON.parse(result.computed_narrative_threads);
      expect(threads).toEqual(['Unassigned']);
    });
  });

  describe('computeAll', () => {
    it('should compute threads for all puzzles', async () => {
      const stats = await computer.computeAll();
      
      expect(stats.processed).toBe(4); // All puzzles processed
      expect(stats.errors).toBe(0); // No errors

      // Verify database updates
      const puzzles = db.prepare('SELECT * FROM puzzles').all();
      puzzles.forEach(puzzle => {
        expect(puzzle.computed_narrative_threads).toBeDefined();
        const threads = JSON.parse(puzzle.computed_narrative_threads);
        expect(Array.isArray(threads)).toBe(true);
      });
    });

    it('should handle database errors gracefully', async () => {
      // Force a database error by dropping the table
      db.exec('DROP TABLE puzzles');
      
      await expect(computer.computeAll()).rejects.toThrow('Failed to compute all narrative threads');
    });
  });

  describe('thread extraction', () => {
    it('should extract multiple threads from text', () => {
      const threads = new Set();
      computer._extractThreadsFromText('underground party with memory drugs', threads);
      
      expect(Array.from(threads)).toContain('Underground Parties');
      expect(Array.from(threads)).toContain('Memory Drug');
      expect(Array.from(threads)).toContain('Black Market');
    });

    it('should handle case-insensitive matching', () => {
      const threads = new Set();
      computer._extractThreadsFromText('CORPORATE ESPIONAGE', threads);
      
      expect(Array.from(threads)).toContain('Corporate Espionage');
      expect(Array.from(threads)).toContain('Detective');
    });

    it('should not add threads for non-matching text', () => {
      const threads = new Set();
      computer._extractThreadsFromText('random text with no keywords', threads);
      
      expect(threads.size).toBe(0);
    });
  });
}); 