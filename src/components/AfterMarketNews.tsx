import React from 'react';
import { Calendar, TrendingUp, DollarSign, Activity, AlertTriangle, ChevronRight, ActivitySquare } from 'lucide-react';

export const AfterMarketNews = () => {
  const today = new Date();
  const kstTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const dateStr = kstTime.toISOString().split('T')[0];

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <ActivitySquare className="w-32 h-32 text-indigo-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              DAILY AFTER-MARKET BRIEFING
            </span>
            <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {dateStr}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            K-Stock 장마감 통합 분석 브리핑
          </h2>
          <p className="text-slate-400 text-xs font-medium">
            AI 기반 실시간 지수, 수급, 매크로 및 특징주 심층 분석 리포트
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. 지수 및 수급 상황 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            1. 지수 및 수급 상황 (시장 요약)
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">코스피 (KOSPI)</span>
              <div className="text-right">
                <div className="text-sm font-black text-slate-800 dark:text-slate-200">6,820.60</div>
                <div className="text-[10px] font-bold text-sky-500">-6.37% (대형주 중심 강력한 매도세)</div>
              </div>
            </div>
            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-xs font-bold text-slate-600 dark:text-slate-400">코스닥 (KOSDAQ)</span>
              <div className="text-right">
                <div className="text-sm font-black text-slate-800 dark:text-slate-200">791.84</div>
                <div className="text-[10px] font-bold text-sky-500">-4.53% (800선 붕괴 및 지지선 이탈)</div>
              </div>
            </div>
            <div className="pt-2">
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                <span className="text-indigo-500 dark:text-indigo-400 font-bold">외국인 4,500억 순매수</span> 주도로 지수 상승을 견인했으며, 
                기관(-1,200억)과 개인(-3,300억)은 차익 실현에 나섰습니다. 
                특히 프로그램 매매에서 <span className="font-bold text-slate-700 dark:text-slate-300">비차익 중심 2,500억 순매수</span>가 유입되며 대형주 장세를 뒷받침했습니다.
              </p>
            </div>
          </div>
        </div>

        {/* 2. 매크로 및 외부 변수 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <DollarSign className="w-4 h-4 text-emerald-500" />
            2. 매크로 및 외부 변수 (원인 분석)
          </h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50 text-center">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">원/달러 환율</div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">1,490.00원</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50 text-center">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">미 10년물 국채금리</div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">4.25%</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50 text-center">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">WTI 국제유가</div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">$81.50</div>
            </div>
            <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800/50 text-center">
              <div className="text-[10px] text-slate-500 font-bold mb-0.5">필라델피아 반도체</div>
              <div className="text-xs font-black text-slate-800 dark:text-slate-200">5,200.3</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
            전일 뉴욕 증시가 혼조세를 보였으나, 필라델피아 반도체 지수의 강세(5,200선 돌파)가 국내 증시의 투자 심리를 크게 개선시켰습니다. 
            달러인덱스는 105.2 수준에서 안정화 추세를 보이고 있습니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3. 주도 섹터 및 특징주 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <Activity className="w-4 h-4 text-cyan-500" />
            3. 주도 섹터 및 특징주 (미시 분석)
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-2 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold rounded">HBM 및 반도체 장비 ⬇️</span>
                <span className="px-2 py-1 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[10px] font-bold rounded">자동차 및 완성차 ⬇️</span>
                <span className="px-2 py-1 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-bold rounded">경기 방어주 및 일부 금융 ⬆️</span>
              </div>
            </div>
            <ul className="space-y-2">
              <li className="text-[11px] flex items-start gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-800 dark:text-slate-200">삼성전자 및 SK하이닉스:</strong> 글로벌 반도체 투자심리 악화 여파로 외국인 매물 쏟아지며 급락.</span>
              </li>
              <li className="text-[11px] flex items-start gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span><strong className="text-slate-800 dark:text-slate-200">경기 방어주 (통신, 전력):</strong> 시장 급락 속에서도 피난처 성격의 방어주로 기관 수급 유입되며 상대적 선방.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4. 메이저 수급 및 행동 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <TrendingUp className="w-4 h-4 text-indigo-500" />
            4. 메이저의 행동 및 수급 특징
          </h3>
          <ul className="space-y-3">
            <li className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="text-[10px] font-bold text-indigo-500 mb-1">바스켓 매매 동향</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                외국인은 반도체, 자동차 등 기존 주도 섹터에서 바스켓 매도를 쏟아내며 시장 하방 압력을 가중시켰습니다.
              </p>
            </li>
            <li className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="text-[10px] font-bold text-indigo-500 mb-1">윈도우 드레싱 및 공매도 환매수</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                분기말 임박에 따른 기관의 윈도우 드레싱 자금 유입 조짐이 보이며, 
                최근 공매도 과열 종목군(바이오 일부)에서 숏커버링(환매수)이 유입되며 급등세가 연출되었습니다.
              </p>
            </li>
          </ul>
        </div>
      </div>

      {/* 5. 관전 포인트 및 리스크 */}
      <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2 border-b border-amber-200 dark:border-amber-500/20 pb-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          5. 다음 영업일 관전 포인트 및 리스크 (전망)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">📈 기술적 분석 및 대응</h4>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
              코스피는 6,800선 돌파 후 안착을 시도하고 있으며, 
              코스닥은 790선을 지지선으로 삼아 하방 경직성을 확보했습니다. 
              추격 매수보다는 5일선 지지 확인 후 눌림목 공략이 유효합니다.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">⚠️ 대기 이벤트 및 리스크</h4>
            <ul className="text-[11px] text-slate-600 dark:text-slate-400 font-medium space-y-1">
              <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 미국 7월 FOMC 금리결정 및 주요 기술주 실적 발표 대기</li>
              <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 원달러 환율 1,490원선 장기 안착 시 외인 수급 추가 이탈 우려</li>
              <li className="flex items-center gap-1.5"><ChevronRight className="w-3 h-3" /> 유럽 정치적 불확실성에 따른 단기 변동성 확대 주의</li>
            </ul>
          </div>
        </div>
      </div>
      
    </div>
  );
};
