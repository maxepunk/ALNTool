const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'production.db');
const db = new Database(dbPath, { readonly: true });

// Get all tables
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log('Tables in database:');
tables.forEach(table => {
  console.log(`- ${table.name}`);
});

// Check if character_links exists
const hasCharacterLinks = tables.some(t => t.name === 'character_links');
console.log(`\ncharacter_links table exists: ${hasCharacterLinks}`);

// Get schema for character-related tables
console.log('\nCharacter relationship tables:');
const charTables = tables.filter(t => t.name.includes('character'));
charTables.forEach(table => {
  const info = db.prepare(`PRAGMA table_info(${table.name})`).all();
  console.log(`\n${table.name}:`);
  info.forEach(col => {
    console.log(`  - ${col.name} (${col.type})`);
  });
});

db.close();