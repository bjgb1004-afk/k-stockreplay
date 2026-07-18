const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const \[providerIndex, setProviderIndex\] = useState<number>\(0\);/,
  `const [providerIndex, setProviderIndex] = useState<number>(4); // Use Naver (4) by default to get 120 candles`
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed providerIndex to 4');
