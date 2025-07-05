#!/usr/bin/env node

/**
 * Documentation Health Dashboard
 * 
 * Generates a comprehensive health report for the documentation system
 * including metrics, trends, and actionable insights.
 */

const fs = require('fs');
const path = require('path');
const DocumentationVerifier = require('./verify-documentation');

class DocumentationHealthDashboard {
    constructor() {
        this.rootDir = path.resolve(__dirname, '../../../..');
        this.healthDataFile = path.join(this.rootDir, '.doc-health-data.json');
        this.historyLimit = 30; // Keep 30 days of history
        
        // Load historical data
        this.healthHistory = this.loadHealthHistory();
    }

    /**
     * Generate health dashboard
     */
    async generateDashboard() {
        console.log('\n🏥 Documentation Health Dashboard\n');
        console.log('═'.repeat(80));
        console.log(`Generated: ${new Date().toISOString()}`);
        console.log('═'.repeat(80));
        
        // Run verification to get current metrics
        const verifier = new DocumentationVerifier();
        const currentMetrics = await this.runVerification(verifier);
        
        // Store current metrics
        this.recordMetrics(currentMetrics);
        
        // Generate dashboard sections
        this.showCurrentHealth(currentMetrics);
        this.showTrends();
        this.showTopIssues(verifier);
        this.showConflictMetrics(currentMetrics);
        this.showAutomationStats();
        this.showUpdateTimestamps(currentMetrics);
        this.showRecommendations(currentMetrics);
        
        console.log('\n' + '═'.repeat(80));
    }

    /**
     * Run verification and capture metrics
     */
    async runVerification(verifier) {
        // Run the verifier's main verify method
        await verifier.verify();
        
        // Calculate additional metrics
        const automationMetrics = this.calculateAutomationMetrics();
        
        // Calculate conflict metrics
        const conflictMetrics = this.calculateConflictMetrics(verifier);
        
        // Create basic metrics structure
        const metrics = {
            totalFiles: 0,
            totalLinks: 0,
            brokenLinks: 0,
            orphanedDocs: 0,
            staleContent: 0,
            errors: verifier.errors.length,
            warnings: verifier.warnings.length,
            healthScore: 100 - (verifier.errors.length * 10) - (verifier.warnings.length * 5),
            timestamp: new Date().toISOString(),
            ...automationMetrics,
            ...conflictMetrics
        };
        
        // Ensure health score doesn't go below 0
        metrics.healthScore = Math.max(0, metrics.healthScore);
        
        return metrics;
    }

    /**
     * Show current health status
     */
    showCurrentHealth(metrics) {
        console.log('\n📊 Current Health Status\n');
        
        // Health score with visual indicator
        const scoreEmoji = metrics.healthScore >= 90 ? '🟢' : 
                          metrics.healthScore >= 70 ? '🟡' : '🔴';
        console.log(`${scoreEmoji} Overall Health Score: ${metrics.healthScore}%`);
        
        // Key metrics grid
        console.log('\n📈 Key Metrics:');
        console.log(`┌─────────────────────────┬─────────────┬─────────────────────────┬─────────────┐`);
        console.log(`│ Total Files             │ ${this.pad(metrics.totalFiles, 11)} │ Broken Links            │ ${this.pad(metrics.brokenLinks, 11)} │`);
        console.log(`│ Total Links             │ ${this.pad(metrics.totalLinks, 11)} │ Orphaned Docs           │ ${this.pad(metrics.orphanedDocs, 11)} │`);
        console.log(`│ Stale Content (>30d)    │ ${this.pad(metrics.staleContent, 11)} │ Cross-ref Issues        │ ${this.pad(metrics.warnings, 11)} │`);
        console.log(`└─────────────────────────┴─────────────┴─────────────────────────┴─────────────┘`);
    }

    /**
     * Show trends over time
     */
    showTrends() {
        console.log('\n📈 7-Day Trends\n');
        
        const last7Days = this.healthHistory.slice(-7);
        if (last7Days.length < 2) {
            console.log('   ℹ️  Not enough historical data for trends (need at least 2 days)');
            return;
        }
        
        // Calculate trends
        const trends = {
            healthScore: this.calculateTrend(last7Days.map(d => d.healthScore)),
            brokenLinks: this.calculateTrend(last7Days.map(d => d.brokenLinks)),
            staleContent: this.calculateTrend(last7Days.map(d => d.staleContent)),
            automationRate: this.calculateTrend(last7Days.map(d => d.automationRate || 0))
        };
        
        // Display trends
        console.log(`   Health Score:    ${this.formatTrend(trends.healthScore)} (${last7Days[0].healthScore}% → ${last7Days[last7Days.length - 1].healthScore}%)`);
        console.log(`   Broken Links:    ${this.formatTrend(trends.brokenLinks)} (${last7Days[0].brokenLinks} → ${last7Days[last7Days.length - 1].brokenLinks})`);
        console.log(`   Stale Content:   ${this.formatTrend(trends.staleContent)} (${last7Days[0].staleContent} → ${last7Days[last7Days.length - 1].staleContent})`);
        console.log(`   Automation Rate: ${this.formatTrend(trends.automationRate)} (${last7Days[0].automationRate || 0}% → ${last7Days[last7Days.length - 1].automationRate || 0}%)`);
    }

