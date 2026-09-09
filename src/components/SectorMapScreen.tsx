import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Screen, Section } from './ui';
import CompanyDetailScreen from './CompanyDetailScreen';

interface StockOption {
  ticker: string;
  companyName: string;
}

interface SectorEntry {
  code: string;
  name: string;
}

export default function SectorMapScreen() {
  const [sectorMap, setSectorMap] = useState<Record<string, SectorEntry>>({});
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [openSector, setOpenSector] = useState<string | null>(null);
  const [selected, setSelected] = useState<StockOption | null>(null);

  useEffect(() => {
    fetch('/data/sector-map.json').then((r) => r.json()).then(setSectorMap).catch(() => {});
    fetch('/data/stocks.json').then((r) => r.json()).then(setStocks).catch(() => {});
  }, []);

  if (selected) {
    return <CompanyDetailScreen company={selected} onBack={() => setSelected(null)} />;
  }

  // KSIC 업종명 기준으로 종목을 묶는다 - 이 매핑은 DART company.json의 induty_code를
  // scripts/generate-sector-map.mjs가 미리 뽑아둔 것으로, 손으로 편집하는 테마 목록과
  // 달리 전 종목에 대해 기계적으로 갱신 가능하다.
  const sectors = new Map<string, { code: string; members: StockOption[] }>();
  for (const stock of stocks) {
    const sector = sectorMap[stock.ticker];
    if (!sector) continue;
    const entry = sectors.get(sector.name) ?? { code: sector.code, members: [] };
    entry.members.push(stock);
    sectors.set(sector.name, entry);
  }
  const sectorList = [...sectors.entries()]
    .map(([name, { code, members }]) => ({ name, code, members }))
    .sort((a, b) => b.members.length - a.members.length);

  return (
    <Screen>
      <header className="mb-6">
        <h1 className="text-xl font-bold font-mono tracking-tight">SECTOR MAP</h1>
        <p className="text-xs text-slate-500">DART 표준산업분류(KSIC) 기준 · 업종별로 종목 둘러보기</p>
      </header>

      <Section title={`🏭 업종 (${sectorList.length})`}>
        {sectorList.length === 0 ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : (
          <ul className="space-y-2">
            {sectorList.map((sector) => {
              const isOpen = openSector === sector.name;
              return (
                <li key={sector.name} className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenSector(isOpen ? null : sector.name)}
                    className="w-full flex items-center justify-between px-3 py-2.5 text-sm"
                  >
                    <span className="font-medium text-left">{sector.name}</span>
                    <span className="flex items-center gap-1.5 text-slate-500 text-xs shrink-0 ml-2">
                      {sector.members.length}개 종목
                      <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                    </span>
                  </button>
                  {isOpen && (
                    <ul className="border-t border-slate-800 divide-y divide-slate-800">
                      {sector.members.map((s) => (
                        <li key={s.ticker}>
                          <button
                            onClick={() => setSelected(s)}
                            className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-slate-800/50"
                          >
                            <span>{s.companyName}</span>
                            <span className="text-slate-500 text-xs font-mono">{s.ticker}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
    </Screen>
  );
}
