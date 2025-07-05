#!/usr/bin/env node

/**
 * ALNTool Architecture Verification Script
 * 
 * Verifies the current frontend-backend data flow architecture is working correctly.
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function runCommand(command) {
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    return { success: true, output: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

function fileContains(filePath, searchString) {
  if (!fileExists(filePath)) return false;
  const content = fs.readFileSync(filePath, 'utf8');
  return content.includes(searchString);
}

// Current architecture checks
const checks = [
  {
    name: 'React Query hook exists',
    test: () => fileExists('storyforge/frontend/src/hooks/useJourney.js'),
    description: 'useJourney hook provides server state management'
  },
  {
    name: 'Zustand store is UI-only',
    test: () => {
      const storePath = 'storyforge/frontend/src/stores/journeyStore.js';
      return fileExists(storePath) && 
             fileContains(storePath, 'activeCharacterId') && 
             fileContains(storePath, 'selectedNode');
    },
    description: 'journeyStore manages only UI state'
  },
  {
    name: 'JourneyGraphView uses React Query',
    test: () => {
      const viewPath = 'storyforge/frontend/src/components/PlayerJourney/JourneyGraphView.jsx';
      return fileExists(viewPath) && fileContains(viewPath, 'useJourney');
    },
    description: 'Main component uses data fetching hook'
  },
  {
    name: 'API client is unified',
    test: () => {
      const apiPath = 'storyforge/frontend/src/services/api.js';
      return fileExists(apiPath) && 
             fileContains(apiPath, 'clearCache: async') &&
             fileContains(apiPath, 'cancelSync: async') &&
             fileContains(apiPath, 'getGameConstants: async');
    },
    description: 'All API endpoints available in unified client'
  },
  {
    name: 'Response wrapper middleware exists',
    test: () => fileExists('storyforge/backend/src/middleware/responseWrapper.js'),
    description: 'Backend has standardized response format'
  },
  {
    name: 'Console statements are clean',
    test: () => {
      const result = runCommand('npm run verify:console');
      return result.success;
    },
    description: 'No console.log statements in production code'
  },
  {
    name: 'Concurrent dev scripts available',
    test: () => {
      const packagePath = 'package.json';
      return fileExists(packagePath) && 
             fileContains(packagePath, '"dev": "concurrently') &&
             fileContains(packagePath, '"test:all"');
    },
    description: 'Root package.json has concurrent development scripts'
  }
];

// API endpoint tests (require servers running)
const apiTests = [
  {
    name: 'Cache management works',
    test: () => {
      const result = runCommand('curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/cache/clear');
      return result.success && (result.output.trim() === '200' || result.output.trim() === '201');
    },
    description: 'Cache clear endpoint responds correctly'
  },
  {
    name: 'Sync management works',
    test: () => {
      const result = runCommand('curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3001/api/sync/cancel');
      return result.success && (result.output.trim() === '200' || result.output.trim() === '201');
    },
    description: 'Sync cancel endpoint responds correctly'
  },
  {
    name: 'Error responses are standardized',
    test: () => {
      const result = runCommand('curl -s http://localhost:3001/api/characters/invalid-id | grep -q "\\"success\\":false"');
      return result.success;
    },
    description: 'Error responses follow standardized format'
  }
];

// Main verification function
async function runVerification() {
  log('\n🔍 ALNTool Architecture Verification\n', colors.blue);
  log('=' .repeat(40));

  let totalPassed = 0;
  let totalFailed = 0;

  // Run architecture checks
  log('\n📋 Architecture checks...\n', colors.yellow);
  
  for (const check of checks) {
    try {
      const passed = await check.test();
      if (passed) {
        log(`✅ ${check.name}`, colors.green);
        totalPassed++;
      } else {
        log(`❌ ${check.name}`, colors.red);
        log(`   ${check.description}`, colors.yellow);
        totalFailed++;
      }
    } catch (error) {
      log(`❌ ${check.name} - Error: ${error.message}`, colors.red);
      totalFailed++;
    }
  }

  // Check if backend is running for API tests
  log('\n📡 API endpoint tests...\n', colors.yellow);
  const backendRunning = runCommand('curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health').output?.trim() === '200';
  
  if (backendRunning) {
    for (const test of apiTests) {
      try {
        const passed = await test.test();
        if (passed) {
          log(`✅ ${test.name}`, colors.green);
          totalPassed++;
        } else {
          log(`❌ ${test.name}`, colors.red);
          log(`   ${test.description}`, colors.yellow);
          totalFailed++;
        }
      } catch (error) {
        log(`❌ ${test.name} - Error: ${error.message}`, colors.red);
        totalFailed++;
      }
    }
  } else {
    log('⚠️  Backend not running - skipping API tests', colors.yellow);
    log('   Start with: npm run dev', colors.yellow);
  }

  // Summary
  log('\n' + '=' .repeat(40));
  log('\n📊 Summary:', colors.blue);
  log(`   Total checks: ${totalPassed + totalFailed}`);
  log(`   ✅ Passed: ${totalPassed}`, colors.green);
  log(`   ❌ Failed: ${totalFailed}`, colors.red);
  
  if (totalFailed === 0) {
    log('\n🎉 Architecture verification complete!', colors.green);
    process.exit(0);
  } else {
    log('\n⚠️  Some checks failed. Please review and fix.', colors.red);
    process.exit(1);
  }
}

// Run the verification
runVerification().catch(error => {
  log(`\n❌ Verification error: ${error.message}`, colors.red);
  process.exit(1);
});