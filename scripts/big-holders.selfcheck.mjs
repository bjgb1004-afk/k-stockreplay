// fetch-big-holders.mjs / fetch-13f.mjs의 순수 함수를 고정 입력으로 검증한다 (네트워크 없음).
// Usage: node scripts/big-holders.selfcheck.mjs
import assert from 'node:assert/strict';
import { isInstitution, toNumber, collectByHolder, buildHolders } from './fetch-big-holders.mjs';
import { parseInfoTable, aggregate, diffPositions, pick13F } from './fetch-13f.mjs';

// ---- 국내 ----
assert.equal(toNumber('1,234'), 1234);
assert.equal(toNumber('-'), null);
assert.equal(toNumber(''), null);
assert.equal(toNumber('5.07'), 5.07);
assert.equal(toNumber('-0.45'), -0.45);

assert.equal(isInstitution('국민연금공단'), true);
assert.equal(isInstitution('미래에셋자산운용'), true);
assert.equal(isInstitution('홍길동'), false);

const corpToTicker = new Map([['00000001', '111111'], ['00000002', '222222'], ['00000003', '333333']]);
const row = (corp, name, repror, dt, ratio, irds, resn) => ({
  rcept_no: `${dt}000${corp}`, rcept_dt: dt, corp_code: corp, corp_name: name, repror,
  stkrt: String(ratio), stkrt_irds: String(irds), report_resn: resn,
});
const rows = [
  row('00000001', '가나다', '국민연금공단', '20240101', 7.1, '-', '신규보고'),
  row('00000001', '가나다', '국민연금공단', '20240601', 8.3, '1.2', '장내매수'),
  row('00000002', '라마바', '국민연금공단', '20240201', 6.0, '-', '신규보고'),
  row('00000002', '라마바', '국민연금공단', '20240901', 4.9, '-1.1', '장내매도'),
  row('00000003', '사아자', '국민연금공단', '20240301', 5.5, '-', '신규보고'),
  row('00000001', '가나다', '홍길동', '20240101', 20, '-', '신규보고'), // 개인 - 제외
  row('99999999', '비상장', '국민연금공단', '20240101', 9, '-', '신규보고'), // 비상장 - 제외
  row('00000001', '가나다', '소수운용사', '20240101', 5.1, '-', '신규보고'), // 1종목뿐 - minCompanies에서 제외
];
const holders = buildHolders(collectByHolder(rows, corpToTicker), { minCompanies: 3 });
assert.equal(holders.length, 1);
const nps = holders[0];
assert.equal(nps.name, '국민연금공단');
assert.equal(nps.count, 2); // 라마바는 4.9%로 내려가 정리된 종목
assert.equal(nps.holdings.length, 3);
assert.deepEqual(nps.holdings.map((h) => h.ticker), ['111111', '333333', '222222']); // 보유 중(비율 내림차순) → 정리 종목
const first = nps.holdings[0];
assert.equal(first.ratio, 8.3);
assert.equal(first.delta, 1.2);
assert.equal(first.date, '2024-06-01');
assert.deepEqual(first.hist, [['2024-01-01', 7.1], ['2024-06-01', 8.3]]);
assert.equal(nps.holdings[2].exited, true);

// ---- 해외 ----
const xml = `<?xml version="1.0"?>
<informationTable xmlns="http://www.sec.gov/edgar/document/thirteenf/informationtable">
  <infoTable>
    <nameOfIssuer>APPLE INC</nameOfIssuer><titleOfClass>COM</titleOfClass><cusip>037833100</cusip>
    <value>600</value>
    <shrsOrPrnAmt><sshPrnamt>60</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt>
  </infoTable>
  <infoTable>
    <nameOfIssuer>APPLE INC</nameOfIssuer><titleOfClass>COM</titleOfClass><cusip>037833100</cusip>
    <value>200</value>
    <shrsOrPrnAmt><sshPrnamt>20</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt>
  </infoTable>
  <infoTable>
    <nameOfIssuer>COCA COLA CO</nameOfIssuer><titleOfClass>COM</titleOfClass><cusip>191216100</cusip>
    <value>200</value>
    <shrsOrPrnAmt><sshPrnamt>40</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt>
  </infoTable>
  <infoTable>
    <nameOfIssuer>OPTION CO</nameOfIssuer><cusip>000000000</cusip><value>999</value>
    <shrsOrPrnAmt><sshPrnamt>9</sshPrnamt><sshPrnamtType>SH</sshPrnamtType></shrsOrPrnAmt><putCall>Put</putCall>
  </infoTable>
  <infoTable>
    <nameOfIssuer>BOND CO</nameOfIssuer><cusip>111111111</cusip><value>999</value>
    <shrsOrPrnAmt><sshPrnamt>9</sshPrnamt><sshPrnamtType>PRN</sshPrnamtType></shrsOrPrnAmt>
  </infoTable>
</informationTable>`;
const parsed = parseInfoTable(xml);
assert.equal(parsed.length, 3); // 옵션·채권 제외
const agg = aggregate(parsed);
assert.equal(agg.total, 1000);
assert.equal(agg.positions.length, 2);
assert.equal(agg.positions[0].cusip, '037833100');
assert.equal(agg.positions[0].shares, 80); // 같은 CUSIP 합산
assert.equal(agg.positions[0].weight, 80);

// 네임스페이스 접두사가 붙은 형식도 읽는다
const nsXml = `<ns1:informationTable><ns1:infoTable><ns1:nameOfIssuer>X CORP</ns1:nameOfIssuer><ns1:cusip>123456789</ns1:cusip><ns1:value>10</ns1:value><ns1:shrsOrPrnAmt><ns1:sshPrnamt>5</ns1:sshPrnamt><ns1:sshPrnamtType>SH</ns1:sshPrnamtType></ns1:shrsOrPrnAmt></ns1:infoTable></ns1:informationTable>`;
assert.equal(parseInfoTable(nsXml)[0].shares, 5);

const prev = [
  { name: 'APPLE INC', cusip: '037833100', shares: 100, value: 1, weight: 50 },
  { name: 'COCA COLA CO', cusip: '191216100', shares: 40, value: 1, weight: 20 },
  { name: 'OLD CO', cusip: '555555555', shares: 10, value: 1, weight: 30 },
];
const curr = [
  ...agg.positions,
  { name: 'NEW CO', cusip: '777777777', shares: 7, value: 1, weight: 1 },
];
const diff = diffPositions(curr, prev);
const by = Object.fromEntries(diff.holdings.map((h) => [h.cusip, h]));
assert.equal(by['037833100'].status, 'dec');
assert.equal(by['037833100'].changePct, -20);
assert.equal(by['191216100'].status, 'same');
assert.equal(by['777777777'].status, 'new');
assert.equal(diff.sold.length, 1);
assert.equal(diff.sold[0].cusip, '555555555');
assert.equal(diff.sold[0].status, 'sold');

const subs = {
  filings: { recent: {
    form: ['4', '13F-HR', '13F-HR/A', '13F-HR'],
    accessionNumber: ['a', 'b', 'c', 'd'],
    filingDate: ['2024-05-01', '2024-05-15', '2024-06-01', '2024-02-14'],
    reportDate: ['2024-04-30', '2024-03-31', '2024-03-31', '2023-12-31'],
  } },
};
const picked = pick13F(subs);
assert.deepEqual(picked.map((p) => p.accession), ['b', 'd']); // 정정(/A)·타 양식 제외, 기간 최신순

console.log('big-holders selfcheck passed');
