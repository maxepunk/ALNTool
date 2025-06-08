const Database = require('better-sqlite3');

try {
    const db = new Database('./data/production.db');
    
    console.log('=== TIMELINE EVENTS INVESTIGATION ===');
    
    // Get table schema
    const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='timeline_events'").get();
    console.log('\nTimeline Events Schema:');
    console.log(schema?.sql || 'Table not found');
    
    // Get column info
    const columns = db.prepare("PRAGMA table_info(timeline_events)").all();
    console.log('\nColumns:');
    columns.forEach(col => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Check timeline events count
    const count = db.prepare('SELECT COUNT(*) as count FROM timeline_events').get();
    console.log(`\nTimeline Events count: ${count.count}`);
    
    if (count.count > 0) {
        // Get sample timeline events
        console.log('\nSample Timeline Events:');
        const samples = db.prepare('SELECT id, description, element_ids, act_focus FROM timeline_events LIMIT 5').all();
        samples.forEach(event => {
            console.log(`\nEvent: ${event.id}`);
            console.log(`  Description: ${event.description}`);
            console.log(`  Element IDs: ${event.element_ids}`);
            console.log(`  Act Focus: ${event.act_focus}`);
        });
        
        // Check how many have element_ids
        const withElements = db.prepare('SELECT COUNT(*) as count FROM timeline_events WHERE element_ids IS NOT NULL AND element_ids != "[]"').get();
        console.log(`\nEvents with element_ids: ${withElements.count}`);
        
        // Check how many have act_focus computed
        const withActFocus = db.prepare('SELECT COUNT(*) as count FROM timeline_events WHERE act_focus IS NOT NULL').get();
        console.log(`Events with act_focus computed: ${withActFocus.count}`);
        
        // Sample elements table to understand first_available field
        console.log('\nSample Elements (for reference):');
        const elementSamples = db.prepare('SELECT id, name, first_available FROM elements LIMIT 5').all();
        elementSamples.forEach(el => {
            console.log(`  ${el.id}: ${el.name} (first_available: ${el.first_available})`);
        });
    }
    
    db.close();
    console.log('\n=== INVESTIGATION COMPLETE ===');
} catch (error) {
    console.error('Investigation failed:', error.message);
}