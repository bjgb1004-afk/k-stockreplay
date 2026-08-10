import { useState, type ReactNode } from 'react';
import { Newspaper, Star } from 'lucide-react';
import TodayScreen from './components/TodayScreen';
import WatchlistScreen from './components/WatchlistScreen';

type Tab = 'today' | 'watchlist';

export default function App() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <>
      {tab === 'today' ? <TodayScreen /> : <WatchlistScreen />}

      <nav className="fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 max-w-md mx-auto">
        <div className="grid grid-cols-2">
          <TabButton active={tab === 'today'} label="TODAY" icon={<Newspaper size={18} />} onClick={() => setTab('today')} />
          <TabButton active={tab === 'watchlist'} label="MY STOCK RADAR" icon={<Star size={18} />} onClick={() => setTab('watchlist')} />
        </div>
      </nav>
    </>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 py-2.5 text-xs ${active ? 'text-slate-100' : 'text-slate-500'}`}
    >
      {icon}
      {label}
    </button>
  );
}
