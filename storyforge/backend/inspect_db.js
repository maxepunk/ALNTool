const Database = require('better-sqlite3');

try {
    const db = new Database('./data/production.db');
    
    console.log('=== DATABASE INSPECTION ===');
    
    // Check tables
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Tables:', tables.map(t => t.name));
    
    // Check characters table
    const charCount = db.prepare('SELECT COUNT(*) as count FROM characters').get();
    console.log(`\nCharacters count: ${charCount.count}`);
    
    if (charCount.count > 0) {
        const sampleChars = db.prepare('SELECT * FROM characters LIMIT 3').all();
        console.log('Sample characters:', sampleChars);
    }
    
    // Check other tables
    const tables_to_check = ['elements', 'puzzles', 'timeline_events'];
    for (const table of tables_to_check) {
        try {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
            console.log(`${table} count: ${count.count}`);
        } catch (e) {
            console.log(`${table}: Error - ${e.message}`);
        }
    }
    
    db.close();
    console.log('\n=== INSPECTION COMPLETE ===');
} catch (error) {
    console.error('Database inspection failed:', error.message);
} 