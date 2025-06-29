-- This migration creates a table to log the results of each data sync operation.
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    status TEXT NOT NULL CHECK(status IN ('started', 'completed', 'failed')),
    entity_type TEXT NOT NULL,
    records_fetched INTEGER DEFAULT 0,
    records_synced INTEGER DEFAULT 0,
    errors INTEGER DEFAULT 0,
    error_details TEXT
); 