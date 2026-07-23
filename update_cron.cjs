const fs = require('fs');
let code = fs.readFileSync('.github/workflows/data-updater.yml', 'utf-8');

code = code.replace(
  /- cron: '0 7 \* \* \*'/g,
  "- cron: '0 7 * * 1-5'"
);

fs.writeFileSync('.github/workflows/data-updater.yml', code, 'utf-8');
console.log('updated data-updater.yml cron');
