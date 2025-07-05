const { getDB } = require('./src/db/database');
const db = getDB();

// Check timeline_events table columns
console.log('\n=== TIMELINE_EVENTS TABLE ===');
const eventInfo = db.prepare("PRAGMA table_info(timeline_events)").all();
eventInfo.forEach(col => {
  if (col.name.includes('act') || col.name.includes('theme') || col.name.includes('narrative')) {
    console.log(`  ${col.name}: ${col.type}`);
  }
});

// Check puzzles table columns  
console.log('\n=== PUZZLES TABLE ===');
const puzzleInfo = db.prepare("PRAGMA table_info(puzzles)").all();
puzzleInfo.forEach(col => {
  if (col.name.includes('resolution') || col.name.includes('narrative') || col.name.includes('computed')) {
    console.log(`  ${col.name}: ${col.type}`);
  }
});

// Check characters table columns
console.log('\n=== CHARACTERS TABLE ===');
const charInfo = db.prepare("PRAGMA table_info(characters)").all();
charInfo.forEach(col => {
  if (col.name.includes('resolution') || col.name.includes('memory') || col.name.includes('theme')) {
    console.log(`  ${col.name}: ${col.type}`);
  }
});

// Check elements table columns
console.log('\n=== ELEMENTS TABLE ===');
const elemInfo = db.prepare("PRAGMA table_info(elements)").all();
elemInfo.forEach(col => {
  if (col.name.includes('resolution') || col.name.includes('memory') || col.name.includes('theme')) {
    console.log(`  ${col.name}: ${col.type}`);
  }
});

// Sample some actual data
console.log('\n=== SAMPLE DATA ===');
const sampleEvent = db.prepare('SELECT id, description, act_focus FROM timeline_events LIMIT 1').get();
if (sampleEvent) {
  console.log('Sample event act_focus:', sampleEvent.act_focus);
}

const samplePuzzle = db.prepare('SELECT id, name, resolution_paths, computed_narrative_threads FROM puzzles LIMIT 1').get();
if (samplePuzzle) {
  console.log('Sample puzzle resolution_paths:', samplePuzzle.resolution_paths);
  console.log('Sample puzzle computed_narrative_threads:', samplePuzzle.computed_narrative_threads);
}

const sampleChar = db.prepare('SELECT id, name, resolution_paths FROM characters LIMIT 1').get();
if (sampleChar) {
  console.log('Sample character resolution_paths:', sampleChar.resolution_paths);
}

db.close();