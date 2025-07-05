# Act Focus Field Investigation

## Executive Summary

The "Act Focus" column shown on the Characters page displays "N/A" for all characters because **characters do NOT have an `act_focus` field**. The `act_focus` field is computed and stored only for Timeline Events, not Characters.

## Technical Findings

### 1. Where Act Focus is Actually Computed

**ActFocusComputer.js** (`/storyforge/backend/src/services/compute/ActFocusComputer.js`)

- **Target Entity**: Timeline Events (NOT Characters)
- **Database Table**: `timeline_events.act_focus`
- **Algorithm**: 
  1. Parse the `element_ids` JSON array from a timeline event
  2. Query the `elements` table for related elements
  3. Extract the `first_available` field from each related element
  4. Count occurrences of each act ("Act 1", "Act 2", etc.)
  5. Return the most common act as the event's act focus
  6. Use act sequence ordering as tiebreaker (from GameConstants.ACTS.SEQUENCE)

### 2. Input Data Sources

- **Primary Input**: `timeline_events.element_ids` (JSON array)
- **Secondary Input**: `elements.first_available` (act designation)
- **Fallback**: Returns `null` if no elements or malformed JSON

### 3. Algorithm Logic

```javascript
// Simplified algorithm:
const elementIds = JSON.parse(event.element_ids || '[]');
const elements = db.query('SELECT first_available FROM elements WHERE id IN (?)', elementIds);

const actCounts = {};
elements.forEach(el => {
  if (el.first_available) {
    actCounts[el.first_available] = (actCounts[el.first_available] || 0) + 1;
  }
});

// Return most common act with sequence ordering as tiebreaker
const actFocus = mostCommonAct(actCounts) || null;
```

## What Act Focus Represents in Game Design

### Game Design Meaning
**Act Focus indicates when a timeline event occurs in the story structure:**

- **Act 1**: Early game events (0-60 minutes)
- **Act 2**: Late game events (60-90 minutes)  
- **Unassigned**: Events not yet assigned to a specific act

### Business Logic Examples

**A timeline event gets "Act 2" focus when:**
- Most of its related elements are marked as `first_available: "Act 2"`
- Example: A climactic confrontation that requires multiple Act 2 props/evidence

**A timeline event gets "Act 1" focus when:**
- Most of its related elements are available early in the game
- Example: Initial character introductions using Act 1 props

**Tiebreaking:**
- If equal counts, earlier acts win (Act 1 > Act 2 > Unassigned)
- Sequence defined in GameConstants.ACTS.SEQUENCE

## Database Schema Evidence

### Timeline Events Table (HAS act_focus):
```sql
ALTER TABLE timeline_events ADD COLUMN act_focus TEXT;
```

### Characters Table (NO act_focus):
```sql
-- Characters table schema:
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  name TEXT,
  type TEXT,
  tier TEXT,
  logline TEXT,
  resolution_paths TEXT, -- JSON array
  connections INTEGER,
  total_memory_value INTEGER DEFAULT 0
);
-- NO act_focus field!
```

## Frontend Data Flow Analysis

### API Response (What Characters Actually Have):
```json
{
  "id": "18c2f33d-583f-8086-8ff8-fdb97283e1a8",
  "name": "Alex Reeves", 
  "type": "Player",
  "tier": "Core",
  "logline": "Bitter Innovator Betrayed",
  "resolution_paths": ["Unassigned"]
  // NO act_focus field!
}
```

### Frontend Column Definition:
```javascript
// CharacterTableColumns.jsx - Line 68
{ 
  id: 'act_focus',           // <- This field doesn't exist on characters
  label: 'Act Focus',
  sortable: true,
  width: '8%',
  format: (value) => value ? (
    <Chip
      size="small"
      label={value}
      color={value === 'Act 1' ? 'warning' : value === 'Act 2' ? 'info' : 'default'}
    />
  ) : <Typography variant="caption" color="textSecondary">N/A</Typography>
}
```

**Result**: Since `character.act_focus` is always `undefined`, all characters show "N/A"

## The Core Problem

**Conceptual Mismatch**: The frontend assumes characters have an act focus, but act focus is a timeline event concept.

### Questions This Raises:

1. **Should characters have act focus?**
   - If yes, how would it be computed? (Most common act from their events?)
   
2. **Is this a data display error?**
   - Should the column show timeline event data instead?
   
3. **Is this a design intention?**
   - Was act focus supposed to be computed for characters but never implemented?

## Potential Solutions

### Option 1: Remove Act Focus Column from Characters
- Simple fix: Remove the column from CharacterTableColumns.jsx
- Pro: Eliminates confusion and "N/A" displays
- Con: Loses potentially useful information

### Option 2: Compute Character Act Focus
- Add a new computed field for characters
- Algorithm: Most common act from character's timeline events
- Requires backend changes (new computer class)

### Option 3: Show Different Data
- Replace with character's primary timeline event act focus
- Or show distribution across acts ("Act 1: 3, Act 2: 1")

## Recommendation

**Remove the Act Focus column from Characters page** until the team decides:
1. Whether characters should have computed act focus
2. What that act focus should represent
3. How it should be calculated

The current implementation creates user confusion by showing "N/A" for all records.

---

**Files Analyzed:**
- `/storyforge/backend/src/services/compute/ActFocusComputer.js`
- `/storyforge/backend/src/db/migration-scripts/20250106000000_add_computed_fields.sql`
- `/storyforge/frontend/src/components/Characters/CharacterTableColumns.jsx`
- `/storyforge/backend/src/db/queries.js`