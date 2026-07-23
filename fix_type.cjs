const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /\{stockList.map\(\(stk\) => \{/g,
  "{stockList.map((stk: any) => {"
);

code = code.replace(
  /const \[stockList, setStockList\] = useState\(JODOJU_STOCKS\);/,
  "const [stockList, setStockList] = useState<any[]>(JODOJU_STOCKS);"
);


fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed types in App.tsx');
