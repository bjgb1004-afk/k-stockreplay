const fs = require('fs');

let content = fs.readFileSync('api/express-app.ts', 'utf-8');

const startIdx = content.indexOf('const KNOWN_TICKER_NAMES: Record<string, string> = {');
const endIdx = content.indexOf('};', startIdx) + 2;

const newTickers = `let KNOWN_TICKER_NAMES: Record<string, string> = {};`;

content = content.substring(0, startIdx) + newTickers + content.substring(endIdx);

fs.writeFileSync('api/express-app.ts', content);
