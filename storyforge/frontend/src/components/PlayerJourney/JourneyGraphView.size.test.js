// RED PHASE: Test that JourneyGraphView is too large and needs extraction

const fs = require('fs');
const path = require('path');

describe('JourneyGraphView Size - RED Phase', () => {
  test('component file should be under 300 lines', () => {
    const filePath = path.join(__dirname, 'JourneyGraphView.jsx');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    console.log(`JourneyGraphView.jsx has ${lines.length} lines`);
    
    // This should FAIL - we know it has 445 lines
    expect(lines.length).toBeLessThan(300);
  });
  
  test('should have separate files for major concerns', () => {
    const expectedFiles = [
      'analyzeExperienceFlow.js', // Lines 47-127 (80 lines)
      'ExperienceAnalysisPanel.jsx', // Lines 302-433 (131 lines)
    ];
    
    const missingFiles = [];
    expectedFiles.forEach(file => {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        missingFiles.push(file);
      }
    });
    
    console.log(`Missing extraction files: ${missingFiles.join(', ')}`);
    
    // This should FAIL - these files don't exist yet
    expect(missingFiles.length).toBe(0);
  });
});