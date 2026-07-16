import React from 'react';
import { 
  TrendingUp, Zap, Sparkles
} from 'lucide-react';
import { AfterMarketReport } from '../types';

interface JodojuAnalysisViewProps {
  report: AfterMarketReport | null;
  onSelectStockForReplay: (code: string) => void;
}

const JODOJU_STOCKS: any[] = [
  { ticker: "049080", name: "기가레인", changeRate: 29.98, tradeValuePct: 212, relatedThemes: ["반도체장비", "6G 안테나", "유리기판"] },
  { ticker: "044340", name: "위닉스", changeRate: 29.97, tradeValuePct: 62, relatedThemes: ["여름제습기", "폭염대비", "가전"] },
  { ticker: "037070", name: "파세코", changeRate: 25.32, tradeValuePct: 996, relatedThemes: ["여름계절가전", "창문형에어컨"] },
  { ticker: "012450", name: "한울소재과학", changeRate: 19.76, tradeValuePct: 40, relatedThemes: ["통신장비", "광전송부품"] },
  { ticker: "042110", name: "에스씨디", changeRate: 13.13, tradeValuePct: 250, relatedThemes: ["가전부품", "에어컨공조"] },
  { ticker: "413630", name: "SK이터닉스", changeRate: 12.14, tradeValuePct: 4054, relatedThemes: ["신재생에너지", "해상풍력"] },
  { ticker: "035420", name: "앤로보틱스", changeRate: 11.17, tradeValuePct: 112, relatedThemes: ["로봇제어", "기계"] },
  { ticker: "475150", name: "씨피시스템", changeRate: 10.6, tradeValuePct: 214, relatedThemes: ["로봇부품", "케이블체인"] },
  { ticker: "003680", name: "한성기업", changeRate: 9.93, tradeValuePct: 1112, relatedThemes: ["K-푸드", "수산물", "김가격상승"] },
  { ticker: "002700", name: "신일전자", changeRate: 9.83, tradeValuePct: 561, relatedThemes: ["여름계절가전", "폭염대비"] }
];

export const JODOJU_STATIC_DETAILS: Record<string, any> = {
  "000250": {
    closePrice: 164500,
    relatedThemes: ["바이오", "황반변성", "아일리아 복제약", "경구용 인슐린"],
    riseReason: "유럽 주요 9개국 아일리아 바이오시밀러 독점 공급 계약 체결 소식 및 경구용 인슐린 글로벌 임상 순항 기대감",
    foreigner: "+150억 순매수 우위"
  },
  "237690": {
    closePrice: 104200,
    relatedThemes: ["RNA", "올리고뉴클레오타이드", "mRNA", "원료의약품"],
    riseReason: "글로벌 제약사향 올리고핵산 원료의약품 대규모 장기 수주 공시 및 설비 증설에 따른 본격적인 매출 턴어라운드",
    foreigner: "+90억 순매수"
  },
  "195440": {
    closePrice: 18200,
    relatedThemes: ["PCB", "유리기판", "반도체 장비", "온디바이스 AI"],
    riseReason: "글로벌 반도체 대기업향 유리기판 핵심 제조 설비 공급 개시 및 고다층 PCB 습식 설비 신규 납품 기대감 고조",
    foreigner: "+110억 외인 강한 순매수"
  },
  "196170": {
    closePrice: 284500,
    relatedThemes: ["바이오 플랫폼", "ALT-B4", "키트루다 SC", "제약 바이오"],
    riseReason: "머크(Merck)의 키트루다 피하주사(SC) 제형 글로벌 임상 3상 최종 통과 및 기술 로열티 유입 본격화 전망",
    foreigner: "+280억 외인 순매수"
  },
  "257720": {
    closePrice: 42100,
    relatedThemes: ["화장품 수출", "K-Beauty", "글로벌 유통 플랫폼", "미국 역직구"],
    riseReason: "미국 및 유럽 현지 물류센터 증설 효과로 K-뷰티 유통 역대 최고 분기 실적 연속 갱신 및 신규 브랜드 입점 급증",
    foreigner: "+65억 매수 우위"
  },
  "003230": {
    closePrice: 582000,
    relatedThemes: ["음식료", "불닭볶음면", "수출 급증", "K-Food"],
    riseReason: "미국 월마트 및 유럽 대형 유통 채널 불닭볶음면 입점 확대와 밀양 2공장 조기 가동에 따른 공급 부족 해소",
    foreigner: "+130억 외국인 대량 순매수"
  },
  "042700": {
    closePrice: 172400,
    relatedThemes: ["AI 반도체", "HBM3E", "TC 본더", "후공정 장비"],
    riseReason: "엔비디아 블랙웰 양산 속도 가속화에 따른 SK하이닉스 및 마이크론향 차세대 HBM Dual TC Bonder 역대 최대규모 신규 납품 계약 공시",
    foreigner: "+420억 대량 외인 유입"
  },
  "267260": {
    closePrice: 295000,
    relatedThemes: ["전력설비", "송배전", "초고압 변압기", "AI 데이터센터"],
    riseReason: "미국 전역 인공지능 데이터센터 신설에 따른 초고압 변압기 공급 계약 추가 확보 및 북미 변압기 쇼티지 장기화 수혜",
    foreigner: "+175억 외인 연속 순매수"
  },
  "000660": {
    closePrice: 213500,
    relatedThemes: ["반도체 대장", "HBM3E", "낸드 턴어라운드", "서버향 DRAM"],
    riseReason: "서버향 최고 사양 HBM3E 및 고용량 eSSD 판매 극대화로 역사상 최대 영업이익을 경신하는 어닝 서프라이즈 발표 발표",
    foreigner: "+1890억 역대급 외인 순매수 폭풍"
  },
  "006340": {
    closePrice: 4210,
    relatedThemes: ["전선", "구리 전력망", "초고압 케이블", "AI 전력수요"],
    riseReason: "미국 대형 전력청향 변압기 수혜와 동반되는 초고압 송전선 교체 수요 급증 및 원자재 구리 가격 반등 수혜",
    foreigner: "+32억 외인 매도 우위 극복 후 순매수 전환"
  },
  "141080": {
    closePrice: 112000,
    relatedThemes: ["ADC 치료제", "항암 신약", "기술 수출", "제약 바이오"],
    riseReason: "글로벌 글로벌 빅파마향 수조 원 대 규모 ADC 항암 후보물질 조기 기술 이전 계약 체결 및 선급금 입금 개시",
    foreigner: "+140억 외인 쌍끌이 순매수"
  },
  "028300": {
    closePrice: 89400,
    relatedThemes: ["간암 신약", "리보세라닙", "FDA 승인 재도전", "제약 바이오"],
    riseReason: "간암 치료제 리보세라닙 및 캄렐리주맙 병용요법의 FDA 신약 허가 재신청 본심사 순항 소식 및 최종 승인 확률 증대",
    foreigner: "+45억 코스닥 공매도 숏커버 유입"
  }
};

