// Test specifically for character links functionality
const Database = require('better-sqlite3');
const graphService = require('../../src/services/graphService');
const path = require('path');
const fs = require('fs');

describe('GraphService - Character Links', () => {
    let db;
    const testDbPath = path.join(__dirname, '../../test-character-links.db');

    beforeAll(async () => {
        // Remove test database if it exists
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }

        // Initialize test database
        const { initializeDatabase, getDB } = require('../../src/db/database');
        initializeDatabase(testDbPath);
        db = getDB();
        
        // Run migrations
        const { runMigrations } = require('../../src/db/migrations');
        await runMigrations();
        
        // Insert test data
        const insertCharacter = db.prepare(
            'INSERT INTO characters (id, name, logline, tier, type) VALUES (?, ?, ?, ?, ?)'
        );
        insertCharacter.run('char1', 'Character 1', 'Main character', 'A', 'Main');
        insertCharacter.run('char2', 'Character 2', 'Linked character', 'B', 'Supporting');
        insertCharacter.run('char3', 'Character 3', 'Another linked character', 'C', 'Supporting');
        
        // Insert character links
        const insertLink = db.prepare(
            'INSERT INTO character_links (character_a_id, character_b_id, link_type, link_source_id, link_strength) VALUES (?, ?, ?, ?, ?)'
        );
        insertLink.run('char1', 'char2', 'computed', 'sync_process', 50);
        insertLink.run('char1', 'char3', 'computed', 'sync_process', 30);
        
        // Insert some timeline events for char1
        const insertEvent = db.prepare(
            'INSERT INTO timeline_events (id, description, date) VALUES (?, ?, ?)'
        );
        insertEvent.run('event1', 'Test Event', '2025-01-01');
        
        const insertCharEvent = db.prepare(
            'INSERT INTO character_timeline_events (character_id, timeline_event_id) VALUES (?, ?)'
        );
        insertCharEvent.run('char1', 'event1');
    });

    afterAll(() => {
        if (db) {
            db.close();
        }
        if (fs.existsSync(testDbPath)) {
            fs.unlinkSync(testDbPath);
        }
    });

    it('should include character links in the graph', async () => {
        const result = await graphService.getCharacterGraph('char1');

        // Check that we have the main character plus 2 linked characters
        const characterNodes = result.nodes.filter(n => n.type === 'character');
        expect(characterNodes).toHaveLength(3);
        
        // Check the main character
        expect(characterNodes.find(n => n.id === 'char1')).toBeDefined();
        
        // Check linked characters
        expect(characterNodes.find(n => n.id === 'char2')).toBeDefined();
        expect(characterNodes.find(n => n.id === 'char3')).toBeDefined();

        // Check character link edges
        const linkEdges = result.edges.filter(e => e.label.startsWith('linked_via_'));
        expect(linkEdges).toHaveLength(2);
        
        // Check specific edge properties
        const char2Edge = linkEdges.find(e => e.target === 'char2');
        expect(char2Edge).toMatchObject({
            source: 'char1',
            target: 'char2',
            label: 'linked_via_computed',
            data: {
                linkCount: 1,
                sourceNodeName: 'Character 1',
                targetNodeName: 'Character 2'
            }
        });
    });

    it('should handle character with no links', async () => {
        // Insert a character with no links
        const insertIsolated = db.prepare(
            'INSERT INTO characters (id, name, logline, tier, type) VALUES (?, ?, ?, ?, ?)'
        );
        insertIsolated.run('isolated', 'Isolated Character', 'No links', 'D', 'Minor');
        
        const result = await graphService.getCharacterGraph('isolated');
        
        // Should only have the character itself
        expect(result.nodes).toHaveLength(1);
        expect(result.edges).toHaveLength(0);
        
        const charNodes = result.nodes.filter(n => n.type === 'character');
        expect(charNodes).toHaveLength(1);
        expect(charNodes[0].id).toBe('isolated');
    });
});