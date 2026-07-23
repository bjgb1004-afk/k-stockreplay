const fs = require('fs');
let code = fs.readFileSync('src/types.ts', 'utf8');
code = code.replace(/export interface JodojuAnalysis \{/g, 
`export interface JodojuAnalysis {
  sector?: string;
  theme?: string;
  tags?: string[];`);
fs.writeFileSync('src/types.ts', code);
