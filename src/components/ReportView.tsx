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
  const displayTodayDate = report.date || (report as any).market_date || (report as any).report_date || '최근 거래일';
  
  const marketOverview = (report as any).marketOverview || {
    kospiIndex: '데이터 미수집',
    kospiChange: '데이터 미수집',
    kosdaqIndex: '데이터 미수집',
    kosdaqChange: '데이터 미수집'
  };

  const rawLeaders = (report as any).jodojuLeaders || (report as any).jodoju10 || [];
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
    `🌐 [16:00 장마감 종합 증시 브리핑]

현재 장마감 리포트를 생성 중이거나, 해당 일자의 실시간 시장 데이터 수집 진행 중입니다. 잠시 후 최신 분석 결과로 업데이트됩니다.`;

  function RenderMarkdown({ text }: { text: string }) {
    if (!text) return null;
    const lines = text.split('\n');
    return (
      <div className="space-y-3 font-sans text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-left">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) return <div key={idx} className="h-1.5" />;
          
          if (trimmed.match(/^(🌐|🔥|💡|📰|🇺🇸|🇰🇷|🚀)\s+.*$/) || trimmed.startsWith('🌐') || trimmed.startsWith('🔥') || trimmed.startsWith('💡')) {
            return (
              <h4 key={idx} className="text-[13px] font-black text-slate-900 dark:text-white tracking-tight border-b border-indigo-500/20 pb-1.5 mt-5 mb-2 flex items-center gap-2">
                {trimmed}
              </h4>
            );
          }

          if (trimmed.startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-1.5">
                <span className="text-indigo-500 dark:text-indigo-400 mt-1 shrink-0 text-[10px]">•</span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {trimmed.substring(2).split(':').map((part, pIdx, arr) => (
                    pIdx === 0 && arr.length > 1 ? <span key={pIdx} className="font-black text-indigo-700 dark:text-indigo-400">{part}:</span> : <span key={pIdx}>{part}</span>
                  ))}
                </p>
              </div>
            );
          }

          return <p key={idx} className="leading-relaxed pl-1 font-medium">{trimmed}</p>;
        })}
      </div>
    );
  }

  return (
    <div className="col-span-12 space-y-6">
      {/* Unified Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse shrink-0" />
          <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            15:50 실시간 장마감 종합 리포트
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10.5px] font-mono font-black rounded-lg">
            기준 일자: {displayTodayDate}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Market Analysis Summary Card (Gradient Pattern) */}
        <div className="bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 dark:from-rose-950/50 dark:via-slate-900 dark:to-slate-950 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between border-b border-rose-150 dark:border-rose-500/20 pb-3">
            <h3 className="text-sm font-black text-rose-900 dark:text-rose-300 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              <span>수석 애널리스트 장마감 종합 시황 진단</span>
            </h3>
            <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-black rounded-md border border-rose-200 dark:border-rose-500/30">
              Daily Closing Analysis
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-white/80 dark:bg-slate-900/90 p-5 rounded-xl border border-rose-100 dark:border-rose-500/20 space-y-1.5 shadow-sm">
              <RenderMarkdown text={marketAnalysisSummary} />
            </div>
            
            <div className="bg-indigo-500/5 border-l-2 border-indigo-500 p-4 rounded-r-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed select-text">
              <span className="text-[10px] font-black text-indigo-650 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 mb-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                실전 트레이더 학습 가이드
              </span>
              <p className="font-medium break-keep">
                오늘 시장의 수급은 주도 테마군으로 집중되었습니다. 해당 종목들의 장중 거래량 및 분봉 추세를 밀접하게 체크하고 복기하는 훈련을 반복하십시오.
              </p>
            </div>
          </div>
        </div>

        {/* Index situation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            <TrendingUp className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
            <span>국내 주요 지수 마감 현황</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { name: '코스피 (KOSPI)', index: marketOverview.kospiIndex, change: marketOverview.kospiChange },
              { name: '코스닥 (KOSDAQ)', index: marketOverview.kosdaqIndex, change: marketOverview.kosdaqChange }
            ].map((idxData, idx) => {
              const isUp = idxData.change.includes('+');
              const isDown = idxData.change.includes('-');
              return (
                <div key={idx} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex flex-row items-center justify-between gap-4 shadow-sm">
                  <div>
                    <span className="text-xs text-slate-600 dark:text-slate-400 font-black block">{idxData.name}</span>
                    <div className="text-lg font-black font-mono mt-1 text-slate-900 dark:text-slate-100">{idxData.index}</div>
                  </div>
                  <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-black shrink-0 ${
                    isUp 
                      ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
                      : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'
                  }`}>
                    {isUp ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    <span>{idxData.change}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feature stocks section */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-5 shadow-sm">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex justify-between items-center">
            <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <Star className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <span>당일 특징주 호재/악재 핵심 분류</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* GOOD NEWS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-rose-500/30 text-rose-500">
                <span className="text-xs font-black">🔥 호재성 특징주 (수혜 회사 & 핵심 키워드)</span>
              </div>
              <div className="space-y-3">
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
                    return <div className="text-[11px] text-slate-500 py-6 text-center">오늘 관측된 주요 호재성 특징주가 없습니다.</div>;
                  }

                  return list.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:border-indigo-500/30 transition-all space-y-3 shadow-sm group">
                      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-850 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">
                            {item.name} <span className="text-[10px] text-slate-500 font-mono">({item.ticker})</span>
                          </span>
                          <ArrowUpRight className="w-3.5 h-3.5 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {item.keywords && item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.keywords.slice(0, 3).map((kw: string, kIdx: number) => (
                              <span key={kIdx} className="bg-rose-500/10 text-rose-500 border border-rose-500/10 text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed break-keep break-words">
                        {item.catalyst}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* BAD NEWS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-sky-500/30 text-sky-500">
                <span className="text-xs font-black">⚠️ 리스크 특징주 (악재 회사 & 핵심 키워드)</span>
              </div>
              <div className="space-y-3">
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
                    return <div className="text-[11px] text-slate-500 py-6 text-center">오늘 관측된 주요 악재성 특징주가 없습니다.</div>;
                  }

                  return list.map((item: any, idx: number) => (
                    <div key={idx} className="bg-slate-50/50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-4 rounded-xl hover:border-indigo-500/30 transition-all space-y-3 shadow-sm group">
                      <div className="flex flex-col gap-2 border-b border-slate-200 dark:border-slate-850 pb-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-slate-100 group-hover:text-indigo-500 transition-colors">
                            {item.name} <span className="text-[10px] text-slate-500 font-mono">({item.ticker})</span>
                          </span>
                          <ArrowDownRight className="w-3.5 h-3.5 text-sky-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        {item.keywords && item.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {item.keywords.slice(0, 3).map((kw: string, kIdx: number) => (
                              <span key={kIdx} className="bg-sky-500/10 text-sky-500 border border-sky-500/10 text-[9px] font-black px-1.5 py-0.5 rounded font-mono">
                                #{kw}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 font-medium leading-relaxed break-keep break-words">
                        {item.catalyst}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>

        {/* Theme and fund share */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
          <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
            <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
            <span>당일 핫 테마 및 수급 점유율 브리핑</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
            {[
              { name: '제약 / AI 바이오 신약', pct: 42, color: 'bg-rose-500' },
              { name: '대용량 수주 및 설비 계약', pct: 28, color: 'bg-indigo-500' },
              { name: 'AI 하드웨어 온디바이스 반도체', pct: 18, color: 'bg-emerald-500' },
              { name: '개별주 돌발 테마 (초전도/맥신)', pct: 12, color: 'bg-amber-500' }
            ].map((theme, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between items-center text-[11px] font-black">
                  <span className="text-slate-700 dark:text-slate-300">{theme.name}</span>
                  <span className="text-slate-600 dark:text-slate-400 font-mono tracking-tighter">{theme.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200/30 dark:border-slate-800/50">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${theme.pct}%` }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: idx * 0.1 }}
                    className={`h-full rounded-full ${theme.color}`} 
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
