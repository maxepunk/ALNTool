# Day 8 Test Stability Investigation Summary

**Critical Finding**: Our test suite is causing system crashes due to memory leaks

## 🔴 Primary Issues Identified

1. **No afterEach cleanup** in test files
   - React components never unmount
   - Mock functions accumulate calls  
   - DOM nodes never garbage collected

2. **QueryClient memory leaks**
   - New instance created per test
   - Cache never cleared
   - Subscriptions persist

3. **Jest running tests in parallel**
   - No memory limits configured
   - Multiple workers consume all RAM
   - Coverage analysis adds massive overhead

4. **Heavy mock implementations**
   - Creating React elements without cleanup
   - Complex ReactFlow mocks persist
   - ResizeObserver accumulating instances

## ✅ Solutions Implemented

### 1. Created Cleanup Utilities
`src/test-utils/cleanup-utils.js` - Provides:
- `setupTestCleanup()` - Auto cleanup after each test
- `cleanupQueryClient()` - Clear React Query properly
- `logMemoryUsage()` - Monitor memory during tests

### 2. Fixed QueryClient Pattern
Updated `src/test-utils/test-utils.js`:
- Single global QueryClient instance
- Automatic cleanup before each test
- Proper disposal in afterAll

### 3. Updated Jest Configuration
`jest.config.cjs` now includes:
- `maxWorkers: 1` - Sequential execution
- `workerIdleMemoryLimit: '512MB'` - Memory cap
- `clearMocks: true` - Auto mock cleanup
- `testTimeout: 30000` - Prevent hanging tests

### 4. Added Safe Test Scripts
```json
"test:safe": "node --max-old-space-size=512 ./node_modules/.bin/jest --runInBand --no-coverage"
"test:memory": "node --expose-gc ./node_modules/.bin/jest --logHeapUsage --runInBand"
"test:stores": "jest --testPathPattern=stores --runInBand --no-coverage"
```

### 5. Created Fix Script
`scripts/fix-tests.sh` - Safe diagnostic approach

## 🚀 Next Steps

### Immediate (Must Do Now)

1. **Add cleanup to existing tests**:
```javascript
// Add to top of each test file:
import { setupTestCleanup } from '../test-utils/cleanup-utils';
import { cleanupQueryClient } from '../test-utils/test-utils';

setupTestCleanup();

afterAll(() => {
  cleanupQueryClient();
});
```

2. **Test incrementally**:
```bash
# Start with smallest tests
npm run test:stores

# If successful, try components
npm run test:components

# Monitor memory usage
npm run test:memory
```

3. **Fix any failing tests** due to cleanup changes

### Tomorrow

1. Profile specific problem tests
2. Optimize heavy mocks
3. Consider test splitting strategies
4. Implement CI memory limits

## ⚠️ What NOT to Do

- ❌ Don't run `npm test` without limits
- ❌ Don't enable coverage until stable
- ❌ Don't run tests in watch mode
- ❌ Don't parallelize until memory fixed

## 📊 Success Metrics

- All tests run without OOM
- Memory stays under 512MB
- No system crashes
- Can generate coverage safely

## 🎯 Root Cause

The perfect storm of:
- React Testing Library + 
- No cleanup + 
- Parallel execution + 
- Coverage instrumentation + 
- 74 tests = 
- **SYSTEM CRASH**

Our solutions address each factor systematically.