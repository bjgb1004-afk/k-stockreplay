const fs = require('fs');
let content = fs.readFileSync('api/express-app.ts', 'utf-8');

content = content.replace(
  'const res = await fetch(url);',
  `const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });`
);

fs.writeFileSync('api/express-app.ts', content);
