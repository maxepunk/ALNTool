const path = require('path');
const fs = require('fs');
const { 
    getCharacterById,
    getCharacterRelations,
    getAllEvents,
    getTimelineEventsForList,
    getAllPuzzles,
    getAllElements,
    getElementsWithComputedFields,
    getAllCharacterIdsAndNames,
    getLinkedCharacters,
    getFullEntityDetails,
    getCharacterJourneyData,
    getElementById,
    getCharactersForList,
    generateJourneyVersionHash,
    getCachedJourneyGraph,
    saveCachedJourneyGraph,
    clearExpiredJourneyCache,
    invalidateJourneyCache,
    getSyncStatus
} = require('../../src/db/queries');
const { initializeDB, getDB } = require('../../src/db/database');

describe('Database Queries', () => {
    let db;
    const testDbPath = path.join(__dirname, '../../test-queries.db');

    beforeAll(async () => {
        // Remove test database if it exists
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
        
        // Initialize test database
        process.env.DATABASE_PATH = testDbPath;
        await initializeDB();
        db = getDB();
        
        // Seed test data
        await seedTestData();
    });

    afterAll(() => {
        // Clean up test database
        if (db) {
            db.close();
        }
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    async function seedTestData() {
        // Insert test characters
        db.prepare(`
            INSERT INTO characters (id, name, type, tier, logline, resolution_paths)
            VALUES 
                ('char1', 'Test Character 1', 'Main', 'A', 'A test character', '["path1", "path2"]'),
                ('char2', 'Test Character 2', 'Support', 'B', 'Another test character', '["path3"]'),
                ('char3', 'Isolated Character', 'Extra', 'C', 'No relationships', '[]')
        `).run();

        // Insert test timeline events
        db.prepare(`
            INSERT INTO timeline_events (id, description, date, act_focus, notes)
            VALUES 
                ('event1', 'Event 1', '2025-01-01', 'Act 1', 'Notes 1'),
                ('event2', 'Event 2', '2025-01-02', 'Act 2', 'Notes 2'),
                ('event3', 'Event 3', '2025-01-03', null, 'Notes 3')
        `).run();

        // Insert test puzzles
        db.prepare(`
            INSERT INTO puzzles (id, name, timing, reward_ids, narrative_threads)
            VALUES 
                ('puzzle1', 'Test Puzzle 1', 'Act 1', '["elem1", "elem2"]', '["thread1"]'),
                ('puzzle2', 'Test Puzzle 2', 'Act 2', '[]', '["thread2"]')
        `).run();

        // Insert test elements
        db.prepare(`
            INSERT INTO elements (id, name, type, owner_id, container_id, calculated_memory_value, resolution_paths)
            VALUES 
                ('elem1', 'Element 1', 'Prop', 'char1', null, 100, '["path1"]'),
                ('elem2', 'Element 2', 'Memory Token Video', 'char2', 'elem1', 200, '["path2"]'),
                ('elem3', 'Element 3', 'Set Dressing', null, null, 0, '[]')
        `).run();

        // Insert relationship data
        db.prepare(`
            INSERT INTO character_timeline_events (character_id, timeline_event_id)
            VALUES 
                ('char1', 'event1'),
                ('char1', 'event2'),
                ('char2', 'event2')
        `).run();

        db.prepare(`
            INSERT INTO character_puzzles (character_id, puzzle_id)
            VALUES 
                ('char1', 'puzzle1'),
                ('char2', 'puzzle2')
        `).run();

        db.prepare(`
            INSERT INTO character_owned_elements (character_id, element_id)
            VALUES 
                ('char1', 'elem1'),
                ('char2', 'elem2')
        `).run();

        db.prepare(`
            INSERT INTO character_associated_elements (character_id, element_id)
            VALUES 
                ('char1', 'elem3'),
                ('char2', 'elem3')
        `).run();

        db.prepare(`
            INSERT INTO character_links (id, character_a_id, character_b_id, link_type)
            VALUES 
                ('link1', 'char1', 'char2', 'shared_event'),
                ('link2', 'char1', 'char2', 'shared_puzzle')
        `).run();

        // Insert sync log entry
        db.prepare(`
            INSERT INTO sync_log (entity_type, entity_id, operation, status, timestamp)
            VALUES ('character', 'char1', 'sync', 'success', datetime('now', '-1 hour'))
        `).run();
    }

    describe('Character Queries', () => {
        it('should get character by ID', () => {
            const character = getCharacterById('char1');
            expect(character).toBeDefined();
            expect(character.id).toBe('char1');
            expect(character.name).toBe('Test Character 1');
            expect(character.type).toBe('Main');
        });

        it('should return undefined for non-existent character', () => {
            const character = getCharacterById('non-existent');
            expect(character).toBeUndefined();
        });

        it('should get all character IDs and names', () => {
            const characters = getAllCharacterIdsAndNames();
            expect(characters).toHaveLength(3);
            expect(characters[0]).toHaveProperty('id');
            expect(characters[0]).toHaveProperty('name');
            expect(characters.map(c => c.id)).toContain('char1');
            expect(characters.map(c => c.id)).toContain('char2');
            expect(characters.map(c => c.id)).toContain('char3');
        });

        it('should get characters for list view with parsed resolution paths', () => {
            const characters = getCharactersForList();
            expect(characters).toHaveLength(3);
            expect(characters[0].resolution_paths).toBeInstanceOf(Array);
            expect(characters[0].resolution_paths).toEqual(['path1', 'path2']);
            expect(characters[1].resolution_paths).toEqual(['path3']);
            expect(characters[2].resolution_paths).toEqual([]);
        });

        it('should get character relations', () => {
            const relations = getCharacterRelations('char1');
            expect(relations.events).toHaveLength(2);
            expect(relations.puzzles).toHaveLength(1);
            expect(relations.elements).toHaveLength(2); // 1 owned + 1 associated
            
            expect(relations.events[0].type).toBe('timeline_event');
            expect(relations.puzzles[0].type).toBe('puzzle');
            expect(relations.elements.find(e => e.relationship_type === 'owned')).toBeDefined();
            expect(relations.elements.find(e => e.relationship_type === 'associated')).toBeDefined();
        });

        it('should get linked characters', () => {
            const links = getLinkedCharacters('char1');
            expect(links).toHaveLength(2); // 2 different link types to char2
            expect(links[0].linked_character_id).toBe('char2');
            expect(links[0].linked_character_name).toBe('Test Character 2');
            expect(links.map(l => l.link_type)).toContain('shared_event');
            expect(links.map(l => l.link_type)).toContain('shared_puzzle');
        });

        it('should handle character with no links', () => {
            const links = getLinkedCharacters('char3');
            expect(links).toHaveLength(0);
        });
    });

    describe('Timeline Event Queries', () => {
        it('should get all events', () => {
            const events = getAllEvents();
            expect(events).toHaveLength(3);
            expect(events[0].id).toBe('event1');
        });

        it('should get timeline events for list view', () => {
            const events = getTimelineEventsForList();
            expect(events).toHaveLength(3);
            expect(events[0]).toHaveProperty('id');
            expect(events[0]).toHaveProperty('description');
            expect(events[0]).toHaveProperty('date');
            expect(events[0]).toHaveProperty('act_focus');
            expect(events[0]).toHaveProperty('notes');
            // Should be ordered by date
            expect(events[0].date).toBe('2025-01-01');
            expect(events[1].date).toBe('2025-01-02');
        });
    });

    describe('Puzzle Queries', () => {
        it('should get all puzzles', () => {
            const puzzles = getAllPuzzles();
            expect(puzzles).toHaveLength(2);
            expect(puzzles[0].id).toBe('puzzle1');
            expect(puzzles[0].name).toBe('Test Puzzle 1');
        });
    });

    describe('Element Queries', () => {
        it('should get all elements', () => {
            const elements = getAllElements();
            expect(elements).toHaveLength(3);
            expect(elements[0].id).toBe('elem1');
        });

        it('should get element by ID', () => {
            const element = getElementById('elem1');
            expect(element).toBeDefined();
            expect(element.id).toBe('elem1');
            expect(element.name).toBe('Element 1');
            expect(element.type).toBe('Prop');
        });

        it('should get elements with computed fields', () => {
            const elements = getElementsWithComputedFields();
            expect(elements).toHaveLength(3);
            
            const elem1 = elements.find(e => e.id === 'elem1');
            expect(elem1.owner_name).toBe('Test Character 1');
            expect(elem1.container_name).toBeNull();
            
            const elem2 = elements.find(e => e.id === 'elem2');
            expect(elem2.owner_name).toBe('Test Character 2');
            expect(elem2.container_name).toBe('Element 1');
        });
    });

    describe('Journey Data Queries', () => {
        it('should get character journey data', () => {
            const journeyData = getCharacterJourneyData('char1');
            expect(journeyData.events).toHaveLength(2);
            expect(journeyData.puzzles).toHaveLength(1);
            expect(journeyData.elements).toHaveLength(3); // Direct elements + rewards
            
            // Should include rewarded elements from puzzles
            expect(journeyData.elements.map(e => e.id)).toContain('elem1');
            expect(journeyData.elements.map(e => e.id)).toContain('elem2'); // Reward from puzzle1
        });

        it('should handle character with no journey data', () => {
            const journeyData = getCharacterJourneyData('char3');
            expect(journeyData.events).toHaveLength(0);
            expect(journeyData.puzzles).toHaveLength(0);
            expect(journeyData.elements).toHaveLength(1); // Only associated element
        });

        it('should get full entity details', () => {
            const entityIds = ['char1', 'elem1', 'puzzle1', 'event1'];
            const details = getFullEntityDetails(entityIds);
            
            expect(details.characters).toHaveLength(1);
            expect(details.elements).toHaveLength(1);
            expect(details.puzzles).toHaveLength(1);
            expect(details.timeline_events).toHaveLength(1);
            
            expect(details.characters[0].type).toBe('character');
            expect(details.elements[0].type).toBe('element');
            expect(details.puzzles[0].type).toBe('puzzle');
            expect(details.timeline_events[0].type).toBe('timeline_event');
        });

        it('should handle empty entity IDs', () => {
            const details = getFullEntityDetails([]);
            expect(details.characters).toHaveLength(0);
            expect(details.elements).toHaveLength(0);
            expect(details.puzzles).toHaveLength(0);
            expect(details.timeline_events).toHaveLength(0);
        });
    });

    describe('Journey Cache Queries', () => {
        const testJourney = {
            character_info: { id: 'char1', name: 'Test Character 1' },
            graph: {
                nodes: [{ id: 'node1', type: 'test' }],
                edges: [{ source: 'node1', target: 'node2' }]
            }
        };

        it('should generate journey version hash', () => {
            const hash1 = generateJourneyVersionHash('char1');
            const hash2 = generateJourneyVersionHash('char2');
            
            expect(hash1).toBeDefined();
            expect(hash2).toBeDefined();
            expect(hash1).not.toBe(hash2); // Different characters should have different hashes
        });

        it('should save and retrieve cached journey graph', () => {
            // Save journey
            saveCachedJourneyGraph('char1', testJourney);
            
            // Retrieve journey
            const cached = getCachedJourneyGraph('char1');
            expect(cached).toBeDefined();
            expect(cached.character_id).toBe('char1');
            expect(cached.character_info).toEqual(testJourney.character_info);
            expect(cached.graph).toEqual(testJourney.graph);
        });

        it('should return null for non-existent cached journey', () => {
            const cached = getCachedJourneyGraph('non-existent');
            expect(cached).toBeNull();
        });

        it('should invalidate journey cache', () => {
            // Save journey first
            saveCachedJourneyGraph('char2', testJourney);
            
            // Verify it exists
            let cached = getCachedJourneyGraph('char2');
            expect(cached).toBeDefined();
            
            // Invalidate
            invalidateJourneyCache('char2');
            
            // Verify it's gone
            cached = getCachedJourneyGraph('char2');
            expect(cached).toBeNull();
        });

        it('should clear expired journey cache', () => {
            // Insert an old cache entry directly
            db.prepare(`
                INSERT INTO cached_journey_graphs 
                (character_id, character_info, graph_nodes, graph_edges, version_hash, cached_at, last_accessed)
                VALUES ('char_old', '{}', '[]', '[]', 'old_hash', datetime('now', '-10 days'), datetime('now', '-10 days'))
            `).run();
            
            // Clear expired (older than 7 days by default)
            clearExpiredJourneyCache(168); // 7 days
            
            // Verify it's gone
            const cached = getCachedJourneyGraph('char_old');
            expect(cached).toBeNull();
        });
    });

    describe('Sync Status Queries', () => {
        it('should get sync status', () => {
            const status = getSyncStatus();
            
            expect(status).toBeDefined();
            expect(status.status).toBe('foundational_sync_ok');
            expect(status.pending_changes).toBe(0);
            expect(status.database_status).toBe('online');
            expect(status.entity_counts).toBeDefined();
            expect(status.entity_counts.characters).toBe(3);
            expect(status.entity_counts.elements).toBe(3);
            expect(status.entity_counts.puzzles).toBe(2);
            expect(status.entity_counts.timeline_events).toBe(3);
            expect(status.last_notion_sync).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        it('should handle database errors gracefully', () => {
            // Close the database to simulate an error
            const originalDB = getDB();
            originalDB.close();
            
            // These should not throw but return appropriate defaults
            expect(() => getSyncStatus()).not.toThrow();
            const status = getSyncStatus();
            expect(status.status).toBe('error');
            
            // Reinitialize for other tests
            initializeDB();
        });
    });
});