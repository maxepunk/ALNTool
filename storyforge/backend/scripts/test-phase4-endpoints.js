const fetch = require('node-fetch');

async function testEndpoints() {
  const baseUrl = 'http://localhost:3001/api';
  
  console.log('🧪 Testing Phase 4+ Feature Endpoints...\n');
  
  // Test 1: Characters with Sociogram Data
  console.log('1️⃣ Testing /characters/with-sociogram-data');
  try {
    const response = await fetch(`${baseUrl}/characters/with-sociogram-data`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success! Got ${data.length} characters`);
      if (data.length > 0) {
        const sample = data[0];
        console.log(`   Sample character: ${sample.name}`);
        console.log(`   - Memory Value: $${sample.memoryValue || 0}`);
        console.log(`   - Relationships: ${sample.relationshipCount || 0}`);
        console.log(`   - Elements: ${sample.elementCount || 0}`);
        console.log(`   - Resolution Paths: ${sample.resolutionPaths?.length || 0}`);
      }
    } else {
      console.log(`❌ Failed with status ${response.status}`);
      console.log(`   Error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 2: Elements with Memory Type Filter
  console.log('\n2️⃣ Testing /elements?filterGroup=memoryTypes');
  try {
    const response = await fetch(`${baseUrl}/elements?filterGroup=memoryTypes`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success! Got ${data.length} memory elements`);
      if (data.length > 0) {
        const sample = data[0];
        console.log(`   Sample element: ${sample.name}`);
        console.log(`   - Type: ${sample.type}`);
        console.log(`   - Memory Value: $${sample.memoryValue || 0}`);
        console.log(`   - SF Value Rating: ${sample.sf_value_rating || 0}`);
        console.log(`   - SF Memory Type: ${sample.sf_memory_type || 'Unknown'}`);
        console.log(`   - Owner: ${sample.ownerName || 'None'}`);
      }
    } else {
      console.log(`❌ Failed with status ${response.status}`);
      console.log(`   Error: ${JSON.stringify(data)}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  // Test 3: Regular Elements (should still work)
  console.log('\n3️⃣ Testing /elements (regular)');
  try {
    const response = await fetch(`${baseUrl}/elements`);
    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ Success! Got ${data.length} total elements`);
    } else {
      console.log(`❌ Failed with status ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
  
  console.log('\n✨ Test complete!');
}

testEndpoints().catch(console.error);