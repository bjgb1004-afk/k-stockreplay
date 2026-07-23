const fs = require('fs');
let code = fs.readFileSync('api/express-app.ts', 'utf8');
code = code.replace(/reportData = await getPlatformDataFromSupabase\('afternoon_report'\);\s*if \(\!reportData\) \{/g, 'reportData = PlatformEngine.getAfterMarketReport();\n        if (!reportData) {');
fs.writeFileSync('api/express-app.ts', code);
