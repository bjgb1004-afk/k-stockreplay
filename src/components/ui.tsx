import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';

/** 화면 본문 컨테이너 - 바깥 셸(App.tsx)이 내비게이션과 폭을 잡으므로
    여기서는 여백과 최대 가독폭만 책임진다. */
export function Screen({ children }: { children: ReactNode }) {
  return <div className="px-4 md:px-8 pt-6 pb-12 max-w-6xl text-slate-100">{children}</div>;
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="flex items-center gap-2 mb-3 text-[13px] font-semibold tracking-tight text-slate-200">
        <span className="w-[3px] h-3.5 rounded-full bg-cyan-500 shrink-0" />
        {title}
      </h2>
      {children}
    </section>
  );
}

/** 요약 지표 칸. StatStrip 안에 나란히 넣는다. */
export function Stat({
  label,
  value,
  active,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <p className="text-slate-300 text-xs">{label}</p>
      <p className="font-mono text-[26px] font-bold leading-tight text-slate-100 mt-0.5">{value}</p>
    </>
  );
  if (!onClick) return <div className="stat-cell">{body}</div>;
  return (
    <button type="button" onClick={onClick} aria-pressed={!!active} className={`stat-cell stat-btn text-left${active ? ' is-active' : ''}`}>
      {body}
    </button>
  );
}

export function StatStrip({ children }: { children: ReactNode }) {
  return <div className="panel stat-strip mb-4">{children}</div>;
}

const chipTone = {
  div: 'bg-emerald-500/10 text-emerald-600',
  agm: 'bg-cyan-500/10 text-cyan-600',
  earn: 'bg-amber-500/10 text-amber-600',
  rel: 'bg-red-500/10 text-red-600',
  dis: 'bg-slate-950 text-slate-300 border border-slate-800',
} as const;

/** 이벤트 종류 라벨 칩 */
export function Chip({ tone, children }: { tone: keyof typeof chipTone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-px text-[11px] font-semibold max-w-full ${chipTone[tone]}`}>
      {children}
    </span>
  );
}

/** 흰 표면 + 얇은 선으로 묶는 카드. 제목 줄이 필요하면 title을 준다. */
export function Panel({ title, meta, children }: { title?: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <section className="panel">
      {title && (
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-800">
          <h2 className="text-[13px] font-semibold text-slate-200">{title}</h2>
          {meta && <span className="ml-auto text-xs text-slate-500">{meta}</span>}
        </div>
      )}
      {children}
    </section>
  );
}

/** 화면 맨 위 제목 줄: 영문 라벨 + 한글 제목 + 설명, 오른쪽에 버튼 등을 둘 수 있다. */
export function PageHeader({ en, title, sub, right }: { en: string; title: string; sub?: ReactNode; right?: ReactNode }) {
  return (
    <header className="flex items-end gap-4 flex-wrap mb-5">
      <div className="min-w-0">
        <p className="font-mono text-[10px] font-semibold tracking-[0.12em] text-slate-500">{en}</p>
        <h1 className="text-[22px] font-bold tracking-tight text-slate-100 text-balance">{title}</h1>
        {sub && <p className="text-[13px] text-slate-300 mt-0.5">{sub}</p>}
      </div>
      {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
    </header>
  );
}

/** 표를 감싼다. 폰에서는 index.css가 이 표를 종목당 한 칸짜리 카드로 바꾼다.
    칸이 5~7개인 표가 390px 화면에 안 들어가 가로로 밀어야 했고, 밀고 나면
    어느 종목의 숫자인지 알 수 없었다. 카드에는 숫자 앞에 항목 이름이 붙어야
    하는데, 표마다 칸 구성이 달라 화면 8곳을 각각 고치는 대신 여기서 헤더
    글자를 읽어 data-label로 넣어 둔다. */
export function TableWrap({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLTableElement>(null);
  useEffect(() => {
    const table = ref.current;
    if (!table) return;
    const labels = [...table.querySelectorAll('thead th')].map((th) => th.textContent?.trim() ?? '');
    table.querySelectorAll('tbody tr').forEach((tr) => {
      // colspan으로 한 칸만 쓰는 안내 행("아직 없습니다" 등)은 라벨을 붙이지 않는다.
      if (tr.children.length !== labels.length) return;
      [...tr.children].forEach((td, i) => {
        if (labels[i]) td.setAttribute('data-label', labels[i]);
      });
    });
  });
  return (
    <div className="overflow-x-auto">
      <table ref={ref} className="data-table">
        {children}
      </table>
    </div>
  );
}

/** 20일 추이 미니 그래프. 처음 대비 마지막이 오르면 빨강, 내리면 파랑 (국내 관례). 점이 2개 미만이면 '—'. */
export function Spark({ values }: { values: (number | null)[] | undefined }) {
  const pts = (values ?? []).filter((v): v is number => typeof v === 'number');
  if (pts.length < 2) return <span className="text-slate-500">—</span>;
  const w = 88;
  const h = 26;
  const min = Math.min(...pts);
  const max = Math.max(...pts);
  const xy = pts.map((v, i) => [(i * w) / (pts.length - 1), h - 2 - ((v - min) / (max - min || 1)) * (h - 4)] as const);
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');
  const delta = pts[pts.length - 1] - pts[0];
  const tone = delta > 0 ? 'text-red-600' : delta < 0 ? 'text-blue-600' : 'text-slate-500';
  const last = xy[xy.length - 1];
  return (
    <svg className={tone} width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`최근 ${pts.length}거래일 추이`}>
      <path d={`${line} L${w} ${h} L0 ${h}Z`} fill="currentColor" opacity=".08" />
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.4" />
      <circle cx={last[0]} cy={last[1]} r="2" fill="currentColor" />
    </svg>
  );
}
