# ALNTool Quick Reference

## Common Tasks

### View a Character's Journey
```
Player Journey → Select Character → View Graph
```

### Find Production Issues
```
Dashboard → Check Alert Cards → Click to Detail
```

### Check Memory Balance
```
Memory Economy → Find Character → Review Token Flow
```

### Filter Puzzle List
```
Puzzles → Use Filter Panel → Select Criteria
```

### View Element Dependencies
```
Elements → Click Element → Check "Used By" Section
```

## Navigation Shortcuts

| Page | Purpose | Key Info |
|------|---------|----------|
| **Dashboard** | System overview | Red alerts = urgent |
| **Player Journey** | Design workspace | Primary tool |
| **Characters** | Character list | Filter by path/act |
| **Puzzles** | All puzzles | Production status |
| **Elements** | Props/clues | Dependency tracking |
| **Memory Economy** | Token balance | Flow visualization |

## Visual Indicators

### Node Colors (Journey Graph)
- 🟢 **Green**: Puzzles
- 🔵 **Blue**: Elements/Props
- 🟣 **Purple**: Timeline Events
- 🔴 **Red**: Production Issues

### Status Badges
- ❌ **Red Badge**: Critical Issue
- ⚠️ **Yellow Badge**: Warning
- ✅ **Green Check**: Production Ready
- 🔍 **Magnifying Glass**: Needs Review

### Production Alerts
- **Missing Dependencies**: Required element not available
- **Bottleneck**: Critical path with no alternatives
- **Memory Shortage**: Insufficient tokens to progress
- **Social Isolation**: Character alone too long

## Filter Options

### Character Filters
- **Path**: Black Market, Detective, Third Path
- **Act**: Act 1, Act 2, Act 3
- **Status**: Active, Needs Review

### Puzzle Filters
- **Type**: Logic, Social, Physical, Discovery
- **Production**: Ready, Has Issues, Not Started
- **Complexity**: Low, Medium, High

### Timeline Filters
- **Act**: Act 1, Act 2, Act 3
- **Type**: Story, Mechanic, Social

## Data Relationships

```
Character → has many → Puzzles
Puzzle → requires → Elements
Puzzle → grants/costs → Memory Tokens
Timeline Event → triggers → Story Moments
Element → belongs to → Location
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Graph won't load | Refresh page, check character selection |
| Missing data | Backend sync may be needed |
| Slow performance | Normal for 80+ node journeys |
| Can't find puzzle | Use search in Puzzles page |
| Token math wrong | Check Memory Economy calculations |

## Production Checklist

Before marking a puzzle "Ready":
- [ ] All required elements assigned
- [ ] Dependencies are completable
- [ ] Memory token cost is reasonable
- [ ] Physical location is accessible
- [ ] Props are producible/available

## Quick Metrics

### Good Journey Metrics
- **Puzzle spacing**: 10-20 minutes apart
- **Token balance**: Never negative
- **Social interaction**: Every 30-45 minutes
- **Dead ends**: Zero
- **Bottlenecks**: Maximum 1-2 per act

### Warning Signs
- 🚨 Gap > 30 minutes
- 🚨 Token deficit > 5
- 🚨 3+ bottlenecks in sequence
- 🚨 No social interaction in act
- 🚨 Circular dependencies

## Memory Token Guidelines

### Collection Rates
- **Easy Puzzle**: 1-2 tokens
- **Medium Puzzle**: 2-3 tokens
- **Hard Puzzle**: 3-5 tokens
- **Major Discovery**: 5+ tokens

### Spending Costs
- **Hint**: 1 token
- **Bypass**: 3-5 tokens
- **Major Unlock**: 5-10 tokens
- **Act Transition**: 10+ tokens

## Path Characteristics

### Black Market
- Focus: Resources & negotiation
- Token Rate: High collection, high spending
- Social: Deal-making interactions

### Detective
- Focus: Investigation & deduction
- Token Rate: Steady collection, moderate spending
- Social: Information gathering

### Third Path
- Focus: Balance & diplomacy
- Token Rate: Moderate collection, flexible spending
- Social: Mediation interactions

## Best Practices

1. **Always start at Dashboard** - Check system health
2. **Design in Player Journey** - See player perspective
3. **Validate in specific pages** - Deep dive when needed
4. **Use filters liberally** - Focus on what matters
5. **Trust the alerts** - They catch real issues

## Report Issues

Found a bug or need help?
- GitHub: https://github.com/anthropics/claude-code/issues
- Include: Page, action, error message

---
*Quick Reference v1.0 - Updated 2025-06-30*