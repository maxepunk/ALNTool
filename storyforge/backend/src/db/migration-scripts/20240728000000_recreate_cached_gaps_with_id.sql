-- To fix a bug where computed gap IDs were not being cached,
-- this migration re-creates the cached_journey_gaps table with a new schema.
-- This will clear any existing cached gap data.

DROP TABLE IF EXISTS cached_journey_gaps;

CREATE TABLE cached_journey_gaps (
    id TEXT PRIMARY KEY, -- The computed gap ID, e.g., "gap_charId_start_end"
    character_id TEXT NOT NULL,
    start_minute INTEGER NOT NULL,
    end_minute INTEGER NOT NULL,
    severity TEXT,
    suggested_solutions TEXT,
    cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
); 