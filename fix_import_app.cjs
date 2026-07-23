const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /} from 'lucide-react';/,
  "  ActivitySquare,\n} from 'lucide-react';"
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed import in App.tsx');
