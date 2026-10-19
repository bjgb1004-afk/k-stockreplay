import { useEffect, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Screen, Section, PageHeader, Panel } from './ui';
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

interface FlowEntry {
  v: number; // 거래대금 (억원)
  s: number; // 당일 전체 거래대금 대비 점유율
  c: number; // 거래대금 가중 평균 등락률
}

interface FlowDay {
  date: string;
  total: number;
  themes: Record<string, FlowEntry>;
  sectors: Record<string, FlowEntry>;
}

interface FlowRow extends FlowEntry {
  key: string;
  label: string;
  multiple: number | null;
}

type Mode = 'industry' | 'theme' | 'flow';

function formatAmount(v: number) {
  return v >= 10000 ? `${(v / 10000).toFixed(1)}조` : `${v.toLocaleString()}억`;
}

function FlowList({ rows, onPick }: { rows: FlowRow[]; onPick: (key: string) => void }) {
  const max = Math.max(...rows.map((r) => r.s), 0.0001);
  return (
    <ul className="panel divide-y divide-slate-800 overflow-hidden">
      {rows.map((row) => (
        <li key={row.key}>
          <button
            onClick={() => onPick(row.key)}
            className="w-full text-left px-4 py-3 hover:bg-slate-950"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium truncate">{row.label}</span>
              <span className="text-xs font-mono text-slate-400 shrink-0">
                {formatAmount(row.v)}
                <span className="text-slate-600"> · {(row.s * 100).toFixed(1)}%</span>
              </span>
            </div>
            <div className="mt-1.5 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-500/60" style={{ width: `${(row.s / max) * 100}%` }} />
            </div>
            <div className="mt-1.5 flex items-center gap-2 text-[11px]">
              <span className={row.c >= 0 ? 'text-red-600' : 'text-blue-600'}>
                {row.c >= 0 ? '+' : ''}
                {row.c.toFixed(2)}%
              </span>
              {row.multiple !== null && (
                <span className={row.multiple >= 1.5 ? 'text-amber-600' : 'text-slate-500'}>평소 대비 ×{row.multiple.toFixed(1)}</span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function SectorMapScreen() {
  const [mode, setMode] = useState<Mode>('industry');
  const [sectorMap, setSectorMap] = useState<Record<string, SectorEntry>>({});
  const [themeMaps, setThemeMaps] = useState<ThemeMap[]>([]);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [openSector, setOpenSector] = useState<string | null>(null);
  const [selected, setSelected] = useState<StockOption | null>(null);
  const [themeId, setThemeId] = useState<string | null>(null);
  const [flowDays, setFlowDays] = useState<FlowDay[] | null>(null);

  useEffect(() => {
    fetch('/data/sector-map.json').then((r) => r.json()).then(setSectorMap).catch(() => {});
    fetch('/data/theme-maps.json').then((r) => r.json()).then(setThemeMaps).catch(() => {});
    fetch('/data/stocks.json').then((r) => r.json()).then(setStocks).catch(() => {});
    fetch('/data/money-flow.json')
      .then((r) => r.json())
      .then((d) => setFlowDays(d.days ?? []))
      .catch(() => setFlowDays([])); // 아직 스크립트가 한 번도 안 돈 상태 - 빈 화면으로 안내한다.
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

  const themeMap = themeMaps.find((t) => t.id === themeId) ?? themeMaps[0];

  const flowLatest = flowDays?.[0] ?? null;
  const flowHistory = flowDays?.slice(1) ?? [];

  // 평소 대비 배수 = 오늘 점유율 / 과거 점유율 중앙값. 4거래일(=총 5일) 미만이면
  // 중앙값이 하루이틀에 휘둘려 가짜 신호가 되므로 아예 숨긴다.
  const flowMultiple = (pick: (d: FlowDay) => FlowEntry | undefined, share: number) => {
    const past = flowHistory.map((d) => pick(d)?.s).filter((v): v is number => typeof v === 'number');
    if (past.length < 4) return null;
    const sorted = [...past].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    return median > 0 ? share / median : null;
  };

  const themeFlowRows: FlowRow[] = !flowLatest
    ? []
    : themeMaps
        .filter((t) => flowLatest.themes[t.id])
        .map((t) => ({
          key: t.id,
          label: t.label,
          ...flowLatest.themes[t.id],
          multiple: flowMultiple((d) => d.themes[t.id], flowLatest.themes[t.id].s),
        }))
        .sort((a, b) => b.v - a.v);

  const sectorNameByCode = new Map<string, string>();
  for (const ticker of Object.keys(sectorMap)) sectorNameByCode.set(sectorMap[ticker].code, sectorMap[ticker].name);

  const sectorFlowRows: FlowRow[] = !flowLatest
    ? []
    : Object.keys(flowLatest.sectors)
        .map((code) => ({
          key: sectorNameByCode.get(code) ?? code, // 업종별 뷰가 이름으로 펼치므로 이름을 키로 쓴다.
          label: sectorNameByCode.get(code) ?? code,
          ...flowLatest.sectors[code],
          multiple: flowMultiple((d) => d.sectors[code], flowLatest.sectors[code].s),
        }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 15);

  return (
    <Screen>
      <PageHeader
        en="SECTOR MAP"
        title="업종 지도"
        sub={mode === 'industry'
            ? 'DART 표준산업분류(KSIC) 기준 · 업종별로 종목 둘러보기'
            : mode === 'theme'
              ? '테마의 밸류체인 단계별로 종목 둘러보기 (수작업 정리)'
              : `${flowLatest?.date ?? ''} 종가 기준 · 거래대금이 어느 테마·업종으로 몰렸는지`}
        right={
<div className="inline-flex border border-slate-700 rounded-md overflow-hidden" role="group" aria-label="보기 방식">
        {([
          ['industry', '업종별'],
          ['theme', '테마별'],
          ['flow', '자금흐름'],
        ] as const).map(([m, label]) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            aria-pressed={mode === m}
            className={`px-3.5 py-1.5 text-[12.5px] ${mode === m ? 'bg-cyan-500 text-white font-semibold' : 'bg-slate-900 text-slate-300 hover:bg-slate-950'}`}
          >
            {label}
          </button>
        ))}
      </div>
        }
      />


      {flowLatest && (
        <Panel title="업종 히트맵" meta={`${flowLatest.date} 종가 · 거래대금 상위 · 색은 등락률`}>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 p-3">
            {sectorFlowRows.slice(0, 12).map((r, i) => {
              const a = Math.min(0.9, 0.14 + Math.abs(r.c) * 0.2);
              const rgb = r.c > 0 ? '220,38,38' : r.c < 0 ? '37,99,235' : '120,130,150';
              return (
                <button
                  key={r.key}
                  onClick={() => {
                    setOpenSector(r.key);
                    setMode('industry');
                  }}
                  style={{ background: `rgba(${rgb},${a})` }}
                  className={`rounded-md px-2.5 py-2 text-left min-h-[64px] flex flex-col justify-between hover:brightness-110 ${
                    i < 2 ? 'sm:col-span-2' : ''
                  } ${a > 0.5 ? 'text-white' : 'text-slate-100'}`}
                >
                  <span className="text-[12px] font-medium leading-tight line-clamp-2">{r.label}</span>
                  <span className="font-mono text-[12px]">
                    {r.c > 0 ? '+' : ''}
                    {r.c.toFixed(2)}% <span className="opacity-70">· {r.v.toLocaleString('ko-KR')}억</span>
                  </span>
                </button>
              );
            })}
          </div>
        </Panel>
      )}

      {mode === 'flow' ? (
        flowDays === null ? (
          <p className="text-sm text-slate-500">불러오는 중...</p>
        ) : flowDays.length === 0 ? (
          <p className="text-sm text-slate-500">자금흐름 데이터가 아직 없습니다. 장 마감 뒤 자동으로 채워집니다.</p>
        ) : (
          <>
            <Section title={`테마별 자금 쏠림 (${themeFlowRows.length})`}>
              <FlowList
                rows={themeFlowRows}
                onPick={(key) => {
                  setThemeId(key);
                  setMode('theme');
                }}
              />
            </Section>
            <Section title="업종별 자금 쏠림 (상위 15)">
              <FlowList
                rows={sectorFlowRows}
                onPick={(key) => {
                  setOpenSector(key);
                  setMode('industry');
                }}
              />
            </Section>
          </>
        )
      ) : mode === 'industry' ? (
        <Section title={`업종 (${sectorList.length})`}>
          {sectorList.length === 0 ? (
            <p className="text-sm text-slate-500">불러오는 중...</p>
          ) : (
            <ul className="panel divide-y divide-slate-800 overflow-hidden">
              {sectorList.map((sector) => {
                const isOpen = openSector === sector.name;
                return (
                  <li key={sector.name}>
                    <button
                      onClick={() => setOpenSector(isOpen ? null : sector.name)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-950"
                    >
                      <span className="font-medium text-left">{sector.name}</span>
                      <span className="flex items-center gap-1.5 text-slate-500 text-xs shrink-0 ml-2">
                        {sector.members.length}개 종목
                        <ChevronRight size={14} className={`transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      </span>
                    </button>
                    {isOpen && (
                      <ul className="border-t border-slate-800 divide-y divide-slate-800 bg-slate-950">
                        {sector.members.map((s) => (
                          <li key={s.ticker}>
                            <button
                              onClick={() => setSelected(s)}
                              className="w-full flex items-center justify-between pl-8 pr-4 py-2 text-sm text-left hover:bg-slate-900"
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
        <Section title={`${themeMap.label} 밸류체인`}>
          {themeMaps.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {themeMaps.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setThemeId(t.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border ${
                    themeMap.id === t.id ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-600' : 'border-slate-800 text-slate-500'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <div className="space-y-4">
            {themeMap.groups.map((group) => (
              <div key={group.label}>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">{group.label}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {group.stages.map((stage) => (
                    <div key={stage.label} className="panel px-4 py-3">
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
