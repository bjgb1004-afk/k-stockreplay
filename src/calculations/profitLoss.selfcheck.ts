import assert from 'node:assert/strict';
import { calculateProfitLoss } from './profitLoss';
import type { ReplayTrade } from '../lib/replayPosition';

const t = (type: 'buy' | 'sell', price: number, cursor: number, quantity = 1): ReplayTrade => ({
  id: `${type}-${cursor}`, sessionId: 's', cursor, date: '2026-01-0' + cursor, type, price, quantity,
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

// 분할매수: 100원에 1주 + 200원에 1주 -> 평단가 150원, 180원에 전량 매도 -> (180-150)*2
const splitBuy = calculateProfitLoss([
  t('buy', 100, 1), t('buy', 200, 2), t('sell', 180, 3, 2),
]);
assert.equal(splitBuy.closedTrades[0].avgCost, 150);
assert.equal(splitBuy.closedTrades[0].profit, 60);

// 부분매도: 100원에 2주 매수 -> 평단가 100원 유지한 채 1주씩 두 번에 나눠 매도
const partialSell = calculateProfitLoss([
  t('buy', 100, 1, 2), t('sell', 120, 2, 1), t('sell', 130, 3, 1),
]);
assert.equal(partialSell.closedTrades.length, 2);
assert.equal(partialSell.closedTrades[0].avgCost, 100);
assert.equal(partialSell.closedTrades[1].avgCost, 100); // 부분매도는 평단가를 바꾸지 않음
assert.equal(partialSell.totalProfit, 20 + 30);

// 분할매수 중간에 부분매도 -> 남은 수량에 새 매수가 다시 섞여 평단가 갱신
const mixed = calculateProfitLoss([
  t('buy', 100, 1, 2),   // 2주 @100, 평단 100
  t('sell', 120, 2, 1),  // 1주 매도 @120 -> 손익 +20, 남은 1주 @100
  t('buy', 140, 3, 1),   // 1주 추가 @140 -> 남은 2주, 평단 (100+140)/2=120
  t('sell', 150, 4, 2),  // 전량 매도 @150 -> 손익 (150-120)*2=60
]);
assert.equal(mixed.closedTrades[0].profit, 20);
assert.equal(mixed.closedTrades[1].avgCost, 120);
assert.equal(mixed.closedTrades[1].profit, 60);

console.log('OK: profitLoss selfcheck passed');
