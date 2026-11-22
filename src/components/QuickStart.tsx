import { useEffect, useMemo, useState } from 'react';
import { Plus, Check } from 'lucide-react';
import { TableWrap, Spark } from './ui';
import { addToWatchlist, getWatchlist, notifyWatchlistChanged } from '../lib/watchlistDb';
import { loadPriceHistory, type PriceHistory } from '../lib/priceHistory';

// 관심종목이 0개인 첫 방문자에게 빈 화면 대신 "오늘 거래대금 상위 종목"을 보여주고
// 한 번에 담을 수 있게 하는 빠른 시작 패널. 실제 수집된 prices.json/stocks.json만 쓴다.

interface PriceRow {
  ticker: string;
  close: number;
  changePct: number;
  amount?: number | null;
  date: string;
}

interface Leader extends PriceRow {
  companyName: string;
}

export default function QuickStart({ limit = 8, title = '오늘 거래대금 상위 종목' }: { limit?: number; title?: string }) {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [history, setHistory] = useState<PriceHistory | null>(null);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/data/prices.json').then((r) => r.json()),
      fetch('/data/stocks.json').then((r) => r.json()),
    ])
      .then(([prices, stocks]: [PriceRow[], { ticker: string; companyName: string }[]]) => {
        const nameByTicker = new Map(stocks.map((s) => [s.ticker, s.companyName]));
        const rows = prices
          .filter((p) => (p.amount ?? 0) > 0 && nameByTicker.has(p.ticker))
          .sort((a, b) => (b.amount ?? 0) - (a.amount ?? 0))
          .slice(0, limit)
          .map((p) => ({ ...p, companyName: nameByTicker.get(p.ticker)! }));
        setLeaders(rows);
      })
      .catch(() => {});
    loadPriceHistory().then(setHistory);
    getWatchlist().then((list) => setWatched(new Set(list.map((w) => w.ticker))));
  }, [limit]);

  const notWatched = useMemo(() => leaders.filter((l) => !watched.has(l.ticker)), [leaders, watched]);

  async function add(list: Leader[]) {
    if (busy || list.length === 0) return;
    setBusy(true);
    for (const l of list) await addToWatchlist(l.ticker, l.companyName, 'KR');
    setWatched(new Set([...watched, ...list.map((l) => l.ticker)]));
    setBusy(false);
    notifyWatchlistChanged();
  }

  if (leaders.length === 0) {
    return <p className="px-4 py-6 text-sm text-slate-500">아직 관심종목이 없습니다. 관심종목 메뉴에서 추가해보세요.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-3 flex-wrap px-4 pt-3 pb-2">
        <p className="text-[13px] text-slate-300">
          관심종목이 없어서 <b className="text-slate-100">{title}</b>을 보여드려요. 담으면 공시·배당·알림이 바로 채워집니다.
        </p>
        <button
          onClick={() => add(notWatched)}
          disabled={busy || notWatched.length === 0}
          className="ml-auto inline-flex items-center gap-1.5 h-8 px-3 rounded-md bg-cyan-500 text-white text-[13px] font-semibold hover:bg-cyan-600 disabled:opacity-50"
        >
          <Plus size={14} /> 한 번에 담기
        </button>
      </div>
      <TableWrap>
        <thead>
          <tr>
            <th>종목</th>
            <th>종가</th>
            <th>등락률</th>
            <th>거래대금(억)</th>
            <th>20일 추이</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {leaders.map((l) => {
            const isWatched = watched.has(l.ticker);
            return (
              <tr key={l.ticker}>
                <td>
                  <b className="block font-semibold">{l.companyName}</b>
                  <small className="font-mono text-[11px] text-slate-500">{l.ticker}</small>
                </td>
                <td className="font-mono">{l.close.toLocaleString('ko-KR')}</td>
                <td className={`font-mono ${l.changePct === 0 ? 'text-slate-500' : l.changePct > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                  {l.changePct > 0 ? '▲ ' : l.changePct < 0 ? '▼ ' : ''}
                  {Math.abs(l.changePct).toFixed(2)}%
                </td>
                <td className="font-mono">{(l.amount ?? 0).toLocaleString('ko-KR')}</td>
                <td>
                  <Spark values={history?.close[l.ticker]} />
                </td>
                <td>
                  <button
                    onClick={() => add([l])}
                    disabled={busy || isWatched}
                    aria-label={isWatched ? `${l.companyName} 담김` : `${l.companyName} 관심종목에 담기`}
                    className="inline-flex items-center gap-1 h-7 px-2 rounded border border-slate-700 text-[12px] hover:bg-slate-950 disabled:opacity-60"
                  >
                    {isWatched ? <Check size={13} /> : <Plus size={13} />}
                    {isWatched ? '담김' : '담기'}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>
      <p className="px-4 py-2 text-[11px] text-slate-500">{leaders[0].date} 종가 기준 · 투자 권유가 아닙니다.</p>
    </div>
  );
}
