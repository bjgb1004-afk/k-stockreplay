import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, Zap, Sparkles, TrendingUp, BookOpen } from 'lucide-react';
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

type NewsTab = 'morning' | 'lunch' | 'afternoon' | 'evening';

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
  const [activeTab, setActiveTab] = useState<NewsTab>('morning');

  const tabs = [
    { id: 'morning' as NewsTab, label: '장전 브리핑', time: '07:50', icon: Clock, color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
    { id: 'lunch' as NewsTab, label: '장중 실시간 수급', time: '12:30', icon: TrendingUp, color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
    { id: 'afternoon' as NewsTab, label: '장마감 브리핑', time: '16:00', icon: Zap, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
    { id: 'evening' as NewsTab, label: '저녁 금융 칼럼', time: '20:00', icon: BookOpen, color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' }
  ];

  return (
    <div className="col-span-12 space-y-5" id="news-view-container">
      {/* 4 News Time-based Sub-Tabs Navigation */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex flex-col md:flex-row md:items-center justify-between gap-3 select-none" id="news-subtabs-nav">
        <div className="flex items-center gap-2 px-2 py-1">
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span className="text-xs font-black text-slate-300">시간대별 AI 뉴스 브리핑</span>
        </div>
        <div className="grid grid-cols-2 md:flex items-center gap-1.5 flex-1 md:flex-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-slate-800 border-slate-700 text-slate-100 shadow-md'
                    : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
                id={`news-subtab-${tab.id}`}
              >
                <div className={`p-1 rounded-md border ${tab.color} flex items-center justify-center`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="text-left leading-none">
                  <div className="text-[10px] font-black">{tab.label}</div>
                  <div className="text-[8px] font-mono text-slate-500 mt-0.5">{tab.time}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Tab View Contents */}
      <div className="min-h-[450px]" id="news-content-display">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
            className="space-y-4"
          >
            {/* Morning Tab */}
            {activeTab === 'morning' && (
              <BriefingView
                briefing={briefing}
                loading={briefingLoading}
                isCompact={false}
              />
            )}

            {/* Lunch Tab */}
            {activeTab === 'lunch' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-100">12:30 장중 실시간 수급 및 동향 분석</h3>
                      <p className="text-[10px] text-slate-500 font-bold font-mono">LIVE MID-DAY MARKET REPORT</p>
                    </div>
                  </div>
                </div>

                {lunchLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <div className="w-8 h-8 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
                    <p className="text-[10px] text-slate-400 font-mono">실시간 장중 수급을 분석하여 칼럼을 작성하고 있습니다...</p>
                  </div>
                ) : lunchBriefing ? (
                  <div className="space-y-5 text-xs text-slate-300 leading-relaxed">
                    <div className="bg-sky-500/5 border border-sky-500/10 p-5 rounded-xl space-y-3">
                      <h4 className="text-sm font-black text-sky-400 border-b border-slate-800 pb-2">
                        📢 {lunchBriefing.title || '오전장 거래대금 폭발 및 수급 진단'}
                      </h4>
                      <p className="text-[11px] text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                        {lunchBriefing.midDayAnalysis || '장중 실시간 수급 칼럼 분석 데이터가 준비되지 않았습니다.'}
                      </p>
                    </div>

                    {lunchBriefing.tags && Array.isArray(lunchBriefing.tags) && (
                      <div className="flex flex-wrap gap-1.5">
                        {lunchBriefing.tags.map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-bold rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs font-mono">
                    데이터를 불러오는 중입니다...
                  </div>
                )}
              </div>
            )}

            {/* Afternoon Tab */}
            {activeTab === 'afternoon' && (
              <ReportView
                report={report}
                loading={reportLoading}
                onSelectStock={onSelectStock}
                isCompact={false}
              />
            )}

            {/* Evening Tab */}
            {activeTab === 'evening' && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-100">20:00 저녁 금융 칼럼 및 메가트렌드 해설</h3>
                      <p className="text-[10px] text-slate-500 font-bold font-mono">EVENING METATREND FINANCIAL COLUMN</p>
                    </div>
                  </div>
                </div>

                {eveningLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 space-y-3">
                    <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                    <p className="text-[10px] text-slate-400 font-mono">저녁 에세이 금융 칼럼 데이터를 로딩하고 있습니다...</p>
                  </div>
                ) : eveningColumn ? (
                  <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                    <div className="bg-indigo-500/5 border border-indigo-500/10 p-5 rounded-xl space-y-3">
                      <h4 className="text-sm font-black text-indigo-400 border-b border-slate-800 pb-2">
                        {eveningColumn.title || '저녁 금융 칼럼'}
                      </h4>
                      <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap font-sans">
                        {eveningColumn.columnContentMarkdown || '저녁 금융 칼럼 데이터가 존재하지 않습니다.'}
                      </p>
                    </div>

                    {eveningColumn.threadsText && (
                      <div className="bg-slate-950/60 border border-slate-850 p-4 rounded-xl space-y-2">
                        <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono">15년차 전업투자자의 심야 SNS 관점</h5>
                        <p className="text-[11px] text-slate-400 font-mono leading-relaxed italic whitespace-pre-wrap">
                          "{eveningColumn.threadsText}"
                        </p>
                      </div>
                    )}

                    {eveningColumn.tags && Array.isArray(eveningColumn.tags) && (
                      <div className="flex flex-wrap gap-1.5">
                        {eveningColumn.tags.map((tag: string, index: number) => (
                          <span key={index} className="px-2 py-0.5 bg-slate-950 text-slate-400 border border-slate-800 text-[10px] font-bold rounded">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-16 text-slate-500 text-xs font-mono">
                    데이터를 불러오는 중입니다...
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
