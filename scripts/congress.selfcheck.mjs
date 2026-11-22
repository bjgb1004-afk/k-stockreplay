// fetch-congress.mjs 파서 자체검사 (네트워크 없이). 목록 XML 형식은 2026-11-22 실제 2026FD.xml로 확인.
import { parseIndex, parseTrades, topTickers, usDate } from './fetch-congress.mjs';

const assert = (cond, msg) => {
  if (!cond) throw new Error(msg);
};

assert(usDate('4/5/2026') === '2026-04-05', 'usDate');

const xml = `<?xml version="1.0" encoding="utf-8"?>
<FinancialDisclosure>
  <Member><Prefix /><Last>Aaron</Last><First>Richard</First><Suffix /><FilingType>W</FilingType><StateDst>MI04</StateDst><Year>2026</Year><FilingDate>4/15/2026</FilingDate><DocID>8068</DocID></Member>
  <Member><Prefix>Hon.</Prefix><Last>Alford</Last><First>Mark</First><Suffix /><FilingType>P</FilingType><StateDst>MO04</StateDst><Year>2026</Year><FilingDate>3/31/2026</FilingDate><DocID>20034201</DocID></Member>
  <Member><Prefix>Hon.</Prefix><Last>Smith</Last><First>Jane</First><Suffix /><FilingType>P</FilingType><StateDst>CA11</StateDst><Year>2026</Year><FilingDate>11/2/2026</FilingDate><DocID>20039999</DocID></Member>
</FinancialDisclosure>`;
const idx = parseIndex(xml, 2026);
assert(idx.length === 2, 'only PTR (P) filings');
assert(idx[0].name === 'Jane Smith' && idx[0].filed === '2026-11-02', 'newest first');
assert(idx[1].url.endsWith('/ptr-pdfs/2026/20034201.pdf'), 'pdf url');

const text = `
ID      Owner Asset                                      Transaction Date        Notification Amount
                                                         Type                    Date
        SP    NVIDIA Corporation - Common Stock          P           10/15/2026 10/20/2026 $1,001 - $15,000
              (NVDA) [ST]
              Microsoft Corporation (MSFT) [ST]          S (partial) 10/01/2026 10/03/2026 $15,001 -
                                                                                           $50,000
              US Treasury Bill (912797) [GS]            P           10/01/2026 10/03/2026 $1,001 - $15,000
`;
// pdftotext는 종목코드가 다음 줄로 밀리기도 한다 - 그 경우는 순서가 바뀌어 못 읽는 게 정상(원문 링크로 남음).
const t2 = parseTrades('Apple Inc. (AAPL) [ST] P 09/02/2026 09/15/2026 $1,001 - $15,000 Microsoft Corporation (MSFT) [ST] SP S (partial) 10/01/2026 10/03/2026 $15,001 - $50,000');
assert(t2.length === 2, `two trades, got ${t2.length}`);
assert(t2[0].ticker === 'AAPL' && t2[0].type === 'buy' && t2[0].txDate === '2026-09-02', 'aapl buy');
assert(t2[1].ticker === 'MSFT' && t2[1].type === 'sell' && t2[1].amount === '$15,001 - $50,000', 'msft sell');
assert(parseTrades(text).every((t) => t.ticker !== '912797'), 'non-stock skipped');

const top = topTickers([
  { name: 'A', trades: [{ ticker: 'AAPL', type: 'buy' }] },
  { name: 'B', trades: [{ ticker: 'AAPL', type: 'buy' }, { ticker: 'MSFT', type: 'sell' }] },
]);
assert(top[0].ticker === 'AAPL' && top[0].buyers === 2, 'top tickers');

console.log('congress selfcheck passed');
