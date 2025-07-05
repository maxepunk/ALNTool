# Accurate Data Flow Understanding

**Created**: January 13, 2025  
**Purpose**: Document the TRUE data flow after correcting misunderstandings

## Executive Summary

ALNTool has a sophisticated dual-path API architecture optimized for different use cases:
- **Notion Path**: Fresh data for general browsing
- **SQLite Path**: Pre-computed memory token economics for performance

## Key Concepts to Understand

### 1. Basic Type vs SF_MemoryType (Different Purposes!)

**Basic Type** (Notion Select Field):
- Describes what KIND of element this is
- Values: "Prop", "Set Dressing", "Memory Token Video", "Memory Token Audio", "Memory Token Audio + Image"
- Applies to ALL elements
- For memory tokens, describes the MEDIA format

**SF_MemoryType** (Parsed from Description):
- ONLY for memory tokens
- Describes the ECONOMIC category for black market calculations
- Values: "Personal" (1.0x), "Business" (1.5x), "Technical" (2.0x)
- Used to calculate multipliers for the Memory Economy

### 2. Memory Token Economics (SF_ Fields)

For memory tokens, the Description field contains structured data:

```
SF_RFID: [unique-uuid-for-physical-token]
SF_ValueRating: [1-5, determines base value $250-$1500]
SF_MemoryType: [Personal|Business|Technical for multiplier]
SF_Group: [Victoria Memories x2, group bonus if all collected]
```

These are parsed during sync and stored in dedicated database columns for performance.

### 3. Dual API Response Architecture

```
GET /api/elements
│
├─ With ?filterGroup=memoryTypes
│  └─ SQLite Query Path
│     - Pre-computed values
│     - Returns 'type' field
│     - Includes calculated_memory_value
│     - Optimized for Memory Economy Page
│
└─ Without filterGroup
   └─ Notion API Path
      - Fresh from source
      - Returns 'basicType' field
      - No computed values
      - General purpose browsing
```

## Complete Field Mapping

### Notion → Backend Sync → Database

| Notion Property | Sync Mapping | Database Column | Purpose |
|----------------|--------------|-----------------|---------|
| Basic Type | basicType | type | Element category/media type |
| Description | description | description | Contains SF_ fields for memory tokens |
| (parsed) | sf_rfid | rfid_tag | Physical token ID |
| (parsed) | sf_value_rating | value_rating | Base value 1-5 |
| (parsed) | sf_memory_type | memory_type | Economic multiplier type |
| (parsed) | sf_group | memory_group | Collection bonus group |

### API Response Structures

#### SQLite Path Response (Memory Tokens)
```javascript
{
  id: "element_id",
  type: "Memory Token Video",        // From 'type' column
  name: "Victoria's Confession",
  
  // Parsed memory fields
  rfid_tag: "RFID_001",
  value_rating: 5,
  memory_type: "Personal",
  memory_group: "Victoria Memories",
  
  // Computed economics
  calculated_memory_value: 1500,     // Base × multipliers
  baseValueAmount: 1500,             // From value_rating
  typeMultiplierValue: 1.0,          // From memory_type
  finalCalculatedValue: 1500,
  
  // Relations
  owner_name: "Victoria",
  container_name: "Safe"
}
```

#### Notion Path Response (General Elements)
```javascript
{
  id: "element_id",
  basicType: "Memory Token Video",   // From Notion select
  name: "Victoria's Confession",
  description: "SF_RFID: [RFID_001]\\nSF_ValueRating: [5]...",
  
  // Relations as arrays
  owner: [{id: "char_id", name: "Victoria"}],
  container: [{id: "elem_id", name: "Safe"}],
  
  // Properties object for memory types
  properties: {
    parsed_sf_rfid: "RFID_001",      // Parsed from description
    sf_value_rating: 5,
    sf_memory_type: "Personal"
  }
}
```

## Frontend Field Name Issues

The frontend expects `element_type` but should use:
- `type` when data comes from SQLite path
- `basicType` when data comes from Notion path

## Why This Architecture?

1. **Performance**: Memory Economy Page shows 370-440 tokens with complex calculations
2. **Caching**: Economic values computed once during sync, not on every request
3. **Flexibility**: Fresh Notion data when needed, cached data for heavy views
4. **Game Design**: Memory token economics are critical for game balance

## Corrections to Previous Understanding

1. ✅ Memory Token Video DOES exist in Notion (at least one)
2. ✅ Basic Type describes media format, not economic category
3. ✅ SF_MemoryType is for black market multipliers only
4. ✅ Dual API structure is intentional for performance
5. ✅ Frontend needs to handle both response shapes