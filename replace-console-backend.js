#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all JS files in backend (excluding node_modules, tests, and utils/logger.js)
const backendPath = '/home/spide/projects/GitHub/ALNTool/storyforge/backend/src';

function findJSFiles(dir) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && item !== 'node_modules' && item !== '__tests__') {
        scan(fullPath);
      } else if (stat.isFile() && item.endsWith('.js')) {
        // Skip test files and the logger file itself
        if (!item.includes('.test.') && !item.includes('logger.js')) {
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
  const hasLoggerImport = content.includes("require('./logger')") || 
                         content.includes("require('../utils/logger')") ||
                         content.includes("require('../../utils/logger')") ||
                         content.includes("require('../../../utils/logger')");
  
  // Only process files that have console statements
  if (!content.includes('console.')) {
    return false;
  }
  
  console.log(`Processing: ${path.relative(backendPath, filePath)}`);
  
  // Add logger require if not present
  if (!hasLoggerImport) {
    // Find the correct relative path to logger
    const fileDir = path.dirname(filePath);
    const relativePath = path.relative(fileDir, path.join(backendPath, 'utils', 'logger.js'));
    let requirePath = relativePath.startsWith('.') ? relativePath : './' + relativePath;
    requirePath = requirePath.replace(/\\/g, '/').replace('.js', '');
    
    // Add require at the top after existing requires
    const requireRegex = /((?:const|let|var).*require\(.*\);?\s*\n)+/;
    if (requireRegex.test(content)) {
      content = content.replace(requireRegex, (match) => {
        return match + `const logger = require('${requirePath}');\n`;
      });
    } else {
      // If no requires, add at the top
      content = `const logger = require('${requirePath}');\n\n` + content;
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
  
  modified = true;
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main execution
console.log('🔄 Replacing console statements in backend...');

const files = findJSFiles(backendPath);
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

// Count remaining application console statements (excluding tests and logger)
try {
  const result = execSync(`grep -r "console\\." --include="*.js" ${backendPath} | grep -v "\\.test\\." | grep -v "logger.js" | grep -v "^.*//.*console\\." | wc -l`, { encoding: 'utf8' });
  console.log(`📊 Remaining application console statements: ${result.trim()}`);
} catch (error) {
  console.log('Could not count remaining statements');
}