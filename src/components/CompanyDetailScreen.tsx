import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Screen, Section } from './ui';
import { daysUntil, ddayLabel } from '../lib/date';
import { addToWatchlist, getWatchlist, removeFromWatchlist, type WatchlistItem } from '../lib/watchlistDb';
import { getVoteCounts, castVote, type Vote, type VoteCounts } from '../lib/votes';

interface CompanyRef {
  ticker: string;
  companyName: string;
}

interface DividendEvent {
  ticker: string;
  exDividendDate: string;
  dividendPerShare: number;
  cycle: string;
}

interface InvestmentEvent {
  ticker: string;
  eventDate: string;
  title: string;
}

interface HistoryEntry {
  ticker: string;
  date: string;
  type: 'DISCLOSURE' | 'CONTRACT' | 'DIVIDEND' | 'MANAGEMENT_CHANGE';
  title: string;
}

const typeLabel: Record<HistoryEntry['type'], string> = {
  DISCLOSURE: '공시',
  CONTRACT: '계약',
  DIVIDEND: '배당',
  MANAGEMENT_CHANGE: '임원변경',
};

export default function CompanyDetailScreen({ company, onBack }: { company: CompanyRef; onBack: () => void }) {
  const [dividends, setDividends] = useState<DividendEvent[]>([]);
  const [events, setEvents] = useState<InvestmentEvent[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [watchlistEntry, setWatchlistEntry] = useState<WatchlistItem | null | undefined>(undefined);

  useEffect(() => {
    fetch('/data/dividends.json').then((r) => r.json()).then(setDividends).catch(() => {});
    fetch('/data/events.json').then((r) => r.json()).then(setEvents).catch(() => {});
    fetch('/data/history.json').then((r) => r.json()).then(setHistory).catch(() => {});
    refreshWatchlistEntry();
  }, [company.ticker]);

  function refreshWatchlistEntry() {
    getWatchlist().then((list) => setWatchlistEntry(list.find((w) => w.ticker === company.ticker) ?? null));
  }

  async function handleToggleWatch() {
    if (watchlistEntry) {
      await removeFromWatchlist(company.ticker);
    } else {
      await addToWatchlist(company.ticker, company.companyName);
    }
    refreshWatchlistEntry();
  }

  const nextDividend = dividends
    .filter((d) => d.ticker === company.ticker && daysUntil(d.exDividendDate) >= 0)
    .sort((a, b) => a.exDividendDate.localeCompare(b.exDividendDate))[0];

  const nextEvent = events
    .filter((e) => e.ticker === company.ticker && daysUntil(e.eventDate) >= 0)
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))[0];

  const myHistory = history
    .filter((h) => h.ticker === company.ticker)
    .sort((a, b) => b.date.localeCompare(a.date));

  // KST 기준 날짜 표시 - fetch-facts.mjs의 todayKst()와 같은 기준.
  const watchedSince = watchlistEntry
    ? new Date(watchlistEntry.updated_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
    : null;

  return (
    <Screen>
      <header className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} aria-label="뒤로" className="text-slate-400 hover:text-slate-100 -ml-1 p-1">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-bold">{company.companyName}</h1>
            <p className="text-xs text-slate-500">{company.ticker}</p>
          </div>
        </div>
        {watchlistEntry !== undefined && (
          <button
            onClick={handleToggleWatch}
            className={`text-xs rounded-full px-3 py-1.5 shrink-0 ${
              watchlistEntry ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'
            }`}
          >
            {watchlistEntry ? '관심종목에서 삭제' : '+ 관심종목 추가'}
          </button>
        )}
      </header>

      <Section title="🛂 COMPANY PASSPORT">
        <div className="space-y-2 text-sm">
          {watchedSince && <Row label="관심종목 등록일" value={watchedSince} />}
          <Row label="다음 배당" value={nextDividend ? `${nextDividend.exDividendDate} (${ddayLabel(daysUntil(nextDividend.exDividendDate))}) · 주당 ${nextDividend.dividendPerShare.toLocaleString()}원` : '예정된 배당 없음'} />
          <Row label="다음 일정" value={nextEvent ? `${nextEvent.title} · ${nextEvent.eventDate} (${ddayLabel(daysUntil(nextEvent.eventDate))})` : '예정된 일정 없음'} />
        </div>
      </Section>

      <VoteSection ticker={company.ticker} />

      <Section title="📜 HISTORY">
        {myHistory.length === 0 ? (
          <p className="text-sm text-slate-500">아직 기록된 히스토리가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {myHistory.map((h, i) => (
              <li key={`${h.date}-${i}`} className="flex items-start gap-2 text-sm border-b border-slate-800 pb-2">
                <span className="text-xs text-slate-500 shrink-0 w-20">{h.date}</span>
                <span className="text-xs bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 shrink-0">{typeLabel[h.type]}</span>
                <span className="text-slate-200">{h.title}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </Screen>
  );
}

function VoteSection({ ticker }: { ticker: string }) {
  const [counts, setCounts] = useState<VoteCounts | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    setCounts(null);
    setError(false);
    getVoteCounts(ticker).then(setCounts);
  }, [ticker]);

  async function handleVote(vote: Vote) {
    setBusy(true);
    try {
      await castVote(ticker, vote);
      setCounts(await getVoteCounts(ticker));
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  const total = (counts?.bullish ?? 0) + (counts?.bearish ?? 0);
  const bullishPct = total > 0 ? Math.round(((counts?.bullish ?? 0) / total) * 100) : 50;

  return (
    <Section title="📊 Bullish / Bearish 투표">
      {error && <p className="text-xs text-red-400 mb-2">아직 서버에 설정되지 않았습니다.</p>}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => handleVote('bullish')}
          disabled={busy}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm disabled:opacity-50 ${
            counts?.myVote === 'bullish' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <TrendingUp size={16} /> Bullish
        </button>
        <button
          onClick={() => handleVote('bearish')}
          disabled={busy}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm disabled:opacity-50 ${
            counts?.myVote === 'bearish' ? 'bg-red-500/20 text-red-400' : 'bg-slate-900 text-slate-300'
          }`}
        >
          <TrendingDown size={16} /> Bearish
        </button>
      </div>
      {total > 0 && (
        <div>
          <div className="h-1.5 rounded-full bg-red-500/30 overflow-hidden">
            <div className="h-full bg-emerald-500" style={{ width: `${bullishPct}%` }} />
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Bullish {bullishPct}% · 총 {total}표
          </p>
        </div>
      )}
    </Section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2">
      <span className="text-slate-500 text-xs">{label}</span>
      <span className="text-slate-200 text-xs text-right ml-2">{value}</span>
    </div>
  );
}
