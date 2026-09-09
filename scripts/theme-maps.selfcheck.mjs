// theme-maps.json은 손으로 옮긴 데이터라 오타로 없는 티커가 들어가기 쉽다 -
// stocks.json에 실제로 존재하는지, 중복이 없는지만 기계적으로 검증한다.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const stocks = JSON.parse(readFileSync(new URL('../public/data/stocks.json', import.meta.url)));
const themeMaps = JSON.parse(readFileSync(new URL('../public/data/theme-maps.json', import.meta.url)));
const validTickers = new Set(stocks.map((s) => s.ticker));

let total = 0;
for (const theme of themeMaps) {
  const seen = new Set();
  for (const group of theme.groups) {
    for (const stage of group.stages) {
      for (const ticker of stage.tickers) {
        total++;
        assert.ok(validTickers.has(ticker), `${theme.id}/${group.label}/${stage.label}: ${ticker}는 stocks.json에 없음`);
        assert.ok(!seen.has(ticker), `${theme.id}: ${ticker} 중복 등록`);
        seen.add(ticker);
      }
    }
  }
}

console.log(`theme-maps.json: all ${total} tickers valid`);
