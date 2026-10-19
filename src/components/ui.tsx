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
export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-cell">
      <p className="text-slate-300 text-xs">{label}</p>
      <p className="font-mono text-[26px] font-bold leading-tight text-slate-100 mt-0.5">{value}</p>
    </div>
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
    <span className={`inline-flex items-center rounded px-1.5 py-px text-[11px] font-semibold whitespace-nowrap ${chipTone[tone]}`}>
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

/** 표를 가로 스크롤 영역으로 감싼다. */
export function TableWrap({ children }: { children: ReactNode }) {
  return <div className="overflow-x-auto"><table className="data-table">{children}</table></div>;
}
