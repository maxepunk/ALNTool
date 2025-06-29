-- Drop deprecated memory_value column from elements table
-- The calculated_memory_value column is now the single source of truth
-- Migration: 20250612000001_drop_deprecated_memory_value

-- SQLite doesn't support DROP COLUMN directly, so we need to:
-- 1. Save foreign key dependent data
-- 2. Drop dependent tables
-- 3. Recreate elements table without deprecated column
-- 4. Recreate dependent tables
-- 5. Restore data

-- Save data from tables with foreign keys to elements
CREATE TEMPORARY TABLE temp_character_owned_elements AS SELECT * FROM character_owned_elements;
CREATE TEMPORARY TABLE temp_character_associated_elements AS SELECT * FROM character_associated_elements;

-- Drop tables with foreign keys to elements
DROP TABLE IF EXISTS character_owned_elements;
DROP TABLE IF EXISTS character_associated_elements;

-- Create new elements table without memory_value
CREATE TABLE elements_new (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  description TEXT,
  resolution_paths TEXT,
  status TEXT,
  container_id TEXT,
  production_notes TEXT,
  first_available TEXT,
  owner_id TEXT,
  timeline_event_id TEXT,
  -- Memory-related columns (no deprecated memory_value)
  rfid_tag TEXT,
  value_rating INTEGER DEFAULT 0,
  memory_type TEXT,
  memory_group TEXT,
  group_multiplier REAL DEFAULT 1.0,
  calculated_memory_value INTEGER DEFAULT 0,
  FOREIGN KEY (owner_id) REFERENCES characters(id) ON DELETE SET NULL
);

-- Copy all data except the deprecated column
INSERT INTO elements_new SELECT 
  id, name, type, description, resolution_paths, status,
  container_id, production_notes, first_available, 
  owner_id, timeline_event_id,
  rfid_tag, value_rating, memory_type, memory_group, 
  group_multiplier, calculated_memory_value
FROM elements;

-- Drop the old table
DROP TABLE elements;

-- Rename the new table
ALTER TABLE elements_new RENAME TO elements;

-- Recreate the relationship tables
CREATE TABLE character_owned_elements (
  character_id TEXT NOT NULL,
  element_id TEXT NOT NULL,
  PRIMARY KEY (character_id, element_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (element_id) REFERENCES elements(id) ON DELETE CASCADE
);

CREATE TABLE character_associated_elements (
  character_id TEXT NOT NULL,
  element_id TEXT NOT NULL,
  PRIMARY KEY (character_id, element_id),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (element_id) REFERENCES elements(id) ON DELETE CASCADE
);

-- Restore the data
INSERT INTO character_owned_elements SELECT * FROM temp_character_owned_elements;
INSERT INTO character_associated_elements SELECT * FROM temp_character_associated_elements;

-- Drop temporary tables
DROP TABLE temp_character_owned_elements;
DROP TABLE temp_character_associated_elements;

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_elements_type ON elements(type);
CREATE INDEX IF NOT EXISTS idx_elements_owner_id ON elements(owner_id);
CREATE INDEX IF NOT EXISTS idx_elements_rfid_tag ON elements(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_elements_value_rating ON elements(value_rating);
CREATE INDEX IF NOT EXISTS idx_elements_memory_type ON elements(memory_type);
CREATE INDEX IF NOT EXISTS idx_elements_memory_group ON elements(memory_group);
CREATE INDEX IF NOT EXISTS idx_elements_calculated_memory_value ON elements(calculated_memory_value);

-- Recreate indexes for relationship tables
CREATE INDEX IF NOT EXISTS idx_character_owned_element ON character_owned_elements(element_id);
CREATE INDEX IF NOT EXISTS idx_character_owned_character ON character_owned_elements(character_id);
CREATE INDEX IF NOT EXISTS idx_character_associated_element ON character_associated_elements(element_id);
CREATE INDEX IF NOT EXISTS idx_character_associated_character ON character_associated_elements(character_id);