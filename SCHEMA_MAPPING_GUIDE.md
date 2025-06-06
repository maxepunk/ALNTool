# Schema Mapping Guide
## Notion Database → SQLite Schema Reference

This document provides a complete mapping between Notion database schemas and our SQLite implementation, including calculated fields and data transformations.

---

## 📊 Database Overview

| Notion Database | Database ID | SQL Tables | Status |
|-----------------|-------------|------------|---------|
| Characters | `18c2f33d583f8060a6abde32ff06bca2` | characters, character_* relations | ✅ Syncing (missing computed fields) |
| Timeline | `1b52f33d583f80deae5ad20c120dd` | timeline_events | ✅ Syncing (missing notes) |
| Puzzles | `1b62f33d583f80cc87cfd7d6c4b0b265` | puzzles | ⚠️ 17/32 failing |
| Elements | `18c2f33d583f802091bcd84c7dd94306` | elements | ⚠️ Missing 50% of fields |

---

## 🔄 Characters Database Mapping

### Core Fields
| Notion Property | SQL Column | Type | Mapper Function | Status |
|----------------|------------|------|-----------------|---------|
| Name | name | TEXT | extractTitle() | ✅ |
| Type | type | TEXT | extractSelect() | ✅ |
| Tier | tier | TEXT | extractSelect() | ✅ |
| Character Logline | logline | TEXT | extractRichText() | ✅ |
| Connections | connections | INTEGER | extractNumber() | ✅ |

### Relation Fields (stored in junction tables)
| Notion Property | SQL Table | Foreign Keys | Status |
|----------------|-----------|--------------|---------|
| Events | character_timeline_events | character_id, timeline_event_id | ✅ |
| Character Puzzles | character_puzzles | character_id, puzzle_id | ✅ |
| Owned Elements | character_owned_elements | character_id, element_id | ✅ |
| Associated Elements | character_associated_elements | character_id, element_id | ✅ |

### 📊 Computed Fields (Not in Notion - Must Calculate)

These fields don't exist in Notion but are essential for the tool's functionality. They must be computed from relationships and game logic:

#### 1. **Act Focus** (For Timeline Events)
- **Source**: Related memory/evidence (Elements) via element_ids
- **Calculation**: Most dominant act from all related elements
- **Example**: If event has 3 Act 1 elements and 1 Act 2 element → Act Focus = "Act 1"
- **Required For**: Timeline filtering, journey segmentation

#### 2. **Narrative Threads** (For Puzzles)  
- **Source**: Rollup from reward elements via reward_ids
- **Calculation**: Aggregate all narrative threads from reward elements
- **Example**: If rewards include elements with threads ["Corp. Espionage", "Marriage Troubles"] → Combined threads
- **Required For**: Thematic consistency, narrative flow tracking

#### 2.5. **Timing** (For Puzzles) - Already in Notion as Rollup
- **Note**: This is already computed in Notion as a rollup from puzzle elements
- **Calculation**: Earliest act when all puzzle elements become available
- **Example**: If puzzle needs elements from Act 1 and Act 2 → Timing = "Act 2"
- **No Action Needed**: Just sync the existing value

#### 3. **Resolution Paths** (For All Entities)
- **Source**: Computed from element ownership, actions, and game logic
- **Calculation Rules**:
  - **Black Market**: Owns memory tokens, black market cards, trading elements
  - **Detective**: Has evidence, investigation tools, detective connections
  - **Third Path**: High community connections, rejection of authorities
- **Example**: Character owns "Black Market Business card" → paths = ["Black Market"]
- **Required For**: Balance Dashboard, Resolution Path Analyzer, path affinity scoring

#### 4. **Linked Characters** (For Characters)
- **Source**: character_links table (already computed during sync)
- **Status**: ✅ Already implemented, just needs API exposure
- **Calculation**: Derived from shared timeline events, puzzles, and elements
- **Required For**: Character Sociogram, relationship visualization

### 🧮 Other Calculated Fields
| Field | Source | Calculation | Storage |
|-------|--------|-------------|---------|
| linkedCharacters | character_links table | Computed from shared events/puzzles/elements | character_links |
| pathAffinity | Elements + Interactions | Score for each path based on element types | character_analytics |
| memoryValueTotal | Owned elements | Sum of SF_ValueRating from descriptions | character_analytics |
| interactionDensity | Journey segments | Interactions per time segment | character_analytics |
| resolutionPaths | Elements + Actions | Array of paths character aligns with | Computed on request |

---

## 📅 Timeline Events Database Mapping

