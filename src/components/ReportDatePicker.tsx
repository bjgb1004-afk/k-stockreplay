import React, { useEffect, useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface ReportDatePickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export const ReportDatePicker: React.FC<ReportDatePickerProps> = ({ selectedDate, onSelectDate }) => {
  const [reports, setReports] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/platform/reports')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Sort descending
          const dates = data.map(d => d.date).sort((a, b) => b.localeCompare(a));
          setReports(dates);
          
          if (!selectedDate && dates.length > 0) {
            onSelectDate(dates[0]);
          }
        }
      })
      .catch(console.error);
  }, []);

  const availableMonths = useMemo(() => {
    const months = new Set(reports.map(r => r.substring(0, 7))); // "YYYY-MM"
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [reports]);

  const [selectedMonth, setSelectedMonth] = useState<string>('');

  useEffect(() => {
    if (selectedDate) {
      const m = selectedDate.substring(0, 7);
      if (m !== selectedMonth) setSelectedMonth(m);
    } else if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [selectedDate, availableMonths]);

  const availableDays = useMemo(() => {
    if (!selectedMonth) return [];
    return reports.filter(r => r.startsWith(selectedMonth)).sort((a, b) => b.localeCompare(a));
  }, [selectedMonth, reports]);

  if (reports.length === 0) {
    return (
      <div className="flex items-center gap-2 mb-4 p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-sm text-slate-500">
        <Calendar className="w-4 h-4" />
        <span>저장된 리포트가 없습니다.</span>
      </div>
    );
  }

  const formatMonth = (m: string) => {
    const [y, mo] = m.split('-');
    return `${y}년 ${parseInt(mo)}월`;
  };

  const formatDay = (d: string) => {
    const dayStr = d.split('-')[2];
    const dateObj = new Date(d);
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][dateObj.getDay()];
    return `${parseInt(dayStr)}일 (${dayOfWeek})`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-2 mb-4 bg-white dark:bg-slate-950 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-2 w-full sm:w-auto px-2">
        <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">분석 일자 선택:</span>
      </div>
      
      <div className="flex flex-1 items-center gap-2 w-full">
        {/* Month Selector */}
        <div className="relative flex-1 sm:flex-none sm:w-[140px]">
          <select
            value={selectedMonth}
            onChange={(e) => {
              const newMonth = e.target.value;
              setSelectedMonth(newMonth);
              const daysInMonth = reports.filter(r => r.startsWith(newMonth)).sort((a, b) => b.localeCompare(a));
              if (daysInMonth.length > 0) {
                onSelectDate(daysInMonth[0]);
              }
            }}
            className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{formatMonth(m)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Day Selector */}
        <div className="relative flex-1 sm:flex-none sm:w-[140px]">
          <select
            value={selectedDate || ''}
            onChange={(e) => onSelectDate(e.target.value)}
            className="w-full h-10 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500/50 appearance-none cursor-pointer"
          >
            {availableDays.map(d => (
              <option key={d} value={d}>{formatDay(d)}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>
      </div>
    </div>
  );
};
