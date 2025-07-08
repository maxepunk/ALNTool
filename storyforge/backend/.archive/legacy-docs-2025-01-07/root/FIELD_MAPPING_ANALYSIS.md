# Field Mapping Analysis: Source vs Computed Fields

## Executive Summary

The notionPropertyMapper.js contains warnings about "computed fields" that don't exist in Notion. After analyzing the database schema, compute services, and frontend usage, I've found that:

1. **The warnings are helpful but incomplete** - they correctly identify computed fields, but the comments are scattered and inconsistent
2. **The data flow is working correctly** - computed fields are properly stored in SQLite after sync
3. **Frontend components ARE using these fields** - act_focus, resolution_paths, etc. are actively used in the UI
4. **The confusion comes from mixing concerns** - the mapper tries to handle both Notion mapping AND warn about computed fields

## Current State

### Computed Fields (Stored in SQLite, not in Notion)

1. **Timeline Events**
   - `act_focus` - Computed by ActFocusComputer based on related elements' acts
   - Stored in SQLite, used in frontend filters and display

2. **Puzzles**
   - `resolution_paths` - Computed by ResolutionPathComputer 
   - `computed_narrative_threads` - Computed by NarrativeThreadComputer from related elements
   - Both stored as JSON arrays in SQLite

3. **Characters**
   - `resolution_paths` - Computed based on owned elements and puzzles
   - `linkedCharacters` - Computed from character_links join table
   - `connections` - Actually exists in Notion (not computed)
   - `total_memory_value` - Computed by MemoryValueComputer

4. **Elements**
   - `resolution_paths` - Computed based on container/owner relationships
   - Memory fields (SF_RFID, SF_ValueRating, etc.) - Parsed from description text

### Data Flow

1. **Sync Phase**: Notion → SQLite (via mappers)
   - Mappers extract only Notion fields
   - Commented warnings identify fields that will be computed later

2. **Compute Phase**: SQLite enrichment
   - ComputeOrchestrator runs all computers
   - Computed fields are written to SQLite

3. **API Phase**: SQLite → Frontend
   - Database queries include computed fields
   - Frontend receives complete data with both source and computed fields

## Issues Found

### 1. Inconsistent Warning Comments
```javascript
// In mapCharacterWithNames:
// actFocus: extractSelectByName(properties, 'Act Focus'),
// themes: extractMultiSelectByName(properties, 'Narrative Threads'),
// resolutionPaths: extractMultiSelectByName(properties, 'Resolution Paths'),

// In mapTimelineEventWithNames:
// Act Focus is computed from related elements' acts, not stored in Notion
// actFocus: extractSelectByName(properties, 'Act Focus'), // Computed field
```

### 2. Misleading Field Names
- `themes` sometimes duplicates `narrativeThreads`
- `memorySets` may or may not exist in Notion
- Comments don't clearly indicate which fields are parsed vs computed

### 3. Frontend Expects These Fields
The frontend actively uses:
- `actFocus` in filters and entity displays
- `resolution_paths` in path analysis components
- `computed_narrative_threads` in puzzle details

## Recommendations

### 1. Create a Clear Field Mapping Documentation
```javascript
// At the top of notionPropertyMapper.js
/**
 * FIELD MAPPING GUIDE
 * 
 * Source Fields (from Notion):
 * - name, type, tier, logline, etc.
 * 
 * Computed Fields (added in compute phase):
 * - act_focus (timeline_events) - computed from related elements
 * - resolution_paths (all entities) - computed from relationships
 * - computed_narrative_threads (puzzles) - computed from elements
 * - linkedCharacters (characters) - computed from character_links
 * 
 * Parsed Fields (extracted from text):
 * - SF_RFID, SF_ValueRating (elements) - parsed from description
 */
```

### 2. Remove Commented Code, Add Clear Documentation
Instead of:
```javascript
// actFocus: extractSelectByName(properties, 'Act Focus'), // Computed field
```

Add a documentation block:
```javascript
// COMPUTED FIELDS - These are added during the compute phase:
// - actFocus: Computed from related elements' acts
// - resolutionPaths: Computed from puzzle/element relationships
// Note: These fields will be null until ComputeOrchestrator runs
```

### 3. Create a Field Registry
```javascript
// src/config/fieldRegistry.js
module.exports = {
  COMPUTED_FIELDS: {
    timeline_events: ['act_focus'],
    puzzles: ['resolution_paths', 'computed_narrative_threads'],
    characters: ['resolution_paths', 'linkedCharacters', 'total_memory_value'],
    elements: ['resolution_paths', 'calculated_memory_value']
  },
  PARSED_FIELDS: {
    elements: ['parsed_sf_rfid', 'sf_value_rating', 'sf_memory_type', 'sf_group', 'sf_group_multiplier']
  }
};
```

### 4. Add Validation Helper
```javascript
// In notionPropertyMapper.js
function documentComputedFields(entityType, mappedEntity) {
  const computedFields = FIELD_REGISTRY.COMPUTED_FIELDS[entityType] || [];
  if (computedFields.length > 0) {
    logger.debug(`[MAPPER] Entity ${mappedEntity.id} will have these fields computed later: ${computedFields.join(', ')}`);
  }
  return mappedEntity;
}
```

### 5. Update API Documentation
Document which fields come from which phase:
```javascript
/**
 * GET /api/timeline-events
 * Returns events with:
 * - Source fields: id, description, date, character_ids, element_ids, notes
 * - Computed fields: act_focus (may be null if sync hasn't run)
 */
```

## Conclusion

The warnings in notionPropertyMapper.js are helpful indicators of the data flow, but they create confusion by mixing mapping concerns with compute phase documentation. The system is working correctly - computed fields are properly calculated and stored. The issue is documentation and code clarity.

The recommended approach is to:
1. Keep the mapper focused on Notion field extraction
2. Document computed fields clearly in a central location
3. Remove commented code that creates confusion
4. Add logging to track when computed fields are added

This will make the data flow clear for future developers and reduce confusion about which fields come from where.