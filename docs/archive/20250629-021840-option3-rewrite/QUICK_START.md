# Quick Start - 30 Minute Crash Course

## 🚀 Your First 30 Minutes

### Minute 0-5: Verify System State
```bash
# Start servers
cd storyforge/backend && npm run dev  # Terminal 1
cd ../frontend && npm run dev         # Terminal 2

# Check health
cd storyforge/frontend
npm run test:architecture

# Expected output:
# Console logs: 96 (bad - needs fixing)
# Error boundaries: 0 (critical - must fix)
# Largest components: 1065 lines (needs refactoring)
```

### Minute 5-10: Review Critical Issues
Open these files to understand the problems:
1. **SESSION_HANDOFF.md** - What happened last session
2. **ARCHITECTURE_REMEDIATION_PLAN.md** - How to fix issues
3. **.claude/architecture-state.json** - Current metrics

Key findings:
- App works but is fragile (no error boundaries)
- 96 console.logs expose internal state
- God components make maintenance hard
- Phase 4+ features exist but are hidden

### Minute 10-20: Quick Win #1 - Error Boundaries
```bash
# Create error boundary (prevents app crashes)
cat > src/components/ErrorBoundary.jsx << 'EOF'
import React from 'react';
import { Box, Typography, Button } from '@mui/material';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Something went wrong
          </Typography>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
EOF

# Wrap App.jsx
# Add: import ErrorBoundary from './components/ErrorBoundary';
# Wrap: <ErrorBoundary><App /></ErrorBoundary>
```

### Minute 20-25: Quick Win #2 - Production Logger
```bash
# Create logger utility
cat > src/utils/logger.js << 'EOF'
const isDev = import.meta.env.DEV;

export const logger = {
  debug: (...args) => isDev && console.log('[DEBUG]', ...args),
  info: (...args) => isDev && console.info('[INFO]', ...args),
  warn: (...args) => isDev && console.warn('[WARN]', ...args),
  error: (...args) => {
    if (isDev) console.error('[ERROR]', ...args);
    // In production, send to monitoring service
  }
};

export default logger;
EOF

# Quick test replacement (do full replacement later)
sed -i 's/console\.log(/logger.debug(/g' src/pages/Dashboard.jsx
sed -i '1i import logger from "../utils/logger";' src/pages/Dashboard.jsx
```

### Minute 25-30: Verify Improvements
```bash
# Check if error boundary works
# Add to any component: throw new Error('test');
# App should show error UI instead of white screen

# Check logger works
# Look for [DEBUG] prefix in console

# Review what's next
cat SESSION_HANDOFF.md | grep "Hour"
```

## 🎯 Immediate Priorities After 30 Minutes

### Priority 1: Complete Error Boundary Implementation (1 hour)
- Wrap all pages with error boundaries
- Add route-level boundaries
- Test with intentional errors

### Priority 2: Remove All Console Logs (1 hour)
```bash
# Full replacement script
find src -name "*.jsx" -o -name "*.js" | while read file; do
  if ! grep -q "import.*logger" "$file" && grep -q "console\." "$file"; then
    sed -i '1i import logger from "../utils/logger";' "$file"
  fi
  sed -i 's/console\.log(/logger.debug(/g' "$file"
  sed -i 's/console\.error(/logger.error(/g' "$file"
  sed -i 's/console\.warn(/logger.warn(/g' "$file"
done

# Verify
npm run lint:console  # Should be 0
```

### Priority 3: Fix Player Journey (2 hours)
- Debug journeyEngine.js:145-267
- Add error boundary to PlayerJourneyPage
- Write E2E test for journey visualization

## 🔑 Key Commands Reference

```bash
# Architecture health checks
npm run test:architecture      # Run all checks
npm run lint:console          # Count console statements
npm run analyze:components    # Find god components
npm run check:error-boundaries # Count error boundaries
npm run check:hardcoded       # Find hardcoded values

# Development
npm run dev                   # Start dev server
npm test                      # Run unit tests
npm run build                 # Production build

# Quick navigation
cd storyforge/frontend/src
ls pages/                     # All page components
ls components/                # Reusable components
ls services/                  # API integration
```

## 📁 Critical Files to Know

```
src/
├── pages/
│   ├── NarrativeThreadTrackerPage.jsx  # 1,065 lines (god component)
│   ├── Dashboard.jsx                   # Fixed hooks order
│   └── PlayerJourneyPage.jsx          # Needs journey fix
├── services/
│   ├── api.js                         # API client
│   └── journeyEngine.js               # Graph generation (broken)
├── config/
│   └── GameConstants.js               # All business rules
└── main.jsx                           # App entry point
```

## ⚡ Speed Tips

1. **Use multiple terminals** - Backend, frontend, and commands
2. **Keep docs open** - SESSION_HANDOFF.md + ARCHITECTURE_REMEDIATION_PLAN.md
3. **Test incrementally** - Don't batch changes
4. **Use Git liberally** - Commit after each successful fix
5. **Monitor metrics** - Run npm run test:architecture frequently

## 🚨 If Things Go Wrong

```bash
# Frontend won't start
kill -9 $(lsof -t -i:3004)  # Kill stuck process
rm -rf node_modules/.vite    # Clear Vite cache
npm run dev                  # Restart

# Tests failing
npm test -- --no-cache       # Clear Jest cache
npm test Dashboard.test      # Test single file

# Build errors
npm run build               # Check for compilation errors
grep -r "queryFn:" src/     # Find malformed queries

# Lost?
cat SESSION_HANDOFF.md      # Review what happened
cat .claude/architecture-state.json  # Check metrics
npm run test:architecture   # Current health
```

## ✅ Success Checklist

After 30 minutes you should have:
- [ ] Servers running (frontend + backend)
- [ ] Architecture health checked
- [ ] Error boundary component created
- [ ] Production logger utility created
- [ ] At least one console.log replaced
- [ ] Understanding of next priorities

Remember: The goal is stabilization, not perfection. Error boundaries first!