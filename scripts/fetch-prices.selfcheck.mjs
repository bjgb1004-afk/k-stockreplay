// Locks in the Task 4->5 join-key assumption: data.go.kr's srtnCd must come out
// as the exact same 6-digit ticker string already used across the app (see
// public/data/stocks.json, e.g. "005930"). If a future data.go.kr response shape
// changes this (e.g. an "A"-prefixed code), this fails loudly instead of the
// watchlist silently showing no price.
//
// Usage: node scripts/fetch-prices.selfcheck.mjs

import assert from 'node:assert/strict';
import { mapRow, mapIndexRow } from './fetch-prices.mjs';

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

console.log('OK: fetch-prices selfcheck passed');
