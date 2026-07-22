const fs = require('fs');

const files = ['src/App.tsx', 'src/components/JodojuAnalysisView.tsx'];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(/"035420": "로봇",\n/g, '');
    fs.writeFileSync(file, code);
  }
}
