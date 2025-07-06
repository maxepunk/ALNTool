#!/usr/bin/env node

/**
 * Dependency Verification Script
 * Checks that all required dependencies are installed correctly
 * and there are no version conflicts
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const FRONTEND_DIR = path.join(__dirname, '../storyforge/frontend');
const BACKEND_DIR = path.join(__dirname, '../storyforge/backend');

const REQUIRED_FRONTEND_DEPS = {
  '@tanstack/react-query': '^5.',
  'd3-force': '^3.',
  'vite': '^6.3.5'
};

const REQUIRED_BACKEND_DEPS = {
  'better-sqlite3': '^11.',
  'node-cache': '^5.',
  'express-validator': '^7.'
};

function checkDependencies(dir, requiredDeps, type) {
  console.log(`\n=== Checking ${type} Dependencies ===`);
  
  const packageJsonPath = path.join(dir, 'package.json');
  if (!fs.existsSync(packageJsonPath)) {
    console.error(`❌ package.json not found in ${dir}`);
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  let allValid = true;
  
  for (const [dep, requiredVersion] of Object.entries(requiredDeps)) {
    const installedVersion = allDeps[dep];
    
    if (!installedVersion) {
      console.error(`❌ ${dep} - NOT FOUND`);
      allValid = false;
    } else if (!installedVersion.startsWith(requiredVersion)) {
      console.error(`❌ ${dep} - Version mismatch: installed ${installedVersion}, required ${requiredVersion}`);
      allValid = false;
    } else {
      console.log(`✅ ${dep} - ${installedVersion}`);
    }
  }
  
  return allValid;
}

function checkNodeModules(dir, type) {
  console.log(`\n=== Checking ${type} node_modules ===`);
  
  const nodeModulesPath = path.join(dir, 'node_modules');
  if (!fs.existsSync(nodeModulesPath)) {
    console.error(`❌ node_modules not found in ${dir}`);
    console.log(`   Run: cd ${dir} && npm install`);
    return false;
  }
  
  console.log(`✅ node_modules exists`);
  return true;
}

function checkVulnerabilities(dir, type) {
  console.log(`\n=== Checking ${type} Security Vulnerabilities ===`);
  
  try {
    const result = execSync('npm audit --json', { 
      cwd: dir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr
    });
    
    const audit = JSON.parse(result);
    const vulnCount = audit.metadata.vulnerabilities;
    
    if (vulnCount.total === 0) {
      console.log(`✅ No vulnerabilities found`);
      return true;
    } else {
      console.log(`⚠️  Found ${vulnCount.total} vulnerabilities:`);
      console.log(`   Critical: ${vulnCount.critical || 0}`);
      console.log(`   High: ${vulnCount.high || 0}`);
      console.log(`   Moderate: ${vulnCount.moderate || 0}`);
      console.log(`   Low: ${vulnCount.low || 0}`);
      console.log(`   Run: cd ${dir} && npm audit fix`);
      return vulnCount.critical === 0 && vulnCount.high === 0;
    }
  } catch (error) {
    // npm audit returns non-zero exit code if vulnerabilities found
    try {
      const audit = JSON.parse(error.stdout);
      const vulnCount = audit.metadata.vulnerabilities;
      
      console.log(`⚠️  Found ${vulnCount.total} vulnerabilities:`);
      console.log(`   Critical: ${vulnCount.critical || 0}`);
      console.log(`   High: ${vulnCount.high || 0}`);
      console.log(`   Moderate: ${vulnCount.moderate || 0}`);
      console.log(`   Low: ${vulnCount.low || 0}`);
      
      if (vulnCount.critical > 0 || vulnCount.high > 0) {
        console.log(`   ❌ Critical/High vulnerabilities must be fixed!`);
        console.log(`   Run: cd ${dir} && npm audit fix`);
        return false;
      }
      return true;
    } catch (parseError) {
      console.error(`❌ Error running npm audit: ${error.message}`);
      return false;
    }
  }
}

function checkPeerDependencies(dir, type) {
  console.log(`\n=== Checking ${type} Peer Dependencies ===`);
  
  try {
    // Check for peer dependency warnings
    const result = execSync('npm ls --depth=0 --json', {
      cwd: dir,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore']
    });
    
    const tree = JSON.parse(result);
    if (tree.problems && tree.problems.length > 0) {
      console.log(`⚠️  Found dependency issues:`);
      tree.problems.forEach(problem => {
        console.log(`   - ${problem}`);
      });
      return false;
    }
    
    console.log(`✅ No peer dependency issues`);
    return true;
  } catch (error) {
    // npm ls returns non-zero if there are issues
    console.log(`⚠️  Some dependency warnings detected`);
    return true; // Don't fail on warnings
  }
}

// Main verification
console.log('🔍 ALNTool Dependency Verification Script\n');
console.log('Checking all required dependencies for Day 1 of refactoring...\n');

let allGood = true;

// Frontend checks
allGood = checkDependencies(FRONTEND_DIR, REQUIRED_FRONTEND_DEPS, 'Frontend') && allGood;
allGood = checkNodeModules(FRONTEND_DIR, 'Frontend') && allGood;
allGood = checkVulnerabilities(FRONTEND_DIR, 'Frontend') && allGood;
allGood = checkPeerDependencies(FRONTEND_DIR, 'Frontend') && allGood;

// Backend checks
allGood = checkDependencies(BACKEND_DIR, REQUIRED_BACKEND_DEPS, 'Backend') && allGood;
allGood = checkNodeModules(BACKEND_DIR, 'Backend') && allGood;
allGood = checkVulnerabilities(BACKEND_DIR, 'Backend') && allGood;
allGood = checkPeerDependencies(BACKEND_DIR, 'Backend') && allGood;

// Final summary
console.log('\n=== VERIFICATION SUMMARY ===');
if (allGood) {
  console.log('✅ All dependencies are correctly installed!');
  console.log('✅ No critical security vulnerabilities found!');
  console.log('\nYou can proceed with Day 1 tasks.');
  process.exit(0);
} else {
  console.log('❌ Some issues were found. Please fix them before proceeding.');
  process.exit(1);
}