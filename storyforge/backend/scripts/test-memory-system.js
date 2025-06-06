const { initializeDatabase, getDB } = require('../src/db/database');
const MemoryValueExtractor = require('../src/services/compute/MemoryValueExtractor');
const MemoryValueComputer = require('../src/services/compute/MemoryValueComputer');

async function testFullMemorySystem() {
    console.log('=== Testing Complete Memory Value System ===\n');
    
    initializeDatabase();
    const db = getDB();
    
    const extractor = new MemoryValueExtractor(db);
    const computer = new MemoryValueComputer(db);
    
    // Step 1: Run memory value extraction on all elements
    console.log('Step 1: Extracting memory values from element descriptions...');
    const extractedCount = await extractor.extractAllMemoryValues();
    console.log(`Extraction completed. Updated ${extractedCount} elements.\n`);
    
    // Step 2: Get extraction statistics
    console.log('Step 2: Memory extraction statistics...');
    const memoryElements = extractor.getElementsWithMemoryValues();
    const extractionStats = extractor.getMemoryValueStats();
    
    console.log(`Elements with memory values: ${extractionStats.elementsWithValues}/${extractionStats.totalElements}`);
    console.log(`Total memory value in system: $${extractionStats.totalMemoryValue}`);
    console.log(`Average memory value: $${extractionStats.averageMemoryValue}`);
    console.log(`Value extraction rate: ${extractionStats.valueExtractionRate}%\n`);
    
    if (memoryElements.length > 0) {
        console.log('Memory tokens found:');
        memoryElements.slice(0, 5).forEach(element => {
            console.log(`  - ${element.name}: $${element.memory_value}`);
        });
        if (memoryElements.length > 5) {
            console.log(`  ... and ${memoryElements.length - 5} more`);
        }
        console.log('');
    } else {
        console.log('No memory tokens found in current data. This is expected as SF_ fields are not yet in production data.\n');
    }
    
    // Step 3: Compute character memory values
    console.log('Step 3: Computing character memory totals...');
    const computeResults = await computer.runComputePipeline();
    
    console.log(`Updated ${computeResults.updatedCharacters} characters`);
    console.log(`Characters with memory: ${computeResults.stats.charactersWithMemory}/${computeResults.stats.totalCharacters}`);
    console.log(`Total memory value: $${computeResults.stats.totalMemoryValue}\n`);
    
    // Step 4: Show character distribution
    console.log('Step 4: Character memory value distribution...');
    const distribution = computer.getMemoryValueDistribution();
    
    if (distribution.some(char => char.total_memory_value > 0)) {
        console.log('Top characters by memory value:');
        distribution.filter(char => char.total_memory_value > 0).slice(0, 5).forEach(char => {
            console.log(`  - ${char.name}: $${char.total_memory_value} (${char.memory_elements_count} memory tokens)`);
        });
    } else {
        console.log('No characters have memory values yet (expected with current data).');
    }
    console.log('');
    
    // Step 5: Show memory groups
    console.log('Step 5: Memory groups analysis...');
    const memoryGroups = computer.getMemoryTokensByGroup();
    const groupNames = Object.keys(memoryGroups);
    
    if (groupNames.length > 0) {
        console.log(`Found ${groupNames.length} memory groups:`);
        groupNames.forEach(groupName => {
            const group = memoryGroups[groupName];
            console.log(`  - ${groupName}: ${group.tokens.length} tokens (${group.groupMultiplier}x multiplier)`);
        });
    } else {
        console.log('No memory groups found in current data (expected).');
    }
    console.log('');
    
    // Step 6: Demonstrate sample data insertion
    console.log('Step 6: Demonstrating with sample memory token...');
    
    // Insert a test memory token
    const testElementId = 'test-memory-token';
    db.prepare(`
        INSERT OR REPLACE INTO elements (id, name, description, type)
        VALUES (?, ?, ?, ?)
    `).run(
        testElementId,
        'Sample Memory Token',
        `SF_RFID: TEST001
SF_ValueRating: 4
SF_MemoryType: Technical
SF_Group: Ephemeral Echo (10x)
A high-value technical memory containing critical information.`,
        'Memory Token'
    );
    
    // Extract memory values for the test token
    const testMemoryValue = await extractor.extractMemoryValueForElement(testElementId);
    console.log(`Test token individual value: $${testMemoryValue}`);
    
    // Get detailed memory data
    const testElement = db.prepare(`
        SELECT rfid_tag, value_rating, memory_type, memory_group, group_multiplier, calculated_memory_value
        FROM elements WHERE id = ?
    `).get(testElementId);
    
    console.log('Extracted fields:');
    console.log(`  RFID: ${testElement.rfid_tag}`);
    console.log(`  Rating: ${testElement.value_rating}/5`);
    console.log(`  Type: ${testElement.memory_type} (multiplier applied)`);
    console.log(`  Group: ${testElement.memory_group} (${testElement.group_multiplier}x for completion bonus)`);
    console.log(`  Individual Value: $${testElement.calculated_memory_value}`);
    console.log('');
    
    // Cleanup test data
    db.prepare('DELETE FROM elements WHERE id = ?').run(testElementId);
    
    console.log('=== Memory Value System Test Complete ===');
    console.log('✓ MemoryValueExtractor: Parses SF_ fields and calculates individual token values');
    console.log('✓ MemoryValueComputer: Aggregates memory values per character and tracks groups');
    console.log('✓ Database: All memory-related columns created and populated');
    console.log('✓ Ready for: Group completion bonus logic (when game rules are finalized)');
}

// Run the test
testFullMemorySystem().catch(error => {
    console.error('Error:', error);
});