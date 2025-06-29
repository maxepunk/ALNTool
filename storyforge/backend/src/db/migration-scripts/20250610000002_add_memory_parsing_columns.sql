-- Add additional memory parsing columns to elements table
-- Migration: 20250610000002_add_memory_parsing_columns

-- Add detailed memory-related columns to elements table
ALTER TABLE elements ADD COLUMN rfid_tag TEXT;
ALTER TABLE elements ADD COLUMN value_rating INTEGER DEFAULT 0;
ALTER TABLE elements ADD COLUMN memory_type TEXT;
ALTER TABLE elements ADD COLUMN memory_group TEXT;
ALTER TABLE elements ADD COLUMN group_multiplier REAL DEFAULT 1.0;
ALTER TABLE elements ADD COLUMN calculated_memory_value INTEGER DEFAULT 0;

-- Update existing memory_value column to be an alias for calculated_memory_value for backward compatibility
-- (We'll keep both for now and deprecate memory_value later)

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_elements_rfid_tag ON elements(rfid_tag);
CREATE INDEX IF NOT EXISTS idx_elements_value_rating ON elements(value_rating);
CREATE INDEX IF NOT EXISTS idx_elements_memory_type ON elements(memory_type);
CREATE INDEX IF NOT EXISTS idx_elements_memory_group ON elements(memory_group);
CREATE INDEX IF NOT EXISTS idx_elements_calculated_memory_value ON elements(calculated_memory_value);