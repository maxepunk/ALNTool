#!/usr/bin/env node

/**
 * Validate Notion Schema Against Documentation
 * 
 * This script queries the Notion API directly to verify:
 * 1. Actual property names in each database
 * 2. Property types and configurations
 * 3. Sample data to understand usage patterns
 * 4. Compare against SCHEMA_MAPPING_GUIDE.md claims
 */

require('dotenv').config();
const { Client } = require('@notionhq/client');

// Initialize Notion client
const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Database IDs from the service
const DB_IDS = {
  CHARACTERS: process.env.NOTION_CHARACTERS_DB || '18c2f33d583f8060a6abde32ff06bca2',
  TIMELINE: process.env.NOTION_TIMELINE_DB || '1b52f33d583f80deae5ad20020c120dd',
  PUZZLES: process.env.NOTION_PUZZLES_DB || '1b62f33d583f80cc87cfd7d6c4b0b265',
  ELEMENTS: process.env.NOTION_ELEMENTS_DB || '18c2f33d583f802091bcd84c7dd94306',
};

async function validateDatabase(name, databaseId) {
  console.log(`\n=== Validating ${name} Database ===`);
  console.log(`Database ID: ${databaseId}`);
  
  try {
    // Get database schema
    const database = await notion.databases.retrieve({ database_id: databaseId });
    
    console.log('\nProperties:');
    const properties = database.properties;
    const propertyList = [];
    
    for (const [propName, propConfig] of Object.entries(properties)) {
      propertyList.push({
        name: propName,
        type: propConfig.type,
        id: propConfig.id,
        ...(propConfig.relation ? { relation_db: propConfig.relation.database_id } : {}),
        ...(propConfig.rollup ? { rollup_property: propConfig.rollup.relation_property_name } : {}),
      });
    }
    
    // Sort by name for consistent output
    propertyList.sort((a, b) => a.name.localeCompare(b.name));
    
    propertyList.forEach(prop => {
      console.log(`  - ${prop.name}: ${prop.type}${prop.relation_db ? ` → ${prop.relation_db}` : ''}${prop.rollup_property ? ` (rollup of ${prop.rollup_property})` : ''}`);
    });
    
    // Get sample data
    console.log('\nSample Data (first 3 records):');
    const response = await notion.databases.query({
      database_id: databaseId,
      page_size: 3,
    });
    
    console.log(`Total records: ${response.results.length} (of many)`);
    
    // Show sample property values
    if (response.results.length > 0) {
      console.log('\nSample property values from first record:');
      const firstRecord = response.results[0];
      const sampleProps = {};
      
      for (const [propName, propValue] of Object.entries(firstRecord.properties)) {
        const type = propValue.type;
        let value = 'empty';
        
        switch (type) {
          case 'title':
            value = propValue.title.map(t => t.plain_text).join('') || 'empty';
            break;
          case 'rich_text':
            value = propValue.rich_text.map(t => t.plain_text).join('') || 'empty';
            break;
          case 'select':
            value = propValue.select?.name || 'empty';
            break;
          case 'multi_select':
            value = propValue.multi_select.map(s => s.name).join(', ') || 'empty';
            break;
          case 'relation':
            value = `${propValue.relation.length} relation(s)`;
            break;
          case 'number':
            value = propValue.number ?? 'empty';
            break;
          case 'checkbox':
            value = propValue.checkbox;
            break;
          case 'date':
            value = propValue.date?.start || 'empty';
            break;
          case 'formula':
            value = `formula result: ${JSON.stringify(propValue.formula)}`;
            break;
          case 'rollup':
            value = `rollup result: ${JSON.stringify(propValue.rollup)}`;
            break;
          default:
            value = `[${type}]`;
        }
        
        sampleProps[propName] = { type, value };
      }
      
      // Show sorted sample values
      Object.keys(sampleProps).sort().forEach(key => {
        const { type, value } = sampleProps[key];
        console.log(`  ${key} (${type}): ${value}`);
      });
    }
    
    return { name, properties: propertyList, sampleCount: response.results.length };
    
  } catch (error) {
    console.error(`Error validating ${name}:`, error.message);
    return { name, error: error.message };
  }
}

