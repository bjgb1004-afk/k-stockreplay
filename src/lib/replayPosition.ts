export interface ReplayTrade {
  id: string;
  sessionId: string;
  cursor: number;
  date: string;
  type: 'buy' | 'sell';
  price: number;
  quantity: number;
}

export function computePosition(trades: ReplayTrade[]): number {
  return trades.reduce((qty, t) => qty + (t.type === 'buy' ? t.quantity : -t.quantity), 0);
}
