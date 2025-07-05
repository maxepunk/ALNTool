# Test Suite Stability Analysis & Solutions

**Date**: January 13, 2025  
**Critical Issue**: Test suite causing OOM (Out of Memory) system crashes  
**Impact**: Cannot safely run tests or coverage analysis  

## 🔍 Root Cause Analysis

### 1. Missing Test Cleanup (CRITICAL)
**Finding**: No `afterEach` cleanup in our new test files!

```javascript
// MISSING in JourneyIntelligenceView.test.jsx and all intelligence layer tests:
afterEach(() => {
  cleanup(); // React Testing Library cleanup
  jest.clearAllMocks(); // Clear mock state
  queryClient.clear(); // Clear React Query cache
});
```

**Impact**: 
- React components remain mounted between tests
- Mock calls accumulate (74 tests × multiple mocks = thousands of stored calls)
- React Query cache grows unbounded
- DOM nodes never garbage collected

### 2. QueryClient Memory Leak
**Finding**: Creating new QueryClient per test without cleanup

```javascript
// Current pattern (LEAKS):
export function renderWithQuery(ui, options = {}) {
  const { queryClient = createTestQueryClient(), ...renderOptions } = options;
  // QueryClient never explicitly cleared!
}
```

**Impact**: Each test creates a new QueryClient with its own cache, subscriptions, and mutation observers

### 3. Jest Configuration Issues
**Finding**: No memory limits or worker configuration

```javascript
// jest.config.cjs is missing:
maxWorkers: 1,  // Run tests sequentially
workerIdleMemoryLimit: '512MB',  // Restart workers when memory exceeds
```

**Impact**: Jest runs all tests in parallel, multiplying memory usage

### 4. Coverage Instrumentation Overhead
**Finding**: Coverage analysis with React components is extremely memory-intensive

```bash
# This command killed the system:
npm test -- --coverage
```

**Impact**: 
- Every line of code gets instrumented
- React components render multiple times per test
- Coverage data for 74 tests × multiple renders × all code paths = GB of memory

### 5. Heavy Mock Implementations
**Finding**: Complex mocks without cleanup

```javascript
// Intelligence layer mocks create React elements:
jest.mock('../JourneyIntelligence/EconomicLayer', () => ({
  default: ({ nodes }) => {
    const React = require('react');
    // Creates new React elements on every call
    return React.createElement('div', { 'data-testid': 'economic-overlay' });
  }
}));
```

**Impact**: Mock implementations accumulate React elements in memory

### 6. ReactFlow Not Being Disposed
**Finding**: ReactFlow instances not cleaned up

```javascript
// Mock doesn't clean up:
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));
```

**Impact**: ReactFlow creates complex internal state that isn't garbage collected

## 🛠️ Immediate Solutions (Safe to Implement)

### 1. Add Test Cleanup (Priority 1)
Create a shared cleanup utility:

```javascript
// src/test-utils/cleanup-utils.js
import { cleanup } from '@testing-library/react';

export function setupTestCleanup() {
  afterEach(() => {
    // Clean up React components
    cleanup();
    
    // Clear all mocks
    jest.clearAllMocks();
    jest.restoreAllMocks();
    
    // Clear timers
    jest.clearAllTimers();
  });
  
  // Also clean up after all tests
  afterAll(() => {
    cleanup();
    jest.resetModules();
  });
}
```

### 2. Fix QueryClient Cleanup (Priority 1)
Update test utils:

```javascript
// src/test-utils/test-utils.js
let globalQueryClient;

export function renderWithQuery(ui, options = {}) {
  // Reuse single QueryClient per test file
  if (!globalQueryClient) {
    globalQueryClient = createTestQueryClient();
  }
  
  // Clear before each test
  globalQueryClient.clear();
  globalQueryClient.cancelQueries();
  
  return {
    ...render(ui, { wrapper: createQueryWrapper(globalQueryClient), ...options }),
    queryClient: globalQueryClient,
  };
}

// Add cleanup function
export function cleanupQueryClient() {
  if (globalQueryClient) {
    globalQueryClient.clear();
    globalQueryClient.cancelQueries();
    globalQueryClient = null;
  }
}
```

