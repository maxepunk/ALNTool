/**
 * Direct API test to isolate data fetching issues
 */

// Set up environment
process.env.NODE_ENV = 'development';
process.env.VITE_API_BASE_URL = 'http://localhost:3001';

// Import API service
import api from './src/services/api.js';

async function testAPI() {
  console.log('🔍 Testing API Layer Directly...\n');
  
  try {
    // Test 1: Get Characters
    console.log('1. Testing getCharacters()...');
    const charactersResult = await api.getCharacters();
    console.log('✅ Characters response:', {
      isArray: Array.isArray(charactersResult),
      length: charactersResult?.length,
      firstCharacter: charactersResult?.[0]
    });
    
    // Test 2: Get Elements with performance filter
    console.log('\n2. Testing getElements() with filterGroup...');
    const elementsResult = await api.getElements({ filterGroup: 'memoryTypes' });
    console.log('✅ Elements response:', {
      isArray: Array.isArray(elementsResult),
      length: elementsResult?.length,
      firstElement: elementsResult?.[0]
    });
    
    // Test 3: Check response wrapper handling
    console.log('\n3. Testing raw fetch to check response format...');
    const rawResponse = await fetch('http://localhost:3001/api/characters');
    const rawJson = await rawResponse.json();
    console.log('📦 Raw API response structure:', {
      hasSuccess: 'success' in rawJson,
      hasData: 'data' in rawJson,
      success: rawJson.success,
      dataIsArray: Array.isArray(rawJson.data),
      dataLength: rawJson.data?.length
    });
    
  } catch (error) {
    console.error('❌ API Test Failed:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });
  }
}

// Run the test
testAPI();