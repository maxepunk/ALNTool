const Database = require('better-sqlite3');
const path = require('path');
const MemoryValueExtractor = require('../src/services/compute/MemoryValueExtractor');
const MemoryValueComputer = require('../src/services/compute/MemoryValueComputer');

async function testMemoryExtraction() {
  const dbPath = path.join(__dirname, '..', 'data', 'production.db');
  const db = new Database(dbPath);

  console.log('🔍 Testing Memory Value Extraction...\n');

  try {
    // Test the extractor
    const extractor = new MemoryValueExtractor(db);
    
    // Test parsing on a known element
    const testElement = db.prepare(`
      SELECT * FROM elements 
      WHERE name LIKE '%Howie%Memory Token%'
      LIMIT 1
    `).get();

    if (testElement) {
      console.log('📝 Testing extraction on:', testElement.name);
      console.log('Description:', testElement.description?.substring(0, 200) + '...\n');

      const memoryData = extractor.extractMemoryData(testElement.description);
      console.log('Extracted data:', memoryData);
    }

    // Run full extraction
    console.log('\n🏃 Running full memory value extraction...');
    const extractedCount = await extractor.extractAllMemoryValues();
    console.log(`✅ Extracted memory values for ${extractedCount} elements\n`);

    // Check results
    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN calculated_memory_value > 0 THEN 1 END) as with_values,
        SUM(calculated_memory_value) as total_value
      FROM elements
    `).get();

    console.log('📊 Post-extraction statistics:');
    console.log(`Total elements: ${stats.total}`);
    console.log(`Elements with values: ${stats.with_values}`);
    console.log(`Total memory value: $${stats.total_value || 0}`);

    // Show extracted values
    const extractedElements = db.prepare(`
      SELECT name, rfid_tag, value_rating, memory_type, memory_group, 
             group_multiplier, calculated_memory_value
      FROM elements
      WHERE calculated_memory_value > 0
      ORDER BY calculated_memory_value DESC
      LIMIT 10
    `).all();

    if (extractedElements.length > 0) {
      console.log('\n💎 Top memory tokens by value:');
      extractedElements.forEach(el => {
        console.log(`- ${el.name}: $${el.calculated_memory_value} (${el.memory_type}, ${el.memory_group})`);
      });
    }

    // Now test the computer
    console.log('\n🧮 Testing Memory Value Computer...');
    const computer = new MemoryValueComputer(db);
    const updatedChars = await computer.computeAllCharacterMemoryValues();
    console.log(`✅ Updated memory values for ${updatedChars} characters\n`);

    // Show character memory values
    const topChars = db.prepare(`
      SELECT name, total_memory_value
      FROM characters
      WHERE total_memory_value > 0
      ORDER BY total_memory_value DESC
      LIMIT 5
    `).all();

    if (topChars.length > 0) {
      console.log('👥 Top characters by memory value:');
      topChars.forEach(char => {
        console.log(`- ${char.name}: $${char.total_memory_value}`);
      });
    } else {
      console.log('⚠️  No characters have memory values yet');
      
      // Check if characters own any memory elements
      const ownership = db.prepare(`
        SELECT c.name, COUNT(coe.element_id) as owned_elements
        FROM characters c
        LEFT JOIN character_owned_elements coe ON c.id = coe.character_id
        LEFT JOIN elements e ON coe.element_id = e.id AND e.calculated_memory_value > 0
        GROUP BY c.id
        HAVING owned_elements > 0
        LIMIT 5
      `).all();

      if (ownership.length > 0) {
        console.log('\n📋 Characters owning memory elements:');
        ownership.forEach(o => {
          console.log(`- ${o.name}: ${o.owned_elements} elements`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    db.close();
  }
}

testMemoryExtraction();