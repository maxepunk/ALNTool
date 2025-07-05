#!/usr/bin/env node

/**
 * Script to run all tests and generate comprehensive coverage report
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Running all tests with coverage...\n');

try {
  // Run all tests with coverage
  execSync('npm test -- --coverage --coverageReporters=text --coverageReporters=lcov --coverageReporters=html', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'test' }
  });

  // Read coverage summary
  const coveragePath = path.join(__dirname, '..', 'coverage', 'coverage-summary.json');
  if (fs.existsSync(coveragePath)) {
    const coverage = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    const total = coverage.total;
    
    console.log('\n📊 Coverage Summary:');
    console.log('═══════════════════');
    console.log(`Statements: ${total.statements.pct}%`);
    console.log(`Branches:   ${total.branches.pct}%`);
    console.log(`Functions:  ${total.functions.pct}%`);
    console.log(`Lines:      ${total.lines.pct}%`);
    console.log('\n📁 Coverage report available at: coverage/lcov-report/index.html');
  }

} catch (error) {
  console.error('❌ Error running tests:', error.message);
  process.exit(1);
}