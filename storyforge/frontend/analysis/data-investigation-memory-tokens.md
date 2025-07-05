# Memory Token Data Structure Investigation

## Executive Summary

The ALNTool memory token system is a comprehensive economy tracking tool that parses token data from element descriptions, calculates individual and group values, and tracks ownership relationships. The system supports both individual token economics and group completion bonuses.

## Memory Token Fields

### Source Fields (Parsed from Element Descriptions)
All memory token data is stored as structured text in element descriptions using SF_ prefixes:

1. **SF_RFID: [value]** - RFID tag identifier
   - Format: `SF_RFID: [MEM001]` or `SF_RFID: ABC123`
   - Value "TBD" is ignored and results in null
   - Stored in: `elements.rfid_tag` (TEXT)

2. **SF_ValueRating: [1-5]** - Base value rating
   - Format: `SF_ValueRating: [3]` or `SF_ValueRating: 3`
   - Valid range: 1-5 (maps to dollar values in GameConstants)
   - Invalid values (0, 6+) result in 0
   - Stored in: `elements.value_rating` (INTEGER)

3. **SF_MemoryType: [type]** - Memory token type for multiplier
   - Format: `SF_MemoryType: [Personal]` or `SF_MemoryType: Business`
   - Valid types: Personal, Business, Technical
   - Stored in: `elements.memory_type` (TEXT)

4. **SF_Group: [GroupName (multiplier)]** - Group affiliation and completion bonus
   - Format: `SF_Group: [Ephemeral Echo (x10)]` or `SF_Group: Digital Archive (5x)`
   - Group name can contain spaces
   - Multiplier format accepts both "10x" and "x10"
   - Stored in: `elements.memory_group` (TEXT), `elements.group_multiplier` (REAL)

### Computed Fields

