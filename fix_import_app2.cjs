const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /Minimize\n\s*ActivitySquare,/,
  "Minimize,\n  ActivitySquare"
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed import in App.tsx');
