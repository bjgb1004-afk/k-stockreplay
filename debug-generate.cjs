const fs = require('fs');
let content = fs.readFileSync('api/express-app.ts', 'utf-8');

content = content.replace(
  'const targetDate = getJodojuTargetDate();',
  'const targetDate = getJodojuTargetDate(); console.log("HIT ENDPOINT"); fs.writeFileSync("/tmp/hit.txt", "hit");'
);

fs.writeFileSync('api/express-app.ts', content);
