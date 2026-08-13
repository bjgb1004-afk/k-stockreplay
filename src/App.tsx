import { useEffect, useState, type ReactNode } from 'react';
import { Newspaper, Star, CalendarDays, CalendarClock, Bell } from 'lucide-react';
import TodayScreen from './components/TodayScreen';
import WatchlistScreen from './components/WatchlistScreen';
import DividendScreen from './components/DividendScreen';
import EventCalendarScreen from './components/EventCalendarScreen';
import AlertScreen from './components/AlertScreen';
import { useAlerts } from './lib/useAlerts';
import { updateAppBadge } from './lib/badge';

// THEME/CHAIN(ThemeTreeScreen, ValueChainScreen)은 실데이터로 연결할 방법이 없어서
// 라우팅에서 뺐다 - 종목-테마/공급망 관계는 DART 공시로 못 뽑아내는 수작업 편집
// 데이터라, 그 데이터 소스가 생기기 전까진 화면 파일만 남겨두고 숨긴다.
type Tab = 'today' | 'watchlist' | 'dividend' | 'events' | 'alerts';

const SCREENS: Record<Tab, ReactNode> = {
  today: <TodayScreen />,
  watchlist: <WatchlistScreen />,
  dividend: <DividendScreen />,
  events: <EventCalendarScreen />,
  alerts: <AlertScreen />,
};

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const { unreadCount } = useAlerts();

  useEffect(() => updateAppBadge(unreadCount), [unreadCount]);

  return (
    <>
      {SCREENS[tab]}

      <nav className="fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 max-w-md mx-auto overflow-x-auto">
        <div className="grid grid-cols-5 min-w-[360px]">
          <TabButton active={tab === 'today'} label="TODAY" icon={<Newspaper size={16} />} onClick={() => setTab('today')} />
          <TabButton active={tab === 'watchlist'} label="MY STOCK RADAR" icon={<Star size={16} />} onClick={() => setTab('watchlist')} />
          <TabButton active={tab === 'dividend'} label="DIVIDEND" icon={<CalendarDays size={16} />} onClick={() => setTab('dividend')} />
          <TabButton active={tab === 'events'} label="EVENTS" icon={<CalendarClock size={16} />} onClick={() => setTab('events')} />
          <TabButton active={tab === 'alerts'} label="ALERT" icon={<Bell size={16} />} badgeCount={unreadCount} onClick={() => setTab('alerts')} />
        </div>
      </nav>
    </>
  );
}

function TabButton({
  active,
  label,
  icon,
  badgeCount,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: ReactNode;
  badgeCount?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex flex-col items-center gap-0.5 py-2 text-[9px] leading-tight text-center px-0.5 ${active ? 'text-slate-100' : 'text-slate-500'}`}
    >
      <span className="relative">
        {icon}
        {!!badgeCount && (
          <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[8px] leading-none rounded-full min-w-[14px] h-[14px] flex items-center justify-center px-0.5">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </span>
      {label}
    </button>
  );
}
