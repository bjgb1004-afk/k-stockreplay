import { useEffect, useMemo, useState } from 'react';
import { Screen, Panel, Chip, PageHeader, TableWrap } from './ui';
import { getWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { getAllHistory, type DisclosureRecord } from '../lib/disclosuresDb';

// 실적발표 일정은 아직 없다 - 별도 실적 캘린더 phase가 필요하다.
// 배당은 DIVIDEND 타입 공시, 주주총회는 공시 제목에서 걸러낸다.
// 정확한 배당락일ㆍ주당 배당금은 공시 원문 파싱이 필요해서 "공시가 있었다"는 사실만 보여준다.
const SHAREHOLDER_MEETING_PATTERN = /주주총회/;

type Filter = 'all' | 'div' | 'agm';

export default function EventsScreen() {
  const [history, setHistory] = useState<DisclosureRecord[]>([]);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    getAllHistory().then(setHistory);
    getWatchlist().then(setWatchlist);
  }, []);

  const rows = useMemo(() => {
    const watched = new Set(watchlist.map((w) => w.ticker));
    return history
      .filter((h) => watched.has(h.ticker))
      .map((h) => {
        const kind: 'div' | 'agm' | null =
          h.type === 'DIVIDEND' ? 'div' : SHAREHOLDER_MEETING_PATTERN.test(h.title) ? 'agm' : null;
        return { h, kind };
      })
      .filter((r): r is { h: DisclosureRecord; kind: 'div' | 'agm' } => r.kind !== null)
      .sort((a, b) => b.h.date.localeCompare(a.h.date) || b.h.id.localeCompare(a.h.id));
  }, [history, watchlist]);

  const divCount = rows.filter((r) => r.kind === 'div').length;
  const agmCount = rows.length - divCount;
  const shown = filter === 'all' ? rows : rows.filter((r) => r.kind === filter);

  const seg = (id: Filter, label: string, n: number) => (
    <button
      key={id}
      onClick={() => setFilter(id)}
      className={`px-3 h-8 text-xs font-medium border border-slate-800 first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 ${
        filter === id ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-slate-900 text-slate-400 hover:text-slate-100'
      }`}
    >
      {label} <span className="font-mono">{n}</span>
    </button>
  );

  return (
    <Screen>
      <PageHeader
        en="DIVIDEND · EVENTS"
        title="배당·이벤트"
        sub="관심종목의 배당·주주총회 관련 공시"
        right={
          <div className="flex">
            {seg('all', '전체', rows.length)}
            {seg('div', '배당', divCount)}
            {seg('agm', '주총', agmCount)}
          </div>
        }
      />

      <Panel title="배당·주총 공시" meta={`${shown.length}건`}>
        {watchlist.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">아직 관심종목이 없습니다. 관심종목 메뉴에서 추가해보세요.</p>
        ) : shown.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            아직 쌓인 공시가 없습니다. 앱을 방문할 때마다 오늘자 공시가 로컬에 쌓입니다.
          </p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>종목</th>
                <th>구분</th>
                <th>공시 제목</th>
                <th>공시일</th>
              </tr>
            </thead>
            <tbody>
              {shown.map(({ h, kind }) => (
                <tr key={h.id}>
                  <td>
                    <b className="font-semibold">{h.companyName}</b>
                    <small className="block font-mono text-[11px] text-slate-500">{h.ticker}</small>
                  </td>
                  <td>{kind === 'div' ? <Chip tone="div">배당</Chip> : <Chip tone="agm">주총</Chip>}</td>
                  <td className="whitespace-normal text-left max-w-[26rem]">{h.title}</td>
                  <td className="font-mono">{h.date}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        )}
      </Panel>
      <p className="text-xs text-slate-600 mt-3">
        * 배당락일ㆍ주당 배당금 등 정확한 수치는 공시 원문 확인이 필요합니다. 실적발표 일정은 아직 지원하지 않습니다.
      </p>
    </Screen>
  );
}
