// Simple script to remove dispatch table from Sales.tsx
// This will remove the dispatch table section while keeping the rest intact

const fs = require('fs');

// Read the file
const content = fs.readFileSync('pages/Sales.tsx', 'utf8');

// Find the dispatch table section and remove it
const lines = content.split('\n');
let newLines = [];
let inDispatchSection = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  
  // Check if we're entering the dispatch section
  if (line.includes('Dispatch</h2>')) {
    inDispatchSection = true;
    braceCount = 0;
    continue;
  }
  
  // If we're in the dispatch section, count braces
  if (inDispatchSection) {
    braceCount += (line.match(/\{/g) || []).length;
    braceCount -= (line.match(/\}/g) || []).length;
    
    // If we've closed all braces, we're out of the dispatch section
    if (braceCount <= 0 && line.includes('</div>')) {
      inDispatchSection = false;
      continue;
    }
    
    // Skip lines in dispatch section
    if (inDispatchSection) {
      continue;
    }
  }
  
  newLines.push(line);
}

// Write the cleaned file
fs.writeFileSync('pages/Sales.tsx', newLines.join('\n'));
console.log('Dispatch table removed from Sales.tsx');
