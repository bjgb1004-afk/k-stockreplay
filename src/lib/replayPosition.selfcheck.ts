import assert from 'node:assert/strict';
import { computePosition, type ReplayTrade } from './replayPosition';

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

console.log('OK: replayPosition selfcheck passed');
