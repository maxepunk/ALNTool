const Database = require('better-sqlite3');
const path = require('path');
const ComputeOrchestrator = require('../src/services/compute/ComputeOrchestrator');

async function runFullCompute() {
  const dbPath = path.join(__dirname, '..', 'data', 'production.db');
  const db = new Database(dbPath);

  console.log('🔄 Running Full Compute Pipeline...\n');

  try {
    const orchestrator = new ComputeOrchestrator(db);
    
    // Run all compute services
    const stats = await orchestrator.computeAll();
    
    console.log('\n📊 Compute Pipeline Results:');
    console.log('=' + '='.repeat(79));
    console.log(`Total Processed: ${stats.processed}`);
    console.log(`Total Errors: ${stats.errors}`);
    
    if (stats.details) {
      console.log('\nDetailed Results:');
      Object.entries(stats.details).forEach(([service, result]) => {
        console.log(`\n📦 ${service}:`);
        if (result.processed !== undefined) {
          console.log(`   📈 Processed: ${result.processed}`);
        }
        if (result.errors !== undefined) {
          console.log(`   ⚠️  Errors: ${result.errors}`);
        }
      });
    }
    
    // Show some sample results
    console.log('\n\n🎯 Sample Results:');
    console.log('=' + '='.repeat(79));
    
    // Characters with memory values
    const topMemoryChars = db.prepare(`
      SELECT name, total_memory_value
      FROM characters
      WHERE total_memory_value > 0
      ORDER BY total_memory_value DESC
      LIMIT 5
    `).all();
    
    if (topMemoryChars.length > 0) {
      console.log('\n💎 Top Characters by Memory Value:');
      topMemoryChars.forEach(char => {
        console.log(`   - ${char.name}: $${char.total_memory_value}`);
      });
    }
    
    // Events with act focus
    const actFocusStats = db.prepare(`
      SELECT 
        act_focus, 
        COUNT(*) as count
      FROM timeline_events
      WHERE act_focus IS NOT NULL
      GROUP BY act_focus
      ORDER BY count DESC
    `).all();
    
    if (actFocusStats.length > 0) {
      console.log('\n🎭 Timeline Events by Act:');
      actFocusStats.forEach(stat => {
        console.log(`   - ${stat.act_focus}: ${stat.count} events`);
      });
    }
    
    // Characters with resolution paths
    const resolutionPathStats = db.prepare(`
      SELECT COUNT(*) as count
      FROM characters
      WHERE resolution_paths IS NOT NULL AND resolution_paths != '[]'
    `).get();
    
    console.log(`\n🛤️  Characters with Resolution Paths: ${resolutionPathStats.count}`);
    
    // Narrative threads in puzzles
    const narrativeThreadPuzzles = db.prepare(`
      SELECT COUNT(*) as count
      FROM puzzles
      WHERE narrative_threads IS NOT NULL AND narrative_threads != '[]'
    `).get();
    
    console.log(`\n📚 Puzzles with Narrative Threads: ${narrativeThreadPuzzles.count}`);
    
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    db.close();
  }
}

runFullCompute();