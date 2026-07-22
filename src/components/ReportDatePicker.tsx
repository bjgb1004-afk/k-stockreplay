import React, { useEffect, useState, useMemo } from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';

interface ReportDatePickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const getTodayKSTString = () => {
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const kst = new Date(utc + (3600000 * 9));
  const year = kst.getFullYear();
  const month = String(kst.getMonth() + 1).padStart(2, '0');
  const day = String(kst.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const ReportDatePicker: React.FC<ReportDatePickerProps> = ({ selectedDate, onSelectDate }) => {
  const [reports, setReports] = useState<string[]>([]);

  // Fetch report list from database to determine which dates have saved reports
  useEffect(() => {
    const loadReports = () => {
      fetch('/api/platform/reports', { cache: 'no-store' })
        .then(r => {
          if (!r.ok || !r.headers.get('content-type')?.includes('application/json')) {
            console.warn('[API Warning] Response is not JSON or not OK in loadReports. Status:', r.status);
            return [];
          }
          return r.json();
        })
        .then(data => {
          if (Array.isArray(data)) {
            // Filter out future dates dynamically (KST offset friendly)
            const todayStr = getTodayKSTString();
            const dates = data
              .map((d: any) => d.date)
              .filter((d: string) => d <= todayStr)
              .sort();
            setReports(dates);
            
            // If nothing is selected, auto-select the latest available date
            if (!selectedDate && dates.length > 0) {
              onSelectDate(dates[dates.length - 1]); // Select the latest saved date
            }
          }
        })
        .catch(console.error);
    };

    loadReports();
    // Refresh every 3 seconds so that newly saved reports instantly pop up!
    const interval = setInterval(loadReports, 3000);
    return () => clearInterval(interval);
  }, [selectedDate, onSelectDate]);

  const [year, setYear] = useState<number>(() => {
    if (selectedDate) return parseInt(selectedDate.split('-')[0]);
    return 2026; // Default to 2026
  });
  
  const [month, setMonth] = useState<number>(() => {
    if (selectedDate) return parseInt(selectedDate.split('-')[1]);
    return 7; // Default to July
  });

  // Keep year and month in sync if selectedDate changes from parent
  useEffect(() => {
    if (selectedDate) {
      const parts = selectedDate.split('-');
      if (parts.length >= 2) {
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        if (!isNaN(y) && y !== year) setYear(y);
        if (!isNaN(m) && m !== month) setMonth(m);
      }
    }
  }, [selectedDate]);

  // Dynamically extract years that actually have saved reports (and are not in the future)
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    if (reports.length === 0) {
      yearsSet.add(2026);
    } else {
      reports.forEach(d => {
        const y = parseInt(d.split('-')[0]);
        yearsSet.add(y);
      });
    }
    // Always include the current year just in case
    yearsSet.add(year);
    return Array.from(yearsSet).sort((a, b) => b - a); // Descending (latest first)
  }, [reports, year]);

  // Dynamically extract months for the selected year that actually have saved reports
  const availableMonths = useMemo(() => {
    const monthsSet = new Set<number>();
    if (reports.length > 0) {
      reports.forEach(d => {
        const parts = d.split('-');
        const y = parseInt(parts[0]);
        const m = parseInt(parts[1]);
        if (y === year) {
          monthsSet.add(m);
        }
      });
    }
    // Only if reports is completely empty, fallback to current month to prevent empty dropdown
    if (monthsSet.size === 0) {
      monthsSet.add(month);
    }
    return Array.from(monthsSet).sort((a, b) => a - b);
  }, [reports, year, month]);

  // Compute days of the selected year & month
  const daysArray = useMemo(() => {
    const totalDays = new Date(year, month, 0).getDate();
    const list = [];
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    for (let d = 1; d <= totalDays; d++) {
      const dateObj = new Date(year, month - 1, d);
      const dayOfWeekVal = dateObj.getDay();
      const dayOfWeek = daysOfWeek[dayOfWeekVal];
      const isWeekend = dayOfWeekVal === 0 || dayOfWeekVal === 6;
      
      const mm = String(month).padStart(2, '0');
      const dd = String(d).padStart(2, '0');
      const dateStr = `${year}-${mm}-${dd}`;
      list.push({
        day: d,
        dateStr,
        dayOfWeek,
        isWeekend
      });
    }
    return list;
  }, [year, month]);

