import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Newspaper, Star, CalendarClock, Landmark, Bell, History, Factory, Search } from 'lucide-react';
import TodayScreen from './components/TodayScreen';
import WatchlistScreen from './components/WatchlistScreen';
import EventsScreen from './components/EventsScreen';
import BigMoneyScreen from './components/BigMoneyScreen';
import AlertScreen from './components/AlertScreen';
import ReplayScreen from './components/ReplayScreen';
import SectorMapScreen from './components/SectorMapScreen';
import { useAlerts } from './lib/useAlerts';
import { updateAppBadge } from './lib/badge';
import { getWatchlist, type WatchlistItem } from './lib/watchlistDb';

// VALUE CHAIN(ValueChainScreen)은 여전히 라우팅에서 뺀 상태 - 공급망/계열 관계는
// DART 공시로 못 뽑아내는 수작업 편집 데이터라, 그 데이터 소스가 생기기 전까진
// 화면 파일만 남겨두고 숨긴다. SECTOR MAP은 DART KSIC 분류로 기계 생성 가능해서 뺐다.
type Tab = 'today' | 'watchlist' | 'sector' | 'whales' | 'events' | 'alerts' | 'replay';

const TAB_IDS: Tab[] = ['today', 'watchlist', 'sector', 'whales', 'events', 'alerts', 'replay'];

function initialTab(): Tab {
  const rawHash = window.location.hash.slice(1);
  const hash = (rawHash === 'dividend' ? 'events' : rawHash) as Tab;
  if (TAB_IDS.includes(hash)) return hash;
  try {
    const savedRaw = localStorage.getItem('ksr-tab');
    const saved = (savedRaw === 'dividend' ? 'events' : savedRaw) as Tab | null;
    if (saved && TAB_IDS.includes(saved)) return saved;
  } catch {
    // 시크릿 모드 등에서 localStorage 접근이 막히는 경우 - 기본 탭으로.
  }
  return 'today';
}

