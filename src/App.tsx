import { useState, type ReactNode } from 'react';
import { Newspaper, Star, CalendarDays } from 'lucide-react';
import TodayScreen from './components/TodayScreen';
import WatchlistScreen from './components/WatchlistScreen';
import DividendScreen from './components/DividendScreen';

type Tab = 'today' | 'watchlist' | 'dividend';

const SCREENS: Record<Tab, ReactNode> = {
  today: <TodayScreen />,
  watchlist: <WatchlistScreen />,
  dividend: <DividendScreen />,
};

export default function App() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <>
      {SCREENS[tab]}

      <nav className="fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 max-w-md mx-auto">
        <div className="grid grid-cols-3">
          <TabButton active={tab === 'today'} label="TODAY" icon={<Newspaper size={18} />} onClick={() => setTab('today')} />
          <TabButton active={tab === 'watchlist'} label="MY STOCK RADAR" icon={<Star size={18} />} onClick={() => setTab('watchlist')} />
          <TabButton active={tab === 'dividend'} label="DIVIDEND" icon={<CalendarDays size={18} />} onClick={() => setTab('dividend')} />
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
