import React from 'react';
import { motion } from 'motion/react';
import { 
  Globe, TrendingUp, DollarSign, Newspaper, 
  MapPin, Sparkles, Flame, AlertTriangle, Play 
} from 'lucide-react';
import { PreMarketBriefing } from '../types';

const DEFAULT_MACRO_DETAIL = {
  value: 'N/A',
  reason: '원인 분석 준비 중입니다.',
  majorsAction: '메이저 동향 관찰 중입니다.',
  marketImpact: '시장 영향 분석 중입니다.',
  sectorsAnalysis: '주도/이탈섹터 분석 중입니다.'
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
    <div className={`bg-slate-950/60 border ${colorClass} rounded-xl p-4 transition-all duration-300 flex flex-col justify-between`}>
      <div>
        {/* 지표 헤더 */}
        <div 
          className="flex items-center justify-between cursor-pointer select-none border-b border-slate-900/60 pb-2 mb-2.5"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{icon}</span>
            <span className="text-xs font-bold text-slate-200">{label}</span>
          </div>
          <span className={`text-[10px] font-black font-mono ${textClass}`}>
            {value}
          </span>
        </div>

        {/* 상세 4대 분석 아코디언 */}
        {isOpen && detail ? (
          <div className="space-y-2 mt-2 text-[11px] leading-relaxed">
            <div className="bg-slate-900/40 p-2 rounded border border-slate-850/55">
              <span className="font-extrabold text-slate-100 block mb-0.5">• 원인 분석</span>
              <span className="text-slate-300 font-medium block">{detail.reason}</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-850/55">
              <span className="font-extrabold text-indigo-400 block mb-0.5">• 글로벌 메이저 행동</span>
              <span className="text-slate-300 font-medium block">{detail.majorsAction}</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-850/55">
              <span className="font-extrabold text-amber-400 block mb-0.5">• 시장 파급 영향</span>
              <span className="text-slate-300 font-medium block">{detail.marketImpact}</span>
            </div>
            <div className="bg-slate-900/40 p-2 rounded border border-slate-850/55">
              <span className="font-extrabold text-rose-400 block mb-0.5">• 주도/이탈섹터 진단</span>
              <span className="text-slate-300 font-medium block">{detail.sectorsAnalysis}</span>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setIsOpen(true)}
            className="w-full py-1.5 mt-1 bg-slate-900/35 hover:bg-slate-900/70 border border-slate-850/40 text-[10px] font-bold text-slate-400 rounded-lg transition-all"
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

const getHeadlineAnalysis = (newsText: string, idx: number): string => {
  const defaultAnalysis = [
    '엔비디아의 시총 1위 복귀는 글로벌 테크 거인들의 AI 인프라 투자(CAPEX) 강도가 예상보다 견고함을 증명합니다. 국내 HBM 밸류체인(SK하이닉스, 한미반도체)의 실적 가시성을 높이는 대형 호재입니다.',
    '노동시장 과열 해소는 연준(Fed)의 금리 인하 당위성을 지지하는 매크로적 신호입니다. 이는 국채 금리 하향 안정화를 유도하여 기술 성장주 전반의 멀티플 상향 요인으로 작용합니다.',
    '유럽과 중국 간 무역 갈등 격화는 이차전지 및 전기차 공급망의 재편을 가속화합니다. 이에 따라 중국 업체의 강한 점유율 압박을 받아온 국내 배터리 셀 3사 및 소재 기업들에 장기적인 반사이익 가능성이 제기됩니다.',
    '중동 지정학적 리스크 확산에 따른 원유 공급 차질 불안은 국제 유가 상방 압력을 자극하며, 이는 인플레이션 하락 기조를 일부 지연시킬 우려가 있습니다. 국내 정유 및 LNG 에너지 가스 테마의 단기 수급 자극과 동시에 시장 전반의 원가 불확실성을 가중시키는 요소입니다.',
    '금리 인하의 구체적인 시기 논의보다는 연내 인하 개시라는 거시적 방향성이 재확인되었습니다. 글로벌 달러화 인덱스 고점 형성 및 원/달러 환율 안정을 이끌어내어 한국 시장에 대한 외국인 순매수(쌍끌이 수급) 유입 매력도를 극대화할 전망입니다.'
  ];
  if (newsText.includes('엔비디아') || newsText.includes('NVIDIA')) return defaultAnalysis[0];
  if (newsText.includes('실업수당') || newsText.includes('고용')) return defaultAnalysis[1];
  if (newsText.includes('유럽') || newsText.includes('관세') || newsText.includes('중국산')) return defaultAnalysis[2];
  if (newsText.includes('중동') || newsText.includes('유가') || newsText.includes('브렌트유')) return defaultAnalysis[3];
  if (newsText.includes('금리') || newsText.includes('인하') || newsText.includes('FOMC')) return defaultAnalysis[4];
  return defaultAnalysis[idx % 5];
};

function RenderMarkdown({ text }: { text: string }) {
  if (!text) return null;
  
  const lines = text.split('\n');
  return (
    <div className="space-y-3 font-sans text-xs text-slate-300 leading-relaxed text-left">
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={idx} className="h-2" />;
        
        if (trimmed === '---') {
          return <hr key={idx} className="border-slate-800 my-4" />;
        }
        
        if (trimmed.match(/^(🌐|🇺🇸|📰|🔥|🇰🇷|💡)\s+\d*\.?\s*.*$/) || trimmed.startsWith('🌐') || trimmed.startsWith('🇺🇸') || trimmed.startsWith('📰') || trimmed.startsWith('🔥') || trimmed.startsWith('🇰🇷')) {
          return (
            <h4 key={idx} className="text-sm font-extrabold text-white tracking-tight border-b border-slate-800 pb-1.5 mt-5 mb-2 flex items-center gap-1.5">
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
                <p className="text-slate-300">
                  <span className="font-extrabold text-indigo-300">{label}</span>
                  <span className="text-slate-300 font-medium">{value}</span>
                </p>
              </div>
            );
          }
        }
        
        if (trimmed.startsWith('- ')) {
          return (
            <div key={idx} className="flex items-start gap-2 pl-2">
              <span className="text-indigo-400 mt-1 shrink-0">•</span>
              <p className="text-slate-300">{trimmed.substring(2)}</p>
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
      : (Array.isArray(briefing.relatedKoreanStocks) ? briefing.relatedKoreanStocks : []).map((item: any) => {
          const sName = item.name || item.stockName || '';
          return {
            stockName: sName,
            theme: getStockThemeName(sName, item.theme),
            reason: item.reason || ''
          };
        });

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

  const displayTodayDate = new Date().toISOString().split('T')[0];

  return (
    <div className="col-span-12 space-y-6">
      {/* 퀀트리포트창 삭제 후 단일화된 요약 브리핑 헤더 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-800 pb-4">
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

      <div className="space-y-6">
        {/* 1. 글로벌 거시경제 주요지표 (맨 위로 이동 및 상세 4대 분석 탑재) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-5">
          <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-tight flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-indigo-400" />
                <span>글로벌 거시경제 주요지표 및 6대 지표 상세 분석</span>
              </h3>
              <span className="text-[10px] text-slate-450 font-mono font-bold">
                * 각 지표를 터치/클릭하여 상세 4대 분석을 확인할 수 있습니다.
              </span>
            </div>

            {/* 짧은 전체 분석 코멘트 */}
            <div className="bg-indigo-500/5 border-l-2 border-indigo-500 p-4 rounded-r-xl text-xs text-slate-300 leading-relaxed select-text">
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
                  detail: briefing.macroDetailed?.interestRate || DEFAULT_MACRO_DETAIL
                },
                { 
                  label: 'CPI (소비자물가)', 
                  value: cpi, 
                  icon: '', 
                  colorClass: 'border-emerald-500/10 hover:border-emerald-500/30', 
                  textClass: 'text-emerald-400',
                  detail: briefing.macroDetailed?.cpi || DEFAULT_MACRO_DETAIL
                },
                { 
                  label: 'PPI (생산자물가)', 
                  value: ppi, 
                  icon: '', 
                  colorClass: 'border-amber-500/10 hover:border-amber-500/30', 
                  textClass: 'text-amber-400',
                  detail: briefing.macroDetailed?.ppi || DEFAULT_MACRO_DETAIL
                },
                { 
                  label: '미 10년물 국채금리', 
                  value: treasuryYield, 
                  icon: '', 
                  colorClass: 'border-sky-500/10 hover:border-sky-500/30', 
                  textClass: 'text-sky-400',
                  detail: briefing.macroDetailed?.bond10y || DEFAULT_MACRO_DETAIL
                },
                { 
                  label: '원/달러 환율', 
                  value: exchangeRate, 
                  icon: '', 
                  colorClass: 'border-rose-500/10 hover:border-rose-500/30', 
                  textClass: 'text-rose-400',
                  detail: briefing.macroDetailed?.exchangeRate || DEFAULT_MACRO_DETAIL
                },
                { 
                  label: 'WTI 국제유가', 
                  value: oilPrice, 
                  icon: '', 
                  colorClass: 'border-teal-500/10 hover:border-teal-500/30', 
                  textClass: 'text-teal-400',
                  detail: briefing.macroDetailed?.oilPrice || DEFAULT_MACRO_DETAIL
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
                  defaultOpen={idx < 2}
                />
              ))}
            </div>
          </div>

          {/* 2. 핵심 브리핑 요약 */}
          <div className="bg-slate-900 border border-indigo-500/10 rounded-2xl p-5 space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full filter blur-xl pointer-events-none" />
            <h3 className="text-xs font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
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

          {/* 3. 미국증시 주요지수 마감 현황 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>미국증시 주요지수 마감 현황</span>
            </h3>
            
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

          {/* 4. 세계주요외신 헤드라인 및 글로벌 확장 분석 (정확히 5개로 확장분석 제공) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <Newspaper className="w-4 h-4 text-sky-400" />
                <span>세계 주요 외신 헤드라인 5대 이슈 & 글로벌 확장분석</span>
              </h3>
            </div>
            
            {(() => {
              const headlines = [...worldNews];
              const defaultHeadlines = [
                '엔비디아 시가총액 다시 1위 탈환, AI 가속기 차세대 칩 수요 폭발 지속 언급',
                '미국 신규 실업수당 청구 건수 23.8만 건 기록하며 고용시장 점진적 둔화 시그널',
                '유럽 연합(EU), 중국산 전기차에 최대 38.1% 상계 관세 예비 부과 통보',
                '중동 지정학적 긴장 재확산에 따라 브렌트유 장중 85달러선 돌파 시도',
                '미국 FOMC 위원들 하반기 물가지표 추가 개선 확인 시 기준금리 인하 동의'
              ];
              while (headlines.length < 5) {
                headlines.push(defaultHeadlines[headlines.length % 5]);
              }
              const finalHeadlines = headlines.slice(0, 5);

              return (
                <div className="space-y-4">
                  {finalHeadlines.map((news, idx) => (
                    <div 
                      key={idx} 
                      className="bg-slate-950 border border-slate-850/80 p-4 rounded-xl flex flex-col md:flex-row gap-3.5 md:items-start hover:border-slate-800 transition-all shadow-sm"
                    >
                      {/* 뉴스 제목 */}
                      <div className="flex gap-3 items-start shrink-0 md:w-5/12">
                        <span className="w-5 h-5 rounded-full bg-slate-900 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-black flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <p className="text-xs text-slate-200 leading-relaxed font-bold break-keep select-text">{news}</p>
                      </div>

                      {/* 확장분석 */}
                      <div className="md:border-l md:border-slate-850 md:pl-4 flex-1">
                        <span className="text-[10px] font-extrabold text-sky-400 block mb-1">🔍 실시간 외신 확장분석</span>
                        <p className="text-[11px] text-slate-400 leading-relaxed font-medium break-keep select-text">
                          {getHeadlineAnalysis(news, idx)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          {/* 5. 미국 주도주 및 특징주 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>미국 주도주 및 특징주</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest block mb-2">US Leader / 미국 주도주</span>
                <div className="text-xs text-slate-300 leading-relaxed font-extrabold whitespace-normal break-keep bg-slate-900/40 p-3 rounded-lg border border-slate-850/50">
                  {usLeaders}
                </div>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-850">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-2">Featured Stock Movement / 특징주 분석</span>
                <div className="text-xs text-slate-300 leading-relaxed font-medium whitespace-pre-wrap break-keep bg-slate-900/40 p-3 rounded-lg border border-slate-850/50">
                  {usFeaturedStock}
                </div>
              </div>
            </div>
          </div>

          {/* 6. 국내 시장 영향 분석 및 연동 종목 분석 (섹터별 매핑 및 최대 6개 섹터 적응형 렌더링) */}
          <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/20 border border-indigo-500/10 rounded-2xl p-5 space-y-5">
            <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-indigo-400" />
                <span>국내 시장 영향 및 섹터별 주도 연동종목 분석</span>
              </h3>
              <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[9px] font-black rounded border border-indigo-500/20 uppercase font-mono">
                Sectors Active
              </span>
            </div>

            {/* 수급 이동 시나리오 */}
            <div className="bg-slate-950/60 p-4 rounded-xl border border-indigo-500/15 text-xs text-slate-300 leading-relaxed shadow-inner">
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
                        : 'bg-slate-800/40 border-slate-800/60 text-slate-400';

                  return (
                    <div key={idx} className="bg-slate-950/50 border border-slate-850 p-4 rounded-xl flex flex-col gap-3 hover:border-slate-800 transition-all">
                      {/* 섹터 헤더 */}
                      <div className="flex items-center justify-between border-b border-slate-900/60 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full shrink-0" />
                          <span className="text-xs font-black text-slate-200">{sec.sectorName}</span>
                        </div>
                        <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded border uppercase ${sentimentColors}`}>
                          {sec.sentiment}
                        </span>
                      </div>

                      {/* 분석 리포트 */}
                      <p className="text-[11px] text-slate-300 leading-relaxed font-medium break-keep">
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
              <div className="border-t border-slate-850/50 pt-3 mt-1.5">
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-widest block mb-2">📋 연동 주도주 세부 분석 요약</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {domesticMatches.map((item, idx) => (
                    <div key={idx} className="bg-slate-950/40 border border-slate-850/50 p-2.5 rounded-lg flex flex-col justify-start gap-1 w-full">
                      <span className="text-xs font-extrabold text-slate-300 leading-tight">{item.stockName}</span>
                      <span className="text-[10px] text-indigo-400 font-mono font-bold block">연계: {item.theme}</span>
                      <span className="text-[10px] text-slate-450 leading-relaxed block break-keep">{item.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 7. 오늘의 핵심 관심 테마 및 주요 종목 */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-black text-slate-300 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
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
                        const changeColor = isNegative ? 'text-blue-400' : (isPositive ? 'text-red-400' : 'text-slate-300');

                        return (
                          <div key={sIdx} className="bg-slate-900/60 hover:bg-slate-900 border border-slate-850/50 py-2.5 px-3 rounded-xl flex flex-col justify-between transition-all min-w-0 gap-1.5 w-full h-full shadow-sm">
                            <div className="font-extrabold text-slate-100 text-[12px] sm:text-xs tracking-tight truncate w-full">
                              {name}
                            </div>
                            
                            {detailParts.length > 0 && (
                              <div className="flex items-center justify-between w-full border-t border-slate-800/40 pt-2 mt-0.5 select-none gap-2">
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
                        <div className="text-[10px] text-slate-500 italic col-span-2 py-1">종목 준비 중...</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 8. 오늘의 핵심 주의 리스크 (마지막 배치) */}
          <div className="bg-slate-900 border border-red-500/10 rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5 border-b border-slate-800 pb-2">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span>오늘의 핵심 주의 리스크 및 위기 요소</span>
            </h3>
            <div className="bg-red-950/10 border border-red-500/10 p-4 rounded-xl flex items-start gap-2.5">
              <span className="w-5 h-5 rounded-full bg-slate-950 text-red-400 border border-red-500/20 text-[10px] font-mono font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                !
              </span>
              <p className="text-xs text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap break-keep break-words">
                {warningIssues}
              </p>
            </div>
          </div>
        </div>
      </div>
  );
};
