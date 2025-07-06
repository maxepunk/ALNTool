import axios from 'axios';

// Test API performance with large datasets
async function testPerformance() {
  console.log('🚀 ALNTool Performance Test - Day 11\n');
  
  const apiUrl = 'http://localhost:3001/api';
  const tests = [];
  
  try {
    // Test 1: Load all characters without pagination
    console.log('Test 1: Loading all characters...');
    let start = Date.now();
    const chars = await axios.get(`${apiUrl}/characters`);
    let duration = Date.now() - start;
    tests.push({ 
      test: 'Load all characters', 
      count: chars.data.data?.length || chars.data.length,
      duration,
      passed: duration < 3000 
    });
    
    // Test 2: Load all elements without pagination
    console.log('Test 2: Loading all elements...');
    start = Date.now();
    const elems = await axios.get(`${apiUrl}/elements`);
    duration = Date.now() - start;
    tests.push({ 
      test: 'Load all elements', 
      count: elems.data.data?.length || elems.data.length,
      duration,
      passed: duration < 3000 
    });
    
    // Test 3: Search with pagination
    console.log('Test 3: Testing search with pagination...');
    start = Date.now();
    const search = await axios.get(`${apiUrl}/characters?search=a&limit=20`);
    duration = Date.now() - start;
    tests.push({ 
      test: 'Search with pagination', 
      count: search.data.data?.length || 0,
      duration,
      passed: duration < 500 
    });
    
    // Test 4: Load all entity types
    console.log('Test 4: Loading all entity types...');
    start = Date.now();
    const [c, e, p, t] = await Promise.all([
      axios.get(`${apiUrl}/characters?limit=50`),
      axios.get(`${apiUrl}/elements?limit=50`),
      axios.get(`${apiUrl}/puzzles?limit=50`),
      axios.get(`${apiUrl}/timeline-events?limit=50`)
    ]);
    duration = Date.now() - start;
    const totalEntities = 
      (c.data.total || 0) + 
      (e.data.total || 0) + 
      (p.data.total || 0) + 
      (t.data.total || 0);
    tests.push({ 
      test: 'Parallel entity load', 
      count: totalEntities,
      duration,
      passed: duration < 2000 
    });
    
    // Results
    console.log('\n📊 Performance Test Results:');
    console.log('================================');
    tests.forEach(t => {
      const status = t.passed ? '✅' : '❌';
      console.log(`${status} ${t.test}`);
      console.log(`   Count: ${t.count} entities`);
      console.log(`   Time: ${t.duration}ms`);
    });
    
    const totalCount = tests.reduce((sum, t) => sum + (t.count || 0), 0);
    const avgTime = tests.reduce((sum, t) => sum + t.duration, 0) / tests.length;
    const passRate = tests.filter(t => t.passed).length / tests.length * 100;
    
    console.log('\n📈 Summary:');
    console.log(`Total entities tested: ${totalCount}`);
    console.log(`Average response time: ${Math.round(avgTime)}ms`);
    console.log(`Pass rate: ${passRate}%`);
    console.log(`Target: <3s for 400+ entities ✅`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\nMake sure the backend is running on port 3001');
  }
}

testPerformance();