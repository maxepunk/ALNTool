const fetch = require('node-fetch');

async function testMemoryEconomyData() {
  const baseUrl = 'http://localhost:3001/api';
  
  console.log('🎮 Testing Memory Economy Page Data Requirements...\n');
  
  // Test what Memory Economy page needs
  console.log('1️⃣ Characters with Sociogram Data');
  try {
    const response = await fetch(`${baseUrl}/characters/with-sociogram-data`);
    const characters = await response.json();
    
    console.log(`✅ Got ${characters.length} characters`);
    
    // Check if we have characters with memory values
    const withMemory = characters.filter(c => c.memoryValue > 0);
    console.log(`   - Characters with memory values: ${withMemory.length}`);
    
    // Check resolution paths
    const withPaths = characters.filter(c => c.resolutionPaths && c.resolutionPaths.length > 0);
    console.log(`   - Characters with resolution paths: ${withPaths.length}`);
    
    // Show top 3 by memory value
    const topMemory = [...characters].sort((a, b) => b.memoryValue - a.memoryValue).slice(0, 3);
    console.log('\n   Top 3 by Memory Value:');
    topMemory.forEach(c => {
      console.log(`   - ${c.name}: $${c.memoryValue} (${c.elementCount} elements)`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n2️⃣ Memory Elements');
  try {
    const response = await fetch(`${baseUrl}/elements?filterGroup=memoryTypes`);
    const elements = await response.json();
    
    console.log(`✅ Got ${elements.length} memory elements`);
    
    // Group by type
    const byType = {};
    elements.forEach(el => {
      byType[el.type] = (byType[el.type] || 0) + 1;
    });
    
    console.log('   By Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });
    
    // Check computed fields
    const withValues = elements.filter(el => el.memoryValue > 0);
    console.log(`\n   Elements with memory values: ${withValues.length}`);
    
    // Show some examples
    console.log('\n   Sample Memory Elements:');
    elements.slice(0, 3).forEach(el => {
      console.log(`   - ${el.name}`);
      console.log(`     Type: ${el.type}, Value: $${el.memoryValue}`);
      console.log(`     Owner: ${el.ownerName || 'None'}`);
      console.log(`     SF Tags: Rating=${el.sf_value_rating}, Type=${el.sf_memory_type}`);
    });
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n3️⃣ Puzzles (for memory token flow)');
  try {
    const response = await fetch(`${baseUrl}/puzzles`);
    const puzzles = await response.json();
    
    console.log(`✅ Got ${puzzles.length} puzzles`);
    
    // Check if puzzles have resolution paths
    const withPaths = puzzles.filter(p => p.resolutionPaths && p.resolutionPaths.length > 0);
    console.log(`   - Puzzles with resolution paths: ${withPaths.length}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n✨ Memory Economy data check complete!');
  console.log('\nThe Memory Economy page should now have:');
  console.log('- Characters grouped by resolution paths');
  console.log('- Memory tokens with values and SF tags');
  console.log('- Production readiness indicators');
}

testMemoryEconomyData().catch(console.error);