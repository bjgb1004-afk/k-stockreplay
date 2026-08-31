import { useEffect, useState, type ReactNode } from 'react';
import { Newspaper, Star, CalendarDays, CalendarClock, Bell, History } from 'lucide-react';
import TodayScreen from './components/TodayScreen';
import WatchlistScreen from './components/WatchlistScreen';
import DividendScreen from './components/DividendScreen';
import EventCalendarScreen from './components/EventCalendarScreen';
import AlertScreen from './components/AlertScreen';
import ReplayScreen from './components/ReplayScreen';
import { useAlerts } from './lib/useAlerts';
import { updateAppBadge } from './lib/badge';

// THEME/CHAIN(ThemeTreeScreen, ValueChainScreen)은 실데이터로 연결할 방법이 없어서
// 라우팅에서 뺐다 - 종목-테마/공급망 관계는 DART 공시로 못 뽑아내는 수작업 편집
// 데이터라, 그 데이터 소스가 생기기 전까진 화면 파일만 남겨두고 숨긴다.
type Tab = 'today' | 'watchlist' | 'dividend' | 'events' | 'alerts' | 'replay';

const SCREENS: Record<Tab, ReactNode> = {
  today: <TodayScreen />,
  watchlist: <WatchlistScreen />,
  dividend: <DividendScreen />,
  events: <EventCalendarScreen />,
  alerts: <AlertScreen />,
  replay: <ReplayScreen />,
};

export default function App() {
  const [tab, setTab] = useState<Tab>('today');
  const { unreadCount } = useAlerts();

  useEffect(() => updateAppBadge(unreadCount), [unreadCount]);

  return (
    <>
      {/* 데스크탑(md+) 전용 우측 사이드바 - 모바일 하단 탭바를 그대로 늘린 게 아니라
          웹앱다운 상시 내비게이션으로 따로 만든다. */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:right-0 md:w-52 bg-slate-950 border-l border-slate-800 py-6 px-3 gap-1">
        <p className="px-3 pb-4 text-sm font-bold text-slate-100">K-STOCKREPLAY</p>
        <SideTabButton active={tab === 'today'} label="TODAY" icon={<Newspaper />} onClick={() => setTab('today')} />
        <SideTabButton active={tab === 'watchlist'} label="MY STOCK RADAR" icon={<Star />} onClick={() => setTab('watchlist')} />
        <SideTabButton active={tab === 'dividend'} label="DIVIDEND" icon={<CalendarDays />} onClick={() => setTab('dividend')} />
        <SideTabButton active={tab === 'events'} label="EVENTS" icon={<CalendarClock />} onClick={() => setTab('events')} />
        <SideTabButton active={tab === 'alerts'} label="ALERT" icon={<Bell />} badgeCount={unreadCount} onClick={() => setTab('alerts')} />
        <SideTabButton active={tab === 'replay'} label="REPLAY" icon={<History />} onClick={() => setTab('replay')} />
      </aside>

      <div className="md:pr-52">{SCREENS[tab]}</div>

      {/* 모바일 전용 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800 max-w-md mx-auto overflow-x-auto">
        <div className="grid grid-cols-6 min-w-[420px]">
          <TabButton active={tab === 'today'} label="TODAY" icon={<Newspaper size={16} />} onClick={() => setTab('today')} />
          <TabButton active={tab === 'watchlist'} label="MY STOCK RADAR" icon={<Star size={16} />} onClick={() => setTab('watchlist')} />
          <TabButton active={tab === 'dividend'} label="DIVIDEND" icon={<CalendarDays size={16} />} onClick={() => setTab('dividend')} />
          <TabButton active={tab === 'events'} label="EVENTS" icon={<CalendarClock size={16} />} onClick={() => setTab('events')} />
          <TabButton active={tab === 'alerts'} label="ALERT" icon={<Bell size={16} />} badgeCount={unreadCount} onClick={() => setTab('alerts')} />
          <TabButton active={tab === 'replay'} label="REPLAY" icon={<History size={16} />} onClick={() => setTab('replay')} />
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
      className={`relative flex flex-col items-center gap-0.5 py-2 text-[9px] leading-tight text-center px-0.5 ${active ? 'text-cyan-400' : 'text-slate-500'}`}
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

function SideTabButton({
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
      className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-left ${active ? 'bg-slate-800 text-cyan-400' : 'text-slate-400 hover:text-slate-200'}`}
    >
      <span className="relative [&_svg]:w-[18px] [&_svg]:h-[18px]">
        {icon}
        {!!badgeCount && (
          <span className="absolute -top-1.5 -right-2 bg-red-500 text-white text-[9px] leading-none rounded-full min-w-[15px] h-[15px] flex items-center justify-center px-0.5">
            {badgeCount > 9 ? '9+' : badgeCount}
          </span>
        )}
      </span>
      {label}
    </button>
  );
}
