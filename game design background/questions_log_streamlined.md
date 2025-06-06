# Questions Log (Streamlined)

Post-creator interview status of key questions about "About Last Night" game design.

## Truly Open Questions

### Technical Implementation
- How are memory tokens encoded in Elements database schema?
- What prevents network hacking narratives with standalone devices?
- Where are tokens stored if not in Elements database?
- How do rollup properties work across databases?
- What prevents circular dependencies in database relationships?

### Gameplay Details
- Can players access Act 2 content early? What prevents this?
- What percentage of timeline events should be discovered?
- How do players embody characters with minimal starting info?
- What ensures critical evidence isn't missed?
- Do players retain character knowledge between acts?

### Production Specifics
- Exact multiplier values for memory groups?
- Specific purposes of rooms 3 & 4?
- What's in "No Players" zones and Craft Closet?
- How does Exit Door prevent early Act 2 discovery?
- Production pipeline for remaining 37-42 tokens?

### Design Philosophy
- How discoverable should Ephemeral Echo be?
- What creates optimal device sharing patterns?
- How do foil relationships manifest mechanically?
- Minimum puzzle completion for Act 1 success?

## Resolved Through Interview

### Victory Conditions ✓
- **Black Market**: Highest total when time ends (relative)
- **Detective**: Subjective case quality (30/25/25/20 rubric suggested)
- **Third Path**: Return memories to POV owners + reject authorities

### Physical Implementation ✓
- **Scanners**: 3 ESP32 devices with RFID
- **Room 2**: Marcus's secret lab
- **Detective Room**: Glass-windowed trap during Act 2
- **Token Turn-in**: Physical handover required

### Memory System ✓
- **Total Tokens**: 50-55 planned
- **MVP Set**: 30-35 viable
- **Distribution**: Lower tiers get more tokens
- **Groups**: Only Ephemeral Echo defined currently
- **Creation Priority**: Critical evidence + character coverage

### Design Philosophy ✓
- **Edge Cases**: Handled through facilitator discretion
- **Flexibility**: Intentional gaps for human judgment
- **Accessibility**: Creator welcomes all suggestions
- **Timeline**: Hidden from players by design
- **Lying**: Feature, not bug

## Partially Resolved

### Accessibility
- Framework suggested but not implemented
- Creator "open to all suggestions"
- Goal: "as accessible as possible"

### Memory Groups
- Ephemeral Echo complete (6 components)
- Other groups mentioned in files not recognized by creator
- Development needed for additional sets

### Facilitation
- Two-facilitator system confirmed
- Training priorities: lobby + Black Market
- Detective methodology to be developed through play

## Questions No Longer Relevant

- Memory corruption mechanic (deprecated - only time limit matters)
- Exact victory thresholds (intentionally flexible)
- Complete documentation expectation (gaps are features)
- Network requirements (intentionally standalone)

## Key Insight

Many "missing" answers represent intentional design flexibility. The game trusts human implementation over algorithmic prescription, embodying its Third Path philosophy in its very documentation.