/**
 * Verify why 42 timeline events have null act_focus despite having related elements
 */

const { getDB, initializeDatabase } = require('../src/db/database');

async function verifyActFocus() {
  try {
    console.log('🔍 Verifying Act Focus Computation...\n');
    
    await initializeDatabase();
    const db = getDB();
    
    // Find timeline events with null act_focus that should have values
    const eventsWithNullFocus = db.prepare(`
      SELECT DISTINCT te.id, te.description, COUNT(e.id) as element_count
      FROM timeline_events te
      LEFT JOIN elements e ON e.timeline_event_id = te.id
      WHERE te.act_focus IS NULL
      GROUP BY te.id
      HAVING element_count > 0
    `).all();
    
    console.log(`Found ${eventsWithNullFocus.length} timeline events with null act_focus but related elements:\n`);
    
    // Analyze each event
    for (const event of eventsWithNullFocus.slice(0, 5)) {
      console.log(`\n📅 Event: ${event.description.substring(0, 50)}...`);
      console.log(`   ID: ${event.id}`);
      console.log(`   Elements: ${event.element_count}`);
      
      // Get the elements
      const elements = db.prepare(`
        SELECT id, name, type, act_focus
        FROM elements
        WHERE timeline_event_id = ?
      `).all(event.id);
      
      // Check element act_focus values
      const elementsWithFocus = elements.filter(e => e.act_focus !== null);
      console.log(`   Elements with act_focus: ${elementsWithFocus.length}/${elements.length}`);
      
      if (elementsWithFocus.length > 0) {
        // Calculate what the timeline event act_focus should be
        const totalFocus = elementsWithFocus.reduce((sum, e) => sum + (e.act_focus || 0), 0);
        console.log(`   Expected timeline act_focus: ${totalFocus}`);
      }
      
      // Sample elements
      console.log('   Sample elements:');
      elements.slice(0, 3).forEach(e => {
        console.log(`     - ${e.name} (${e.type}): act_focus=${e.act_focus}`);
      });
    }
    
    // Check if ActFocusComputer is working
    console.log('\n📊 Act Focus Statistics:');
    
    const stats = {
      totalEvents: db.prepare('SELECT COUNT(*) as count FROM timeline_events').get().count,
      eventsWithFocus: db.prepare('SELECT COUNT(*) as count FROM timeline_events WHERE act_focus IS NOT NULL').get().count,
      eventsWithNullFocus: db.prepare('SELECT COUNT(*) as count FROM timeline_events WHERE act_focus IS NULL').get().count,
      elementsWithFocus: db.prepare('SELECT COUNT(*) as count FROM elements WHERE act_focus IS NOT NULL').get().count,
      elementsWithNullFocus: db.prepare('SELECT COUNT(*) as count FROM elements WHERE act_focus IS NULL').get().count
    };
    
    console.log(`Timeline Events:`);
    console.log(`  Total: ${stats.totalEvents}`);
    console.log(`  With act_focus: ${stats.eventsWithFocus}`);
    console.log(`  Without act_focus: ${stats.eventsWithNullFocus}`);
    
    console.log(`\nElements:`);
    console.log(`  With act_focus: ${stats.elementsWithFocus}`);
    console.log(`  Without act_focus: ${stats.elementsWithNullFocus}`);
    
    // Check if compute was ever run
    const lastSync = db.prepare(`
      SELECT * FROM sync_log 
      WHERE entity_type = 'compute_act_focus' 
      ORDER BY end_time DESC 
      LIMIT 1
    `).get();
    
    if (lastSync) {
      console.log(`\n🕒 Last Act Focus Compute:`);
      console.log(`  Time: ${lastSync.end_time}`);
      console.log(`  Records: ${lastSync.records_processed}`);
      console.log(`  Errors: ${lastSync.error_count}`);
    } else {
      console.log(`\n⚠️  No record of Act Focus computation in sync_log`);
    }
    
  } catch (error) {
    console.error('Verification failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  verifyActFocus()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = verifyActFocus;