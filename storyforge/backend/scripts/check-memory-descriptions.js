const { getDB } = require('../src/db/database');

const db = getDB();

// Get all memory elements with their descriptions
const memoryElements = db.prepare(`
  SELECT id, name, type, description, 
         rfid_tag, value_rating, memory_type, calculated_memory_value
  FROM elements
  WHERE type IN ('Memory Token Video', 'Memory Token Audio', 'Memory Token Physical', 'Corrupted Memory RFID', 'Memory Fragment')
  ORDER BY name
`).all();

console.log('Memory Elements Analysis:');
console.log('========================');
console.log(`Total memory elements: ${memoryElements.length}\n`);

memoryElements.forEach((el, index) => {
  console.log(`${index + 1}. ${el.name} (${el.type})`);
  console.log(`   Value Rating: ${el.value_rating || 'Not extracted'}`);
  console.log(`   Memory Type: ${el.memory_type || 'Not extracted'}`);
  console.log(`   RFID Tag: ${el.rfid_tag || 'Not extracted'}`);
  console.log(`   Calculated Value: $${el.calculated_memory_value || 0}`);
  
  if (el.description) {
    console.log(`   Description Preview: ${el.description.substring(0, 200)}...`);
    
    // Check if description contains SF_ tags
    const hasSFTags = el.description.includes('SF_');
    console.log(`   Contains SF_ tags: ${hasSFTags ? 'YES' : 'NO'}`);
    
    if (hasSFTags) {
      // Extract and show SF_ tags
      const sfMatches = el.description.match(/SF_\w+:\s*\[?[^\]\n]+\]?/gi);
      if (sfMatches) {
        console.log(`   Found tags: ${sfMatches.join(', ')}`);
      }
    }
  } else {
    console.log(`   Description: NO DESCRIPTION`);
  }
  console.log('');
});