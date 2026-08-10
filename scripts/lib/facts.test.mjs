import assert from 'node:assert/strict';
import { classify, levelFor, buildMyStockRadar } from './facts.mjs';

assert.equal(classify('중간배당 결정 공시'), 'DIVIDEND');
assert.equal(classify('대규모 공급계약 체결'), 'CONTRACT');
assert.equal(classify('대표이사 변경'), 'MANAGEMENT_CHANGE');
assert.equal(classify('신규 시설투자 공시'), 'DISCLOSURE');

assert.equal(levelFor(0), 'GREEN');
assert.equal(levelFor(1), 'ORANGE');
assert.equal(levelFor(2), 'ORANGE');
assert.equal(levelFor(3), 'RED');

const radar = buildMyStockRadar(new Map([
  ['005930', { companyName: '삼성전자', changeCount: 3 }],
  ['005380', { companyName: '현대차', changeCount: 0 }],
  ['000660', { companyName: 'SK하이닉스', changeCount: 1 }],
]));
assert.deepEqual(radar, [
  { ticker: '005930', companyName: '삼성전자', changeCount: 3, level: 'RED' },
  { ticker: '000660', companyName: 'SK하이닉스', changeCount: 1, level: 'ORANGE' },
  { ticker: '005380', companyName: '현대차', changeCount: 0, level: 'GREEN' },
]);

console.log('facts.mjs: all checks passed');
