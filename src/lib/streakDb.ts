import { withStore } from './db';

const STORE = 'streak';
const ROW_ID = 'streak';

interface StreakRow {
  id: typeof ROW_ID;
  lastVisitDate: string; // YYYY-MM-DD, KST
  currentStreak: number;
  longestStreak: number;
}

function todayKst(): string {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

// 하루에 한 번, 앱을 열 때 호출 - 연속 출석일을 계산해서 저장한다.
// 같은 날 여러 번 열어도 스트릭은 한 번만 올라간다.
export async function recordVisit(): Promise<{ currentStreak: number; longestStreak: number }> {
  const today = todayKst();
  const existing = await withStore<StreakRow | undefined>(STORE, 'readonly', (store) => store.get(ROW_ID));

  let row: StreakRow;
  if (!existing) {
    row = { id: ROW_ID, lastVisitDate: today, currentStreak: 1, longestStreak: 1 };
  } else if (existing.lastVisitDate === today) {
    row = existing;
  } else {
    const gap = daysBetween(existing.lastVisitDate, today);
    const currentStreak = gap === 1 ? existing.currentStreak + 1 : 1;
    row = {
      id: ROW_ID,
      lastVisitDate: today,
      currentStreak,
      longestStreak: Math.max(currentStreak, existing.longestStreak),
    };
  }

  if (!existing || existing.lastVisitDate !== today) {
    await withStore(STORE, 'readwrite', (store) => store.put(row));
  }
  return { currentStreak: row.currentStreak, longestStreak: row.longestStreak };
}