### Core Fields
| Notion Property | SQL Column | Type | Mapper Function | Status |
|----------------|------------|------|-----------------|---------|
| Description | description | TEXT | extractTitle() | ✅ |
| Date | date | TEXT | extractDate() | ✅ |
| Characters Involved | character_ids | JSON | extractRelation() → JSON | ✅ |
| Memory/Evidence | element_ids | JSON | extractRelation() → JSON | ✅ |
| Notes | ❌ NOT MAPPED | TEXT | - | ❌ Missing |

---

## 🧩 Puzzles Database Mapping

### Core Fields
| Notion Property | SQL Column | Type | Mapper Function | Status | Issue |
|----------------|------------|------|-----------------|---------|--------|
| **Puzzle** | name | TEXT | extractTitle() | ❌ | **CRITICAL: Field name mismatch** |
| Timing | timing | TEXT | extractSelect() | ✅ | - |
| Owner | owner_id | TEXT | First relation ID | ✅ | - |
| Locked Item | locked_item_id | TEXT | First relation ID | ✅ | - |
| Rewards | reward_ids | JSON | extractRelation() → JSON | ✅ | - |
| Puzzle Elements | puzzle_element_ids | JSON | extractRelation() → JSON | ✅ | - |
| Story Reveals | ❌ NOT MAPPED | TEXT | - | ❌ | Data loss |
| Narrative Threads | ❌ NOT MAPPED | JSON | - | ❌ | Data loss |

### 🔧 Fix Required
```javascript
// In dataSyncService.js syncPuzzles()
insertStmt.run(
  mappedPuzzle.id,
  mappedPuzzle.puzzle || '', // Currently fails if empty
  // Should be: mappedPuzzle.puzzle || mappedPuzzle.name || 'Untitled Puzzle',
```

---

## 🎭 Elements Database Mapping

### Core Fields (Currently Mapped)
| Notion Property | SQL Column | Type | Status |
|----------------|------------|------|---------|
| Name | name | TEXT | ✅ |
| Basic Type | type | TEXT | ✅ |
| Description/Text | description | TEXT | ✅ |

### ❌ Missing Fields (Not Mapped)
| Notion Property | Should Map To | Type | Impact |
|----------------|---------------|------|---------|
| Status | status | TEXT | Can't track production readiness |
| Owner | owner_id | TEXT | Can't track element ownership |
| Container | container_id | TEXT | Lose element hierarchy |
| Contents | contents_ids | JSON | Lose element relationships |
| Timeline Event | timeline_event_id | TEXT | Lose event connections |
| First Available | first_available | TEXT | Can't track availability |
| Production Notes | production_notes | TEXT | Lose production info |
| Container Puzzle | container_puzzle_id | TEXT | Lose puzzle connections |

### 🏷️ Memory Token Special Data
Memory tokens embed data in Description field:
```
SF_RFID: [value]
SF_ValueRating: [1-5]  
SF_MemoryType: [Personal|Business|Technical]
```

**Extraction needed during sync:**
```javascript
function parseMemoryData(description) {
  const data = {
    rfid: null,
    value: 0,
    type: null
  };
  
  const rfidMatch = description.match(/SF_RFID:\s*(\S+)/);
  if (rfidMatch) data.rfid = rfidMatch[1];
  
  const valueMatch = description.match(/SF_ValueRating:\s*(\d+)/);
  if (valueMatch) data.value = parseInt(valueMatch[1]);
  
  const typeMatch = description.match(/SF_MemoryType:\s*(\w+)/);
  if (typeMatch) data.type = typeMatch[1];
  
  return data;
}
```

---

## 🔗 Computed Relationships

### character_links Table
Generated from three sources:

1. **Shared Timeline Events**
```sql
-- Characters who appear in same events
SELECT DISTINCT character_a_id, character_b_id 
FROM character_timeline_events ct1
JOIN character_timeline_events ct2 
  ON ct1.timeline_event_id = ct2.timeline_event_id
WHERE ct1.character_id < ct2.character_id
```

2. **Puzzle Connections**
```sql
-- Puzzle owner linked to characters with required elements
SELECT DISTINCT p.owner_id, cae.character_id
FROM puzzles p
JOIN elements e ON json_extract(p.puzzle_element_ids, '$') LIKE '%' || e.id || '%'
JOIN character_associated_elements cae ON cae.element_id = e.id
```

3. **Shared Elements**
```sql
-- Characters connected through elements
SELECT DISTINCT c1.character_id, c2.character_id
FROM (
  SELECT character_id, element_id FROM character_owned_elements
  UNION
  SELECT character_id, element_id FROM character_associated_elements
) c1
JOIN (...) c2 ON c1.element_id = c2.element_id
WHERE c1.character_id < c2.character_id
```

---

## 📈 Analytics & Computed Fields

