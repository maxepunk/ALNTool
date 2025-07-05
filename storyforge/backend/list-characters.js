const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'production.db');
const db = new Database(dbPath, { readonly: true });

// List all characters
const characters = db.prepare('SELECT id, name FROM characters LIMIT 10').all();
console.log('Characters in database:');
characters.forEach(char => {
  console.log(`- ${char.name}: ${char.id}`);
});

// Check if Alex Reeves exists
const alex = db.prepare('SELECT id, name FROM characters WHERE name LIKE ?').get('%Alex%');
if (alex) {
  console.log('\nFound Alex:', alex);
}

db.close();