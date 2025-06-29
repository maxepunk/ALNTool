const NotionService = require('../src/services/notionService');
const notionService = new NotionService();

async function examineMemoryTags() {
  try {
    // Initialize the service
    await notionService.init();
    
    // Fetch elements
    const elements = await notionService.fetchElements();
    
    // Filter for elements with SF_ tags
    const elementsWithTags = elements.filter(elem => 
      elem.Description && elem.Description.includes('SF_')
    );
    
    console.log(`Found ${elementsWithTags.length} elements with SF_ tags out of ${elements.length} total\n`);
    
    // Show first 10 examples
    console.log('=== Sample Elements with SF_ Tags ===\n');
    elementsWithTags.slice(0, 10).forEach((elem, index) => {
      console.log(`Element ${index + 1}: ${elem.Name}`);
      console.log('Description:', elem.Description);
      console.log('---\n');
    });
    
    // Analyze tag patterns
    console.log('\n=== Tag Pattern Analysis ===\n');
    const tagPatterns = new Set();
    const tagExamples = {};
    const bracketedExamples = [];
    const unbracketedExamples = [];
    
    elementsWithTags.forEach(elem => {
      // Look for all SF_ patterns
      const matches = elem.Description.match(/SF_\w+(?:\[[^\]]+\])?/g);
      if (matches) {
        matches.forEach(match => {
          const tagName = match.split('[')[0];
          tagPatterns.add(tagName);
          
          if (!tagExamples[tagName]) {
            tagExamples[tagName] = new Set();
          }
          tagExamples[tagName].add(match);
          
          // Categorize by bracket usage
          if (match.includes('[')) {
            bracketedExamples.push(match);
          } else {
            unbracketedExamples.push(match);
          }
        });
      }
    });
    
    console.log('Unique SF_ tags found:', Array.from(tagPatterns).sort());
    
    console.log('\nTag format examples:');
    Object.entries(tagExamples).forEach(([tag, examples]) => {
      const exampleArray = Array.from(examples);
      console.log(`  ${tag}:`);
      console.log(`    Examples: ${exampleArray.slice(0, 5).join(', ')}`);
      console.log(`    Count: ${exampleArray.length}`);
    });
    
    console.log('\nBracket Usage:');
    console.log(`  With brackets: ${bracketedExamples.length} (e.g., ${bracketedExamples.slice(0, 3).join(', ')})`);
    console.log(`  Without brackets: ${unbracketedExamples.length} (e.g., ${unbracketedExamples.slice(0, 3).join(', ')})`);
    
    // Look for specific patterns
    console.log('\n=== Specific Pattern Analysis ===\n');
    
    // Check for SF_Group vs SF_MemoryGroup
    const groupVariants = elementsWithTags.filter(elem => 
      elem.Description.match(/SF_(Group|MemoryGroup)/i)
    );
    
    console.log('SF_Group variants:');
    groupVariants.slice(0, 5).forEach(elem => {
      const groupMatches = elem.Description.match(/SF_(Group|MemoryGroup)(?:\[[^\]]+\])?/gi);
      if (groupMatches) {
        console.log(`  ${elem.Name}: ${groupMatches.join(', ')}`);
      }
    });
    
    // Look for multiplier patterns
    console.log('\n\nMultiplier Patterns:');
    const multiplierPatterns = elementsWithTags.filter(elem => 
      elem.Description.match(/\b\d+x\b|\bmultiplier/i)
    );
    
    multiplierPatterns.slice(0, 5).forEach(elem => {
      console.log(`  ${elem.Name}: ${elem.Description}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

examineMemoryTags();