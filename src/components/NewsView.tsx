import React from 'react';
import { motion } from 'motion/react';
import { Clock, Zap, Sparkles } from 'lucide-react';
import { BriefingView } from './BriefingView';
import { ReportView } from './ReportView';
import { PreMarketBriefing, AfterMarketReport } from '../types';

interface NewsViewProps {
  briefing: PreMarketBriefing | null;
  onRegenerateBriefing: () => void;
  briefingLoading: boolean;
  report: AfterMarketReport | null;
  onRegenerateReport: () => void;
  reportLoading: boolean;
  onSelectStock: (code: string) => void;
}

export const NewsView: React.FC<NewsViewProps> = ({
  briefing,
  onRegenerateBriefing,
  briefingLoading,
  report,
  onRegenerateReport,
  reportLoading,
  onSelectStock
}) => {
  return (
    <div className="col-span-12 space-y-6">
      {/* Main Grid: 50/50 Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Side: 07:50 장전 브리핑 */}
        <div id="news-briefing-col" className="space-y-4 bg-slate-950/20 p-1 rounded-2xl border border-slate-900 scroll-mt-20">
          <div className="px-3 pt-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-black text-amber-400 whitespace-nowrap">
              <Clock className="w-4 h-4" />
              <span>[07:50] 장전지표 및 글로벌 브리핑</span>
            </span>
          </div>
          <BriefingView
            briefing={briefing}
            onRegenerate={onRegenerateBriefing}
            loading={briefingLoading}
            isCompact={true}
          />
        </div>

        {/* Right Side: 16:00 장마감 브리핑 */}
        <div id="news-report-col" className="space-y-4 bg-slate-950/20 p-1 rounded-2xl border border-slate-900 scroll-mt-20">
          <div className="px-3 pt-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-black text-blue-400 whitespace-nowrap">
              <Zap className="w-4 h-4" />
              <span>[16:00] 장마감 국내 특징주 및 시장 복기</span>
            </span>
          </div>
          <ReportView
            report={report}
            onRegenerate={onRegenerateReport}
            loading={reportLoading}
            onSelectStock={onSelectStock}
            isCompact={true}
          />
        </div>

      </div>
    </div>
  );
};
