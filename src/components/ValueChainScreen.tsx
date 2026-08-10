import { useEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Screen, Section } from './ui';
import CompanyDetailScreen from './CompanyDetailScreen';

interface StockOption {
  ticker: string;
  companyName: string;
}

interface ValueChainEdge {
  from: string;
  to: string;
  relation: string;
  note: string;
}

export default function ValueChainScreen() {
  const [edges, setEdges] = useState<ValueChainEdge[]>([]);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [selected, setSelected] = useState<StockOption | null>(null);

  useEffect(() => {
    fetch('/data/valuechain.json').then((r) => r.json()).then(setEdges).catch(() => {});
    fetch('/data/stocks.json').then((r) => r.json()).then(setStocks).catch(() => {});
  }, []);

  if (selected) {
    return <CompanyDetailScreen company={selected} onBack={() => setSelected(null)} />;
  }

  const companyByTicker = new Map<string, StockOption>(stocks.map((s) => [s.ticker, s]));

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-lg font-bold">VALUE CHAIN</h1>
        <p className="text-xs text-slate-500">잘 알려진 공급망 · 계열 관계만 표시</p>
      </header>

      <Section title="🔗 기업 관계">
        {edges.length === 0 ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : (
          <ul className="space-y-2">
            {edges.map((edge, i) => {
              const from = companyByTicker.get(edge.from);
              const to = companyByTicker.get(edge.to);
              if (!from || !to) return null;
              return (
                <li key={i} className="bg-slate-900 rounded-lg px-3 py-2.5">
                  <div className="flex items-center gap-2 text-sm">
                    <CompanyChip company={from} onClick={() => setSelected(from)} />
                    <ArrowRight size={14} className="text-slate-600 shrink-0" />
                    <CompanyChip company={to} onClick={() => setSelected(to)} />
                    <span className="text-xs text-slate-500 ml-auto shrink-0">{edge.relation}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5">{edge.note}</p>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </Screen>
  );
}

function CompanyChip({ company, onClick }: { company: StockOption; onClick: () => void }) {
  return (
    <button onClick={onClick} className="font-medium hover:underline truncate">
      {company.companyName}
    </button>
  );
}
