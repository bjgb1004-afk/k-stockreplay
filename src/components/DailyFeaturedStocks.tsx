import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, PackageCheck, Briefcase, FileCheck, Building2, BarChart4, Coins, Crown, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const DailyFeaturedStocks = () => {
  const [loading, setLoading] = useState(true);
  const [featuredData, setFeaturedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const kstTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const dateStr = kstTime.toISOString().split('T')[0];

  useEffect(() => {
    fetchFeaturedData();
  }, []);

  const fetchFeaturedData = async () => {
    try {
      setLoading(true);
      // Forcefully use 2026-07-16 data as requested
      setFeaturedData({
        date: "2026-07-16",
        high_52w: [],
        upper_limit: [
          { name: "모나리자", note: "코스피 상한가" },
          { name: "형지엘리트", note: "코스피 상한가" },
          { name: "비비안", note: "코스피 상한가" },
          { name: "에넥스", note: "코스피 상한가" },
          { name: "에이엔피", note: "코스피 상한가" },
          { name: "주연테크", note: "코스피 상한가" },
          { name: "삼익제약", note: "코스닥 상한가" },
          { name: "좋은사람들", note: "코스닥 상한가" },
          { name: "멤레이비티", note: "코스닥 상한가" },
          { name: "손오공", note: "코스닥 상한가" },
          { name: "PN풍년", note: "코스닥 상한가" },
          { name: "동일스틸럭스", note: "코스닥 상한가" },
          { name: "진영", note: "코스닥 상한가" },
          { name: "형지글로벌", note: "코스닥 상한가" },
          { name: "형지I&C", note: "코스닥 상한가" },
          { name: "엑시온그룹", note: "코스닥 상한가" },
          { name: "원풍물산", note: "코스닥 상한가" }
        ],
        lower_limit: [
          { name: "에스아이리소스", note: "코스닥 하한가" }
        ],
        supply_contracts: [],
        mna_stakes: [],
        tech_cert: [],
        policy_gov: [],
        earnings: [],
        capital: []
      });
      setError(null);
    } catch (err: any) {
      console.error('Failed to set featured stocks:', err);
      setError("데이터 준비중입니다. 장 마감 후 특징주 분석이 업데이트됩니다.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Loader2 className="w-8 h-8 text-amber-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">당일 특징주 데이터를 불러오는 중입니다...</p>
      </div>
    );
  }

  if (error || !featuredData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <Crown className="w-8 h-8 text-slate-400 dark:text-slate-500 mb-4" />
        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">{error || "데이터 준비중입니다. 장 마감 후 특징주 분석이 업데이트됩니다."}</p>
      </div>
    );
  }

  const fd = featuredData;

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden border border-slate-800 shadow-xl">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Crown className="w-32 h-32 text-amber-400" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-amber-500/20 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider">
              TODAY'S FEATURED STOCKS
            </span>
            <span className="text-slate-400 text-xs font-mono flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" /> {fd?.date || dateStr}
            </span>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            당일 특징주 팩트체크
          </h2>
          <p className="text-slate-400 text-xs font-medium">
            52주 신고가, 상/하한가, 주요 공시 및 테마별 특징주 총정리
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. 52주 신고가 & 상하한가 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <TrendingUp className="w-4 h-4 text-rose-500" />
            시장 핵심 지표 종목
          </h3>
          
          {/* 52주 신고가 */}
          <div className="bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-1.5 mb-2">
              <Crown className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">52주 신고가 경신</span>
            </div>
            <div className="space-y-1.5">
              {fd?.high_52w?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between items-center bg-white dark:bg-slate-900 px-2 py-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.name}</span>
                  <span className="text-[10px] text-slate-500">{item.note}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* 상한가 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowUpRight className="w-4 h-4 text-rose-500" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">당일 상한가</span>
              </div>
              <ul className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                {fd?.upper_limit?.map((item: any, i: number) => (
                  <li key={i} className="flex gap-1"><CheckCircle2 className="w-3 h-3 text-rose-400 shrink-0" /> <strong>{item.name}:</strong> <span className="truncate">{item.note}</span></li>
                ))}
              </ul>
            </div>
            {/* 하한가 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <div className="flex items-center gap-1.5 mb-2">
                <ArrowDownRight className="w-4 h-4 text-blue-500" />
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">당일 하한가</span>
              </div>
              <ul className="space-y-1 text-[10px] text-slate-600 dark:text-slate-400">
                {fd?.lower_limit?.map((item: any, i: number) => (
                  <li key={i} className="flex gap-1"><AlertCircle className="w-3 h-3 text-blue-400 shrink-0" /> <strong>{item.name}:</strong> <span className="truncate">{item.note}</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* 2. 공급/계약 & M&A */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <PackageCheck className="w-4 h-4 text-emerald-500" />
            수주 및 사업 확장
          </h3>

          <div className="space-y-3">
            {/* 공급/계약 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">공급/계약 (수주, 턴키, 독점)</span>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight space-y-1">
                {fd?.supply_contracts?.map((item: any, i: number) => (
                  <div key={i}><strong className="text-slate-800 dark:text-slate-200">{item.name}:</strong> {item.note}</div>
                ))}
              </div>
            </div>
            
            {/* M&A/지분 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400 block mb-1">M&A/지분 (인수합병, 경영권 분쟁)</span>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight space-y-1">
                {fd?.mna_stakes?.map((item: any, i: number) => (
                  <div key={i}><strong className="text-slate-800 dark:text-slate-200">{item.name}:</strong> {item.note}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3. 기술/인증 & 정책 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <FileCheck className="w-4 h-4 text-indigo-500" />
            모멘텀 & 정책 수혜
          </h3>

          <div className="space-y-3">
            {/* 기술/인증 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 block mb-1">기술/인증 (FDA, 특허, 세계최초)</span>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight space-y-1">
                {fd?.tech_cert?.map((item: any, i: number) => (
                  <div key={i}><strong className="text-slate-800 dark:text-slate-200">{item.name}:</strong> {item.note}</div>
                ))}
              </div>
            </div>
            
            {/* 정책/정부 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 block mb-1">정책/정부 (수혜, 국책과제, 법안)</span>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight space-y-1">
                {fd?.policy_gov?.map((item: any, i: number) => (
                  <div key={i}><strong className="text-slate-800 dark:text-slate-200">{item.name}:</strong> {item.note}</div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 4. 실적 & 자본 */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
            <BarChart4 className="w-4 h-4 text-amber-500" />
            실적발표 & 주주환원
          </h3>

          <div className="space-y-3">
            {/* 실적발표 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 block mb-1">실적발표 (어닝서프라이즈, 흑자전환)</span>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight space-y-1">
                {fd?.earnings?.map((item: any, i: number) => (
                  <div key={i}><strong className="text-slate-800 dark:text-slate-200">{item.name}:</strong> {item.note}</div>
                ))}
              </div>
            </div>
            
            {/* 자본 */}
            <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
              <span className="text-[11px] font-bold text-pink-600 dark:text-pink-400 block mb-1">자본 (무상증자, 자사주 매입/소각)</span>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-tight space-y-1">
                {fd?.capital?.map((item: any, i: number) => (
                  <div key={i}><strong className="text-slate-800 dark:text-slate-200">{item.name}:</strong> {item.note}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};
