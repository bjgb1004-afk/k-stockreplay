const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(/<button\s+onClick=\{\(\) => \{\s*setReplayDate\(null\);\s*window\.location\.reload\(\);\s*\}\}\s+className="[^"]+"\s*>\s*실시간 최신 모드로 복귀\s*<\/button>/g, '');
fs.writeFileSync('src/App.tsx', code);
