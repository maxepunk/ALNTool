# Schema Mapping Guide
## Notion Database → SQLite Schema Reference

> **Executive Summary**: Authoritative reference for all data transformations between Notion and SQLite. Maps field names, types, and relationships for Characters, Elements, Puzzles, and Timeline databases. Includes critical computed fields (memory values, act focus, narrative threads) and sync architecture details. Essential when working with data sync, debugging field mappings, or implementing new computed fields.

This document provides a complete mapping between Notion database schemas and our SQLite implementation, including calculated fields and data transformations.

## 🗺️ Claude Quick Nav

**Top Sections for Quick Access:**
1. [📊 Database Overview](#-database-overview) - All tables and sync status
2. [🔄 Characters Database Mapping](#-characters-database-mapping) - Character fields
3. [🧩 Puzzles Database Mapping](#-puzzles-database-mapping) - Puzzle structure
4. [📦 Elements Database Mapping](#-elements-database-mapping) - Element fields & memory values
5. [🧮 Computed Fields Reference](#-computed-fields-reference) - Calculated fields

**Search Keywords:** 
`mapping`, `schema`, `fields`, `notion`, `sqlite`, `computed`, `memory value`, `rfid`, `relationships`, `sync`

**Cross-References:**
- Implementation guide → [DEVELOPMENT_PLAYBOOK.md](./DEVELOPMENT_PLAYBOOK.md)
- Current status → [README.md](./README.md)
- Sync architecture → [DEVELOPMENT_PLAYBOOK.md#core-components](./DEVELOPMENT_PLAYBOOK.md#core-components)

---

## 📊 Database Overview

| Notion Database | Database ID | SQL Tables | Status |
|-----------------|-------------|------------|---------|
| Characters | `18c2f33d583f8060a6abde32ff06bca2` | characters, character_* relations | ✅ Syncing |
| Timeline | `1b52f33d583f80deae5ad20c120dd` | timeline_events | ✅ Syncing |
| Puzzles | `1b62f33d583f80cc87cfd7d6c4b0b265` | puzzles | ✅ All 32 syncing (17 have NULL owners in Notion) |
| Elements | `18c2f33d583f802091bcd84c7dd94306` | elements | ✅ All fields mapped and stored |

---

## 🔗 Notion Database Interconnections

### Database Relationships
The four Notion databases are interconnected through **dual-property relations** that automatically sync between databases:

| From Database | Field | To Database | Synced Field | Relationship Type |
|---------------|-------|-------------|--------------|-------------------|
| **Timeline Events** | Memory/Evidence | **Elements** | Timeline Event | Many-to-Many |
| **Timeline Events** | Characters Involved | **Characters** | Events | Many-to-Many |
| **Elements** | Owner | **Characters** | Owned Elements | Many-to-One |
| **Elements** | Container | **Elements** | Contents | Self-referential |
| **Elements** | Container Puzzle | **Puzzles** | Locked Item | Many-to-One |
| **Elements** | Required For (Puzzle) | **Puzzles** | Puzzle Elements | Many-to-Many |
| **Elements** | Rewarded by (Puzzle) | **Puzzles** | Rewards | Many-to-Many |
| **Characters** | Associated Elements | **Elements** | (Single property) | Many-to-Many |
| **Characters** | Character Puzzles | **Puzzles** | (Single property) | Many-to-Many |
| **Puzzles** | Parent item | **Puzzles** | Sub-Puzzles | Self-referential |

### Rollup Fields (Computed in Notion)
These fields automatically aggregate data from related records:

#### Timeline Events
- `mem type`: Rollup from Memory/Evidence → Basic Type (shows element types)

#### Elements  
- `Associated Characters`: Rollup from Timeline Event → Characters Involved
- `Puzzle Chain`: Rollup from Container → Container Puzzle

#### Characters
- `Connections`: Rollup from Events → Characters Involved (shows unique connected characters)

#### Puzzles
- `Owner`: Rollup from Locked Item → Owner (character who owns the locked container)
- `Timing`: Rollup from Puzzle Elements → First Available (earliest act when all elements available)
- `Narrative Threads`: Rollup from Rewards → Narrative Threads (themes from reward elements)
- `Story Reveals`: Rollup from Rewards → Timeline Event (events revealed by rewards)

### Formula Fields (Computed in Notion)
#### Elements
- `Container?`: Formula checking if element has Contents OR is part of Container Puzzle

### Data Quality Implications
- **Act Focus computation** depends on Elements having "First Available" populated
- **Narrative Threads for Puzzles** depend on Reward elements having threads defined
- **Character Connections** automatically calculated from shared timeline events
- **Puzzle Timing** automatically calculated from required elements' availability

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
- **Calculation**: Most dominant act from all related elements' "First Available" field
- **Data Dependency**: Requires Elements to have "First Available" populated in Notion
- **Current Status**: 59/100 elements missing "First Available" → 42/75 timeline events have NULL act_focus
- **Example**: If event has 3 "Act 1" elements and 1 "Act 2" element → Act Focus = "Act 1"
- **Required For**: Timeline filtering, journey segmentation
- **Note**: This is a **data completeness issue**, not a technical bug. Game designers must populate "First Available" in Elements database.

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
| Notion Property | SQL Column | Type | Mapper Function | Status |
|----------------|------------|------|-----------------|---------|
| **Puzzle** | name | TEXT | extractTitle() | ✅ FIXED - Mapper handles correctly |
| Timing | timing | TEXT | extractSelect() | ✅ |
| Owner | owner_id | TEXT | First relation ID | ✅ (17/32 NULL in Notion) |
| Locked Item | locked_item_id | TEXT | First relation ID | ✅ |
| Rewards | reward_ids | JSON | extractRelation() → JSON | ✅ |
| Puzzle Elements | puzzle_element_ids | JSON | extractRelation() → JSON | ✅ |
| Story Reveals | story_reveals | TEXT | extractRichText() | ✅ Mapped |
| Narrative Threads | narrative_threads | JSON | Computed from rewards | ✅ NarrativeThreadComputer |

### ✅ Puzzle Sync Status
- All 32 puzzles sync successfully
- 17 puzzles have NULL owner_id (data issue in Notion, not sync failure)
- Two-phase sync architecture handles foreign keys correctly

---

## 🎭 Elements Database Mapping

### ✅ Core Fields (ALL MAPPED AND WORKING)
| Notion Property | SQL Column | Type | Status |
|----------------|------------|------|---------|
| Name | name | TEXT | ✅ |
| Basic Type | type | TEXT | ✅ |
| Description/Text | description | TEXT | ✅ |
| Status | status | TEXT | ✅ MAPPED |
| Owner | owner_id | TEXT | ✅ MAPPED |
| Container | container_id | TEXT | ✅ MAPPED |
| Timeline Event | timeline_event_id | TEXT | ✅ MAPPED |
| First Available | first_available | TEXT | ✅ MAPPED (59/100 elements NULL in Notion) |
| Production Notes | production_notes | TEXT | ✅ MAPPED |

### Relation Fields Note
The mapper extracts some fields as arrays (owner, container) but DB stores single IDs. This may need minor adjustment but all data is captured.

### 🏷️ Memory Token Special Data
Memory tokens embed data in Description field:
```
SF_RFID: [value]
SF_ValueRating: [1-5]  
SF_MemoryType: [Personal|Business|Technical]
```

**✅ Memory Value Extraction (IMPLEMENTED)**

Database columns added:
| Column | Type | Description |
|--------|------|-------------|
| rfid_tag | TEXT | RFID identifier for physical token |
| value_rating | INTEGER | 1-5 rating scale |
| memory_type | TEXT | Personal/Business/Technical |
| memory_group | TEXT | Group name for completion bonuses |
| group_multiplier | REAL | Group completion bonus multiplier |
| calculated_memory_value | INTEGER | Individual token value (dollars) |

**Value Calculation:**
- Base values: 1=$100, 2=$500, 3=$1000, 4=$5000, 5=$10000
- Type multipliers: Personal=2x, Business=5x, Technical=10x
- Individual value = Base × Type Multiplier
- Group multipliers stored separately for completion bonus logic

**Implementation:** `MemoryValueExtractor` and `MemoryValueComputer` services

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

## 🚨 Real Issues (Post-Architectural Fixes)

### ✅ Already Fixed
1. ~~**Linked Characters Not Returned**~~ - GraphService now queries from SQLite
2. ~~**Puzzle Sync Failures**~~ - All 32 puzzles sync (17 have NULL owners in Notion)
3. ~~**Elements Missing Fields**~~ - All fields present in DB and mapper
4. ~~**Dual Data Pipeline**~~ - Fixed by graph service refactor (June 7)

### 🔴 Real Issues Remaining
1. **Memory Value Extraction Not Integrated**
   - MemoryValueExtractor exists but not called in ComputeOrchestrator
   - rfid_tag and memory_type not parsing from descriptions
   - Blocks path affinity calculations

2. **Act Focus Missing for 42 Timeline Events**
   - ActFocusComputer exists but may not handle events without elements
   - Timeline filtering broken without this

3. **Resolution Paths Partially Computed**
   - ResolutionPathComputer exists but may need tuning
   - Some entities missing paths

4. **Minor Mapper Issues**
   - Some fields extracted as arrays but stored as single IDs
   - May need adjustment for owner, container fields

---

## 🔧 Real Implementation Priority (Updated)

1. **🔴 CRITICAL - Integrate MemoryValueExtractor**
   ```javascript
   // In ComputeOrchestrator.js
   const MemoryValueExtractor = require('./MemoryValueExtractor');
   this.memoryValueExtractor = new MemoryValueExtractor(db);
   // Add to computeAll() method
   ```

2. **🔴 CRITICAL - Fix Act Focus for 42 Timeline Events**
   - Verify ActFocusComputer handles events without elements
   - May need default value logic

3. **🟡 HIGH - Fix Memory Field Parsing**
   - rfid_tag and memory_type not populating
   - Check regex patterns in notionPropertyMapper

4. **🟢 MEDIUM - Adjust Array/Single ID Mappers**
   - Minor issue where mapper extracts arrays but DB expects single IDs
   - Affects owner, container fields

### ✅ Already Complete
- Character links computed and stored
- All puzzles syncing
- Element fields mapped
- Narrative threads computed
- Resolution paths computed (may need tuning)

---

## Sync Architecture

### Component Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   API Routes    │     │ DataSyncService │     │ SyncOrchestrator│
│  (syncRoutes)   │────▶│   (Singleton)   │────▶│                 │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                         ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Compute        │     │  Entity         │     │  Relationship   │
│  Services       │◀────│  Syncers        │◀────│  Syncer         │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Data Flow

1. **API Layer** (`syncRoutes.js`)
   - Handles HTTP requests
   - Uses DataSyncService singleton
   - Manages response formatting
   - Implements error handling

2. **Service Layer** (`DataSyncService.js`)
   - Singleton pattern
   - Coordinates with SyncOrchestrator
   - Manages compute services
   - Handles cache invalidation

3. **Orchestration Layer** (`SyncOrchestrator.js`)
   - Manages sync phases
   - Handles transactions
   - Tracks progress
   - Supports cancellation

4. **Entity Layer**
   - BaseSyncer (abstract)
   - CharacterSyncer
   - ElementSyncer
   - PuzzleSyncer
   - TimelineEventSyncer

5. **Compute Layer**
   - ActFocusComputer
   - ResolutionPathComputer
   - NarrativeThreadComputer
   - CharacterLinkComputer

### Sync Phases

1. **Phase 1: Entity Sync**
   - Sync base entities
   - Transaction management
   - Error handling
   - Progress tracking

2. **Phase 2: Relationship Sync**
   - Sync relationships
   - Compute character links
   - Validate foreign keys
   - Handle rollback

3. **Phase 3: Compute**
   - Compute derived fields
   - Update cache
   - Handle errors
   - Track progress

4. **Phase 4: Cache**
   - Invalidate journey cache
   - Clear expired cache
   - Refresh as needed
   - Handle failures

### Error Handling

1. **API Errors**
   - HTTP status codes
   - Error messages
   - Stack traces (dev only)
   - Recovery options

2. **Sync Errors**
   - Transaction rollback
   - Partial sync handling
   - Retry logic
   - Error logging

3. **Compute Errors**
   - Individual computation
   - Batch processing
   - Error recovery
   - Status reporting

### Performance Targets

1. **Sync Duration**
   - Full sync: < 30s
   - Entity sync: < 15s
   - Relationship sync: < 5s
   - Compute: < 10s

2. **Memory Usage**
   - Peak: < 500MB
   - Stable: < 200MB
   - Cache: < 100MB

3. **Database**
   - Connections: < 10
   - Transaction time: < 5s
   - Query time: < 1s

---

This guide should be updated whenever schema changes are made or new calculated fields are added. 