import type { ReactNode } from 'react';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 pb-20 md:pb-6 max-w-md sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-6xl mx-auto">
      {children}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-7">
      <h2 className="border-l-2 border-cyan-500 pl-2.5 mb-3.5 text-[13px] font-semibold tracking-wide text-slate-200">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
      <p className="text-slate-500 text-[11px] uppercase tracking-wider">{label}</p>
      <p className="font-mono text-lg font-semibold text-slate-100 mt-0.5">{value}</p>
    </div>
  );
}
