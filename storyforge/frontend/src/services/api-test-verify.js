import api from './api.js';

// Test that all legacy methods exist
const legacyMethods = [
  'getCharacters',
  'getCharacterById',
  'getCharacterGraph',
  'getCharacterLinks',
  'getJourneyByCharacterId',
  'getElements',
  'getElementById',
  'getElementGraph',
  'getPuzzles',
  'getPuzzleById',
  'getPuzzleGraph',
  'getTimelineEvents',
  'getTimelineEventById',
  'getTimelineGraph',
  'syncData',
  'getSyncStatus',
  'globalSearch',
  'getDatabasesMetadata',
  'getCharactersWithWarnings',
  'getElementsWithWarnings',
  'getPuzzlesWithWarnings',
  'getPuzzleFlow',
  'getPuzzleFlowGraph',
  'getAllCharactersWithSociogramData',
  'getUniqueNarrativeThreads',
  'getTimelineEventsList',
  'clearCache',
  'cancelSync',
  'getGameConstants'
];

console.log('Checking legacy API methods...');
let allMethodsExist = true;

legacyMethods.forEach(method => {
  if (typeof api[method] === 'function') {
    console.log(`✓ ${method}`);
  } else {
    console.log(`✗ ${method} - NOT FOUND`);
    allMethodsExist = false;
  }
});

// Check new structure
console.log('\nChecking new API structure...');
if (api.entities && typeof api.entities === 'object') {
  console.log('✓ api.entities exists');
  const entityMethods = ['list', 'get', 'create', 'update', 'delete'];
  entityMethods.forEach(method => {
    if (typeof api.entities[method] === 'function') {
      console.log(`  ✓ api.entities.${method}`);
    } else {
      console.log(`  ✗ api.entities.${method} - NOT FOUND`);
      allMethodsExist = false;
    }
  });
} else {
  console.log('✗ api.entities - NOT FOUND');
  allMethodsExist = false;
}

// Check specialized methods
const specializedMethods = [
  'syncNotionData',
  'getSyncStatus',
  'getJourneyData',
  'getEntityGraph',
  'getPerformanceElements',
  'getCharacterLinks',
  'getEntitiesWithWarnings',
  'globalSearch',
  'getMetadata',
  'getGameConstants'
];

console.log('\nChecking specialized API methods...');
specializedMethods.forEach(method => {
  if (typeof api[method] === 'function') {
    console.log(`✓ ${method}`);
  } else {
    console.log(`✗ ${method} - NOT FOUND`);
    allMethodsExist = false;
  }
});

console.log(`\nAll methods exist: ${allMethodsExist}`);
export default allMethodsExist;