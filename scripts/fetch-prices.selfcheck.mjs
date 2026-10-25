// Locks in the Task 4->5 join-key assumption: data.go.kr's srtnCd must come out
// as the exact same 6-digit ticker string already used across the app (see
// public/data/stocks.json, e.g. "005930"). If a future data.go.kr response shape
// changes this (e.g. an "A"-prefixed code), this fails loudly instead of the
// watchlist silently showing no price.
//
// Usage: node scripts/fetch-prices.selfcheck.mjs

import assert from 'node:assert/strict';
import { mapRow, mapIndexRow, mergePriceHistory } from './fetch-prices.mjs';

const result = mapRow({ srtnCd: '005930', clpr: '71000', fltRt: '1.23' }, '2026-08-31');
assert.equal(result.ticker, '005930'); // exact match, no "A" prefix, no padding change
assert.equal(result.close, 71000);
assert.equal(result.changePct, 1.23);
assert.equal(result.date, '2026-08-31');

// 지수 행: 상단 티커가 NaN이나 빈 값으로 죽지 않게 콤마 섞인 숫자까지 파싱되는지 고정한다.
const idx = mapIndexRow({ idxNm: '코스피', clpr: '2,598.37', fltRt: '-0.42' });
assert.equal(idx.name, '코스피');
assert.equal(idx.close, 2598.37);
assert.equal(idx.changePct, -0.42);
assert.equal(mapIndexRow({ idxNm: '코스닥', clpr: '850.1', fltRt: '' }).changePct, 0); // 등락률 공란 -> 0, NaN 금지
assert.throws(() => mapIndexRow({ idxNm: '코스피', clpr: '-' })); // 종가가 없으면 조용히 쓰지 말고 터뜨린다

// 거래대금(원) -> 억원, 값이 없으면 null
assert.equal(mapRow({ srtnCd: '005930', clpr: '71000', fltRt: '1', trPrc: '1234500000000' }, 'x').amount, 12345);
assert.equal(mapRow({ srtnCd: '005930', clpr: '71000', fltRt: '1' }, 'x').amount, null);
assert.equal(mapRow({ srtnCd: '005930', clpr: '71000', fltRt: '1', trPrc: '0' }, 'x').amount, null);

// 20일 가격 기록: 날짜 정렬, 같은 날 재실행 덮어쓰기, 상한, 신규상장은 앞이 null
let h = mergePriceHistory(null, '2026-10-20', [{ srtnCd: 'A', clpr: '100' }]);
h = mergePriceHistory(h, '2026-10-21', [{ srtnCd: 'A', clpr: '110' }, { srtnCd: 'B', clpr: '50' }]);
assert.deepEqual(h.dates, ['2026-10-20', '2026-10-21']);
assert.deepEqual(h.close.A, [100, 110]);
assert.deepEqual(h.close.B, [null, 50]);
h = mergePriceHistory(h, '2026-10-21', [{ srtnCd: 'A', clpr: '120' }, { srtnCd: 'B', clpr: '55' }]); // 재실행
assert.deepEqual(h.close.A, [100, 120]);
// 과거 날짜를 나중에 채워도(백필) 날짜순으로 끼워 넣는다
h = mergePriceHistory(h, '2026-10-19', [{ srtnCd: 'A', clpr: '90' }]);
assert.deepEqual(h.dates, ['2026-10-19', '2026-10-20', '2026-10-21']);
assert.deepEqual(h.close.A, [90, 100, 120]);
// keep 상한: 오래된 날부터 버린다
assert.deepEqual(mergePriceHistory(h, '2026-10-22', [{ srtnCd: 'A', clpr: '1' }], 2).dates, ['2026-10-21', '2026-10-22']);

console.log('OK: fetch-prices selfcheck passed');
