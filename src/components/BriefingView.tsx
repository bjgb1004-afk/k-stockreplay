import React from 'react';
import { motion } from 'motion/react';
import { 
  Globe, TrendingUp, DollarSign, Newspaper, 
  MapPin, Sparkles, Flame, AlertTriangle, Play 
} from 'lucide-react';
import { PreMarketBriefing } from '../types';

const DEFAULT_MACRO_DETAIL = {
  value: '동향 관찰',
  reason: '미 증시 야간 마감 지수 및 지표 변동성 관찰 중입니다.',
  majorsAction: '외국인 및 기관 매니저 시초가 수급 유입 동향 파악 중입니다.',
  marketImpact: '국내 코스피/코스닥 지수 시초가 갭 형성 여부 점검 중입니다.',
  sectorsAnalysis: '주도 테마 및 관련 소부장 섹터 수급 유입을 진단 중입니다.'
};

const MacroDetailCard: React.FC<{
  label: string;
  value: string;
  icon: string;
  colorClass: string;
  textClass: string;
  detail: {
    reason: string;
    majorsAction: string;
    marketImpact: string;
    sectorsAnalysis: string;
  };
  defaultOpen: boolean;
}> = ({ label, value, icon, colorClass, textClass, detail, defaultOpen }) => {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  return (
    <div className={`bg-white dark:bg-slate-950/60 border ${colorClass} rounded-xl p-4 transition-all duration-300 flex flex-col justify-between`}>
      <div>
        {/* 지표 헤더 */}
        <div 
          className="flex items-center justify-between cursor-pointer select-none border-b border-slate-900/60 pb-2 mb-2.5"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{label}</span>
          </div>
          <span className={`text-[10px] font-black font-mono ${textClass}`}>
            {value}
          </span>
        </div>

        {/* 상세 4대 분석 아코디언 */}
        {isOpen && detail ? (
          <div className="space-y-2 mt-2 text-[11px] leading-relaxed">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded border border-slate-200 dark:border-slate-850/55">
              <span className="font-extrabold text-slate-900 dark:text-slate-100 block mb-0.5">• 원인 분석</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium block">{detail.reason}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded border border-slate-200 dark:border-slate-850/55">
              <span className="font-extrabold text-indigo-400 block mb-0.5">• 글로벌 메이저 행동</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium block">{detail.majorsAction}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded border border-slate-200 dark:border-slate-850/55">
              <span className="font-extrabold text-amber-400 block mb-0.5">• 시장 파급 영향</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium block">{detail.marketImpact}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded border border-slate-200 dark:border-slate-850/55">
              <span className="font-extrabold text-rose-400 block mb-0.5">• 주도/이탈섹터 진단</span>
              <span className="text-slate-700 dark:text-slate-300 font-medium block">{detail.sectorsAnalysis}</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full py-1.5 mt-1 bg-slate-50 dark:bg-slate-900/35 hover:bg-slate-50 dark:hover:bg-slate-900/70 border border-slate-200 dark:border-slate-850/40 text-[10px] font-bold text-slate-600 dark:text-slate-400 rounded-lg transition-all"
          >
            클릭하여 상세 4대 분석 펼치기
          </button>
        )}
      </div>
    </div>
  );
};

const getStockThemeName = (stockName: string, fallbackTheme?: string): string => {
  const fallback = (fallbackTheme || '').trim();
  if (fallback && fallback !== '주도섹터' && fallback !== 'N/A' && fallback !== '') return fallback;
  const name = stockName.trim();
  if (name === 'SK하이닉스' || name === '한미반도체' || name === '이오테크닉스' || name === '테크윙' || name === '한울소재과학') {
    return 'AI 반도체 / HBM 소부장';
  }
  if (name === '펩트론' || name === '삼천당제약' || name === '유한양행' || name === '한미약품') {
    return 'GLP-1 비만치료제 / 바이오 플랫폼';
  }
  if (name === 'AP위성' || name === '켄코아에어로스페이스' || name === '한국항공우주') {
    return '우주항공 / 위성 통신';
  }
  if (name === '동양철관' || name === '한국가스공사' || name === '포스코인터내셔널') {
    return '동해 가스전 개발';
  }
  if (name === '기가레인') {
    return '차세대 6G 통신망';
  }
  if (name === '위닉스' || name === '신일전자' || name === '파세코' || name === '에스씨디') {
    return '여름 폭염 / 계절 가전';
  }
  if (name === '흥구석유') {
    return '지정학적 리스크 / 정유 에너지';
  }
  if (name === 'SK이터닉스') {
    return '신재생 해상풍력';
  }
  if (name === '앤로보틱스' || name === '씨피시스템') {
    return '로봇 및 자동화 공정';
  }
  return '주도수급 개별테마';
};

