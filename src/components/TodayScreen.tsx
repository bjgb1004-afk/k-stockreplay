import { useEffect, useMemo, useState } from 'react';
import { Screen, Section, Stat } from './ui';
import { getWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { recordVisit } from '../lib/streakDb';
import { ingestToday, pruneOld, type DisclosureType } from '../lib/disclosuresDb';

type ChangeLevel = 'RED' | 'ORANGE' | 'GREEN';
type FactStatus = 'CONFIRMED' | 'UNCONFIRMED' | 'CONTRADICTED' | 'UNKNOWN';

interface TodayData {
  date: string;
  summary: { newEvents: number; importantFacts: number; dividendEvents: number; relationChanges: number };
  newToday: { id: string; ticker: string; companyName: string; type: DisclosureType; title: string; time: string }[];
  myStockRadar: { ticker: string; companyName: string; changeCount: number; level: ChangeLevel }[];
  upcoming: { tomorrow: { dividend: number; shareholderMeeting: number }; thisWeek: { earnings: number; dividend: number } };
  factChecks: { question: string; status: FactStatus }[];
}

const levelDot: Record<ChangeLevel, string> = {
  RED: 'bg-red-500',
  ORANGE: 'bg-orange-500',
  GREEN: 'bg-emerald-500',
};

const factStatusStyle: Record<FactStatus, string> = {
  CONFIRMED: 'text-emerald-400',
  UNCONFIRMED: 'text-amber-400',
  CONTRADICTED: 'text-red-400',
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
  }, []);

  // 서버는 유저별 워치리스트를 모른다 (§2-3 로컬 우선 저장) - data.myStockRadar는
  // "오늘 공시 있었던 회사 전체" 목록일 뿐이다. "내 종목 변화"는 로컬 워치리스트가
  // 멤버십의 기준이고, 그 종목이 오늘 피드에 없으면 변화 없음(GREEN)으로 채운다.
  const myRadar = useMemo(() => {
    const feedByTicker = new Map((data?.myStockRadar ?? []).map((s) => [s.ticker, s]));
    return watchlist
      .map((w) => feedByTicker.get(w.ticker) ?? { ticker: w.ticker, companyName: w.companyName, changeCount: 0, level: 'GREEN' as ChangeLevel })
      .sort((a, b) => b.changeCount - a.changeCount);
  }, [data, watchlist]);

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
          <h1 className="text-lg font-bold">TODAY</h1>
          <p className="text-xs text-slate-500">{data.date}</p>
        </div>
        {!!streak && streak > 1 && (
          <span className="text-xs bg-orange-500/15 text-orange-400 rounded-full px-2.5 py-1 shrink-0">
            🔥 {streak}일 연속 방문
          </span>
        )}
      </header>

      <Section title="🆕 오늘 새로 생긴 것">
        <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
          <Stat label="새 이벤트" value={data.summary.newEvents} />
          <Stat label="중요 FACT" value={data.summary.importantFacts} />
          <Stat label="배당 이벤트" value={data.summary.dividendEvents} />
          <Stat label="관계 변화" value={data.summary.relationChanges} />
        </div>
        <ul className="space-y-2">
          {data.newToday.map((item) => (
            <li key={item.id} className="flex items-center justify-between text-sm border-b border-slate-800 pb-2">
              <div>
                <span className="font-medium">{item.companyName}</span>
                <span className="text-slate-400 ml-2">{item.title}</span>
              </div>
              <span className="text-slate-500 text-xs shrink-0 ml-2">{item.time}</span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="🔴 내 종목 변화">
        {myRadar.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 관심종목이 없습니다. MY STOCK RADAR 탭에서 추가해보세요.
          </p>
        ) : (
          <ul className="space-y-2">
            {myRadar.map((stock) => (
              <li key={stock.ticker} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${levelDot[stock.level]}`} />
                  {stock.companyName}
                </span>
                <span className="text-slate-400">
                  {stock.changeCount > 0 ? `${stock.changeCount}건 변화` : '변화 없음'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="📅 앞으로의 투자 일정">
        <div className="text-sm space-y-1">
          <p><span className="text-slate-400">내일</span> 배당 {data.upcoming.tomorrow.dividend} · 주총 {data.upcoming.tomorrow.shareholderMeeting}</p>
          <p><span className="text-slate-400">이번주</span> 실적 {data.upcoming.thisWeek.earnings} · 배당 {data.upcoming.thisWeek.dividend}</p>
        </div>
      </Section>

      <Section title="🔎 오늘의 FACT">
        <ul className="space-y-2">
          {data.factChecks.map((fact) => (
            <li key={fact.question} className="text-sm">
              <p className="text-slate-300">"{fact.question}"</p>
              <p className={`text-xs mt-0.5 ${factStatusStyle[fact.status]}`}>{factStatusLabel[fact.status]}</p>
            </li>
          ))}
        </ul>
      </Section>
    </Screen>
  );
}
