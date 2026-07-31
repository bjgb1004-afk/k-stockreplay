
import { KoreaInvestmentStockDataProvider } from './api/express-app';
import dotenv from 'dotenv';
dotenv.config();

async function sync() {
  const stocks = ['005930', '000660', '005380', '005490', '035420', '035720'];
  const provider = new KoreaInvestmentStockDataProvider();
  
  console.log(`[Simulator Sync] Syncing 7/31 candles for ${stocks.length} stocks...`);
  
  for (const ticker of stocks) {
    try {
      console.log(`[Simulator Sync] Syncing ${ticker}...`);
      // fetchStockData internally saves to Supabase for KoreaInvestmentStockDataProvider
      await provider.fetchStockData(ticker, 'day');
      await provider.fetchStockData(ticker, 'minute');
      console.log(`[Simulator Sync] Completed ${ticker}`);
    } catch (err) {
      console.error(`[Simulator Sync] Failed ${ticker}:`, err);
    }
    // Delay to avoid API rate limits
    await new Promise(r => setTimeout(r, 500));
  }
  console.log('[Simulator Sync] All done.');
}

sync();
