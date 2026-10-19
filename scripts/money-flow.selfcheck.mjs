// Pins down the money-flow maths without hitting data.go.kr: turnover-weighted
// change (not a plain average), share summing to 1 across sectors, and the
// 20-day history trim that keeps public/data/money-flow.json small.
//
// Usage: node scripts/money-flow.selfcheck.mjs

import assert from 'node:assert/strict';
import { aggregateMoneyFlow, mergeHistory } from './fetch-prices.mjs';

const rows = [
  { srtnCd: '000001', trPrc: '900000000000', fltRt: '2.0' }, // 9,000억, 반도체 + 섹터 A
  { srtnCd: '000002', trPrc: '100000000000', fltRt: '-8.0' }, // 1,000억, 반도체 + 섹터 B
  { srtnCd: '000003', trPrc: '0', fltRt: '5.0' }, // 거래정지 - 버려져야 한다
  { srtnCd: '000004', trPrc: 'N/A', fltRt: '1.0' }, // 깨진 값 - 버려져야 한다
];
const sectorMap = {
  '000001': { code: 'A', name: '가나업' },
  '000002': { code: 'B', name: '다라업' },
  '000003': { code: 'A', name: '가나업' },
  '000009': { code: 'C', name: '없는업' }, // 응답에 없는 종목 - 섹터 자체가 빠져야 한다
};
const themeMaps = [
  {
    id: 'semi',
    label: '반도체',
    groups: [{ label: '설계', stages: [{ label: '팹리스', tickers: ['000001', '000002', '000001'] }] }],
  },
  { id: 'empty', label: '빈테마', groups: [{ label: 'x', stages: [{ label: 'y', tickers: ['999999'] }] }] },
];

const day = aggregateMoneyFlow(rows, { sectorMap, themeMaps, date: '2026-09-16' });

assert.equal(day.total, 10000); // 1조 = 10,000억 (0원/NaN 행은 제외)
assert.equal(day.themes.semi.v, 10000); // 티커 중복은 Set으로 한 번만 계산
assert.equal(day.themes.semi.s, 1);
assert.equal(day.themes.semi.c, 1); // 가중평균 (0.9*2 + 0.1*-8) = 1.0, 단순평균이면 -3.0
assert.equal(day.themes.empty, undefined); // 거래대금 0인 테마는 아예 안 싣는다
assert.deepEqual(Object.keys(day.sectors).sort(), ['A', 'B']); // 응답에 없는 섹터 C 제외
assert.equal(day.sectors.A.v, 9000);
assert.equal(day.sectors.A.s, 0.9);
assert.equal(day.sectors.B.c, -8);
const shareSum = Object.values(day.sectors).reduce((sum, s) => sum + s.s, 0);
assert.ok(Math.abs(shareSum - 1) < 1e-6, `sector shares must sum to 1, got ${shareSum}`);

assert.throws(() => aggregateMoneyFlow([{ srtnCd: 'x', trPrc: '0' }], { sectorMap, themeMaps, date: '2026-09-16' }));

// 히스토리: 최신순, 같은 날짜는 덮어쓰기, keepDays 초과분은 잘라낸다.
let history = null;
for (const date of ['2026-09-14', '2026-09-15', '2026-09-16']) {
  history = mergeHistory(history, { date, total: 1, themes: {}, sectors: {} }, 2);
}
assert.deepEqual(history.days.map((d) => d.date), ['2026-09-16', '2026-09-15']);
history = mergeHistory(history, { date: '2026-09-16', total: 42, themes: {}, sectors: {} }, 2);
assert.equal(history.days.length, 2);
assert.equal(history.days[0].total, 42);

console.log('OK: money-flow selfcheck passed');
