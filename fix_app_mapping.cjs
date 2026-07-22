const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Add sector to the mapped list
code = code.replace(/tradeValue: r\.tradeValuePct/g, 
`tradeValue: r.tradeValuePct,
            sector: r.sector,
            theme: r.theme,
            tags: r.tags`);

// Remove historical replay banner
code = code.replace(/\{replayDate && \([\s\S]*?<div id="historical-replay-banner"[\s\S]*?<\/div>\s*<\/div>\s*\)\}/g, '');

fs.writeFileSync('src/App.tsx', code);
