const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  /const sortAndValidateCandles = \(candlesList: Candle\[\]\): Candle\[\] => \{\n\s*return \[\.\.\.candlesList\]\.sort\(\(a, b\) => \{\n\s*const dateA = a\.date \|\| '';\n\s*const dateB = b\.date \|\| '';\n\s*return dateA\.localeCompare\(dateB\);\n\s*\}\);\n\s*\};/,
  `const sortAndValidateCandles = (candlesList: Candle[]): Candle[] => {
        const sorted = [...candlesList].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        // Remove duplicate dates that break Lightweight Charts
        const unique = [];
        const seenDates = new Set();
        for (const item of sorted) {
          if (!seenDates.has(item.date)) {
            seenDates.add(item.date);
            unique.push(item);
          }
        }
        return unique;
      };`
);

fs.writeFileSync('src/App.tsx', code, 'utf-8');
console.log('Fixed duplicate dates in App.tsx');
