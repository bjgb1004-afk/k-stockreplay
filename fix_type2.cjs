const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const \[selectedStock, setSelectedStock\] = useState\(JODOJU_STOCKS\[0\]\);/,
  "const [selectedStock, setSelectedStock] = useState<any>(JODOJU_STOCKS[0]);"
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed selectedStock type in App.tsx');
