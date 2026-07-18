import React from 'react';
import { Clock, Zap, TrendingUp, BookOpen } from 'lucide-react';
import { PreMarketBriefing, AfterMarketReport } from '../types';
import { BriefingView } from './BriefingView';
import { ReportView } from './ReportView';

interface NewsViewProps {
  briefing: PreMarketBriefing | null;
  briefingLoading: boolean;
  report: AfterMarketReport | null;
  reportLoading: boolean;
  onSelectStock: (code: string) => void;
  onOpenAiFeed: (tab: 'morning' | 'lunch' | 'afternoon' | 'evening') => void;
  
  // Custom props passed for fully self-contained sub-tabs inside NewsView
  lunchBriefing?: any | null;
  lunchLoading?: boolean;
  eveningColumn?: any | null;
  eveningLoading?: boolean;
}

export const NewsView: React.FC<NewsViewProps> = ({
  briefing,
  briefingLoading,
  report,
  reportLoading,
  onSelectStock,
  lunchBriefing,
  lunchLoading = false,
  eveningColumn,
  eveningLoading = false
}) => {
  return (
    <div className="col-span-12 space-y-8" id="news-view-container">
      {/* Morning Tab Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">07:50 장전 브리핑</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold font-mono">MORNING GLOBAL MARKET BRIEFING</p>
          </div>
        </div>
        <BriefingView
          briefing={briefing}
          loading={briefingLoading}
          isCompact={false}
        />
      </div>

      {/* Lunch Tab Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">12:30 장중 실시간 수급 및 동향 분석</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold font-mono">LIVE MID-DAY MARKET REPORT</p>
          </div>
        </div>
        
        {lunchLoading ? (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">실시간 장중 수급을 분석하여 칼럼을 작성하고 있습니다...</p>
          </div>
        ) : lunchBriefing ? (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="bg-sky-500/5 border border-sky-500/10 p-5 rounded-xl space-y-3">
              <h4 className="text-sm font-black text-sky-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                📢 {lunchBriefing.title || '오전장 거래대금 폭발 및 수급 진단'}
              </h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                {lunchBriefing.midDayAnalysis || '장중 실시간 수급 칼럼 분석 데이터가 준비되지 않았습니다.'}
              </p>
            </div>

            {lunchBriefing.tags && Array.isArray(lunchBriefing.tags) && (
              <div className="flex flex-wrap gap-1.5">
                {lunchBriefing.tags.map((tag: string, index: number) => (
                  <span key={index} className="px-2 py-0.5 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center py-16 text-slate-500 dark:text-slate-500 text-xs font-mono">
            데이터를 불러오는 중입니다...
          </div>
        )}
      </div>

      {/* Afternoon Tab Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">16:00 장마감 브리핑</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold font-mono">AFTER-MARKET CLOSING REPORT</p>
          </div>
        </div>
        <ReportView
          report={report}
          loading={reportLoading}
          onSelectStock={onSelectStock}
          isCompact={false}
        />
      </div>

      {/* Evening Tab Content */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">20:00 저녁 금융 칼럼 및 메가트렌드 해설</h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold font-mono">EVENING METATREND FINANCIAL COLUMN</p>
          </div>
        </div>

        {eveningLoading ? (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">저녁 에세이 금융 칼럼 데이터를 로딩하고 있습니다...</p>
          </div>
        ) : eveningColumn ? (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 md:p-6 space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-xl space-y-3">
              <h4 className="text-sm font-black text-indigo-400 border-b border-slate-200 dark:border-slate-800 pb-2">
                {eveningColumn.title || '저녁 금융 칼럼'}
              </h4>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                {eveningColumn.columnContentMarkdown || '저녁 금융 칼럼 데이터가 존재하지 않습니다.'}
              </p>
            </div>

            {eveningColumn.threadsText && (
              <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-850 p-4 rounded-xl space-y-2">
                <h5 className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest font-mono">15년차 전업투자자의 심야 SNS 관점</h5>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono leading-relaxed italic whitespace-pre-wrap">
                  "{eveningColumn.threadsText}"
                </p>
              </div>
            )}

            {eveningColumn.tags && Array.isArray(eveningColumn.tags) && (
              <div className="flex flex-wrap gap-1.5">
                {eveningColumn.tags.map((tag: string, index: number) => (
                  <span key={index} className="px-2 py-0.5 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 text-[10px] font-bold rounded">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center py-16 text-slate-500 dark:text-slate-500 text-xs font-mono">
            데이터를 불러오는 중입니다...
          </div>
        )}
      </div>
    </div>
  );
};
