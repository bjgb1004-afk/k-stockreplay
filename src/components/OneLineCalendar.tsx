import React, { useEffect, useState } from 'react';

export const OneLineCalendar = ({ selectedDate, onSelectDate }) => {
  const [reports, setReports] = useState([]);
  useEffect(() => {
    fetch('/api/platform/reports').then(r => r.json()).then(data => {
      if(Array.isArray(data)) setReports(data.map(d => d.date));
    });
  }, []);

  // Generate days for July 2026
  const days = Array.from({ length: 31 }, (_, i) => {
    const day = i + 1;
    const dateStr = `2026-07-${day.toString().padStart(2, '0')}`;
    const dayOfWeek = new Date(2026, 6, day).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    return { day, dateStr, isWeekend };
  });

  return (
    <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 mb-4">
      {days.map(d => {
        const isSelected = selectedDate === d.dateStr;
        const hasReport = reports.includes(d.dateStr);
        return (
          <button
            key={d.dateStr}
            onClick={() => !d.isWeekend && onSelectDate(d.dateStr)}
            disabled={d.isWeekend}
            className={`min-w-[48px] h-[54px] flex flex-col items-center justify-center rounded-xl border transition-all shrink-0 ${
              d.isWeekend ? 'opacity-40 cursor-not-allowed bg-slate-100/50 dark:bg-slate-900/50 border-transparent' :
              isSelected ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' :
              hasReport ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20' :
              'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-400'
            }`}
          >
            <span className="text-[10px] font-bold opacity-70 mb-0.5">{['일','월','화','수','목','금','토'][new Date(2026, 6, d.day).getDay()]}</span>
            <span className={`text-sm font-black ${isSelected ? 'text-white' : ''}`}>{d.day}</span>
            {hasReport && !isSelected && <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />}
          </button>
        );
      })}
    </div>
  );
};
