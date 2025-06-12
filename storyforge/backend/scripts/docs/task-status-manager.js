const fs = require('fs');
const path = require('path');

/**
 * Task Status Manager - Central hub for automated documentation updates
 * 
 * This script provides utilities to:
 * 1. Read current task status from various sources
 * 2. Update documentation files automatically
 * 3. Maintain consistency across all documentation
 * 4. Verify documentation alignment
 */

class TaskStatusManager {
    constructor() {
        this.rootDir = path.resolve(__dirname, '../../../..');
        this.backendDir = path.resolve(__dirname, '../..');
        
        // Define documentation files to manage
        this.docFiles = {
            claude: path.join(this.rootDir, 'CLAUDE.md'),
            readme: path.join(this.rootDir, 'README.md'),
            playbook: path.join(this.rootDir, 'DEVELOPMENT_PLAYBOOK.md'),
            schema: path.join(this.rootDir, 'SCHEMA_MAPPING_GUIDE.md'),
            authority: path.join(this.rootDir, 'AUTHORITY_MATRIX.md')
        };
    }

    /**
     * Get current task status from TodoWrite data (if available)
     * This would integrate with the TodoWrite system in a full implementation
     */
    getCurrentTaskStatus() {
        // Extract from DEVELOPMENT_PLAYBOOK.md (authoritative source)
        const playbookContent = this.readFile(this.docFiles.playbook);
        
        // Extract current task using regex - handle both old and new format
        let currentTaskMatch = playbookContent.match(/<!-- AUTO:CURRENT_TASK -->(.+?)<!-- \/AUTO:CURRENT_TASK -->/);
        if (!currentTaskMatch) {
            currentTaskMatch = playbookContent.match(/#### \*\*P\.DEBT\.\d+\.\d+:[^*]+\*\*/);
        }
        const currentTask = currentTaskMatch ? currentTaskMatch[1] || currentTaskMatch[0] : 'P.DEBT.3.11 – Complete Test Coverage';
        
        // Extract progress - simplified for now
        const progress = '11/13';
        
        return {
            currentTask: currentTask.trim(),
            progress: progress.trim(),
            lastUpdated: new Date().toISOString().split('T')[0]
        };
    }

    /**
     * Read file content safely
     */
    readFile(filePath) {
        try {
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error(`Error reading file ${filePath}:`, error.message);
            return '';
        }
    }

    /**
     * Write file content safely
     */
    writeFile(filePath, content) {
        try {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✓ Updated ${path.basename(filePath)}`);
            return true;
        } catch (error) {
            console.error(`✗ Error writing file ${filePath}:`, error.message);
            return false;
        }
    }

    /**
     * Update template markers in a file
     */
    updateTemplateMarkers(content, updates) {
        let updatedContent = content;
        
        for (const [marker, value] of Object.entries(updates)) {
            const pattern = new RegExp(`<!-- AUTO:${marker} -->.*?<!-- /AUTO:${marker} -->`, 'g');
            const replacement = `<!-- AUTO:${marker} -->${value}<!-- /AUTO:${marker} -->`;
            updatedContent = updatedContent.replace(pattern, replacement);
        }
        
        return updatedContent;
    }

    /**
     * Add template markers to a file if they don't exist
     */
    addTemplateMarkers(content, markers) {
        let updatedContent = content;
        
        for (const [marker, defaultValue] of Object.entries(markers)) {
            const markerPattern = `<!-- AUTO:${marker} -->`;
            if (!updatedContent.includes(markerPattern)) {
                // Add marker at appropriate location based on content
                const markerWithDefault = `<!-- AUTO:${marker} -->${defaultValue}<!-- /AUTO:${marker} -->`;
                
                if (marker === 'CURRENT_TASK') {
                    // Replace any existing current task references
                    updatedContent = updatedContent.replace(
                        /- \*\*Current Task\*\*: (.+)/,
                        `- **Current Task**: ${markerWithDefault}`
                    );
                } else if (marker === 'PROGRESS') {
                    // Replace any existing progress references
                    updatedContent = updatedContent.replace(
                        /(Priority 3[^(]+)\((\d+\/\d+)[^)]+\)/,
                        `$1(${markerWithDefault})`
                    );
                }
            }
        }
        
        return updatedContent;
    }

    /**
     * Complete a task and update all documentation
     */
    completeTask(taskId, taskName, completionDate = null) {
        const date = completionDate || new Date().toISOString().split('T')[0];
        console.log(`\nCompleting task: ${taskId} - ${taskName}`);
        
        const currentStatus = this.getCurrentTaskStatus();
        
        // Parse current progress
        const [completed, total] = currentStatus.progress.split('/').map(Number);
        const newProgress = `${completed + 1}/${total}`;
        
        // Determine next task (this could be enhanced with more logic)
        const nextTask = this.getNextTask(taskId);
        
        const updates = {
            CURRENT_TASK: nextTask,
            PROGRESS: newProgress,
            LAST_COMPLETED: `${taskId} (${date})`,
            LAST_UPDATED: date
        };
        
        // Update all documentation files
        this.updateAllDocumentation(updates);
        
        console.log(`✓ Task ${taskId} marked complete`);
        console.log(`✓ Progress updated to ${newProgress}`);
        console.log(`✓ Next task set to ${nextTask}`);
    }

    /**
     * Get next task based on current task
     */
    getNextTask(completedTask) {
        const taskSequence = {
            // Technical Debt Phase
            'P.DEBT.3.8': 'P.DEBT.3.9 – Memory Value Extraction (NEXT)',
            'P.DEBT.3.9': 'P.DEBT.3.10 – Fix Puzzle Sync (NEXT)',
            'P.DEBT.3.10': 'P.DEBT.3.11 – Complete Test Coverage (NEXT)',
            'P.DEBT.3.11': 'Final Mile Fixes (NEXT)',
            
            // Documentation Phase (if active)
            'Phase 1.1': 'Phase 1.2 - Document Conflict Resolution (NEXT)',
            'Phase 1.2': 'Resume Technical Debt (NEXT)',
            
            // Final Mile
            'Final Mile Fixes': 'Phase 2 Development (NEXT)'
        };
        
        return taskSequence[completedTask] || 'Next Phase (TBD)';
    }

    /**
     * Update all documentation files with template markers
     */
    updateAllDocumentation(updates) {
        for (const [fileKey, filePath] of Object.entries(this.docFiles)) {
            if (!fs.existsSync(filePath)) {
                console.log(`⚠ File not found: ${filePath}`);
                continue;
            }
            
            let content = this.readFile(filePath);
            content = this.updateTemplateMarkers(content, updates);
            this.writeFile(filePath, content);
        }
    }

    /**
     * Verify documentation consistency
     */
    verifyConsistency() {
        console.log('\n🔍 Verifying documentation consistency...');
        
        const issues = [];
        const currentStatus = this.getCurrentTaskStatus();
        
        // Check each documentation file for consistency
        for (const [fileKey, filePath] of Object.entries(this.docFiles)) {
            if (!fs.existsSync(filePath)) continue;
            
            const content = this.readFile(filePath);
            
            // Look for current task references that are NOT inside automation markers
            const autoMarkerRegex = /<!-- AUTO:[^>]+-->(.*?)<!-- \/AUTO:[^>]+-->/gs;
            let contentWithoutMarkers = content;
            
            // Remove all automation marker content first
            contentWithoutMarkers = contentWithoutMarkers.replace(autoMarkerRegex, '');
            
            // Now check for remaining manual task references
            const taskMatches = contentWithoutMarkers.match(/P\.DEBT\.\d+\.\d+/g) || [];
            const currentTaskRefs = taskMatches.filter(task => 
                contentWithoutMarkers.includes(`${task} (NEXT)`) || 
                contentWithoutMarkers.includes(`${task} – `) ||
                contentWithoutMarkers.includes(`Current Task**: ${task}`)
            );
            
            if (currentTaskRefs.length > 1) {
                issues.push(`${fileKey}: Multiple manual task references found (should use automation markers)`);
            }
        }
        
        if (issues.length === 0) {
            console.log('✓ Documentation is consistent');
        } else {
            console.log('⚠ Issues found:');
            issues.forEach(issue => console.log(`  - ${issue}`));
        }
        
        return issues.length === 0;
    }

    /**
     * Initialize template markers in all documentation files
     */
    initializeTemplateMarkers() {
        console.log('\n📝 Initializing template markers...');
        
        const currentStatus = this.getCurrentTaskStatus();
        
        const defaultMarkers = {
            CURRENT_TASK: currentStatus.currentTask,
            PROGRESS: currentStatus.progress,
            LAST_COMPLETED: 'P.DEBT.3.9 (June 10, 2025)',
            LAST_UPDATED: currentStatus.lastUpdated
        };
        
        for (const [fileKey, filePath] of Object.entries(this.docFiles)) {
            if (!fs.existsSync(filePath)) continue;
            
            let content = this.readFile(filePath);
            const originalContent = content;
            
            content = this.addTemplateMarkers(content, defaultMarkers);
            
            if (content !== originalContent) {
                this.writeFile(filePath, content);
                console.log(`✓ Added template markers to ${fileKey}`);
            } else {
                console.log(`- No changes needed for ${fileKey}`);
            }
        }
    }

    /**
     * Generate status report
     */
    generateStatusReport() {
        console.log('\n📊 Documentation Status Report');
        console.log('================================');
        
        const currentStatus = this.getCurrentTaskStatus();
        console.log(`Current Task: ${currentStatus.currentTask}`);
        console.log(`Progress: ${currentStatus.progress}`);
        console.log(`Last Updated: ${currentStatus.lastUpdated}`);
        
        console.log('\nDocumentation Files:');
        for (const [fileKey, filePath] of Object.entries(this.docFiles)) {
            const exists = fs.existsSync(filePath);
            const hasMarkers = exists ? this.readFile(filePath).includes('<!-- AUTO:') : false;
            console.log(`  ${fileKey}: ${exists ? '✓' : '✗'} ${hasMarkers ? '(automated)' : '(manual)'}`);
        }
        
        return currentStatus;
    }
}

// CLI interface
if (require.main === module) {
    const manager = new TaskStatusManager();
    const command = process.argv[2];
    
    switch (command) {
        case 'init':
            manager.initializeTemplateMarkers();
            break;
        case 'complete':
            const taskId = process.argv[3];
            const taskName = process.argv[4] || taskId;
            if (!taskId) {
                console.error('Usage: node task-status-manager.js complete <task-id> [task-name]');
                process.exit(1);
            }
            manager.completeTask(taskId, taskName);
            break;
        case 'verify':
            const isConsistent = manager.verifyConsistency();
            process.exit(isConsistent ? 0 : 1);
            break;
        case 'status':
            manager.generateStatusReport();
            break;
        default:
            console.log('Usage: node task-status-manager.js <command>');
            console.log('Commands:');
            console.log('  init     - Initialize template markers in documentation');
            console.log('  complete - Mark a task as complete and update docs');
            console.log('  verify   - Check documentation consistency');
            console.log('  status   - Generate status report');
    }
}

module.exports = TaskStatusManager;