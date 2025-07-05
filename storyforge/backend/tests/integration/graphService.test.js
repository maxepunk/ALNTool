const { initializeDatabase, getDB, closeDB } = require('../../src/db/database');
const graphService = require('../../src/services/graphService');

describe('GraphService Integration', () => {
    let db;

    beforeAll(() => {
        initializeDatabase(':memory:');
        db = getDB();
    });

    afterAll(() => {
        closeDB();
    });

    beforeEach(() => {
        // Clear data between tests
        db.exec(`
            DELETE FROM character_links;
            DELETE FROM character_timeline_events;
            DELETE FROM timeline_events;
            DELETE FROM characters;
        `);
    });

    it('should include character links in the graph', () => {
        // Insert test data
        const insertCharacter = db.prepare(
            'INSERT INTO characters (id, name, logline, tier, type) VALUES (?, ?, ?, ?, ?)'
        );
        insertCharacter.run('char1', 'Alex Reeves', 'Main character', 'A', 'Main');
        insertCharacter.run('char2', 'Sarah Blackwood', 'Linked character', 'B', 'Supporting');
        insertCharacter.run('char3', 'Marcus Blackwood', 'Another linked character', 'A', 'Main');
        
        // Insert character links
        const insertLink = db.prepare(
            'INSERT INTO character_links (character_a_id, character_b_id, link_type, link_source_id, link_strength) VALUES (?, ?, ?, ?, ?)'
        );
        insertLink.run('char1', 'char2', 'computed', 'sync_process', 50);
        insertLink.run('char1', 'char3', 'computed', 'sync_process', 30);

        // Test the graph service
        const result = graphService.getCharacterGraph('char1');
        
        // Verify character nodes
        const characterNodes = result.nodes.filter(n => n.type === 'character');
        expect(characterNodes).toHaveLength(3);
        expect(characterNodes.map(n => n.id).sort()).toEqual(['char1', 'char2', 'char3']);
        
        // Verify character link edges
        const linkEdges = result.edges.filter(e => e.label.startsWith('linked_via_'));
        expect(linkEdges).toHaveLength(2);
        expect(linkEdges[0].data.linkCount).toBe(1);
        expect(linkEdges[1].data.linkCount).toBe(1);
    });
});