function RenderMarkdown({ text }: { text: string }) {
  if (!text) return null;
  
  const lines = text.split('\n');
  return (
    <div className="space-y-3 font-sans text-xs text-slate-700 dark:text-slate-300 leading-relaxed text-left">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;
        
        if (trimmed === '---') {
          return <hr key={idx} className="border-slate-200 dark:border-slate-800 my-4" />;
        }
        
        if (trimmed.match(/^(🌐|🇺🇸|📰|🔥|🇰🇷|💡)\s+\d*\.?\s*.*$/) || trimmed.startsWith('🌐') || trimmed.startsWith('🇺🇸') || trimmed.startsWith('📰') || trimmed.startsWith('🔥') || trimmed.startsWith('🇰🇷')) {
          return (
            <h4 key={idx} className="text-sm font-extrabold text-white tracking-tight border-b border-slate-200 dark:border-slate-800 pb-1.5 mt-5 mb-2 flex items-center gap-1.5">
              {trimmed}
            </h4>
          );
        }

        if (trimmed.startsWith('한 줄 코멘트:') || trimmed.startsWith('- ') || trimmed.startsWith('  - ')) {
          let content = trimmed;
          let isBullet = false;
          let indentClass = "";
          
          if (content.startsWith('  - ')) {
            content = content.substring(4);
            isBullet = true;
            indentClass = "pl-6";
          } else if (content.startsWith('- ')) {
            content = content.substring(2);
            isBullet = true;
            indentClass = "pl-2";
          }

          const colonIdx = content.indexOf(':');
          if (colonIdx !== -1) {
            const label = content.substring(0, colonIdx + 1);
            const value = content.substring(colonIdx + 1);
            return (
              <div key={idx} className={`flex items-start gap-1.5 leading-relaxed ${indentClass}`}>
                {isBullet && <span className="text-indigo-450 mt-1 shrink-0">•</span>}
                <p className="text-slate-700 dark:text-slate-300">
                  <span className="font-extrabold text-indigo-300">{label}</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium">{value}</span>
                </p>
              </div>
            );
          }
        }
        
        if (trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-indigo-400 mt-1 shrink-0">•</span>
              <p className="text-slate-700 dark:text-slate-300">{trimmed.substring(2)}</p>
            </div>
          );
        }

        return <p key={idx} className="leading-relaxed pl-1">{trimmed}</p>;
      })}
    </div>
  );
}

interface BriefingViewProps {
  briefing: PreMarketBriefing | null;
  loading: boolean;
  isCompact?: boolean;
}

