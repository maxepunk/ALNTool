const Database = require('better-sqlite3');

try {
    const db = new Database('./data/production.db');
    
    console.log('=== ACT FOCUS LOGIC ANALYSIS ===');
    
    // Get a specific timeline event with elements to analyze
    const eventWithElements = db.prepare(`
        SELECT id, description, element_ids, act_focus 
        FROM timeline_events 
        WHERE element_ids IS NOT NULL 
        AND element_ids != '[]' 
        AND length(element_ids) > 2
        LIMIT 1
    `).get();
    
    if (eventWithElements) {
        console.log('\nAnalyzing Timeline Event:');
        console.log(`ID: ${eventWithElements.id}`);
        console.log(`Description: ${eventWithElements.description}`);
        console.log(`Element IDs: ${eventWithElements.element_ids}`);
        console.log(`Current Act Focus: ${eventWithElements.act_focus}`);
        
        // Parse element IDs and check each element
        const elementIds = JSON.parse(eventWithElements.element_ids);
        console.log(`\nParsed Element IDs: ${elementIds}`);
        
        if (elementIds.length > 0) {
            console.log('\nAnalyzing Related Elements:');
            
            const placeholders = elementIds.map(() => '?').join(',');
            const elements = db.prepare(
                `SELECT id, name, first_available FROM elements WHERE id IN (${placeholders})`
            ).all(...elementIds);
            
            elements.forEach(el => {
                console.log(`  Element: ${el.name}`);
                console.log(`    ID: ${el.id}`);
                console.log(`    First Available: ${el.first_available || 'NULL'}`);
            });
            
            // Simulate the act focus computation
            console.log('\nAct Focus Computation Simulation:');
            const actCounts = {};
            elements.forEach(el => {
                if (el.first_available) {
                    actCounts[el.first_available] = (actCounts[el.first_available] || 0) + 1;
                    console.log(`    Counting act "${el.first_available}": ${actCounts[el.first_available]}`);
                } else {
                    console.log(`    Skipping element with NULL first_available: ${el.name}`);
                }
            });
            
            console.log(`\nAct counts: ${JSON.stringify(actCounts)}`);
            
            // Determine most common act (same logic as ActFocusComputer)
            const sortedActs = Object.entries(actCounts)
                .sort(([actA, countA], [actB, countB]) => {
                    if (countB !== countA) return countB - countA; // Primary: sort by count desc
                    return actA.localeCompare(actB); // Secondary: sort by act name asc
                });
            
            const computedActFocus = sortedActs[0]?.[0] || null;
            console.log(`\nComputed Act Focus: ${computedActFocus}`);
            console.log(`Current Database Value: ${eventWithElements.act_focus}`);
            console.log(`Match: ${computedActFocus === eventWithElements.act_focus}`);
        }
    } else {
        console.log('\nNo timeline events found with element_ids');
    }
    
    // Check overall statistics
    console.log('\n=== OVERALL STATISTICS ===');
    
    const totalEvents = db.prepare('SELECT COUNT(*) as count FROM timeline_events').get();
    console.log(`Total timeline events: ${totalEvents.count}`);
    
    const eventsWithElements = db.prepare('SELECT COUNT(*) as count FROM timeline_events WHERE element_ids IS NOT NULL AND element_ids != ?').get('[]');
    console.log(`Events with elements: ${eventsWithElements.count}`);
    
    const eventsWithActFocus = db.prepare('SELECT COUNT(*) as count FROM timeline_events WHERE act_focus IS NOT NULL').get();
    console.log(`Events with act focus computed: ${eventsWithActFocus.count}`);
    
    const eventsWithoutElements = db.prepare('SELECT COUNT(*) as count FROM timeline_events WHERE element_ids IS NULL OR element_ids = ?').get('[]');
    console.log(`Events without elements: ${eventsWithoutElements.count}`);
    
    // Check elements with NULL first_available
    const elementsWithoutAct = db.prepare('SELECT COUNT(*) as count FROM elements WHERE first_available IS NULL OR first_available = ?').get('');
    const totalElements = db.prepare('SELECT COUNT(*) as count FROM elements').get();
    console.log(`\nElements without first_available: ${elementsWithoutAct.count}/${totalElements.count}`);
    
    // Check if there are timeline events that should have act focus but don't
    console.log('\n=== POTENTIAL ISSUES ===');
    
    const shouldHaveActFocus = db.prepare(`
        SELECT te.id, te.description, te.element_ids, te.act_focus
        FROM timeline_events te
        WHERE te.element_ids IS NOT NULL 
        AND te.element_ids != ? 
        AND te.act_focus IS NULL
        LIMIT 5
    `).all('[]');
    
    if (shouldHaveActFocus.length > 0) {
        console.log('\nTimeline events that should have act focus but don\'t:');
        shouldHaveActFocus.forEach(event => {
            console.log(`  ${event.description} (${event.id})`);
            console.log(`    Element IDs: ${event.element_ids}`);
        });
    } else {
        console.log('\nAll timeline events with elements have act focus computed');
    }
    
    db.close();
    console.log('\n=== ANALYSIS COMPLETE ===');
} catch (error) {
    console.error('Analysis failed:', error.message);
}