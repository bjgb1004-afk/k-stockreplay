const fs = require('fs');

const files = [
  'src/App.tsx',
  'src/components/MorningNews2026.tsx'
]; // Add others if needed later

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');
    
    content = content.replace(/border-slate-850/g, 'border-slate-800');
    content = content.replace(/border-slate-855/g, 'border-slate-800');
    content = content.replace(/bg-slate-850/g, 'bg-slate-800');
    content = content.replace(/hover:bg-slate-850/g, 'hover:bg-slate-700'); // wait, hover:bg-slate-850 should probably be 700 or 800
    
    content = content.replace(/bg-slate-750/g, 'bg-slate-700');
    content = content.replace(/border-slate-750/g, 'border-slate-700');
    
    // For buttons
    content = content.replace(/bg-red-650 hover:bg-red-600/g, 'bg-red-500 hover:bg-red-400'); // make them lighter/brighter
    content = content.replace(/bg-blue-650 hover:bg-blue-600/g, 'bg-blue-500 hover:bg-blue-400');
    
    fs.writeFileSync(file, content, 'utf-8');
    console.log('Fixed colors in ' + file);
  }
}
