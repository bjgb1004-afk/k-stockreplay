const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf-8');

code = code.replace(
  /tradeValuePct: number; \/\/ e\.g\. 5000억/,
  "tradeValuePct: number; // e.g. 5000억\n  tradeValue?: number;\n  tradingValue?: number;"
);

code = code.replace(
  /aiFeedback: string;/,
  "aiFeedback: string;\n  score?: number;\n  fitIndex?: number;\n  adviceText?: string;"
);

fs.writeFileSync('src/types.ts', code, 'utf-8');
console.log('Fixed types.ts');
