// HOTFIX for RelationshipSyncer.js - Line 254-256
// Replace the incorrect INSERT statement with:

this.db.prepare(
  'INSERT INTO character_links (character_a_id, character_b_id, link_type, link_source_id, link_strength) VALUES (?, ?, ?, ?, ?)'
).run(char1Id, char2Id, 'computed', 'system', strength);

// Also update the _computeLinkStrength method queries (lines 288-293):
const sharedEvents = this.db.prepare(`
  SELECT COUNT(*) as count
  FROM character_timeline_events e1
  JOIN character_timeline_events e2 ON e1.timeline_event_id = e2.timeline_event_id
  WHERE e1.character_id = ? AND e2.character_id = ?
`).get(char1Id, char2Id);

// And update lines 297-302:
const sharedPuzzles = this.db.prepare(`
  SELECT COUNT(*) as count
  FROM character_puzzles p1
  JOIN character_puzzles p2 ON p1.puzzle_id = p2.puzzle_id
  WHERE p1.character_id = ? AND p2.character_id = ?
`).get(char1Id, char2Id);

// And update lines 306-318:
const sharedElements = this.db.prepare(`
  SELECT COUNT(*) as count FROM (
    SELECT element_id FROM character_owned_elements WHERE character_id = ?
    UNION
    SELECT element_id FROM character_associated_elements WHERE character_id = ?
  ) e1
  JOIN (
    SELECT element_id FROM character_owned_elements WHERE character_id = ?
    UNION
    SELECT element_id FROM character_associated_elements WHERE character_id = ?
  ) e2 ON e1.element_id = e2.element_id
`).get(char1Id, char1Id, char2Id, char2Id);