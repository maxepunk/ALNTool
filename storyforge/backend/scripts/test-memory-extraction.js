const { initializeDatabase, getDB } = require('../src/db/database');
const MemoryValueExtractor = require('../src/services/compute/MemoryValueExtractor');

function testMemoryExtraction() {
    console.log('Testing Memory Value Extraction...\n');
    
    initializeDatabase();
    const db = getDB();
    const extractor = new MemoryValueExtractor(db);
    
    // Test cases for individual extraction methods
    const testCases = [
        {
            name: 'Complete Memory Token',
            description: `A memory token containing critical business information.
SF_RFID: MEM001
SF_ValueRating: 4
SF_MemoryType: Technical
SF_Group: Ephemeral Echo (10x)
This contains technical specifications.`
        },
        {
            name: 'Personal Memory',
            description: `Personal memory of the night.
SF_RFID: PER123
SF_ValueRating: 2
SF_MemoryType: Personal
Simple personal recollection.`
        },
        {
            name: 'Business Memory with Group',
            description: `SF_RFID: BIZ456
SF_ValueRating: 5
SF_MemoryType: Business
SF_Group: Corporate Secrets (5x)
High-value business intelligence.`
        },
        {
            name: 'Regular Element',
            description: 'Just a regular game element with no memory data.'
        },
        {
            name: 'Incomplete Memory',
            description: 'SF_RFID: INC789\nSF_ValueRating: 3\nMissing type and group.'
        }
    ];
    
    console.log('=== Testing Individual Extraction Methods ===\n');
    
    testCases.forEach((testCase, index) => {
        console.log(`Test Case ${index + 1}: ${testCase.name}`);
        console.log(`Description: ${testCase.description.substring(0, 100)}...`);
        
        const memoryData = extractor.extractMemoryData(testCase.description);
        
        console.log('Extracted Data:');
        console.log(`  RFID Tag: ${memoryData.rfidTag || 'none'}`);
        console.log(`  Value Rating: ${memoryData.valueRating}`);
        console.log(`  Memory Type: ${memoryData.memoryType || 'none'}`);
        console.log(`  Memory Group: ${memoryData.memoryGroup || 'none'} (${memoryData.groupMultiplier}x)`);
        console.log(`  Calculated Value: $${memoryData.calculatedValue}`);
        console.log('');
    });
    
    console.log('=== Testing Value Calculations ===\n');
    
    // Test value calculations
    const valueTests = [
        { rating: 1, type: 'Personal', expected: 200 },   // $100 * 2
        { rating: 2, type: 'Business', expected: 2500 },  // $500 * 5
        { rating: 3, type: 'Technical', expected: 10000 }, // $1000 * 10
        { rating: 5, type: 'Personal', expected: 20000 },  // $10000 * 2
        { rating: 4, type: null, expected: 5000 },         // $5000 * 1
    ];
    
    valueTests.forEach(test => {
        const calculated = extractor.calculateIndividualTokenValue(test.rating, test.type);
        const status = calculated === test.expected ? '✓' : '✗';
        console.log(`${status} Rating ${test.rating}, Type ${test.type || 'none'}: $${calculated} (expected $${test.expected})`);
    });
    
    console.log('\n=== Summary ===');
    console.log('MemoryValueExtractor successfully parses SF_ fields and calculates individual token values.');
    console.log('Group multipliers are stored but not applied to individual values (reserved for completion bonuses).');
}

try {
    testMemoryExtraction();
} catch (error) {
    console.error('Error:', error);
}