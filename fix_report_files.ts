import fs from 'fs';
import path from 'path';

const date = '2026-07-31';
const reportData = {
  id: `report_${date}`,
  date: date,
  market_date: date,
  marketAnalysisSummary: `[15:50 장마감 증시 인사이트]\n\n오늘 코스피 지수는 6,595.45(+17.91%)로 마감하며 강력한 수급 모멘텀을 확인했습니다. 시장의 핵심은 **반도체 벨류체인으로의 집중적인 자금 유입**입니다. 특히 삼성전자와 SK하이닉스가 HBM3E 공급망 확대 소식에 힘입어 지수를 견인했습니다.\n\n* **반도체 주도주 랠리**: 제주반도체, 심텍, 대덕전자 등 소부장 종목들이 AI 반도체 수요 폭발 수혜로 상한가 근접 상승을 기록했습니다.\n* **거시 환경**: 원/달러 환율은 1,436.6원 선에서 변동성을 보였으나, 외국인의 7.4조원 순매수는 환율 리스크를 압도하는 종목 모멘텀이 존재함을 시사합니다.\n* **투자 포인트**: 다음 주 시장은 단기 급등에 따른 차익 실현 압력이 예상되나, 반도체 중심의 주도주 흐름은 실적 시즌 내내 유효할 것으로 판단됩니다.`,
  jodoju10: [
    { ticker: "000660", name: "SK하이닉스", riseReason: "HBM3E 양산 기대감 및 외인 대량 매수", aiSummary: "HBM3E 글로벌 공급망 확대의 중심", tags: ["반도체", "HBM"], sector: "반도체", theme: "AI 인프라" },
    { ticker: "080220", name: "제주반도체", riseReason: "온디바이스 AI 시장 확대 수혜", aiSummary: "저전력 반도체 설계 기술력 입증", tags: ["온디바이스AI"], sector: "반도체", theme: "AI 단말" },
    { ticker: "222800", name: "심텍", riseReason: "메모리 모듈 기판 수주 급증", aiSummary: "패키징 기판 수급 불균형의 최대 수혜", tags: ["기판"], sector: "반도체/장비", theme: "AI 인프라" },
    { ticker: "353200", name: "대덕전자", riseReason: "고부가 패키지 기판 매출 증대", aiSummary: "FC-BGA 믹스 개선 뚜렷", tags: ["기판"], sector: "반도체/장비", theme: "AI 인프라" },
    { ticker: "009150", name: "삼성전기", riseReason: "전장용 MLCC 실적 회복 기대", aiSummary: "고부가 제품 비중 확대로 이익률 방어", tags: ["MLCC"], sector: "IT/소프트웨어", theme: "전장부품" }
  ],
  globalMacro: {
    kospiIndex: "6,595.45",
    kosdaqIndex: "719.76",
    usdKrw: "1,436.6원",
    btc: "91,150,000원"
  },
  published: true,
  published_at: new Date().toISOString()
};

fs.writeFileSync(path.join(process.cwd(), 'data', `afternoon_report_${date}.json`), JSON.stringify(reportData, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'data', 'after_market_report.json'), JSON.stringify(reportData, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'data', `platform_cache_afternoon_report_${date}.json`), JSON.stringify(reportData, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'data', 'platform_cache_afternoon_report.json'), JSON.stringify(reportData, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'data', 'platform_cache_market_leading_stocks.json'), JSON.stringify({ date, jodoju10: reportData.jodoju10, published: true, published_at: new Date().toISOString() }, null, 2));
fs.writeFileSync(path.join(process.cwd(), 'data', `platform_cache_market_leading_stocks_${date}.json`), JSON.stringify({ date, jodoju10: reportData.jodoju10, published: true, published_at: new Date().toISOString() }, null, 2));

console.log("Files written successfully");
