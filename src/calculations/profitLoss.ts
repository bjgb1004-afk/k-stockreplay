import type { ReplayTrade } from '../lib/replayPosition';

export interface ClosedTrade {
  buy: ReplayTrade;
  sell: ReplayTrade;
  profit: number;
  profitPercent: number;
}

export function calculateProfitLoss(trades: ReplayTrade[]): { closedTrades: ClosedTrade[]; totalProfit: number } {
  const closedTrades: ClosedTrade[] = [];
  let openBuy: ReplayTrade | null = null;

  for (const t of trades) {
    if (t.type === 'buy') {
      openBuy = t;
    } else if (openBuy) {
      const profit = (t.price - openBuy.price) * t.quantity;
      const profitPercent = ((t.price - openBuy.price) / openBuy.price) * 100;
      closedTrades.push({ buy: openBuy, sell: t, profit, profitPercent });
      openBuy = null;
    }
  }

  const totalProfit = closedTrades.reduce((sum, c) => sum + c.profit, 0);
  return { closedTrades, totalProfit };
}
