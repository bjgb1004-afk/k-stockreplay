// Locks in the Task 4->5 join-key assumption: data.go.kr's srtnCd must come out
// as the exact same 6-digit ticker string already used across the app (see
// public/data/stocks.json, e.g. "005930"). If a future data.go.kr response shape
// changes this (e.g. an "A"-prefixed code), this fails loudly instead of the
// watchlist silently showing no price.
//
// Usage: node scripts/fetch-prices.selfcheck.mjs

import assert from 'node:assert/strict';
import { mapRow } from './fetch-prices.mjs';

const result = mapRow({ srtnCd: '005930', clpr: '71000', fltRt: '1.23' }, '2026-08-31');
assert.equal(result.ticker, '005930'); // exact match, no "A" prefix, no padding change
assert.equal(result.close, 71000);
assert.equal(result.changePct, 1.23);
assert.equal(result.date, '2026-08-31');

console.log('OK: fetch-prices selfcheck passed');
