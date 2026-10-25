import { useEffect, useMemo, useState } from 'react';
import { X, Share2 } from 'lucide-react';
import { Screen, Section, Panel, PageHeader, TableWrap, Chip, Spark } from './ui';
import { loadPriceHistory, type PriceHistory } from '../lib/priceHistory';
import { addToWatchlist, getWatchlist, removeFromWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { shareReport } from '../lib/share';
import CompanyDetailScreen from './CompanyDetailScreen';

interface StockOption {
  ticker: string;
  companyName: string;
  market: 'KR' | 'US';
}

interface PriceInfo {
  ticker: string;
  close: number;
  changePct: number;
  amount?: number | null;
  date: string;
}

export default function WatchlistScreen({ initialQuery = '' }: { initialQuery?: string }) {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  // 상단 헤더 검색창에 입력하면 이 화면의 종목 검색으로 그대로 이어진다.
  const [query, setQuery] = useState(initialQuery);
  const [selected, setSelected] = useState<StockOption | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState<Map<string, number>>(new Map());
  const [prices, setPrices] = useState<Map<string, PriceInfo>>(new Map());
  const [history, setHistory] = useState<PriceHistory | null>(null);

  useEffect(() => {
    getWatchlist().then((list) => setItems(list.sort((a, b) => b.updated_at.localeCompare(a.updated_at))));
    Promise.all([
      fetch('/data/stocks.json').then((r) => r.json()).catch(() => []),
      fetch('/data/us-stocks.json').then((r) => r.json()).catch(() => []),
    ]).then(([kr, us]) => {
      setStocks([
        ...kr.map((s: { ticker: string; companyName: string }) => ({ ...s, market: 'KR' as const })),
        ...us.map((s: { ticker: string; companyName: string }) => ({ ...s, market: 'US' as const })),
      ]);
    });
    fetch('/data/prices.json')
      .then((r) => r.json())
      .then((rows: PriceInfo[]) => setPrices(new Map(rows.map((r) => [r.ticker, r]))))
      .catch(() => {});
    loadPriceHistory().then(setHistory);
  }, []);

  useEffect(() => {
    fetch('/data/today.json')
      .then((r) => r.json())
      .then((d: { newToday: { ticker: string }[] }) => {
        const m = new Map<string, number>();
        for (const e of d.newToday) m.set(e.ticker, (m.get(e.ticker) ?? 0) + 1);
        setTodayCount(m);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  const watchedTickers = useMemo(() => new Set(items.map((i) => i.ticker)), [items]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return stocks
      .filter((s) => !watchedTickers.has(s.ticker) && (s.companyName.toLowerCase().includes(q) || s.ticker.toLowerCase().includes(q)))
      .slice(0, 5);
  }, [query, stocks, watchedTickers]);

  async function handleAdd(stock: StockOption) {
    await addToWatchlist(stock.ticker, stock.companyName, stock.market);
    setItems(await getWatchlist());
    setQuery('');
    // D1 온보딩(§6-12): 추가하자마자 바로 상세(COMPANY PASSPORT + HISTORY)로
    // 이동해서 최근 히스토리를 바로 보여준다 - 목록에 남겨두고 따로 찾게 하지 않는다.
    setSelected(stock);
  }

  async function handleRemove(ticker: string) {
    await removeFromWatchlist(ticker);
    setItems(await getWatchlist());
  }

  async function handleShare() {
    const names = items.map((i) => i.companyName).join(', ');
    const text = `내 관심종목 리포트\n${names}\n\nK-STOCKREPLAY에서 매일 확인: https://k-stockreplay.pe.kr`;
    try {
      const result = await shareReport('내 관심종목 리포트', text);
      setShareMsg(result === 'copied' ? '클립보드에 복사했어요' : null);
    } catch {
      // 사용자가 공유 시트를 취소한 경우 등 - 조용히 무시.
    }
    setTimeout(() => setShareMsg(null), 2000);
  }

  if (selected) {
    return (
      <CompanyDetailScreen
        company={selected}
        onBack={() => {
          setSelected(null);
          getWatchlist().then((list) => setItems(list.sort((a, b) => b.updated_at.localeCompare(a.updated_at))));
        }}
      />
    );
  }

  return (
    <Screen>
      <PageHeader
        en="MY STOCK RADAR"
        title="관심종목"
        sub={shareMsg ?? `관심종목 ${items.length}개 · 이 기기에만 저장됩니다`}
        right={
          items.length > 0 ? (
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-slate-700 bg-slate-900 text-[13px] hover:bg-slate-950"
            >
              <Share2 size={14} /> 공유
            </button>
          ) : undefined
        }
      />

      <Section title="종목 추가">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="종목명/티커 검색 (예: 삼성전자, AAPL)"
          className="w-full md:max-w-md h-9 bg-slate-900 border border-slate-800 rounded-md px-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-cyan-600"
        />
        {suggestions.length > 0 && (
          <ul className="mt-2 md:max-w-md panel divide-y divide-slate-800 overflow-hidden">
            {suggestions.map((s) => (
              <li key={s.ticker}>
                <button
                  onClick={() => handleAdd(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-900 flex justify-between"
                >
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{s.companyName}</span>
                    <span className={`text-[10px] shrink-0 rounded px-1 py-0.5 ${s.market === 'US' ? 'bg-cyan-500/15 text-cyan-400' : 'bg-slate-800 text-slate-400'}`}>
                      {s.market}
                    </span>
                  </span>
                  <span className="text-slate-500 font-mono text-xs">{s.ticker}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Panel title="추적 중인 종목" meta={`${items.length}개`}>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">아직 추가한 종목이 없습니다. 위 검색창에서 종목을 추가해보세요.</p>
        ) : (
          <TableWrap>
            <thead>
              <tr>
                <th>종목</th>
                <th>현재가</th>
                <th>등락률</th>
                <th>거래대금(억)</th>
                <th>20일 추이</th>
                <th>오늘 변화</th>
                <th aria-label="삭제" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const price = item.market === 'KR' ? prices.get(item.ticker) : undefined;
                const n = todayCount.get(item.ticker) ?? 0;
                return (
                  <tr key={item.ticker}>
                    <td>
                      <button onClick={() => setSelected(item)} className="text-left hover:underline">
                        <b className="font-semibold">{item.companyName}</b>
                        <span className="ml-1.5 text-[10px] border border-slate-700 rounded px-1 text-slate-500 align-[1px]">{item.market}</span>
                        <small className="block font-mono text-[11px] text-slate-500">{item.ticker}</small>
                      </button>
                    </td>
                    <td className="font-mono">{price ? price.close.toLocaleString('ko-KR') : '—'}</td>
                    <td className={`font-mono ${!price || price.changePct === 0 ? 'text-slate-500' : price.changePct > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                      {price ? `${price.changePct > 0 ? '▲ ' : price.changePct < 0 ? '▼ ' : ''}${Math.abs(price.changePct).toFixed(2)}%` : item.market === 'US' ? '미지원' : '—'}
                    </td>
                    <td className="font-mono">{price?.amount != null ? price.amount.toLocaleString('ko-KR') : '—'}</td>
                    <td>
                      <Spark values={history?.close[item.ticker]} />
                    </td>
                    <td>{n > 0 ? <Chip tone="dis">공시 {n}건</Chip> : <span className="text-slate-500">—</span>}</td>
                    <td className="w-10">
                      <button
                        onClick={() => handleRemove(item.ticker)}
                        aria-label={`${item.companyName} 삭제`}
                        className="text-slate-500 hover:text-red-600 p-1"
                      >
                        <X size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        )}
      </Panel>
    </Screen>
  );
}
