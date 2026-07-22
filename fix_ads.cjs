const fs = require('fs');
let code = fs.readFileSync('src/components/BlogCenter.tsx', 'utf8');
code = code.replace(/const renderHtmlWithAds = \([\s\S]*?\n};\n/g, 
`const renderHtmlWithAds = (content: string): string => {
  if (!content) {
    return '<p>작성 중인 칼럼입니다. 조만간 완성된 리포트가 업로드될 예정이니 조금만 기다려주세요!</p>';
  }
  return content;
};
`);
fs.writeFileSync('src/components/BlogCenter.tsx', code);