export const JodojuAnalysisView: React.FC<JodojuAnalysisViewProps> = ({
  report,
  onSelectStockForReplay
}) => {
  // Extract jodoju list based on report.jodoju15 if available, falling back to static JODOJU_STOCKS
  let rawJodojuList: any[] = [];
  if (report?.jodoju15 && report.jodoju15.length > 0) {
    const seenTickers = new Set<string>();
    const uniqueJodoju15 = report.jodoju15.filter((r: any) => {
      const ticker = r.ticker || r.code;
      if (!ticker) return false;
      if (seenTickers.has(ticker)) {
        return false;
      }
      seenTickers.add(ticker);
      return true;
    });

    rawJodojuList = uniqueJodoju15.map((r: any) => ({
      ticker: r.ticker || r.code,
      name: r.name,
      closePrice: r.closePrice,
      changeRate: r.changeRate,
      tradeValue: r.tradeValuePct || r.tradeValue,
      relatedThemes: r.relatedThemes,
      riseReason: r.riseReason,
      supplyDemand: r.supplyDemand,
      aiSummary: r.aiSummary,
      aiAnalysis: r.aiAnalysis
    }));
  } else {
    rawJodojuList = JODOJU_STOCKS.map(stk => {
      const details = JODOJU_STATIC_DETAILS[stk.ticker] || {};
      return {
        ticker: stk.ticker,
        name: stk.name,
        closePrice: details.closePrice || 1000,
        changeRate: stk.changeRate,
        tradeValue: stk.tradeValuePct,
        relatedThemes: stk.relatedThemes || details.relatedThemes || [],
        riseReason: details.riseReason || '당일 주도주 급등',
        supplyDemand: details.foreigner || '',
        aiSummary: details.aiSummary || '',
        aiAnalysis: details
      };
    });
  }

  // Force sort by changeRate (상승률) descending and limit to exactly 10 stocks as requested!
  const jodojuList = [...rawJodojuList]
    .sort((a, b) => b.changeRate - a.changeRate)
    .slice(0, 10);

  if (jodojuList.length === 0) {
    return (
      <div className="col-span-12 bg-slate-900 border border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
        <span className="text-sm font-black text-slate-200">당일 주도주 분석 데이터를 불러오는 중입니다...</span>
        <span className="text-[11px] text-slate-500">실시간 종목 발굴 및 AI 수급 입체 보고서를 최신화하고 있습니다.</span>
      </div>
    );
  }

  return (
    <div className="col-span-12 bg-slate-900 border border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col gap-6">
      {/* Title Header */}
      <div className="border-b border-slate-800 pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>당일주도주 분석 리스트 ({report?.date ? `${parseInt(report.date.split('-')[1])}월 ${parseInt(report.date.split('-')[2])}일` : '당일'}) ({jodojuList.length}종목)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            실전 차트 복기 시뮬레이터가 엄선한 오늘 시장의 최상위 거래대금 주도주 리스트입니다. 각 종목의 상세 정보 및 재료를 확인하고 복기 시뮬레이션을 즐겨보세요.
          </p>
        </div>
      </div>

      {/* Grid of 10 Leading Stocks */}
      <div className="flex flex-col gap-4">
        {jodojuList.map((stk, idx) => {
          const isUp = stk.changeRate >= 0;
          const themes = stk.relatedThemes || [];
          
          return (
            <div 
              key={stk.ticker} 
              className="bg-slate-950 hover:bg-slate-950/80 border border-slate-850 hover:border-indigo-500/30 rounded-xl p-4 md:p-5 transition-all duration-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4 group"
            >
              {/* Left Column: Rank, Stock Info, Theme Tags */}
              <div className="flex items-start gap-4 flex-1">
                {/* Rank Badge */}
                <div className="bg-slate-900 border border-slate-800 h-10 w-10 rounded-lg flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] text-slate-500 font-bold leading-none">RANK</span>
                  <span className="text-sm font-black text-amber-400 leading-none mt-1">{idx + 1}</span>
                </div>

                {/* Stock Details */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-sm font-black text-slate-100 group-hover:text-indigo-400 transition-colors">
                      {stk.name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {stk.ticker}
                    </span>
                    {/* Price and Change */}
                    <div className="flex items-center gap-1.5 ml-0 lg:ml-2">
                      <span className="text-xs font-mono text-slate-300">
                        {stk.closePrice ? `${stk.closePrice.toLocaleString()}원` : ''}
                      </span>
                      <span className={`text-xs font-black font-mono px-1.5 py-0.5 rounded ${
                        isUp ? 'bg-red-500/10 text-red-400' : 'bg-blue-500/10 text-blue-400'
                      }`}>
                        {isUp ? '+' : ''}{stk.changeRate?.toFixed(2)}%
                      </span>
                    </div>
                    {/* Trading Value */}
                    <span className="bg-slate-900 border border-slate-800/80 text-slate-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded">
                      거래대금: {stk.tradeValue ? `${Math.round(stk.tradeValue).toLocaleString()}억` : 'N/A'}
                    </span>
                  </div>

                  {/* Themes as tags */}
                  {themes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {themes.map((theme: string, tIdx: number) => (
                        <span 
                          key={tIdx} 
                          className="bg-indigo-500/5 hover:bg-indigo-500/10 text-indigo-400 text-[9px] font-bold px-2 py-0.5 rounded border border-indigo-500/10 transition"
                        >
                          #{theme}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Rise Reason description */}
                  <div className="bg-slate-900/50 rounded-lg p-2.5 border border-slate-900 mt-1">
                    <p className="text-[11px] text-slate-300 leading-relaxed font-sans">
                      <span className="text-amber-500/90 font-bold shrink-0">💡 급등 재료:</span> {stk.riseReason}
                    </p>
                    {stk.supplyDemand && (
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1 flex items-center gap-1">
                        <span className="text-slate-500 shrink-0">📊 수급:</span>{' '}
                        {typeof stk.supplyDemand === 'object' ? (
                          <span>
                            외인 {stk.supplyDemand.foreigner || 'N/A'} | 기관 {stk.supplyDemand.institution || 'N/A'}
                          </span>
                        ) : (
                          stk.supplyDemand
                        )}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Start Simulator button */}
              <div className="flex items-center justify-end shrink-0 self-end lg:self-center w-full lg:w-auto">
                <button
                  onClick={() => onSelectStockForReplay(stk.ticker)}
                  className="w-full lg:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-red-950/20"
                >
                  <Zap className="w-3.5 h-3.5 fill-current" />
                  <span>복기 시뮬레이터 시작</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const parseSupplyValue = (text: string): number => {
  if (!text) return 0;
  const cleaned = text.replace(/[^0-9\-+.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const formatSupplyText = (val: number): string => {
  if (val === 0) return '0억';
  return val > 0 ? `+${val}억` : `${val}억`;
};

export const getDetailedAnalysisText = (stock: any): string => {
  if (!stock) return '';
  return `${stock.name} 종목은 당일 테마의 강한 중심 세력의 거래량이 포착되었습니다.`;
};
