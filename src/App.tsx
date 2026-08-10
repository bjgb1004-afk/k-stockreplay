import { useState, type ReactNode } from 'react';
import { Newspaper, Star, CalendarDays, CalendarClock, Network, Link2 } from 'lucide-react';
import TodayScreen from './components/TodayScreen';
import WatchlistScreen from './components/WatchlistScreen';
import DividendScreen from './components/DividendScreen';
import EventCalendarScreen from './components/EventCalendarScreen';
import ThemeTreeScreen from './components/ThemeTreeScreen';
import ValueChainScreen from './components/ValueChainScreen';

type Tab = 'today' | 'watchlist' | 'dividend' | 'events' | 'themes' | 'valuechain';

const SCREENS: Record<Tab, ReactNode> = {
  today: <TodayScreen />,
  watchlist: <WatchlistScreen />,
  dividend: <DividendScreen />,
  events: <EventCalendarScreen />,
  themes: <ThemeTreeScreen />,
  valuechain: <ValueChainScreen />,
};

export default function App() {
  const [tab, setTab] = useState<Tab>('today');

  return (
    <>
      {SCREENS[tab]}

      <nav className="fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 max-w-md mx-auto">
        <div className="grid grid-cols-6">
          <TabButton active={tab === 'today'} label="TODAY" icon={<Newspaper size={16} />} onClick={() => setTab('today')} />
          <TabButton active={tab === 'watchlist'} label="MY STOCK RADAR" icon={<Star size={16} />} onClick={() => setTab('watchlist')} />
          <TabButton active={tab === 'dividend'} label="DIVIDEND" icon={<CalendarDays size={16} />} onClick={() => setTab('dividend')} />
          <TabButton active={tab === 'events'} label="EVENTS" icon={<CalendarClock size={16} />} onClick={() => setTab('events')} />
          <TabButton active={tab === 'themes'} label="THEME" icon={<Network size={16} />} onClick={() => setTab('themes')} />
          <TabButton active={tab === 'valuechain'} label="CHAIN" icon={<Link2 size={16} />} onClick={() => setTab('valuechain')} />
        </div>
      </nav>
    </>
  );
}

function TabButton({ active, label, icon, onClick }: { active: boolean; label: string; icon: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-0.5 py-2 text-[9px] leading-tight text-center px-0.5 ${active ? 'text-slate-100' : 'text-slate-500'}`}
    >
      {icon}
      {label}
    </button>
  );
}
