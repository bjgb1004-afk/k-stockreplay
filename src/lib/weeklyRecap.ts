import { getWatchlist } from './watchlistDb';
import { getAllHistory } from './disclosuresDb';

const SHOWN_KEY = 'weeklyRecapShownWeek';

// ISO 8601 주차 - "이번 주에 이미 보여줬는가" 판단용 키일 뿐이라 표준을 정확히
// 지킬 필요는 없고, 같은 주엔 같은 값이 나오기만 하면 된다.
function isoWeekKey(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

export interface WeeklyRecap {
  eventCount: number;
  dividendCount: number;
}

// 서버는 개인별 워치리스트를 모른다(§2-3) - 주간 리캡은 로컬에 이미 쌓여있는
// disclosures 히스토리(TodayScreen이 매일 방문할 때마다 적재)에서 지난 7일치를
// 워치리스트 기준으로 걸러 계산한다. 주 1회, 볼 게 있을 때만 보여준다.
export async function getWeeklyRecapIfDue(): Promise<WeeklyRecap | null> {
  if (localStorage.getItem(SHOWN_KEY) === isoWeekKey(new Date())) return null;

  const watchlist = await getWatchlist();
  if (watchlist.length === 0) return null;

  const watched = new Set(watchlist.map((w) => w.ticker));
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString().slice(0, 10);
  const history = await getAllHistory();
  const recent = history.filter((h) => watched.has(h.ticker) && h.date >= cutoff);
  if (recent.length === 0) return null;

  return {
    eventCount: recent.length,
    dividendCount: recent.filter((h) => h.type === 'DIVIDEND').length,
  };
}

export function markWeeklyRecapShown(): void {
  localStorage.setItem(SHOWN_KEY, isoWeekKey(new Date()));
}
