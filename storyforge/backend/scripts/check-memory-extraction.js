const { getDB } = require('../src/db/database');

const db = getDB();

// Get memory value statistics
const stats = db.prepare(`
  SELECT 
    COUNT(*) as total_elements,
    COUNT(CASE WHEN value_rating > 0 THEN 1 END) as elements_with_ratings,
    COUNT(CASE WHEN memory_type IS NOT NULL THEN 1 END) as elements_with_types,
    COUNT(CASE WHEN rfid_tag IS NOT NULL THEN 1 END) as elements_with_rfid,
    COUNT(CASE WHEN calculated_memory_value > 0 THEN 1 END) as elements_with_values,
    SUM(calculated_memory_value) as total_memory_value
  FROM elements
  WHERE type IN ('Memory Token Video', 'Memory Token Audio', 'Memory Token Physical', 'Corrupted Memory RFID', 'Memory Fragment')
`).get();

console.log('Memory Value Extraction Status:');
console.log('==============================');
console.log(`Total memory elements: ${stats.total_elements}`);
console.log(`Elements with value ratings: ${stats.elements_with_ratings}`);
console.log(`Elements with memory types: ${stats.elements_with_types}`);
console.log(`Elements with RFID tags: ${stats.elements_with_rfid}`);
console.log(`Elements with calculated values: ${stats.elements_with_values}`);
console.log(`Total memory value: $${stats.total_memory_value || 0}`);

// Check if extraction has been run
if (stats.elements_with_values === 0) {
  console.log('\n⚠️  Memory values have NOT been extracted yet!');
  console.log('Run: node scripts/sync-data.js to extract memory values');
} else {
  console.log('\n✅ Memory values have been extracted');
  
  // Show some examples
  const examples = db.prepare(`
    SELECT name, value_rating, memory_type, rfid_tag, calculated_memory_value
    FROM elements
    WHERE calculated_memory_value > 0
    LIMIT 5
  `).all();
  
  console.log('\nExample memory tokens:');
  examples.forEach(e => {
    console.log(`- ${e.name}: Rating=${e.value_rating}, Type=${e.memory_type}, Value=$${e.calculated_memory_value}`);
  });
}