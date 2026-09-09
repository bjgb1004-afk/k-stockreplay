import assert from 'node:assert/strict';
import { computePosition, computeRemainingCash, type ReplayTrade } from './replayPosition';

const trade = (type: 'buy' | 'sell', quantity: number): ReplayTrade => ({
  id: 't', sessionId: 's', cursor: 1, date: '2026-01-01', type, price: 100, quantity,
});

// 거래 없음 -> 0
assert.equal(computePosition([]), 0);
// 매수 1건 -> 보유중
assert.equal(computePosition([trade('buy', 1)]), 1);
// 매수 후 매도 -> 청산
assert.equal(computePosition([trade('buy', 1), trade('sell', 1)]), 0);
// 매수 2회 -> 누적
assert.equal(computePosition([trade('buy', 1), trade('buy', 1)]), 2);

const priced = (type: 'buy' | 'sell', price: number, quantity: number): ReplayTrade => ({
  id: 't', sessionId: 's', cursor: 1, date: '2026-01-01', type, price, quantity,
});

// 거래 없음 -> 투자금 그대로
assert.equal(computeRemainingCash(100000, []), 100000);
// 분할매수 두 번 -> 각 매수 금액만큼 차감
assert.equal(computeRemainingCash(100000, [priced('buy', 10000, 2), priced('buy', 20000, 1)]), 100000 - 20000 - 20000);
// 매수 후 매도 -> 매도 금액만큼 환입
assert.equal(computeRemainingCash(100000, [priced('buy', 10000, 2), priced('sell', 12000, 2)]), 100000 - 20000 + 24000);

console.log('OK: replayPosition selfcheck passed');
