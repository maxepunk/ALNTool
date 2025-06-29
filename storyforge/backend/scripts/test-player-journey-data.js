const fetch = require('node-fetch');

async function testPlayerJourneyData() {
  const baseUrl = 'http://localhost:3001/api';
  
  console.log('🎮 Testing Player Journey Page Data Requirements...\n');
  
  // First get characters to find one with good data
  console.log('1️⃣ Getting characters list');
  try {
    const response = await fetch(`${baseUrl}/characters`);
    const characters = await response.json();
    
    console.log(`✅ Got ${characters.length} characters`);
    
    // Find a character with elements/events (Alex Reeves seems to have good data)
    const testCharacter = characters.find(c => c.name === 'Alex Reeves') || characters[0];
    console.log(`   Using test character: ${testCharacter.name} (${testCharacter.id})`);
    
    // Test journey endpoint
    console.log('\n2️⃣ Testing Journey Endpoint');
    const journeyResponse = await fetch(`${baseUrl}/journeys/${testCharacter.id}`);
    
    if (!journeyResponse.ok) {
      console.log(`❌ Journey endpoint failed with status ${journeyResponse.status}`);
      const error = await journeyResponse.json();
      console.log(`   Error: ${JSON.stringify(error)}`);
      return;
    }
    
    const journeyData = await journeyResponse.json();
    console.log(`✅ Got journey data`);
    
    // Check structure
    console.log('\n   Journey Structure:');
    console.log(`   - Has character_info: ${!!journeyData.character_info}`);
    console.log(`   - Has graph: ${!!journeyData.graph}`);
    
    if (journeyData.character_info) {
      const info = journeyData.character_info;
      console.log('\n   Character Info:');
      console.log(`   - Name: ${info.name}`);
      console.log(`   - Tier: ${info.tier}`);
      console.log(`   - Type: ${info.type}`);
      console.log(`   - Resolution Paths: ${info.resolutionPaths?.length || 0}`);
      console.log(`   - Memory Value: $${info.memoryValue || 0}`);
    }
    
    if (journeyData.graph) {
      const graph = journeyData.graph;
      console.log('\n   Graph Data:');
      console.log(`   - Nodes: ${graph.nodes?.length || 0}`);
      console.log(`   - Edges: ${graph.edges?.length || 0}`);
      
      if (graph.nodes && graph.nodes.length > 0) {
        console.log('\n   Sample Nodes:');
        graph.nodes.slice(0, 3).forEach(node => {
          console.log(`   - ${node.data.label} (${node.type})`);
          if (node.data.act) console.log(`     Act: ${node.data.act}`);
          if (node.data.memory_value) console.log(`     Memory Value: $${node.data.memory_value}`);
        });
      }
    }
    
    // Test with more characters
    console.log('\n3️⃣ Testing Multiple Characters');
    const testChars = ['Marcus Blackwood', 'Sarah Blackwood', 'Victoria Kingsley'];
    for (const charName of testChars) {
      const char = characters.find(c => c.name === charName);
      if (char) {
        const response = await fetch(`${baseUrl}/journeys/${char.id}`);
        console.log(`   ${charName}: ${response.ok ? '✅ Success' : '❌ Failed'}`);
      }
    }
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n✨ Player Journey data check complete!');
}

testPlayerJourneyData().catch(console.error);