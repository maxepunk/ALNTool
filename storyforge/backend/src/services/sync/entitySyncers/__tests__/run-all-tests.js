#!/usr/bin/env node

/**
 * Test runner for all entity syncers
 * Run this script to verify all syncers are working correctly
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🧪 Running tests for all entity syncers...\n');

const testFiles = [
  'CharacterSyncer.test.js',
  'ElementSyncer.test.js',
  'PuzzleSyncer.test.js',
  'TimelineEventSyncer.test.js'
];

let allTestsPassed = true;

for (const testFile of testFiles) {
  console.log(`\n📋 Running tests for ${testFile}...`);
  console.log('━'.repeat(50));
  
  try {
    execSync(`npm test -- --testPathPattern="${testFile}"`, {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..', '..', '..', '..')  // Navigate to backend root
    });
    console.log(`✅ ${testFile} - All tests passed!`);
  } catch (error) {
    console.error(`❌ ${testFile} - Tests failed!`);
    allTestsPassed = false;
  }
}

console.log('\n' + '═'.repeat(50));
if (allTestsPassed) {
  console.log('🎉 All syncer tests passed successfully!');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Please check the output above.');
  process.exit(1);
}
