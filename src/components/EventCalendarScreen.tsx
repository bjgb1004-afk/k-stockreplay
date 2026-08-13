import { useEffect, useMemo, useState } from 'react';
import { Screen, Section } from './ui';
import { getWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { getAllHistory, type DisclosureRecord } from '../lib/disclosuresDb';

// 실적발표는 아직 없다 - fetch-facts.mjs가 A(정기공시) 카테고리를 안 받아오는데,
// 개별 실적발표 일정은 거기 딸린 게 아니라 별도 실적 캘린더 phase가 필요하다.
// 주주총회는 I(거래소공시) 카테고리 공시 제목에서 바로 걸러낼 수 있다.
const SHAREHOLDER_MEETING_PATTERN = /주주총회/;

export default function EventCalendarScreen() {
  const [history, setHistory] = useState<DisclosureRecord[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    getAllHistory().then(setHistory);
    getWatchlist().then(setWatchlist);
  }, []);

  const myMeetingNews = useMemo(() => {
    const watched = new Set(watchlist.map((w) => w.ticker));
    return history
      .filter((h) => watched.has(h.ticker) && SHAREHOLDER_MEETING_PATTERN.test(h.title))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [history, watchlist]);

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-lg font-bold">EVENTS</h1>
        <p className="text-xs text-slate-500">관심종목의 주주총회 관련 공시</p>
      </header>

      <Section title="🏛️ 주주총회 관련 공시">
        {watchlist.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 관심종목이 없습니다. MY STOCK RADAR 탭에서 추가해보세요.
          </p>
        ) : myMeetingNews.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 쌓인 주주총회 공시가 없습니다. 앱을 방문할 때마다 오늘자 공시가 로컬에 쌓입니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {myMeetingNews.map((e) => (
              <li key={e.id} className="bg-slate-900 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{e.companyName}</span>
                  <span className="text-xs text-slate-500 shrink-0 ml-2">{e.date}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{e.title}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <p className="text-xs text-slate-600 mt-3">* 실적발표 일정은 아직 지원하지 않습니다.</p>
    </Screen>
  );
}
