import { useEffect, useState, type ReactNode } from 'react';
import { Screen, Panel, Chip, PageHeader, TableWrap } from './ui';

// 큰손 따라보기 - 국내(DART 대량보유상황보고)와 해외(SEC 13F). 두 파일 모두 GitHub Actions가
// 주 1회 만든 정적 JSON이다. 파일이 아직 없으면(첫 수집 전) 안내 문구만 보여준다.

interface KrHolding {
  ticker: string;
  name: string;
  ratio: number;
  delta: number | null;
  date: string;
  reason: string;
  exited: boolean;
  hist: [string, number][];
}
interface KrHolder {
  name: string;
  count: number;
  latestDate: string;
  holdings: KrHolding[];
}
interface KrData {
  updated: string;
  holders: KrHolder[];
}

type UsStatus = 'new' | 'inc' | 'dec' | 'same' | 'sold';
interface UsHolding {
  name: string;
  cusip: string;
  shares: number;
  weight: number | null;
  status: UsStatus;
  changePct: number | null;
  prevWeight?: number | null;
}
interface UsInvestor {
  id: string;
  name: string;
  note?: string;
  period: string;
  filed: string;
  prevPeriod: string | null;
  positions: number;
  holdings: UsHolding[];
  sold: UsHolding[];
}
interface UsData {
  updated: string;
  investors: UsInvestor[];
}

type Tab = 'kr' | 'us';

async function loadJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(path);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

const NOTICE_KR = '공시 기준 정보이며 실제 매매 시점보다 늦게 공개됩니다. 특정 종목의 매수·매도를 권유하는 것이 아닙니다.';
const NOTICE_US =
  '13F는 분기 말 보유 현황을 최대 45일 뒤에 공개합니다. 정확한 매매일과 가격은 알 수 없고, 미국 상장 주식의 롱 포지션만 포함됩니다. 투자 권유가 아닙니다.';

