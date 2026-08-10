import type { ReactNode } from 'react';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 px-4 py-6 pb-20 max-w-md mx-auto">
      {children}
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">{title}</h2>
      {children}
    </section>
  );
}

export function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-slate-900 rounded-lg px-3 py-2">
      <p className="text-slate-500 text-xs">{label}</p>
      <p className="text-lg font-bold">{value}</p>
    </div>
  );
}
