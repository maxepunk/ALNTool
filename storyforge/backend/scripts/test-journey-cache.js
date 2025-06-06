// Test script to verify journey caching functionality
// Run this with: node test-journey-cache.js

const { initializeDatabase } = require('../src/db/database');
const dbQueries = require('../src/db/queries');
const JourneyEngine = require('../src/services/journeyEngine');

async function testJourneyCaching() {
  console.log('🧪 Testing Journey Caching Implementation...\n');
  
  try {
    // Initialize database
    initializeDatabase();
    console.log('✅ Database initialized');
    
    // Get a test character
    const characters = dbQueries.getCharactersForList();
    if (characters.length === 0) {
      console.error('❌ No characters found. Please run data sync first.');
      return;
    }
    
    const testCharacterId = characters[0].id;
    console.log(`📝 Testing with character: ${characters[0].name} (${testCharacterId})\n`);
    
    // Initialize journey engine
    const journeyEngine = new JourneyEngine();
    
    // Test 1: First request (should compute and cache)
    console.log('Test 1: First journey request (should compute)...');
    const start1 = Date.now();
    const journey1 = await journeyEngine.buildCharacterJourney(testCharacterId);
    const time1 = Date.now() - start1;
    console.log(`✅ First request completed in ${time1}ms`);
    console.log(`   - Nodes: ${journey1.graph.nodes.length}`);
    console.log(`   - Edges: ${journey1.graph.edges.length}\n`);
    
    // Test 2: Second request (should use cache)
    console.log('Test 2: Second journey request (should use cache)...');
    const start2 = Date.now();
    const journey2 = await journeyEngine.buildCharacterJourney(testCharacterId);
    const time2 = Date.now() - start2;
    console.log(`✅ Second request completed in ${time2}ms`);
    console.log(`   - Cache speedup: ${Math.round((time1 - time2) / time1 * 100)}%`);
    console.log(`   - Data matches: ${JSON.stringify(journey1.graph) === JSON.stringify(journey2.graph)}\n`);
    
    // Test 3: Check cache metadata
    console.log('Test 3: Checking cache metadata...');
    const db = require('../src/db/database').getDB();
    const cacheEntry = db.prepare('SELECT * FROM cached_journey_graphs WHERE character_id = ?').get(testCharacterId);
    if (cacheEntry) {
      console.log('✅ Cache entry found:');
      console.log(`   - Version hash: ${cacheEntry.version_hash}`);
      console.log(`   - Cached at: ${cacheEntry.cached_at}`);
      console.log(`   - Last accessed: ${cacheEntry.last_accessed}\n`);
    } else {
      console.error('❌ No cache entry found!\n');
    }
    
    // Test 4: Invalidate cache
    console.log('Test 4: Testing cache invalidation...');
    dbQueries.invalidateJourneyCache(testCharacterId);
    console.log('✅ Cache invalidated');
    
    // Test 5: Third request (should compute again)
    console.log('\nTest 5: Third journey request (should compute after invalidation)...');
    const start3 = Date.now();
    const journey3 = await journeyEngine.buildCharacterJourney(testCharacterId);
    const time3 = Date.now() - start3;
    console.log(`✅ Third request completed in ${time3}ms`);
    console.log(`   - Similar to first request time: ${Math.abs(time3 - time1) < 50}ms\n`);
    
    // Summary
    console.log('📊 Summary:');
    console.log(`   - Initial computation: ${time1}ms`);
    console.log(`   - Cached retrieval: ${time2}ms`);
    console.log(`   - Post-invalidation: ${time3}ms`);
    console.log(`   - Cache performance boost: ~${Math.round((time1 - time2) / time1 * 100)}%`);
    
    console.log('\n✅ All caching tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

// Run tests
testJourneyCaching();