export default function BigMoneyScreen() {
  const [tab, setTab] = useState<Tab>('kr');
  const [kr, setKr] = useState<KrData | null | undefined>(undefined);
  const [us, setUs] = useState<UsData | null | undefined>(undefined);

  useEffect(() => {
    loadJson<KrData>('/data/big-holders-kr.json').then(setKr);
    loadJson<UsData>('/data/big-holders-us.json').then(setUs);
  }, []);

  return (
    <Screen>
      <PageHeader
        en={tab === 'kr' ? 'BIG MONEY' : 'BIG MONEY · 13F'}
        title="큰손 따라보기"
        sub={tab === 'kr' ? '공시로 확인되는 대형 투자자의 보유 현황과 변동' : '미국 SEC 13F 공시로 보는 유명 투자자의 분기별 보유 종목'}
        right={
          <div className="inline-flex" role="tablist" aria-label="국내 또는 해외">
            {(
              [
                ['kr', '국내'],
                ['us', '해외'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={tab === id}
                onClick={() => setTab(id)}
                className={`px-5 h-9 text-[13px] border first:rounded-l-md last:rounded-r-md -ml-px first:ml-0 ${
                  tab === id ? 'bg-cyan-500 text-white border-cyan-500 font-semibold' : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-950'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      <p className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-[13px] leading-relaxed text-amber-700">
        {tab === 'kr' ? NOTICE_KR : NOTICE_US}
      </p>

      {tab === 'kr' ? <KrView data={kr} /> : <UsView data={us} />}
    </Screen>
  );
}

function Empty({ loading }: { loading: boolean }) {
  return (
    <Panel>
      <p className="px-4 py-8 text-sm text-slate-500">
        {loading ? '불러오는 중...' : '아직 수집된 데이터가 없습니다. 매주 자동으로 갱신되며, 첫 수집이 끝나면 여기에 표시됩니다.'}
      </p>
    </Panel>
  );
}

function Cell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="stat-cell">
      <p className="text-slate-300 text-xs">{label}</p>
      <div className="font-mono text-[18px] font-bold leading-tight text-slate-100 mt-0.5">{children}</div>
    </div>
  );
}

function Picker({ items, selected, onPick }: { items: { key: string; title: string; sub: string }[]; selected: string; onPick: (key: string) => void }) {
  return (
    <ul className="divide-y divide-slate-800">
      {items.map((it) => (
        <li key={it.key}>
          <button
            onClick={() => onPick(it.key)}
            aria-pressed={selected === it.key}
            className={`w-full text-left px-4 py-3 border-l-[3px] ${
              selected === it.key ? 'border-cyan-500 bg-cyan-500/10' : 'border-transparent hover:bg-slate-950'
            }`}
          >
            <p className="text-sm font-semibold">{it.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{it.sub}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---- 국내 ----

function KrView({ data }: { data: KrData | null | undefined }) {
  const [holderName, setHolderName] = useState<string | null>(null);
  const [ticker, setTicker] = useState<string | null>(null);
  if (data === undefined) return <Empty loading />;
  if (!data || data.holders.length === 0) return <Empty loading={false} />;

  const holder = data.holders.find((h) => h.name === holderName) ?? data.holders[0];
  const picked = holder.holdings.find((h) => h.ticker === ticker) ?? holder.holdings[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] items-start">
      <Panel title="5% 이상 보유 기관" meta={`${data.updated} 갱신`}>
        <Picker
          items={data.holders.map((h) => ({ key: h.name, title: h.name, sub: `보유 ${h.count}개 종목` }))}
          selected={holder.name}
          onPick={(k) => {
            setHolderName(k);
            setTicker(null);
          }}
        />
      </Panel>

      <div className="space-y-4 min-w-0">
        <div className="panel stat-strip">
          <Cell label="보유자">
            <span className="font-sans text-[16px]">{holder.name}</span>
          </Cell>
          <Cell label="5% 이상 보유 종목">{holder.count}개</Cell>
          <Cell label="최근 변동 보고">{holder.latestDate}</Cell>
        </div>

        <Panel title="보유 종목과 변동" meta="대량보유상황보고서 기준">
          <TableWrap>
            <thead>
              <tr>
                <th>종목</th>
                <th>보유 비율</th>
                <th>직전 보고 대비</th>
                <th>보고 사유</th>
                <th>보고일</th>
              </tr>
            </thead>
            <tbody>
              {holder.holdings.map((h) => (
                <tr
                  key={h.ticker}
                  onClick={() => setTicker(h.ticker)}
                  className={`cursor-pointer ${picked.ticker === h.ticker ? 'bg-cyan-500/5' : ''}`}
                >
                  <td>
                    <b className="font-semibold">{h.name}</b>
                    <small className="block font-mono text-[11px] text-slate-500">{h.ticker}</small>
                  </td>
                  <td className="font-mono">{h.ratio.toFixed(2)}%</td>
                  <td className={`font-mono ${h.delta === null || h.delta === 0 ? 'text-slate-500' : h.delta > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                    {h.delta === null ? '-' : h.delta === 0 ? '변동 없음' : `${h.delta > 0 ? '▲' : '▼'} ${Math.abs(h.delta).toFixed(2)}%p`}
                  </td>
                  <td className="whitespace-normal text-left">
                    {h.exited ? <Chip tone="dis">5% 미만(정리)</Chip> : h.reason ? <Chip tone="agm">{h.reason}</Chip> : '-'}
                  </td>
                  <td className="font-mono">{h.date}</td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
        </Panel>

        <Panel title={`${picked.name} 보유 비율 추이`} meta="점 = 보고서 제출일">
          <HistChart hist={picked.hist} />
          <p className="px-4 pb-3 text-xs text-slate-500">보고 사이의 변화는 알 수 없습니다.</p>
        </Panel>
      </div>
    </div>
  );
}

function HistChart({ hist }: { hist: [string, number][] }) {
  if (hist.length < 2) {
    return <p className="px-4 py-6 text-sm text-slate-500">추이를 그릴 만큼 보고가 쌓이지 않았습니다.</p>;
  }
  const W = 640;
  const H = 150;
  const pad = 14;
  const vals = hist.map((p) => p[1]);
  const lo = Math.min(...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const x = (i: number) => pad + (i * (W - pad * 2)) / (hist.length - 1);
  const y = (v: number) => H - pad - ((v - lo) / span) * (H - pad * 2);
  // 보유 비율은 보고 시점마다 바뀌는 계단형 값이다 - 점 사이를 비스듬히 잇지 않는다.
  const path = hist.map((p, i) => (i === 0 ? `M${x(i)},${y(p[1])}` : `H${x(i)} V${y(p[1])}`)).join(' ');
  return (
    <div className="px-4 pt-3">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`보유 비율 추이: ${hist[0][0]}부터 ${hist[hist.length - 1][0]}까지, ${lo.toFixed(2)}%에서 ${hi.toFixed(2)}% 사이`}>
        <path d={path} fill="none" stroke="var(--c-cyan-500, #0B3D91)" strokeWidth="2.5" strokeLinejoin="round" />
        {hist.map((p, i) => (
          <circle key={p[0] + i} cx={x(i)} cy={y(p[1])} r="3.5" fill="var(--c-cyan-500, #0B3D91)" />
        ))}
      </svg>
      <div className="flex justify-between font-mono text-[11px] text-slate-500 pb-2">
        <span>{hist[0][0]}</span>
        <span>
          {lo.toFixed(2)}% ~ {hi.toFixed(2)}%
        </span>
        <span>{hist[hist.length - 1][0]}</span>
      </div>
    </div>
  );
}

// ---- 해외 ----

const STATUS_LABEL: Record<UsStatus, { text: string; tone: 'div' | 'agm' | 'earn' | 'rel' | 'dis' }> = {
  new: { text: '★ 신규 편입', tone: 'div' },
  inc: { text: '▲ 증가', tone: 'rel' },
  dec: { text: '▼ 감소', tone: 'agm' },
  same: { text: '변동 없음', tone: 'dis' },
  sold: { text: '✕ 전량 매도', tone: 'earn' },
};

function UsView({ data }: { data: UsData | null | undefined }) {
  const [id, setId] = useState<string | null>(null);
  if (data === undefined) return <Empty loading />;
  if (!data || data.investors.length === 0) return <Empty loading={false} />;

  const inv = data.investors.find((i) => i.id === id) ?? data.investors[0];
  const rows = [...inv.holdings, ...inv.sold];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] items-start">
      <Panel title="투자자" meta={`${data.updated} 갱신`}>
        <Picker
          items={data.investors.map((i) => ({ key: i.id, title: i.name, sub: `보유 ${i.positions}개 종목 · ${i.period}` }))}
          selected={inv.id}
          onPick={setId}
        />
      </Panel>

      <div className="space-y-4 min-w-0">
        <div className="panel stat-strip">
          <Cell label="투자자">
            <span className="font-sans text-[16px]">{inv.name}</span>
          </Cell>
          <Cell label="기준 분기말">{inv.period}</Cell>
          <Cell label="보유 종목">{inv.positions}개</Cell>
          <Cell label="제출일">{inv.filed}</Cell>
        </div>
        {inv.note && <p className="text-xs text-slate-500">{inv.note}</p>}

        <Panel title="보유 종목 · 직전 분기 대비" meta={inv.prevPeriod ? `비교 기준 ${inv.prevPeriod}` : '비교할 직전 분기 없음'}>
          <TableWrap>
            <thead>
              <tr>
                <th>종목</th>
                <th>보유 수량</th>
                <th>포트폴리오 비중</th>
                <th>직전 분기 대비</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((h) => {
                const s = STATUS_LABEL[h.status];
                const w = h.status === 'sold' ? 0 : h.weight ?? 0;
                return (
                  <tr key={h.cusip + h.status}>
                    <td className="text-left">
                      <b className="font-semibold">{h.name}</b>
                    </td>
                    <td className="font-mono">{h.shares.toLocaleString('en-US')}</td>
                    <td>
                      <div className="flex items-center gap-2 min-w-[150px]">
                        <div className="flex-1 h-2 rounded bg-slate-800 overflow-hidden">
                          <div className="h-full bg-cyan-500" style={{ width: `${Math.min(100, w * 2)}%` }} />
                        </div>
                        <span className="font-mono text-xs w-12 text-right">{w.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="whitespace-normal text-left">
                      <Chip tone={s.tone}>{s.text}</Chip>
                      {h.changePct !== null && h.status !== 'new' && h.status !== 'sold' && h.status !== 'same' && (
                        <span className="ml-1.5 font-mono text-xs text-slate-500">
                          {h.changePct > 0 ? '+' : ''}
                          {h.changePct}%
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
        </Panel>
      </div>
    </div>
  );
}
