const fs = require('fs');
const path = require('path');

function removeConsoleLogs(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove single-line console statements
  content = content.replace(/^\s*console\.(log|warn|error|info)\([^;]*\);\s*$/gm, '');
  
  // Remove console statements that span multiple lines (common pattern)
  content = content.replace(/^\s*console\.(log|warn|error|info)\([^)]*\)[\s]*$/gm, '');
  
  // Clean up empty lines that might result from removals
  content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
  
  fs.writeFileSync(filePath, content);
}

// Process AudioManager specifically
const audioManagerPath = './src/game/audio/AudioManager.ts';
if (fs.existsSync(audioManagerPath)) {
  console.log('Processing AudioManager.ts...');
  removeConsoleLogs(audioManagerPath);
}

console.log('Console logs removed successfully');
