const fs = require('fs');
let code = fs.readFileSync('server-core/platform_engine.ts', 'utf8');
code = code.replace(/stars: Math\.max\(1, Math\.min\(5, Math\.ceil\(\(5 - idx \/ 3\)\)\)\),/g, 
`stars: Math.max(1, Math.min(5, Math.ceil((5 - idx / 3)))),
          sector: "반도체",
          theme: "AI/HBM",
          tags: ["주도주", "기관 매수"],`);
fs.writeFileSync('server-core/platform_engine.ts', code);
