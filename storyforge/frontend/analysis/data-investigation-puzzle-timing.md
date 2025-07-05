# Puzzle "Timing" Field Investigation

## Summary

The puzzle "timing" field represents **when in the game's timeline puzzles are available or become solvable**. It uses Act-based timing for broad temporal categorization in the murder mystery game flow.

## Data Structure Findings

### Current Database State
- **All puzzles currently have timing: "Unknown"** in production database
- This suggests either:
  1. Notion data hasn't been properly synced with timing values
  2. Timing field in Notion is empty/not configured
  3. Property mapping issue from Notion to SQLite

### Field Definition and Mapping

**Source**: `/home/spide/projects/GitHub/ALNTool/storyforge/backend/src/utils/notionPropertyMapper.js:213`
```javascript
timing: extractSelect(properties.Timing),
```

**Storage**: Stored as string in SQLite `puzzles.timing` field

**Display**: In UI tables, timing is shown in "Act Focus" column with fallback:
```javascript
format: (value, row) => row.properties?.actFocus || row.timing || 'N/A'
```

## What "Timing" Actually Means

### 1. **Game Flow Control**
Based on the timingParser utility, timing represents **when puzzles become available during game progression**:

- **"Act 1"**: Minutes 0-60 (Early game, first hour)
- **"Act 2"**: Minutes 60-90 (Late game, final 30 minutes)
- **Specific ranges**: "15-30", "45-60" for precise minute windows
- **Game phases**: "Early Game" (0-30), "Mid Game" (30-60), "Late Game" (60-90)

### 2. **NOT Element Availability**
The timing field does NOT represent when required elements first become accessible. That would be tracked through:
- Element-specific timing fields
- Dependency chains in the relationship system
- Unlock sequences through `lockedItem` relationships

### 3. **Game Design Intent**
Based on GameConstants and UI patterns, timing appears to be for:
- **Pacing control**: Ensuring puzzles are spread across the 90-minute game
- **Story progression**: Aligning puzzles with narrative acts
- **Player flow**: Managing cognitive load and engagement curves
- **Production planning**: Coordinating when physical props/elements need to be available

## Code Evidence

### timingParser.js Supports Multiple Formats:
```javascript
// Act-based (broad categories)
"Act 1" → { start: 0, end: 60 }
"Act 2" → { start: 60, end: 90 }

// Phase-based (more granular)
"Early Game" → { start: 0, end: 30 }
"Mid Game" → { start: 30, end: 60 }  
"Late Game" → { start: 60, end: 90 }

// Minute-specific (precise timing)
"15-30" → { start: 15, end: 30 }
"Minute 45" → { start: 45, end: 50 }
```

### UI Shows Act-Based Filtering:
From RelationshipMapper ControlsPanel:
```javascript
<MenuItem value="Act 1">Act 1</MenuItem>
<MenuItem value="Act 2">Act 2</MenuItem>
<MenuItem value="Act 3">Act 3</MenuItem>
```

## Data Quality Issues

### Current State Problems:
1. **All timing values are "Unknown"** - no actual timing data in production
2. **No Act 3 timing constants** - GameConstants only defines Act 1 & 2
3. **Potential sync issue** - Notion "Timing" property may not be populated

### Recommendations for Investigation:
1. **Check Notion source**: Verify if "Timing" property has actual values in Notion database
2. **Review sync logs**: Check if timing extraction is failing during Notion sync
3. **Validate property mapping**: Ensure "Timing" property name matches Notion field exactly
4. **Consider Act 3**: Determine if game design actually has 3 acts or just 2

## For Journey Intelligence Layer

### Flow Intelligence Implications:
- **Current**: Can't calculate timing gaps due to "Unknown" values
- **Potential**: Could visualize puzzle pacing and act distribution
- **Enhancement needed**: Resolve data quality issues to enable temporal analysis

### Dependency Intelligence:
- **Timing ≠ Dependencies**: Timing is availability window, not prerequisite chain
- **Use `lockedItem`**: For actual dependency relationships
- **Use `puzzleElements`**: For required elements to solve puzzle

### Production Intelligence:
- **Timing gaps**: Could warn about acts with no puzzles
- **Pacing issues**: Could identify bunched puzzles in narrow time windows
- **Resource conflicts**: Could flag multiple puzzles needing same elements simultaneously

## Next Steps

1. **Verify Notion data**: Check if actual timing values exist in source
2. **Fix sync if needed**: Ensure proper mapping from Notion → SQLite
3. **Update GameConstants**: Add Act 3 timing if game design requires it
4. **Test with real data**: Once timing is populated, verify journey intelligence features work correctly