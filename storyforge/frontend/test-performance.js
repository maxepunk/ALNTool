#!/usr/bin/env node

// Quick performance test script for Day 9
const startTime = Date.now();

async function testAPIPerformance() {
  console.log('=== ALNTool Day 9 Performance Test ===\n');
  
  // Test 1: Characters API
  console.log('1. Testing Characters API...');
  const t1 = Date.now();
  const charsResponse = await fetch('http://localhost:3001/api/characters');
  const charsData = await charsResponse.json();
  const t1End = Date.now() - t1;
  console.log(`   ✓ Characters loaded: ${charsData.data.length} characters in ${t1End}ms`);
  
  // Test 2: Elements API (performance path)
  console.log('\n2. Testing Elements API (performance path)...');
  const t2 = Date.now();
  const elemResponse = await fetch('http://localhost:3001/api/elements?filterGroup=memoryTypes');
  const elemData = await elemResponse.json();
  const t2End = Date.now() - t2;
  console.log(`   ✓ Memory tokens loaded: ${elemData.data.length} tokens in ${t2End}ms`);
  
  // Test 3: Journey API for first character
  if (charsData.data.length > 0) {
    console.log('\n3. Testing Journey API...');
    const charId = charsData.data[0].id;
    const t3 = Date.now();
    const journeyResponse = await fetch(`http://localhost:3001/api/journeys/${charId}`);
    const journeyData = await journeyResponse.json();
    const t3End = Date.now() - t3;
    console.log(`   ✓ Journey loaded: ${journeyData.data.graph.nodes.length} nodes in ${t3End}ms`);
  }
  
  // Test 4: All elements (to see scale)
  console.log('\n4. Testing full Elements API...');
  const t4 = Date.now();
  const allElemResponse = await fetch('http://localhost:3001/api/elements');
  const allElemData = await allElemResponse.json();
  const t4End = Date.now() - t4;
  console.log(`   ✓ All elements loaded: ${allElemData.data.length} elements in ${t4End}ms`);
  
  const totalTime = Date.now() - startTime;
  console.log(`\n=== Total test time: ${totalTime}ms ===`);
  
  // Success criteria check
  const targetTime = 2000; // 2 seconds
  if (totalTime < targetTime) {
    console.log(`✅ PASS: All APIs responded within target time (${targetTime}ms)`);
  } else {
    console.log(`⚠️  WARNING: APIs took longer than target time (${targetTime}ms)`);
  }
}

testAPIPerformance().catch(console.error);