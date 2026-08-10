import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Screen, Section } from './ui';
import CompanyDetailScreen from './CompanyDetailScreen';

interface StockOption {
  ticker: string;
  companyName: string;
}

interface Theme {
  id: string;
  label: string;
  tickers: string[];
}

export default function ThemeTreeScreen() {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [openThemeId, setOpenThemeId] = useState<string | null>(null);
  const [selected, setSelected] = useState<StockOption | null>(null);

  useEffect(() => {
    fetch('/data/themes.json').then((r) => r.json()).then(setThemes).catch(() => {});
    fetch('/data/stocks.json').then((r) => r.json()).then(setStocks).catch(() => {});
  }, []);

  if (selected) {
    return <CompanyDetailScreen company={selected} onBack={() => setSelected(null)} />;
  }

  const companyByTicker = new Map<string, StockOption>(stocks.map((s) => [s.ticker, s]));

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-lg font-bold">THEME TREE</h1>
        <p className="text-xs text-slate-500">테마 · 산업별로 종목 둘러보기</p>
      </header>

      <Section title="🌳 테마">
        <ul className="space-y-2">
          {themes.map((theme) => {
            const isOpen = openThemeId === theme.id;
            const members = theme.tickers.map((t) => companyByTicker.get(t)).filter((s): s is StockOption => !!s);
            return (
              <li key={theme.id} className="bg-slate-900 rounded-lg overflow-hidden">
                <button
                  onClick={() => setOpenThemeId(isOpen ? null : theme.id)}
                  className="w-full flex items-center justify-between px-3 py-2.5 text-sm"
                >
                  <span className="font-medium">{theme.label}</span>
                  <span className="flex items-center gap-1.5 text-slate-500 text-xs">
                    {members.length}개 종목
                    <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  </span>
                </button>
                {isOpen && (
                  <ul className="border-t border-slate-800 divide-y divide-slate-800">
                    {members.map((s) => (
                      <li key={s.ticker}>
                        <button
                          onClick={() => setSelected(s)}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-800/50"
                        >
                          <span>{s.companyName}</span>
                          <span className="text-slate-500 text-xs">{s.ticker}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </Section>
    </Screen>
  );
}
