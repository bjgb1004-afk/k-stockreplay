import { useEffect, useMemo, useState } from 'react';
import { Screen, Section } from './ui';
import { getWatchlist, type WatchlistItem } from '../lib/watchlistDb';

interface DividendEvent {
  ticker: string;
  companyName: string;
  exDividendDate: string;
  paymentDate: string;
  dividendPerShare: number;
  cycle: string;
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function ddayLabel(days: number): string {
  if (days === 0) return 'D-DAY';
  if (days < 0) return `D+${-days}`;
  return `D-${days}`;
}

export default function DividendScreen() {
  const [dividends, setDividends] = useState<DividendEvent[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/data/dividends.json')
      .then((res) => {
        if (!res.ok) throw new Error('failed to load dividends.json');
        return res.json();
      })
      .then(setDividends)
      .catch(() => setError(true));
    getWatchlist().then(setWatchlist);
  }, []);

  // 워치리스트가 멤버십 기준 (§2-3 로컬 우선) - 전체 배당 캘린더가 아니라
  // 내 관심종목의 배당 일정만 보여준다.
  const myDividends = useMemo(() => {
    const watchedTickers = new Set(watchlist.map((w) => w.ticker));
    return dividends
      .filter((d) => watchedTickers.has(d.ticker) && daysUntil(d.exDividendDate) >= 0)
      .sort((a, b) => a.exDividendDate.localeCompare(b.exDividendDate));
  }, [dividends, watchlist]);

  if (error) {
    return (
      <Screen>
        <p className="text-slate-400">배당 일정을 불러오지 못했습니다.</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-lg font-bold">DIVIDEND CALENDAR</h1>
        <p className="text-xs text-slate-500">관심종목의 배당락일 · 지급일</p>
      </header>

      <Section title="💰 다가오는 배당">
        {watchlist.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 관심종목이 없습니다. MY STOCK RADAR 탭에서 추가해보세요.
          </p>
        ) : myDividends.length === 0 ? (
          <p className="text-sm text-slate-500">관심종목 중 예정된 배당 일정이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {myDividends.map((d) => (
              <li key={d.ticker} className="bg-slate-900 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{d.companyName}</span>
                  <span className="text-xs font-mono text-emerald-400">{ddayLabel(daysUntil(d.exDividendDate))}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>배당락 {d.exDividendDate} · {d.cycle}</span>
                  <span>주당 {d.dividendPerShare.toLocaleString()}원</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Screen>
  );
}
