-- Relationship tables to preserve Notion's rich relational data
-- These enable efficient graph queries for character connections

-- Character-Timeline Event relationships
CREATE TABLE IF NOT EXISTS character_timeline_events (
  character_id TEXT NOT NULL,
  timeline_event_id TEXT NOT NULL,
  PRIMARY KEY (character_id, timeline_event_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (timeline_event_id) REFERENCES timeline_events(id) ON DELETE CASCADE
);

-- Character-Element relationships (owned)
CREATE TABLE IF NOT EXISTS character_owned_elements (
  character_id TEXT NOT NULL,
  element_id TEXT NOT NULL,
  PRIMARY KEY (character_id, element_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (element_id) REFERENCES elements(id) ON DELETE CASCADE
);

-- Character-Element relationships (associated)
CREATE TABLE IF NOT EXISTS character_associated_elements (
  character_id TEXT NOT NULL,
  element_id TEXT NOT NULL,
  PRIMARY KEY (character_id, element_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (element_id) REFERENCES elements(id) ON DELETE CASCADE
);

-- Character-Puzzle relationships
CREATE TABLE IF NOT EXISTS character_puzzles (
  character_id TEXT NOT NULL,
  puzzle_id TEXT NOT NULL,
  PRIMARY KEY (character_id, puzzle_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (puzzle_id) REFERENCES puzzles(id) ON DELETE CASCADE
);

-- Computed character links (populated after sync)
CREATE TABLE IF NOT EXISTS character_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  character_a_id TEXT NOT NULL,
  character_b_id TEXT NOT NULL,
  link_type TEXT NOT NULL, -- 'timeline_event', 'puzzle', 'element'
  link_source_id TEXT NOT NULL, -- ID of the event/puzzle/element creating the link
  link_strength INTEGER DEFAULT 1, -- Can be used to weight relationships
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  -- Ensure we don't duplicate links
  UNIQUE(character_a_id, character_b_id, link_type, link_source_id),
  
  -- Foreign keys
  FOREIGN KEY (character_a_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (character_b_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_character_timeline_character ON character_timeline_events(character_id);
CREATE INDEX IF NOT EXISTS idx_character_timeline_event ON character_timeline_events(timeline_event_id);
CREATE INDEX IF NOT EXISTS idx_character_links_a ON character_links(character_a_id);
CREATE INDEX IF NOT EXISTS idx_character_links_b ON character_links(character_b_id);
CREATE INDEX IF NOT EXISTS idx_character_links_type ON character_links(link_type); 