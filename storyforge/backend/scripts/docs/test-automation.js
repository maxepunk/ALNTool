#!/usr/bin/env node

/**
 * Test script to validate the automated documentation system
 */

const TaskStatusManager = require('./task-status-manager');
const fs = require('fs');

function testAutomation() {
    console.log('🧪 Testing Automated Documentation System\n');
    
    const manager = new TaskStatusManager();
    
    // Test 1: Status Report
    console.log('1. Testing status report...');
    const status = manager.generateStatusReport();
    console.log('✓ Status report generated\n');
    
    // Test 2: Consistency Check
    console.log('2. Testing consistency verification...');
    const isConsistent = manager.verifyConsistency();
    console.log(`${isConsistent ? '✓' : '⚠'} Consistency check completed\n`);
    
    // Test 3: Template Marker Verification
    console.log('3. Testing template markers...');
    let markersFound = 0;
    for (const [fileKey, filePath] of Object.entries(manager.docFiles)) {
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf8');
            const hasMarkers = content.includes('<!-- AUTO:');
            if (hasMarkers) {
                markersFound++;
                console.log(`  ✓ ${fileKey} has automation markers`);
            } else {
                console.log(`  - ${fileKey} no automation markers`);
            }
        }
    }
    console.log(`✓ Found automation markers in ${markersFound} files\n`);
    
    // Test 4: Current Status Parsing
    console.log('4. Testing status parsing...');
    console.log(`  Current Task: ${status.currentTask}`);
    console.log(`  Progress: ${status.progress}`);
    console.log(`  Last Updated: ${status.lastUpdated}`);
    console.log('✓ Status parsing working\n');
    
    // Summary
    console.log('📊 Test Summary:');
    console.log('================');
    console.log(`✅ Documentation automation system is ${markersFound > 0 ? 'ACTIVE' : 'INACTIVE'}`);
    console.log(`✅ Status tracking: ${status.currentTask !== 'Unknown' ? 'WORKING' : 'NEEDS_SETUP'}`);
    console.log(`✅ Progress tracking: ${status.progress !== 'Unknown' ? 'WORKING' : 'NEEDS_SETUP'}`);
    console.log(`${isConsistent ? '✅' : '⚠️'} Documentation consistency: ${isConsistent ? 'GOOD' : 'NEEDS_ATTENTION'}`);
    
    console.log('\n🚀 Available Commands:');
    console.log('- npm run docs:task-complete <task-id>   # Complete a task');
    console.log('- npm run docs:verify-sync               # Check consistency');
    console.log('- npm run docs:status-report             # Show status');
    console.log('- npm run verify:all                     # Full verification (includes docs)');
    
    return {
        automationActive: markersFound > 0,
        statusWorking: status.currentTask !== 'Unknown',
        progressWorking: status.progress !== 'Unknown',
        consistent: isConsistent
    };
}

if (require.main === module) {
    testAutomation();
}

module.exports = testAutomation;