### character_analytics Table (Proposed)
| Field | Calculation | Update Frequency |
|-------|-------------|------------------|
| path_affinity_black_market | Count memory tokens + trade interactions | On sync |
| path_affinity_detective | Count evidence + investigation actions | On sync |
| path_affinity_third_path | Count community interactions | On sync |
| total_memory_value | Sum SF_ValueRating from owned memories | On sync |
| interaction_density | Avg interactions per segment | On journey compute |
| discovery_rate | Discoveries per time unit | On journey compute |

### Path Affinity Scoring Logic
```javascript
function calculatePathAffinity(character) {
  const affinity = {
    black_market: 0,
    detective: 0,
    third_path: 0
  };
  
  // Black Market: Memory tokens + trading
  affinity.black_market = 
    character.memoryTokens.length * 10 +
    character.tradeInteractions * 5;
  
  // Detective: Evidence + investigation
  affinity.detective = 
    character.evidenceFound * 10 +
    character.puzzlesSolved * 5;
  
  // Third Path: Community + sharing
  affinity.third_path = 
    character.communityInteractions * 10 +
    character.memoriesShared * 5;
  
  return affinity;
}
```

### Resolution Paths Assignment Logic
```javascript
function assignResolutionPaths(entity, entityType) {
  const paths = [];
  
  if (entityType === 'character') {
    // Check owned/associated elements
    const hasBlackMarketItems = entity.elements.some(el => 
      el.name.toLowerCase().includes('black market') ||
      el.type === 'memory_token'
    );
    if (hasBlackMarketItems) paths.push('Black Market');
    
    // Check for investigation actions
    const hasInvestigationElements = entity.elements.some(el =>
      el.type === 'evidence' || 
      el.name.toLowerCase().includes('clue')
    );
    if (hasInvestigationElements) paths.push('Detective');
    
    // Check for community connections
    if (entity.connections > 5) paths.push('Third Path');
  }
  
  if (entityType === 'puzzle') {
    // Based on puzzle type and rewards
    if (puzzle.rewards.some(r => r.includes('memory'))) {
      paths.push('Black Market');
    }
    if (puzzle.narrative_threads?.includes('Corp. Espionage')) {
      paths.push('Detective');
    }
  }
  
  if (entityType === 'element') {
    // Based on element type and associations
    if (element.name.toLowerCase().includes('black market')) {
      paths.push('Black Market');
    }
    if (element.type === 'evidence' || element.type === 'clue') {
      paths.push('Detective');
    }
  }
  
  return paths.length > 0 ? paths : ['Unassigned'];
}
```

---

## 🚨 Critical Issues Summary

1. **Linked Characters Not Returned** - Data exists but API doesn't query it
2. **Puzzle Name Field Mismatch** - Causes 17/32 puzzles to fail sync  
3. **Elements Missing 50% Fields** - Major data loss
4. **No Memory Value Extraction** - Can't calculate path affinities
5. **No Analytics Computation** - Missing all derived metrics
6. **Resolution Paths Not Computed** - Frontend expects arrays on all entities
   - No source field in Notion
   - Must be inferred from element ownership & character actions
   - ResolutionPathAnalyzerPage component is non-functional without this
7. **Act Focus Not Computed for Timeline Events**
   - Frontend filters expect this field
   - Must aggregate from related elements
   - Timeline view can't filter by act without this
8. **Narrative Threads Not Rolled Up for Puzzles**
   - Frontend displays expect aggregated threads
   - Must compute from reward elements
   - Thematic filtering broken without this

---

## 🔧 Implementation Priority

1. **🔴 CRITICAL - Add linked characters to API response**
   - Frontend is blocked without this
   - Data already exists in character_links

2. **🔴 CRITICAL - Compute Act Focus for Timeline Events**
   - Required for timeline filtering
   - Aggregate from related elements' "First Available"

3. **🟡 HIGH - Fix puzzle sync failures**
   - 17 puzzles not syncing
   - Simple field name fix

4. **🟡 HIGH - Compute Resolution Paths**
   - Balance Dashboard depends on this
   - Resolution Path Analyzer is broken
   - Calculate during sync based on ownership patterns

5. **🟡 HIGH - Add missing Element fields**
   - Losing critical production data
   - Affects journey computation

6. **🟢 MEDIUM - Compute Narrative Threads for Puzzles**
   - Rollup from reward elements
   - Needed for thematic filtering

7. **🟢 MEDIUM - Extract memory values**
   - Needed for path affinity
   - Parse from description field

8. **🟢 LOW - Compute analytics**
   - Nice to have
   - Can be added incrementally

---

This guide should be updated whenever schema changes are made or new calculated fields are added. 