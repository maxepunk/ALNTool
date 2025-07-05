#!/usr/bin/env node

/**
 * Documentation Verification Script
 * Checks that documentation claims match actual code state
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

const isPreCommit = process.argv.includes('--pre-commit');

async function getActualMetrics() {
  const metrics = {
    testCoverage: 'Unknown',
    consoleLogs: 0,
    errorBoundaries: 0,
    largestComponent: 0,
    largestComponentName: '',
    reactQueryVersion: 'Unknown'
  };

  try {
    // Get console log count
    const consoleCount = execSync(
      "grep -r 'console\\.' --include='*.js' --include='*.jsx' --exclude-dir=node_modules --exclude-dir=__tests__ --exclude-dir=coverage storyforge/ | wc -l",
      { encoding: 'utf8' }
    ).trim();
    metrics.consoleLogs = parseInt(consoleCount) || 0;

    // Check for error boundaries
    const errorBoundaryCount = execSync(
      "grep -r 'ErrorBoundary' --include='*.jsx' --include='*.js' --exclude-dir=node_modules storyforge/frontend/src/ | grep -E 'import.*ErrorBoundary|<ErrorBoundary' | wc -l",
      { encoding: 'utf8' }
    ).trim();
    metrics.errorBoundaries = parseInt(errorBoundaryCount) || 0;

    // Find largest component
    const jsxFiles = execSync(
      "find storyforge/frontend/src -name '*.jsx' -not -path '*/node_modules/*' | head -50",
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    for (const file of jsxFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        const lineCount = content.split('\n').length;
        if (lineCount > metrics.largestComponent) {
          metrics.largestComponent = lineCount;
          metrics.largestComponentName = path.basename(file);
        }
      } catch (e) {
        // Skip files that can't be read
      }
    }

    // Check React Query version
    try {
      const packageJson = JSON.parse(
        await fs.readFile('storyforge/frontend/package.json', 'utf8')
      );
      const rqVersion = packageJson.dependencies['@tanstack/react-query'];
      metrics.reactQueryVersion = rqVersion ? 'v4' : 'v3';
    } catch (e) {
      // Keep as Unknown
    }

  } catch (error) {
    console.error(`${YELLOW}Warning: Could not get all metrics${RESET}`);
  }

  return metrics;
}

async function checkDocumentationClaims() {
  const issues = [];
  
  // Read README.md
  const readmePath = path.join(__dirname, '..', 'README.md');
  const readmeContent = await fs.readFile(readmePath, 'utf8');
  
  // Check for false claims
  const falseClaimPatterns = [
    { pattern: /Final Mile/i, message: 'Contains "Final Mile" references' },
    { pattern: /Phase 4\+/i, message: 'Contains "Phase 4+" references' },
    { pattern: /test coverage[:\s]+63\.68%/i, message: 'Claims false test coverage of 63.68%' },
    { pattern: /VERIFIED: 2025-/i, message: 'Contains future-dated verification timestamps' }
  ];

  for (const { pattern, message } of falseClaimPatterns) {
    if (pattern.test(readmeContent)) {
      issues.push(`README.md: ${message}`);
    }
  }

  // Check actual metrics vs documented
  const actualMetrics = await getActualMetrics();
  
  // Extract documented metrics from README
  const metricsMatch = readmeContent.match(/\| Console Logs.*?\| (\d+) \|/);
  if (metricsMatch) {
    const documentedConsoleLogs = parseInt(metricsMatch[1]);
    if (documentedConsoleLogs !== actualMetrics.consoleLogs) {
      issues.push(`README.md: Claims ${documentedConsoleLogs} console logs but found ${actualMetrics.consoleLogs}`);
    }
  }


  return { issues, actualMetrics };
}

async function main() {
  console.log('📊 Verifying documentation accuracy...\n');
  
  try {
    const { issues, actualMetrics } = await checkDocumentationClaims();
    
    if (issues.length === 0) {
      console.log(`${GREEN}✅ All documentation claims are accurate!${RESET}\n`);
      
      console.log('Actual Metrics:');
      console.log(`- Console Logs: ${actualMetrics.consoleLogs}`);
      console.log(`- Error Boundaries: ${actualMetrics.errorBoundaries}`);
      console.log(`- Largest Component: ${actualMetrics.largestComponentName} (${actualMetrics.largestComponent} lines)`);
      console.log(`- React Query: ${actualMetrics.reactQueryVersion}`);
      
      process.exit(0);
    } else {
      console.log(`${RED}❌ Found documentation issues:${RESET}\n`);
      
      issues.forEach(issue => {
        console.log(`  - ${issue}`);
      });
      
      console.log(`\n${YELLOW}Please fix these issues before committing.${RESET}`);
      
      if (isPreCommit) {
        process.exit(1);
      }
    }
  } catch (error) {
    console.error(`${RED}Error verifying documentation:${RESET}`, error.message);
    process.exit(1);
  }
}

main();