async function validateSpecificIssues() {
  console.log('\n\n=== VALIDATING SPECIFIC DOCUMENTATION CLAIMS ===');
  
  try {
    // 1. Check character relationships
    console.log('\n1. Checking Character Relationships:');
    const charResponse = await notion.databases.query({
      database_id: DB_IDS.CHARACTERS,
      page_size: 100,
    });
    
    let totalSharedEvents = 0;
    let totalSharedPuzzles = 0;
    let totalSharedElements = 0;
    
    for (const char of charResponse.results) {
      const events = char.properties['Events']?.relation?.length || 0;
      const puzzles = char.properties['Character Puzzles']?.relation?.length || 0;
      const owned = char.properties['Owned Elements']?.relation?.length || 0;
      const associated = char.properties['Associated Elements']?.relation?.length || 0;
      
      totalSharedEvents += events;
      totalSharedPuzzles += puzzles;
      totalSharedElements += owned + associated;
    }
    
    console.log(`  Total character-event relations: ${totalSharedEvents}`);
    console.log(`  Total character-puzzle relations: ${totalSharedPuzzles}`);
    console.log(`  Total character-element relations: ${totalSharedElements}`);
    console.log(`  → Should produce character links if characters share any of these`);
    
    // 2. Check puzzle sync issues
    console.log('\n2. Checking Puzzle Data Quality:');
    const puzzleResponse = await notion.databases.query({
      database_id: DB_IDS.PUZZLES,
      page_size: 100,
    });
    
    let puzzlesWithoutOwner = 0;
    let puzzlesWithoutLockedItem = 0;
    let puzzlesWithData = 0;
    
    for (const puzzle of puzzleResponse.results) {
      const owner = puzzle.properties['Owner']?.relation?.length || 0;
      const lockedItem = puzzle.properties['Locked Item']?.relation?.length || 0;
      
      if (owner === 0) puzzlesWithoutOwner++;
      if (lockedItem === 0) puzzlesWithoutLockedItem++;
      if (owner > 0 || lockedItem > 0) puzzlesWithData++;
    }
    
    console.log(`  Total puzzles: ${puzzleResponse.results.length}`);
    console.log(`  Puzzles without owner: ${puzzlesWithoutOwner}`);
    console.log(`  Puzzles without locked item: ${puzzlesWithoutLockedItem}`);
    console.log(`  Puzzles with some data: ${puzzlesWithData}`);
    console.log(`  → Missing foreign keys might explain sync failures`);
    
    // 3. Check memory values in elements
    console.log('\n3. Checking Memory Value Data:');
    const elementsResponse = await notion.databases.query({
      database_id: DB_IDS.ELEMENTS,
      filter: {
        or: [
          { property: 'Basic Type', select: { equals: 'Memory Token Video' } },
          { property: 'Basic Type', select: { equals: 'Memory Token' } },
        ]
      },
      page_size: 10,
    });
    
    let memoryTokensWithSF = 0;
    console.log(`  Checking ${elementsResponse.results.length} memory tokens...`);
    
    for (const element of elementsResponse.results) {
      const description = element.properties['Description/Text']?.rich_text?.map(t => t.plain_text).join('') || '';
      if (description.includes('SF_')) {
        memoryTokensWithSF++;
        console.log(`  ✓ Found SF_ fields in: ${element.properties['Name']?.title?.[0]?.plain_text}`);
      }
    }
    
    console.log(`  Memory tokens with SF_ data: ${memoryTokensWithSF}/${elementsResponse.results.length}`);
    
  } catch (error) {
    console.error('Error in specific validation:', error.message);
  }
}

async function main() {
  console.log('Notion Schema Validation Script');
  console.log('================================');
  
  if (!process.env.NOTION_API_KEY) {
    console.error('ERROR: NOTION_API_KEY not found in environment');
    console.error('Please add it to your .env file');
    process.exit(1);
  }
  
  const results = [];
  
  // Validate each database
  for (const [name, id] of Object.entries(DB_IDS)) {
    const result = await validateDatabase(name, id);
    results.push(result);
  }
  
  // Validate specific claims from documentation
  await validateSpecificIssues();
  
  // Summary
  console.log('\n\n=== VALIDATION SUMMARY ===');
  results.forEach(result => {
    if (result.error) {
      console.log(`❌ ${result.name}: ERROR - ${result.error}`);
    } else {
      console.log(`✅ ${result.name}: ${result.properties.length} properties found`);
    }
  });
  
  console.log('\n💡 Next Steps:');
  console.log('1. Compare these actual properties against SCHEMA_MAPPING_GUIDE.md');
  console.log('2. Update documentation to reflect reality');
  console.log('3. Investigate why character relationships produce 0 links despite having data');
  console.log('4. Check if puzzle sync failures are due to optional foreign keys');
  console.log('5. Verify memory value extraction is properly integrated');
}

main().catch(console.error);