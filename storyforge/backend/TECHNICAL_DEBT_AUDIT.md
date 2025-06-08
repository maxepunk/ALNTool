# Technical Debt Audit - StoryForge Backend

## Executive Summary

This audit reveals critical technical debt issues blocking core functionality:

1. **Character Links Not Being Created**: 0 records despite 60+ potential links existing
2. **Database Schema Mismatch**: Code expects `character1_id/character2_id` but schema has `character_a_id/character_b_id`
3. **Test Infrastructure Broken**: Database connection not properly initialized in tests
4. **Foreign Key Violations**: 17/32 puzzles failing sync due to missing required fields
5. **Computed Fields Issues**: 42 timeline events missing act_focus despite compute services

## Critical Issues

### 1. Character Links Table Schema Mismatch

**File**: `/src/services/sync/RelationshipSyncer.js`
**Lines**: 254-256, 288-293, 297-302, etc.

**Problem**: The code uses wrong column names:
```javascript
// Code expects:
'INSERT INTO character_links (character1_id, character2_id, strength) VALUES (?, ?, ?)'

// But schema has:
'INSERT INTO character_links (character_a_id, character_b_id, link_type, link_source_id, link_strength) VALUES (?, ?, ?, ?, ?)'
```

**Impact**: Character links are never created, breaking the Balance Dashboard and character connection features.

**Fix Required**:
- Update RelationshipSyncer.js lines 254-256 to use correct column names
- Add missing `link_type` and `link_source_id` parameters
- Update SELECT queries to use `character_a_id` and `character_b_id`

### 2. Test Database Initialization Issues

**Files**: 
- `/src/services/sync/entitySyncers/__tests__/*.test.js`
- `/src/services/sync/__tests__/RelationshipSyncer.test.js`

**Problem**: Tests are not properly initializing database connections:
```javascript
// BaseSyncer expects this.db to be set via initDB()
// But tests are not calling initDB() before sync operations
TypeError: Cannot read properties of null (reading 'prepare')
```

**Impact**: All entity syncer tests are failing, preventing safe refactoring.

**Fix Required**:
- Update test setup to call `syncer.initDB()` before operations
- Or pass `db` in constructor and ensure it's properly mocked

### 3. Foreign Key Constraint Violations

**File**: `/src/services/sync/entitySyncers/PuzzleSyncer.js`

**Problem**: 17/32 puzzles failing sync due to:
- Missing `owner_id` references
- Invalid `locked_item_id` references
- Malformed `reward_ids` JSON arrays

**Example Error**:
```
FOREIGN KEY constraint failed for puzzle 1dc2f33d583f80f0b16cda1267f1f3a0
```

**Fix Required**:
- Add validation before insert to check foreign key existence
- Handle null foreign keys properly
- Add error recovery for individual puzzle failures

### 4. Missing Memory Value Extraction

**File**: `/src/services/compute/MemoryValueExtractor.js` (doesn't exist)

**Problem**: Memory values are not being extracted from element descriptions despite being critical for game balance.

**Impact**: Memory economy features cannot function without this data.

**Fix Required**:
- Implement MemoryValueExtractor service
- Add `memory_values` and `memory_value_raw` columns to elements table
- Extract values during sync process

### 5. Compute Services Not Running on All Data

**File**: `/src/services/compute/ActFocusComputer.js`

**Problem**: 42 timeline_events have null act_focus despite having related elements.

**Investigation Needed**:
```sql
SELECT COUNT(*) FROM timeline_events WHERE act_focus IS NULL 
AND id IN (SELECT timeline_event_id FROM elements WHERE timeline_event_id IS NOT NULL)
```

**Fix Required**:
- Debug why ActFocusComputer skips these events
- Add retry logic for failed computations
- Improve error logging in compute services

## Data Integrity Issues

### 1. Orphaned Characters
```
Characters with no links: Detective Anondono, Leila Bishara, Howie Sullivan, Oliver Sterling
```
These characters have no timeline events, puzzles, or elements associated.

### 2. Empty Relationship Tables
- `character_associated_elements`: 0 records (should have data)
- `character_links`: 0 records (critical - should have 60+ links)

### 3. Inconsistent Sync Reporting
- Sync claims success but critical tables remain empty
- No error reporting when relationships fail to sync

## Code Quality Issues

### 1. Inconsistent Error Handling

**Example**: RelationshipSyncer.js
```javascript
// Line 150-154: Silently ignores foreign key errors
if (!err.message.includes('FOREIGN KEY constraint failed')) {
  this.logger.warn(...);
  errors++;
}
// But foreign key errors are exactly what we need to know about!
```

### 2. Database Connection Management

**Issue**: Tests don't properly manage database lifecycle
- No consistent setup/teardown
- Mock database doesn't match real schema
- Transaction management inconsistent

### 3. Missing Integration Tests

**Gap**: No end-to-end tests for:
- Full sync pipeline
- Relationship creation
- Compute service integration
- Cache invalidation

## Performance Issues

### 1. N+1 Query Problem in RelationshipSyncer

**File**: `/src/services/sync/RelationshipSyncer.js`
**Lines**: 241-264

```javascript
// For each character pair, runs 3 separate queries
for (let i = 0; i < characters.length; i++) {
  for (let j = i + 1; j < characters.length; j++) {
    // 3 queries per pair = O(n²) queries
  }
}
```

**Fix**: Batch queries or use CTEs to reduce database calls.

### 2. No Connection Pooling

Database connections are created on-demand without pooling, causing performance issues under load.

## Recommendations

### Immediate Actions (P0)

1. **Fix Character Links Creation**
   - Update RelationshipSyncer to use correct column names
   - Add proper link_type and link_source_id values
   - Test with real data

2. **Fix Test Infrastructure**
   - Ensure all tests properly initialize database
   - Update mocks to match actual schema
   - Add integration tests

3. **Fix Puzzle Sync Failures**
   - Add foreign key validation
   - Handle null references
   - Improve error reporting

### Short-term (P1)

1. **Implement Memory Value Extraction**
   - Create MemoryValueExtractor service
   - Add database columns
   - Integrate with sync pipeline

2. **Fix Compute Service Coverage**
   - Debug why some entities miss computation
   - Add retry mechanisms
   - Improve monitoring

### Long-term (P2)

1. **Refactor Sync Architecture**
   - Implement proper dependency injection
   - Add transaction management layer
   - Create sync status tracking

2. **Add Comprehensive Testing**
   - Integration tests for full pipeline
   - Performance benchmarks
   - Data integrity checks

3. **Improve Error Handling**
   - Consistent error types
   - Better error context
   - Recovery mechanisms

## Affected Features

Due to these issues, the following features are non-functional:
- Character Sociogram (no character links)
- Balance Dashboard (missing computed fields)
- Memory Economy View (no memory values)
- Journey gap detection (incomplete relationships)

## Next Steps

1. Create hotfix branch for character links issue
2. Update test infrastructure before any refactoring
3. Add monitoring for sync failures
4. Implement gradual fixes with feature flags

---

Generated: 2025-01-06
Auditor: Claude