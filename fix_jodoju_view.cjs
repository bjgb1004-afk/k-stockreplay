const fs = require('fs');
let code = fs.readFileSync('src/components/JodojuAnalysisView.tsx', 'utf8');
code = code.replace(/const sector = getStockSector\(stk\.ticker\);\n\s*const rankNum = stk\.rank \|\| \(idx \+ 1\);\n\s*return \(\n\s*<option key=\{stk\.ticker\} value=\{stk\.ticker\}>\n\s*\{rankNum\}위 \{stk\.name\} \| \{sector\} \| \{valueInBillion\.toLocaleString\(\)\}억 \| \{stk\.changeRate !== undefined \? `\$\{stk\.changeRate >= 0 \? '\+' : ''\}\$\{stk\.changeRate\.toFixed\(1\)\}%` : ''\}\n\s*<\/option>/g, 
`const sector = stk.sector || getStockSector(stk.ticker);
                const rankNum = stk.rank || (idx + 1);
                return (
                  <option key={stk.ticker} value={stk.ticker}>
                    [{rankNum}위] {stk.name} | {sector} | {valueInBillion.toLocaleString()}억 | {stk.changeRate !== undefined ? \`\${stk.changeRate >= 0 ? '+' : ''}\${stk.changeRate.toFixed(1)}%\` : ''}
                  </option>`);
fs.writeFileSync('src/components/JodojuAnalysisView.tsx', code);
