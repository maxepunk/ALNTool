const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const SCRIPTS_DIR = __dirname;
const VERIFY_MIGRATIONS = path.join(SCRIPTS_DIR, 'verify-migrations.js');
const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../data/production.db');

async function runPreDeployVerification() {
    console.log('Running pre-deployment verification...\n');

    // 1. Verify database exists and is accessible
    console.log('1. Checking database access...');
    if (!fs.existsSync(DB_PATH)) {
        console.error('ERROR: Database file not found at:', DB_PATH);
        console.error('Please ensure the database exists before deployment.');
        process.exit(1);
    }
    console.log('✓ Database file exists');

    // 2. Run migration verification
    console.log('\n2. Verifying migrations...');
    try {
        execSync(`node "${VERIFY_MIGRATIONS}"`, { stdio: 'inherit' });
    } catch (error) {
        console.error('\nERROR: Migration verification failed');
        console.error('Please fix migration issues before deploying.');
        process.exit(1);
    }

    // 3. Verify critical tables have data
    console.log('\n3. Verifying critical data...');
    const db = require('better-sqlite3')(DB_PATH);
    try {
        const criticalTables = [
            'characters',
            'timeline_events',
            'elements',
            'puzzles',
            'character_links'
        ];

        for (const table of criticalTables) {
            const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get().count;
            console.log(`${table}: ${count} records`);
            
            if (count === 0) {
                console.warn(`WARNING: ${table} table is empty`);
            }
        }

        // Verify character links specifically
        const characterLinks = db.prepare(`
            SELECT c.name, COUNT(cl.id) as link_count 
            FROM characters c 
            LEFT JOIN character_links cl ON c.id = cl.character_a_id OR c.id = cl.character_b_id
            GROUP BY c.id
        `).all();

        const charactersWithNoLinks = characterLinks.filter(c => c.link_count === 0);
        if (charactersWithNoLinks.length > 0) {
            console.warn('\nWARNING: Characters with no links:');
            charactersWithNoLinks.forEach(c => console.warn(`- ${c.name}`));
        }

        // Verify computed fields
        console.log('\n4. Verifying computed fields...');
        
        // Check for null computed fields
        const computedFieldChecks = [
            {
                table: 'timeline_events',
                field: 'act_focus',
                query: 'SELECT COUNT(*) as count FROM timeline_events WHERE act_focus IS NULL'
            },
            {
                table: 'characters',
                field: 'resolution_paths',
                query: 'SELECT COUNT(*) as count FROM characters WHERE resolution_paths IS NULL'
            },
            {
                table: 'elements',
                field: 'resolution_paths',
                query: 'SELECT COUNT(*) as count FROM elements WHERE resolution_paths IS NULL'
            }
        ];

        for (const check of computedFieldChecks) {
            const nullCount = db.prepare(check.query).get().count;
            if (nullCount > 0) {
                console.warn(`WARNING: ${nullCount} records in ${check.table} have null ${check.field}`);
            } else {
                console.log(`✓ All ${check.table}.${check.field} values are computed`);
            }
        }

        // 5. Verify puzzle sync status
        console.log('\n5. Verifying puzzle sync status...');
        // Instead of checking puzzles.sync_status, use sync_log
        const puzzleSyncs = db.prepare(`
            SELECT status, COUNT(*) as count
            FROM sync_log
            WHERE entity_type = 'puzzles'
            GROUP BY status
        `).all();
        if (puzzleSyncs.length === 0) {
            console.warn('No sync_log entries found for puzzles.');
        } else {
            puzzleSyncs.forEach(row => {
                console.log(`Puzzle syncs with status '${row.status}': ${row.count}`);
            });
        }

    } catch (error) {
        console.error('Error during verification:', error);
        process.exit(1);
    } finally {
        db.close();
    }

    console.log('\n✓ Pre-deployment verification completed successfully');
}

// Run the verification
runPreDeployVerification().catch(error => {
    console.error('Fatal error during verification:', error);
    process.exit(1);
}); 