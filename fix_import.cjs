const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

if (!code.includes('ActivitySquare')) {
  // Wait, it is in the file on line 2081, but is it in the import statement?
}

code = code.replace(
  /Activity, /,
  "Activity, ActivitySquare, "
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed import');
