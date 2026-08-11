import { useEffect, useMemo, useState } from 'react';
import { X, ChevronRight, Share2 } from 'lucide-react';
import { Screen, Section } from './ui';
import { addToWatchlist, getWatchlist, removeFromWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { shareReport } from '../lib/share';
import CompanyDetailScreen from './CompanyDetailScreen';

interface StockOption {
  ticker: string;
  companyName: string;
}

export default function WatchlistScreen() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<StockOption | null>(null);
  const [shareMsg, setShareMsg] = useState<string | null>(null);

  useEffect(() => {
    getWatchlist().then((list) => setItems(list.sort((a, b) => b.updated_at.localeCompare(a.updated_at))));
    fetch('/data/stocks.json')
      .then((res) => res.json())
      .then(setStocks)
      .catch(() => setStocks([]));
  }, []);

  const watchedTickers = useMemo(() => new Set(items.map((i) => i.ticker)), [items]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return stocks.filter((s) => !watchedTickers.has(s.ticker) && s.companyName.toLowerCase().includes(q)).slice(0, 5);
  }, [query, stocks, watchedTickers]);

  async function handleAdd(stock: StockOption) {
    await addToWatchlist(stock.ticker, stock.companyName);
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
      <header className="mb-6 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-bold">MY STOCK RADAR</h1>
          <p className="text-xs text-slate-500">
            {shareMsg ?? `관심종목 ${items.length}개 · 이 기기에만 저장됩니다`}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={handleShare}
            aria-label="관심종목 리포트 공유"
            className="shrink-0 text-slate-400 hover:text-slate-100 p-1.5"
          >
            <Share2 size={18} />
          </button>
        )}
      </header>

      <Section title="종목 추가">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="종목명 검색 (예: 삼성전자)"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-slate-600"
        />
        {suggestions.length > 0 && (
          <ul className="mt-2 border border-slate-800 rounded-lg divide-y divide-slate-800 overflow-hidden">
            {suggestions.map((s) => (
              <li key={s.ticker}>
                <button
                  onClick={() => handleAdd(s)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-slate-900 flex justify-between"
                >
                  <span>{s.companyName}</span>
                  <span className="text-slate-500">{s.ticker}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="관심종목">
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">아직 추가한 종목이 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item.ticker}
                className="flex items-center justify-between text-sm bg-slate-900 rounded-lg pl-3 pr-1 py-1"
              >
                <button
                  onClick={() => setSelected(item)}
                  className="flex-1 flex items-center justify-between text-left py-1.5 min-w-0"
                >
                  <span className="truncate">
                    <span className="font-medium">{item.companyName}</span>
                    <span className="text-slate-500 ml-2 text-xs">{item.ticker}</span>
                  </span>
                  <ChevronRight size={16} className="text-slate-600 shrink-0 ml-1" />
                </button>
                <button
                  onClick={() => handleRemove(item.ticker)}
                  aria-label={`${item.companyName} 삭제`}
                  className="text-slate-500 hover:text-red-400 shrink-0 p-2"
                >
                  <X size={16} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Screen>
  );
}
