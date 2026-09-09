import type { ReplayTrade } from '../lib/replayPosition';

export interface ClosedTrade {
  sell: ReplayTrade;
  avgCost: number;
  profit: number;
  profitPercent: number;
}

// 평단가(가중평균) 방식 - 매수를 여러 번 나눠 해도(분할매수) 보유 수량 전체를
// 하나의 평균 단가로 관리한다. 매도 시 그 시점의 평단가 대비 손익을 계산하고,
// 평단가 자체는 매도로 바뀌지 않는다(수량만 줄어듦).
// avgCost/quantity는 전체 거래를 다 반영한 "현재 보유 포지션" 상태 - 화면에
// 실시간 평단가를 보여줄 때 이 루프를 또 짜지 않고 재사용한다.
export function calculateProfitLoss(
  trades: ReplayTrade[]
): { closedTrades: ClosedTrade[]; totalProfit: number; avgCost: number; quantity: number } {
  const closedTrades: ClosedTrade[] = [];
  let quantity = 0;
  let avgCost = 0;

  for (const t of trades) {
    if (t.type === 'buy') {
      avgCost = (avgCost * quantity + t.price * t.quantity) / (quantity + t.quantity);
      quantity += t.quantity;
    } else if (quantity > 0) {
      const profit = (t.price - avgCost) * t.quantity;
      const profitPercent = ((t.price - avgCost) / avgCost) * 100;
      closedTrades.push({ sell: t, avgCost, profit, profitPercent });
      quantity -= t.quantity;
    }
  }

  const totalProfit = closedTrades.reduce((sum, c) => sum + c.profit, 0);
  return { closedTrades, totalProfit, avgCost, quantity };
}
