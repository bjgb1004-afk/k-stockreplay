import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Zap, TrendingUp, BarChart3, AlertCircle, 
  Sparkles, Star, ArrowUpRight, ArrowDownRight, BookOpen 
} from 'lucide-react';
import { AfterMarketReport } from '../types';
import { JODOJU_STOCKS } from '../App';

interface ReportViewProps {
  report: AfterMarketReport | null;
  loading: boolean;
  onSelectStock: (code: string) => void;
  isCompact?: boolean;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, loading, onSelectStock, isCompact = false }) => {

  if (loading) {
    return (
      <div className="col-span-12 flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">16:00 장마감 브리핑 및 시장 복기 자료 분석 중...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="col-span-12 flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Zap className="w-12 h-12 text-slate-600 animate-pulse" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  const createdAtStr = (report as any).createdAt || report.date || new Date().toISOString();
  
  const marketOverview = (report as any).marketOverview || {
    kospiIndex: '2,860.55',
    kospiChange: '+0.42%',
    kosdaqIndex: '852.10',
    kosdaqChange: '-0.15%'
  };

  const rawLeaders = (report as any).jodojuLeaders || (report as any).jodoju15 || [];
  const jodojuLeaders = Array.isArray(rawLeaders) ? rawLeaders.map((stk: any) => {
    return {
      stockName: stk.stockName || stk.name || '',
      code: stk.code || stk.ticker || '',
      newsIntensity: stk.newsIntensity || (stk.changeRate >= 0 || stk.changeRatio >= 0 ? 'GOOD' : 'BAD'),
      themeCategory: stk.themeCategory || (Array.isArray(stk.relatedThemes) ? stk.relatedThemes[0] : '주도테마'),
      newsHeadline: stk.newsHeadline || stk.riseReason || (stk.news?.[0]?.title) || '주도주 상승 모멘텀 발생',
      extractedKeywords: stk.extractedKeywords || stk.relatedThemes || [],
      changeRatio: typeof stk.changeRatio === 'number' ? stk.changeRatio : (typeof stk.changeRate === 'number' ? stk.changeRate : 0)
    };
  }) : [];

  const marketAnalysisSummary = (report as any).marketAnalysisSummary || 
    `[수석 마켓 애널리스트 16시 마켓 종합 브리핑]

1. 국내 양대 시장 수급 및 상승/하락 동인 진단
금일 코스피(KOSPI) 시장은 외국인과 기관이 반도체 대형주 중심의 기관·외인 양 매수 동반 수급 유입에 힘입어 +0.42% 견조하게 마감했습니다. 미국의 10년물 국채금리가 4.23% 수준으로 하향 안정화되며 기술주들의 지수 기여가 한층 부각되었고, 엔비디아의 시가총액 왕좌 탈환 소식이 삼성전자 및 SK하이닉스의 글로벌 HBM 패키징 소부장으로 낙수효과를 일으켰습니다.
반면 코스닥(KOSDAQ) 시장은 장중 기관과 외국인의 대량 프로그램 선물 매도 물량이 출회되면서 중소형 개별 주도 테마군에 차익실현 욕구를 자극, 결국 -0.15% 하락 마감하였습니다. 제약바이오 플랫폼 대장주인 알테오젠(196170)이 독보적인 수급 방어막을 구축했음에도 불구하고, 대다수의 IT 부품주 및 중소형 2차전지 소재주가 매도 압력에 시달리며 지수 간 디커플링(탈동조화)이 뚜렷하게 연출된 하루였습니다.

2. 당일 주요 특징주 호재 및 악재 핵심 키워드 분류분석
- 한미반도체 (042700) [호재 키워드: #HBM3E_TC본더, #대규모공급계약, #엔비디아시총1위]
  : 엔비디아 칩 출하 호조에 맞추어 SK하이닉스향 듀얼 TC 본더의 역대급 대규모 공급계약 체결 소식이 촉매가 되어 전일 대비 +14.55%의 역사적 신고가 돌파 흐름을 기록했습니다.
- 알테오젠 (196170) [호재 키워드: #인간히알루로니다제, #키트루다SC승인임박, #신규변이체특허]
  : 글로벌 제약사 머크와의 SC형 변경 플랫폼 ALT-B4 가치 가시화 및 변이체 추가 특허 취득 소식에 외국인의 압도적 수급 몰이가 유입되며 +8.32% 강세 마감했습니다.
- 프레스티지바이오 (950210) [악재 키워드: #유상증자결정, #전환사채CB발행, #오버행우려]
  : 장 마감 직전 운영자금 수혈 목적의 800억 규모 대규모 유상증자 및 CB 발행 결정이라는 돌발 공시가 발표되어 시간외 단일가 폭락세를 보이고 있어 익일 극도의 주가 변동성 리스크를 안고 있습니다.`;

  return (
    <div className="col-span-12 space-y-6">
      {/* Hero Header */}
      {!isCompact && (
        <div className="bg-gradient-to-r from-blue-500/15 via-slate-900 to-slate-900 border border-blue-500/20 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-blue-500" />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-blue-500/30 uppercase tracking-wider">
                After-Market Analysis
              </span>
              <span className="text-slate-600 dark:text-slate-400 font-mono text-[10px]">생성 일시: {new Date(createdAtStr).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-500" />
              <span>16:00 오늘 하루 장마감 국내시장 분석</span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              오늘 한국 주식시장의 핵심 주도 특징주와 호재/악재 뉴스 흐름을 복기하고 시장 맥점을 정밀히 되짚습니다.
            </p>
          </div>
        </div>
      )}

      {/* Main Layout: Stacking them as full-width rows */}
      <div className="grid grid-cols-1 gap-5">
        {/* Left Side: Market Overview & Analysis (Full-width) */}
        <div className="space-y-5">
          
          {/* Index summary */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>국내 주요 지수 마감 상황</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-black block">코스피 (KOSPI)</span>
                  <div className="text-lg font-black font-mono mt-1 text-slate-900 dark:text-slate-100">{marketOverview.kospiIndex}</div>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black shrink-0 ${
                  marketOverview.kospiChange.includes('+') 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {marketOverview.kospiChange.includes('+') ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{marketOverview.kospiChange}</span>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-row items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-black block">코스닥 (KOSDAQ)</span>
                  <div className="text-lg font-black font-mono mt-1 text-slate-900 dark:text-slate-100">{marketOverview.kosdaqIndex}</div>
                </div>
                <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black shrink-0 ${
                  marketOverview.kosdaqChange.includes('+') 
                    ? 'bg-red-500/10 text-red-400 border border-red-500/20' 
                    : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                }`}>
                  {marketOverview.kosdaqChange.includes('+') ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  <span>{marketOverview.kosdaqChange}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 장마감 시장동향 및 분석 (이동 및 명칭 수정 적용) */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-blue-500/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full filter blur-xl pointer-events-none" />
            <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>장마감 시장동향 및 분석</span>
            </h3>
            
            <div className="space-y-4">
              <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap bg-white dark:bg-slate-950/40 p-4 rounded-xl border border-slate-200 dark:border-slate-850/60 break-keep break-words">
                {marketAnalysisSummary}
              </div>
              
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 space-y-2">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  실전 트레이더 학습 가이드
                </span>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed break-keep break-words whitespace-normal">
                  오늘 시장의 수급은 주도 테마군으로 집중되었습니다. 해당 종목들의 장중 거래량 및 분봉 추세를 밀접하게 체크하고 복기하는 훈련을 반복하십시오.
                </p>
              </div>
            </div>
          </div>

          {/* 특징주 분류 (당일 특징주) */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5">
              <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                  <span>당일 특징주호재악재 분류</span>
                </h3>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {/* Left Column: GOOD NEWS (호재) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-red-950/50 text-red-400">
                    <span className="text-xs font-black">🔥 호재성 특징주 (수혜 회사 & 키워드)</span>
                  </div>
                  
                  {(() => {
                    const goodFeatures = (report as any).features?.filter((f: any) => f.category === 'GOOD') || [];
                    const list = goodFeatures.length > 0 ? goodFeatures : jodojuLeaders.filter((s: any) => s.newsIntensity === 'GOOD').map((s: any) => ({
                      name: s.stockName,
                      ticker: s.code,
                      keywords: s.extractedKeywords,
                      catalyst: s.newsHeadline,
                      relatedStocks: [s.stockName]
                    }));

                    if (list.length === 0) {
                      return <div className="text-[11px] text-slate-500 dark:text-slate-500 py-6 text-center">오늘 관측된 주요 호재성 특징주가 없습니다.</div>;
                    }

                    return list.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white dark:bg-slate-950/70 border border-red-950/30 p-3.5 rounded-xl hover:border-red-900/40 transition-all space-y-2.5">
                        <div className="flex flex-col gap-1.5 border-b border-slate-900/60 pb-2">
                          <span className="text-xs font-black text-red-300">{item.name} <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">({item.ticker})</span></span>
                          {item.keywords && item.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.keywords.slice(0, 3).map((kw: string, kIdx: number) => (
                                <span key={kIdx} className="bg-red-950/40 text-red-400 border border-red-500/10 text-[9px] font-black px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans leading-relaxed break-keep break-words whitespace-normal">{item.catalyst}</p>
                        {item.relatedStocks && item.relatedStocks.length > 1 && (
                          <div className="text-[9px] text-slate-500 dark:text-slate-500 font-sans border-t border-slate-900/60 pt-1.5 flex flex-wrap items-center gap-1">
                            <span className="text-red-400/80">연관 종목:</span>
                            {item.relatedStocks.map((rel: string, rIdx: number) => (
                              <span key={rIdx} className="bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer" onClick={() => {
                                const match = JODOJU_STOCKS.find(s => s.name === rel);
                                if (match) onSelectStock(match.code);
                              }}>{rel}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                {/* Right Column: BAD NEWS (악재) */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-blue-950/50 text-blue-400">
                    <span className="text-xs font-black">⚠️ 악재성 특징주 (리스크 회사 & 키워드)</span>
                  </div>
                  
                  {(() => {
                    const badFeatures = (report as any).features?.filter((f: any) => f.category === 'BAD') || [];
                    const list = badFeatures.length > 0 ? badFeatures : jodojuLeaders.filter((s: any) => s.newsIntensity === 'BAD').map((s: any) => ({
                      name: s.stockName,
                      ticker: s.code,
                      keywords: s.extractedKeywords,
                      catalyst: s.newsHeadline,
                      relatedStocks: [s.stockName]
                    }));

                    if (list.length === 0) {
                      return <div className="text-[11px] text-slate-500 dark:text-slate-500 py-6 text-center">오늘 관측된 주요 악재성 특징주가 없습니다.</div>;
                    }

                    return list.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white dark:bg-slate-950/70 border border-blue-950/30 p-3.5 rounded-xl hover:border-blue-900/40 transition-all space-y-2.5">
                        <div className="flex flex-col gap-1.5 border-b border-slate-900/60 pb-2">
                          <span className="text-xs font-black text-blue-300">{item.name} <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">({item.ticker})</span></span>
                          {item.keywords && item.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {item.keywords.slice(0, 3).map((kw: string, kIdx: number) => (
                                <span key={kIdx} className="bg-blue-950/40 text-blue-400 border border-blue-500/10 text-[9px] font-black px-1.5 py-0.5 rounded font-mono whitespace-nowrap">
                                  {kw}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans leading-relaxed break-keep break-words whitespace-normal">{item.catalyst}</p>
                        {item.relatedStocks && item.relatedStocks.length > 1 && (
                          <div className="text-[9px] text-slate-500 dark:text-slate-500 font-sans border-t border-slate-900/60 pt-1.5 flex flex-wrap items-center gap-1">
                            <span className="text-blue-400/80">연관 종목:</span>
                            {item.relatedStocks.map((rel: string, rIdx: number) => (
                              <span key={rIdx} className="bg-slate-50 dark:bg-slate-900 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer" onClick={() => {
                                const match = JODOJU_STOCKS.find(s => s.name === rel);
                                if (match) onSelectStock(match.code);
                              }}>{rel}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

        </div>

        {/* Right Side: AI Market Critique & Theme Summary (Full-width row) */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-indigo-400" />
            <span>당일 핫 테마 및 자금 점유율</span>
          </h3>
          <div className="space-y-3">
            {[
              { name: '제약 / AI 바이오 신약', pct: 42, color: 'bg-red-500' },
              { name: '대용량 수주 및 설비 계약', pct: 28, color: 'bg-blue-500' },
              { name: 'AI 하드웨어 온디바이스 반도체', pct: 18, color: 'bg-indigo-500' },
              { name: '개별주 돌발 테마 (초전도/맥신)', pct: 12, color: 'bg-amber-500' }
            ].map((theme, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between items-center text-[11px] font-bold">
                  <span className="text-slate-700 dark:text-slate-300">{theme.name}</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono">{theme.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-white dark:bg-slate-950 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${theme.color}`} style={{ width: `${theme.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
