const Database = require('better-sqlite3');
const path = require('path');

async function verifyActFocus() {
  const dbPath = path.join(__dirname, '..', 'data', 'production.db');
  const db = new Database(dbPath);

  console.log('✅ Checking successful act focus computations...\n');

// Get events with act_focus
const eventsWithActFocus = db.prepare(`
  SELECT id, description, element_ids, act_focus
  FROM timeline_events
  WHERE act_focus IS NOT NULL
  LIMIT 5
`).all();

console.log(`Found ${eventsWithActFocus.length} events with act_focus:\n`);

eventsWithActFocus.forEach((event, idx) => {
  console.log(`${idx + 1}. ${event.description?.substring(0, 60)}...`);
  console.log(`   Act Focus: ${event.act_focus}`);
  console.log(`   element_ids: ${event.element_ids}`);
  
  // Check the elements
  try {
    const elementIds = JSON.parse(event.element_ids || '[]');
    if (elementIds.length > 0) {
      const placeholders = elementIds.map(() => '?').join(',');
      const elements = db.prepare(`
        SELECT name, first_available
        FROM elements
        WHERE id IN (${placeholders})
      `).all(...elementIds);
      
      console.log(`   Elements (${elements.length}):`);
      elements.forEach(el => {
        console.log(`     - ${el.name} (Act: ${el.first_available || 'NULL'})`);
      });
    }
  } catch (e) {
    console.log(`   Error parsing elements: ${e.message}`);
  }
  console.log('');
});

// Check if act focus is working for new computations
console.log('🔧 Testing ActFocusComputer on a specific event...\n');

const ActFocusComputer = require('../src/services/compute/ActFocusComputer');
const computer = new ActFocusComputer(db);

// Find an event with mixed act elements
const testEvent = db.prepare(`
  SELECT id, description, element_ids
  FROM timeline_events
  WHERE id = '2052f33d-583f-8177-9ef1-cf83eb762f15'
`).get();

if (testEvent) {
  console.log(`Test event: ${testEvent.description?.substring(0, 60)}...`);
  console.log(`element_ids: ${testEvent.element_ids}`);
  
  const result = await computer.compute(testEvent);
  console.log(`Computed act_focus: ${result.act_focus}`);
  
  // Verify the computation
  const elementIds = JSON.parse(testEvent.element_ids);
  const placeholders = elementIds.map(() => '?').join(',');
  const elements = db.prepare(`
    SELECT name, first_available
    FROM elements
    WHERE id IN (${placeholders})
  `).all(...elementIds);
  
  console.log('\nElements in this event:');
  elements.forEach(el => {
    console.log(`- ${el.name}: Act ${el.first_available || 'NULL'}`);
  });
}

  db.close();
}

verifyActFocus().catch(console.error);