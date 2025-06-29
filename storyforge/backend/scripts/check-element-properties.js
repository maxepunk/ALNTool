const { getDB } = require('../src/db/database');

const db = getDB();

// Get the first memory element to check its full structure
const sampleElement = db.prepare(`
  SELECT * FROM elements
  WHERE type IN ('Memory Token Video', 'Memory Token Audio', 'Memory Token Physical', 'Corrupted Memory RFID', 'Memory Fragment')
  LIMIT 1
`).get();

console.log('Sample Memory Element Full Structure:');
console.log('=====================================');
console.log(JSON.stringify(sampleElement, null, 2));

// Check if there are any memory elements with properties JSON
const elementsWithProps = db.prepare(`
  SELECT id, name, 
         json_extract(properties, '$.sf_value_rating') as prop_value_rating,
         json_extract(properties, '$.sf_memory_type') as prop_memory_type,
         json_extract(properties, '$.sf_rfid') as prop_rfid,
         json_extract(properties, '$.status') as prop_status,
         properties
  FROM elements
  WHERE type IN ('Memory Token Video', 'Memory Token Audio', 'Memory Token Physical', 'Corrupted Memory RFID', 'Memory Fragment')
    AND properties IS NOT NULL
    AND properties != '{}'
`).all();

console.log('\n\nElements with Properties:');
console.log('========================');
if (elementsWithProps.length > 0) {
  elementsWithProps.forEach(el => {
    console.log(`\n${el.name}:`);
    console.log(`  Properties: ${el.properties}`);
    console.log(`  Value Rating from props: ${el.prop_value_rating}`);
    console.log(`  Memory Type from props: ${el.prop_memory_type}`);
  });
} else {
  console.log('No memory elements have properties JSON stored.');
}

// Check columns available in elements table
const tableInfo = db.prepare("PRAGMA table_info(elements)").all();
console.log('\n\nElements Table Columns:');
console.log('======================');
tableInfo.forEach(col => {
  if (col.name.includes('memory') || col.name.includes('value') || col.name.includes('rfid') || col.name.includes('sf_')) {
    console.log(`${col.name}: ${col.type}`);
  }
});