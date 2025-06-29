/**
 * Debug script to identify why 17/32 puzzles are failing sync
 */

const { getDB, initializeDatabase } = require('../src/db/database');
const notionService = require('../src/services/notionService');
const propertyMapper = require('../src/utils/notionPropertyMapper');

async function debugPuzzleSync() {
  try {
    console.log('🔍 Debugging Puzzle Sync Issues...\n');
    
    // Initialize database
    await initializeDatabase();
    const db = getDB();
    
    // Fetch puzzles from Notion
    console.log('Fetching puzzles from Notion...');
    const notionPuzzles = await notionService.getPuzzles();
    console.log(`Found ${notionPuzzles.length} puzzles in Notion\n`);
    
    // Track issues
    const issues = {
      missingOwner: [],
      invalidLockedItem: [],
      malformedRewards: [],
      mappingErrors: [],
      otherErrors: []
    };
    
    // Check each puzzle
    for (const puzzle of notionPuzzles) {
      try {
        // Try to map the puzzle
        const mapped = await propertyMapper.mapPuzzleWithNames(puzzle, notionService);
        
        if (mapped.error) {
          issues.mappingErrors.push({
            id: puzzle.id,
            error: mapped.error
          });
          continue;
        }
        
        // Check owner_id
        if (mapped.owner_id) {
          const ownerExists = db.prepare('SELECT id FROM characters WHERE id = ?').get(mapped.owner_id);
          if (!ownerExists) {
            issues.missingOwner.push({
              id: puzzle.id,
              name: mapped.name,
              owner_id: mapped.owner_id
            });
          }
        }
        
        // Check locked_item_id
        if (mapped.locked_item_id) {
          const itemExists = db.prepare('SELECT id FROM elements WHERE id = ?').get(mapped.locked_item_id);
          if (!itemExists) {
            issues.invalidLockedItem.push({
              id: puzzle.id,
              name: mapped.name,
              locked_item_id: mapped.locked_item_id
            });
          }
        }
        
        // Check reward_ids format
        if (mapped.reward_ids) {
          try {
            const rewards = JSON.parse(mapped.reward_ids);
            if (!Array.isArray(rewards)) {
              throw new Error('reward_ids is not an array');
            }
          } catch (e) {
            issues.malformedRewards.push({
              id: puzzle.id,
              name: mapped.name,
              reward_ids: mapped.reward_ids,
              error: e.message
            });
          }
        }
        
      } catch (error) {
        issues.otherErrors.push({
          id: puzzle.id,
          error: error.message
        });
      }
    }
    
    // Report findings
    console.log('📊 Puzzle Sync Issue Summary:\n');
    console.log(`❌ Missing Owner References: ${issues.missingOwner.length}`);
    if (issues.missingOwner.length > 0) {
      console.log('   Examples:');
      issues.missingOwner.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name} (owner: ${p.owner_id})`);
      });
    }
    
    console.log(`\n❌ Invalid Locked Item References: ${issues.invalidLockedItem.length}`);
    if (issues.invalidLockedItem.length > 0) {
      console.log('   Examples:');
      issues.invalidLockedItem.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name} (item: ${p.locked_item_id})`);
      });
    }
    
    console.log(`\n❌ Malformed Reward IDs: ${issues.malformedRewards.length}`);
    if (issues.malformedRewards.length > 0) {
      console.log('   Examples:');
      issues.malformedRewards.slice(0, 3).forEach(p => {
        console.log(`   - ${p.name}: ${p.error}`);
      });
    }
    
    console.log(`\n❌ Mapping Errors: ${issues.mappingErrors.length}`);
    if (issues.mappingErrors.length > 0) {
      console.log('   Examples:');
      issues.mappingErrors.slice(0, 3).forEach(p => {
        console.log(`   - ${p.id}: ${p.error}`);
      });
    }
    
    console.log(`\n❌ Other Errors: ${issues.otherErrors.length}`);
    if (issues.otherErrors.length > 0) {
      console.log('   Examples:');
      issues.otherErrors.slice(0, 3).forEach(p => {
        console.log(`   - ${p.id}: ${p.error}`);
      });
    }
    
    // Check current database state
    const dbPuzzleCount = db.prepare('SELECT COUNT(*) as count FROM puzzles').get();
    console.log(`\n📊 Database State:`);
    console.log(`   Puzzles in DB: ${dbPuzzleCount.count}`);
    console.log(`   Puzzles in Notion: ${notionPuzzles.length}`);
    console.log(`   Missing: ${notionPuzzles.length - dbPuzzleCount.count}`);
    
    // Return detailed report
    return {
      totalPuzzles: notionPuzzles.length,
      syncedPuzzles: dbPuzzleCount.count,
      failedPuzzles: notionPuzzles.length - dbPuzzleCount.count,
      issues
    };
    
  } catch (error) {
    console.error('Debug script failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  debugPuzzleSync()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = debugPuzzleSync;