export const BriefingView: React.FC<BriefingViewProps> = ({ briefing, loading, isCompact = false }) => {
  const [viewMode, setViewMode] = React.useState<'quant' | 'visual'>('quant');
  
  if (loading) {
    return (
      <div className="col-span-12 flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500/20 border-t-amber-500 animate-spin" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">07:50 글로벌 장전 브리핑 및 인공지능 분석 데이터 생성 중...</p>
      </div>
    );
  }

  if (!briefing) {
    return (
      <div className="col-span-12 flex flex-col items-center justify-center py-20 text-center space-y-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800">
        <Globe className="w-12 h-12 text-slate-600 animate-pulse" />
        <p className="text-xs text-slate-600 dark:text-slate-400 font-sans">데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  // Safe Fallback mappings to support both client structures and server DB schema variations
  const formatCreatedAt = (dateVal: any) => {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      return d.toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
    } catch (e) {
      return String(dateVal);
    }
  };

  const createdAtStr = (briefing as any).createdAt || briefing.date || new Date().toISOString();

  // 1. AI Gemini 모델 직접 생성 필드 파싱
  const aiSummary = (briefing as any).summary || '';
  const aiLeadMapping = (briefing as any).leadMapping || '';
  const aiExpectedThemes = Array.isArray((briefing as any).expectedThemes) ? (briefing as any).expectedThemes : [];
  const aiStrategyScenario = (briefing as any).strategyScenario || '';

  const usSummary = briefing.usSummary || (briefing as any).usMarkets || {};
  const dow = usSummary.dow || '';
  const nasdaq = usSummary.nasdaq || '';
  const sp500 = usSummary.sp500 || usSummary.sAndP500 || '';
  const russell2000 = usSummary.russell2000 || '';
  const vix = usSummary.vix || '';

  const macro = briefing.macro || (briefing as any).macroIndicators || {};
  const interestRate = macro.interestRate || '데이터 없음';
  const cpi = macro.cpi || '데이터 없음';
  const ppi = macro.ppi || '데이터 없음';
  const treasuryYield = macro.bondYield || macro.treasuryYield || '데이터 없음';
  const exchangeRate = macro.exchangeRate || '데이터 없음';
  const oilPrice = macro.oilPrice || '데이터 없음';

  const usLeaders = (briefing as any).usLeaders || (Array.isArray(briefing.usJodoju) ? briefing.usJodoju.join(', ') : (aiExpectedThemes.length > 0 ? aiExpectedThemes.join(', ') : 'AI 반도체 / 빅테크'));
  const usFeaturedStock = (briefing as any).usFeaturedStock || (Array.isArray(briefing.usFeaturedStocks) ? briefing.usFeaturedStocks.join('\n') : (aiLeadMapping || '주요 주도주 동향 관찰 중'));

  const koreanMarketImpact = (briefing as any).koreanMarketImpact || briefing.koreanImpact || aiLeadMapping || aiSummary || '';

  const domesticMatches: { stockName: string; theme: string; reason: string }[] = 
    Array.isArray((briefing as any).domesticMatches)
      ? (briefing as any).domesticMatches
      : (Array.isArray(briefing.relatedKoreanStocks) ? briefing.relatedKoreanStocks : []).map((item: any) => {
          const sName = item.name || item.stockName || '';
          return {
            stockName: sName,
            theme: getStockThemeName(sName, item.theme),
            reason: item.reason || ''
          };
        });

  // 5줄 요약
  let aiSummary5Lines = Array.isArray(briefing.aiSummary5Lines) && briefing.aiSummary5Lines.length > 0 
    ? briefing.aiSummary5Lines 
    : [];

  if (aiSummary5Lines.length === 0) {
    if (aiSummary) aiSummary5Lines.push(`[시황 요약] ${aiSummary}`);
    if (aiLeadMapping) aiSummary5Lines.push(`[주도 연동] ${aiLeadMapping}`);
    if (aiExpectedThemes.length > 0) aiSummary5Lines.push(`[예상 테마] ${aiExpectedThemes.join(', ')}`);
    if (aiStrategyScenario) aiSummary5Lines.push(`[대응 전략] ${aiStrategyScenario}`);
  }

  // 관심 테마
  let rawInterestThemes = Array.isArray(briefing.interestThemes) && briefing.interestThemes.length > 0 
    ? briefing.interestThemes 
    : [];

  if (rawInterestThemes.length === 0 && aiExpectedThemes.length > 0) {
    rawInterestThemes = [
      {
        theme: aiExpectedThemes.join(' & '),
        relatedStocks: [aiLeadMapping || '주도주 수급 유입']
      }
    ];
  }

  const warningIssues = (briefing as any).warningIssues || (Array.isArray(briefing.riskIssues) ? briefing.riskIssues.join('\n') : (aiStrategyScenario || ''));

  // 동적 매크로 세부 정보 생성기 (하드코딩 문구 중복 방지)
  const getDetailForMacro = (label: string, fieldKey: string) => {
    if (briefing.macroDetailed && (briefing.macroDetailed as any)[fieldKey]) {
      return (briefing.macroDetailed as any)[fieldKey];
    }
    return {
      reason: aiSummary || `${label} 변동성에 따른 글로벌 자금 수급 동향 주시`,
      majorsAction: aiLeadMapping || `외국인 및 기관 매니저 시초가 수급 조율 중`,
      marketImpact: aiStrategyScenario || `장 초반 변동성 확대 대비 분할 매수 대응`,
      sectorsAnalysis: aiExpectedThemes.length > 0 ? `주요 예상 테마: ${aiExpectedThemes.join(', ')}` : `주도주 및 관련 소부장 수급 집중`
    };
  };

  // 1. Overall Commentary for US Markets
  const getUsMarketsOverallCommentary = () => {
    if (aiSummary) return aiSummary;
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
    if (aiSummary) return aiSummary;
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

  const displayTodayDate = briefing.date || new Date().toISOString().split('T')[0];

  return (
    <div className="col-span-12 space-y-6">
      {/* 퀀트리포트창 삭제 후 단일화된 요약 브리핑 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-pulse shrink-0" />
          <span className="text-sm font-black text-white tracking-tight flex items-center gap-2">
            오늘의 실시간 장전 핵심 요약 브리핑
          </span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10.5px] font-mono font-black rounded-lg">
            기준 일자: {displayTodayDate}
          </span>
        </div>
      </div>

      {/* AI 실시간 프리마켓 핵심 시황 및 수급 전략 카드 */}
      {(aiSummary || aiLeadMapping || aiStrategyScenario || aiExpectedThemes.length > 0) && (
        <div className="bg-gradient-to-br from-indigo-950/50 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-2xl p-5 md:p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
            <h3 className="text-sm font-black text-indigo-300 tracking-tight flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>AI 실시간 프리마켓 핵심 시황 & 수급 전략</span>
            </h3>
            <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-black rounded-md border border-indigo-500/30">
              Gemini Realtime AI
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {aiSummary && (
              <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/20 space-y-1.5">
                <span className="text-[11px] font-black text-indigo-400 block">
                  📌 글로벌 마켓 시황 요약
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium break-keep whitespace-normal overflow-wrap-anywhere">
                  {aiSummary}
                </p>
              </div>
            )}

            {aiLeadMapping && (
              <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/20 space-y-1.5">
                <span className="text-[11px] font-black text-emerald-400 block">
                  🎯 주도주 & 소부장 연동 매핑
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium break-keep whitespace-normal overflow-wrap-anywhere">
                  {aiLeadMapping}
                </p>
              </div>
            )}

            {aiExpectedThemes.length > 0 && (
              <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/20 space-y-2 md:col-span-2">
                <span className="text-[11px] font-black text-amber-400 block">
                  🔥 장 초반 수급 유입 예상 테마
                </span>
                <div className="flex flex-wrap gap-2.5">
                  {aiExpectedThemes.flatMap((themeStr: string) => {
                    if (typeof themeStr === 'string' && (themeStr.includes('&') || themeStr.includes(' / '))) {
                      return themeStr.split(/&|\//).map(s => s.trim()).filter(Boolean);
                    }
                    return [themeStr];
                  }).map((theme: string, tIdx: number) => (
                    <div key={tIdx} className="px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-extrabold text-xs rounded-lg max-w-full leading-normal tracking-tight break-keep whitespace-normal overflow-wrap-anywhere flex items-center gap-1.5 shadow-sm">
                      <span className="text-amber-400 font-mono">#</span>
                      <span className="break-keep word-break-keep-all overflow-wrap-anywhere text-slate-100">{theme}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {aiStrategyScenario && (
              <div className="bg-slate-900/90 p-4 rounded-xl border border-indigo-500/20 space-y-1.5 md:col-span-2">
                <span className="text-[11px] font-black text-rose-400 block">
                  🛡️ 전업 트레이더 대응 시나리오
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-medium break-keep whitespace-normal overflow-wrap-anywhere">
                  {aiStrategyScenario}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* 1. 글로벌 거시경제 주요지표 (맨 위로 이동 및 상세 4대 분석 탑재) */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                <span>글로벌 거시경제 주요지표 및 6대 지표 상세 분석</span>
              </h3>
              <span className="text-[10px] text-slate-450 font-mono font-bold">
                * 각 지표를 터치/클릭하여 상세 4대 분석을 확인할 수 있습니다.
              </span>
            </div>

            {/* 짧은 전체 분석 코멘트 */}
            <div className="bg-indigo-500/5 border-l-2 border-indigo-500 p-4 rounded-r-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed select-text">
              <span className="font-extrabold text-indigo-400 block mb-1">💡 거시경제 종합 시각</span>
              {getMacroOverallCommentary()}
            </div>

            {/* 6대 주요 지표 상세 카드 그리드 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
              {[
                { 
                  label: '기준 금리', 
                  value: interestRate, 
                  icon: '', 
                  colorClass: 'border-indigo-500/10 hover:border-indigo-500/30', 
                  textClass: 'text-indigo-400',
                  detail: getDetailForMacro('기준 금리', 'interestRate')
                },
                { 
                  label: 'CPI (소비자물가)', 
                  value: cpi, 
                  icon: '', 
                  colorClass: 'border-emerald-500/10 hover:border-emerald-500/30', 
                  textClass: 'text-emerald-400',
                  detail: getDetailForMacro('CPI (소비자물가)', 'cpi')
                },
                { 
                  label: 'PPI (생산자물가)', 
                  value: ppi, 
                  icon: '', 
                  colorClass: 'border-amber-500/10 hover:border-amber-500/30', 
                  textClass: 'text-amber-400',
                  detail: getDetailForMacro('PPI (생산자물가)', 'ppi')
                },
                { 
                  label: '미 10년물 국채금리', 
                  value: treasuryYield, 
                  icon: '', 
                  colorClass: 'border-sky-500/10 hover:border-sky-500/30', 
                  textClass: 'text-sky-400',
                  detail: getDetailForMacro('미 10년물 국채금리', 'bond10y')
                },
                { 
                  label: '원/달러 환율', 
                  value: exchangeRate, 
                  icon: '', 
                  colorClass: 'border-rose-500/10 hover:border-rose-500/30', 
                  textClass: 'text-rose-400',
                  detail: getDetailForMacro('원/달러 환율', 'exchangeRate')
                },
                { 
                  label: 'WTI 국제유가', 
                  value: oilPrice, 
                  icon: '', 
                  colorClass: 'border-teal-500/10 hover:border-teal-500/30', 
                  textClass: 'text-teal-400',
                  detail: getDetailForMacro('WTI 국제유가', 'oilPrice')
                }
              ].map((item, idx) => (
                <MacroDetailCard
                  key={idx}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  colorClass={item.colorClass}
                  textClass={item.textClass}
                  detail={item.detail}
                  defaultOpen={false}
                />
              ))}
            </div>
          </div>

          {/* 2. 핵심 브리핑 요약 */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-indigo-500/10 rounded-2xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>핵심 브리핑 요약</span>
            </h3>
            <div className="space-y-3">
              {aiSummary5Lines.map((line, idx) => (
                <div key={idx} className="flex gap-2.5 items-start">
                  <span className="text-indigo-400 text-xs font-black font-mono mt-0.5">{idx + 1}.</span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-sans break-keep break-words whitespace-normal">{line}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 미국증시 주요지수 마감 현황 */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>미국증시 주요지수 마감 현황</span>
            </h3>
            
            <div className="bg-emerald-500/5 border-l-2 border-emerald-500 p-3.5 rounded-r-xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-4xl select-text">
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
                const raw = (m.val || '').trim();
                const hasData = Boolean(raw) && raw !== '동향 관찰' && raw !== '데이터 없음';
                
                let price = '데이터 없음';
                let change = '';

                if (hasData) {
                  const match = raw.match(/^([0-9\.,\$\+\-]+)\s*(.*)$/);
                  if (match) {
                    price = match[1];
                    change = match[2];
                  } else {
                    price = raw;
                  }
                }

                const isUp = change.includes('+') || raw.includes('+');
                const isDown = change.includes('-') || raw.includes('-');

                const getUsCommentary = (nameStr: string, valStr: string) => {
                  const trimmed = valStr.trim();
                  if (!trimmed || trimmed === '데이터 없음') return '지수 수치 미집계';

                  const u = trimmed.includes('+');
                  const d = trimmed.includes('-');
                  
                  if (nameStr.includes('다우존스')) {
                    if (u) return '우량주 중심 완만한 상승세';
                    if (d) return '제조·금융 대형주 차익 실현';
                    return '관망세 지속 보합권 등락';
                  }
                  if (nameStr.includes('나스닥')) {
                    if (u) return '빅테크·AI 강력한 매수 쏠림';
                    if (d) return '고점 도달에 따른 단기 매물 출회';
                    return '추가 상승 모멘텀 탐색 흐름';
                  }
                  if (nameStr.includes('S&P 500')) {
                    if (u) return '사상 최고가권 안착 흐름 지속';
                    if (d) return '상승 랠리 이후 단기 숨고르기';
                    return '방향성 타진하며 혼조세 등락';
                  }
                  if (nameStr.includes('러셀 2000')) {
                    if (u) return '금리 완화 기대로 중소형주 수혜';
                    if (d) return '고금리 장기화 우려에 약세 지속';
                    return '중소형주 경기 연착륙 관망';
                  }
                  if (nameStr.includes('VIX')) {
                    if (d || trimmed.startsWith('10') || trimmed.startsWith('11') || trimmed.startsWith('12') || trimmed.startsWith('13') || trimmed.startsWith('14') || trimmed.startsWith('15') || trimmed.startsWith('16')) {
                      return '시장 심리 안정 및 불안 해소';
                    }
                    return '옵션 시장 헤지 매수세 유입';
                  }
                  return '시장 방향성 관망세 우세';
                };

                return (
                  <div key={idx} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between items-center text-center gap-2 w-full min-h-[118px] shadow-sm">
                    <div className="flex flex-col items-center gap-1 w-full">
                      <span className="text-[11px] font-extrabold text-slate-600 dark:text-slate-400 block whitespace-normal break-keep w-full leading-tight">{m.name}</span>
                      <div className="flex flex-col gap-0.5 w-full items-center">
                        <span className={`text-xs font-black font-mono block whitespace-normal break-all w-full leading-normal ${
                          hasData ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500 dark:text-slate-500'
                        }`}>
                          {price}
                        </span>
                        {hasData && change ? (
                          <span className={`text-[10px] font-extrabold font-mono block leading-normal whitespace-normal break-all w-full ${
                            m.isVix 
                              ? (isDown ? 'text-emerald-400' : 'text-amber-400') 
                              : isUp ? 'text-rose-500 dark:text-rose-400' : isDown ? 'text-sky-500 dark:text-sky-400' : 'text-slate-400'
                          }`}>
                            {change}
                          </span>
                        ) : !hasData ? (
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 block">
                            데이터 없음
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="w-full border-t border-slate-100 dark:border-slate-850 pt-1.5 select-none">
                      <p className="text-[9px] font-medium text-slate-500 dark:text-slate-400 leading-tight break-keep">{getUsCommentary(m.name, m.val)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. 미국 주도주 및 특징주 */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>미국 주도주 및 특징주</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2">US Leader / 미국 주도주</span>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-extrabold whitespace-normal break-keep bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-850/50">
                  {usLeaders}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Featured Stock Movement / 특징주 분석</span>
                <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-wrap break-keep bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-850/50">
                  {usFeaturedStock}
                </div>
              </div>
            </div>
          </div>

          {/* 6. 국내 시장 영향 분석 및 연동 종목 분석 (섹터별 매핑 및 최대 6개 섹터 적응형 렌더링) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-indigo-500/10 rounded-2xl p-5 space-y-5">
            <div className="border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>국내 시장 영향 및 섹터별 주도 연동종목 분석</span>
              </h3>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded border border-indigo-500/20 uppercase font-mono">
                Sectors Active
              </span>
            </div>

            {/* 수급 이동 시나리오 */}
            <div className="bg-white dark:bg-slate-950/60 p-4 rounded-xl border border-indigo-500/15 text-xs text-slate-700 dark:text-slate-300 leading-relaxed shadow-inner">
              <h4 className="font-extrabold text-indigo-300 mb-1.5">📊 전업 트레이더 전략적 연결 분석</h4>
              <p className="leading-relaxed whitespace-pre-wrap break-keep break-words">{koreanMarketImpact}</p>
            </div>

            {/* 섹터별 연동 종목 분석 (최대 6군데 상황 적응형 구조화) */}
            <div className="space-y-3.5">
              <h5 className="text-[10px] font-black text-slate-450 uppercase tracking-wider block">⚡ 오늘 장 연동 예상 섹터 및 구성 종목</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(briefing.domesticSectors || []).slice(0, 6).map((sec, idx) => {
                  const sentimentColors = 
                    sec.sentiment === 'bullish' 
                      ? 'bg-red-500/10 border-red-500/20 text-red-400' 
                      : sec.sentiment === 'bearish' 
                        ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' 
                        : 'bg-slate-200 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/60 text-slate-600 dark:text-slate-400';

                  return (
                    <div key={idx} className="bg-white dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 p-4 rounded-xl flex flex-col gap-3 hover:border-slate-200 dark:hover:border-slate-800 transition-all">
                      {/* 섹터 헤더 */}
                      <div className="flex items-center justify-between border-b border-slate-900/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">{sec.sectorName}</span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${sentimentColors}`}>
                          {sec.sentiment}
                        </span>
                      </div>

                      {/* 분석 리포트 */}
                      <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed font-medium break-keep">
                        {sec.reason}
                      </p>

                      {/* 해당 섹터에 포함된 연동 종목군 나열 (칩 형태) */}
                      <div className="flex flex-wrap gap-1.5 mt-1 border-t border-slate-900/40 pt-2.5">
                        {sec.stocks.map((stock, sIdx) => (
                          <span 
                            key={sIdx} 
                            className="px-2 py-0.5 bg-indigo-500/5 hover:bg-indigo-500/10 border border-indigo-500/15 hover:border-indigo-500/35 text-indigo-300 font-extrabold text-[10.5px] rounded-md transition-all cursor-default"
                          >
                            {stock}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 기존 단일 리스트 형태도 하단에 슬림하게 서브로 유지해 완벽한 하위호환 확보 */}
            {domesticMatches.length > 0 && (
              <div className="border-t border-slate-200 dark:border-slate-850/50 pt-3 mt-1.5">
                <span className="text-[9.5px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest block mb-2">📋 연동 주도주 세부 분석 요약</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {domesticMatches.map((item, idx) => (
                    <div key={idx} className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-850/50 p-2.5 rounded-lg flex flex-col justify-start gap-1 w-full">
                      <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 leading-tight">{item.stockName}</span>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold block">연계: {item.theme}</span>
                      <span className="text-[10px] text-slate-450 leading-relaxed block break-keep">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 7. 오늘의 핵심 관심 테마 및 주요 종목 */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-700 dark:text-slate-300 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Flame className="w-4 h-4 text-red-500" />
              <span>오늘의 핵심 관심 테마 및 주요 종목</span>
            </h3>
            <div className="space-y-3.5">
              {rawInterestThemes.map((item: any, idx) => {
                const themeName = typeof item === 'string' ? item : (item.theme || '관심테마');
                const stocks = Array.isArray(item.relatedStocks) ? item.relatedStocks : [];
                return (
                  <div key={idx} className="bg-white dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 flex flex-col gap-3.5">
                    {/* Theme Label */}
                    <div className="flex items-center gap-2 border-b border-slate-900 pb-2.5 shrink-0 min-h-[36px]">
                      <span className="w-1.5 h-3 bg-red-500 rounded-full shrink-0" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200 leading-snug block whitespace-normal break-keep w-full">{themeName}</span>
                    </div>
                    
                    {/* Stocks (Horizontally laid out) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
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
                        const changeColor = isNegative ? 'text-blue-400' : (isPositive ? 'text-red-400' : 'text-slate-700 dark:text-slate-300');

                        return (
                          <div key={sIdx} className="bg-slate-50 dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-850/50 py-2.5 px-3 rounded-xl flex flex-col justify-between transition-all min-w-0 gap-1.5 w-full h-full shadow-sm">
                            <div className="font-extrabold text-slate-900 dark:text-slate-100 text-[12px] sm:text-xs tracking-tight truncate w-full">
                              {name}
                            </div>
                            
                            {detailParts.length > 0 && (
                              <div className="flex items-center justify-between w-full border-t border-slate-200 dark:border-slate-800/40 pt-2 mt-0.5 select-none gap-2">
                                <span className={`font-black text-[10px] sm:text-[10.5px] font-mono whitespace-nowrap ${changeColor}`}>
                                  {detailParts[0]}
                                </span>
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
                        <div className="text-[10px] text-slate-500 dark:text-slate-500 italic col-span-2 py-1">종목 준비 중...</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8. 오늘의 핵심 주의 리스크 (마지막 배치) */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-red-500/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-600 dark:text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>오늘의 핵심 주의 리스크 및 위기 요소</span>
            </h3>
            <div className="bg-red-950/10 border border-red-500/10 p-4 rounded-xl flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-950 text-red-400 border border-red-500/20 text-[10px] font-mono font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                !
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap break-keep break-words">
                {warningIssues}
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};
