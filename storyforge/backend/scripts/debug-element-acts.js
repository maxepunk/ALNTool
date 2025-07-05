const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'production.db');
const db = new Database(dbPath);

console.log('🔍 Debugging element acts...\n');

// Sample an event with elements
const sampleEvent = db.prepare(`
  SELECT id, description, element_ids
  FROM timeline_events
  WHERE element_ids IS NOT NULL AND element_ids != '[]' AND act_focus IS NULL
  LIMIT 1
`).get();

if (sampleEvent) {
  console.log(`Sample event: ${sampleEvent.description?.substring(0, 60)}...`);
  console.log(`Event ID: ${sampleEvent.id}`);
  console.log(`element_ids: ${sampleEvent.element_ids}\n`);
  
  try {
    const elementIds = JSON.parse(sampleEvent.element_ids);
    console.log(`Parsed ${elementIds.length} element IDs\n`);
    
    // Check each element
    elementIds.forEach((elementId, idx) => {
      const element = db.prepare(`
        SELECT id, name, first_available, type
        FROM elements
        WHERE id = ?
      `).get(elementId);
      
      if (element) {
        console.log(`${idx + 1}. Element: ${element.name}`);
        console.log(`   ID: ${element.id}`);
        console.log(`   Type: ${element.type || 'NULL'}`);
        console.log(`   first_available: ${element.first_available || 'NULL'}`);
      } else {
        console.log(`${idx + 1}. ❌ Element not found: ${elementId}`);
      }
      console.log('');
    });
  } catch (e) {
    console.log('Error parsing element_ids:', e.message);
  }
}

// Check the distribution of first_available values
console.log('\n📊 Distribution of first_available values in elements:');
const actDistribution = db.prepare(`
  SELECT first_available, COUNT(*) as count
  FROM elements
  GROUP BY first_available
  ORDER BY count DESC
`).all();

actDistribution.forEach(row => {
  console.log(`${row.first_available || 'NULL'}: ${row.count} elements`);
});

// Check a few elements to see their actual first_available values
console.log('\n🔍 Sample elements with their first_available values:');
const sampleElements = db.prepare(`
  SELECT name, first_available, type
  FROM elements
  WHERE first_available IS NOT NULL
  LIMIT 10
`).all();

sampleElements.forEach((el, idx) => {
  console.log(`${idx + 1}. ${el.name}`);
  console.log(`   Type: ${el.type}`);
  console.log(`   first_available: ${el.first_available}`);
});

db.close();