// Script to remove dispatch table from Sales.tsx
const fs = require('fs');

// Read the file
const content = fs.readFileSync('pages/Sales.tsx', 'utf8');

// Find and remove the dispatch table section
const lines = content.split('\n');
let newLines = [];
let skipDispatchSection = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if we're entering the dispatch section
  if (line.includes('Dispatch</h2>')) {
    skipDispatchSection = true;
    braceCount = 0;
    continue;
  }
  
  // If we're in the dispatch section, count braces to find the end
  if (skipDispatchSection) {
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    // If we find the modal section, we're done with dispatch
    if (line.includes('isAddModalVisible &&')) {
      skipDispatchSection = false;
      newLines.push(line);
      continue;
    }
    
    // Skip lines in dispatch section
    if (skipDispatchSection) {
      continue;
    }
  }
  
  newLines.push(line);
}

// Write the cleaned file
fs.writeFileSync('pages/Sales.tsx', newLines.join('\n'));
console.log('Dispatch table removed from Sales.tsx');
