/**
 * Simple integration test for graph endpoints
 * Tests the ACTUAL endpoints with REAL database
 */

const axios = require('axios');
const { spawn } = require('child_process');

const baseURL = 'http://localhost:3001/api';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testGraphEndpoints() {
  console.log('Starting backend server...');
  
  // Start the backend server
  const backend = spawn('npm', ['run', 'dev'], {
    cwd: __dirname,
    env: { ...process.env, PORT: 3001 }
  });

  // Wait for server to start
  await wait(3000);

  try {
    console.log('\nTesting Character Graph Endpoint:');
    
    // Test a real character ID from our database
    const charId = '18c2f33d-583f-8086-8ff8-fdb97283e1a8'; // Alex Reeves
    
    try {
      const response = await axios.get(`${baseURL}/characters/${charId}/graph`);
      console.log('✅ Character graph works!');
      console.log(`   - Nodes: ${response.data.nodes.length}`);
      console.log(`   - Edges: ${response.data.edges.length}`);
    } catch (error) {
      console.log('❌ Character graph failed:', error.response?.data || error.message);
    }

    console.log('\nTesting Other Graph Endpoints:');
    
    // Test other endpoints to see which are implemented
    const endpoints = [
      { type: 'elements', id: '18c30b78-e0d1-806b-8f01-cf951fb88139' },
      { type: 'puzzles', id: '18c30b77-22e4-80f2-8a77-df91de3e09f3' },
      { type: 'timeline', id: '18c30b78-72c2-8088-8c64-f5b7efa58e38' }
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await axios.get(`${baseURL}/${endpoint.type}/${endpoint.id}/graph`);
        console.log(`✅ ${endpoint.type} graph works!`);
      } catch (error) {
        const errorMsg = error.response?.data?.error || error.message;
        console.log(`❌ ${endpoint.type} graph: ${errorMsg}`);
      }
    }

  } finally {
    // Kill the backend
    backend.kill();
    console.log('\nBackend stopped.');
  }
}

testGraphEndpoints().catch(console.error);