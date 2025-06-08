const Database = require('better-sqlite3');

try {
    const db = new Database('./data/production.db');
    
    console.log('=== ELEMENTS TABLE INVESTIGATION ===');
    
    // Get table schema
    const schema = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='elements'").get();
    console.log('\nElements Schema:');
    console.log(schema?.sql || 'Table not found');
    
    // Get column info
    const columns = db.prepare("PRAGMA table_info(elements)").all();
    console.log('\nColumns:');
    columns.forEach(col => {
        console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
    // Check elements count
    const count = db.prepare('SELECT COUNT(*) as count FROM elements').get();
    console.log(`\nElements count: ${count.count}`);
    
    if (count.count > 0) {
        // Get sample elements
        console.log('\nSample Elements:');
        const samples = db.prepare('SELECT * FROM elements LIMIT 10').all();
        samples.forEach(el => {
            console.log(`\nElement: ${el.id}`);
            console.log(`  Name: ${el.name}`);
            console.log(`  First Available: ${el.first_available}`);
            console.log(`  Category: ${el.category}`);
        });
        
        // Check distribution of first_available values
        console.log('\nFirst Available Distribution:');
        const distribution = db.prepare('SELECT first_available, COUNT(*) as count FROM elements GROUP BY first_available ORDER BY count DESC').all();
        distribution.forEach(row => {
            console.log(`  ${row.first_available || 'NULL'}: ${row.count}`);
        });
    }
    
    db.close();
    console.log('\n=== INVESTIGATION COMPLETE ===');
} catch (error) {
    console.error('Investigation failed:', error.message);
}