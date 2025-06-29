CREATE TABLE IF NOT EXISTS characters (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  tier TEXT,
  logline TEXT
);

CREATE TABLE IF NOT EXISTS journey_segments (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL,
  activities TEXT,
  interactions TEXT,
  discoveries TEXT,
  gap_status TEXT,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE TABLE IF NOT EXISTS gaps (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL,
  severity TEXT,
  suggested_solutions TEXT,
  FOREIGN KEY (character_id) REFERENCES characters(id)
);

CREATE TABLE IF NOT EXISTS elements (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS puzzles (
  id TEXT PRIMARY KEY,
  name TEXT,
  timing TEXT,
  owner_id TEXT,
  locked_item_id TEXT,
  reward_ids TEXT,
  puzzle_element_ids TEXT,
  FOREIGN KEY (owner_id) REFERENCES characters(id),
  FOREIGN KEY (locked_item_id) REFERENCES elements(id)
);

CREATE TABLE IF NOT EXISTS timeline_events (
  id TEXT PRIMARY KEY,
  description TEXT,
  date TEXT,
  character_ids TEXT,
  element_ids TEXT
);

CREATE TABLE IF NOT EXISTS interactions (
  id TEXT PRIMARY KEY,
  character_a_id TEXT,
  character_b_id TEXT,
  minute INTEGER,
  type TEXT,
  element_id TEXT,
  FOREIGN KEY (character_a_id) REFERENCES characters(id),
  FOREIGN KEY (character_b_id) REFERENCES characters(id),
  FOREIGN KEY (element_id) REFERENCES elements(id)
);

CREATE TABLE IF NOT EXISTS path_metrics (
  timestamp INTEGER PRIMARY KEY,
  black_market_value INTEGER,
  detective_progress INTEGER,
  third_path_engagement INTEGER
);

CREATE TABLE IF NOT EXISTS cached_journey_segments (
  character_id TEXT NOT NULL,
  start_minute INTEGER NOT NULL,
  end_minute INTEGER NOT NULL,
  activities TEXT,
  interactions TEXT,
  discoveries TEXT,
  gap_status TEXT,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (character_id, start_minute)
);

CREATE TABLE IF NOT EXISTS cached_journey_gaps (
    character_id TEXT NOT NULL,
    start_minute INTEGER NOT NULL,
    end_minute INTEGER NOT NULL,
    severity TEXT,
    suggested_solutions TEXT,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (character_id, start_minute, end_minute)
);
