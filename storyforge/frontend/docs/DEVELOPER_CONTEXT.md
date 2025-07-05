# ALNTool Developer Context

## What This Tool Actually Is

ALNTool (About Last Night Production Intelligence Tool) is an **internal production tool** for designing an immersive murder mystery game. It's crucial to understand the actual scale and usage:

- **Users**: 2-3 game designers (not public-facing)
- **Total Database Size**: ~500 items across ALL tables combined
- **Usage Pattern**: Occasional design sessions, not continuous high-traffic use

## Realistic Data Scale

### Per Character Journey
- **Typical**: 10-30 nodes (puzzles + elements + timeline events)
- **Maximum**: ~80 nodes (extreme edge case)
- **Not**: 100s or 1000s of nodes

### Total Game Scale
- Characters: ~10-20 core characters
- Puzzles: ~50-100 total
- Elements: ~100-200 total
- Timeline Events: ~50-100 total
- **Total**: ~500 items maximum

## Common Misconceptions

### "31 Console.log Statements"
- **Reality**: This count included the logger.js utility itself
- **Actual**: 0 console.log statements in production code
- **Status**: ✅ Already using production logger

### "Only 15 Error Boundaries"
- **Reality**: This was counting test files
- **Actual**: 79 error boundaries in production code
- **Status**: ✅ Exceeds target of 25+

### "Need to Handle 100+ Nodes Smoothly"
- **Reality**: Maximum realistic scenario is ~80 nodes
- **Actual**: Component already refactored from 445→218 lines
- **Status**: Performance likely sufficient for internal tool scale

## Performance Expectations

This is NOT a public web app that needs to handle:
- Thousands of concurrent users
- Massive datasets
- Sub-second response times at scale

This IS an internal tool that needs to:
- Work well for 2-3 designers
- Handle graphs of 10-80 nodes
- Load in a reasonable time (<2-3 seconds)
- Not crash or freeze

## Development Philosophy

1. **Pragmatic Over Perfect**: Optimize for the actual use case
2. **Internal Tool Standards**: Different from public app requirements
3. **Small Dataset Reality**: 500 total items is tiny by modern standards
4. **Focus on Stability**: Better to work reliably than be blazing fast

## Testing Approach

- **Unit Tests**: Comprehensive coverage (600+ tests)
- **Integration Tests**: Key workflows covered
- **E2E Tests**: Infrastructure issues, but app works in practice
- **Manual Testing**: Often sufficient for internal tools

## Why This Context Matters

When you see requirements like:
- "Handle 100+ nodes smoothly"
- "Zero console.log statements"
- "25+ error boundaries"

Remember these were set when the codebase was in a different state. The tool has been significantly improved and now exceeds most targets for an internal production tool of this scale.

---
*Last Updated: 2025-06-30*