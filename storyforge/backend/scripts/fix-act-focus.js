const Database = require('better-sqlite3');
const path = require('path');
const ActFocusComputer = require('../src/services/compute/ActFocusComputer');

async function fixActFocus() {
  const dbPath = path.join(__dirname, '..', 'data', 'production.db');
  const db = new Database(dbPath);

  console.log('🔧 Fixing Act Focus for timeline events...\n');

  try {
    const computer = new ActFocusComputer(db);
    
    // Get events missing act_focus
    const missingActFocus = db.prepare(`
      SELECT id, description, element_ids
      FROM timeline_events
      WHERE act_focus IS NULL AND element_ids IS NOT NULL AND element_ids != '[]'
    `).all();

    console.log(`Found ${missingActFocus.length} events with elements but missing act_focus\n`);

    let fixed = 0;
    let errors = 0;

    for (const event of missingActFocus) {
      try {
        const result = await computer.compute(event);
        
        if (result.act_focus) {
          db.prepare(`
            UPDATE timeline_events 
            SET act_focus = ? 
            WHERE id = ?
          `).run(result.act_focus, event.id);
          
          console.log(`✅ Fixed: ${event.description?.substring(0, 50)}... => Act ${result.act_focus}`);
          fixed++;
        } else {
          console.log(`⚠️  No act determined for: ${event.description?.substring(0, 50)}...`);
        }
      } catch (error) {
        console.error(`❌ Error processing event ${event.id}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`Fixed: ${fixed} events`);
    console.log(`Errors: ${errors} events`);
    console.log(`Skipped: ${missingActFocus.length - fixed - errors} events`);

    // Check final statistics
    const finalStats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(act_focus) as with_act_focus,
        COUNT(*) - COUNT(act_focus) as missing_act_focus
      FROM timeline_events
    `).get();

    console.log(`\n📊 Final Statistics:`);
    console.log(`Total events: ${finalStats.total}`);
    console.log(`Events with act_focus: ${finalStats.with_act_focus}`);
    console.log(`Events missing act_focus: ${finalStats.missing_act_focus}`);
    console.log(`Completion rate: ${((finalStats.with_act_focus / finalStats.total) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    db.close();
  }
}

fixActFocus();