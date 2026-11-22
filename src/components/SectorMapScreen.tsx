import { useEffect, useState } from 'react';
import { Screen, Section, PageHeader, Panel, TableWrap, Spark } from './ui';
import { loadPriceHistory, type PriceHistory } from '../lib/priceHistory';
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

interface PriceRow {
  ticker: string;
  close: number;
  changePct: number;
  amount?: number | null;
  date: string;
}

interface DayStock {
  ticker: string;
  companyName: string;
  close: number | null;
  changePct: number | null;
  amount: number | null;
}

const STOCK_ROWS = 15;

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

// YYYY-MM-DD의 직전 평일 (공휴일은 모른다 - 공휴일 다음 날은 등락률이 '—'로 남는다).
function prevWeekday(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  do d.setUTCDate(d.getUTCDate() - 1);
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6);
  return d.toISOString().slice(0, 10);
}

// dayIdx 날의 업종 점유율 / 그 이전 날들 점유율 중앙값. 비교할 날이 4일 미만이면 null.
function flowMultipleAt(days: FlowDay[], dayIdx: number, code: string): number | null {
  const today = days[dayIdx]?.sectors[code]?.s;
  if (today == null) return null;
  const past = days.slice(dayIdx + 1).map((d) => d.sectors[code]?.s).filter((v): v is number => typeof v === 'number');
  if (past.length < 4) return null;
  const sorted = [...past].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  return median > 0 ? today / median : null;
}

