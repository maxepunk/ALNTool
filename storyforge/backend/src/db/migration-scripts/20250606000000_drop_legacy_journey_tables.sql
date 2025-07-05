-- Migration: Drop legacy journey tables from the old timeline/gap model
-- Date: 2025-06-06
-- Purpose: Remove obsolete tables as part of technical debt cleanup (P.DEBT.1.2)

-- Drop the legacy tables
DROP TABLE IF EXISTS cached_journey_gaps;
DROP TABLE IF EXISTS cached_journey_segments;
DROP TABLE IF EXISTS gaps;
DROP TABLE IF EXISTS journey_segments;

-- Log the migration completion
-- Note: These tables were part of the old timeline/gap model that has been
-- replaced by the new Narrative Graph architecture
