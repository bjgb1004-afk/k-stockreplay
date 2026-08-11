import { useEffect, useMemo, useState } from 'react';
import { Screen, Section } from './ui';
import { getWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { getReadIds, markRead } from '../lib/alertsDb';

type EventType = 'DISCLOSURE' | 'CONTRACT' | 'DIVIDEND' | 'MANAGEMENT_CHANGE';

interface TodayEntry {
  id: string;
  ticker: string;
  companyName: string;
  type: EventType;
  title: string;
}

interface HistoryEntry {
  ticker: string;
  date: string;
  type: EventType;
  title: string;
}

interface AlertItem {
  id: string;
  ticker: string;
  companyName: string;
  date: string;
  type: EventType;
  title: string;
}

const typeLabel: Record<EventType, string> = {
  DISCLOSURE: '공시',
  CONTRACT: '계약',
  DIVIDEND: '배당',
  MANAGEMENT_CHANGE: '임원변경',
};

export default function AlertScreen() {
  const [todayDate, setTodayDate] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<TodayEntry[]>([]);
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch('/data/today.json')
      .then((r) => r.json())
      .then((data) => {
        setTodayDate(data.date);
        setTodayEntries(data.newToday ?? []);
      })
      .catch(() => {});
    fetch('/data/history.json').then((r) => r.json()).then(setHistoryEntries).catch(() => {});
    getWatchlist().then(setWatchlist);
    getReadIds().then(setReadIds);
  }, []);

  // 서버는 유저별 워치리스트를 모른다 (§2-3) - 워치리스트가 알림 대상의 기준.
  // today.json과 history.json 둘 다 오늘 날짜 항목을 가질 수 있어서, 내용 기반
  // id(ticker_date_title)로 합쳐서 자연스럽게 중복 제거한다.
  const alerts = useMemo(() => {
    const watchedByTicker = new Map<string, string>(watchlist.map((w) => [w.ticker, w.companyName]));
    const merged = new Map<string, AlertItem>();

    for (const e of todayEntries) {
      if (!watchedByTicker.has(e.ticker) || !todayDate) continue;
      const id = `${e.ticker}_${todayDate}_${e.title}`;
      merged.set(id, { id, ticker: e.ticker, companyName: watchedByTicker.get(e.ticker)!, date: todayDate, type: e.type, title: e.title });
    }
    for (const h of historyEntries) {
      if (!watchedByTicker.has(h.ticker)) continue;
      const id = `${h.ticker}_${h.date}_${h.title}`;
      if (merged.has(id)) continue;
      merged.set(id, { id, ticker: h.ticker, companyName: watchedByTicker.get(h.ticker)!, date: h.date, type: h.type, title: h.title });
    }

    return [...merged.values()].sort((a, b) => b.date.localeCompare(a.date));
  }, [todayEntries, historyEntries, watchlist, todayDate]);

  const unreadCount = alerts.filter((a) => !readIds.has(a.id)).length;

  async function handleOpen(alert: AlertItem) {
    if (readIds.has(alert.id)) return;
    await markRead(alert.id);
    setReadIds((prev) => new Set(prev).add(alert.id));
  }

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-lg font-bold">ALERT</h1>
        <p className="text-xs text-slate-500">
          관심종목 알림함{unreadCount > 0 ? ` · 안 읽음 ${unreadCount}건` : ''}
        </p>
      </header>

      <Section title="🔔 알림">
        {watchlist.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 관심종목이 없습니다. MY STOCK RADAR 탭에서 추가해보세요.
          </p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-slate-500">관심종목에 대한 알림이 아직 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => {
              const isRead = readIds.has(a.id);
              return (
                <li key={a.id}>
                  <button
                    onClick={() => handleOpen(a)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 ${isRead ? 'bg-slate-900/50' : 'bg-slate-900'}`}
                  >
                    <div className="flex items-center gap-2 text-sm">
                      {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                      <span className={`font-medium ${isRead ? 'text-slate-400' : 'text-slate-100'}`}>{a.companyName}</span>
                      <span className="text-xs bg-slate-800 text-slate-400 rounded px-1.5 py-0.5 shrink-0">{typeLabel[a.type]}</span>
                      <span className="text-xs text-slate-500 ml-auto shrink-0">{a.date}</span>
                    </div>
                    <p className={`text-xs mt-1 ${isRead ? 'text-slate-500' : 'text-slate-300'}`}>{a.title}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </Screen>
  );
}
