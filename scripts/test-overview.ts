
import { fetchMarketOverview } from '../api/express-app';

async function test() {
  try {
    const overview = await fetchMarketOverview();
    console.log('Market Overview:', JSON.stringify(overview, null, 2));
  } catch (e) {
    console.error('Error fetching market overview:', e);
  }
}

test();
