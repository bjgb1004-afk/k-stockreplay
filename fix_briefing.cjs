const fs = require('fs');
let code = fs.readFileSync('api/express-app.ts', 'utf8');
code = code.replace(/const dbData = await getPlatformDataFromSupabase\('morning_briefing'\);\s*if \(dbData\) \{\s*return res\.json\(dbData\);\s*\}/g, '');
code = code.replace(/const dbData = await getPlatformDataFromSupabase\('lunch_briefing'\);\s*if \(dbData\) \{\s*return res\.json\(dbData\);\s*\}/g, '');
code = code.replace(/const dbData = await getPlatformDataFromSupabase\('evening_column'\);\s*if \(dbData\) \{\s*return res\.json\(dbData\);\s*\}/g, '');
code = code.replace(/const dbData = await getPlatformDataFromSupabase\(`after_market_report_\$\{date\}`\);\s*if \(dbData\) \{\s*return res\.json\(dbData\);\s*\}/g, '');
fs.writeFileSync('api/express-app.ts', code);
