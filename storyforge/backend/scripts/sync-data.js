#!/usr/bin/env node

// IMPORTANT: Load environment variables FIRST, before any other requires
// This ensures process.env.NOTION_API_KEY is available when notionService initializes
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

/**
 * Data Sync CLI
 * 
 * Usage:
 *   node scripts/sync-data.js              # Sync all data
 *   node scripts/sync-data.js --status     # Check current database status
 */

const dataSyncService = require('../src/services/dataSyncService');
const { initializeDatabase, closeDB } = require('../src/db/database');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    // Initialize database first
    console.log('🔧 Initializing database...');
    initializeDatabase();
    
    const syncService = dataSyncService;

    if (command === '--status') {
      console.log('📊 Checking database status...');
      const status = await syncService.getSyncStatus();
      
      if (status.success) {
        console.log('\n📋 Current Database Status:');
        console.log('============================');
        Object.entries(status.counts).forEach(([table, count]) => {
          console.log(`${table}: ${count} records`);
        });
        console.log(`Last checked: ${status.lastSync}`);
      } else {
        console.error('❌ Failed to get status:', status.error);
        process.exit(1);
      }
    } else {
      // Default: run full sync
      console.log('🚀 Running full data sync...');
      const result = await syncService.syncAll();
      
      if (result.success) {
        console.log('✅ Sync completed successfully!');
        process.exit(0);
      } else {
        console.error('❌ Sync failed:', result.error);
        process.exit(1);
      }
    }
  } catch (error) {
    console.error('💥 Script failed:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Sync interrupted by user');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Sync terminated');
  process.exit(1);
});

main(); 