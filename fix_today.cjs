const fs = require('fs');
let code = fs.readFileSync('api/express-app.ts', 'utf-8');

// For minute mode
code = code.replace(
  /if \(sortedDays\[sortedDays\.length - 1\] === kstTodayStr && currentKstTimeNum < 1600\) \{\n\s*if \(sortedDays\.length > 1\) \{\n\s*sortedDays\.pop\(\);\n\s*\}\n\s*\}/,
  `// (Removed pop() of today's date per user request "당일포함")`
);

// For day mode
code = code.replace(
  /if \(currentKstTimeNum < 1600\) \{\n\s*const todayIdx = candles\.findIndex\(c => c\.date === kstTodayStr\);\n\s*if \(todayIdx !== -1\) \{\n\s*candles\.splice\(todayIdx, 1\);\n\s*\}\n\s*\}/,
  `// (Removed splice() of today's date per user request "당일포함")`
);

fs.writeFileSync('api/express-app.ts', code, 'utf-8');
console.log('Fixed today skipping logic');
