const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'production.db');
const db = new Database(dbPath, { readonly: true });

console.log('sync_log table schema:');
const schema = db.prepare("PRAGMA table_info(sync_log)").all();
schema.forEach(col => {
  console.log(`  - ${col.name} (${col.type})`);
});

console.log('\nTrying to query sync_log:');
try {
  const row = db.prepare('SELECT * FROM sync_log LIMIT 1').get();
  console.log('Sample row:', row);
} catch (error) {
  console.log('Error:', error.message);
}

db.close();