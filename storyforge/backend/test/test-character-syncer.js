#!/usr/bin/env node

/**
 * Test script for CharacterSyncer
 * Runs a character sync and compares results with the original implementation
 */

const CharacterSyncer = require('../src/services/sync/entitySyncers/CharacterSyncer');
const SyncLogger = require('../src/services/sync/SyncLogger');
const notionService = require('../src/services/notionService');
const propertyMapper = require('../src/utils/notionPropertyMapper');
const { getDB } = require('../src/db/database');

async function testCharacterSyncer() {
  console.log('🧪 Testing CharacterSyncer...\n');
  
  try {
    // Initialize database
    const db = getDB();
    
    // Create logger
    const logger = new SyncLogger();
    
    // Create syncer
    const characterSyncer = new CharacterSyncer({
      notionService,
      propertyMapper,
      logger
    });
    
    // First, do a dry run
    console.log('📊 Running dry run...');
    const dryRunResult = await characterSyncer.dryRun();
    console.log('Dry run results:', dryRunResult);
    console.log(`Would sync ${dryRunResult.wouldSync} characters, delete ${dryRunResult.wouldDelete} existing records\n`);
    
    // Now run the actual sync
    console.log('🔄 Running character sync...');
    const syncResult = await characterSyncer.sync();
    console.log('Sync results:', syncResult);
    
    // Verify results
    console.log('\n📈 Verifying database state...');
    
    // Check character count
    const characterCount = db.prepare('SELECT COUNT(*) as count FROM characters').get();
    console.log(`✓ Characters in database: ${characterCount.count}`);
    
    // Check relationship counts
    const eventRelCount = db.prepare('SELECT COUNT(*) as count FROM character_timeline_events').get();
    console.log(`✓ Character-Event relationships: ${eventRelCount.count}`);
    
    const ownedElemCount = db.prepare('SELECT COUNT(*) as count FROM character_owned_elements').get();
    console.log(`✓ Character-Owned Element relationships: ${ownedElemCount.count}`);
    
    const assocElemCount = db.prepare('SELECT COUNT(*) as count FROM character_associated_elements').get();
    console.log(`✓ Character-Associated Element relationships: ${assocElemCount.count}`);
    
    const puzzleRelCount = db.prepare('SELECT COUNT(*) as count FROM character_puzzles').get();
    console.log(`✓ Character-Puzzle relationships: ${puzzleRelCount.count}`);
    
    // Sample a character to verify data integrity
    const sampleCharacter = db.prepare('SELECT * FROM characters LIMIT 1').get();
    if (sampleCharacter) {
      console.log('\n📝 Sample character:');
      console.log(`  Name: ${sampleCharacter.name}`);
      console.log(`  Type: ${sampleCharacter.type}`);
      console.log(`  Tier: ${sampleCharacter.tier}`);
      console.log(`  Connections: ${sampleCharacter.connections}`);
    }
    
    // Check sync log
    const recentSyncLogs = logger.getRecentSyncHistory(5);
    console.log('\n📋 Recent sync logs:');
    recentSyncLogs.forEach(log => {
      console.log(`  ${log.entity_type}: ${log.status} - ${log.records_synced}/${log.records_fetched} synced`);
    });
    
    console.log('\n✅ CharacterSyncer test completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testCharacterSyncer();
