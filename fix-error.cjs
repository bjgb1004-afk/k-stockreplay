const fs = require('fs');
let content = fs.readFileSync('api/express-app.ts', 'utf-8');

content = content.replace(
  'console.error(\'[주도주 API 에러]\', err.message || err);',
  'fs.writeFileSync("/tmp/endpoint-error.txt", err.stack || err.message); console.error(\'[주도주 API 에러]\', err.stack);'
);

fs.writeFileSync('api/express-app.ts', content);