  // Filtered days: No weekends, must be in the database (saved), and not in the future (<= today KST)
  const filteredDaysArray = useMemo(() => {
    const todayStr = getTodayKSTString();
    let list = daysArray;

    // 1. Exclude weekends
    list = list.filter(d => !d.isWeekend);

    // 2. Exclude future dates
    list = list.filter(d => d.dateStr <= todayStr);

    // 3. Only show dates that exist in reports (database-confirmed saved reports)
    if (reports.length > 0) {
      list = list.filter(d => reports.includes(d.dateStr));
    }

    // 4. Assign sequential index (1, 2, 3...)
    return list.map((item, idx) => ({
      ...item,
      seqIndex: idx + 1
    }));
  }, [daysArray, reports]);

  // Auto-select first available date in current year/month if selection gets invalidated
  useEffect(() => {
    if (filteredDaysArray.length > 0) {
      const isStillAvailable = filteredDaysArray.some(d => d.dateStr === selectedDate);
      if (!isStillAvailable) {
        onSelectDate(filteredDaysArray[0].dateStr);
      }
    }
  }, [filteredDaysArray, selectedDate, onSelectDate]);

  const handleYearChange = (newYear: number) => {
    setYear(newYear);
  };

  const handleMonthChange = (newMonth: number) => {
    setMonth(newMonth);
  };

  const handleDayChange = (newDateStr: string) => {
    onSelectDate(newDateStr);
  };

  return (
    <div 
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-1.5 px-3 shadow-sm inline-flex w-full sm:w-auto items-center gap-2.5 max-w-full overflow-x-auto" 
      id="report-date-picker-container"
    >
      {/* Compact Title Section */}
      <div className="flex items-center gap-1.5 shrink-0 select-none">
        <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
        <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">
          분석 일자
        </span>
        {reports.length > 0 && (
          <span className="text-[10px] font-semibold text-indigo-500/80 dark:text-indigo-400/80 bg-indigo-500/5 dark:bg-indigo-500/10 px-1 py-0.2 rounded">
            {reports.length}
          </span>
        )}
      </div>

      {/* Tiny vertical divider */}
      <div className="h-3.5 w-[1px] bg-slate-200 dark:bg-slate-800 shrink-0 hidden sm:block" />

      {/* Highly compact inline select controls */}
      <div className="flex items-center gap-1.5 grow sm:grow-0">
        {/* Year Select */}
        <div className="relative shrink-0">
          <select
            value={year}
            onChange={(e) => handleYearChange(parseInt(e.target.value))}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[10.5px] rounded-lg pl-1.5 pr-5 py-0.5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer appearance-none shadow-sm h-7"
          >
            {availableYears.map(y => (
              <option key={y} value={y}>{y}년</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-400 dark:text-slate-550">
            <svg className="fill-current h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        {/* Month Select */}
        <div className="relative shrink-0">
          <select
            value={month}
            onChange={(e) => handleMonthChange(parseInt(e.target.value))}
            className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[10.5px] rounded-lg pl-1.5 pr-5 py-0.5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer appearance-none shadow-sm h-7"
          >
            {availableMonths.map(m => (
              <option key={m} value={m}>{m}월</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-400 dark:text-slate-550">
            <svg className="fill-current h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>

        {/* Day Select (Confirmed saved weekday reports only!) */}
        <div className="relative min-w-[110px] grow sm:grow-0">
          <select
            value={selectedDate || ''}
            onChange={(e) => handleDayChange(e.target.value)}
            disabled={filteredDaysArray.length === 0}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 text-[10.5px] rounded-lg pl-1.5 pr-5 py-0.5 font-bold text-slate-800 dark:text-slate-200 outline-none focus:border-indigo-500 cursor-pointer appearance-none disabled:opacity-60 disabled:cursor-not-allowed shadow-sm h-7"
          >
            {filteredDaysArray.length > 0 ? (
              filteredDaysArray.map(({ dateStr, day, dayOfWeek, seqIndex }) => (
                <option key={dateStr} value={dateStr}>
                  {seqIndex}회차 - {day}일 ({dayOfWeek})
                </option>
              ))
            ) : (
              <option value="">
                저장된 리포트 없음
              </option>
            )}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-400 dark:text-slate-550">
            <svg className="fill-current h-2.5 w-2.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};
