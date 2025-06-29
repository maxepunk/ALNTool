#!/usr/bin/env node

/**
 * Comprehensive documentation verification script
 * Prevents documentation drift by checking:
 * 1. System state matches documentation claims
 * 2. Verification timestamps are recent
 * 3. No duplicate status claims
 * 4. Authority matrix compliance
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const MAX_VERIFICATION_AGE_DAYS = 7;
const PROJECT_ROOT = path.join(__dirname, '..', '..', '..', '..');

class DocumentationVerifier {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.db = null;
    }

    /**
     * Main verification entry point
     */
    async verify() {
        console.log('🔍 Running comprehensive documentation verification...\n');

        // 1. Verify system state claims
        await this.verifySystemStateClaims();

        // 2. Check verification timestamps
        this.checkVerificationTimestamps();

        // 3. Check for duplicate status claims
        this.checkDuplicateStatusClaims();

        // 4. Verify authority compliance
        this.verifyAuthorityCompliance();

        // 5. Check automation marker consistency
        this.checkAutomationMarkers();

        // Report results
        return this.reportResults();
    }

    /**
     * Verify that documentation claims match actual system state
     */
    async verifySystemStateClaims() {
        console.log('📊 Verifying system state claims...');

        try {
            // Initialize database connection
            const { getDB } = require('../../src/db/database');
            this.db = getDB();

            // Check character links claim
            const characterLinks = this.db.prepare('SELECT COUNT(*) as count FROM character_links').get();
            this.checkClaim('character links', characterLinks.count, 'README.md');

            // Check timeline events with act_focus
            const actFocus = this.db.prepare('SELECT COUNT(*) as total, COUNT(act_focus) as with_act FROM timeline_events').get();
            const missingActFocus = actFocus.total - actFocus.with_act;
            this.checkClaim('timeline events missing act_focus', missingActFocus, 'README.md');

            // Check puzzle sync status from sync_log table
            const puzzleSync = this.db.prepare(`
                SELECT status, COUNT(*) as count 
                FROM sync_log 
                WHERE entity_type = 'puzzle' 
                GROUP BY status
            `).all();
            const failedPuzzles = puzzleSync.find(s => s.status === 'failed')?.count || 0;
            this.checkClaim('failed puzzle syncs', failedPuzzles, 'README.md');

            // Check test coverage (from coverage report if exists)
            const coverageFile = path.join(__dirname, '..', '..', 'coverage', 'lcov-report', 'index.html');
            if (fs.existsSync(coverageFile)) {
                const coverage = fs.readFileSync(coverageFile, 'utf-8');
                const match = coverage.match(/<span class="strong">([0-9.]+)%/);
                if (match) {
                    const currentCoverage = parseFloat(match[1]);
                    this.checkClaim('test coverage', currentCoverage + '%', 'README.md', true);
                }
            }

            console.log('✓ System state verification complete\n');
        } catch (error) {
            this.errors.push(`Failed to verify system state: ${error.message}`);
        }
    }

    /**
     * Check if a claim in documentation matches reality
     */
    checkClaim(metric, actualValue, file, isApproximate = false) {
        const filePath = path.join(PROJECT_ROOT, file);
        if (!fs.existsSync(filePath)) return;

        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Look for claims about this metric with more specific patterns
        const escapedMetric = metric.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Only match within system health or status sections
        const healthSection = content.match(/### 📊 System Health[\s\S]*?(?=###|$)/i) || 
                             content.match(/\*\*Known Working State:\*\*[\s\S]*?(?=###|$)/i);
        if (!healthSection) {
            console.log(`  - No health section found in ${file} for metric: ${metric}`);
            return;
        }
        
        const sectionContent = healthSection[0];
        console.log(`  - Checking ${metric} in ${file}...`);
        const patterns = [
            new RegExp(`${escapedMetric}[^\\d]*(\\d+(?:\\.\\d+)?)(?:\\s|%|,|\\)|$)`, 'i'),
            new RegExp(`(\\d+(?:\\.\\d+)?)(?:\\s|/)\\d*\\s*${escapedMetric}`, 'i'),
            new RegExp(`(\\d+)\\s+${escapedMetric}(?:\\s|\\(|$)`, 'i')
        ];

        for (const pattern of patterns) {
            const match = sectionContent.match(pattern);
            if (match) {
                const claimedValue = match[1];
                console.log(`    Found match: "${match[0]}" -> value: ${claimedValue}`);
                if (!isApproximate && claimedValue != actualValue) {
                    this.errors.push(
                        `${file} claims ${metric}: ${claimedValue}, but actual value is ${actualValue}`
                    );
                }
            }
        }
    }

    /**
     * Check that verification timestamps are recent
     */
    checkVerificationTimestamps() {
        console.log('📅 Checking verification timestamps...');

        const files = ['README.md', 'DEVELOPMENT_PLAYBOOK.md', 'CLAUDE.md'];
        const today = new Date();

        for (const file of files) {
            const filePath = path.join(PROJECT_ROOT, file);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf-8');
            const timestampPattern = /<!-- VERIFIED: (\d{4}-\d{2}-\d{2}) -->/g;
            let match;

            while ((match = timestampPattern.exec(content)) !== null) {
                const verifiedDate = new Date(match[1]);
                const daysDiff = Math.floor((today - verifiedDate) / (1000 * 60 * 60 * 24));

                if (daysDiff > MAX_VERIFICATION_AGE_DAYS) {
                    this.warnings.push(
                        `${file} has verification timestamp older than ${MAX_VERIFICATION_AGE_DAYS} days: ${match[1]}`
                    );
                }
            }
        }

        console.log('✓ Timestamp verification complete\n');
    }

    /**
     * Check for duplicate status claims across documents
     */
    checkDuplicateStatusClaims() {
        console.log('🔍 Checking for duplicate status claims...');

        const statusClaims = {
            currentTask: [],
            currentPhase: [],
            testCoverage: [],
            systemStatus: []
        };

        const files = ['README.md', 'DEVELOPMENT_PLAYBOOK.md', 'CLAUDE.md'];

        for (const file of files) {
            const filePath = path.join(PROJECT_ROOT, file);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf-8');

            // Check for current task claims
            if (content.match(/Current Task:.*P\.DEBT/i)) {
                statusClaims.currentTask.push(file);
            }

            // Check for current phase claims
            if (content.match(/Current Phase:/i)) {
                statusClaims.currentPhase.push(file);
            }

            // Check for test coverage claims
            if (content.match(/test coverage:.*\d+/i)) {
                statusClaims.testCoverage.push(file);
            }

            // Check for system status sections
            if (content.match(/## .*Current.*Status/i)) {
                statusClaims.systemStatus.push(file);
            }
        }

        // Report duplicates
        for (const [claim, files] of Object.entries(statusClaims)) {
            if (files.length > 1) {
                this.warnings.push(
                    `Duplicate ${claim} claims found in: ${files.join(', ')}`
                );
            }
        }

        console.log('✓ Duplicate claim check complete\n');
    }

    /**
     * Verify authority matrix compliance
     */
    verifyAuthorityCompliance() {
        console.log('📏 Verifying authority matrix compliance...');

        // Check that README.md points to DEVELOPMENT_PLAYBOOK.md for current task
        const readmePath = path.join(PROJECT_ROOT, 'README.md');
        if (fs.existsSync(readmePath)) {
            const content = fs.readFileSync(readmePath, 'utf-8');
            if (!content.includes('DEVELOPMENT_PLAYBOOK.md')) {
                this.warnings.push(
                    'README.md should reference DEVELOPMENT_PLAYBOOK.md for current task status'
                );
            }
        }

        // Check that status claims are in the right documents
        const authorityRules = {
            'Current Task': 'DEVELOPMENT_PLAYBOOK.md',
            'System Health': 'README.md',
            'Workflow': 'CLAUDE.md'
        };

        for (const [claim, authorizedFile] of Object.entries(authorityRules)) {
            const files = ['README.md', 'DEVELOPMENT_PLAYBOOK.md', 'CLAUDE.md'];
            for (const file of files) {
                if (file === authorizedFile) continue;
                
                const filePath = path.join(PROJECT_ROOT, file);
                if (!fs.existsSync(filePath)) continue;
                
                const content = fs.readFileSync(filePath, 'utf-8');
                if (content.includes(claim) && !content.includes(authorizedFile)) {
                    this.warnings.push(
                        `${file} contains "${claim}" but should defer to ${authorizedFile}`
                    );
                }
            }
        }

        console.log('✓ Authority compliance check complete\n');
    }

    /**
     * Check automation marker consistency
     */
    checkAutomationMarkers() {
        console.log('🤖 Checking automation markers...');

        const files = ['README.md', 'DEVELOPMENT_PLAYBOOK.md'];
        const markers = ['CURRENT_TASK', 'LAST_UPDATED', 'PROGRESS', 'LAST_COMPLETED'];

        for (const file of files) {
            const filePath = path.join(PROJECT_ROOT, file);
            if (!fs.existsSync(filePath)) continue;

            const content = fs.readFileSync(filePath, 'utf-8');

            for (const marker of markers) {
                const startPattern = `<!-- AUTO:${marker} -->`;
                const endPattern = `<!-- /AUTO:${marker} -->`;
                
                const startCount = (content.match(new RegExp(startPattern, 'g')) || []).length;
                const endCount = (content.match(new RegExp(endPattern, 'g')) || []).length;

                if (startCount !== endCount) {
                    this.errors.push(
                        `${file} has mismatched AUTO:${marker} tags (${startCount} starts, ${endCount} ends)`
                    );
                }
            }
        }

        console.log('✓ Automation marker check complete\n');
    }

    /**
     * Report verification results
     */
    reportResults() {
        console.log('=' .repeat(60));
        console.log('📊 VERIFICATION SUMMARY');
        console.log('=' .repeat(60));

        if (this.errors.length === 0 && this.warnings.length === 0) {
            console.log('✅ All documentation checks passed!');
            return 0;
        }

        if (this.errors.length > 0) {
            console.log(`\n❌ ERRORS (${this.errors.length}):`);
            this.errors.forEach(error => console.log(`   - ${error}`));
        }

        if (this.warnings.length > 0) {
            console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
            this.warnings.forEach(warning => console.log(`   - ${warning}`));
        }

        console.log('\n💡 SUGGESTIONS:');
        console.log('   1. Run verification queries to check actual system state');
        console.log('   2. Update documentation with verified values');
        console.log('   3. Add <!-- VERIFIED: YYYY-MM-DD --> timestamps');
        console.log('   4. Use npm run docs:task-complete for task updates');

        // Return non-zero exit code if there are errors
        return this.errors.length > 0 ? 1 : 0;
    }
}

// Run verification if called directly
if (require.main === module) {
    const verifier = new DocumentationVerifier();
    verifier.verify().then(exitCode => {
        process.exit(exitCode);
    }).catch(error => {
        console.error('❌ Verification failed:', error.message);
        process.exit(1);
    });
}

module.exports = DocumentationVerifier;