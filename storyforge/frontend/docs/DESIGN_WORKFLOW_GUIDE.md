# Character Journey Design Workflow

This guide walks through the complete workflow for designing a character's experience in About Last Night.

## Workflow Overview

```
Select Character → Review Current Journey → Identify Gaps → Validate Dependencies → Check Memory Balance → Verify Production
```

## Step-by-Step Process

### 1. Select Your Character

**Where**: Player Journey page

1. Click "Player Journey" in the sidebar
2. Use the character dropdown to select who you're designing for
3. The graph will load showing their current journey

**What You'll See**:
- Timeline visualization of all puzzles and events
- Color-coded nodes (Green=Puzzles, Blue=Elements, Purple=Timeline)
- Experience flow analysis on the right

### 2. Review Current Journey

**What to Look For**:

#### Timeline View
- **Node Sequence**: Are puzzles logically ordered?
- **Time Gaps**: Long periods with no activity?
- **Act Transitions**: Smooth progression between acts?

#### Analysis View
- **Pacing Score**: Should be "Good" or "Excellent"
- **Bottlenecks**: Critical puzzles blocking progress
- **Dead Ends**: Nodes with no outgoing connections

**Red Flags**:
- ⚠️ Gaps longer than 15 minutes
- ⚠️ Multiple bottlenecks in sequence
- ⚠️ Isolated puzzle chains

### 3. Identify and Address Gaps

**Understanding Gaps**:
- **Timing Gaps**: Player has nothing to do
- **Narrative Gaps**: Story doesn't flow
- **Social Gaps**: Player is isolated from others

**How to Address**:
1. Click on gap warnings in the analysis panel
2. Review suggested solutions
3. Consider:
   - Adding a social puzzle
   - Inserting a timeline event
   - Providing an optional side quest

### 4. Validate Dependencies

**Critical Checks**:

#### Puzzle Dependencies
- Does each puzzle have required elements available?
- Are prerequisite puzzles completable?
- Any circular dependencies?

#### Resource Dependencies
- UV lights needed at the right time?
- RFID scanner availability?
- Physical props in correct locations?

**Where to Check**:
1. Click on individual puzzle nodes
2. Review "Required Elements" in tooltip
3. Check Dashboard for dependency alerts

### 5. Balance Memory Economy

**Where**: Memory Economy page

**Process**:
1. Navigate to Memory Economy
2. Find your character in the list
3. Review their token flow:
   - **Collection Points**: When do they earn tokens?
   - **Spending Requirements**: When do they need tokens?
   - **Running Balance**: Do they ever go negative?

**Adjustments**:
- Add token rewards to earlier puzzles
- Reduce spending requirements
- Create alternative token sources

### 6. Production Verification

**Final Checklist**:

#### Dashboard Check
1. Go to Dashboard
2. Look for alerts related to your character
3. Address any red (critical) issues

#### Path Balance
- Compare your character against others in same path
- Ensure similar puzzle counts and complexity
- Verify comparable memory token totals

#### Social Integration
- Check Character Sociogram
- Ensure character has interactions
- Avoid extended isolation periods

## Advanced Techniques

### Cross-Character Coordination

When designing multiplayer puzzles:
1. Open multiple browser tabs
2. View each character's journey
3. Align timing of shared puzzles
4. Verify both can reach the puzzle

### Act Transition Management

For smooth act transitions:
1. Plan climactic puzzle before act break
2. Ensure memory tokens are balanced
3. Provide clear narrative bridge
4. Test transition timing

### Bottleneck Prevention

To avoid bottlenecks:
1. Never have single-solution critical path
2. Provide alternative puzzle routes
3. Allow token-based bypasses for stuck players
4. Design "hint" mechanisms

## Common Patterns

### The Hub Pattern
Central location with multiple puzzle branches:
```
Timeline Event → Hub Location → [Puzzle A, Puzzle B, Puzzle C] → Convergence
```

### The Parallel Path
Two simultaneous activities:
```
Split Point → [Path 1: Combat] or [Path 2: Negotiation] → Merge Point
```

### The Token Gate
Memory economy checkpoint:
```
Token Collection Phase → Token Gate (requires X tokens) → Reward Phase
```

## Troubleshooting

### "Character has 45-minute gap"
1. Check what other characters are doing during this time
2. Add optional side content
3. Insert social interaction opportunity
4. Consider timeline event for narrative

### "Bottleneck at puzzle X"
1. Add alternative solution path
2. Provide hint mechanism
3. Allow token bypass option
4. Check if puzzle is truly critical

### "Memory token shortage"
1. Add collection opportunities earlier
2. Reduce gate requirements
3. Create sharing mechanics with other players
4. Add optional token-earning side quests

## Best Practices

1. **Design in 15-minute chunks**: Players need regular engagement
2. **Balance challenge and progress**: Not every puzzle should be hard
3. **Create meaningful choices**: Multiple paths increase replayability
4. **Consider player energy**: Don't cluster all difficult puzzles
5. **Enable social interaction**: Murder mysteries are social games

## Quick Reference

### Keyboard Shortcuts (in Player Journey)
- `Space`: Toggle between timeline and analysis view
- `F`: Fit graph to screen
- `+/-`: Zoom in/out

### Visual Indicators
- **Solid lines**: Direct dependencies
- **Dashed lines**: Optional connections
- **Red nodes**: Production issues
- **Yellow nodes**: Warnings
- **Green edges**: Verified dependencies

Remember: You're designing an experience, not just a puzzle sequence. Think about player emotion, energy, and engagement throughout their journey.

---
*Last Updated: 2025-06-30*