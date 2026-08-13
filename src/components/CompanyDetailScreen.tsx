import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { Screen, Section } from './ui';
import { addToWatchlist, getWatchlist, removeFromWatchlist, updateThesis, type WatchlistItem } from '../lib/watchlistDb';
import { getVoteCounts, castVote, type Vote, type VoteCounts } from '../lib/votes';
import { getHistoryForTicker, type DisclosureRecord } from '../lib/disclosuresDb';

interface CompanyRef {
  ticker: string;
  companyName: string;
}

const typeLabel: Record<DisclosureRecord['type'], string> = {
  DISCLOSURE: '공시',
  CONTRACT: '계약',
  DIVIDEND: '배당',
  MANAGEMENT_CHANGE: '임원변경',
  INSIDER: '내부자매매',
};

export default function CompanyDetailScreen({ company, onBack }: { company: CompanyRef; onBack: () => void }) {
  const [history, setHistory] = useState<DisclosureRecord[]>([]);
  const [watchlistEntry, setWatchlistEntry] = useState<WatchlistItem | null | undefined>(undefined);

  useEffect(() => {
    // §HISTORY: 서버 스텁이 아니라 방문할 때마다 TodayScreen이 쌓아온 로컬 기록.
    getHistoryForTicker(company.ticker).then(setHistory).catch(() => {});
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

  // getHistoryForTicker가 이미 이 종목으로 필터링 + 최신순 정렬해서 준다.
  const myHistory = history;

  // KST 기준 날짜 표시 - fetch-facts.mjs의 todayKst()와 같은 기준.
  const watchedSince = watchlistEntry
    ? new Date(watchlistEntry.updated_at).toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' })
    : null;
  const daysHeld = watchlistEntry
    ? Math.floor((Date.now() - new Date(watchlistEntry.updated_at).getTime()) / 86_400_000)
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

      {watchedSince && watchlistEntry && (
        <Section title="🛂 COMPANY PASSPORT">
          <div className="space-y-2 text-sm mb-3">
            <Row label="관심종목 등록일" value={watchedSince} />
            <Row label="보유 기간" value={`${daysHeld}일째`} />
          </div>
          <ThesisBox ticker={company.ticker} initialThesis={watchlistEntry.thesis ?? ''} />
          {!!daysHeld && daysHeld >= 90 && (
            <p className="text-xs text-amber-400 mt-2">
              ⏳ {daysHeld}일째 보유 중이에요 - 처음 논리가 아직 유효한지 다시 확인해보세요.
            </p>
          )}
        </Section>
      )}

      <VoteSection ticker={company.ticker} />

      <Section title="📜 HISTORY">
        {myHistory.length === 0 ? (
          <p className="text-sm text-slate-500">아직 기록된 히스토리가 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {myHistory.map((h) => (
              <li key={h.id} className="border-b border-slate-800 pb-2">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-xs text-slate-500 shrink-0 w-20">{h.date}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 rounded px-1.5 py-0.5 shrink-0">{typeLabel[h.type]}</span>
                  <span className="text-slate-200">{h.title}</span>
                </div>
                <p className="text-xs text-slate-500 mt-1 pl-[4.75rem]">{h.meaning}</p>
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

// 매수/관심 논리를 적어두면, 나중에 새 공시가 뜰 때마다(§HISTORY 바로 위) 그 이유를
// 다시 보게 된다 - 자동으로 "이 공시가 논리와 맞는지" 판정하진 않는다(AI 없이는
// 신뢰할 만한 매칭이 안 됨) - 대신 항상 눈에 보이게 해서 사람이 직접 대조하게 한다.
function ThesisBox({ ticker, initialThesis }: { ticker: string; initialThesis: string }) {
  const [text, setText] = useState(initialThesis);

  useEffect(() => setText(initialThesis), [ticker, initialThesis]);

  return (
    <div>
      <label className="text-xs text-slate-500">💭 왜 이 종목을 보고 있나요?</label>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== initialThesis && updateThesis(ticker, text)}
        placeholder="예: 반도체 업황 반등 기대, 신사업 진출 기대..."
        rows={2}
        className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-slate-600 resize-none"
      />
    </div>
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
