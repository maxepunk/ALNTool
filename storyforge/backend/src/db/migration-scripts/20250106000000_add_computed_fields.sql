-- Add computed fields for timeline events
ALTER TABLE timeline_events ADD COLUMN act_focus TEXT;

-- Add computed fields for puzzles
ALTER TABLE puzzles ADD COLUMN computed_narrative_threads TEXT; -- JSON array
ALTER TABLE puzzles ADD COLUMN resolution_paths TEXT; -- JSON array

-- Add computed fields for characters
ALTER TABLE characters ADD COLUMN resolution_paths TEXT; -- JSON array
ALTER TABLE characters ADD COLUMN connections INTEGER;

-- Add computed fields for elements
ALTER TABLE elements ADD COLUMN resolution_paths TEXT; -- JSON array

-- Add table for character analytics
CREATE TABLE IF NOT EXISTS character_analytics (
  character_id TEXT PRIMARY KEY,
  path_affinity_black_market INTEGER DEFAULT 0,
  path_affinity_detective INTEGER DEFAULT 0,
  path_affinity_third_path INTEGER DEFAULT 0,
  total_memory_value INTEGER DEFAULT 0,
  interaction_density REAL DEFAULT 0,
  last_computed DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Add missing fields to elements table
ALTER TABLE elements ADD COLUMN status TEXT;
ALTER TABLE elements ADD COLUMN container_id TEXT;
ALTER TABLE elements ADD COLUMN production_notes TEXT;
ALTER TABLE elements ADD COLUMN first_available TEXT;
ALTER TABLE elements ADD COLUMN owner_id TEXT;
ALTER TABLE elements ADD COLUMN timeline_event_id TEXT;

-- Add missing fields to timeline_events table
ALTER TABLE timeline_events ADD COLUMN notes TEXT;

-- Add missing fields to puzzles table
ALTER TABLE puzzles ADD COLUMN story_reveals TEXT;
ALTER TABLE puzzles ADD COLUMN narrative_threads TEXT; 