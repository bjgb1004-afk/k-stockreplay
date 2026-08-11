import { supabase } from './supabase';

export type Vote = 'bullish' | 'bearish';

const VOTER_ID_KEY = 'kstockreplay_voter_id';

// 계정이 없는 서비스라(§2-3) 투표는 이 기기 전용 익명 UUID로 식별한다.
// localStorage는 IndexedDB보다 단순한 단일 값이라 이 용도에 더 적합 - 워치리스트
// 같은 구조화된 데이터가 아니라 문자열 하나만 저장하면 된다.
function getVoterId(): string {
  let id = localStorage.getItem(VOTER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(VOTER_ID_KEY, id);
  }
  return id;
}

export interface VoteCounts {
  bullish: number;
  bearish: number;
  myVote: Vote | null;
}

export async function getVoteCounts(ticker: string): Promise<VoteCounts> {
  const voterId = getVoterId();
  const { data, error } = await supabase.from('stock_votes').select('voter_id, vote').eq('ticker', ticker);
  if (error || !data) return { bullish: 0, bearish: 0, myVote: null };

  let bullish = 0;
  let bearish = 0;
  let myVote: Vote | null = null;
  for (const row of data as { voter_id: string; vote: Vote }[]) {
    if (row.vote === 'bullish') bullish++;
    else bearish++;
    if (row.voter_id === voterId) myVote = row.vote;
  }
  return { bullish, bearish, myVote };
}

export async function castVote(ticker: string, vote: Vote): Promise<void> {
  const voterId = getVoterId();
  const { error } = await supabase
    .from('stock_votes')
    .upsert({ ticker, voter_id: voterId, vote, updated_at: new Date().toISOString() }, { onConflict: 'ticker,voter_id' });
  if (error) throw error;
}
