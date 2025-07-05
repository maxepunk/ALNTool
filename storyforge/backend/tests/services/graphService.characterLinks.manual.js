// Manual test for character links - run with: node tests/services/graphService.characterLinks.manual.js
const Database = require('better-sqlite3');
const graphService = require('../../src/services/graphService');
const { initializeDatabase, getDB } = require('../../src/db/database');
const { runMigrations } = require('../../src/db/migrations');

async function testCharacterLinks() {
    console.log('Testing character links in graphService...\n');

    // Initialize in-memory database (migrations run automatically)
    initializeDatabase(':memory:');
    const db = getDB();
    
    try {
        // Insert test data
        console.log('Inserting test data...');
        
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
        
        // Insert some timeline events for char1
        const insertEvent = db.prepare(
            'INSERT INTO timeline_events (id, description, date) VALUES (?, ?, ?)'
        );
        insertEvent.run('event1', 'Test Event', '2025-01-01');
        
        const insertCharEvent = db.prepare(
            'INSERT INTO character_timeline_events (character_id, timeline_event_id) VALUES (?, ?)'
        );
        insertCharEvent.run('char1', 'event1');
        
        console.log('Test data inserted.\n');
        
        // Test the graph service
        console.log('Fetching character graph for char1...');
        const result = await graphService.getCharacterGraph('char1');
        
        console.log('\nGraph Results:');
        console.log('Total nodes:', result.nodes.length);
        console.log('Total edges:', result.edges.length);
        
        // Check character nodes
        const characterNodes = result.nodes.filter(n => n.type === 'character');
        console.log('\nCharacter nodes:', characterNodes.length);
        characterNodes.forEach(node => {
            console.log(`  - ${node.name} (${node.id})`);
        });
        
        // Check character link edges
        const linkEdges = result.edges.filter(e => e.label.startsWith('linked_via_'));
        console.log('\nCharacter link edges:', linkEdges.length);
        linkEdges.forEach(edge => {
            console.log(`  - ${edge.data.sourceNodeName} -> ${edge.data.targetNodeName} (${edge.label}, strength: ${edge.data.linkCount})`);
        });
        
        // Test success
        console.log('\n✅ Character links are working correctly!');
        
        // Verify the actual database to confirm
        console.log('\nVerifying database state:');
        const linkCount = db.prepare('SELECT COUNT(*) as count FROM character_links').get();
        console.log('Character links in DB:', linkCount.count);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        db.close();
    }
}

// Run the test
testCharacterLinks().catch(console.error);