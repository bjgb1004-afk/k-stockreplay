const fs = require('fs');

let content = fs.readFileSync('src/components/MorningNews2026.tsx', 'utf-8');

// 1. Update colors for down indices: -0.20%, -1.50%, -0.51%
// The main numbers shouldn't necessarily be blue, but if the user asked, let's make the index numbers blue too.
// User: "수치가 상승이면 빨간색 하락이면 파란색으로 수정해줘 예를 들어 52,552.97 -0.20% ▼"
content = content.replace(
  /<div className=\{`text-sm font-black text-slate-900 dark:text-slate-200`\}>52,552\.97<\/div>/,
  '<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>52,552.97</div>'
);
content = content.replace(
  /<div className="text-xs font-bold text-rose-400 bg-rose-500\/10 px-1\.5 py-0\.5 rounded">-0\.20% ▼<\/div>/,
  '<div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-0.20% ▼</div>'
);

content = content.replace(
  /<div className=\{`text-sm font-black text-slate-900 dark:text-slate-200`\}>25,881\.95<\/div>/,
  '<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>25,881.95</div>'
);
content = content.replace(
  /<div className="text-xs font-bold text-rose-400 bg-rose-500\/10 px-1\.5 py-0\.5 rounded">-1\.50% ▼<\/div>/,
  '<div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-1.50% ▼</div>'
);

content = content.replace(
  /<div className=\{`text-sm font-black text-slate-900 dark:text-slate-200`\}>7,533\.77<\/div>/,
  '<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>7,533.77</div>'
);
content = content.replace(
  /<div className="text-xs font-bold text-rose-400 bg-rose-500\/10 px-1\.5 py-0\.5 rounded">-0\.51% ▼<\/div>/,
  '<div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-0.51% ▼</div>'
);

// 특징주
content = content.replace(
  /<span className="text-xs font-black text-rose-400">\$207\.40 \(-2\.40%\)<\/span>/,
  '<span className="text-xs font-black text-blue-500 dark:text-blue-400">$207.40 (-2.40%)</span>'
);
content = content.replace(
  /<span className="text-xs font-black text-rose-400">\$215\.30 \(-1\.20%\)<\/span>/,
  '<span className="text-xs font-black text-blue-500 dark:text-blue-400">$215.30 (-1.20%)</span>'
);
content = content.replace(
  /<span className="text-xs font-black text-rose-400">\$195\.10 \(-0\.80%\)<\/span>/,
  '<span className="text-xs font-black text-blue-500 dark:text-blue-400">$195.10 (-0.80%)</span>'
);


// 2. Add comparison groups
content = content.replace(
  /<span className=\{`text-sm font-black text-slate-900 dark:text-slate-200 block`\}>3\.50%~3\.75%<\/span>/,
  '<span className={`text-sm font-black text-slate-900 dark:text-slate-200 block`}>3.50%~3.75% <span className="text-[10px] text-slate-500 font-normal ml-1">(이전 3.50%~3.75%)</span></span>'
);

content = content.replace(
  /<span className=\{`text-sm font-black text-slate-900 dark:text-slate-200 block`\}>\+3\.5%<\/span>/,
  '<span className={`text-sm font-black text-slate-900 dark:text-slate-200 block`}>+3.5% <span className="text-[10px] text-slate-500 font-normal ml-1">(예측 3.4%)</span></span>'
);

content = content.replace(
  /<span className=\{`text-sm font-black text-slate-900 dark:text-slate-200 block`\}>\+5\.5%<\/span>/,
  '<span className={`text-sm font-black text-slate-900 dark:text-slate-200 block`}>+5.5% <span className="text-[10px] text-slate-500 font-normal ml-1">(예측 5.3%)</span></span>'
);

content = content.replace(
  /<span className=\{`text-sm font-black text-slate-900 dark:text-slate-200 block`\}>4\.57%<\/span>/,
  '<span className={`text-sm font-black text-rose-500 dark:text-rose-400 block`}>4.57% <span className="text-[10px] text-slate-500 font-normal ml-1">(전일 4.52%)</span></span>'
);

content = content.replace(
  /<span className=\{`text-sm font-black text-slate-900 dark:text-slate-200 block`\}>1,487원<\/span>/,
  '<span className={`text-sm font-black text-rose-500 dark:text-rose-400 block`}>1,487원 <span className="text-[10px] text-slate-500 font-normal ml-1">(전일 1,475원)</span></span>'
);

content = content.replace(
  /<span className=\{`text-sm font-black text-slate-900 dark:text-slate-200 block`\}>\$79\.67<\/span>/,
  '<span className={`text-sm font-black text-rose-500 dark:text-rose-400 block`}>$79.67 <span className="text-[10px] text-slate-500 font-normal ml-1">(전일 $78.20)</span></span>'
);

// 3. Sectors updates
const sectorText = `<strong>수급 이동처:</strong> 하락장 헷지 테마인 원자재/에너지 및 방어주 성격의 대형 제약/바이오 플랫폼 섹터로 수급 대피 현상 발생 확률 높음.`;
const newSectorText = `<strong>수급 이동처:</strong> 하락장 헷지 테마인 원자재/에너지(S-Oil, 흥구석유, 중앙에너비스) 및 방어주 성격의 대형 제약/바이오(삼성바이오로직스, 셀트리온, 유한양행) 섹터로 수급 대피 현상 발생 확률 높음.`;
content = content.replace(sectorText, newSectorText);

fs.writeFileSync('src/components/MorningNews2026.tsx', content, 'utf-8');
console.log('Updated MorningNews2026.tsx');