export default function App() {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [query, setQuery] = useState('');
  const { unreadCount } = useAlerts();

  useEffect(() => updateAppBadge(unreadCount), [unreadCount]);

  useEffect(() => {
    try {
      localStorage.setItem('ksr-tab', tab);
    } catch {
      // 저장 실패는 무시 - 탭 상태는 메모리에만 남는다.
    }
  }, [tab]);

  function go(next: Tab) {
    setTab(next);
    window.scrollTo(0, 0);
  }

  // 헤더 검색은 MY STOCK RADAR의 종목 검색과 같은 입력으로 동작한다 -
  // 어느 화면에 있든 바로 종목을 찾아 추가할 수 있게.
  function handleSearch(value: string) {
    setQuery(value);
    if (value.trim() && tab !== 'watchlist') setTab('watchlist');
  }

  const screens: Record<Tab, ReactNode> = {
    today: <TodayScreen />,
    watchlist: <WatchlistScreen initialQuery={query} />,
    sector: <SectorMapScreen />,
    whales: <BigMoneyScreen />,
    events: <EventsScreen />,
    alerts: <AlertScreen />,
    replay: <ReplayScreen />,
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-4 md:gap-5 h-14 px-4">
          <button
            onClick={() => go('today')}
            className="flex items-center gap-2.5 shrink-0 text-left"
            aria-label="K-STOCKREPLAY 홈"
          >
            <LogoMark />
            <span className="leading-tight">
              <span className="block font-mono text-[13px] font-bold tracking-tight text-slate-100">K-STOCKREPLAY</span>
              <span className="hidden sm:block text-[10px] tracking-wide text-slate-500">내 종목의 오늘을 다시 보다</span>
            </span>
          </button>

          <label className="hidden sm:flex relative flex-1 max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              type="search"
              placeholder="종목명 또는 종목코드 (예: 삼성전자, 005930)"
              aria-label="종목 검색"
              className="w-full h-9 rounded-md bg-slate-950 border border-slate-800 pl-8 pr-3 text-[13px] placeholder:text-slate-600 focus:outline-none focus:border-cyan-600"
            />
          </label>

          <MarketStatus />
        </div>
        <Ticker />
      </header>

      <div className="mx-auto max-w-[1440px] md:grid md:grid-cols-[216px_minmax(0,1fr)]">
        {/* 데스크탑(md+) 전용 좌측 사이드바 - 모바일 하단 탭바를 늘린 게 아니라
            웹앱다운 상시 내비게이션으로 따로 만든다. */}
        <aside className="hidden md:flex md:flex-col md:sticky md:top-[92px] md:h-[calc(100vh-92px)] border-r border-slate-800 px-3 py-5 gap-0.5">
          <p className="px-3 pb-2 text-[11px] font-semibold tracking-[0.08em] text-slate-500">메뉴</p>
          <SideTabButton active={tab === 'today'} ko="오늘" en="TODAY" icon={<Newspaper />} onClick={() => go('today')} />
          <SideTabButton active={tab === 'watchlist'} ko="관심종목" en="MY STOCK RADAR" icon={<Star />} onClick={() => go('watchlist')} />
          <SideTabButton active={tab === 'sector'} ko="업종 지도" en="SECTOR MAP" icon={<Factory />} onClick={() => go('sector')} />
          <SideTabButton active={tab === 'whales'} ko="큰손 따라보기" en="BIG MONEY" icon={<Landmark />} onClick={() => go('whales')} />
          <SideTabButton active={tab === 'events'} ko="배당·이벤트" en="EVENTS" icon={<CalendarClock />} onClick={() => go('events')} />
          <SideTabButton active={tab === 'alerts'} ko="알림" en="ALERT" icon={<Bell />} badgeCount={unreadCount} onClick={() => go('alerts')} />
          <SideTabButton active={tab === 'replay'} ko="리플레이" en="REPLAY" icon={<History />} onClick={() => go('replay')} />
          <p className="mt-auto pt-3 px-3 border-t border-slate-800 text-[11px] leading-relaxed text-slate-500">
            데이터 출처: DART 전자공시
            <br />
            투자 판단의 책임은 본인에게 있습니다.
          </p>
        </aside>

        <main className="min-w-0 pb-20 md:pb-0">{screens[tab]}</main>
      </div>

      {/* 모바일 전용 하단 탭바 */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-slate-900 border-t border-slate-800 overflow-x-auto no-scrollbar">
        <div className="grid grid-cols-7">
          <TabButton active={tab === 'today'} label="오늘" icon={<Newspaper />} onClick={() => go('today')} />
          <TabButton active={tab === 'watchlist'} label="관심" icon={<Star />} onClick={() => go('watchlist')} />
          <TabButton active={tab === 'sector'} label="업종" icon={<Factory />} onClick={() => go('sector')} />
          <TabButton active={tab === 'whales'} label="큰손" icon={<Landmark />} onClick={() => go('whales')} />
          <TabButton active={tab === 'events'} label="배당·이벤트" icon={<CalendarClock />} onClick={() => go('events')} />
          <TabButton active={tab === 'alerts'} label="알림" icon={<Bell />} badgeCount={unreadCount} onClick={() => go('alerts')} />
          <TabButton active={tab === 'replay'} label="리플레이" icon={<History />} onClick={() => go('replay')} />
        </div>
      </nav>
    </>
  );
}

function LogoMark() {
  return (
    <span className="w-7 h-7 rounded-md bg-cyan-500 grid place-items-center shrink-0">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="3" height="7" fill="#fff" />
        <path d="M3.5 2v13" stroke="#fff" strokeWidth="1.2" />
        <rect x="7" y="3" width="3" height="6" fill="#fff" opacity=".6" />
        <path d="M8.5 1v11" stroke="#fff" strokeWidth="1.2" opacity=".6" />
        <rect x="12" y="6" width="2.5" height="5" fill="#fff" />
      </svg>
    </span>
  );
}

/** 한국거래소 정규장(평일 09:00~15:30 KST) 기준으로 지금 장중인지 표시한다. */
function MarketStatus() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const { label, open } = useMemo(() => {
    const kst = new Date(now.getTime() + (now.getTimezoneOffset() * 60_000) + 9 * 3_600_000);
    const day = kst.getDay();
    const mins = kst.getHours() * 60 + kst.getMinutes();
    if (day === 0 || day === 6) return { label: '휴장', open: false };
    if (mins < 9 * 60) return { label: '장 전', open: false };
    if (mins > 15 * 60 + 30) return { label: '장 마감', open: false };
    return { label: '장중', open: true };
  }, [now]);

  const stamp = useMemo(() => {
    const kst = new Date(now.getTime() + (now.getTimezoneOffset() * 60_000) + 9 * 3_600_000);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(kst.getMonth() + 1)}.${p(kst.getDate())} ${p(kst.getHours())}:${p(kst.getMinutes())} KST`;
  }, [now]);

  return (
    <div className="ml-auto flex items-center gap-2 shrink-0 text-xs text-slate-300">
      <span className={`w-[7px] h-[7px] rounded-full ${open ? 'bg-emerald-500' : 'bg-slate-600'}`} />
      <span className="hidden lg:inline">{label} ·</span>
      <span className="font-mono text-slate-500">{stamp}</span>
    </div>
  );
}

interface PriceRow {
  ticker: string;
  close: number;
  changePct: number;
}

/** 관심종목 시세 티커 - 실제 수집된 prices.json만 쓰고, 없으면 안내만 띄운다. */
function Ticker() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [prices, setPrices] = useState<Map<string, PriceRow>>(new Map());
  const [indices, setIndices] = useState<{ name: string; close: number; changePct: number }[]>([]);

  useEffect(() => {
    getWatchlist().then(setItems).catch(() => {});
    fetch('/data/prices.json')
      .then((r) => r.json())
      .then((rows: PriceRow[]) => setPrices(new Map(rows.map((r) => [r.ticker, r]))))
      .catch(() => {});
    fetch('/data/indices.json')
      .then((r) => r.json())
      .then(setIndices)
      .catch(() => {});
  }, []);

  const rows = items.map((i) => ({ item: i, price: prices.get(i.ticker) })).filter((r) => r.price);

  return (
    <div className="border-t border-slate-800 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-7 h-9 px-4 text-[12.5px] whitespace-nowrap">
        {indices.map((ix) => {
          const up = ix.changePct > 0;
          const flat = ix.changePct === 0;
          return (
            <span key={ix.name} className="flex items-baseline gap-2">
              <b className="font-semibold text-slate-300">{ix.name}</b>
              <span className="font-mono text-slate-100">{ix.close.toLocaleString('ko-KR', { maximumFractionDigits: 2 })}</span>
              <span className={`font-mono ${flat ? 'text-slate-500' : up ? 'text-red-600' : 'text-blue-600'}`}>
                {flat ? '' : up ? '▲ ' : '▼ '}
                {Math.abs(ix.changePct).toFixed(2)}%
              </span>
            </span>
          );
        })}
        {indices.length > 0 && rows.length > 0 && <span className="text-slate-700">|</span>}
        {rows.length === 0 && indices.length > 0 ? null : rows.length === 0 ? (
          <span className="text-slate-500">관심종목을 추가하면 여기에 시세가 표시됩니다.</span>
        ) : (
          rows.map(({ item, price }) => {
            const up = price!.changePct > 0;
            const flat = price!.changePct === 0;
            return (
              <span key={item.ticker} className="flex items-baseline gap-2">
                <b className="font-semibold text-slate-300">{item.companyName}</b>
                <span className="font-mono text-slate-100">{price!.close.toLocaleString('ko-KR')}</span>
                <span className={`font-mono ${flat ? 'text-slate-500' : up ? 'text-red-600' : 'text-blue-600'}`}>
                  {flat ? '' : up ? '▲ ' : '▼ '}
                  {Math.abs(price!.changePct).toFixed(2)}%
                </span>
              </span>
            );
          })
        )}
      </div>
    </div>
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
      aria-current={active ? 'page' : undefined}
      className={`relative flex flex-col items-center gap-1 py-2 text-[10px] leading-tight text-center px-0.5 ${active ? 'text-cyan-600 font-semibold' : 'text-slate-500'}`}
    >
      {active && <span className="absolute top-0 inset-x-3 h-0.5 rounded-full bg-cyan-500" />}
      <span className="relative [&_svg]:w-4 [&_svg]:h-4">
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
  ko,
  en,
  icon,
  badgeCount,
  onClick,
}: {
  active: boolean;
  ko: string;
  en: string;
  icon: ReactNode;
  badgeCount?: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`flex items-center gap-2.5 w-full rounded-md px-3 py-2.5 text-left ${active ? 'bg-cyan-500/10 text-cyan-600 font-semibold' : 'text-slate-300 hover:bg-slate-950 hover:text-slate-100'}`}
    >
      <span className={`relative shrink-0 [&_svg]:w-[17px] [&_svg]:h-[17px] ${active ? '' : 'opacity-75'}`}>{icon}</span>
      <span className="flex flex-col leading-tight min-w-0">
        <span className="text-[13px] truncate">{ko}</span>
        <span className="font-mono text-[9.5px] tracking-wide text-slate-500 truncate">{en}</span>
      </span>
      {!!badgeCount && (
        <span className="ml-auto font-mono text-[10px] bg-red-500 text-white rounded-full px-1.5 py-0.5 leading-none">
          {badgeCount > 9 ? '9+' : badgeCount}
        </span>
      )}
    </button>
  );
}
