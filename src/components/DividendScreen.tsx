import { useEffect, useMemo, useState } from 'react';
import { Screen, Section } from './ui';
import { getWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { getAllHistory, type DisclosureRecord } from '../lib/disclosuresDb';

export default function DividendScreen() {
  const [history, setHistory] = useState<DisclosureRecord[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);

  useEffect(() => {
    getAllHistory().then(setHistory);
    getWatchlist().then(setWatchlist);
  }, []);

  // 정확한 배당락일ㆍ주당 배당금은 공시 원문(첨부문서) 파싱이 필요해서 아직 없다 -
  // "배당 관련 공시가 있었다"는 사실(로컬에 쌓인 실데이터)만 정직하게 보여준다.
  const myDividendNews = useMemo(() => {
    const watched = new Set(watchlist.map((w) => w.ticker));
    return history
      .filter((h) => watched.has(h.ticker) && h.type === 'DIVIDEND')
      .sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));
  }, [history, watchlist]);

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-lg font-bold">DIVIDEND</h1>
        <p className="text-xs text-slate-500">관심종목의 배당 관련 공시</p>
      </header>

      <Section title="💰 배당 관련 공시">
        {watchlist.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 관심종목이 없습니다. MY STOCK RADAR 탭에서 추가해보세요.
          </p>
        ) : myDividendNews.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 쌓인 배당 공시가 없습니다. 앱을 방문할 때마다 오늘자 공시가 로컬에 쌓입니다.
          </p>
        ) : (
          <ul className="space-y-2">
            {myDividendNews.map((d) => (
              <li key={d.id} className="bg-slate-900 rounded-lg px-3 py-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{d.companyName}</span>
                  <span className="text-xs text-slate-500 shrink-0 ml-2">{d.date}</span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{d.title}</p>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <p className="text-xs text-slate-600 mt-3">
        * 배당락일ㆍ주당 배당금 등 정확한 수치는 공시 원문 확인이 필요합니다. 여기 뜨는 건
        "배당 관련 공시가 있었다"는 사실이에요.
      </p>
    </Screen>
  );
}
