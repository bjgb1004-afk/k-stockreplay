const fs = require('fs');
let code = fs.readFileSync('src/components/MorningNews2026.tsx', 'utf-8');

code = code.replace(
  /2026년 7월 17일 금요일 장전 브리핑/,
  '2026년 7월 16일 목요일 장전 브리핑'
);

code = code.replace(
  /<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>52,552\.97<\/div>\n\s*<div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500\/10 px-1\.5 py-0\.5 rounded">-0\.20% ▼<\/div>/,
  '<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>41,200.12</div>\n                  <div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-2.10% ▼</div>'
);

code = code.replace(
  /<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>25,881\.95<\/div>\n\s*<div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500\/10 px-1\.5 py-0\.5 rounded">-1\.50% ▼<\/div>/,
  '<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>18,502.50</div>\n                  <div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-5.80% ▼</div>'
);

code = code.replace(
  /<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>7,533\.77<\/div>\n\s*<div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500\/10 px-1\.5 py-0\.5 rounded">-0\.51% ▼<\/div>/,
  '<div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>5,432.10</div>\n                  <div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-3.50% ▼</div>'
);

code = code.replace(
  /가치주 중심 포진으로 하락폭 방어\. 산업재 및 필수소비재 선방 \/ 성장주 이탈/,
  '전반적인 투자 심리 악화로 대부분의 대형주가 폭락하며 지수 급락 주도'
);

code = code.replace(
  /AI 인프라 투자 회수 지연 우려로 빅테크 차익실현 폭발\. 반도체 집중 매도/,
  '글로벌 반도체 규제 및 AI 캐즘 우려 확산으로 빅테크 중심 투매 물량 쏟아짐'
);

code = code.replace(
  /기술주 약세를 헬스케어 및 에너지 섹터가 일부 상쇄하며 제한적 하락 마감/,
  '전 섹터에 걸친 강력한 매도세가 출회되며 대규모 패닉셀 연출'
);

code = code.replace(
  /나스닥 중심의 가파른 하락세\. AI 기업들의 CAPEX 투자 대비 실질적 수익성 확보 지연에 대한 매크로적 의구심이 확산되며, 빅테크 기술주에서 심한 차익 실현 물량이 출회되었습니다\./,
  '나스닥 중심의 역사적인 폭락세. 미중 반도체 갈등 심화와 주요 기술 기업들의 실적 부진 우려가 겹치며 글로벌 증시에 블랙 먼데이급 공포가 덮쳤습니다.'
);

code = code.replace(
  /<span className={`text-sm font-black text-rose-500 dark:text-rose-400 block`}>1,487원 <span className="text-\[10px\] text-slate-500 font-normal ml-1">\(전일 1,475원\)<\/span><\/span>/,
  '<span className={`text-sm font-black text-rose-500 dark:text-rose-400 block`}>1,488.50원 <span className="text-[10px] text-slate-500 font-normal ml-1">(전일 1,491원)</span></span>'
);


fs.writeFileSync('src/components/MorningNews2026.tsx', code, 'utf-8');
console.log('updated MorningNews2026.tsx');
