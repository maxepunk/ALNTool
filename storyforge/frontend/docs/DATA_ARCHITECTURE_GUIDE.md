# Data Architecture Guide

**Created**: January 13, 2025  
**Purpose**: Document the dual-path API architecture and prevent field name confusion  
**Critical**: Read this before working with element data!

## 🚨 The Most Important Thing to Know

**The frontend expects an `element_type` field that DOES NOT EXIST.**

Instead, the backend provides:
- `type` field when using the performance path
- `basicType` field when using the fresh data path

## The Dual-Path Architecture

Our API has two different paths for elements, each optimized for different use cases:

### 1. Performance Path (SQLite Cache)

**When to use**: Displaying lists of 400+ elements (like Memory Economy view)  
**Endpoint**: `GET /api/elements?filterGroup=memoryTypes`  
**Returns**: Pre-computed data from SQLite with calculated values

```javascript
// Example response
{
  success: true,
  data: [{
    id: "elem_001",
    type: "Memory Token Video",  // ← Note: 'type' not 'element_type'
    name: "Victoria's Confession",
    calculated_memory_value: 5000,  // Pre-computed
    owner_name: "Victoria",         // Denormalized
    container_name: "Safe",         // Denormalized
    // ... other computed fields
  }]
}
```

### 2. Fresh Data Path (Notion API)

**When to use**: Viewing/editing single elements, need latest data  
**Endpoint**: `GET /api/elements` (no filterGroup)  
**Returns**: Live data from Notion with full relationships

```javascript
// Example response
{
  success: true,
  data: [{
    id: "elem_001",
    basicType: "Memory Token Video",  // ← Note: 'basicType' not 'type'
    name: "Victoria's Confession",
    owner: [{ id: "char_001", name: "Victoria" }],  // Full relations
    container: [{ id: "elem_002", name: "Safe" }],
    // ... other relational fields
  }]
}
```

## How to Handle This in Code

### 1. Create Explicit Data Hooks

```javascript
// hooks/usePerformanceElements.js
export function usePerformanceElements() {
  return useQuery({
    queryKey: ['elements', 'performance'],
    queryFn: () => api.getElements({ filterGroup: 'memoryTypes' }),
    staleTime: 5 * 60 * 1000, // 5 min - it's cached anyway
  });
}

// hooks/useFreshElements.js
export function useFreshElements() {
  return useQuery({
    queryKey: ['elements', 'fresh'],
    queryFn: () => api.getElements(),
    staleTime: 0, // Always fresh
  });
}
```

### 2. Create Field Utilities

```javascript
// utils/elementFields.js
export const getElementType = (element) => {
  // Handles both paths transparently
  return element.type || element.basicType || 'Unknown';
};

export const isMemoryToken = (element) => {
  const type = getElementType(element);
  return type?.toLowerCase().includes('memory');
};
```

### 3. Use in Components

```javascript
// Bad - assumes field exists
const elementType = element.element_type; // ❌ WILL BE UNDEFINED

// Good - handles both paths
const elementType = getElementType(element); // ✅ Works with either API
```

## Understanding Memory Token Fields

Memory tokens have additional economic data parsed from their Description field:

- **Basic Type**: The media format (Memory Token Video, Memory Token Audio, etc.)
- **SF_MemoryType**: Economic category (Personal, Business, Technical) for multipliers
- **SF_ValueRating**: Base value rating (1-5) → $250-$1500
- **SF_Group**: Collection bonus group (e.g., "Victoria Memories x2")

These SF_ fields are:
1. Entered in Notion's Description field as structured text
2. Parsed during sync
3. Stored in SQLite for performance
4. Used to calculate memory token economy

## Which Path Should Each Component Use?

| Component | Path | Reason |
|-----------|------|---------|
| AdaptiveGraphCanvas | Performance | Needs to handle 400+ elements efficiently |
| MemoryEconomyView | Performance | Needs pre-computed values |
| ElementDetailPanel | Fresh | Needs latest relational data |
| IntelligencePanel | Both | Overview uses performance, detail might use fresh |

## Common Mistakes to Avoid

1. **Don't assume `element_type` exists** - it never does
2. **Don't normalize away the differences** - they exist for good reasons
3. **Don't use the wrong path** - fresh data for lists will be slow
4. **Don't forget the dual nature** - test with both response shapes

## Why This Architecture Exists

1. **Scale**: The game has 400+ elements (mostly memory tokens)
2. **Performance**: Computing values for 400 tokens on every request would be slow
3. **Complexity**: Memory token economics require multiple calculations
4. **Flexibility**: Some views need speed, others need freshness

This is not technical debt - it's a performance optimization that enables our UX.