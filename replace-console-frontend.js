#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all JS/JSX files in frontend (excluding node_modules, tests, and utils/logger.js)
const frontendPath = '/home/spide/projects/GitHub/ALNTool/storyforge/frontend/src';

function findJSFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules' && item !== '__tests__') {
        scan(fullPath);
      } else if (stat.isFile() && (item.endsWith('.js') || item.endsWith('.jsx'))) {
        // Skip test files and the logger file itself
        if (!item.includes('.test.') && !item.includes('setupTests') && !item.includes('logger.js')) {
          files.push(fullPath);
        }
      }
    }
  }
  
  scan(dir);
  return files;
}

function replaceConsoleInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Check if logger is already imported
  const hasLoggerImport = content.includes("import logger from") || content.includes("import logger from");
  
  // Only process files that have console statements
  if (!content.includes('console.')) {
    return false;
  }
  
  console.log(`Processing: ${path.relative(frontendPath, filePath)}`);
  
  // Add logger import if not present
  if (!hasLoggerImport) {
    // Find the correct relative path to logger
    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(fileDir, path.join(frontendPath, 'utils', 'logger.js'));
    const importPath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    const cleanImportPath = importPath.replace(/\\/g, '/').replace('.js', '');
    
    // Add import after existing imports
    const importRegex = /(import.*from.*['"];?\s*\n)+/;
    if (importRegex.test(content)) {
      content = content.replace(importRegex, (match) => {
        return match + `import logger from '${cleanImportPath}';\n`;
      });
    } else {
      // If no imports, add at the top
      content = `import logger from '${cleanImportPath}';\n` + content;
    }
    modified = true;
  }
  
  // Replace console statements
  content = content.replace(/console\.log\(/g, 'logger.debug(');
  content = content.replace(/console\.info\(/g, 'logger.info(');
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  content = content.replace(/console\.error\(/g, 'logger.error(');
  content = content.replace(/console\.debug\(/g, 'logger.debug(');
  content = content.replace(/console\.time\(/g, 'logger.time(');
  content = content.replace(/console\.timeEnd\(/g, 'logger.timeEnd(');
  content = content.replace(/console\.group\(/g, 'logger.group(');
  content = content.replace(/console\.groupEnd\(/g, 'logger.groupEnd(');
  content = content.replace(/console\.table\(/g, 'logger.table(');
  
  modified = true;
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main execution
console.log('🔄 Replacing console statements in frontend...');

const files = findJSFiles(frontendPath);
let modifiedCount = 0;

for (const file of files) {
  try {
    if (replaceConsoleInFile(file)) {
      modifiedCount++;
    }
  } catch (error) {
    console.error(`❌ Error processing ${file}:`, error.message);
  }
}

console.log(`✅ Modified ${modifiedCount} files`);

// Count remaining console statements
try {
  const result = execSync(`grep -r "console\\." --include="*.js" --include="*.jsx" --exclude-dir=node_modules ${frontendPath} | wc -l`, { encoding: 'utf8' });
  console.log(`📊 Remaining console statements: ${result.trim()}`);
} catch (error) {
  console.log('Could not count remaining statements');
}