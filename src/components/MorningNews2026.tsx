import React, { useState } from 'react';
import { ChevronRight, Globe2, TrendingDown, TrendingUp, AlertTriangle, Cpu, Terminal, Calendar, Code, CheckCircle2, Sun, Moon } from 'lucide-react';

export const MorningNews2026 = () => {
  
  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header SEO Optimized */}
      <header className={`bg-gradient-to-r from-slate-50 dark:from-slate-900 to-indigo-50 dark:to-indigo-950/30 border border-indigo-500/20 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-2xl`}>
        <div className="absolute top-0 right-0 p-4 opacity-10">
          <Globe2 className={`w-32 h-32 text-indigo-600 dark:text-indigo-400`} />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <h1 className={`text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight`}>
              2026년 7월 16일 목요일 장전 브리핑
            </h1>
            <p className={`text-sm text-indigo-600 dark:text-indigo-300/80 font-medium flex items-center gap-2`}>
              <Calendar className="w-4 h-4" />
              글로벌 매크로 분석 및 AI 투자 전략
            </p>
          </div>
          
        </div>
      </header>

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Section 1 */}
        <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors md:col-span-2`}>
          <h2 className={`text-sm font-black text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2`}>
            <Globe2 className="w-4 h-4" /> 1. 글로벌 거시경제 6대 지표 상세 분석
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <div className={`bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-bold block mb-1`}>미국 기준금리</span>
              <span className={`text-sm font-black text-slate-900 dark:text-slate-200 block`}>3.50%~3.75% <span className="text-[10px] text-slate-500 font-normal ml-1">(이전 3.50%~3.75%)</span></span>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-1 block leading-tight`}>연준 매파 발언. 방어주 유입 / 성장주 이탈</span>
            </div>
            <div className={`bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-bold block mb-1`}>CPI (6월 전년비)</span>
              <span className={`text-sm font-black text-slate-900 dark:text-slate-200 block`}>+3.5% <span className="text-[10px] text-slate-500 font-normal ml-1">(예측 3.4%)</span></span>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-1 block leading-tight`}>금리인하 기대 후퇴. 가치주 선방 / 기술주 타격</span>
            </div>
            <div className={`bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-bold block mb-1`}>PPI (6월 전년비)</span>
              <span className={`text-sm font-black text-slate-900 dark:text-slate-200 block`}>+5.5% <span className="text-[10px] text-slate-500 font-normal ml-1">(예측 5.3%)</span></span>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-1 block leading-tight`}>마진 축소 우려. 에너지 주도 / 소비재 이탈</span>
            </div>
            <div className={`bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-bold block mb-1`}>미 10년물 국채금리</span>
              <span className={`text-sm font-black text-rose-500 dark:text-rose-400 block`}>4.57% <span className="text-[10px] text-slate-500 font-normal ml-1">(전일 4.52%)</span></span>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-1 block leading-tight`}>밸류에이션 부담. 금융주 선호 / 반도체 이탈</span>
            </div>
            <div className={`bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-bold block mb-1`}>원달러환율</span>
              <span className={`text-sm font-black text-rose-500 dark:text-rose-400 block`}>1,488.50원 <span className="text-[10px] text-slate-500 font-normal ml-1">(전일 1,491원)</span></span>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-1 block leading-tight`}>신흥국 자금 이탈. 수출주 방어 / 내수주 급락</span>
            </div>
            <div className={`bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 font-bold block mb-1`}>WTI 국제유가</span>
              <span className={`text-sm font-black text-rose-500 dark:text-rose-400 block`}>$79.67 <span className="text-[10px] text-slate-500 font-normal ml-1">(전일 $78.20)</span></span>
              <span className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 mt-1 block leading-tight`}>인플레이션 재점화. 정유주 주도 / 항공주 이탈</span>
            </div>
          </div>
          <div className={`bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border-l-2 border-indigo-500`}>
            <p className={`text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium`}>
              환율이 1,487원대로 급등하며 외국인 자금 이탈 우려가 심화되었습니다. 국채금리 4.57% 상승과 맞물려 달러 강세가 신흥국 시장 전체에 강력한 하방 압력을 제공 중입니다. 성장주 중심의 이탈이 가속화되며 필수소비재 및 방어주 섹터로 수급이 몰리고 있습니다.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors`}>
          <h2 className={`text-sm font-black text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2`}>
            <TrendingDown className="w-4 h-4" /> 2. 미 증시 주요지수 마감
          </h2>
          <div className="space-y-3">
            <div className={`p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold text-slate-600 dark:text-slate-400`}>다우존스</span>
                <div className="text-right flex items-center gap-2">
                  <div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>41,200.12</div>
                  <div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-2.10% ▼</div>
                </div>
              </div>
              <p className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 leading-tight`}>전반적인 투자 심리 악화로 대부분의 대형주가 폭락하며 지수 급락 주도</p>
            </div>
            <div className={`p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold text-slate-600 dark:text-slate-400`}>나스닥</span>
                <div className="text-right flex items-center gap-2">
                  <div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>18,502.50</div>
                  <div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-5.80% ▼</div>
                </div>
              </div>
              <p className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 leading-tight`}>글로벌 반도체 규제 및 AI 캐즘 우려 확산으로 빅테크 중심 투매 물량 쏟아짐</p>
            </div>
            <div className={`p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800`}>
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-xs font-bold text-slate-600 dark:text-slate-400`}>S&P 500</span>
                <div className="text-right flex items-center gap-2">
                  <div className={`text-sm font-black text-blue-600 dark:text-blue-400`}>5,432.10</div>
                  <div className="text-xs font-bold text-blue-500 dark:text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">-3.50% ▼</div>
                </div>
              </div>
              <p className={`text-xs text-slate-500 dark:text-slate-500 dark:text-slate-500 leading-tight`}>전 섹터에 걸친 강력한 매도세가 출회되며 대규모 패닉셀 연출</p>
            </div>
            <p className={`text-xs text-slate-600 dark:text-slate-400 pt-2 leading-relaxed`}>
              나스닥 중심의 역사적인 폭락세. 미중 반도체 갈등 심화와 주요 기술 기업들의 실적 부진 우려가 겹치며 글로벌 증시에 블랙 먼데이급 공포가 덮쳤습니다.
            </p>
          </div>
        </section>

        {/* Section 4 */}
        <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors`}>
          <h2 className={`text-sm font-black text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2`}>
            <Cpu className="w-4 h-4" /> 4. 미국 특징주 및 주도주
          </h2>
          <div className="space-y-3">
            <div className={`p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1`}>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold text-slate-900 dark:text-slate-200`}>엔비디아 (NVDA)</span>
                <span className="text-xs font-black text-blue-500 dark:text-blue-400">$118.20 (-6.50%)</span>
              </div>
              <p className={`text-xs text-slate-600 dark:text-slate-400`}>초기 기대감을 꺾는 AI 캐즘(Chasm) 우려 및 규제 이슈로 기관 숏베팅 증가.</p>
            </div>
            <div className={`p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1`}>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold text-slate-900 dark:text-slate-200`}>테슬라 (TSLA)</span>
                <span className="text-xs font-black text-blue-500 dark:text-blue-400">$245.30 (-4.20%)</span>
              </div>
              <p className={`text-xs text-slate-600 dark:text-slate-400`}>전기차 수요 둔화 및 중국 내 가격 경쟁 심화로 수익성 방어 비상.</p>
            </div>
            <div className={`p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1`}>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-bold text-slate-900 dark:text-slate-200`}>애플 (AAPL)</span>
                <span className="text-xs font-black text-blue-500 dark:text-blue-400">$225.10 (-3.80%)</span>
              </div>
              <p className={`text-xs text-slate-600 dark:text-slate-400`}>서비스 부문 매출의 방어력으로 시장 하락 대비 상대적인 주가 방어선 구축.</p>
            </div>
          </div>
        </section>

        {/* Section 3 & 5 */}
        <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors md:col-span-2`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className={`text-sm font-black text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2`}>
                <Terminal className="w-4 h-4" /> 3. 5대 주요 외신 헤드라인
              </h2>
              <div className={`space-y-3 text-xs text-slate-700 dark:text-slate-300 font-medium`}>
                <div>
                  <strong>AI 수익성 의구심 증폭:</strong> 월가 인프라 투자 회수율 우려 보고서 줄이탈
                </div>
                <div>
                  <strong>TSMC 서프라이즈 한계:</strong> 어닝 비트에도 지정학적 갈등 리스크로 셀온(Sell-on)
                </div>
                <div>
                  <strong>중동/아시아 긴장:</strong> 글로벌 공급망 비용 상승 인플레이션 촉발 우려
                </div>
                <div>
                  <strong>금리 완화 시점 지연:</strong> 연준 주요 위원 매파적 발언 지속 국채 상방 압력
                </div>
                <div>
                  <strong>슈퍼 달러의 역습:</strong> 원/엔/위안화 약세로 신흥 시장 외국인 자본 유출 비상
                </div>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className={`text-sm font-black text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2`}>
                <CheckCircle2 className="w-4 h-4" /> 5. 핵심 브리핑 요약
              </h2>
              <div className={`flex-1 bg-slate-50 dark:bg-slate-950 rounded-xl p-4 border border-slate-200 dark:border-slate-800 flex items-center`}>
                <p className={`text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-bold break-keep`}>
                  전일 미국 증시가 글로벌 지정학적 갈등 격화 및 주요 빅테크 실적 우려로 패닉셀을 연출하며 폭락했습니다. 특히 반도체와 AI 관련주의 하락세가 뚜렷하며, 이는 오늘 국내 증시 개장 시 코스피와 코스닥의 갭하락 출발과 거센 투매를 예고하고 있습니다. 섣부른 저점 매수보다는 리스크 관리에 만전을 기해야 할 시점입니다.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6 & 7 */}
        <section className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-colors md:col-span-2`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className={`text-sm font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2`}>
                <TrendingDown className="w-4 h-4 text-rose-400" /> 6. 국내 시장 영향 및 섹터 전망
              </h2>
              <div className={`bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800`}>
                <p className={`text-xs text-slate-700 dark:text-slate-300 leading-relaxed`}>
                  <strong>반도체 집중 타격:</strong> 미 반도체 폭락 여파로 삼성전자, SK하이닉스 등 HBM 및 온디바이스 AI 관련주 전반에 외국인의 대규모 매도 폭탄이 예상됩니다. 갭하락 출발 시 투매에 동참하기보다는 1차 지지선 확인이 필수입니다.
                </p>
                <div className={`w-full h-px bg-slate-200 dark:bg-slate-200 dark:bg-slate-800 my-3`}></div>
                <p className={`text-xs text-slate-700 dark:text-slate-300 leading-relaxed`}>
                  <strong>수급 이동처:</strong> 하락장 헷지 테마인 원자재/에너지(S-Oil, 흥구석유, 중앙에너비스) 및 방어주 성격의 대형 제약/바이오(삼성바이오로직스, 셀트리온, 유한양행) 섹터로 수급 대피 현상 발생 확률 높음.
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-sm font-black text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> 7. 오늘의 핵심 위기/리스크 요소
              </h2>
              <div className={`bg-rose-50 dark:bg-rose-950/20 p-4 rounded-xl border border-rose-200 dark:border-rose-900/50`}>
                <ul className={`space-y-3 text-xs text-rose-700 dark:text-rose-200/90 font-medium`}>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5 font-bold">1.</span>
                    <span>글로벌 증시 패닉에 따른 외국인 자금의 전방위적 이탈 및 1,490원선 돌파 여부 주시</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5 font-bold">2.</span>
                    <span>AI 사이클 고점론 확산에 따른 개인 신용 융자 반대매매 연쇄 출회 리스크</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-rose-400 mt-0.5 font-bold">3.</span>
                    <span>지수 급락에 따른 개인 투자자 신용 반대매매 대규모 출회 가능성과 장중 변동성 확대</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
