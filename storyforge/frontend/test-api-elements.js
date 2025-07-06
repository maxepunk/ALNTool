// Quick test to see what fields elements have from the API
fetch('http://localhost:3001/api/elements')
  .then(res => res.json())
  .then(data => {
    const elements = data.data || data;
    console.log('Total elements:', elements.length);
    console.log('\nFirst 3 elements:');
    elements.slice(0, 3).forEach((elem, i) => {
      console.log(`\nElement ${i + 1}:`, {
        id: elem.id,
        name: elem.name,
        type: elem.type,
        basicType: elem.basicType,
        owner_character_id: elem.owner_character_id,
        ownerCharacterId: elem.ownerCharacterId,
        'all fields': Object.keys(elem)
      });
    });
    
    // Check how many have owner
    const withOwner = elements.filter(e => e.owner).length;
    console.log(`\nElements with owner field: ${withOwner} / ${elements.length}`);
    
    // Show some examples of owner field
    console.log('\nExamples of owner field:');
    elements.filter(e => e.owner).slice(0, 5).forEach(elem => {
      console.log(`- "${elem.name}" owner:`, elem.owner);
    });
    
    // Also check associatedCharacters
    console.log('\nExamples of associatedCharacters:');
    elements.filter(e => e.associatedCharacters).slice(0, 3).forEach(elem => {
      console.log(`- "${elem.name}" associatedCharacters:`, elem.associatedCharacters);
    });
  })
  .catch(err => console.error('Error:', err));