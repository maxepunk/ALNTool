const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'production.db');
const db = new Database(dbPath);

console.log('🔍 Checking Act Focus in timeline_events...\n');

// Check overall statistics
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    COUNT(act_focus) as with_act_focus,
    COUNT(*) - COUNT(act_focus) as missing_act_focus
  FROM timeline_events
`).get();

console.log('📊 Timeline Event Statistics:');
console.log(`Total events: ${stats.total}`);
console.log(`Events with act_focus: ${stats.with_act_focus}`);
console.log(`Events missing act_focus: ${stats.missing_act_focus}`);
console.log(`Completion rate: ${((stats.with_act_focus / stats.total) * 100).toFixed(1)}%\n`);

// Check element_ids column
const elementIdStats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    COUNT(element_ids) as has_element_ids,
    COUNT(CASE WHEN element_ids = '[]' THEN 1 END) as empty_arrays,
    COUNT(CASE WHEN element_ids IS NOT NULL AND element_ids != '[]' THEN 1 END) as with_elements
  FROM timeline_events
`).get();

console.log('🔗 Element IDs Statistics:');
console.log(`Has element_ids column: ${elementIdStats.has_element_ids}`);
console.log(`Empty arrays []: ${elementIdStats.empty_arrays}`);
console.log(`With actual elements: ${elementIdStats.with_elements}`);

// Sample some events without act_focus
const missingActFocus = db.prepare(`
  SELECT id, description, element_ids, act_focus
  FROM timeline_events
  WHERE act_focus IS NULL
  LIMIT 5
`).all();

if (missingActFocus.length > 0) {
  console.log('\n❌ Sample events missing act_focus:');
  missingActFocus.forEach((event, idx) => {
    console.log(`\n${idx + 1}. ${event.description?.substring(0, 60)}...`);
    console.log(`   ID: ${event.id}`);
    console.log(`   element_ids: ${event.element_ids || 'NULL'}`);
  });
}

// Check relationship tables
console.log('\n🔍 Checking relationship tables...');

// Check if timeline_event_elements table exists
const tableExists = db.prepare(`
  SELECT name FROM sqlite_master 
  WHERE type='table' AND name='timeline_event_elements'
`).get();

if (tableExists) {
  const eventElementRelations = db.prepare(`
    SELECT COUNT(*) as count
    FROM timeline_event_elements
  `).get();
  console.log(`timeline_event_elements table has ${eventElementRelations.count} relationships`);
} else {
  console.log('❌ timeline_event_elements table does not exist');
  
  // Check character_timeline_events instead
  const charEventRelations = db.prepare(`
    SELECT COUNT(*) as count
    FROM character_timeline_events
  `).get();
  console.log(`character_timeline_events table has ${charEventRelations.count} relationships`);
}

// Look at element_ids field in one of the events with elements
const eventWithElements = db.prepare(`
  SELECT id, description, element_ids
  FROM timeline_events
  WHERE element_ids IS NOT NULL AND element_ids != '[]'
  LIMIT 1
`).get();

if (eventWithElements) {
  console.log(`\n🔍 Sample event with elements:`);
  console.log(`Event: ${eventWithElements.description?.substring(0, 60)}...`);
  console.log(`element_ids: ${eventWithElements.element_ids}`);
  
  // Parse and check the elements
  try {
    const elementIds = JSON.parse(eventWithElements.element_ids);
    if (elementIds.length > 0) {
      const placeholders = elementIds.map(() => '?').join(',');
      const elements = db.prepare(`
        SELECT id, name, first_available
        FROM elements
        WHERE id IN (${placeholders})
      `).all(...elementIds);
      
      console.log(`\nFound ${elements.length} elements:`);
      elements.forEach(el => {
        console.log(`  - ${el.name} (Act: ${el.first_available || 'NULL'})`);
      });
    }
  } catch (e) {
    console.log('Error parsing element_ids:', e.message);
  }
}

// Check if elements have first_available populated
const elementActStats = db.prepare(`
  SELECT 
    COUNT(*) as total,
    COUNT(first_available) as with_act,
    COUNT(*) - COUNT(first_available) as missing_act
  FROM elements
`).get();

console.log('\n📊 Elements Act Statistics:');
console.log(`Total elements: ${elementActStats.total}`);
console.log(`Elements with first_available: ${elementActStats.with_act}`);
console.log(`Elements missing first_available: ${elementActStats.missing_act}`);

db.close();