5. **calculated_memory_value** - Individual token value (INTEGER)
   - Formula: Base Value × Type Multiplier
   - Does NOT include group multiplier (that's for completion bonuses)
   - Example: Rating 3 + Technical = $1000 × 10 = $10,000

6. **total_memory_value** - Character total (computed by MemoryValueComputer)
   - Sum of all owned token values
   - Stored in: `characters.total_memory_value` (INTEGER)

## Token Value Calculation System

### Base Values (GameConstants.MEMORY_VALUE.BASE_VALUES)
```javascript
{
  1: $100,
  2: $500,
  3: $1000,
  4: $5000,
  5: $10000
}
```

### Type Multipliers (GameConstants.MEMORY_VALUE.TYPE_MULTIPLIERS)
```javascript
{
  'Personal': 2.0,
  'Business': 5.0,
  'Technical': 10.0
}
```

### Individual Token Value Formula
```
Individual Value = Base Value × Type Multiplier
```

### Group Completion Multipliers
- **Individual Tokens**: Group multiplier is stored but NOT applied
- **Group Completion Bonus**: When ALL tokens in a group are collected by one character
- **Group Completion Formula**: `Group Total × Group Multiplier`
- **Global Group Multiplier**: 10.0 (GameConstants.MEMORY_VALUE.GROUP_COMPLETION_MULTIPLIER)

## Token Types & Media Identification

### Memory Element Types (GameConstants.MEMORY_VALUE.MEMORY_ELEMENT_TYPES)
Token types are identified by the element's `type` field (from Notion), not parsed content:

1. **Memory Token Video** - Video-based memory tokens
2. **Memory Token Audio** - Audio-based memory tokens  
3. **Memory Token Physical** - Physical props/items
4. **Corrupted Memory RFID** - Corrupted/damaged tokens
5. **Memory Fragment** - Partial memory pieces

### Media Type Detection Logic
- **Video tokens**: `type === 'Memory Token Video'`
- **Audio tokens**: `type === 'Memory Token Audio'`
- **Image tokens**: Not explicitly categorized (likely "Physical")
- **Audio+Image combinations**: Would need custom logic based on description content

## Rightful Owner Determination

### Current Ownership System
"Rightful owners" are determined through the `character_owned_elements` relationship table:

1. **Direct Ownership**: Characters linked via `character_owned_elements.character_id`
2. **Single Owner**: Current system enforces one owner per token
3. **Owner Assignment**: Managed during Notion sync via element "Owner" property

### Ownership Queries
```sql
-- Get character's owned memory tokens
SELECT e.* FROM elements e
JOIN character_owned_elements coe ON e.id = coe.element_id
WHERE coe.character_id = ? AND e.calculated_memory_value > 0

-- Get total memory value by character
SELECT c.name, c.total_memory_value 
FROM characters c 
WHERE c.total_memory_value > 0
ORDER BY c.total_memory_value DESC
```

### Alternative Owner Concepts
The system could potentially support:
- **Multiple rightful owners** via description parsing
- **Contextual ownership** based on discovery scenarios
- **Temporary ownership** for trading/puzzle mechanics

## Memory Economy Targets & Thresholds

### Global Economy Targets (GameConstants.MEMORY_VALUE)
```javascript
TARGET_TOKEN_COUNT: 55,
MIN_TOKEN_COUNT: 50,
MAX_TOKEN_COUNT: 60,
BALANCE_WARNING_THRESHOLD: 0.3  // 30% imbalance triggers warnings
```

### Production Readiness Thresholds
```javascript
MEMORY_TOKEN_WARNING_THRESHOLD: 45,
MEMORY_READINESS_THRESHOLD: 0.8,  // 80% of tokens ready
OVERALL_READINESS_THRESHOLD: 0.7  // 70% overall readiness
```

## Data Pipeline Flow

### 1. Sync Phase (Notion → SQLite)
- Element descriptions containing SF_ fields are imported
- Base element data stored without memory calculations

### 2. Extraction Phase (MemoryValueExtractor)
- Parses SF_ fields from descriptions using regex patterns
- Calculates individual token values
- Updates elements table with parsed data
- **Key insight**: Group multipliers stored but not applied to individual values

### 3. Computation Phase (MemoryValueComputer)
- Aggregates memory values by character via ownership relationships
- Updates `characters.total_memory_value`
- Generates distribution statistics

### 4. API Phase (Frontend Consumption)
- Memory economy endpoints return complete token data
- Frontend displays individual values, group affiliations, and balance analysis
- Balance warnings triggered by economy thresholds

## Production Examples

### Real Production Token
```
Name: Howie's Memory Token: "Elara Vance - Soil of Insight" Lecture Excerpt
Description: Audio memory token from Howie's lecture...

SF_RFID: [TBD]
SF_ValueRating: [1] 
SF_MemoryType: [Personal]
SF_Group: [Ephemeral Echo (x10)]

Calculated Value: $200 ($100 × 2.0 Personal multiplier)
Group: Ephemeral Echo (10x completion bonus when group complete)
Owner: Howie Sullivan
```

## Key Insights for Journey Intelligence Layer

1. **Token-centric Economy**: Each token has individual value + group potential
2. **Ownership Relationships**: Clear character→token mappings for value flow visualization
3. **Production Status**: Token readiness affects overall game production pipeline
4. **Balance Warnings**: Automated detection of economy imbalances and bottlenecks
5. **Group Dynamics**: Set collection mechanics create strategic token trading scenarios
6. **Memory Types**: Different media types (audio/video/physical) create varied gameplay experiences

## Missing Features & Extension Opportunities

1. **Multi-owner tokens**: Currently single-owner, could support shared ownership
2. **Dynamic ownership**: Tokens could change hands during gameplay
3. **Fractional ownership**: Percentage-based ownership for complex scenarios
4. **Token trading history**: Track ownership changes over time
5. **Context-aware values**: Token values could vary based on character context
6. **Group discovery bonuses**: Additional rewards for finding complete sets

---

*This investigation reveals a sophisticated token economy system ready for advanced journey intelligence visualization and game designer production tools.*