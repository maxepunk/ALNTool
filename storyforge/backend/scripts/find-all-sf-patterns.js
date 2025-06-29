const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'production.db');
const db = new Database(dbPath);

// Find all elements with SF_ tags
const elements = db.prepare(`
  SELECT name, description
  FROM elements
  WHERE description LIKE '%SF_%'
`).all();

console.log(`Found ${elements.length} elements with SF_ tags:\n`);

elements.forEach((el, idx) => {
  console.log(`${idx + 1}. ${el.name}`);
  
  // Extract all SF_ patterns
  const sfPatterns = el.description.match(/SF_[^:]+:[^\n]*/g);
  if (sfPatterns) {
    sfPatterns.forEach(pattern => {
      console.log(`   ${pattern.trim()}`);
    });
  } else {
    // Try different pattern
    const altPatterns = el.description.match(/SF_\w+[^]*?(?=SF_|$)/g);
    if (altPatterns) {
      altPatterns.forEach(pattern => {
        console.log(`   ALT: ${pattern.trim().substring(0, 100)}...`);
      });
    }
  }
  console.log('');
});

db.close();