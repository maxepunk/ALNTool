# Entity Data Structures: Complete Data Flow Analysis

## Executive Summary

This document traces the complete data transformation pipeline from Notion to Frontend for all entity types in the ALNTool system. It documents field name mappings, computed fields, and potential data inconsistencies at each stage.

## Data Flow Stages

1. **Notion API** → Raw Notion data with specific property names
2. **notionPropertyMapper.js** → Transforms Notion properties to internal format
3. **SQLite Database** → Stores data with normalized field names
4. **Compute Phase** → Adds computed fields via Computer classes
5. **API Layer** → Transforms and exposes data to frontend
6. **Frontend** → Consumes and displays data

---

## Elements Data Flow

### Stage 1: Notion Properties
```javascript
// Notion property names (as they appear in Notion database)
{
  "Name": "Victoria's Voice Memo",
  "Basic Type": "Memory Token Audio",
  "Description/Text": "SF_RFID: [RFID123]\nSF_ValueRating: [5]\nSF_MemoryType: [Personal]\nSF_Group: [Victoria Memories (x2)]",
  "Owner": [relation to Character],
  "Container": [relation to Element],
  "Status": "Ready",
  "First Available": "Act 1",
  "Timeline Event": [relation to Timeline Event],
  // ... other properties
}
```

### Stage 2: notionPropertyMapper.js Transformation
```javascript
// mapElementWithNames() output
{
  id: "element-id-123",
  name: "Victoria's Voice Memo",
  basicType: "Memory Token Audio",
  description: "SF_RFID: [RFID123]...",
  owner: [{id: "char-id", name: "Victoria"}],
  container: [{id: "elem-id", name: "Jewelry Box"}],
  status: "Ready",
  firstAvailable: "Act 1",
  timelineEvent: [{id: "event-id", description: "Victoria records memo"}],
  // Memory fields parsed from description:
  properties: {
    parsed_sf_rfid: "RFID123",
    sf_value_rating: 5,
    sf_memory_type: "Personal",
    sf_group: "Victoria Memories (x2)",
    sf_group_multiplier: 2.0
  }
}
```

### Stage 3: SQLite Storage (ElementSyncer.js)
```sql
-- elements table columns
id, name, type, description, status, owner_id, container_id, 
production_notes, first_available, timeline_event_id,
rfid_tag, value_rating, memory_type, memory_group, 
group_multiplier, calculated_memory_value

-- Mapped values:
type = basicType
rfid_tag = properties.parsed_sf_rfid
value_rating = properties.sf_value_rating
memory_type = properties.sf_memory_type
memory_group = properties.sf_group
group_multiplier = properties.sf_group_multiplier
calculated_memory_value = value_rating * group_multiplier
```

### Stage 4: Compute Phase
```javascript
// ResolutionPathComputer adds:
resolution_paths: ["Black Market", "Detective", "Return to Owner"]

// No other computed fields for elements currently
```

### Stage 5: API Transformation (notionController.js)
```javascript
// getElements with filterGroup='memoryTypes'
{
  // All SQLite fields plus:
  sf_value_rating: el.value_rating,         // Remapped back!
  sf_memory_type: el.memory_type,           // Remapped back!
  parsed_sf_rfid: el.rfid_tag,              // Remapped back!
  sf_memory_group: el.memory_group,         // Added prefix!
  
  // Computed fields for backward compatibility:
  baseValueAmount: VALUE_RATING_MAP[el.value_rating],
  typeMultiplierValue: TYPE_MULTIPLIER_MAP[el.memory_type],
  finalCalculatedValue: el.calculated_memory_value,
  
  // Nested properties object (duplicated data):
  properties: {
    sf_value_rating: el.value_rating,
    sf_memory_type: el.memory_type,
    parsed_sf_rfid: el.rfid_tag,
    status: el.status
  }
}
```

### Stage 6: Frontend Usage
```javascript
// MemoryEconomyPage expects:
element.properties.sf_value_rating      // From nested properties
element.properties.sf_memory_type       // From nested properties
element.baseValueAmount                 // From API computation
element.finalCalculatedValue            // From API computation

// Elements.jsx expects:
element.properties.actFocus            // NOT PROVIDED - always undefined!
element.properties.themes              // NOT PROVIDED - always undefined!
element.properties.memorySets          // NOT PROVIDED - always undefined!
```

### 🔴 CRITICAL ISSUES IDENTIFIED

1. **Field Name Inconsistency**: Same data has different names at each stage
   - Notion: "Basic Type" → Mapper: basicType → SQLite: type → API: basicType
   - Parser: sf_value_rating → SQLite: value_rating → API: sf_value_rating

2. **Missing Computed Fields**: 
   - `act_focus` is never computed for elements (only for timeline_events)
   - `themes` and `memorySets` are expected but never provided

3. **Data Duplication**: Memory fields appear both at root level AND in properties object

4. **Backward Compatibility Cruft**: Multiple representations of same value
   - calculated_memory_value = finalCalculatedValue = memoryValue

---

## Timeline Events Data Flow

