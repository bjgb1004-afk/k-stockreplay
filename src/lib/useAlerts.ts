import { useEffect, useMemo, useState } from 'react';
import { getWatchlist, type WatchlistItem } from './watchlistDb';
import { getReadIds, markRead as markReadInDb } from './alertsDb';

export type EventType = 'DISCLOSURE' | 'CONTRACT' | 'DIVIDEND' | 'MANAGEMENT_CHANGE';

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

export interface AlertItem {
  id: string;
  ticker: string;
  companyName: string;
  date: string;
  type: EventType;
  title: string;
}

// 서버는 유저별 워치리스트를 모른다 (§2-3) - 워치리스트가 알림 대상의 기준.
// AlertScreen(화면 표시)과 App(앱 뱃지 카운트) 둘 다 같은 안읽음 개수를 써야
// 하므로 여기 하나로 뽑아둔다.
export function useAlerts() {
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

  async function markRead(id: string) {
    if (readIds.has(id)) return;
    await markReadInDb(id);
    setReadIds((prev) => new Set(prev).add(id));
  }

  return { alerts, readIds, unreadCount, watchlist, markRead };
}
