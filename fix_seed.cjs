const fs = require('fs');
let code = fs.readFileSync('server-core/platform_engine.ts', 'utf8');

// Replace stars: 5, with stars: 5, sector: '반도체', theme: 'AI 반도체/장비', tags: ['주도주', '거래대금 최상위'],
code = code.replace(/stars: 5,\s*relatedThemes: \['AI 반도체', 'HBM3E', 'TC 본더'\],/g, 
`stars: 5,
      sector: '반도체',
      theme: 'AI 반도체/장비',
      tags: ['주도주', '거래대금 최상위'],
      relatedThemes: ['AI 반도체', 'HBM3E', 'TC 본더'],`);

// Add for 196170
code = code.replace(/stars: 4,\s*relatedThemes: \['항암신약', '기술수출', '바이오시밀러'\],/g, 
`stars: 4,
      sector: '제약/바이오',
      theme: '항암신약',
      tags: ['급등주', '외인/기관 양매수'],
      relatedThemes: ['항암신약', '기술수출', '바이오시밀러'],`);

fs.writeFileSync('server-core/platform_engine.ts', code);
