const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /useState<'morning' \| 'afternoon' \| 'features'>\('morning'\);\| 'lunch' \| 'afternoon' \| 'jodoju_deep' \| 'evening'>\('morning'\);/,
  "useState<'morning' | 'lunch' | 'afternoon' | 'features' | 'jodoju_deep' | 'evening'>('morning');"
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed state type in App.tsx');
