import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Screen, Section } from './ui';
import { addToWatchlist, getWatchlist, removeFromWatchlist, type WatchlistItem } from '../lib/watchlistDb';

interface StockOption {
  ticker: string;
  companyName: string;
}

export default function WatchlistScreen() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [query, setQuery] = useState('');

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
  }

  async function handleRemove(ticker: string) {
    await removeFromWatchlist(ticker);
    setItems(await getWatchlist());
  }

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-lg font-bold">MY STOCK RADAR</h1>
        <p className="text-xs text-slate-500">관심종목 {items.length}개 · 이 기기에만 저장됩니다</p>
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
                className="flex items-center justify-between text-sm bg-slate-900 rounded-lg px-3 py-2"
              >
                <span>
                  <span className="font-medium">{item.companyName}</span>
                  <span className="text-slate-500 ml-2 text-xs">{item.ticker}</span>
                </span>
                <button
                  onClick={() => handleRemove(item.ticker)}
                  aria-label={`${item.companyName} 삭제`}
                  className="text-slate-500 hover:text-red-400"
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