### 3. Update Jest Configuration (Priority 2)
```javascript
// jest.config.cjs
module.exports = {
  // ... existing config
  
  // Memory management
  maxWorkers: 1,  // Sequential execution
  workerIdleMemoryLimit: '512MB',  // Restart worker if memory exceeds
  
  // Garbage collection
  globals: {
    'ts-jest': {
      isolatedModules: true,  // Faster, less memory
    },
  },
  
  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
  resetMocks: true,
  
  // Smaller test timeout
  testTimeout: 30000,  // 30 seconds max per test
};
```

### 4. Safe Test Commands (Priority 1)
Add to package.json:

```json
{
  "scripts": {
    "test:safe": "node --max-old-space-size=512 ./node_modules/.bin/jest --runInBand --no-coverage",
    "test:single": "node --max-old-space-size=512 ./node_modules/.bin/jest --runInBand --no-coverage --testNamePattern",
    "test:debug": "node --inspect-brk --max-old-space-size=512 ./node_modules/.bin/jest --runInBand --no-coverage",
    "test:memory": "node --expose-gc ./node_modules/.bin/jest --logHeapUsage --runInBand"
  }
}
```

### 5. Split Test Suites (Priority 3)
Create separate test commands:

```json
{
  "scripts": {
    "test:stores": "jest --testPathPattern=stores --runInBand",
    "test:components": "jest --testPathPattern=components --runInBand",
    "test:layers": "jest --testPathPattern=JourneyIntelligence --runInBand",
    "test:hooks": "jest --testPathPattern=hooks --runInBand"
  }
}
```

## 🔬 Safe Investigation Protocol

### Step 1: Measure Current Memory Usage
```bash
# Check single test file memory
node --expose-gc --max-old-space-size=512 \
  ./node_modules/.bin/jest \
  --logHeapUsage \
  --runInBand \
  src/stores/__tests__/journeyIntelligenceStore.test.js
```

### Step 2: Add Cleanup Incrementally
1. Start with store tests (smallest)
2. Add cleanup utilities
3. Run and measure memory
4. Move to component tests
5. Finally tackle intelligence layers

### Step 3: Monitor Memory During Tests
```javascript
// Add to problematic tests:
beforeEach(() => {
  if (global.gc) global.gc();
  const usage = process.memoryUsage();
  console.log(`Heap: ${Math.round(usage.heapUsed / 1024 / 1024)}MB`);
});
```

### Step 4: Identify Specific Leaks
```bash
# Run with heap snapshots
node --expose-gc --max-old-space-size=512 \
  ./node_modules/.bin/jest \
  --detectLeaks \
  --runInBand \
  path/to/specific/test.js
```

## 🚨 What NOT to Do

1. **DON'T** run `npm test` without memory limits
2. **DON'T** run coverage until cleanup is implemented
3. **DON'T** run all tests in parallel
4. **DON'T** use `--watch` mode until stable
5. **DON'T** ignore heap warnings

## 📋 Implementation Plan

### Phase 1: Immediate Stabilization (Today)
1. [ ] Add cleanup to all test files
2. [ ] Update jest.config.cjs with memory limits
3. [ ] Create safe test commands
4. [ ] Test with single files first

### Phase 2: Memory Optimization (Tomorrow)
1. [ ] Implement QueryClient reuse pattern
2. [ ] Optimize mock implementations
3. [ ] Add memory monitoring
4. [ ] Profile specific problem tests

### Phase 3: Coverage Recovery (After Stable)
1. [ ] Run coverage on single files
2. [ ] Use `--collectCoverageFrom` for specific paths
3. [ ] Consider alternative coverage tools
4. [ ] Set up CI with memory limits

## 🎯 Success Criteria

1. Can run all tests without OOM
2. Memory usage stays under 512MB
3. Tests complete in <60 seconds
4. Coverage can be generated safely
5. CI/CD pipeline remains stable

## 🔧 Quick Fix Script

```bash
#!/bin/bash
# save as fix-tests.sh

echo "🧹 Cleaning up test environment..."

# Clear Jest cache
npx jest --clearCache

# Clear node_modules/.cache
rm -rf node_modules/.cache

# Run single test file with monitoring
echo "🧪 Testing single file with memory monitoring..."
node --expose-gc --max-old-space-size=512 \
  ./node_modules/.bin/jest \
  --logHeapUsage \
  --runInBand \
  --no-coverage \
  src/stores/__tests__/journeyIntelligenceStore.test.js

echo "✅ If this succeeded, we can proceed with cleanup implementation"
```

---

*"The best code is no code, but the best test is one that doesn't crash your system."*  
— Hard-learned wisdom