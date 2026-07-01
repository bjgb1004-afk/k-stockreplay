/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export type StockSymbol = '삼성전자' | 'SK하이닉스' | 'NAVER' | '카카오' | '현대차' | '에코프로비엠' | '알테오젠' | '한화에어로스페이스' | '셀트리온' | '에코프로' | '엔켐' | '필옵틱스' | '메디포스트' | '사용자정의';

export interface Trade {
  id: string;
  type: 'BUY' | 'SELL';
  date: string;
  price: number;
  quantity: number;
  amount: number;
  balanceAfter: number;
  entryPrice?: number;
  realizedPnL?: number;
  realizedPnLPct?: number;
  isAutoLiquidated?: boolean;
}

export interface SimulationState {
  symbol: StockSymbol;
  currentIndex: number; // Index in the complete stock array
  balance: number;      // Current cash balance
  holdings: number;     // Number of shares owned
  averagePrice: number; // Average purchase price
  trades: Trade[];      // Log of trades made in the session
  isPlaying: boolean;   // Whether the game is actively running or reset
}
