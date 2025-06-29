-- Add total_memory_value column to characters table
-- This column was missing from migrations but exists in production
-- Migration: 20250610000008_add_total_memory_value_to_characters

-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE
-- This migration will fail gracefully if the column already exists
-- The migration runner should handle this error
ALTER TABLE characters ADD COLUMN total_memory_value INTEGER DEFAULT 0;