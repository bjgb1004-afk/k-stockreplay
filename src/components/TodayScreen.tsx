import { useEffect, useMemo, useState } from 'react';
import { Screen, Stat, StatStrip, Panel, PageHeader, TableWrap, Chip } from './ui';
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
  const [prices, setPrices] = useState<Map<string, { close: number; changePct: number }>>(new Map());

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
    fetch('/data/prices.json')
      .then((r) => r.json())
      .then((rows: { ticker: string; close: number; changePct: number }[]) => setPrices(new Map(rows.map((r) => [r.ticker, r]))))
      .catch(() => {}); // 시세 파일이 아직 없으면 시세 열만 비워둔다.
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

  const typeChip: Record<DisclosureType, { tone: 'div' | 'agm' | 'earn' | 'rel' | 'dis'; label: string }> = {
    DISCLOSURE: { tone: 'dis', label: '공시' },
    CONTRACT: { tone: 'agm', label: '계약' },
    DIVIDEND: { tone: 'div', label: '배당' },
    MANAGEMENT_CHANGE: { tone: 'rel', label: '관계변화' },
    INSIDER: { tone: 'earn', label: '내부자' },
  };
  const sevBar: Record<Sentiment, string> = {
    POSITIVE: 'bg-emerald-500',
    NEGATIVE: 'bg-red-500',
    MIXED: 'bg-amber-500',
    NEUTRAL: 'bg-slate-700',
  };
  const eventsByTicker = new Map<string, DisclosureType>();
  for (const item of data.newToday) if (!eventsByTicker.has(item.ticker)) eventsByTicker.set(item.ticker, item.type);

  return (
    <Screen>
      <PageHeader
        en="TODAY"
        title="오늘"
        sub={`${data.date} · 관심종목 ${watchlist.length}개 기준`}
        right={
          !!streak && streak > 1 ? (
            <span className="text-xs bg-orange-500/15 text-orange-600 rounded px-2.5 py-1">{streak}일 연속 방문</span>
          ) : undefined
        }
      />

      {recap && (
        <div className="mb-4 flex items-start justify-between gap-3 bg-cyan-500/10 border border-cyan-500/25 rounded-md px-4 py-3">
          <div>
            <p className="text-sm font-medium text-cyan-600">이번 주 리캡</p>
            <p className="text-xs text-slate-300 mt-1">
              워치리스트에 새 소식 {recap.eventCount}건
              {recap.dividendCount > 0 && ` (배당 이벤트 ${recap.dividendCount}건 포함)`}이 있었습니다.
            </p>
          </div>
          <button onClick={dismissRecap} className="text-slate-500 hover:text-slate-300 text-xs shrink-0">
            닫기
          </button>
        </div>
      )}

      <StatStrip>
        <Stat label="새 공시" value={data.summary.newEvents} />
        <Stat label="중요 FACT" value={data.summary.importantFacts} />
        <Stat label="배당 이벤트" value={data.summary.dividendEvents} />
        <Stat label="지분·관계 변화" value={data.summary.relationChanges} />
      </StatStrip>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] mb-4">
        <Panel title="내 관심종목" meta="전일 종가 기준">
          {myRadar.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500">아직 관심종목이 없습니다. 관심종목 메뉴에서 추가해보세요.</p>
          ) : (
            <TableWrap>
              <thead>
                <tr>
                  <th>종목</th>
                  <th>현재가</th>
                  <th>등락률</th>
                  <th>오늘 변화</th>
                </tr>
              </thead>
              <tbody>
                {myRadar.map((stock) => {
                  const price = prices.get(stock.ticker);
                  const type = eventsByTicker.get(stock.ticker);
                  return (
                    <tr key={stock.ticker}>
                      <td>
                        <b className="block font-semibold">{stock.companyName}</b>
                        <small className="font-mono text-[11px] text-slate-500">{stock.ticker}</small>
                      </td>
                      <td className="font-mono">{price ? price.close.toLocaleString('ko-KR') : '—'}</td>
                      <td className={`font-mono ${!price || price.changePct === 0 ? 'text-slate-500' : price.changePct > 0 ? 'text-red-600' : 'text-blue-600'}`}>
                        {price ? `${price.changePct > 0 ? '▲ ' : price.changePct < 0 ? '▼ ' : ''}${Math.abs(price.changePct).toFixed(2)}%` : '—'}
                      </td>
                      <td>
                        {stock.changeCount > 0 ? (
                          <Chip tone={type ? typeChip[type].tone : 'dis'}>{type ? typeChip[type].label : '공시'} {stock.changeCount}건</Chip>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </TableWrap>
          )}
        </Panel>

        <div className="grid gap-4 content-start">
          <Panel title="다가오는 일정" meta="이번 주">
            <ul className="divide-y divide-slate-800 text-sm">
              <li className="flex items-center justify-between px-4 py-3">
                <span className="text-slate-300">내일</span>
                <span>
                  배당 <b className="font-mono">{data.upcoming.tomorrow.dividend}</b> · 주총{' '}
                  <b className="font-mono">{data.upcoming.tomorrow.shareholderMeeting}</b>
                </span>
              </li>
              <li className="flex items-center justify-between px-4 py-3">
                <span className="text-slate-300">이번주</span>
                <span>
                  실적 <b className="font-mono">{data.upcoming.thisWeek.earnings}</b> · 배당{' '}
                  <b className="font-mono">{data.upcoming.thisWeek.dividend}</b>
                </span>
              </li>
            </ul>
          </Panel>
          <Panel title="오늘의 FACT" meta="공시 기반 확인">
            {data.factChecks.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-500">오늘 확인할 FACT가 없습니다.</p>
            ) : (
              <ul className="divide-y divide-slate-800">
                {data.factChecks.map((fact) => (
                  <li key={fact.question} className="px-4 py-3 text-sm">
                    <p className="text-slate-100">"{fact.question}"</p>
                    <p className={`text-xs mt-1 ${factStatusStyle[fact.status]}`}>{factStatusLabel[fact.status]}</p>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <Panel title="오늘 새로 생긴 공시" meta={`시장 전체 ${data.newToday.length}건 · 출처 DART`}>
        <ul className="divide-y divide-slate-800">
          {visibleNewToday.map((item) => (
            <li
              key={item.id}
              className="grid grid-cols-[4px_minmax(0,1fr)_auto] sm:grid-cols-[4px_52px_minmax(0,1fr)_auto] gap-3 items-start px-4 py-3"
            >
              <span className={`self-stretch rounded-sm ${sevBar[item.sentiment]}`} />
              <time className="hidden sm:block font-mono text-xs text-slate-500 pt-px">{item.time || '—'}</time>
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-100 line-clamp-2">
                  {item.companyName} · {item.title}
                </p>
                <p className="text-xs text-slate-300 mt-0.5 flex items-center gap-2 flex-wrap">
                  <Chip tone={typeChip[item.type].tone}>{typeChip[item.type].label}</Chip>
                  {item.meaning}
                </p>
              </div>
              <a
                href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-slate-500 border-b border-dotted border-slate-500 hover:text-slate-300 whitespace-nowrap"
              >
                DART 원문
              </a>
            </li>
          ))}
        </ul>
        {shownNewToday.length > COLLAPSED_COUNT && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="w-full text-center text-xs text-slate-500 hover:text-slate-300 py-2.5 border-t border-slate-800"
          >
            {expanded ? '접기' : `${shownNewToday.length - COLLAPSED_COUNT}건 더 보기`}
          </button>
        )}
      </Panel>
    </Screen>
  );
}
