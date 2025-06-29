const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'production.db');
const db = new Database(dbPath);

console.log('🔍 Analyzing first_available field in elements...\n');

// Check different values of first_available
const distinctValues = db.prepare(`
  SELECT DISTINCT first_available, 
         CASE 
           WHEN first_available IS NULL THEN 'NULL'
           WHEN first_available = '' THEN 'EMPTY_STRING'
           ELSE first_available
         END as display_value
  FROM elements
`).all();

console.log('Distinct first_available values:');
distinctValues.forEach(row => {
  console.log(`- "${row.first_available}" (displayed as: ${row.display_value})`);
});

// Check the actual distribution
const distribution = db.prepare(`
  SELECT 
    CASE 
      WHEN first_available IS NULL THEN 'NULL'
      WHEN first_available = '' THEN 'EMPTY_STRING'
      WHEN first_available = 'Act 1' THEN 'Act 1'
      WHEN first_available = 'Act 2' THEN 'Act 2'
      ELSE 'OTHER: ' || first_available
    END as act_value,
    COUNT(*) as count
  FROM elements
  GROUP BY act_value
  ORDER BY count DESC
`).all();

console.log('\n📊 Distribution:');
distribution.forEach(row => {
  console.log(`${row.act_value}: ${row.count} elements`);
});

// Check specific elements that should have acts
console.log('\n🔍 Checking elements that should have acts:');
const puzzleRewards = db.prepare(`
  SELECT e.id, e.name, e.type, e.first_available,
         CASE 
           WHEN e.first_available IS NULL THEN 'NULL'
           WHEN e.first_available = '' THEN 'EMPTY_STRING'
           ELSE e.first_available
         END as act_display
  FROM elements e
  WHERE e.name LIKE '%Memory%' OR e.name LIKE '%Note%' OR e.name LIKE '%Letter%'
  LIMIT 10
`).all();

puzzleRewards.forEach((el, idx) => {
  console.log(`${idx + 1}. ${el.name}`);
  console.log(`   Type: ${el.type}`);
  console.log(`   first_available: "${el.first_available}" (${el.act_display})`);
});

// Update empty strings to NULL for consistency
console.log('\n🔧 Fixing empty strings...');
const updateResult = db.prepare(`
  UPDATE elements 
  SET first_available = NULL 
  WHERE first_available = ''
`).run();

console.log(`Updated ${updateResult.changes} rows from empty string to NULL`);

// Check final distribution
const finalDistribution = db.prepare(`
  SELECT 
    COALESCE(first_available, 'NULL') as act_value,
    COUNT(*) as count
  FROM elements
  GROUP BY first_available
  ORDER BY count DESC
`).all();

console.log('\n📊 Final Distribution:');
finalDistribution.forEach(row => {
  console.log(`${row.act_value}: ${row.count} elements`);
});

db.close();