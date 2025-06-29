const { getDB } = require('../src/db/database');

function examineMemoryValues() {
    console.log('Examining element descriptions for memory value patterns...\n');
    
    const db = getDB();
    
    // Get all elements with descriptions
    const elements = db.prepare(`
        SELECT id, name, description 
        FROM elements 
        WHERE description IS NOT NULL 
        ORDER BY name
    `).all();
    
    console.log(`Found ${elements.length} elements with descriptions\n`);
    
    // Look for SF_ValueRating patterns
    const valuePatterns = [
        /SF_ValueRating:\s*(\d+)/i,
        /memory.*value:\s*(\d+)/i,
        /value.*rating:\s*(\d+)/i,
        /rating:\s*(\d+)/i,
        /(\d+)\s*points?/i,
        /worth\s*(\d+)/i
    ];
    
    let foundPatterns = 0;
    
    elements.forEach(element => {
        let found = false;
        
        valuePatterns.forEach((pattern, index) => {
            const match = element.description.match(pattern);
            if (match && !found) {
                console.log(`✓ PATTERN ${index + 1}: ${element.name}`);
                console.log(`  Description: ${element.description.substring(0, 200)}...`);
                console.log(`  Match: "${match[0]}" -> Value: ${match[1]}\n`);
                found = true;
                foundPatterns++;
            }
        });
        
        // Also check for any number patterns
        if (!found && /\d+/.test(element.description)) {
            const numbers = element.description.match(/\d+/g);
            if (numbers && numbers.length <= 3) { // Avoid descriptions with too many numbers
                console.log(`? NUMBERS: ${element.name}`);
                console.log(`  Numbers found: ${numbers.join(', ')}`);
                console.log(`  Description: ${element.description.substring(0, 150)}...\n`);
            }
        }
    });
    
    console.log(`\nSummary: Found ${foundPatterns} elements with clear memory value patterns out of ${elements.length} total elements`);
}

// Initialize database and run examination
const { initializeDatabase } = require('../src/db/database');

try {
    initializeDatabase();
    examineMemoryValues();
} catch (error) {
    console.error('Error:', error);
}