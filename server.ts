import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Server-side in-memory cache for stock data to prevent rate limits and ensure daily price consistency
interface CacheEntry {
  timestamp: number;
  candles: any[];
  name: string;
}

const stockCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60 * 4; // Cache for 4 hours

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 1. API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Proxy endpoint to get accurate real-time Korean stock data
  app.get('/api/stock-data', async (req, res) => {
    const { ticker } = req.query;
    if (!ticker || typeof ticker !== 'string') {
      return res.status(400).json({ error: 'ticker parameter is required' });
    }

    // Clean up ticker: remove exchange suffixes like .KS or .KQ to get the 6-digit code
    const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
    if (!/^\d{6}$/.test(cleanTicker)) {
      return res.status(400).json({ error: 'Invalid ticker format. Expected a 6-digit stock code.' });
    }

    // Check memory cache first
    const now = Date.now();
    const cachedEntry = stockCache.get(cleanTicker);
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL)) {
      return res.json({ candles: cachedEntry.candles, name: cachedEntry.name });
    }

    try {
      // Fetch daily stock prices from Naver Finance XML (reliable, real, historical)
      const naverUrl = `https://fchart.stock.naver.com/sise.nhn?symbol=${cleanTicker}&timeframe=day&count=120&requestType=0`;
      
      const response = await fetch(naverUrl);
      if (!response.ok) {
        throw new Error(`Naver Finance API returned status ${response.status}`);
      }

      const xmlText = await response.text();
      const regex = /<item data="([^"]+)"/g;
      let match;
      const candles: any[] = [];

      while ((match = regex.exec(xmlText)) !== null) {
        const dataParts = match[1].split('|');
        if (dataParts.length >= 6) {
          const rawDate = dataParts[0]; // Format: YYYYMMDD
          if (rawDate && rawDate.length === 8) {
            const dateStr = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
            candles.push({
              date: dateStr,
              open: parseInt(dataParts[1], 10),
              high: parseInt(dataParts[2], 10),
              low: parseInt(dataParts[3], 10),
              close: parseInt(dataParts[4], 10),
              volume: parseInt(dataParts[5], 10)
            });
          }
        }
      }

      if (candles.length === 0) {
        throw new Error('No historical price candles found for the given stock ticker.');
      }

      // Also try to resolve the name of the stock dynamically from Naver Finance
      let name = cleanTicker;
      try {
        const pageUrl = `https://finance.naver.com/item/main.naver?code=${cleanTicker}`;
        const pageResponse = await fetch(pageUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (pageResponse.ok) {
          const buffer = await pageResponse.arrayBuffer();
          const decoder = new TextDecoder('euc-kr');
          const pageHtml = decoder.decode(buffer);
          const titleMatch = pageHtml.match(/<title>([^<]+)/);
          if (titleMatch) {
            const rawTitle = titleMatch[1].trim();
            const nameParts = rawTitle.split(':');
            if (nameParts.length > 0) {
              name = nameParts[0].trim();
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch stock name from Naver Finance:', err);
      }

      // Save to cache before returning
      stockCache.set(cleanTicker, {
        timestamp: Date.now(),
        candles,
        name
      });

      // Return the parsed candles and the resolved name
      res.json({ candles, name });
    } catch (err: any) {
      console.error(`Error fetching real stock data for ticker ${ticker}:`, err);
      
      // If Naver fails but we have a stale cache entry, return it as a backup
      if (cachedEntry) {
        console.log(`Returning stale cache entry for ${cleanTicker} after fetch failure.`);
        return res.json({ candles: cachedEntry.candles, name: cachedEntry.name });
      }

      res.status(500).json({ error: err.message || 'Failed to fetch real-time historical data' });
    }
  });

  // Autocomplete search proxy for Naver Finance
  app.get('/api/search-stock', async (req, res) => {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    try {
      const searchUrl = `https://ac.finance.naver.com/ac?q=${encodeURIComponent(query)}&q_enc=utf-8&st=111&frm=stock&r_format=json&r_enc=utf-8&r_group=1`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!response.ok) {
        throw new Error(`Naver Autocomplete returned status ${response.status}`);
      }
      const data: any = await response.json();
      const rawItems = data?.items?.[0] || [];
      const results = rawItems.map((item: any) => {
        const name = Array.isArray(item[0]) ? item[0][0] : item[0];
        const ticker = Array.isArray(item[1]) ? item[1][0] : item[1];
        return { name, ticker };
      }).filter((item: any) => item.name && item.ticker);
      
      res.json({ results });
    } catch (err: any) {
      console.error('Error searching stock autocomplete:', err);
      res.status(500).json({ error: err.message || 'Failed to search stock' });
    }
  });

  // 2. Vite Middleware / Static Asset Serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
