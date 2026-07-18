const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(/const targetStartingIndex = gameMode === 'minute' \? 10 : 20;/g, "const targetStartingIndex = gameMode === 'minute' ? 10 : 10;");

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed targetStartingIndex');
