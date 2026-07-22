const fs = require('fs');
let code = fs.readFileSync('api/express-app.ts', 'utf8');
code = code.replace(/return \{\s*\.\.\.p,\s*reading_time: `완독 \$\{readingTimeStr\} 소요`\s*\};\s*\}/g, 
`const isManuallyPub = p.is_published !== undefined ? p.is_published : (p.published_at ? true : false);
        return {
          ...p,
          is_published: isManuallyPub,
          reading_time: \`완독 \${readingTimeStr} 소요\`
        };
      }`);
fs.writeFileSync('api/express-app.ts', code);
