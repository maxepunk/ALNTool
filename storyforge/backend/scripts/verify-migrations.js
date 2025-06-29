const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { runMigrations } = require('../src/db/migrations');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../data/production.db');
const MIGRATION_DIR = path.join(__dirname, '../src/db/migration-scripts');

// Check for command line arguments
const args = process.argv.slice(2);
const AUTO_FIX = args.includes('--auto-fix') || args.includes('-f');
const SILENT = args.includes('--silent') || args.includes('-s');

async function verifyDatabaseState() {
    console.log('Verifying database state...');
    
    // Check if database exists
    if (!fs.existsSync(DB_PATH)) {
        console.log('Database file not found. Creating new database...');
        // Ensure data directory exists
        const dataDir = path.dirname(DB_PATH);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
        const db = new Database(DB_PATH);
        db.exec('PRAGMA foreign_keys = ON;');
        await runMigrations(db);
        db.close();
        console.log('New database created and migrations applied.');
        return;
    }

    // Connect to existing database
    const db = new Database(DB_PATH);
    db.exec('PRAGMA foreign_keys = ON;');
    
    try {
        // Get applied migrations
        const appliedMigrations = db.prepare('SELECT version, name FROM schema_migrations ORDER BY version').all();
        console.log(`Found ${appliedMigrations.length} applied migrations.`);

        // Get all migration files
        const migrationFiles = fs.readdirSync(MIGRATION_DIR)
            .filter(file => file.endsWith('.sql'))
            .sort();
        
        console.log(`Found ${migrationFiles.length} migration files.`);

        // Check for missing migrations
        const appliedVersions = new Set(appliedMigrations.map(m => m.version));
        const missingMigrations = migrationFiles.filter(file => {
            const version = file.split('_')[0];
            return !appliedVersions.has(version);
        });

        if (missingMigrations.length > 0) {
            console.log('\nMissing migrations:');
            missingMigrations.forEach(file => console.log(`- ${file}`));
            
            let shouldApply = AUTO_FIX;
            
            if (!AUTO_FIX) {
                // Ask for confirmation
                console.log('\nWould you like to apply missing migrations? (y/n)');
                const readline = require('readline').createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                const answer = await new Promise(resolve => {
                    readline.question('> ', resolve);
                });
                readline.close();
                shouldApply = answer.toLowerCase() === 'y';
            }

            if (shouldApply) {
                console.log('\nApplying missing migrations...');
                await runMigrations(db);
                console.log('Migrations applied successfully.');
            } else {
                console.log('Skipping migration application.');
                if (!AUTO_FIX) {
                    process.exit(1); // Exit with error if user declines and not in auto-fix mode
                }
            }
        } else {
            console.log('No missing migrations found.');
        }

        // Verify critical tables and columns
        console.log('\nVerifying critical tables and columns...');
        
        // Check for narrative_threads column
        const puzzlesColumns = db.prepare("PRAGMA table_info(puzzles)").all();
        const hasNarrativeThreads = puzzlesColumns.some(col => col.name === 'narrative_threads');
        
        if (!hasNarrativeThreads) {
            console.log('WARNING: narrative_threads column missing from puzzles table.');
            console.log('This may indicate a failed migration.');
            
            // Ask for confirmation to fix
            console.log('\nWould you like to attempt to fix this? (y/n)');
            const readline = require('readline').createInterface({
                input: process.stdin,
                output: process.stdout
            });

            const answer = await new Promise(resolve => {
                readline.question('> ', resolve);
            });
            readline.close();

            if (answer.toLowerCase() === 'y') {
                console.log('\nAttempting to fix...');
                
                // Start transaction
                db.exec('BEGIN TRANSACTION');
                
                try {
                    // Add the column
                    db.exec('ALTER TABLE puzzles ADD COLUMN narrative_threads TEXT;');
                    
                    // Verify it was added
                    const columns = db.prepare("PRAGMA table_info(puzzles)").all();
                    if (columns.some(col => col.name === 'narrative_threads')) {
                        console.log('Successfully added narrative_threads column.');
                        db.exec('COMMIT');
                    } else {
                        throw new Error('Failed to add column');
                    }
                } catch (error) {
                    console.error('Failed to fix:', error.message);
                    db.exec('ROLLBACK');
                }
            } else {
                console.log('Skipping fix attempt.');
            }
        } else {
            console.log('narrative_threads column exists in puzzles table.');
        }

        // Check other critical columns
        const criticalColumns = {
            'timeline_events': ['act_focus'],
            'characters': ['resolution_paths'],
            'elements': ['resolution_paths', 'status', 'owner_id'],
            'puzzles': ['story_reveals']
        };

        for (const [table, columns] of Object.entries(criticalColumns)) {
            const tableColumns = db.prepare(`PRAGMA table_info(${table})`).all();
            const missingColumns = columns.filter(col => 
                !tableColumns.some(tc => tc.name === col)
            );

            if (missingColumns.length > 0) {
                console.log(`\nWARNING: Missing columns in ${table}:`);
                missingColumns.forEach(col => console.log(`- ${col}`));
            } else {
                console.log(`All critical columns present in ${table}.`);
            }
        }

    } catch (error) {
        console.error('Error verifying database:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Run the verification
verifyDatabaseState().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 