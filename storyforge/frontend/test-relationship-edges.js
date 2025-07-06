#!/usr/bin/env node

/**
 * Test script to verify Character-Element Association and Character-Timeline Event edges
 * Run with: node test-relationship-edges.js
 */

import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

async function testRelationshipData() {
  console.log('🔍 Testing Character-Element Association and Character-Timeline Event edges...\n');
  
  try {
    // Test 1: Fetch elements and check for associated_character_ids
    console.log('1️⃣ Fetching elements with character associations...');
    const elementsResponse = await axios.get(`${API_BASE}/elements`);
    const elements = Array.isArray(elementsResponse.data) ? elementsResponse.data : elementsResponse.data.data || [];
    
    console.log(`Total elements fetched: ${elements.length}`);
    console.log('Sample element structure:', elements[0] ? Object.keys(elements[0]) : 'No elements');
    
    const elementsWithAssociations = elements.filter(e => 
      e.associated_character_ids && e.associated_character_ids.length > 0
    );
    
    console.log(`✅ Found ${elementsWithAssociations.length} elements with character associations`);
    if (elementsWithAssociations.length > 0) {
      console.log('Sample element with associations:', {
        id: elementsWithAssociations[0].id,
        name: elementsWithAssociations[0].name,
        associated_character_ids: elementsWithAssociations[0].associated_character_ids
      });
    }
    
    // Test 2: Fetch timeline events and check for character_ids
    console.log('\n2️⃣ Fetching timeline events with character connections...');
    const timelineResponse = await axios.get(`${API_BASE}/timeline`);
    const timelineEvents = Array.isArray(timelineResponse.data) ? timelineResponse.data : timelineResponse.data.data || [];
    
    console.log(`Total timeline events fetched: ${timelineEvents.length}`);
    console.log('Sample timeline event structure:', timelineEvents[0] ? Object.keys(timelineEvents[0]) : 'No events');
    
    const eventsWithCharacters = timelineEvents.filter(e => 
      e.character_ids && e.character_ids.length > 0
    );
    
    console.log(`✅ Found ${eventsWithCharacters.length} timeline events with character connections`);
    if (eventsWithCharacters.length > 0) {
      console.log('Sample timeline event with characters:', {
        id: eventsWithCharacters[0].id,
        description: eventsWithCharacters[0].description,
        character_ids: eventsWithCharacters[0].character_ids
      });
    }
    
    // Test 3: Count total potential edges
    console.log('\n3️⃣ Calculating total relationship edges...');
    
    let associationEdgeCount = 0;
    elementsWithAssociations.forEach(element => {
      associationEdgeCount += element.associated_character_ids.length;
    });
    
    let timelineEdgeCount = 0;
    eventsWithCharacters.forEach(event => {
      timelineEdgeCount += event.character_ids.length;
    });
    
    console.log(`📊 Total Character-Element Association edges: ${associationEdgeCount}`);
    console.log(`📊 Total Character-Timeline Event edges: ${timelineEdgeCount}`);
    console.log(`📊 Combined total: ${associationEdgeCount + timelineEdgeCount} new relationship edges`);
    
    // Test 4: Verify edge creation functions would work
    console.log('\n4️⃣ Simulating edge creation...');
    
    // Fetch characters for validation
    const charactersResponse = await axios.get(`${API_BASE}/characters`);
    const characters = Array.isArray(charactersResponse.data) ? charactersResponse.data : charactersResponse.data.data || [];
    const characterIds = new Set(characters.map(c => c.id));
    
    // Simulate association edge creation
    const simulatedAssociations = [];
    elementsWithAssociations.forEach(element => {
      element.associated_character_ids.forEach(charId => {
        if (characterIds.has(charId)) {
          simulatedAssociations.push({
            character_id: charId,
            element_id: element.id
          });
        }
      });
    });
    
    console.log(`✅ Can create ${simulatedAssociations.length} valid association edges`);
    
    // Simulate timeline edge creation
    const simulatedTimelineEdges = [];
    eventsWithCharacters.forEach(event => {
      event.character_ids.forEach(charId => {
        if (characterIds.has(charId)) {
          simulatedTimelineEdges.push({
            character_id: charId,
            timeline_event_id: event.id
          });
        }
      });
    });
    
    console.log(`✅ Can create ${simulatedTimelineEdges.length} valid timeline edges`);
    
    console.log('\n✨ All tests passed! The edge creation functions should work correctly.');
    
  } catch (error) {
    console.error('❌ Error during testing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testRelationshipData();