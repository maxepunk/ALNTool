-- Migration: Create cached_journey_graphs table for the new Narrative Graph model
-- Date: 2025-06-06
-- Purpose: Implement journey caching for graph data (P.DEBT.2.2)

-- Create table to cache computed journey graphs
CREATE TABLE IF NOT EXISTS cached_journey_graphs (
  character_id TEXT PRIMARY KEY,
  character_info TEXT NOT NULL, -- JSON serialized character data including linked characters
  graph_nodes TEXT NOT NULL,    -- JSON serialized nodes array
  graph_edges TEXT NOT NULL,    -- JSON serialized edges array
  version_hash TEXT NOT NULL,   -- Hash of source data to detect when cache is stale
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

-- Create index for cache expiration queries
CREATE INDEX IF NOT EXISTS idx_cached_journey_graphs_cached_at 
  ON cached_journey_graphs(cached_at);

-- Create index for LRU cache implementation
CREATE INDEX IF NOT EXISTS idx_cached_journey_graphs_last_accessed 
  ON cached_journey_graphs(last_accessed);

-- Log the migration completion
-- Note: This table replaces the old cached_journey_segments and cached_journey_gaps tables
-- with a unified cache for the new graph-based journey model
