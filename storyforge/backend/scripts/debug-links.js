const { getDB } = require('../src/db/database');
const { getLinkedCharacters } = require('../src/db/queries');

async function debugLinks() {
  console.log('🔍 Debugging Character Links...\n');
  
  const db = getDB();
  
  // First, check if character_links table has data
  const linkCount = db.prepare('SELECT COUNT(*) as count FROM character_links').get();
  console.log(`Total links in database: ${linkCount.count}`);
  
  // Get a sample of links
  const sampleLinks = db.prepare('SELECT * FROM character_links LIMIT 5').all();
  console.log('\nSample links:');
  sampleLinks.forEach(link => {
    console.log(`  ${link.character_a_id.substring(0, 8)}... <-> ${link.character_b_id.substring(0, 8)}... (${link.link_type})`);
  });
  
  // Find characters with the most links
  const topCharacters = db.prepare(`
    SELECT c.id, c.name, COUNT(*) as link_count 
    FROM characters c
    JOIN character_links cl ON (cl.character_a_id = c.id OR cl.character_b_id = c.id)
    GROUP BY c.id, c.name
    ORDER BY link_count DESC
    LIMIT 5
  `).all();
  
  console.log('\nTop 5 characters by link count:');
  topCharacters.forEach(char => {
    console.log(`  ${char.name}: ${char.link_count} links (ID: ${char.id})`);
  });
  
  // Test the getLinkedCharacters function with the top character
  if (topCharacters.length > 0) {
    const testCharId = topCharacters[0].id;
    console.log(`\nTesting getLinkedCharacters for ${topCharacters[0].name}:`);
    
    const linkedChars = await getLinkedCharacters(testCharId);
    console.log(`Found ${linkedChars.length} linked characters:`);
    
    linkedChars.slice(0, 5).forEach(link => {
      console.log(`  - ${link.linked_character_name} (${link.link_type}, count: ${link.link_count})`);
    });
  }
  
  // Test with Howie Sullivan specifically
  const howieId = '1b62f33d-583f-807f-b807-d89bb65c2c33';
  console.log('\nTesting Howie Sullivan specifically:');
  const howieLinks = await getLinkedCharacters(howieId);
  console.log(`Howie has ${howieLinks.length} linked characters`);
}

debugLinks().catch(console.error); 