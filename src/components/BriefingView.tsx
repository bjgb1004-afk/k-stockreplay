import React from 'react';
import { motion } from 'motion/react';
import { 
  Globe, TrendingUp, DollarSign, Newspaper, 
  MapPin, Sparkles, Flame, AlertTriangle, Play 
} from 'lucide-react';
import { PreMarketBriefing } from '../types';

interface BriefingViewProps {
  briefing: PreMarketBriefing | null;
  loading: boolean;
  isCompact?: boolean;
}

export const BriefingView: React.FC<BriefingViewProps> = ({ briefing, loading, isCompact = false }) => {
  if (loading) {
    return (
      <div className="col-span-12 flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs text-slate-400 font-mono">07:50 글로벌 장전 브리핑 및 인공지능 분석 데이터 생성 중...</p>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="col-span-12 flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-900/40 rounded-2xl border border-slate-800">
        <Globe className="w-12 h-12 text-slate-600 animate-pulse" />
        <p className="text-xs text-slate-400 font-sans">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // Safe Fallback mappings to support both client structures and server DB schema variations
  const formatCreatedAt = (dateVal: any) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleString();
    } catch (e) {
      return String(dateVal);
    }
  };

  const createdAtStr = (briefing as any).createdAt || briefing.date || new Date().toISOString();

  const usSummary = briefing.usSummary || (briefing as any).usMarkets || {};
  const dow = usSummary.dow || 'N/A';
  const nasdaq = usSummary.nasdaq || 'N/A';
  const sp500 = usSummary.sp500 || usSummary.sAndP500 || 'N/A';
  const russell2000 = usSummary.russell2000 || 'N/A';
  const vix = usSummary.vix || 'N/A';

  const macro = briefing.macro || (briefing as any).macroIndicators || {};
  const interestRate = macro.interestRate || 'N/A';
  const cpi = macro.cpi || 'N/A';
  const ppi = macro.ppi || 'N/A';
  const treasuryYield = macro.bondYield || macro.treasuryYield || 'N/A';
  const exchangeRate = macro.exchangeRate || 'N/A';
  const oilPrice = macro.oilPrice || 'N/A';

  const worldNews = briefing.worldNews || [];
  const usLeaders = (briefing as any).usLeaders || (Array.isArray(briefing.usJodoju) ? briefing.usJodoju.join(', ') : '');
  const usFeaturedStock = (briefing as any).usFeaturedStock || (Array.isArray(briefing.usFeaturedStocks) ? briefing.usFeaturedStocks.join('\n') : '');

  const koreanMarketImpact = (briefing as any).koreanMarketImpact || briefing.koreanImpact || '';

  const domesticMatches: { stockName: string; theme: string; reason: string }[] = 
    Array.isArray((briefing as any).domesticMatches)
      ? (briefing as any).domesticMatches
      : (Array.isArray(briefing.relatedKoreanStocks) ? briefing.relatedKoreanStocks : []).map((item: any) => ({
          stockName: item.name || item.stockName || '',
          theme: item.theme || '주도섹터',
          reason: item.reason || ''
        }));

  const aiSummary5Lines = Array.isArray(briefing.aiSummary5Lines) ? briefing.aiSummary5Lines : [];

  const rawInterestThemes = Array.isArray(briefing.interestThemes) ? briefing.interestThemes : [];

  const warningIssues = (briefing as any).warningIssues || (Array.isArray(briefing.riskIssues) ? briefing.riskIssues.join('\n') : '');

  // 1. Overall Commentary for US Markets
  const getUsMarketsOverallCommentary = () => {
    const isNasdaqUp = nasdaq.includes('+');
    const isNasdaqDown = nasdaq.includes('-');
    
    if (isNasdaqUp) {
      return '금일 미국 증시는 인플레이션 둔화 조짐과 미 국채 금리 하락 안정세 속에서 엔비디아를 필두로 한 빅테크 및 AI 반도체 밸류체인 전반에 강력한 수급 쏠림이 유입되며 나스닥과 S&P 500 지수가 동반 강세를 주도했습니다. 위험자산 선호 심리가 살아나면서 변동성 지수(VIX)가 하락한 반면, 금리 인하 수혜가 분산되며 지수별 차별화 양상도 관찰되고 있습니다.';
    } else if (isNasdaqDown) {
      return '금일 미국 증시는 최근 단기 급등에 따른 차익 실현 욕구 자극과 금리 인하 시점 지연 우려가 겹치며 기술주 중심으로 조정을 받았습니다. 고금리 장기화 우려가 완연히 해소되기 전까지 지수의 추가 변동성 리스크를 염두에 두고 주도 테마 내에서도 대장주 위주로 압축하여 차분히 눌림목 대응을 전개하는 것이 중요합니다.';
    } else {
      return '금일 미국 증시는 핵심 경제지표 발표를 앞두고 뚜렷한 주도 섹터 없이 혼조세 등락을 보이며 관망 국면에 머물렀습니다. 지수 변동은 제한적이었으나, 일부 개별 재료 보유주 중심의 수급 쏠림이 강하게 나타나며 시장 전반적으로 방향성을 탐색하는 흐름이 전개되고 있습니다.';
    }
  };

  // 2. Overall Commentary for Global Macro
  const getMacroOverallCommentary = () => {
    const lowerCpi = cpi.toLowerCase();
    const isCpiDown = lowerCpi.includes('하회') || lowerCpi.includes('안정') || lowerCpi.includes('-');
    const lowerInterest = interestRate.toLowerCase();
    const isInterestFrozen = lowerInterest.includes('동결');

    let text = '글로벌 통화 정책 기조의 과도기 속에서 주요 원자재 가격 및 환율 변동성이 지지/저항 라인을 형성하고 있습니다.';
    if (isInterestFrozen && isCpiDown) {
      text = '기준 금리가 5.25% - 5.50%에서 장기간 동결 기조를 나타내는 가운데, 최근 소비자물가(CPI) 지표가 예상치를 연이어 하회하면서 인플레이션 압력 완화와 함께 연준의 금리 인하 개시 기대감이 극대화되고 있습니다. 국채 금리 및 달러 인덱스가 하향 안정화되는 구도는 외국인의 대형 IT 소부장 매수세 유입에 매우 우호적인 매크로 환경을 구축하고 있습니다.';
    } else if (isCpiDown) {
      text = '최근 소비자물가지수(CPI)가 시장 예상치를 밑도는 등 완연한 물가 둔화 궤적이 입증되면서 긴축 완화 경로가 탄력을 받고 있습니다. 원/달러 환율과 국채 수익률이 안정을 되찾아감에 따라 국내 증시의 글로벌 수급 유입 환경도 점진적으로 개선되는 흐름을 보이고 있습니다.';
    } else if (isInterestFrozen) {
      text = '미 연준의 고금리 동결 기조 하에서도 물가 및 도매 생산자 비용 압력이 안정적으로 통제되며 경기 연착륙 시나리오를 충족하고 있습니다. 국채 금리의 완만한 흐름 속에서 유가 역시 배럴당 80달러선 수준으로 횡보 안착하여 비용 불확실성을 완화시키고 있습니다.';
    }
    return text;
  };

  return (
    <div className="col-span-12 space-y-6">
      {/* Hero Header */}
      {!isCompact && (
        <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/20 rounded-2xl p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-amber-500" />
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2">
              <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-500/30 uppercase tracking-wider">
                Morning Report
              </span>
              <span className="text-slate-400 font-mono text-[10px]">생성 일시: {formatCreatedAt(createdAtStr)}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-slate-100 flex items-center gap-2">
              <Globe className="w-6 h-6 text-amber-500" />
              <span>07:50 장전 글로벌 거시경제 & 브리핑</span>
            </h2>
            <p className="text-xs text-slate-400">
              미국 증시 마감 상황과 국내 시장 영향도, 핵심 관심 테마를 선제 진단합니다.
            </p>
          </div>
        </div>
      )}

      {/* 중요뉴스 / 유저 관심뉴스 (최상단 우선 배치: 요약문 & 관심 테마/전략 종목) */}
      <div className="space-y-5" id="briefing-top-interest-cards">
        {/* 핵심 브리핑 요약 */}
        <div className="bg-slate-900 border border-indigo-500/20 rounded-2xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
          <h3 className="text-xs font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>핵심 브리핑 요약</span>
          </h3>
          <div className="space-y-3">
            {aiSummary5Lines.map((line, idx) => (
              <div key={idx} className="flex gap-2.5 items-start">
                <span className="text-indigo-400 text-xs font-black font-mono mt-0.5">{idx + 1}.</span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans break-keep break-words whitespace-normal">{line}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 오늘의 핵심 관심테마 & 관심종목 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800/80 pb-2">
            <Flame className="w-4 h-4 text-red-500" />
            <span>오늘의 핵심 관심 테마 및 주요 종목</span>
          </h3>
          <div className="space-y-3.5">
            {rawInterestThemes.map((item: any, idx) => {
              const themeName = typeof item === 'string' ? item : (item.theme || '관심테마');
              const stocks = Array.isArray(item.relatedStocks) ? item.relatedStocks : [];
              return (
                <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-850 flex flex-col gap-3.5">
                  {/* Theme Label */}
                  <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5 shrink-0 min-h-[36px]">
                    <span className="w-1.5 h-3 bg-red-500 rounded-full shrink-0" />
                    <span className="text-xs font-black text-slate-200 leading-snug block whitespace-normal break-keep w-full">{themeName}</span>
                  </div>
                  
                  {/* Stocks (Horizontally laid out, adjusted grid to prevent overflow in split computer screens) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                    {stocks.map((stock, sIdx) => {
                      let name = stock;
                      let detail = '';
                      if (stock.includes('(')) {
                        const parts = stock.split('(');
                        name = parts[0].trim();
                        detail = parts[1].replace(')', '').trim();
                      }

                      let detailParts: string[] = [];
                      if (detail) {
                        if (detail.includes('/')) {
                          detailParts = detail.split('/').map(p => p.trim());
                        } else {
                          detailParts = [detail];
                        }
                      }

                      const isNegative = detailParts[0]?.includes('-');
                      const isPositive = detailParts[0]?.includes('+');
                      const changeColor = isNegative ? 'text-blue-400' : (isPositive ? 'text-red-400' : 'text-slate-300');

                      return (
                        <div key={sIdx} className="bg-slate-900/60 hover:bg-slate-900 border border-slate-850/50 py-2.5 px-3 rounded-xl flex flex-col justify-between transition-all min-w-0 gap-1.5 w-full h-full shadow-sm">
                          {/* Stock Name (Level 1) */}
                          <div className="font-extrabold text-slate-100 text-[12px] sm:text-xs tracking-tight truncate w-full">
                            {name}
                          </div>
                          
                          {/* Metrics / Details (Level 2) */}
                          {detailParts.length > 0 && (
                            <div className="flex items-center justify-between w-full border-t border-slate-800/40 pt-2 mt-0.5 select-none gap-2">
                              {/* Change Rate */}
                              <span className={`font-black text-[10px] sm:text-[10.5px] font-mono whitespace-nowrap ${changeColor}`}>
                                {detailParts[0]}
                              </span>
                              
                              {/* Trade Value */}
                              {detailParts[1] && (
                                <span className="text-amber-400 font-extrabold text-[10px] sm:text-[10.5px] font-mono shrink-0 whitespace-nowrap">
                                  {detailParts[1]}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {stocks.length === 0 && (
                      <div className="text-[10px] text-slate-500 italic col-span-2 py-1">종목 준비 중...</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Upper Layout: Stacking them as full-width rows */}
      <div className="grid grid-cols-1 gap-5">
        
        {/* US Markets summary */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>미국 증시 주요 지수 마감 현황</span>
          </h3>
          
          {/* 짧은 전체 분석 코멘트 */}
          <div className="bg-emerald-500/5 border-l-2 border-emerald-500 p-3.5 rounded-r-xl text-xs text-slate-300 leading-relaxed max-w-4xl select-text">
            <span className="font-extrabold text-emerald-400 block mb-1">💡 시장 마감 한줄 요약</span>
            {getUsMarketsOverallCommentary()}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 max-w-4xl">
            {[
              { name: '다우존스', val: dow },
              { name: '나스닥', val: nasdaq },
              { name: 'S&P 500', val: sp500 },
              { name: '러셀 2000', val: russell2000 },
              { name: 'VIX 변동성', val: vix, isVix: true }
            ].map((m, idx) => {
              const parts = m.val.trim().split(/\s+/);
              const price = parts[0] || '';
              const change = parts.slice(1).join(' ') || '';

              // Dynamic concise financial commentaries
              const getUsCommentary = (nameStr: string, valStr: string) => {
                const trimmed = valStr.trim();
                const isUp = trimmed.includes('+');
                const isDown = trimmed.includes('-');
                
                if (nameStr.includes('다우존스')) {
                  if (isUp) return '우량주 중심 완만한 상승세';
                  if (isDown) return '제조·금융 대형주 차익 실현';
                  return 'FOMC 앞두고 보합권 대기';
                }
                if (nameStr.includes('나스닥')) {
                  if (isUp) return '빅테크·AI 강력한 매수 쏠림';
                  if (isDown) return '고점 도달에 따른 단기 매물 출회';
                  return '추가 상승 모멘텀 탐색 흐름';
                }
                if (nameStr.includes('S&P 500')) {
                  if (isUp) return '사상 최고가권 안착 흐름 지속';
                  if (isDown) return '상승 랠리 이후 단기 숨고르기';
                  return '방향성 타진하며 혼조세 등락';
                }
                if (nameStr.includes('러셀 2000')) {
                  if (isUp) return '금리 완화 기대로 중소형주 수혜';
                  if (isDown) return '고금리 장기화 우려에 약세 지속';
                  return '중소형주 경기 연착륙 관망';
                }
                if (nameStr.includes('VIX')) {
                  const isNeg = trimmed.includes('-');
                  if (isNeg || trimmed.startsWith('10') || trimmed.startsWith('11') || trimmed.startsWith('12') || trimmed.startsWith('13')) {
                    return '시장 심리 안정 및 불안 해소';
                  }
                  return '옵션 시장 헤지 매수세 유입';
                }
                return '시장 방향성 관망세 우세';
              };

              return (
                <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex flex-col justify-between items-center text-center gap-2.5 w-full min-h-[118px]">
                  <div className="flex flex-col items-center gap-1 w-full">
                    <span className="text-[11px] font-extrabold text-slate-400 block whitespace-normal break-keep w-full leading-tight">{m.name}</span>
                    <div className="flex flex-col gap-0.5 w-full items-center">
                      <span className="text-xs font-black font-mono text-slate-100 block whitespace-normal break-all w-full leading-normal">{price}</span>
                      {change && (
                        <span className={`text-[10px] font-bold font-mono block leading-normal whitespace-normal break-all w-full ${
                          m.isVix 
                            ? 'text-amber-400' 
                            : change.includes('+') ? 'text-red-400' : change.includes('-') ? 'text-blue-400' : 'text-slate-400'
                        }`}>
                          {change}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="w-full border-t border-slate-900/60 pt-1.5 select-none">
                    <p className="text-[9px] font-medium text-slate-400 leading-tight break-keep">{getUsCommentary(m.name, m.val)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Macro Economics Indicators */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
            <DollarSign className="w-4 h-4 text-indigo-400" />
            <span>글로벌 거시경제 주요 지표</span>
          </h3>

          {/* 짧은 전체 분석 코멘트 */}
          <div className="bg-indigo-500/5 border-l-2 border-indigo-500 p-3.5 rounded-r-xl text-xs text-slate-300 leading-relaxed select-text">
            <span className="font-extrabold text-indigo-400 block mb-1">💡 거시경제 분석 코멘트</span>
            {getMacroOverallCommentary()}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {[
              { label: '기준 금리', value: interestRate },
              { label: 'CPI (소비자물가)', value: cpi },
              { label: 'PPI (생산자물가)', value: ppi },
              { label: '10년물 국채금리', value: treasuryYield },
              { label: '원/달러 환율', value: exchangeRate },
              { label: 'WTI 국제유가', value: oilPrice }
            ].map((ind, idx) => {
              const trimmed = ind.value ? ind.value.trim() : '';
              const openParenIndex = trimmed.indexOf('(');
              let main = trimmed;
              let sub = '';
              if (openParenIndex !== -1) {
                main = trimmed.substring(0, openParenIndex).trim();
                sub = trimmed.substring(openParenIndex + 1).replace(')', '').trim();
              }

              // Dynamic macro commentaries
              const getMacroCommentary = (labelStr: string, valStr: string) => {
                const lowerVal = valStr.toLowerCase();
                const isUp = lowerVal.includes('+');
                const isDown = lowerVal.includes('-');
                
                if (labelStr.includes('금리')) {
                  if (lowerVal.includes('동결')) return '인하 개시 시기 저울질 지속';
                  if (lowerVal.includes('인하')) return '유동성 공급 완화 기조로 전환';
                  return '통화 긴축 완화 경로 주시';
                }
                if (labelStr.includes('CPI')) {
                  if (lowerVal.includes('하회') || lowerVal.includes('안정') || isDown) return '물가 안정 확인, 인하 기대 고조';
                  if (lowerVal.includes('상회') || isUp) return '끈적한 물가로 긴축 우려 재유입';
                  return '물가 둔화 궤적 신호 지속 진단';
                }
                if (labelStr.includes('PPI')) {
                  if (lowerVal.includes('하회') || lowerVal.includes('안정') || isDown) return '도매가 안정으로 완화 기대감 지지';
                  if (lowerVal.includes('상회') || isUp) return '원가 상승으로 물가 하락세 주춤';
                  return '생산자 비용 압력 안정적 통제';
                }
                if (labelStr.includes('국채금리')) {
                  if (isDown) return '인하 기대감 반영하며 채권 금리 하락';
                  if (isUp) return '인하 지연 가능성에 채권 수익률 반등';
                  return '미 국채 금리 제한적 보합 수준';
                }
                if (labelStr.includes('환율')) {
                  if (isUp || lowerVal.includes('상승')) return '강달러 장기화에 따른 수급 변동성';
                  if (isDown || lowerVal.includes('하락')) return '환율 하락 안정, 외인 매수 우호적';
                  return '글로벌 통화 긴축 구도 속 보합안정';
                }
                if (labelStr.includes('유가')) {
                  if (isUp || lowerVal.includes('상승')) return '지정학 긴장 및 공급 불안에 상승';
                  if (isDown || lowerVal.includes('하락')) return '경기 둔화 우려에 유가 하향 돌파';
                  return '수요 불안과 지정학 우려 혼조 마감';
                }
                return '거시경제 주요 지표 관망 상태';
              };

              return (
                <div key={idx} className="bg-slate-950/70 border border-slate-850 p-3 rounded-xl flex flex-col justify-between items-center text-center gap-2.5 w-full min-h-[118px]">
                  <div className="flex flex-col items-center gap-1 w-full">
                    <span className="text-xs font-bold text-slate-400 block whitespace-normal break-keep w-full leading-tight">{ind.label}</span>
                    <span className="text-xs font-black font-mono text-slate-200 block whitespace-normal break-all w-full leading-normal">{main}</span>
                    {sub && (
                      <span className="text-[10px] font-semibold text-amber-400 block whitespace-normal break-keep w-full leading-normal">{sub}</span>
                    )}
                  </div>
                  <div className="w-full border-t border-slate-900/60 pt-1.5 select-none">
                    <p className="text-[9px] font-medium text-slate-400 leading-tight break-keep">{getMacroCommentary(ind.label, ind.value)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Korean Stock Market Connections */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950/30 border border-indigo-500/10 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-indigo-400" />
              <span>국내 시장 영향 분석 및 연동 종목 분석</span>
            </h3>
            <div className="bg-slate-950/50 p-4 rounded-xl border border-indigo-500/15 text-xs text-slate-300 leading-relaxed">
              <h4 className="font-extrabold text-indigo-300 mb-1.5">전략적 연결 분석 (Connection Mapping)</h4>
              <p className="leading-relaxed whitespace-pre-wrap break-keep break-words">{koreanMarketImpact}</p>
            </div>
          </div>
          
          <div className="border-t border-slate-850/50 pt-4 mt-4">
            <h5 className="text-[11px] font-black text-slate-400 uppercase mb-2.5">국내 주요 종목군</h5>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {domesticMatches.map((item, idx) => (
                <div key={idx} className="bg-slate-900 border border-slate-850 p-3 rounded-lg flex flex-col justify-start gap-1.5 w-full">
                  <span className="text-xs font-bold text-slate-200 leading-tight">{item.stockName}</span>
                  <span className="text-xs text-indigo-400 font-mono font-bold block truncate">연계: {item.theme}</span>
                  <span className="text-xs text-slate-400 font-sans leading-relaxed block break-keep break-words whitespace-normal">{item.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Single Column Stack: 오늘의 핵심 주의 이슈, 세계 주요 외신 헤드라인, 미국 주도주 및 특징주 (세로 적층!) */}
      <div className="grid grid-cols-1 gap-5">
        
        {/* 오늘의 핵심 주의 이슈 */}
        <div className="bg-slate-900 border border-red-500/20 rounded-2xl p-5 space-y-4 flex flex-col">
          <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800/80 pb-2.5">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <span>오늘의 핵심 주의 이슈</span>
          </h3>
          <div className="bg-red-950/10 border border-red-500/10 p-4 rounded-xl flex-1 flex flex-col justify-start">
            <span className="text-[9px] font-black text-red-400 uppercase tracking-widest flex items-center gap-1 mb-2">
              <AlertTriangle className="w-3.5 h-3.5" />
              Risk Factor
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap break-keep break-words">
              {warningIssues}
            </p>
          </div>
        </div>

        {/* 세계 주요 외신 헤드라인 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800/80 pb-2.5">
            <Newspaper className="w-4 h-4 text-sky-400" />
            <span>세계 주요 외신 헤드라인</span>
          </h3>
          <ul className="space-y-3 flex-1">
            {worldNews.map((news, idx) => (
              <li key={idx} className="flex gap-2.5 items-start">
                <span className="w-4 h-4 rounded-full bg-slate-950 text-slate-400 border border-slate-850 text-[9px] font-mono font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs text-slate-300 leading-relaxed font-sans break-keep break-words whitespace-normal">{news}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* 미국 주도주 및 특징주 */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col">
          <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800/80 pb-2.5">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>미국 주도주 및 특징주</span>
          </h3>
          <div className="space-y-3.5 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              <div>
                <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-1">US Leader</span>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-xs text-slate-300 leading-relaxed break-keep break-words whitespace-normal">
                  {usLeaders}
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest block mb-1">Notable Stock Movement</span>
                <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap break-keep break-words">
                  {usFeaturedStock}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
