const fs = require('fs');
let code = fs.readFileSync('src/components/AfterMarketNews.tsx', 'utf-8');

code = code.replace(
  /<div className="text-sm font-black text-slate-800 dark:text-slate-200">2,785\.40<\/div>\n\s*<div className="text-\[10px\] font-bold text-rose-500">\+1\.25% \(연중 최고점 경신 임박\)<\/div>/,
  '<div className="text-sm font-black text-slate-800 dark:text-slate-200">6,820.60</div>\n                <div className="text-[10px] font-bold text-sky-500">-6.37% (대형주 중심 강력한 매도세)</div>'
);

code = code.replace(
  /<div className="text-sm font-black text-slate-800 dark:text-slate-200">885\.20<\/div>\n\s*<div className="text-\[10px\] font-bold text-rose-500">\+0\.85% \(안정적 지지선 확보\)<\/div>/,
  '<div className="text-sm font-black text-slate-800 dark:text-slate-200">791.84</div>\n                <div className="text-[10px] font-bold text-sky-500">-4.53% (800선 붕괴 및 지지선 이탈)</div>'
);

code = code.replace(
  /<span className="text-indigo-500 dark:text-indigo-400 font-bold">외국인 4,500억 순매수<\/span> 주도로 지수 상승을 견인했으며,\n\s*기관\(-1,200억\)과 개인\(-3,300억\)은 차익 실현에 나섰습니다\.\n\s*특히 프로그램 매매에서 <span className="font-bold text-slate-700 dark:text-slate-300">비차익 중심 2,500억 순매수<\/span>가 유입되며 대형주 장세를 뒷받침했습니다\./,
  '<span className="text-sky-500 dark:text-sky-400 font-bold">외국인과 기관의 대규모 동반 매도</span> 주도로 지수가 큰 폭으로 하락했으며,\n                개인 투자자들이 반발 매수세로 대응했으나 하락을 방어하기에는 역부족이었습니다.\n                특히 프로그램 매매에서 <span className="font-bold text-slate-700 dark:text-slate-300">대형주 위주의 차익/비차익 대규모 순매도</span>가 출회되며 낙폭을 키웠습니다.'
);

code = code.replace(
  /<div className="text-xs font-black text-slate-800 dark:text-slate-200">1,385\.5원<\/div>/,
  '<div className="text-xs font-black text-slate-800 dark:text-slate-200">1,490.00원</div>'
);

code = code.replace(
  /전일 뉴욕 증시가 혼조세를 보였으나, 필라델피아 반도체 지수의 강세\(5,200선 돌파\)가 국내 증시의 투자 심리를 크게 개선시켰습니다\.\n\s*달러인덱스는 105\.2 수준에서 안정화 추세를 보이고 있습니다\./,
  '미국 10년물 국채금리 반등 및 글로벌 지정학적 긴장감 고조로 위험 자산 회피 심리가 극대화되었습니다.\n            원/달러 환율은 1,490원선으로 재차 상승하며 외국인 수급 이탈을 가속화시켰습니다.'
);

code = code.replace(
  /<span className="px-2 py-1 bg-rose-50 dark:bg-rose-500\/10 text-rose-600 dark:text-rose-400 text-\[10px\] font-bold rounded">HBM 및 온디바이스 AI ⬆️<\/span>\n\s*<span className="px-2 py-1 bg-rose-50 dark:bg-rose-500\/10 text-rose-600 dark:text-rose-400 text-\[10px\] font-bold rounded">K-뷰티\/화장품 ⬆️<\/span>\n\s*<span className="px-2 py-1 bg-sky-50 dark:bg-sky-500\/10 text-sky-600 dark:text-sky-400 text-\[10px\] font-bold rounded">2차전지 셀메이커 ⬇️<\/span>/,
  '<span className="px-2 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold rounded">HBM 및 반도체 장비 ⬇️</span>\n                <span className="px-2 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold rounded">자동차 및 완성차 ⬇️</span>\n                <span className="px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded">경기 방어주 및 일부 금융 ⬆️</span>'
);

code = code.replace(
  /<span><strong className="text-slate-800 dark:text-slate-200">삼성전자:<\/strong> 외국인 대량 매수세 유입, HBM 퀄테스트 기대감 부각되며 지수 상승 주도\.<\/span>/,
  '<span><strong className="text-slate-800 dark:text-slate-200">삼성전자 및 SK하이닉스:</strong> 글로벌 반도체 투자심리 악화 여파로 외국인 매물 쏟아지며 급락.</span>'
);

code = code.replace(
  /<span><strong className="text-slate-800 dark:text-slate-200">삼천당제약:<\/strong> 아일리아 바이오시밀러 글로벌 계약 모멘텀으로 거래대금 폭발하며 상한가 도달\.<\/span>/,
  '<span><strong className="text-slate-800 dark:text-slate-200">경기 방어주 (통신, 전력):</strong> 시장 급락 속에서도 피난처 성격의 방어주로 기관 수급 유입되며 상대적 선방.</span>'
);

code = code.replace(
  /외국인은 반도체 소부장\(장비\) 및 실적 턴어라운드가 명확한 화장품 섹터로 바스켓 매수를 집중했습니다\./,
  '외국인은 반도체, 자동차 등 기존 주도 섹터에서 바스켓 매도를 쏟아내며 시장 하방 압력을 가중시켰습니다.'
);

code = code.replace(
  /분기말 임박에 따른 기관의 윈도우 드레싱 자금 유입 조짐이 보이며,\n\s*최근 공매도 과열 종목군\(바이오 일부\)에서 숏커버링\(환매수\)이 유입되며 급등세가 연출되었습니다\./,
  '리스크 오프(Risk-Off) 기조가 강해지며 기관의 방어적 포트폴리오 리밸런싱이 두드러졌고,\n                신용 반대매매 물량까지 일부 출회되며 장 후반 낙폭이 더욱 커지는 특징을 보였습니다.'
);

code = code.replace(
  /코스피는 2,750선 돌파 후 안착을 시도하고 있으며,\n\s*코스닥은 60일선을 강력한 지지선으로 삼아 하방 경직성을 확보했습니다\.\n\s*추격 매수보다는 5일선 지지 확인 후 눌림목 공략이 유효합니다\./,
  '코스피는 7,000선을 내주며 단기 하락 추세로 전환되었으며,\n              코스닥 역시 800선 지지에 실패했습니다.\n              섣부른 저점 매수보다는 외국인 수급의 이탈 진정 여부와 환율 안정을 먼저 확인해야 할 시점입니다.'
);

fs.writeFileSync('src/components/AfterMarketNews.tsx', code, 'utf-8');
console.log('updated AfterMarketNews.tsx');
