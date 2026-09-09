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

interface ThemeStage {
  label: string;
  tickers: string[];
}

interface ThemeGroup {
  label: string;
  stages: ThemeStage[];
}

interface ThemeMap {
  id: string;
  label: string;
  groups: ThemeGroup[];
}

type Mode = 'industry' | 'theme';

export default function SectorMapScreen() {
  const [mode, setMode] = useState<Mode>('industry');
  const [sectorMap, setSectorMap] = useState<Record<string, SectorEntry>>({});
  const [themeMaps, setThemeMaps] = useState<ThemeMap[]>([]);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [openSector, setOpenSector] = useState<string | null>(null);
  const [selected, setSelected] = useState<StockOption | null>(null);

  useEffect(() => {
    fetch('/data/sector-map.json').then((r) => r.json()).then(setSectorMap).catch(() => {});
    fetch('/data/theme-maps.json').then((r) => r.json()).then(setThemeMaps).catch(() => {});
    fetch('/data/stocks.json').then((r) => r.json()).then(setStocks).catch(() => {});
  }, []);

  if (selected) {
    return <CompanyDetailScreen company={selected} onBack={() => setSelected(null)} />;
  }

  const companyByTicker = new Map<string, StockOption>(stocks.map((s) => [s.ticker, s]));

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

  // 테마가 하나뿐인 동안은 고를 필요가 없어서 그냥 첫 번째를 보여준다 - 두 번째
  // 테마가 생기면 그때 선택 UI를 추가한다.
  const themeMap = themeMaps[0];

  return (
    <Screen>
      <header className="mb-4">
        <h1 className="text-xl font-bold font-mono tracking-tight">SECTOR MAP</h1>
        <p className="text-xs text-slate-500">
          {mode === 'industry' ? 'DART 표준산업분류(KSIC) 기준 · 업종별로 종목 둘러보기' : '테마의 밸류체인 단계별로 종목 둘러보기 (수작업 정리)'}
        </p>
      </header>

      <div className="flex gap-1 mb-5">
        <button
          onClick={() => setMode('industry')}
          className={`text-xs px-3 py-1.5 rounded-full border ${mode === 'industry' ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600' : 'border-slate-800 text-slate-500'}`}
        >
          업종별
        </button>
        <button
          onClick={() => setMode('theme')}
          className={`text-xs px-3 py-1.5 rounded-full border ${mode === 'theme' ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600' : 'border-slate-800 text-slate-500'}`}
        >
          테마별
        </button>
      </div>

      {mode === 'industry' ? (
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
      ) : !themeMap ? (
        <p className="text-sm text-slate-500">불러오는 중...</p>
      ) : (
        <Section title={`🔗 ${themeMap.label} 밸류체인`}>
          <div className="space-y-4">
            {themeMap.groups.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.stages.map((stage) => (
                    <div key={stage.label} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
                      <p className="text-xs text-slate-500 mb-1.5">{stage.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {stage.tickers.map((ticker) => {
                          const company = companyByTicker.get(ticker);
                          if (!company) return null;
                          return (
                            <button
                              key={ticker}
                              onClick={() => setSelected(company)}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded px-2 py-1"
                            >
                              {company.companyName}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}
    </Screen>
  );
}
