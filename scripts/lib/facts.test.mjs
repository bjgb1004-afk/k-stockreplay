import assert from 'node:assert/strict';
import { classify, levelFor, buildMyStockRadar, dedupeDisclosures, interpret } from './facts.mjs';

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

const deduped = dedupeDisclosures([
  { rcept_no: '20260813000613', report_nm: '[기재정정]주식매수선택권부여에관한신고' },
  { rcept_no: '20260813000624', report_nm: '[기재정정]주식매수선택권부여에관한신고' },
  { rcept_no: '20260813000636', report_nm: '[기재정정]주식매수선택권부여에관한신고' },
  { rcept_no: '20260813001333', report_nm: '지급수단별ㆍ지급기간별지급금액및분쟁조정기구에관한사항' },
]);
assert.equal(deduped.length, 2);
assert.deepEqual(
  deduped.find((d) => d.rcept_no === '20260813000636'),
  { rcept_no: '20260813000636', report_nm: '[기재정정]주식매수선택권부여에관한신고 (정정 등 3건)', count: 3 },
);
assert.deepEqual(
  deduped.find((d) => d.rcept_no === '20260813001333'),
  { rcept_no: '20260813001333', report_nm: '지급수단별ㆍ지급기간별지급금액및분쟁조정기구에관한사항', count: 1 },
);

assert.equal(interpret('부도발생').sentiment, 'NEGATIVE');
// DART 실제 표준 서식명 - "감사"와 "의견" 사이에 괄호가 끼어드는 실제 사례.
assert.equal(interpret('반기검토(감사)의견부적정등사실확인(자본잠식률100분의50이상또는자기자본10억원미만포함)').sentiment, 'NEGATIVE');
assert.equal(interpret('무상증자결정').sentiment, 'POSITIVE');
assert.equal(interpret('매출액또는손익구조30%(대규모법인은15%)이상변경').sentiment, 'MIXED');
assert.equal(interpret('소송등의판결ㆍ결정').sentiment, 'MIXED');
assert.equal(interpret('아무 패턴에도 안 걸리는 제목').sentiment, 'NEUTRAL');
assert.ok(interpret('아무 패턴에도 안 걸리는 제목').meaning.length > 0);

console.log('facts.mjs: all checks passed');
