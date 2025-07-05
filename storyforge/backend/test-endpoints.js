const axios = require('axios');
const Database = require('better-sqlite3');
const path = require('path');

const baseURL = 'http://localhost:3001/api';
const dbPath = path.join(__dirname, 'data', 'production.db');
const db = new Database(dbPath, { readonly: true });

async function testEndpoints() {
  // Get sample IDs from database
  const character = db.prepare('SELECT id FROM characters LIMIT 1').get();
  const element = db.prepare('SELECT id FROM elements LIMIT 1').get();
  const puzzle = db.prepare('SELECT id FROM puzzles LIMIT 1').get();
  const timeline = db.prepare('SELECT id FROM timeline_events LIMIT 1').get();

  const endpoints = [
    { path: `/characters/${character.id}`, name: 'Character Detail' },
    { path: `/characters/${character.id}/graph`, name: 'Character Graph' },
    { path: `/elements/${element.id}`, name: 'Element Detail' },
    { path: `/elements/${element.id}/graph`, name: 'Element Graph' },
    { path: `/puzzles/${puzzle.id}`, name: 'Puzzle Detail' },
    { path: `/puzzles/${puzzle.id}/graph`, name: 'Puzzle Graph' },
    { path: `/timeline/${timeline.id}`, name: 'Timeline Detail' },
    { path: `/timeline/${timeline.id}/graph`, name: 'Timeline Graph' }
  ];

  console.log('Testing all detail and graph endpoints...\n');

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(baseURL + endpoint.path);
      const hasData = response.data && (
        response.data.nodes || 
        response.data.id || 
        response.data.name
      );
      console.log(`✅ ${endpoint.name}: ${hasData ? 'Has data' : 'Empty response'}`);
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.response?.data?.error || error.message}`);
    }
  }

  db.close();
}

testEndpoints();