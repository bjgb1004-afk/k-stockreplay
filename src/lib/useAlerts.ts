import { useEffect, useMemo, useState } from 'react';
import { getWatchlist, type WatchlistItem } from './watchlistDb';
import { getReadIds, markRead as markReadInDb } from './alertsDb';
import { getAllHistory, type DisclosureRecord, type DisclosureType } from './disclosuresDb';

export type EventType = DisclosureType;

interface TodayEntry {
  id: string;
  ticker: string;
  companyName: string;
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
  silentSurprise: boolean;
}

// 오래 조용하던 종목에 소식이 생기면 특별히 표시한다 (§6-7 침묵 종목 서프라이즈
// 알림). "조용했다"는 판단 기준일 뿐이라 30일은 임의값 - 데이터가 쌓이면 튜닝.
const SILENT_GAP_DAYS = 30;

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

// 서버는 유저별 워치리스트를 모른다 (§2-3) - 워치리스트가 알림 대상의 기준.
// AlertScreen(화면 표시)과 App(앱 뱃지 카운트) 둘 다 같은 안읽음 개수를 써야
// 하므로 여기 하나로 뽑아둔다.
export function useAlerts() {
  const [todayDate, setTodayDate] = useState<string | null>(null);
  const [todayEntries, setTodayEntries] = useState<TodayEntry[]>([]);
  const [historyEntries, setHistoryEntries] = useState<DisclosureRecord[]>([]);
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
    getAllHistory().then(setHistoryEntries).catch(() => {});
    getWatchlist().then(setWatchlist);
    getReadIds().then(setReadIds);
  }, []);

  // today.json(방금 fetch)과 로컬 disclosures 스토어(과거에 쌓아둔 것) 둘 다 오늘
  // 날짜 항목을 가질 수 있어서, 내용 기반 id(ticker_date_title)로 합쳐서 자연스럽게
  // 중복 제거한다.
  const alerts = useMemo(() => {
    const watchedByTicker = new Map<string, string>(watchlist.map((w) => [w.ticker, w.companyName]));
    const merged = new Map<string, Omit<AlertItem, 'silentSurprise'>>();

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

    // 티커별로 날짜순 정렬해서, 바로 이전 소식과의 간격을 잰다 - 이전 기록이
    // 없으면(처음 보는 데이터) "침묵이 깨졌다"고 판단할 기준이 없으니 제외.
    const byTicker = new Map<string, Omit<AlertItem, 'silentSurprise'>[]>();
    for (const item of merged.values()) {
      if (!byTicker.has(item.ticker)) byTicker.set(item.ticker, []);
      byTicker.get(item.ticker)!.push(item);
    }

    const withSurprise: AlertItem[] = [];
    for (const items of byTicker.values()) {
      const sorted = [...items].sort((a, b) => a.date.localeCompare(b.date));
      sorted.forEach((item, i) => {
        const prev = sorted[i - 1];
        const silentSurprise = !!prev && daysBetween(prev.date, item.date) >= SILENT_GAP_DAYS;
        withSurprise.push({ ...item, silentSurprise });
      });
    }

    return withSurprise.sort((a, b) => b.date.localeCompare(a.date));
  }, [todayEntries, historyEntries, watchlist, todayDate]);

  const unreadCount = alerts.filter((a) => !readIds.has(a.id)).length;

  async function markRead(id: string) {
    if (readIds.has(id)) return;
    await markReadInDb(id);
    setReadIds((prev) => new Set(prev).add(id));
  }

  return { alerts, readIds, unreadCount, watchlist, markRead };
}
