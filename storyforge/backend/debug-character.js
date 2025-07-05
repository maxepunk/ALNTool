const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, 'data', 'production.db');
const db = new Database(dbPath, { readonly: true });

const characterId = '18c2f33d-50d6-40dc-8ff8-f8b072835e1a';

// Check if character exists
const character = db.prepare('SELECT * FROM characters WHERE id = ?').get(characterId);
console.log('Character exists:', !!character);

if (character) {
  console.log('Character name:', character.name);
  
  // Check relations
  const events = db.prepare(`
    SELECT COUNT(*) as count FROM timeline_events te
    JOIN character_timeline_events cte ON te.id = cte.timeline_event_id
    WHERE cte.character_id = ?
  `).get(characterId);
  console.log('Events count:', events.count);
  
  const puzzles = db.prepare(`
    SELECT COUNT(*) as count FROM puzzles p
    JOIN character_puzzles cp ON p.id = cp.puzzle_id
    WHERE cp.character_id = ?
  `).get(characterId);
  console.log('Puzzles count:', puzzles.count);
}

db.close();