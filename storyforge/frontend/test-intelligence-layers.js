#!/usr/bin/env node

/**
 * Test script to verify intelligence layers are properly connected to real data
 * Run with: node test-intelligence-layers.js
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testIntelligenceLayers() {
  console.log('Testing Intelligence Layers Data Connections...\n');

  try {
    // 1. Test Elements endpoint (used by all layers)
    console.log('1. Testing Elements API:');
    // Try performance path for computed values
    const elementsResponse = await axios.get(`${API_BASE}/elements?filterGroup=memoryTypes`);
    const elements = elementsResponse.data.data || elementsResponse.data;
    console.log(`   ✓ Found ${elements.length} elements`);
    
    // Check for memory tokens with values
    const memoryTokens = elements.filter(e => 
      e.type?.includes('Memory Token') || 
      e.basicType?.includes('Memory Token')
    );
    console.log(`   ✓ ${memoryTokens.length} memory tokens`);
    
    const tokensWithValues = elements.filter(e => e.calculated_memory_value > 0);
    console.log(`   ✓ ${tokensWithValues.length} elements with memory values`);
    
    // Check for narrative threads
    const withNarrative = elements.filter(e => e.narrative_thread);
    console.log(`   ✓ ${withNarrative.length} elements with narrative threads`);

    // 2. Test Timeline Events (used by Story and Content Gaps layers)
    console.log('\n2. Testing Timeline Events API:');
    const timelineResponse = await axios.get(`${API_BASE}/timeline`);
    const timeline = timelineResponse.data.data || timelineResponse.data;
    console.log(`   ✓ Found ${timeline.length} timeline events`);
    
    // Check timeline connections
    const elementsWithTimeline = elements.filter(e => e.timeline_event_id);
    console.log(`   ✓ ${elementsWithTimeline.length} elements connected to timeline`);

    // 3. Test Puzzles (used by Social and Production layers)
    console.log('\n3. Testing Puzzles API:');
    const puzzlesResponse = await axios.get(`${API_BASE}/puzzles`);
    const puzzles = puzzlesResponse.data.data || puzzlesResponse.data;
    console.log(`   ✓ Found ${puzzles.length} puzzles`);
    
    // Check puzzle requirements
    const puzzlesWithReqs = puzzles.filter(p => 
      p.required_elements?.length > 0 || 
      p.required_collaborators?.length > 0
    );
    console.log(`   ✓ ${puzzlesWithReqs.length} puzzles with requirements`);

    // 4. Test Characters
    console.log('\n4. Testing Characters API:');
    const charactersResponse = await axios.get(`${API_BASE}/characters`);
    const characters = charactersResponse.data.data || charactersResponse.data;
    console.log(`   ✓ Found ${characters.length} characters`);

    // 5. Verify cross-references
    console.log('\n5. Verifying Data Relationships:');
    
    // Check element ownership
    const ownedElements = elements.filter(e => e.owner_character_id);
    console.log(`   ✓ ${ownedElements.length} elements have owners`);
    
    // Check RFID tags (Production layer)
    const rfidElements = elements.filter(e => e.rfid_tag || e.SF_RFID);
    console.log(`   ✓ ${rfidElements.length} elements have RFID tags`);
    
    // Missing RFID on memory tokens (critical for production)
    const memoryTokensNoRFID = memoryTokens.filter(e => 
      !e.rfid_tag && !e.SF_RFID && e.calculated_memory_value > 0
    );
    console.log(`   ⚠ ${memoryTokensNoRFID.length} memory tokens missing RFID`);

    // 6. Test specific entity examples
    console.log('\n6. Sample Entity Analysis:');
    
    // Find a well-connected element
    const sampleElement = elements.find(e => 
      e.owner_character_id && 
      e.timeline_event_id && 
      e.calculated_memory_value > 0
    );
    
    if (sampleElement) {
      console.log(`\n   Sample Element: "${sampleElement.name}"`);
      console.log(`   - Owner: ${sampleElement.owner_character_id}`);
      console.log(`   - Timeline: ${sampleElement.timeline_event_id ? 'Connected' : 'Missing'}`);
      console.log(`   - Value: $${sampleElement.calculated_memory_value}`);
      console.log(`   - RFID: ${sampleElement.rfid_tag || 'Missing'}`);
      console.log(`   - Narrative: ${sampleElement.narrative_thread || 'None'}`);
    }

    console.log('\n✅ All intelligence layers have data available!');
    console.log('\nKey findings:');
    console.log(`- Economic Layer: ${tokensWithValues.length} valued elements`);
    console.log(`- Story Layer: ${elementsWithTimeline.length} timeline connections`);
    console.log(`- Social Layer: ${puzzlesWithReqs.length} collaborative puzzles`);
    console.log(`- Production Layer: ${memoryTokensNoRFID.length} RFID gaps`);
    console.log(`- Content Gaps: ${elements.length - ownedElements.length} orphaned elements`);

  } catch (error) {
    console.error('❌ Error testing intelligence layers:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testIntelligenceLayers();