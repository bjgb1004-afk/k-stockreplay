import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, DollarSign, Activity, AlertTriangle, ChevronRight, ActivitySquare, Sparkles, Zap, ArrowUpRight, ArrowDownRight, RefreshCw, Award, Loader2 } from 'lucide-react';
import { AfterMarketReport } from '../types';

interface AfterMarketNewsProps {
  report?: AfterMarketReport | null;
  loading?: boolean;
}

const StockFeatureCard: React.FC<{
  stk: any;
  type: 'upper' | 'lower' | 'good' | 'bad';
}> = ({ stk, type }) => {
  const isGood = type === 'upper' || type === 'good';
  const colorScheme = 
    type === 'upper' ? { border: 'border-rose-500/30', bg: 'bg-rose-500/5', text: 'text-rose-500', badgeBg: 'bg-rose-500/10' } :
    type === 'lower' ? { border: 'border-blue-500/30', bg: 'bg-blue-500/5', text: 'text-blue-500', badgeBg: 'bg-blue-500/10' } :
    type === 'good' ? { border: 'border-emerald-500/30', bg: 'bg-emerald-500/5', text: 'text-emerald-500', badgeBg: 'bg-emerald-500/10' } :
    { border: 'border-amber-500/30', bg: 'bg-amber-500/5', text: 'text-amber-500', badgeBg: 'bg-amber-500/10' };

  const cleanTicker = (stk.ticker || stk.code || '').replace(/\.(KS|KQ)$/i, '').trim();
  const categoryType = stk.categoryType || (stk.isUpperLimit ? '상한가' : stk.isLowerLimit ? '하한가' : isGood ? '호재 모멘텀' : '악재 리스크');

  // Market & Sector Separation
  let market = stk.market;
  if (!market && cleanTicker) {
    market = cleanTicker.startsWith('0') || cleanTicker.startsWith('1') ? 'KOSPI' : 'KOSDAQ';
  }
  const sector = stk.sector && stk.sector !== 'KOSPI' && stk.sector !== 'KOSDAQ' ? stk.sector : null;

  // Direct cause & news catalyst
  let directCause = stk.riseReason || stk.declineReason || stk.goodBasis || stk.badBasis || stk.catalyst;
  if (!directCause || directCause.includes('수급 활성화') || (directCause.includes('수급 유입') && !directCause.includes('뉴스'))) {
    if (!stk.news?.length && !stk.disclosures?.length) {
      directCause = "직접 촉매 확인 안 됨";
    }
  }
  if (!directCause || directCause === '데이터 수집 중') {
    directCause = "직접 촉매 확인 안 됨";
  }

  const coreIssue = stk.coreIssue || stk.relatedNewsOrDisclosures || (stk.news && stk.news[0]?.title) || (stk.disclosures && stk.disclosures[0]?.title);
  
  // Keywords (Filter out '주도주')
  const rawKeywords = stk.keywords || stk.goodKeywords || stk.badKeywords || stk.tags || [];
  const keywords = (Array.isArray(rawKeywords) ? rawKeywords : []).filter((kw: string) => kw && kw !== '주도주');

  // Change rate formatting
  const getChangeRateDisplay = () => {
    if (stk.isUpperLimit) return '상한가 (+30%)';
    if (stk.isLowerLimit) return '하한가 (-30%)';
    const rate = stk.changeRate;
    if (rate === undefined || rate === null || rate === '' || isNaN(Number(rate))) return '데이터 미수집';
    const num = Number(rate);
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  // Format price
  const getPriceDisplay = () => {
    const p = stk.closePrice;
    if (!p || p === 0 || p === '0' || p === '0원') return null;
    if (typeof p === 'number') return `${p.toLocaleString()}원`;
    return String(p).endsWith('원') ? String(p) : `${p}원`;
  };

  // Format trade value to 억원
  const getTradeValueDisplay = () => {
    const val = stk.tradeValuePct || stk.tradeValue || stk.tradingValue;
    if (!val || val === 0 || val === '0' || val === '0억' || val === '0억원' || val === '데이터 미수집') return null;
    let num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) return null;
    if (num >= 100000000) {
      num = Math.round((num / 100000000) * 100) / 100;
    }
    return `${num.toLocaleString()}억원`;
  };

  const priceText = getPriceDisplay();
  const tradeValueText = getTradeValueDisplay();

  return (
    <div className={`p-4 rounded-xl border ${colorScheme.border} ${colorScheme.bg} space-y-3 transition-all duration-200 hover:shadow-md`}>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-black text-sm text-slate-900 dark:text-white">{stk.name}</span>
            <span className="text-xs text-slate-400 font-mono">({cleanTicker})</span>
            {categoryType && categoryType !== '주도주' && (
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colorScheme.badgeBg} ${colorScheme.text} border ${colorScheme.border}`}>
                {categoryType}
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-2 font-medium">
            {market && <span>시장: <strong className="text-slate-700 dark:text-slate-300">{market}</strong></span>}
            {sector && <span>섹터: <strong className="text-slate-700 dark:text-slate-300">{sector}</strong></span>}
            {stk.theme && stk.theme !== '데이터 수집 중' && <span>테마: <strong className="text-slate-700 dark:text-slate-300">{stk.theme}</strong></span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xs font-black px-2 py-1 rounded ${colorScheme.badgeBg} ${colorScheme.text} border ${colorScheme.border}`}>
            {getChangeRateDisplay()}
          </div>
        </div>
      </div>

      {/* Pricing & Volume Data */}
      {(priceText || tradeValueText || stk.tradeValueVsPrevDay) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white/60 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
          {priceText && <span>종가: <strong className="text-slate-800 dark:text-slate-200">{priceText}</strong></span>}
          {tradeValueText && <span>거래대금: <strong className="text-slate-800 dark:text-slate-200">{tradeValueText}</strong></span>}
          {stk.tradeValueVsPrevDay && <span className="text-indigo-500 dark:text-indigo-400">{stk.tradeValueVsPrevDay}</span>}
        </div>
      )}

      {/* Core Issue / News Header */}
      {coreIssue && (
        <div className="text-[11px] text-slate-800 dark:text-slate-200 font-semibold bg-white/80 dark:bg-slate-900/80 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800/80">
          <span className="text-indigo-500 dark:text-indigo-400 font-bold mr-1">📌 핵심 이슈:</span> {coreIssue}
        </div>
      )}

      {/* Direct Cause */}
      <div className="text-xs text-slate-700 dark:text-slate-300 font-normal leading-relaxed">
        <strong className="text-slate-900 dark:text-white font-bold mr-1">💡 직접 원인:</strong> {directCause}
      </div>

      {/* Supply & Demand */}
      {stk.supplyDemand && (stk.supplyDemand.foreigner !== '미수집' || stk.supplyDemand.institution !== '미수집') && (
        <div className="text-[11px] text-slate-600 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/70 p-2 rounded-lg flex flex-wrap gap-x-3 gap-y-1 font-mono">
          <span className="font-bold text-slate-500">수급 분석:</span>
          {stk.supplyDemand.foreigner && <span>외국인: <strong className="text-indigo-600 dark:text-indigo-400">{stk.supplyDemand.foreigner}</strong></span>}
          {stk.supplyDemand.institution && <span>기관: <strong className="text-sky-600 dark:text-sky-400">{stk.supplyDemand.institution}</strong></span>}
          {stk.supplyDemand.retail && <span>개인: <strong className="text-amber-600 dark:text-amber-400">{stk.supplyDemand.retail}</strong></span>}
        </div>
      )}

      {/* Theme Diffusion Analysis */}
      {stk.themeDiffusion && (
        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
          <strong className="text-slate-800 dark:text-slate-200 font-bold mr-1">🌐 테마 확산 분석:</strong> {stk.themeDiffusion}
        </div>
      )}

      {/* AI Expert Analysis */}
      {(stk.aiAnalysis || stk.aiSummary) && (
        <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed space-y-1">
          <div className="font-bold text-indigo-500 dark:text-indigo-400 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI 심층 메커니즘 분석 (뉴스→기업이벤트→산업영향→수급→주가):
          </div>
          <div className="text-[11px] text-slate-600 dark:text-slate-300">
            {typeof stk.aiAnalysis === 'string' ? stk.aiAnalysis : stk.aiSummary || stk.aiAnalysis?.riseReasonDetailed}
          </div>
        </div>
      )}

      {/* Keywords */}
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1">
          {keywords.map((kw: string, kIdx: number) => (
            <span key={kIdx} className={`text-[9px] ${colorScheme.badgeBg} ${colorScheme.text} font-mono px-1.5 py-0.5 rounded border ${colorScheme.border}`}>
              #{kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const AfterMarketNews: React.FC<AfterMarketNewsProps> = ({ report: propReport, loading: propLoading }) => {
  const [internalReport, setInternalReport] = useState<AfterMarketReport | null>(null);
  const [internalLoading, setInternalLoading] = useState<boolean>(false);

  useEffect(() => {
    if (propReport !== undefined) return;
    const fetchReport = async () => {
      setInternalLoading(true);
      try {
        const res = await fetch('/api/platform/report', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setInternalReport(data);
        }
      } catch (err) {
        console.warn('[AfterMarketNews] Failed to load report:', err);
      } finally {
        setInternalLoading(false);
      }
    };
    fetchReport();
  }, [propReport]);

  const report = propReport !== undefined ? propReport : internalReport;
  const loading = propLoading !== undefined ? propLoading : internalLoading;

  const handleRefresh = async () => {
    setInternalLoading(true);
    try {
      // 1. Cleanup old news
      await fetch('/api/platform/after-market/cleanup', { method: 'POST' });
      // 2. Collect and process new news
      const res = await fetch('/api/platform/after-market/collect', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: report?.market_date || report?.date })
      });
      if (res.ok) {
        const data = await res.json();
        setInternalReport(data.report);
      }
    } catch (err) {
      console.warn('[AfterMarketNews] Refresh failed:', err);
    } finally {
      setInternalLoading(false);
    }
  };

  const today = new Date();
  const kstTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const defaultDateStr = kstTime.toISOString().split('T')[0];
  const dateStr = report?.market_date || report?.date || defaultDateStr;

  if (loading) {
    return (
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-4 max-w-4xl mx-auto">
        <div className="w-10 h-10 border-4 border-rose-500/20 border-t-rose-500 rounded-full animate-spin mx-auto" />
        <p className="text-xs font-mono text-slate-500 dark:text-slate-400">15:50 장마감 종합 증시 브리핑을 불러오는 중입니다...</p>
      </div>
    );
  }

  const marketOverview = (report as any)?.marketOverview || {
    kospiIndex: '데이터 미수집',
    kospiChange: '데이터 미수집',
    kosdaqIndex: '데이터 미수집',
    kosdaqChange: '데이터 미수집',
    foreignNet: '미수집',
    institutionNet: '미수집',
    retailNet: '미수집',
    usdKrw: '데이터 미수집',
    us10y: '데이터 미수집',
    wti: '데이터 미수집',
    btc: '데이터 미수집'
  };

  const marketAnalysisSummary = report?.marketAnalysisSummary || `🌐 [수석 마켓 애널리스트 16시 마켓 종합 브리핑]

현재 장마감 리포트를 생성 중이거나, 해당 일자의 데이터가 아직 수집되지 않았습니다. 
잠시 후 다시 시도해 주시기 바랍니다.`;

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

  // Process 4 feature categories
  const catFeatures = report?.categorizedFeatures;
  const upperSurgeList = catFeatures?.upperLimitSurge || [];
  const lowerPlungeList = catFeatures?.lowerLimitPlunge || [];
  const goodKeywordsList = catFeatures?.goodNewsKeywords || [];
  const badKeywordsList = catFeatures?.badNewsKeywords || [];

  const rawFeatures = report?.features || [];
  const goodFeaturesFallback = rawFeatures.filter((f: any) => f.category === 'GOOD' || f.category === 'UPPER');
  const badFeaturesFallback = rawFeatures.filter((f: any) => f.category === 'BAD' || f.category === 'LOWER');

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
            기준 일자: {dateStr}
          </span>
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-50"
            title="뉴스 수집 및 동기화"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        
        {/* Market Analysis Summary Card (Gradient Pattern matching BriefingView) */}
        <div className="bg-gradient-to-br from-rose-50/70 via-white to-rose-50/30 dark:from-rose-950/50 dark:via-slate-900 dark:to-slate-950 border border-rose-200 dark:border-rose-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between border-b border-rose-150 dark:border-rose-500/20 pb-3">
            <h3 className="text-sm font-black text-rose-900 dark:text-rose-300 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-rose-600 dark:text-rose-400 animate-pulse" />
              <span>① 수석 애널리스트 장마감 종합 시황 진단</span>
            </h3>
            <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-black rounded-md border border-rose-200 dark:border-rose-500/30">
              Daily Closing Analysis
            </span>
          </div>

          <div className="space-y-4">
            <div className="bg-white/80 dark:bg-slate-900/90 p-5 rounded-xl border border-rose-100 dark:border-rose-500/20 space-y-1.5 shadow-sm">
              <RenderMarkdown text={marketAnalysisSummary} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. 지수 및 수급 상황 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <TrendingUp className="w-4 h-4 text-rose-500" />
              <span>② 국내 지수 및 수급 현황</span>
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">코스피 (KOSPI)</span>
                <div className="text-right flex items-center gap-3">
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">{marketOverview.kospiIndex}</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 ${marketOverview.kospiChange?.includes('+') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'}`}>
                    {marketOverview.kospiChange?.includes('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {marketOverview.kospiChange}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/50 shadow-sm">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400">코스닥 (KOSDAQ)</span>
                <div className="text-right flex items-center gap-3">
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 font-mono">{marketOverview.kosdaqIndex}</span>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 ${marketOverview.kosdaqChange?.includes('+') ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-sky-500/10 text-sky-500 border border-sky-500/20'}`}>
                    {marketOverview.kosdaqChange?.includes('+') ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                    {marketOverview.kosdaqChange}
                  </span>
                </div>
              </div>
              <div className="pt-2 grid grid-cols-3 gap-2">
                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 text-center">
                  <div className="text-[9px] font-black text-indigo-500 mb-0.5">외국인</div>
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{marketOverview.foreignNet?.split(' ')[0]}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 text-center">
                  <div className="text-[9px] font-black text-sky-500 mb-0.5">기관</div>
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{marketOverview.institutionNet?.split(' ')[0]}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800/50 text-center">
                  <div className="text-[9px] font-black text-amber-500 mb-0.5">개인</div>
                  <div className="text-[10px] font-bold text-slate-700 dark:text-slate-300">{marketOverview.retailNet?.split(' ')[0]}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 2. 매크로 및 주요 환경 지표 */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>③ 글로벌 매크로 환경</span>
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 text-center shadow-sm">
                <div className="text-[9px] text-slate-500 font-black mb-1">원/달러 환율</div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">{marketOverview.usdKrw}</div>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 text-center shadow-sm">
                <div className="text-[9px] text-slate-500 font-black mb-1">미 10년물 국채금리</div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">{marketOverview.us10y}</div>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 text-center shadow-sm">
                <div className="text-[9px] text-slate-500 font-black mb-1">WTI 국제유가</div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">{marketOverview.wti}</div>
              </div>
              <div className="bg-slate-50/50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800/50 text-center shadow-sm">
                <div className="text-[9px] text-slate-500 font-black mb-1">비트코인 (BTC)</div>
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono">{(marketOverview as any).btc || '데이터 미수집'}</div>
              </div>
            </div>
            {report?.marketAnalysis?.kospiSummary && (
              <div className="bg-emerald-500/5 border-l-2 border-emerald-500 p-4 rounded-r-xl text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                {report.marketAnalysis.kospiSummary}
              </div>
            )}
          </div>
        </div>

        {/* ④ 당일 특징주 4가지 상세 분류 (실제 데이터 기준) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
          <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3">
            <Zap className="w-4 h-4 text-rose-500" />
            <span>④ 당일 특징주 4가지 상세 분류 (실제 시장 뉴스·공시·수급 기반)</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* ① 상한가 / 급등 종목 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-rose-500/30 text-rose-500">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  <span className="text-xs font-black">① 상한가 · 급등주</span>
                </div>
              </div>
              {upperSurgeList.length > 0 ? (
                <div className="space-y-4">
                  {upperSurgeList.map((stk: any, idx: number) => (
                    <StockFeatureCard key={idx} stk={stk} type="upper" />
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 p-6 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800">
                  당일 포착된 주요 상한가/급등 종목이 없습니다.
                </div>
              )}
            </div>

            {/* ② 하한가 / 급락 종목 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-blue-500/30 text-blue-500">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-black">② 하한가 · 급락주</span>
                </div>
              </div>
              {lowerPlungeList.length > 0 ? (
                <div className="space-y-4">
                  {lowerPlungeList.map((stk: any, idx: number) => (
                    <StockFeatureCard key={idx} stk={stk} type="lower" />
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-slate-500 dark:text-slate-400 p-6 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800">
                  당일 포착된 하한가/급락 리스크 종목이 없습니다.
                </div>
              )}
            </div>

            {/* ③ 호재 키워드 특징주 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-500/30 text-emerald-500">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-xs font-black">③ 호재 키워드 특징주</span>
                </div>
              </div>
              <div className="space-y-4">
                {goodKeywordsList.length > 0 ? (
                  goodKeywordsList.map((stk: any, idx: number) => (
                    <StockFeatureCard key={idx} stk={stk} type="good" />
                  ))
                ) : (
                  goodFeaturesFallback.length > 0 ? (
                    goodFeaturesFallback.map((ft: any, idx: number) => (
                      <StockFeatureCard key={idx} stk={{
                        ticker: ft.ticker,
                        name: ft.name,
                        goodBasis: ft.catalyst,
                        goodKeywords: ft.keywords,
                        changeRate: ft.changeRate
                      }} type="good" />
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 p-6 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800">
                      포착된 주요 호재 키워드 특징주가 없습니다.
                    </div>
                  )
                )}
              </div>
            </div>

            {/* ④ 악재 키워드 특징주 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-amber-500/30 text-amber-500">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-xs font-black">④ 악재 키워드 특징주</span>
                </div>
              </div>
              <div className="space-y-4">
                {badKeywordsList.length > 0 ? (
                  badKeywordsList.map((stk: any, idx: number) => (
                    <StockFeatureCard key={idx} stk={stk} type="bad" />
                  ))
                ) : (
                  badFeaturesFallback.length > 0 ? (
                    badFeaturesFallback.map((ft: any, idx: number) => (
                      <StockFeatureCard key={idx} stk={{
                        ticker: ft.ticker,
                        name: ft.name,
                        badBasis: ft.catalyst,
                        badKeywords: ft.keywords,
                        changeRate: ft.changeRate
                      }} type="bad" />
                    ))
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 p-6 bg-slate-50 dark:bg-slate-950 rounded-xl text-center border border-dashed border-slate-200 dark:border-slate-800">
                      당일 특이 악재 키워드가 포착된 주요 종목이 없습니다.
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
