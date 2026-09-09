import { useEffect, useMemo, useState } from 'react';
import { Screen, Section, Stat } from './ui';
import { getWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { recordVisit } from '../lib/streakDb';
import { ingestToday, pruneOld, type DisclosureType, type Sentiment } from '../lib/disclosuresDb';
import { getWeeklyRecapIfDue, markWeeklyRecapShown, type WeeklyRecap } from '../lib/weeklyRecap';

type ChangeLevel = 'RED' | 'ORANGE' | 'GREEN';
type FactStatus = 'CONFIRMED' | 'UNCONFIRMED' | 'CONTRADICTED' | 'UNKNOWN';

interface TodayData {
  date: string;
  summary: { newEvents: number; importantFacts: number; dividendEvents: number; relationChanges: number };
  newToday: {
    id: string;
    ticker: string;
    companyName: string;
    type: DisclosureType;
    title: string;
    time: string;
    sentiment: Sentiment;
    meaning: string;
  }[];
  myStockRadar: { ticker: string; companyName: string; changeCount: number; level: ChangeLevel }[];
  upcoming: { tomorrow: { dividend: number; shareholderMeeting: number }; thisWeek: { earnings: number; dividend: number } };
  factChecks: { question: string; status: FactStatus }[];
}

const sentimentDot: Record<Sentiment, string> = {
  POSITIVE: 'bg-emerald-500',
  NEGATIVE: 'bg-red-500',
  MIXED: 'bg-amber-500',
  NEUTRAL: 'bg-slate-600',
};

const levelDot: Record<ChangeLevel, string> = {
  RED: 'bg-red-500',
  ORANGE: 'bg-orange-500',
  GREEN: 'bg-emerald-500',
};

const factStatusStyle: Record<FactStatus, string> = {
  CONFIRMED: 'text-emerald-600',
  UNCONFIRMED: 'text-amber-600',
  CONTRADICTED: 'text-red-600',
  UNKNOWN: 'text-slate-400',
};

const factStatusLabel: Record<FactStatus, string> = {
  CONFIRMED: '🟢 CONFIRMED',
  UNCONFIRMED: '🟡 UNCONFIRMED',
  CONTRADICTED: '🔴 CONTRADICTED',
  UNKNOWN: '⚪ UNKNOWN',
};

export default function TodayScreen() {
  const [data, setData] = useState<TodayData | null>(null);
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [error, setError] = useState(false);
  const [streak, setStreak] = useState<number | null>(null);
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/data/today.json')
      .then((res) => {
        if (!res.ok) throw new Error('failed to load today.json');
        return res.json();
      })
      .then((json: TodayData) => {
        setData(json);
        ingestToday(json.newToday.map((item) => ({ ...item, date: json.date })));
        pruneOld();
      })
      .catch(() => setError(true));
    getWatchlist().then(setWatchlist);
    recordVisit().then(({ currentStreak }) => setStreak(currentStreak));
    getWeeklyRecapIfDue().then(setRecap);
  }, []);

  function dismissRecap() {
    markWeeklyRecapShown();
    setRecap(null);
  }

  // 서버는 유저별 워치리스트를 모른다 (§2-3 로컬 우선 저장) - data.myStockRadar는
  // "오늘 공시 있었던 회사 전체" 목록일 뿐이다. "내 종목 변화"는 로컬 워치리스트가
  // 멤버십의 기준이고, 그 종목이 오늘 피드에 없으면 변화 없음(GREEN)으로 채운다.
  const myRadar = useMemo(() => {
    const feedByTicker = new Map((data?.myStockRadar ?? []).map((s) => [s.ticker, s]));
    return watchlist
      .map((w) => feedByTicker.get(w.ticker) ?? { ticker: w.ticker, companyName: w.companyName, changeCount: 0, level: 'GREEN' as ChangeLevel })
      .sort((a, b) => b.changeCount - a.changeCount);
  }, [data, watchlist]);

  // today.json은 로컬 히스토리 적재를 위해 오늘자 전체를 담고 있어서(위 ingestToday),
  // 화면에 그걸 다 뿌리면 스크롤이 끝없어진다 - 표시만 앞쪽 60개로 자른다.
  const DISPLAY_LIMIT = 60;
  const shownNewToday = data?.newToday.slice(0, DISPLAY_LIMIT) ?? [];
  // 60개를 한 번에 펼치면 그 자체로 지저분해 보여서, 처음엔 한 화면 분량만 보여주고
  // 나머지는 눌러야 나오게 한다.
  const COLLAPSED_COUNT = 9;
  const visibleNewToday = expanded ? shownNewToday : shownNewToday.slice(0, COLLAPSED_COUNT);

  if (error) {
    return (
      <Screen>
        <p className="text-slate-400">오늘의 데이터를 불러오지 못했습니다.</p>
      </Screen>
    );
  }

  if (!data) {
    return (
      <Screen>
        <p className="text-slate-500">불러오는 중...</p>
      </Screen>
    );
  }

  return (
    <Screen>
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold font-mono tracking-tight">TODAY</h1>
          <p className="text-xs text-slate-500">{data.date}</p>
        </div>
        {!!streak && streak > 1 && (
          <span className="text-xs bg-orange-500/15 text-orange-600 rounded-full px-2.5 py-1 shrink-0">
            🔥 {streak}일 연속 방문
          </span>
        )}
      </header>

      {recap && (
        <div className="mb-6 flex items-start justify-between gap-3 bg-cyan-500/10 border border-cyan-500/25 rounded-lg px-3.5 py-3">
          <div>
            <p className="text-sm font-medium text-cyan-600">📬 이번 주 리캡</p>
            <p className="text-xs text-slate-500 mt-1">
              워치리스트에 새 소식 {recap.eventCount}건
              {recap.dividendCount > 0 && ` (배당 이벤트 ${recap.dividendCount}건 포함)`}이 있었습니다.
            </p>
          </div>
          <button onClick={dismissRecap} className="text-slate-400 hover:text-slate-600 text-xs shrink-0">
            닫기
          </button>
        </div>
      )}

      <Section title="🆕 오늘 새로 생긴 것">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-sm">
          <Stat label="새 이벤트" value={data.summary.newEvents} />
          <Stat label="중요 FACT" value={data.summary.importantFacts} />
          <Stat label="배당 이벤트" value={data.summary.dividendEvents} />
          <Stat label="관계 변화" value={data.summary.relationChanges} />
        </div>
        <ul className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {visibleNewToday.map((item) => (
            <li key={item.id} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-100 truncate min-w-0">{item.companyName}</p>
                <span className="font-mono text-[11px] text-slate-500 shrink-0">{item.time}</span>
              </div>
              <p className="text-sm text-slate-300 mt-1 line-clamp-2">{item.title}</p>
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-slate-800">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sentimentDot[item.sentiment]}`} />
                <p className="text-xs text-slate-500 truncate">{item.meaning}</p>
              </div>
            </li>
          ))}
        </ul>
        {shownNewToday.length > COLLAPSED_COUNT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 mt-3 py-1.5"
          >
            {expanded ? '접기' : `${shownNewToday.length - COLLAPSED_COUNT}건 더 보기`}
          </button>
        )}
        {data.newToday.length > shownNewToday.length && (
          <p className="text-xs text-slate-600 mt-2">
            시장 전체 {data.newToday.length}건 중 최신 {shownNewToday.length}건 표시 중 (내 관심종목 변화는 아래에서 빠짐없이 확인 가능)
          </p>
        )}
      </Section>

      <Section title="🔴 내 종목 변화">
        {myRadar.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 관심종목이 없습니다. MY STOCK RADAR 탭에서 추가해보세요.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {myRadar.map((stock) => (
              <li
                key={stock.ticker}
                className="flex items-center justify-between gap-2 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span className={`w-2 h-2 rounded-full shrink-0 ${levelDot[stock.level]}`} />
                  <span className="truncate">{stock.companyName}</span>
                </span>
                <span className="text-slate-500 text-xs shrink-0">
                  {stock.changeCount > 0 ? `${stock.changeCount}건 변화` : '변화 없음'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="📅 앞으로의 투자 일정">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
            <p className="text-slate-500 text-[11px] uppercase tracking-wider">내일</p>
            <p className="mt-0.5 text-slate-100">
              배당 <span className="font-mono font-semibold">{data.upcoming.tomorrow.dividend}</span> · 주총{' '}
              <span className="font-mono font-semibold">{data.upcoming.tomorrow.shareholderMeeting}</span>
            </p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5">
            <p className="text-slate-500 text-[11px] uppercase tracking-wider">이번주</p>
            <p className="mt-0.5 text-slate-100">
              실적 <span className="font-mono font-semibold">{data.upcoming.thisWeek.earnings}</span> · 배당{' '}
              <span className="font-mono font-semibold">{data.upcoming.thisWeek.dividend}</span>
            </p>
          </div>
        </div>
      </Section>

      <Section title="🔎 오늘의 FACT">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {data.factChecks.map((fact) => (
            <li key={fact.question} className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2.5 text-sm">
              <p className="text-slate-300">"{fact.question}"</p>
              <p className={`text-xs mt-1 ${factStatusStyle[fact.status]}`}>{factStatusLabel[fact.status]}</p>
            </li>
          ))}
        </ul>
      </Section>
    </Screen>
  );
}
