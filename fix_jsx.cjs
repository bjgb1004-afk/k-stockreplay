const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/\[\$\{stk\.rank\}위\] \$\{stk\.name\} \| \$\{sector\} \| \$\{valueInBillion\.toLocaleString\(\)\}억 \| \$\{stk\.changeRatio !== undefined \? `\$\{stk\.changeRatio >= 0 \? '\+' : ''\}\$\{stk\.changeRatio\.toFixed\(1\)\}%` : ''\}/g,
`[{stk.rank}위] {stk.name} | {sector} | {valueInBillion.toLocaleString()}억 | {stk.changeRatio !== undefined ? \`\${stk.changeRatio >= 0 ? '+' : ''}\${stk.changeRatio.toFixed(1)}%\` : ''}`);
fs.writeFileSync('src/App.tsx', code);
