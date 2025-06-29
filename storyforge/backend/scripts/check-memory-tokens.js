const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'production.db');
const db = new Database(dbPath);

// Find all memory tokens
const memoryTokens = db.prepare(`
  SELECT id, name, description
  FROM elements
  WHERE name LIKE '%Memory Token%'
  ORDER BY name
`).all();

console.log(`Found ${memoryTokens.length} memory tokens:\n`);

memoryTokens.forEach((token, idx) => {
  console.log(`${idx + 1}. ${token.name}`);
  console.log(`   ID: ${token.id}`);
  
  if (token.description) {
    const preview = token.description.substring(0, 300);
    console.log(`   Description preview: ${preview}...`);
    
    // Check if it has SF_ tags
    if (token.description.includes('SF_')) {
      console.log('   ✅ Has SF_ tags');
    } else {
      console.log('   ❌ No SF_ tags found');
    }
  } else {
    console.log('   ❌ No description');
  }
  
  console.log('');
});

db.close();