import { useEffect, useMemo, useState } from 'react';
import { Screen, Section } from './ui';
import { getWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { daysUntil, ddayLabel } from '../lib/date';

type EventType = 'EARNINGS' | 'SHAREHOLDER_MEETING';

interface InvestmentEvent {
  ticker: string;
  companyName: string;
  eventDate: string;
  type: EventType;
  title: string;
}

const eventTypeIcon: Record<EventType, string> = {
  EARNINGS: '📊',
  SHAREHOLDER_MEETING: '🏛️',
};

export default function EventCalendarScreen() {
  const [events, setEvents] = useState<InvestmentEvent[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/data/events.json')
      .then((res) => {
        if (!res.ok) throw new Error('failed to load events.json');
        return res.json();
      })
      .then(setEvents)
      .catch(() => setError(true));
    getWatchlist().then(setWatchlist);
  }, []);

  // TODAY/DIVIDEND과 같은 패턴: 워치리스트가 멤버십 기준, 서버는 유저별 관심종목을 모른다.
  const myEvents = useMemo(() => {
    const watchedTickers = new Set(watchlist.map((w) => w.ticker));
    return events
      .filter((e) => watchedTickers.has(e.ticker) && daysUntil(e.eventDate) >= 0)
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  }, [events, watchlist]);

  if (error) {
    return (
      <Screen>
        <p className="text-slate-400">투자 일정을 불러오지 못했습니다.</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-lg font-bold">INVESTMENT EVENT CALENDAR</h1>
        <p className="text-xs text-slate-500">관심종목의 실적발표 · 주주총회 일정</p>
      </header>

      <Section title="📅 다가오는 일정">
        {watchlist.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 관심종목이 없습니다. MY STOCK RADAR 탭에서 추가해보세요.
          </p>
        ) : myEvents.length === 0 ? (
          <p className="text-sm text-slate-500">관심종목 중 예정된 투자 일정이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {myEvents.map((e, i) => (
              <li key={`${e.ticker}-${e.eventDate}-${i}`} className="bg-slate-900 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">
                    {eventTypeIcon[e.type]} {e.companyName}
                  </span>
                  <span className="text-xs font-mono text-emerald-400">{ddayLabel(daysUntil(e.eventDate))}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 mt-1">
                  <span>{e.title}</span>
                  <span>{e.eventDate}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Screen>
  );
}
