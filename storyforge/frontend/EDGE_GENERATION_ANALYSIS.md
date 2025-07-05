# Edge Generation Analysis: Gap Between Notion Data and Visualization

## Executive Summary

The ALNTool currently only displays character-character relationships in the graph visualization, despite having rich relational data from Notion stored in the backend database. This analysis reveals the missing pieces in the data pipeline and provides recommendations for completing the edge visualization.

## Current State

### 1. What's Working
- **Character-character edges**: Successfully displayed via the `/api/character-links` endpoint
- **Backend relationship tables**: Properly populated from Notion during sync:
  - `character_owned_elements`
  - `character_associated_elements` 
  - `character_puzzles`
  - `character_timeline_events`
- **Frontend edge creation utilities**: Functions exist to create different edge types:
  - `createOwnershipEdges()` - For character→element ownership
  - `createContainerEdges()` - For element→element containment
  - `createPuzzleEdges()` - For puzzle↔element requirements/rewards

### 2. What's Missing

#### A. Missing API Endpoints
The backend has rich relationship data but only exposes character-character links:

**Currently Available:**
- `GET /api/character-links` - Returns character-to-character relationships

**Missing Endpoints Needed:**
1. Character-Element relationships:
   - `GET /api/character-element-links` - Should return ownership and association data
   
2. Character-Puzzle relationships:
   - `GET /api/character-puzzle-links` - Should return puzzle ownership data
   
3. Puzzle-Element relationships:
   - `GET /api/puzzle-element-links` - Should return requirements and rewards
   
4. Element-Element relationships:
   - `GET /api/element-container-links` - Should return container relationships
   
5. Character-Timeline relationships:
   - `GET /api/character-timeline-links` - Should return event participation

#### B. Data Structure Issues

1. **Element Data Format**: Elements from API have nested structures:
   ```javascript
   // Current API response
   {
     owner: [{id: "char123", name: "Sarah"}],
     container: [{id: "elem456", name: "Briefcase"}]
   }
   
   // What frontend expects
   {
     owner_character_id: "char123",
     container_element_id: "elem456"
   }
   ```

2. **Puzzle Data Format**: Similar nesting issues with puzzle relationships

#### C. Frontend Data Flow Gaps

1. **Edge Creation Called But Not Fed Proper Data**:
   - `createOwnershipEdges(elements)` is called but elements may not have `owner_character_id` field
   - `createPuzzleEdges(puzzles)` expects `requiredElements` and `rewardIds` arrays that may not exist

2. **Progressive Loading Issue**: 
   - When entities are loaded progressively, their relationships aren't fetched
   - No mechanism to fetch cross-entity relationships after initial load

## Notion Data Model (From Backend Analysis)

From `notionPropertyMapper.js`, the Notion relationships include:

### Characters have:
- Events (timeline events they participate in)
- Character Puzzles (puzzles they own)
- Owned Elements
- Associated Elements

### Puzzles have:
- Owner (character)
- Locked Item (element)
- Puzzle Elements (required inputs)
- Rewards (elements given on completion)
- Parent item (parent puzzle)
- Sub-Puzzles (child puzzles)

### Elements have:
- Owner (character)
- Container (parent element)
- Container Puzzle
- Required For (puzzles that need this)
- Rewarded by (puzzles that give this)
- Timeline Event
- Associated Characters

### Timeline Events have:
- Characters Involved
- Memory Evidence (elements)

## Recommendations

### 1. Backend API Enhancements

Create new endpoints in `notionController.js`:

```javascript
// Get all character-element relationships
const getCharacterElementLinks = catchAsync(async (req, res) => {
  const links = dbQueries.getCharacterElementLinks();
  res.json(links);
});

// Get all puzzle-element relationships  
const getPuzzleElementLinks = catchAsync(async (req, res) => {
  const links = dbQueries.getPuzzleElementLinks();
  res.json(links);
});
```

### 2. Database Query Functions

Add to `queries.js`:

```javascript
function getCharacterElementLinks() {
  const db = getDB();
  return db.prepare(`
    SELECT 
      'ownership' as link_type,
      character_id as source,
      element_id as target,
      c.name as source_name,
      e.name as target_name
    FROM character_owned_elements coe
    JOIN characters c ON coe.character_id = c.id
    JOIN elements e ON coe.element_id = e.id
    
    UNION ALL
    
    SELECT 
      'association' as link_type,
      character_id as source,
      element_id as target,
      c.name as source_name,
      e.name as target_name
    FROM character_associated_elements cae
    JOIN characters c ON cae.character_id = c.id
    JOIN elements e ON cae.element_id = e.id
  `).all();
}
```

### 3. Frontend Integration

Update `JourneyIntelligenceView.jsx` to fetch all relationship types:

```javascript
// Fetch character-element relationships
const { data: characterElementLinks } = useQuery({
  queryKey: ['character-element-links'],
  queryFn: () => api.getCharacterElementLinks(),
  enabled: !focusedCharacterId && loadedEntityTypes.includes('elements')
});

// Add these edges to the graph
if (characterElementLinks) {
  edges.push(...characterElementLinks.map(link => ({
    id: `${link.link_type}-${link.source}-${link.target}`,
    source: link.source,
    target: link.target,
    type: 'smoothstep',
    animated: link.link_type === 'ownership',
    data: {
      type: `character-element-${link.link_type}`
    },
    style: {
      stroke: link.link_type === 'ownership' ? '#10b981' : '#64748b',
      strokeWidth: link.link_type === 'ownership' ? 2 : 1.5,
      strokeDasharray: link.link_type === 'ownership' ? '5,5' : '0'
    }
  })));
}
```

### 4. Data Transformer Updates

Ensure `transformElement` properly extracts relationship IDs:

```javascript
export function transformElement(apiElement) {
  return {
    ...apiElement,
    // Flatten nested structures
    owner_character_id: apiElement.owner?.[0]?.id || null,
    container_element_id: apiElement.container?.[0]?.id || null,
    requiredForPuzzles: apiElement.requiredFor?.map(p => p.id) || [],
    rewardedByPuzzles: apiElement.rewardedBy?.map(p => p.id) || []
  };
}
```

## Impact Analysis

### Benefits of Complete Edge Visualization:
1. **Social Choreography**: Visible puzzle→element→character dependencies
2. **Token Economy**: Clear ownership and container relationships
3. **Story Intelligence**: Timeline event connections revealed
4. **Production Planning**: Physical prop dependencies mapped

### Current Limitations Impact:
1. Designers can't see cross-entity dependencies
2. Memory token flow is invisible
3. Puzzle requirements/rewards aren't connected
4. Timeline events appear isolated

## Conclusion

The backend has all the relationship data from Notion, but it's not exposed through the API. The frontend has the capability to render these edges but lacks the data. Bridging this gap requires:

1. New API endpoints to expose existing relationship data
2. Proper data transformation to flatten nested structures
3. Frontend queries to fetch relationship data progressively
4. Edge styling to differentiate relationship types

This would transform the current character-only relationship view into a rich, multi-dimensional graph showing all entity interdependencies as designed in Notion.