    /**
     * Show top issues that need attention
     */
    showTopIssues(verifier) {
        console.log('\n🔥 Top Issues Requiring Attention\n');
        
        if (verifier.errors.length === 0 && verifier.warnings.length === 0) {
            console.log('   ✅ No issues found - documentation is in great shape!');
            return;
        }
        
        // Group issues by type
        const issueGroups = {};
        
        [...verifier.errors, ...verifier.warnings].forEach(issue => {
            if (!issueGroups[issue.type]) {
                issueGroups[issue.type] = [];
            }
            issueGroups[issue.type].push(issue);
        });
        
        // Show top 5 issue types
        const sortedTypes = Object.entries(issueGroups)
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, 5);
        
        sortedTypes.forEach(([type, issues]) => {
            const icon = type.includes('broken') ? '🔗' : 
                        type === 'stale' ? '📅' : 
                        type === 'orphaned' ? '🔍' : '⚠️';
            console.log(`   ${icon} ${this.formatIssueType(type)} (${issues.length} occurrences)`);
            
            // Show first 3 examples
            issues.slice(0, 3).forEach(issue => {
                console.log(`      └─ ${issue.file}: ${this.truncate(issue.message, 50)}`);
            });
            
            if (issues.length > 3) {
                console.log(`      └─ ... and ${issues.length - 3} more`);
            }
        });
    }

    /**
     * Show conflict detection metrics
     */
    showConflictMetrics(metrics) {
        console.log('\n⚔️ Conflict Detection Metrics\n');
        
        if (metrics.totalConflicts === 0) {
            console.log('   ✅ No documentation conflicts detected!');
            return;
        }
        
        console.log(`   Total Conflicts Found: ${metrics.totalConflicts}`);
        console.log('   ├─ Cross-Reference Conflicts: ' + metrics.crossRefConflicts);
        console.log('   ├─ Broken Link Conflicts: ' + metrics.brokenLinkConflicts);
        console.log('   └─ Orphan Document Conflicts: ' + metrics.orphanConflicts);
        
        if (metrics.totalConflicts > 5) {
            console.log('\n   ⚠️  High conflict count - consider running "npm run docs:fix-conflicts"');
        }
    }

    /**
     * Show automation statistics
     */
    showAutomationStats() {
        console.log('\n🤖 Automation Statistics\n');
        
        const stats = this.getAutomationStats();
        
        console.log(`   Template Markers Active: ${stats.markersActive ? '✅ Yes' : '❌ No'}`);
        console.log(`   Last Auto-Update: ${stats.lastAutoUpdate || 'Never'}`);
        console.log(`   Automation Coverage: ${stats.automationRate}%`);
        console.log(`   Files with Markers: ${stats.filesWithMarkers}/${stats.totalCoreFiles}`);
        
        if (stats.recentUpdates.length > 0) {
            console.log('\n   Recent Automated Updates:');
            stats.recentUpdates.slice(0, 5).forEach(update => {
                console.log(`      • ${update.file} - ${update.marker} (${this.getRelativeTime(update.timestamp)})`);
            });
        }
    }

    /**
     * Show file update timestamps
     */
    showUpdateTimestamps(metrics) {
        console.log('\n📅 Core Documentation Update Status\n');
        
        // Create a simple lastUpdated structure
        metrics.lastUpdated = {};
        const coreFiles = ['README.md', 'CLAUDE.md', 
                          'SCHEMA_MAPPING_GUIDE.md', 'AUTHORITY_MATRIX.md'];
        
        // Get file modification times
        const fs = require('fs');
        const path = require('path');
        coreFiles.forEach(file => {
            const filePath = path.join(this.rootDir, file);
            if (fs.existsSync(filePath)) {
                const stats = fs.statSync(filePath);
                metrics.lastUpdated[file] = stats.mtime.toISOString();
            }
        });
        
        if (Object.keys(metrics.lastUpdated).length === 0) {
            console.log('   ℹ️  No update timestamp data available');
            return;
        }
        
        const today = new Date();
        
        coreFiles.forEach(file => {
            if (metrics.lastUpdated[file]) {
                const lastUpdate = new Date(metrics.lastUpdated[file]);
                const daysSince = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));
                
                const status = daysSince === 0 ? '🟢 Today' :
                             daysSince <= 7 ? '🟢 Recent' :
                             daysSince <= 30 ? '🟡 Aging' : '🔴 Stale';
                
                console.log(`   ${file.padEnd(30)} ${status} (${daysSince} days ago)`);
            } else {
                console.log(`   ${file.padEnd(30)} ⚫ Unknown`);
            }
        });
        
        // Show oldest and newest
        const allDates = Object.entries(metrics.lastUpdated)
            .map(([file, date]) => ({ file, date: new Date(date) }))
            .sort((a, b) => a.date - b.date);
        
        if (allDates.length > 0) {
            console.log('\n   📊 Summary:');
            console.log(`      Oldest: ${allDates[0].file} (${metrics.lastUpdated[allDates[0].file]})`);
            console.log(`      Newest: ${allDates[allDates.length - 1].file} (${metrics.lastUpdated[allDates[allDates.length - 1].file]})`);
        }
    }

    /**
     * Show recommendations based on health data
     */
    showRecommendations(metrics) {
        console.log('\n💡 Recommendations\n');
        
        const recommendations = [];
        
        // Health score based recommendations
        if (metrics.healthScore < 80) {
            recommendations.push({
                priority: 'high',
                action: 'Run "npm run docs:fix" to auto-fix common issues',
                reason: 'Health score below 80%'
            });
        }
        
        // Broken links
        if (metrics.brokenLinks > 0) {
            recommendations.push({
                priority: 'high',
                action: 'Fix broken links using "npm run docs:fix-links"',
                reason: `${metrics.brokenLinks} broken links detected`
            });
        }
        
        // Stale content
        if (metrics.staleContent > 2) {
            recommendations.push({
                priority: 'medium',
                action: 'Review and update stale documentation',
                reason: `${metrics.staleContent} files not updated in >30 days`
            });
        }
        
        // Orphaned docs
        if (metrics.orphanedDocs > 0) {
            recommendations.push({
                priority: 'low',
                action: 'Link or archive orphaned documentation',
                reason: `${metrics.orphanedDocs} files not referenced anywhere`
            });
        }
        
        // Automation coverage
        if (metrics.automationRate < 80) {
            recommendations.push({
                priority: 'medium',
                action: 'Add template markers to more files',
                reason: 'Automation coverage below 80%'
            });
        }
        
        // Display recommendations
        if (recommendations.length === 0) {
            console.log('   ✅ Documentation is in excellent shape - no actions needed!');
        } else {
            const highPriority = recommendations.filter(r => r.priority === 'high');
            const mediumPriority = recommendations.filter(r => r.priority === 'medium');
            const lowPriority = recommendations.filter(r => r.priority === 'low');
            
            if (highPriority.length > 0) {
                console.log('   🔴 High Priority:');
                highPriority.forEach(r => {
                    console.log(`      • ${r.action}`);
                    console.log(`        (${r.reason})`);
                });
            }
            
            if (mediumPriority.length > 0) {
                console.log('\n   🟡 Medium Priority:');
                mediumPriority.forEach(r => {
                    console.log(`      • ${r.action}`);
                    console.log(`        (${r.reason})`);
                });
            }
            
            if (lowPriority.length > 0) {
                console.log('\n   🟢 Low Priority:');
                lowPriority.forEach(r => {
                    console.log(`      • ${r.action}`);
                    console.log(`        (${r.reason})`);
                });
            }
        }
    }

    /**
     * Calculate conflict detection metrics
     */
    calculateConflictMetrics(verifier) {
        const conflicts = {
            crossRefConflicts: 0,
            brokenLinkConflicts: 0,
            orphanConflicts: 0,
            totalConflicts: 0
        };
        
        // Count different types of conflicts
        verifier.warnings.forEach(warning => {
            if (warning.type === 'missing-cross-ref') {
                conflicts.crossRefConflicts++;
            } else if (warning.type === 'orphaned') {
                conflicts.orphanConflicts++;
            }
        });
        
        verifier.errors.forEach(error => {
            if (error.type.includes('broken')) {
                conflicts.brokenLinkConflicts++;
            }
        });
        
        conflicts.totalConflicts = conflicts.crossRefConflicts + 
                                  conflicts.brokenLinkConflicts + 
                                  conflicts.orphanConflicts;
        
        return conflicts;
    }

    /**
     * Calculate automation metrics
     */
    calculateAutomationMetrics() {
        const coreFiles = ['README.md', 'CLAUDE.md', 
                          'SCHEMA_MAPPING_GUIDE.md', 'AUTHORITY_MATRIX.md'];
        let filesWithMarkers = 0;
        let totalMarkers = 0;
        
        coreFiles.forEach(file => {
            const fullPath = path.join(this.rootDir, file);
            if (fs.existsSync(fullPath)) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const markerMatches = content.match(/<!-- AUTO:[^>]+-->/g) || [];
                if (markerMatches.length > 0) {
                    filesWithMarkers++;
                    totalMarkers += markerMatches.length / 2; // Opening and closing tags
                }
            }
        });
        
        return {
            filesWithMarkers,
            totalCoreFiles: coreFiles.length,
            totalMarkers,
            automationRate: Math.round((filesWithMarkers / coreFiles.length) * 100),
            markersActive: filesWithMarkers > 0
        };
    }

    /**
     * Get automation statistics
     */
    getAutomationStats() {
        const metrics = this.calculateAutomationMetrics();
        const updateLog = this.loadUpdateLog();
        
        return {
            ...metrics,
            lastAutoUpdate: updateLog.length > 0 ? 
                this.formatDate(updateLog[0].timestamp) : null,
            recentUpdates: updateLog.slice(0, 10)
        };
    }

    /**
     * Load update log
     */
    loadUpdateLog() {
        const logFile = path.join(this.rootDir, '.doc-update-log.json');
        try {
            if (fs.existsSync(logFile)) {
                return JSON.parse(fs.readFileSync(logFile, 'utf8'));
            }
        } catch (error) {
            console.error('Error loading update log:', error.message);
        }
        return [];
    }

    /**
     * Load health history
     */
    loadHealthHistory() {
        try {
            if (fs.existsSync(this.healthDataFile)) {
                const data = JSON.parse(fs.readFileSync(this.healthDataFile, 'utf8'));
                return data.history || [];
            }
        } catch (error) {
            console.error('Error loading health history:', error.message);
        }
        return [];
    }

    /**
     * Record current metrics
     */
    recordMetrics(metrics) {
        this.healthHistory.push(metrics);
        
        // Keep only recent history
        if (this.healthHistory.length > this.historyLimit) {
            this.healthHistory = this.healthHistory.slice(-this.historyLimit);
        }
        
        // Save to file
        try {
            fs.writeFileSync(this.healthDataFile, JSON.stringify({
                history: this.healthHistory,
                lastUpdated: new Date().toISOString()
            }, null, 2));
        } catch (error) {
            console.error('Error saving health history:', error.message);
        }
    }

    /**
     * Calculate trend from data points
     */
    calculateTrend(values) {
        if (values.length < 2) return 0;
        
        const first = values[0];
        const last = values[values.length - 1];
        const change = last - first;
        
        return {
            direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
            percentage: first !== 0 ? Math.round((change / first) * 100) : 0
        };
    }

    /**
     * Format trend for display
     */
    formatTrend(trend) {
        const arrows = {
            up: '↑',
            down: '↓',
            stable: '→'
        };
        
        const colors = {
            up: '\x1b[32m',    // Green
            down: '\x1b[31m',  // Red
            stable: '\x1b[33m' // Yellow
        };
        
        const reset = '\x1b[0m';
        const arrow = arrows[trend.direction];
        const color = colors[trend.direction];
        
        return `${color}${arrow} ${Math.abs(trend.percentage)}%${reset}`;
    }

    /**
     * Format issue type for display
     */
    formatIssueType(type) {
        const typeNames = {
            'broken-anchor': 'Broken Anchor Links',
            'broken-file-link': 'Broken File Links',
            'orphaned': 'Orphaned Documents',
            'stale': 'Stale Content',
            'missing-cross-ref': 'Missing Cross-References',
            'read-error': 'File Read Errors'
        };
        
        return typeNames[type] || type.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Helper: Pad string to length
     */
    pad(value, length) {
        return String(value).padEnd(length);
    }

    /**
     * Helper: Truncate string
     */
    truncate(str, length) {
        return str.length > length ? str.substring(0, length - 3) + '...' : str;
    }

    /**
     * Helper: Format date
     */
    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }

    /**
     * Helper: Get relative time
     */
    getRelativeTime(dateStr) {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);
        
        if (diffDays > 0) return `${diffDays}d ago`;
        if (diffHours > 0) return `${diffHours}h ago`;
        if (diffMins > 0) return `${diffMins}m ago`;
        return 'just now';
    }
}

// Run dashboard if called directly
if (require.main === module) {
    const dashboard = new DocumentationHealthDashboard();
    dashboard.generateDashboard();
}

module.exports = DocumentationHealthDashboard;