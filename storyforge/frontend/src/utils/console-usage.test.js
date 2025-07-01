// RED PHASE: Test that should FAIL because we have console.* statements in the codebase

const fs = require('fs');
const path = require('path');

describe('Console Usage - RED Phase', () => {
  test('should replace all console.* with logger in non-test files', () => {
    const srcDir = path.resolve(__dirname, '..');
    const filesToCheck = [];
    
    // Recursively find all .js and .jsx files
    function findFiles(dir) {
      const files = fs.readdirSync(dir);
      files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && 
            file !== 'node_modules' && 
            file !== '__tests__' &&
            file !== '__mocks__' &&
            file !== 'test-utils' &&
            file !== 'mocks') {
          findFiles(fullPath);
        } else if ((file.endsWith('.js') || file.endsWith('.jsx')) && 
                   !file.includes('.test.') && 
                   !file.includes('.spec.') &&
                   file !== 'setupTests.js' &&
                   file !== 'logger.js' &&
                   file !== 'test-polyfills.js') {
          filesToCheck.push(fullPath);
        }
      });
    }
    
    findFiles(srcDir);
    
    // Check each file for console.* usage (excluding comments)
    const filesWithConsole = [];
    filesToCheck.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      // Remove comments to avoid false positives
      const contentWithoutComments = content
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
        .replace(/\/\/.*$/gm, ''); // Remove // comments
      
      const consoleMatches = contentWithoutComments.match(/console\.(log|warn|error|info|debug|table|time|timeEnd|group|groupEnd)/g);
      if (consoleMatches) {
        // Find line numbers for each match
        const lines = content.split('\n');
        const matchLines = [];
        consoleMatches.forEach(match => {
          lines.forEach((line, idx) => {
            if (line.includes(match) && !line.trim().startsWith('//')) {
              matchLines.push(`Line ${idx + 1}: ${line.trim()}`);
            }
          });
        });
        
        filesWithConsole.push({
          file: path.relative(srcDir, file),
          count: consoleMatches.length,
          matches: [...new Set(consoleMatches)],
          lines: matchLines
        });
      }
    });
    
    // Log findings for debugging
    console.log(`Checked ${filesToCheck.length} production files`);
    console.log(`Found console.* in ${filesWithConsole.length} files\n`);
    
    if (filesWithConsole.length > 0) {
      filesWithConsole.forEach(({ file, count, matches, lines }) => {
        console.log(`\n${file}: ${count} occurrences`);
        console.log(`  Types: ${matches.join(', ')}`);
        if (lines.length <= 3) {
          lines.forEach(line => console.log(`  ${line}`));
        } else {
          console.log(`  ${lines[0]}`);
          console.log(`  ... and ${lines.length - 1} more`);
        }
      });
    }
    
    // This should FAIL - we expect to find console.* statements
    expect(filesWithConsole.length).toBe(0);
  });
});