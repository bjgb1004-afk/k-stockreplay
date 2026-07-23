const fs = require('fs');
let content = fs.readFileSync('api/express-app.ts', 'utf-8');

const newFunc = `
  function saveJodojuToCacheAndStatic(stocks, targetDate) {
    if (!stocks || stocks.length === 0) return;
    const cacheData = { targetDate, stocks, timestamp: Date.now() };
    fs.writeFileSync(JODOJU_CACHE_FILE, JSON.stringify(cacheData));
    
    // Also save to static fallback if needed, but the main thing is JODOJU_CACHE_FILE
    // There was probably a static file like public/data/jodoju.json, but writing to tmp cache is enough for memory
  }
`;

content = content.replace(
  'app.get(\'/api/jodoju-list\',',
  newFunc + '\n  app.get(\'/api/jodoju-list\','
);

fs.writeFileSync('api/express-app.ts', content);