export default function SectorMapScreen() {
  const [mode, setMode] = useState<Mode>('industry');
  const [sectorMap, setSectorMap] = useState<Record<string, SectorEntry>>({});
  const [themeMaps, setThemeMaps] = useState<ThemeMap[]>([]);
  const [stocks, setStocks] = useState<StockOption[]>([]);
  const [openSector, setOpenSector] = useState<string | null>(null);
  const [dayIdx, setDayIdx] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [prices, setPrices] = useState<PriceRow[]>([]);
  const [history, setHistory] = useState<PriceHistory | null>(null);
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
    fetch('/data/prices.json').then((r) => r.json()).then(setPrices).catch(() => {});
    loadPriceHistory().then(setHistory);
  }, []);

  if (selected) {
    return <CompanyDetailScreen company={selected} onBack={() => setSelected(null)} />;
  }

  const companyByTicker = new Map<string, StockOption>(stocks.map((s) => [s.ticker, s]));

  // KSIC 업종 코드 -> 소속 종목. scripts/generate-sector-map.mjs가 DART induty_code로 미리 뽑아둔 매핑.
  const membersByCode = new Map<string, StockOption[]>();
  for (const stock of stocks) {
    const sector = sectorMap[stock.ticker];
    if (!sector) continue;
    const list = membersByCode.get(sector.code) ?? [];
    list.push(stock);
    membersByCode.set(sector.code, list);
  }

  const themeMap = themeMaps.find((t) => t.id === themeId) ?? themeMaps[0];

  const flowLatest = flowDays?.[0] ?? null;
  const flowHistory = flowDays?.slice(1) ?? [];
  // 히트맵은 날짜를 골라 볼 수 있다 (money-flow.json에 쌓인 최근 거래일들).
  const heatDay = flowDays?.[Math.min(dayIdx, (flowDays?.length ?? 1) - 1)] ?? null;

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

  const heatRows = !heatDay
    ? []
    : Object.keys(heatDay.sectors)
        .map((code) => ({ code, label: sectorNameByCode.get(code) ?? code, ...heatDay.sectors[code] }))
        .sort((a, b) => b.v - a.v)
        .slice(0, 12);
  const activeCode = (openSector && heatRows.find((r) => r.label === openSector)?.code) || heatRows[0]?.code || null;
  const activeRow = heatRows.find((r) => r.code === activeCode) ?? null;

  // 선택한 날 그 업종 종목들의 종가·등락률. 최신일은 prices.json(거래대금 포함),
  // 지난 날은 price-history.json의 전 거래일 종가와 비교해 계산한다 (거래대금은 없음).
  const priceByTicker = new Map<string, PriceRow>(prices.map((p) => [p.ticker, p]));
  const isLatestDay = !!heatDay && heatDay.date === prices[0]?.date;
  const hIdx = heatDay && history ? history.dates.indexOf(heatDay.date) : -1;
  const dayStocks: DayStock[] = (activeCode ? membersByCode.get(activeCode) ?? [] : [])
    .map((st) => {
      if (isLatestDay) {
        const p = priceByTicker.get(st.ticker);
        return { ...st, close: p?.close ?? null, changePct: p?.changePct ?? null, amount: p?.amount ?? null };
      }
      const closes = history?.close[st.ticker];
      const close = hIdx >= 0 ? closes?.[hIdx] ?? null : null;
      // 바로 앞 평일 종가가 기록에 있을 때만 등락률을 계산한다. 중간 날짜가 빠져 있으면
      // 2~3일치 변동이 하루 등락처럼 보이므로 '—'로 둔다.
      const prevOk = hIdx > 0 && history!.dates[hIdx - 1] === prevWeekday(heatDay!.date);
      const prev = prevOk ? closes?.[hIdx - 1] ?? null : null;
      return { ...st, close, changePct: close && prev ? Math.round(((close - prev) / prev) * 10000) / 100 : null, amount: null };
    })
    .sort((a, b) =>
      isLatestDay
        ? (b.amount ?? -1) - (a.amount ?? -1)
        : Math.abs(b.changePct ?? -1) - Math.abs(a.changePct ?? -1) || (b.close ?? -1) - (a.close ?? -1)
    );
  const upCount = dayStocks.filter((d) => (d.changePct ?? 0) > 0).length;
  const downCount = dayStocks.filter((d) => (d.changePct ?? 0) < 0).length;
  const shownStocks = showAll ? dayStocks : dayStocks.slice(0, STOCK_ROWS);
  const activeMultiple = activeRow && heatDay ? flowMultipleAt(flowDays ?? [], dayIdx, activeRow.code) : null;

  return (
    <Screen>
      <PageHeader
        en="SECTOR MAP"
        title="업종 지도"
        sub={mode === 'industry'
            ? '그날 거래대금이 몰린 업종 · 칸을 누르면 관련 종목'
            : mode === 'theme'
              ? '테마의 밸류체인 단계별로 종목 둘러보기 (수작업 정리)'
              : `${flowLatest?.date ?? ''} 종가 기준 · 거래대금이 어느 테마·업종으로 몰렸는지`}
        right={
<div className="inline-flex border border-slate-700 rounded-md overflow-hidden" role="group" aria-label="보기 방식">
        {([
          ['industry', '업종 히트맵'],
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
                  setDayIdx(0);
                  setMode('industry');
                }}
              />
            </Section>
          </>
        )
      ) : mode === 'industry' ? (
        !heatDay ? (
          <p className="text-sm text-slate-500">{flowDays === null ? '불러오는 중...' : '히트맵 데이터가 아직 없습니다. 장 마감 뒤 자동으로 채워집니다.'}</p>
        ) : (
          <div className="grid gap-4 grid-cols-[minmax(0,1fr)]">
            <Panel
              title="업종 히트맵"
              meta={`${heatDay.date} 종가 · 거래대금 상위 12 · 색은 등락률`}
            >
              <div className="flex gap-1.5 overflow-x-auto px-3 pt-3" role="group" aria-label="날짜 선택">
                {(flowDays ?? []).map((d, i) => (
                  <button
                    key={d.date}
                    onClick={() => {
                      setDayIdx(i);
                      setShowAll(false);
                    }}
                    aria-pressed={i === dayIdx}
                    className={`shrink-0 font-mono text-[11.5px] px-2.5 h-7 rounded-full border ${
                      i === dayIdx ? 'bg-cyan-500 text-white border-cyan-500' : 'border-slate-800 text-slate-400 hover:text-slate-100'
                    }`}
                  >
                    {d.date.slice(5).replace('-', '.')}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-1.5 p-3">
                {heatRows.map((r, i) => {
                  const a = Math.min(0.9, 0.14 + Math.abs(r.c) * 0.2);
                  const rgb = r.c > 0 ? '220,38,38' : r.c < 0 ? '37,99,235' : '120,130,150';
                  const active = r.code === activeCode;
                  return (
                    <button
                      key={r.code}
                      onClick={() => {
                        setOpenSector(r.label);
                        setShowAll(false);
                      }}
                      aria-pressed={active}
                      style={{ background: `rgba(${rgb},${a})` }}
                      className={`rounded-md px-2.5 py-2 text-left min-h-[64px] flex flex-col justify-between hover:brightness-110 ${
                        i < 2 ? 'sm:col-span-2' : ''
                      } ${a > 0.5 ? 'text-white' : 'text-slate-100'} ${active ? 'ring-2 ring-offset-1 ring-slate-100' : ''}`}
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

            {activeRow && (
              <Panel title={activeRow.label} meta={`${heatDay.date} 종가 기준`}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800 border-b border-slate-800">
                  {[
                    ['업종 등락률', `${activeRow.c > 0 ? '+' : ''}${activeRow.c.toFixed(2)}%`, activeRow.c > 0 ? 'text-red-600' : activeRow.c < 0 ? 'text-blue-600' : ''],
                    ['거래대금', formatAmount(activeRow.v), ''],
                    ['시장 점유율', `${(activeRow.s * 100).toFixed(1)}%${activeMultiple ? ` · 평소 ×${activeMultiple.toFixed(1)}` : ''}`, activeMultiple && activeMultiple >= 1.5 ? 'text-amber-600' : ''],
                    ['상승 / 하락', `${upCount} / ${downCount}`, ''],
                  ].map(([label, value, tone]) => (
                    <div key={label} className="bg-slate-900 px-4 py-3">
                      <p className="text-[11px] text-slate-500">{label}</p>
                      <p className={`font-mono text-[15px] font-semibold mt-0.5 ${tone}`}>{value}</p>
                    </div>
                  ))}
                </div>
                {dayStocks.length === 0 ? (
                  <p className="px-4 py-6 text-sm text-slate-500">이 업종에 연결된 종목이 없습니다.</p>
                ) : (
                  <>
                    <TableWrap>
                      <thead>
                        <tr>
                          <th>종목</th>
                          <th>종가</th>
                          <th>등락률</th>
                          {isLatestDay && <th>거래대금(억)</th>}
                          <th>20일 추이</th>
                        </tr>
                      </thead>
                      <tbody>
                        {shownStocks.map((d) => (
                          <tr key={d.ticker} className="cursor-pointer hover:bg-slate-950" onClick={() => setSelected({ ticker: d.ticker, companyName: d.companyName })}>
                            <td>
                              <b className="block font-semibold">{d.companyName}</b>
                              <small className="font-mono text-[11px] text-slate-500">{d.ticker}</small>
                            </td>
                            <td className="font-mono">{d.close != null ? d.close.toLocaleString('ko-KR') : '—'}</td>
                            <td className={`font-mono ${d.changePct == null || d.changePct === 0 ? 'text-slate-500' : d.changePct > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                              {d.changePct == null ? '—' : `${d.changePct > 0 ? '▲ ' : d.changePct < 0 ? '▼ ' : ''}${Math.abs(d.changePct).toFixed(2)}%`}
                            </td>
                            {isLatestDay && <td className="font-mono">{d.amount != null ? d.amount.toLocaleString('ko-KR') : '—'}</td>}
                            <td>
                              <Spark values={history?.close[d.ticker]} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </TableWrap>
                    {dayStocks.length > STOCK_ROWS && (
                      <button
                        onClick={() => setShowAll((v) => !v)}
                        className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-2.5 border-t border-slate-800"
                      >
                        {showAll ? '접기' : `${dayStocks.length - STOCK_ROWS}개 종목 더 보기`}
                      </button>
                    )}
                    {!isLatestDay && upCount + downCount === 0 && (
                      <p className="px-4 pt-2 text-[11px] text-amber-600">이 날은 바로 전 거래일 시세가 기록에 없어 종목별 등락률을 계산할 수 없습니다.</p>
                    )}
                    <p className="px-4 py-2 text-[11px] text-slate-500">
                      {isLatestDay ? '거래대금 많은 순' : '등락폭 큰 순 · 지난 날짜는 거래대금 미제공'} · 종목을 누르면 상세 정보 · 투자 권유가 아닙니다.
                    </p>
                  </>
                )}
              </Panel>
            )}
          </div>
        )
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
