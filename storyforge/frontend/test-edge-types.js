#!/usr/bin/env node

/**
 * Test script to verify all 7 edge types are working correctly
 * Run from frontend directory: node test-edge-types.js
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001';

async function testEdgeTypes() {
  console.log('🔍 Testing all 7 edge types in ALNTool...\n');
  
  try {
    // 1. Fetch all entities
    console.log('📡 Fetching entities...');
    const [charactersRes, elementsRes, puzzlesRes, timelineRes, linksRes] = await Promise.all([
      axios.get(`${API_BASE}/api/characters`),
      axios.get(`${API_BASE}/api/elements`),
      axios.get(`${API_BASE}/api/puzzles`),
      axios.get(`${API_BASE}/api/timeline`),
      axios.get(`${API_BASE}/api/character-links`)
    ]);
    
    const characters = charactersRes.data.data;
    const elements = elementsRes.data.data;
    const puzzles = puzzlesRes.data.data;
    const timelineEvents = timelineRes.data.data;
    const characterLinks = linksRes.data.data;
    
    console.log(`✅ Found ${characters.length} characters`);
    console.log(`✅ Found ${elements.length} elements`);
    console.log(`✅ Found ${puzzles.length} puzzles`);
    console.log(`✅ Found ${timelineEvents.length} timeline events`);
    console.log(`✅ Found ${characterLinks.length} character links\n`);
    
    // 2. Test each edge type
    console.log('🔗 Checking edge types:\n');
    
    // Edge Type 1: Character-Character (via shared entities)
    console.log('1️⃣ Character-Character edges (via character links):');
    if (characterLinks.length > 0) {
      console.log(`   ✅ ${characterLinks.length} character relationships found`);
      const sample = characterLinks[0];
      console.log(`   Example: ${sample.character_a_name} <-> ${sample.character_b_name}`);
    } else {
      console.log('   ⚠️  No character relationships found');
    }
    
    // Edge Type 2: Character-Element Ownership
    console.log('\n2️⃣ Character-Element Ownership edges:');
    const ownedElements = elements.filter(e => e.owner && e.owner.length > 0);
    if (ownedElements.length > 0) {
      console.log(`   ✅ ${ownedElements.length} owned elements found`);
      const sample = ownedElements[0];
      console.log(`   Example: ${sample.owner[0].name} owns ${sample.name}`);
    } else {
      console.log('   ⚠️  No owned elements found');
    }
    
    // Edge Type 3: Character-Element Association
    console.log('\n3️⃣ Character-Element Association edges:');
    const associatedElements = elements.filter(e => e.associatedCharacters && e.associatedCharacters.length > 0);
    if (associatedElements.length > 0) {
      console.log(`   ✅ ${associatedElements.length} elements with character associations`);
      const sample = associatedElements[0];
      const charNames = sample.associatedCharacters.map(c => c.name).join(', ');
      console.log(`   Example: ${sample.name} associated with ${charNames}`);
    } else {
      console.log('   ⚠️  No character-element associations found');
    }
    
    // Edge Type 4: Element-Element Container
    console.log('\n4️⃣ Element-Element Container edges:');
    const containedElements = elements.filter(e => e.container && e.container.length > 0);
    if (containedElements.length > 0) {
      console.log(`   ✅ ${containedElements.length} contained elements found`);
      const sample = containedElements[0];
      console.log(`   Example: ${sample.name} contained in ${sample.container[0].name}`);
    } else {
      console.log('   ⚠️  No container relationships found');
    }
    
    // Edge Type 5: Puzzle-Element Reward
    console.log('\n5️⃣ Puzzle-Element Reward edges:');
    const puzzlesWithRewards = puzzles.filter(p => p.rewards && p.rewards.length > 0);
    if (puzzlesWithRewards.length > 0) {
      console.log(`   ✅ ${puzzlesWithRewards.length} puzzles with rewards`);
      const sample = puzzlesWithRewards[0];
      const rewardNames = sample.rewards.map(r => r.name).join(', ');
      console.log(`   Example: ${sample.puzzle} rewards ${rewardNames}`);
    } else {
      console.log('   ⚠️  No puzzle rewards found');
    }
    
    // Edge Type 6: Element-Puzzle Requirement
    console.log('\n6️⃣ Element-Puzzle Requirement edges:');
    const puzzlesWithRequirements = puzzles.filter(p => p.puzzleElements && p.puzzleElements.length > 0);
    if (puzzlesWithRequirements.length > 0) {
      console.log(`   ✅ ${puzzlesWithRequirements.length} puzzles with requirements`);
      const sample = puzzlesWithRequirements[0];
      const reqNames = sample.puzzleElements.map(e => e.name).join(', ');
      console.log(`   Example: ${sample.puzzle} requires ${reqNames}`);
    } else {
      console.log('   ⚠️  No puzzle requirements found');
    }
    
    // Edge Type 7: Character-Timeline Event
    console.log('\n7️⃣ Character-Timeline Event edges:');
    const eventsWithCharacters = timelineEvents.filter(e => 
      e.properties && 
      e.properties['Characters Involved'] && 
      e.properties['Characters Involved'].relation && 
      e.properties['Characters Involved'].relation.length > 0
    );
    if (eventsWithCharacters.length > 0) {
      console.log(`   ✅ ${eventsWithCharacters.length} timeline events with characters`);
      const sample = eventsWithCharacters[0];
      const description = sample.properties.Description?.title?.[0]?.plain_text || 'No description';
      console.log(`   Example: "${description}" involves ${sample.properties['Characters Involved'].relation.length} characters`);
    } else {
      console.log('   ⚠️  No character-timeline connections found');
    }
    
    // Summary
    console.log('\n📊 Edge Type Summary:');
    console.log('─────────────────────────────────────────────');
    console.log(`Character-Character:        ${characterLinks.length > 0 ? '✅' : '❌'} (${characterLinks.length} edges)`);
    console.log(`Character-Element Owner:    ${ownedElements.length > 0 ? '✅' : '❌'} (${ownedElements.length} edges)`);
    console.log(`Character-Element Assoc:    ${associatedElements.length > 0 ? '✅' : '❌'} (${associatedElements.length} edges)`);
    console.log(`Element-Element Container:  ${containedElements.length > 0 ? '✅' : '❌'} (${containedElements.length} edges)`);
    console.log(`Puzzle-Element Reward:      ${puzzlesWithRewards.length > 0 ? '✅' : '❌'} (${puzzlesWithRewards.length} edges)`);
    console.log(`Element-Puzzle Require:     ${puzzlesWithRequirements.length > 0 ? '✅' : '❌'} (${puzzlesWithRequirements.length} edges)`);
    console.log(`Character-Timeline:         ${eventsWithCharacters.length > 0 ? '✅' : '❌'} (${eventsWithCharacters.length} edges)`);
    
  } catch (error) {
    console.error('❌ Error testing edge types:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Run the test
testEdgeTypes();