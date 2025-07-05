#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Files to migrate
const filesToMigrate = [
  '../../frontend/src/pages/TimelineDetail.jsx',
  '../../frontend/src/pages/PuzzleDetail.jsx',
  '../../frontend/src/pages/ElementDetail.jsx',
  '../../frontend/src/pages/PuzzleFlowPage.jsx',
  '../../frontend/src/components/PlayerJourney/CharacterSelector.jsx',
  '../../frontend/src/pages/CharacterDetail.jsx',
  '../../frontend/src/pages/NarrativeThreadTrackerPage.jsx',
  '../../frontend/src/pages/ResolutionPathAnalyzerPage.jsx',
  '../../frontend/src/pages/Dashboard.jsx',
  '../../frontend/src/pages/Elements.jsx',
  '../../frontend/src/pages/Characters.jsx',
  '../../frontend/src/pages/Puzzles.jsx',
  '../../frontend/src/pages/Timeline.jsx',
  '../../frontend/src/pages/MemoryEconomyPage.jsx'
];

// Pattern to match old React Query v3 syntax
// Matches: useQuery('key', fn, options) or useQuery(['key'], fn, options)
const useQueryPattern = /useQuery\s*\(\s*(['"`][\w\s]+['"`]|\[.*?\])\s*,\s*([\w.\[\]()=>\s{}]+)\s*(?:,\s*(\{[^}]*\}))?\s*\)/g;

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.error(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf-8');
  let modified = false;
  
  // Replace useQuery calls
  content = content.replace(useQueryPattern, (match, key, fn, options) => {
    modified = true;
    
    // Clean up the key - ensure it's an array
    let cleanKey = key.trim();
    if (cleanKey.startsWith("'") || cleanKey.startsWith('"') || cleanKey.startsWith('`')) {
      // Single string key - wrap in array
      cleanKey = `[${cleanKey}]`;
    }
    
    // Build the new v4 syntax
    let newQuery = `useQuery({
    queryKey: ${cleanKey},
    queryFn: ${fn.trim()}`;
    
    // If there are options, merge them
    if (options) {
      // Remove the curly braces from options and add properties
      const optionsContent = options.slice(1, -1).trim();
      if (optionsContent) {
        newQuery += `,
    ${optionsContent}`;
      }
    }
    
    newQuery += `
  })`;
    
    console.log(`Migrating in ${path.basename(filePath)}:`);
    console.log(`  Old: ${match.split('\n')[0]}...`);
    console.log(`  New: ${newQuery.split('\n')[0]}...`);
    console.log('');
    
    return newQuery;
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`✅ Migrated ${path.basename(filePath)}`);
  } else {
    console.log(`ℹ️  No changes needed in ${path.basename(filePath)}`);
  }
}

console.log('Starting React Query v3 to v4 migration...\n');

filesToMigrate.forEach(file => {
  try {
    migrateFile(file);
  } catch (error) {
    console.error(`Error migrating ${file}:`, error.message);
  }
});

console.log('\n✨ Migration complete!');