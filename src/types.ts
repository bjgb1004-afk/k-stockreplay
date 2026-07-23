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

export type StockSymbol = string;

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
  candleIndex?: number;
  timestamp?: number; // Added for holding duration calculations
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

// ==========================================
// After-Market Replay & Study Platform Types
// ==========================================

export interface MacroDetail {
  value: string;
  reason: string;
  majorsAction: string;
  marketImpact: string;
  sectorsAnalysis: string;
}

export interface DomesticSectorAnalysis {
  sectorName: string;
  sentiment: string;
  reason: string;
  stocks: string[];
}

export interface PreMarketBriefing {
  id: string;
  date: string;
  published: boolean;
  summary?: string;
  expectedThemes?: string[];
  leadMapping?: string;
  strategyScenario?: string;
  usSummary?: {
    dow: string;
    nasdaq: string;
    sp500: string;
    russell2000: string;
    vix: string;
  };
  macro?: {
    interestRate: string;
    cpi: string;
    ppi: string;
    fomc?: string;
    bondYield: string;
    exchangeRate: string;
    oilPrice: string;
  };
  macroDetailed?: {
    interestRate: MacroDetail;
    cpi: MacroDetail;
    ppi: MacroDetail;
    bond10y: MacroDetail;
    exchangeRate: MacroDetail;
    oilPrice: MacroDetail;
  };
  domesticSectors?: DomesticSectorAnalysis[];
  worldNews: string[];
  usFeaturedStocks: string[];
  usJodoju: string[];
  koreanImpact: string;
  relatedKoreanStocks: { name: string; reason: string }[];
  aiSummary5Lines: string[];
  interestThemes: { theme: string; relatedStocks: string[] }[];
  interestStocks: { name: string; ticker: string; catalyst: string }[];
  riskIssues: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
  quantAnalysisMarkdown?: string;
}

export interface JodojuAnalysis {
  sector?: string;
  theme?: string;
  tags?: string[];
  ticker: string;
  name: string;
  rank: number;
  closePrice: number;
  changeRate: number;
  volume: number;
  tradeValuePct: number; // e.g. 5000억
  tradeValue?: number;
  tradingValue?: number;
  marketStrength: number; // 1-100
  themeStrength: number; // 1-100
  score: number; // 0-100
  stars: number; // 1-5
  relatedThemes: string[];
  relatedPeerGroup: string[];
  marketImpact: string;
  supplyDemand: {
    foreigner: string; // Net Buy / Sell
    institution: string; // Net Buy / Sell
  };
  riseReason: string;
  declineReason?: string;
  disclosures: { title: string; date: string }[];
  news: { title: string; url?: string; date: string }[];
  aiSummary: string;
  aiAnalysis: {
    riseReasonDetailed: string;
    declineReasonDetailed: string;
    buyPoints: string[];
    cautionPoints: string[];
    tomorrowCheckpoints: string[];
  };
}

export interface FeatureStock {
  ticker: string;
  name: string;
  category: 'GOOD' | 'BAD';
  keywords: string[];
  catalyst: string; // e.g. "FDA 임상 3상 최종 승인 발표 및 미국 수출 계약 체결"
  relatedStocks: string[];
}

export interface AfterMarketReport {
  id: string;
  date: string;
  published: boolean;
  jodoju15: JodojuAnalysis[];
  features: FeatureStock[];
  marketAnalysisSummary?: string;
}

// Real-time AI Replay Chart Overlay Study Guides
export interface ReplayGuideInterval {
  candleIndex: number;
  type: 'BUY_ZONE' | 'STOP_LOSS' | 'RESISTANCE' | 'SUPPORT' | 'VOLUME_SPIKE' | 'BREAKOUT' | 'WARNING';
  price: number;
  comment: string;
}

export interface AiReplayStudyGuide {
  ticker: string;
  guides: ReplayGuideInterval[];
}

// Replay Simulation Ending Report
export interface ReplayReviewReport {
  ticker: string;
  name: string;
  winRate: number; // %
  totalPnL: number;
  totalPnLPct: number; // %
  tradesCount: number;
  averageProfit: number;
  maxDrawdown: number; // %
  averageHoldingTime: string; // e.g. "4일" / "25분"
  aiFeedback: string;
  score?: number;
  fitIndex?: number;
  adviceText?: string;
  matchedIdealGuides: {
    guideType: string;
    price: number;
    userAction: string; // e.g. "매수 성공", "손절 완료", "놓침"
    comment: string;
  }[];
}
