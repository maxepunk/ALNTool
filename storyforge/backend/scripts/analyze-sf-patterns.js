const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'production.db');
const db = new Database(dbPath);

// Find all elements with SF_ tags
const elements = db.prepare(`
  SELECT id, name, description
  FROM elements
  WHERE description LIKE '%SF_%'
`).all();

console.log(`Found ${elements.length} elements with SF_ tags:\n`);

elements.forEach((el, idx) => {
  console.log(`${idx + 1}. ${el.name} (ID: ${el.id})`);
  
  // Find all lines containing SF_
  const lines = el.description.split('\n');
  const sfLines = lines.filter(line => line.includes('SF_'));
  
  if (sfLines.length > 0) {
    console.log('   SF_ tags found:');
    sfLines.forEach(line => {
      console.log(`   - ${line.trim()}`);
    });
  }
  
  // Also check for embedded SF_ patterns
  const embeddedPatterns = el.description.match(/SF_\w+:[^-]*/g);
  if (embeddedPatterns) {
    console.log('   Embedded patterns:');
    embeddedPatterns.forEach(pattern => {
      console.log(`   - ${pattern.trim()}`);
    });
  }
  
  console.log('');
});

// Also check for any columns that might have SF_ data
console.log('\nChecking for SF_ data in columns:');
const columnsWithSF = db.prepare(`
  SELECT 
    COUNT(CASE WHEN rfid_tag IS NOT NULL THEN 1 END) as rfid_count,
    COUNT(CASE WHEN value_rating > 0 THEN 1 END) as rating_count,
    COUNT(CASE WHEN memory_type IS NOT NULL THEN 1 END) as type_count,
    COUNT(CASE WHEN memory_group IS NOT NULL THEN 1 END) as group_count,
    COUNT(CASE WHEN calculated_memory_value > 0 THEN 1 END) as value_count
  FROM elements
`).get();

console.log(`Elements with RFID tags: ${columnsWithSF.rfid_count}`);
console.log(`Elements with value ratings: ${columnsWithSF.rating_count}`);
console.log(`Elements with memory types: ${columnsWithSF.type_count}`);
console.log(`Elements with memory groups: ${columnsWithSF.group_count}`);
console.log(`Elements with calculated values: ${columnsWithSF.value_count}`);

db.close();