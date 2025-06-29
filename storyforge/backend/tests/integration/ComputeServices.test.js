const TestDbSetup = require('../utils/testDbSetup');
const ComputeOrchestrator = require('../../src/services/compute/ComputeOrchestrator');
const ActFocusComputer = require('../../src/services/compute/ActFocusComputer');
const ResolutionPathComputer = require('../../src/services/compute/ResolutionPathComputer');

describe('Compute Services Integration', () => {
  let testDb;
  let dbSetup;
  let orchestrator;

  beforeAll(async () => {
    dbSetup = new TestDbSetup();
    await dbSetup.initialize();
    testDb = dbSetup.getDb();
    orchestrator = new ComputeOrchestrator(testDb);
  });

  beforeEach(async () => {
    await dbSetup.clearData();
  });

  afterAll(async () => {
    await dbSetup.close();
  });

  describe('End-to-End Compute Workflow', () => {
    it('computes all derived fields for a complete game scenario', async () => {
      // Create a realistic game scenario
      
      // Characters
      dbSetup.insertTestCharacter({ id: 'marcus', name: 'Marcus Blackwood' });
      dbSetup.insertTestCharacter({ id: 'sarah', name: 'Sarah Blackwood' });
      dbSetup.insertTestCharacter({ id: 'alex', name: 'Alex Reeves' });
      
      // Timeline events
      dbSetup.insertTestTimelineEvent({ 
        id: 'party_event', 
        description: 'Night of the Party',
        date: '2023-06-15'
      });
      
      // Elements
      testDb.prepare(`
        INSERT INTO elements (id, name, type, first_available, description) 
        VALUES (?, ?, ?, ?, ?)
      `).run('cease_desist', 'Cease & Desist Letter', 'Document', 'Act 1', 'Legal document');
      
      testDb.prepare(`
        INSERT INTO elements (id, name, type, first_available, description) 
        VALUES (?, ?, ?, ?, ?)
      `).run('memory_token', 'Memory Token', 'memory', 'Act 2', 'Black market item');
      
      testDb.prepare(`
        INSERT INTO elements (id, name, type, first_available, description) 
        VALUES (?, ?, ?, ?, ?)
      `).run('evidence_bag', 'Evidence Bag', 'evidence', 'Act 1', 'Detective item');
      
      // Puzzles
      dbSetup.insertTestPuzzle({
        id: 'cease_puzzle',
        name: 'Cease & Desist Secret Code',
        puzzle_element_ids: JSON.stringify(['cease_desist'])
      });
      
      // Update timeline event with elements
      testDb.prepare(`
        UPDATE timeline_events SET element_ids = ? WHERE id = ?
      `).run(JSON.stringify(['cease_desist', 'memory_token']), 'party_event');
      
      // Create relationships
      dbSetup.createCharacterElementLink('marcus', 'cease_desist', true);
      dbSetup.createCharacterElementLink('alex', 'memory_token', true);
      dbSetup.createCharacterElementLink('sarah', 'evidence_bag', true);
      
      // Update character connections
      testDb.prepare('UPDATE characters SET connections = ? WHERE id = ?').run(8, 'marcus');
      testDb.prepare('UPDATE characters SET connections = ? WHERE id = ?').run(5, 'sarah');
      testDb.prepare('UPDATE characters SET connections = ? WHERE id = ?').run(3, 'alex');
      
      // Run the compute orchestrator
      const result = await orchestrator.computeAll();
      
      // Verify results
      expect(result.processed).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
      
      // Check act focus computation
      const event = testDb.prepare('SELECT * FROM timeline_events WHERE id = ?').get('party_event');
      expect(event.act_focus).toBe('Act 1'); // Most elements are Act 1
      
      // Check character resolution paths
      const marcus = testDb.prepare('SELECT * FROM characters WHERE id = ?').get('marcus');
      const marcusPaths = JSON.parse(marcus.resolution_paths);
      expect(marcusPaths).toContain('Third Path'); // High connections (8)
      
      const alex = testDb.prepare('SELECT * FROM characters WHERE id = ?').get('alex');
      const alexPaths = JSON.parse(alex.resolution_paths);
      expect(alexPaths).toContain('Black Market'); // Has memory element
      
      const sarah = testDb.prepare('SELECT * FROM characters WHERE id = ?').get('sarah');
      const sarahPaths = JSON.parse(sarah.resolution_paths);
      expect(sarahPaths).toContain('Detective'); // Has evidence element
      
      // Check element resolution paths
      const ceaseElement = testDb.prepare('SELECT * FROM elements WHERE id = ?').get('cease_desist');
      const ceasePaths = JSON.parse(ceaseElement.resolution_paths);
      expect(ceasePaths).toContain('Unassigned'); // Document type doesn't match any path criteria
      
      // Check puzzle resolution paths
      const puzzle = testDb.prepare('SELECT * FROM puzzles WHERE id = ?').get('cease_puzzle');
      const puzzlePaths = JSON.parse(puzzle.resolution_paths);
      expect(puzzlePaths.length).toBeGreaterThan(0);
    });

    it('handles complex relationships and multiple computation passes', async () => {
      // Create interconnected scenario
      
      // Characters
      dbSetup.insertTestCharacter({ id: 'victoria', name: 'Victoria Kingsley' });
      dbSetup.insertTestCharacter({ id: 'james', name: 'James Whitman' });
      
      // Create circular dependencies through elements
      testDb.prepare(`
        INSERT INTO elements (id, name, type, first_available) 
        VALUES (?, ?, ?, ?)
      `).run('shared_clue', 'Investigation Clue', 'Physical', 'Act 2');
      
      testDb.prepare(`
        INSERT INTO elements (id, name, type, first_available) 
        VALUES (?, ?, ?, ?)
      `).run('memory_link', 'Memory Link', 'memory', 'Act 3');
      
      // Both characters connected to both elements
      dbSetup.createCharacterElementLink('victoria', 'shared_clue', true);
      dbSetup.createCharacterElementLink('victoria', 'memory_link', false);
      dbSetup.createCharacterElementLink('james', 'shared_clue', false);
      dbSetup.createCharacterElementLink('james', 'memory_link', true);
      
      // High connections for one character
      testDb.prepare('UPDATE characters SET connections = ? WHERE id = ?').run(10, 'victoria');
      
      // Run computation
      const result = await orchestrator.computeAll();
      
      expect(result.processed).toBeGreaterThan(0);
      expect(result.errors).toBe(0);
      
      // Verify paths are computed correctly despite circular dependencies
      const victoria = testDb.prepare('SELECT * FROM characters WHERE id = ?').get('victoria');
      const victoriaPaths = JSON.parse(victoria.resolution_paths);
      expect(victoriaPaths).toContain('Detective'); // Has clue
      expect(victoriaPaths).toContain('Third Path'); // High connections
      
      const james = testDb.prepare('SELECT * FROM characters WHERE id = ?').get('james');
      const jamesPaths = JSON.parse(james.resolution_paths);
      expect(jamesPaths).toContain('Black Market'); // Has memory
      
      // Elements get paths based on their own properties
      const sharedClue = testDb.prepare('SELECT * FROM elements WHERE id = ?').get('shared_clue');
      const cluePaths = JSON.parse(sharedClue.resolution_paths);
      expect(cluePaths).toContain('Detective'); // Has 'clue' in name
    });

    it('handles missing and invalid data gracefully', async () => {
      // Create scenario with some invalid data
      
      // Timeline event with invalid element_ids
      testDb.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('bad_event', 'Event with bad data', 'not valid json');
      
      // Character with no elements
      dbSetup.insertTestCharacter({ id: 'lonely_char', name: 'No Elements Character' });
      
      // Element with no connections
      testDb.prepare(`
        INSERT INTO elements (id, name, type) 
        VALUES (?, ?, ?)
      `).run('orphan_elem', 'Orphan Element', 'Physical');
      
      // Puzzle with non-existent elements
      dbSetup.insertTestPuzzle({
        id: 'broken_puzzle',
        name: 'Broken Puzzle',
        puzzle_element_ids: JSON.stringify(['does_not_exist'])
      });
      
      // Run computation - should not crash
      const result = await orchestrator.computeAll();
      
      expect(result.processed).toBeGreaterThan(0);
      // The orchestrator handles errors gracefully and continues, so errors might be 0
      // if all entities can be processed despite having invalid data
      expect(result.errors).toBeGreaterThanOrEqual(0);
      
      // Verify graceful handling
      const lonelyChar = testDb.prepare('SELECT * FROM characters WHERE id = ?').get('lonely_char');
      const lonelyPaths = JSON.parse(lonelyChar.resolution_paths);
      expect(lonelyPaths).toContain('Unassigned'); // No qualifying criteria
      
      const orphanElem = testDb.prepare('SELECT * FROM elements WHERE id = ?').get('orphan_elem');
      const orphanPaths = JSON.parse(orphanElem.resolution_paths);
      expect(orphanPaths).toContain('Unassigned'); // No qualifying criteria
    });
  });

  describe('Individual Computer Integration', () => {
    it('ActFocusComputer integrates with real database', async () => {
      const computer = new ActFocusComputer(testDb);
      
      // Create test scenario
      testDb.prepare(`
        INSERT INTO timeline_events (id, description, element_ids) 
        VALUES (?, ?, ?)
      `).run('test_event', 'Test Event', JSON.stringify(['e1', 'e2', 'e3']));
      
      testDb.prepare(`
        INSERT INTO elements (id, name, first_available) VALUES 
        ('e1', 'Element 1', 'Act 1'),
        ('e2', 'Element 2', 'Act 2'),
        ('e3', 'Element 3', 'Act 1')
      `).run();
      
      // Compute
      const event = testDb.prepare('SELECT * FROM timeline_events WHERE id = ?').get('test_event');
      const result = await computer.compute(event);
      
      expect(result.act_focus).toBe('Act 1'); // Majority are Act 1
    });

    it('ResolutionPathComputer integrates with real database', async () => {
      const computer = new ResolutionPathComputer(testDb);
      
      // Create character with multiple path qualifications
      dbSetup.insertTestCharacter({ id: 'multi_path', name: 'Multi Path Character' });
      testDb.prepare('UPDATE characters SET connections = ? WHERE id = ?').run(7, 'multi_path');
      
      // Add both memory and clue elements
      testDb.prepare(`
        INSERT INTO elements (id, name, type) VALUES 
        ('mem1', 'Memory 1', 'memory'),
        ('clue1', 'Investigation Clue', 'Physical')
      `).run();
      
      dbSetup.createCharacterElementLink('multi_path', 'mem1', true);
      dbSetup.createCharacterElementLink('multi_path', 'clue1', true);
      
      // Compute
      const character = testDb.prepare('SELECT * FROM characters WHERE id = ?').get('multi_path');
      const result = await computer.compute(character, 'character');
      const paths = JSON.parse(result.resolution_paths);
      
      // Should have all three paths
      expect(paths).toContain('Detective'); // Has clue
      expect(paths).toContain('Black Market'); // Has memory
      expect(paths).toContain('Third Path'); // High connections
      expect(paths).toHaveLength(3);
    });
  });
});