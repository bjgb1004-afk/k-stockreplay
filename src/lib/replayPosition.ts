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

// 분할매수 하드캡용 잔여 현금. 매수 금액만큼 빠지고 매도 금액만큼 들어온다 -
// 세금/수수료는 이 앱 범위 밖(§가상매매, 실제 체결 아님)이라 계산하지 않는다.
export function computeRemainingCash(capital: number, trades: ReplayTrade[]): number {
  return trades.reduce(
    (cash, t) => cash + (t.type === 'buy' ? -1 : 1) * t.price * t.quantity,
    capital
  );
}