### Stage 1: Notion Properties
```javascript
{
  "Description": "Marcus and Victoria have affair",
  "Date": "2023-10-15",
  "Characters Involved": [relation to Characters],
  "Memory/Evidence": [relation to Elements],
  "mem type": "Backstory",
  "Notes": "Critical plot point"
}
```

### Stage 2: notionPropertyMapper.js
```javascript
{
  id: "event-id",
  description: "Marcus and Victoria have affair",
  date: "2023-10-15",
  charactersInvolved: [{id: "marcus-id", name: "Marcus"}, {id: "victoria-id", name: "Victoria"}],
  memoryEvidence: [{id: "elem-id", name: "Hotel Receipt"}],
  memType: "Backstory",
  notes: "Critical plot point"
  // Note: NO act_focus here - it's computed later
}
```

### Stage 3: SQLite Storage
```sql
-- timeline_events table
id, description, date, mem_type, notes, act_focus

-- Note: act_focus is NULL until compute phase
```

### Stage 4: Compute Phase ✅
```javascript
// ActFocusComputer calculates:
act_focus: "Act 1"  // Based on related elements' first_available acts
```

### Stage 5: API & Frontend
Timeline events work correctly - act_focus is computed and displayed properly.

---

## Puzzles Data Flow

### Stage 1: Notion Properties
```javascript
{
  "Puzzle": "Open Victoria's Jewelry Box",
  "Owner": [relation to Character],
  "Locked Item": [relation to Element],
  "Puzzle Elements": [relations to Elements],
  "Rewards": [relations to Elements],
  "Timing": "Mid",
  "Description/Solution": "Use combination from business card",
  "Narrative Threads": ["Victoria's Secret", "Betrayal"]
}
```

### Stage 2-3: Mapping & Storage
Similar pattern to elements - relations become IDs, multi-selects become JSON arrays.

### Stage 4: Compute Phase ✅
```javascript
// ResolutionPathComputer adds:
resolution_paths: ["Detective", "Black Market"]

// NarrativeThreadComputer adds:
computed_narrative_threads: ["Victoria's Secret", "Betrayal", "Marcus Connection"]
```

### 🟡 PUZZLE ISSUES
- `timing` field shows "Unknown" in UI despite having data
- This might be a display issue rather than data issue

---

## Characters Data Flow

### Stage 1-3: Generally Working Well
Characters have the most straightforward mapping.

### Stage 4: Compute Phase ✅
```javascript
// ResolutionPathComputer adds:
resolution_paths: ["Black Market", "Detective", "Return to Owner"]

// MemoryValueComputer adds:
total_memory_value: 15000

// Relationship sync adds:
linkedCharacters: [{id: "char2", name: "Derek", link_type: "shared_puzzle"}]
```

### 🟢 CHARACTER STATUS
Characters work well - computed fields are properly calculated and displayed.

---

## Computed Fields Summary

### Fields Added During Compute Phase:
1. **act_focus** (timeline_events only)
   - Computed by: ActFocusComputer
   - Based on: Related elements' first_available acts
   
2. **resolution_paths** (characters, puzzles, elements)
   - Computed by: ResolutionPathComputer
   - Based on: Complex relationship analysis
   
3. **total_memory_value** (characters only)
   - Computed by: MemoryValueComputer
   - Based on: Sum of owned elements' calculated_memory_values
   
4. **computed_narrative_threads** (puzzles only)
   - Computed by: NarrativeThreadComputer
   - Based on: Aggregation of related elements' narrative threads

5. **calculated_memory_value** (elements only)
   - Computed during sync (not compute phase)
   - Formula: value_rating * group_multiplier

### Fields That Should Exist But Don't:
1. **act_focus** for elements (always shows "N/A")
2. **themes** for elements (expected by UI but never provided)
3. **memorySets** for elements (expected by UI but never provided)

---

## Recommendations

### 1. Fix Field Name Consistency
Create a unified field naming convention and stick to it throughout the pipeline.

### 2. Add Missing Computed Fields
- Implement ActFocusComputer for elements
- Add themes/memorySets extraction or remove from UI

### 3. Eliminate Data Duplication
Choose one location for each field (root or properties) and use consistently.

### 4. Update Frontend Expectations
Either provide missing fields or update components to not expect them.

### 5. Document Field Mappings
Create a source-of-truth document showing exact field names at each stage.

---

## Data Flow Diagram

```
NOTION → MAPPER → SQLITE → COMPUTE → API → FRONTEND
  ↓        ↓        ↓         ↓       ↓       ↓
"Basic    basicType  type    type    type   basicType
 Type"                              (kept)

"Description  description  description  [parse     rfid_tag   parsed_sf_rfid
 /Text"                               memory                   ↓
  ↓                                   fields]                properties.
  └─[SF_RFID:xxx]                        ↓                   parsed_sf_rfid
                                    rfid_tag

                           [none]   act_focus   act_focus   properties.
                                   (computed)  (included)   actFocus❌
                                                           (missing!)
```

---

*Generated: 2025-01-12*