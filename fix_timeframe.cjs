const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

// Inside gameMode === 'minute'
code = code.replace(
  /const apiRes = await fetch\(`\/api\/stock-data\?ticker=\$\{selectedStock\.code\}&providerIndex=\$\{providerIndex\}`\);\n\s*if \(apiRes\.ok\) \{\n\s*const apiData = await apiRes\.json\(\);\n\s*if \(Array\.isArray\(apiData\.candles\) && apiData\.candles\.length > 0\) \{\n\s*\/\/ Apply our 3-stage mathematical noise-masking filter/g,
  `const apiRes = await fetch(\`/api/stock-data?ticker=\${selectedStock.code}&timeframe=minute&providerIndex=\${providerIndex}\`);
            if (apiRes.ok) {
              const apiData = await apiRes.json();
              if (Array.isArray(apiData.candles) && apiData.candles.length > 0) {
                // Apply our 3-stage mathematical noise-masking filter`
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed timeframe missing in fetch');
