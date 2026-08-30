import assert from 'node:assert/strict';
import { calculateProfitLoss } from './profitLoss';
import type { ReplayTrade } from '../lib/replayPosition';

const t = (type: 'buy' | 'sell', price: number, cursor: number): ReplayTrade => ({
  id: `${type}-${cursor}`, sessionId: 's', cursor, date: '2026-01-0' + cursor, type, price, quantity: 1,
});

// 미청산(매수만) -> 손익 없음
assert.deepEqual(calculateProfitLoss([t('buy', 100, 1)]).closedTrades, []);

// 매수-매도 1쌍 -> 수익
const oneRound = calculateProfitLoss([t('buy', 100, 1), t('sell', 120, 2)]);
assert.equal(oneRound.closedTrades.length, 1);
assert.equal(oneRound.closedTrades[0].profit, 20);
assert.equal(oneRound.totalProfit, 20);

// 손실 케이스
const loss = calculateProfitLoss([t('buy', 100, 1), t('sell', 80, 2)]);
assert.equal(loss.closedTrades[0].profit, -20);
assert.equal(Math.round(loss.closedTrades[0].profitPercent), -20);

// 매수-매도-매수-매도 두 쌍 -> 합산
const twoRounds = calculateProfitLoss([
  t('buy', 100, 1), t('sell', 110, 2),
  t('buy', 200, 3), t('sell', 190, 4),
]);
assert.equal(twoRounds.closedTrades.length, 2);
assert.equal(twoRounds.totalProfit, 0); // +10 -10

console.log('OK: profitLoss selfcheck passed');
