import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Zap, Sparkles, Loader2, AlertCircle, BarChart3, Building, HelpCircle, ArrowRight
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
      if (seenTickers.has(ticker)) return false;
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
  const jodojuList = React.useMemo(() => {
    return [...rawJodojuList]
      .sort((a, b) => b.changeRate - a.changeRate)
      .slice(0, 10);
  }, [rawJodojuList]);

  // Selection states
  const [selectedTicker, setSelectedTicker] = useState<string>('');
  const [analysisCache, setAnalysisCache] = useState<Record<string, { technicalAnalysis: string; financialAnalysis: string }>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial selected stock
  useEffect(() => {
    if (jodojuList.length > 0 && !selectedTicker) {
      setSelectedTicker(jodojuList[0].ticker);
    }
  }, [jodojuList, selectedTicker]);

  // Fetch quantitative analysis when selected stock changes
  useEffect(() => {
    if (!selectedTicker) return;

    // Check from current state/ref without putting the entire cache in dependencies
    let alreadyHasCache = false;
    setAnalysisCache(prev => {
      if (prev[selectedTicker]) {
        alreadyHasCache = true;
      }
      return prev;
    });

    if (alreadyHasCache) {
      return;
    }

    const currentStock = jodojuList.find(s => s.ticker === selectedTicker);
    if (!currentStock) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/platform/jodoju-analysis?ticker=${currentStock.ticker}&name=${encodeURIComponent(currentStock.name)}&closePrice=${currentStock.closePrice || 0}&changeRate=${currentStock.changeRate || 0}&tradeValue=${currentStock.tradeValue || 0}`);
        if (!res.ok) {
          throw new Error('AI 분석 정보를 가져오지 못했습니다.');
        }
        const data = await res.json();
        setAnalysisCache(prev => ({
          ...prev,
          [selectedTicker]: {
            technicalAnalysis: data.technicalAnalysis,
            financialAnalysis: data.financialAnalysis
          }
        }));
      } catch (err: any) {
        console.error('[Jodoju View] Failed to fetch dynamic AI analysis:', err);
        setError(err.message || '데이터 로딩 오류');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [selectedTicker, jodojuList]);

  const currentStock = jodojuList.find(s => s.ticker === selectedTicker) || jodojuList[0];
  const activeAnalysis = selectedTicker ? analysisCache[selectedTicker] : null;

  if (jodojuList.length === 0) {
    return (
      <div className="col-span-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-16 text-center flex flex-col items-center justify-center gap-3">
        <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
        <span className="text-sm font-black text-slate-800 dark:text-slate-200">당일 주도주 분석 데이터를 불러오는 중입니다...</span>
        <span className="text-[11px] text-slate-500 dark:text-slate-500">실시간 종목 발굴 및 AI 수급 입체 보고서를 최신화하고 있습니다.</span>
      </div>
    );
  }

  return (
    <div className="col-span-12 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 md:p-6 flex flex-col gap-6" id="jodoju-analysis-container">
      {/* Title Header with Merged Dropdown */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            <span>당일주도주 정량 분석센터 ({report?.date ? `${parseInt(report.date.split('-')[1])}월 ${parseInt(report.date.split('-')[2])}일` : '당일'}) ({jodojuList.length}종목)</span>
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
            인간의 주관적 예측과 과장을 배제하고, 실시간 구글 검색(Google Search) 팩트체크 기반의 회계학적·통계적 지표 보고서만 제공합니다.
          </p>
        </div>

        {/* Elegant Merged Stock Selector Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-2 px-3 shadow-sm">
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">주도주 종목 선택 (Select Stock):</span>
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs rounded-lg px-3 py-2 font-black focus:outline-none focus:ring-2 focus:ring-indigo-500/40 cursor-pointer min-w-[240px]"
            id="jodoju-stock-dropdown-select"
          >
            {jodojuList.map((stk, idx) => (
              <option key={stk.ticker} value={stk.ticker}>
                [{idx + 1}위] {stk.name} ({stk.ticker}) | +{stk.changeRate?.toFixed(2)}%
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Full-Width Multi-Pane Layout (Sidebar completely removed) */}
      <div className="flex flex-col gap-6">
        {currentStock && (
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-xl p-5 shadow-md flex flex-col gap-4">
            {/* Selected Stock Overview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-850 pb-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shrink-0">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">{currentStock.name}</h3>
                    <span className="text-xs font-mono text-slate-500">{currentStock.ticker}</span>
                  </div>
                  {/* Basic Info Badges */}
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="bg-red-500/10 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-md">
                      종가: {currentStock.closePrice ? `${currentStock.closePrice.toLocaleString()}원` : '종가 데이터'} (+{currentStock.changeRate?.toFixed(2)}%)
                    </span>
                    <span className="bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-800">
                      거래대금: {currentStock.tradeValue ? `${Math.round(currentStock.tradeValue).toLocaleString()}억` : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Launch Chart Simulator Button */}
              <button
                onClick={() => onSelectStockForReplay(currentStock.ticker)}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-red-950/10 shrink-0"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>이 종목으로 복기 시뮬레이터 시작</span>
                <ArrowRight className="w-3 h-3 ml-0.5" />
              </button>
            </div>

            {/* Dynamic Theme / Rise Reason Card */}
            <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3.5 border border-slate-200/50 dark:border-slate-800 text-left">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {(currentStock.relatedThemes || []).map((theme: string, tIdx: number) => (
                  <span 
                    key={tIdx} 
                    className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-[9px] font-black px-2 py-0.5 rounded border border-indigo-500/10 transition"
                  >
                    #{theme}
                  </span>
                ))}
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                <span className="text-amber-500/90 font-black">💡 급등 재료 팩트:</span> {currentStock.riseReason}
              </p>
              {currentStock.supplyDemand && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-1">
                  <span className="font-semibold text-slate-400">📊 거래량 및 수급:</span> {typeof currentStock.supplyDemand === 'object' ? `외인 ${currentStock.supplyDemand.foreigner || 'N/A'} | 기관 ${currentStock.supplyDemand.institution || 'N/A'}` : currentStock.supplyDemand}
                </p>
              )}
            </div>

            {/* Interactive Agent Tabs Output */}
            <div className="mt-2 flex flex-col gap-6">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                  <span className="text-xs font-extrabold text-slate-600 dark:text-slate-400">
                    정량적 시황 분석 에이전트가 가동 중입니다...
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 max-w-sm text-center">
                    실시간 거래대금, 주요 이동평균선 격차, 미상환 공시 잔액 및 재무제표 팩트를 검색/연동 중입니다.
                  </span>
                </div>
              ) : error ? (
                <div className="flex items-center gap-3 bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-red-400 text-xs">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <div>
                    <p className="font-bold">분석 보고서를 생성하는 도중 오류가 발생했습니다.</p>
                    <p className="text-[10px] text-red-500/80 mt-0.5">{error}</p>
                  </div>
                </div>
              ) : activeAnalysis ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left" id="jodoju-analysis-grid-layout">
                  
                  {/* Agent 1: Quantitative Technical Agent */}
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="flex h-2 w-2 rounded-full bg-amber-500" />
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        정량적 기술적 분석 에이전트
                      </h4>
                    </div>
                    <div className="text-xs leading-relaxed pr-1">
                      <QuickMarkdown text={activeAnalysis.technicalAnalysis} />
                    </div>
                  </div>

                  {/* Agent 2: Financial Data / Event Check Agent */}
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4.5 flex flex-col gap-3 relative overflow-hidden group">
                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                      <span className="flex h-2 w-2 rounded-full bg-cyan-500" />
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-100">
                        금융 데이터 및 공시 팩트 에이전트
                      </h4>
                    </div>
                    <div className="text-xs leading-relaxed pr-1">
                      <QuickMarkdown text={activeAnalysis.financialAnalysis} />
                    </div>
                  </div>

                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-slate-400">
                  <HelpCircle className="w-8 h-8 opacity-40" />
                  <span className="text-xs">데이터 로딩에 필요한 종목 코드를 검증 중입니다.</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Markdown inline bold parser inside bullet points
function QuickMarkdown({ text }: { text: string }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-2.5 font-sans text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-left">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-1" />;
        
        // Skip some main title duplication if exists
        if (trimmed.startsWith('### [') && idx === 0) return null;

        // Horizontal rule
        if (trimmed === '---') {
          return <hr key={idx} className="border-slate-200 dark:border-slate-800 my-3" />;
        }
        
        // Header 3
        if (trimmed.startsWith('### ')) {
          return (
            <h5 key={idx} className="text-xs font-black text-slate-900 dark:text-white tracking-tight border-b border-slate-200 dark:border-slate-800 pb-1 mt-4 mb-2 flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-indigo-500 rounded-full" />
              {trimmed.substring(4)}
            </h5>
          );
        }

        // Header 4
        if (trimmed.startsWith('#### ')) {
          return (
            <h6 key={idx} className="text-xs font-bold text-indigo-500 dark:text-indigo-400 tracking-tight mt-3 mb-1 font-sans">
              {trimmed.substring(5)}
            </h6>
          );
        }

        // Bullet points (both * and -)
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2);
          return (
            <li key={idx} className="list-none pl-3 relative text-slate-700 dark:text-slate-300 text-xs leading-relaxed">
              <span className="absolute left-0 top-1.5 h-1 w-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
              {renderInlineBold(content)}
            </li>
          );
        }

        // Markdown Table Row
        if (trimmed.startsWith('|')) {
          if (trimmed.includes('---')) return null;
          
          const cells = trimmed.split('|').map(c => c.trim()).filter((_, cIdx, arr) => cIdx > 0 && cIdx < arr.length - 1);
          const isHeader = idx === 0 || (lines[idx - 1] && lines[idx - 1].trim() === '---') || (lines[idx + 1] && lines[idx + 1].trim().includes('---'));
          
          if (isHeader) {
            return (
              <div key={idx} className="grid grid-cols-12 gap-1.5 bg-slate-200 dark:bg-slate-900 text-slate-700 dark:text-slate-400 px-2 py-1.5 text-xs font-bold uppercase tracking-wider rounded border border-slate-300 dark:border-slate-800 mt-2">
                <div className="col-span-4">{cells[0] || '지표'}</div>
                <div className="col-span-4 text-center">{cells[1] || '수치'}</div>
                <div className="col-span-4 text-right">{cells[2] || '판정'}</div>
              </div>
            );
          } else {
            return (
              <div key={idx} className="grid grid-cols-12 gap-1.5 border-b border-slate-200/50 dark:border-slate-800/60 px-2 py-1.5 text-xs text-slate-600 dark:text-slate-400 font-mono items-center">
                <div className="col-span-4 font-sans font-bold text-slate-800 dark:text-slate-200">{cells[0]}</div>
                <div className="col-span-4 text-center font-bold text-indigo-500">{cells[1]}</div>
                <div className="col-span-4 text-right text-slate-500">{renderInlineBold(cells[2] || '')}</div>
              </div>
            );
          }
        }

        // Normal Paragraph text
        return <p key={idx} className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed">{renderInlineBold(trimmed)}</p>;
      })}
    </div>
  );
}

// Sub-component helper to split by ** and highlight bold matches with high contrast styling
function renderInlineBold(text: string) {
  if (!text) return '';
  const parts = text.split('**');
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong key={i} className="text-amber-500 dark:text-amber-400 font-extrabold bg-amber-500/5 px-1 rounded border border-amber-500/10 inline-block">
          {part}
        </strong>
      );
    }
    return part;
  });
}

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
