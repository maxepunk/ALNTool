#!/usr/bin/env node

/**
 * Simple documentation update utility
 * Usage: node update-docs.js <command> [args]
 */

const TaskStatusManager = require('./task-status-manager');

const manager = new TaskStatusManager();
const command = process.argv[2];

switch (command) {
    case 'task-complete':
        const taskId = process.argv[3];
        if (!taskId) {
            console.error('Usage: npm run docs:task-complete <task-id>');
            console.error('Example: npm run docs:task-complete P.DEBT.3.9');
            process.exit(1);
        }
        manager.completeTask(taskId, taskId);
        break;

    case 'verify-sync':
        console.log('🔍 Checking documentation consistency...');
        const isConsistent = manager.verifyConsistency();
        if (isConsistent) {
            console.log('✅ All documentation is consistent');
        } else {
            console.log('❌ Documentation inconsistencies found');
            process.exit(1);
        }
        break;

    case 'status-report':
        manager.generateStatusReport();
        break;

    case 'init':
        console.log('🚀 Initializing automated documentation system...');
        manager.initializeTemplateMarkers();
        console.log('✅ Template markers added to all documentation files');
        console.log('\nYou can now use:');
        console.log('- npm run docs:task-complete <task-id>');
        console.log('- npm run docs:verify-sync');
        console.log('- npm run docs:status-report');
        break;

    default:
        console.log('📚 Documentation Automation Tool');
        console.log('Usage: npm run docs:<command>');
        console.log('');
        console.log('Available commands:');
        console.log('  docs:init           Initialize template markers');
        console.log('  docs:task-complete  Mark task complete & update all docs');
        console.log('  docs:verify-sync    Check documentation consistency');
        console.log('  docs:status-report  Show current documentation status');
        console.log('');
        console.log('Examples:');
        console.log('  npm run docs:init');
        console.log('  npm run docs:task-complete P.DEBT.3.10');
        console.log('  npm run docs:verify-sync');
}