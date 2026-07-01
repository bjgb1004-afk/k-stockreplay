import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

// Server-side in-memory cache for stock data to prevent rate limits and ensure daily price consistency
interface CacheEntry {
  timestamp: number;
  candles: any[];
  name: string;
}

const stockCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60 * 4; // Cache for 4 hours

// Leaderboard storage configuration
interface LeaderboardEntry {
  name: string;
  yieldRate: number; // cumulative yield rate in %
  symbol: string;
  totalAssets: number;
  date: string;
}

const LEADERBOARD_FILE = path.join(process.cwd(), 'leaderboard.json');

const DEFAULT_LEADERBOARD: LeaderboardEntry[] = [
  { name: '워런 버핏 후계자', yieldRate: 65.40, symbol: '삼성전자', totalAssets: 16540000, date: '2026-07-01' },
  { name: '여의도 몰빵왕', yieldRate: 48.25, symbol: 'SK하이닉스', totalAssets: 14825000, date: '2026-06-30' },
  { name: '반도체 전업러', yieldRate: 31.50, symbol: '한화에어로스페이스', totalAssets: 13150000, date: '2026-07-01' },
  { name: '에코프로전도사', yieldRate: 24.80, symbol: '에코프로비엠', totalAssets: 12480000, date: '2026-06-29' },
  { name: '예수금지키미', yieldRate: 12.35, symbol: 'NAVER', totalAssets: 11235000, date: '2026-06-28' },
  { name: '단타의 신', yieldRate: 8.50, symbol: '셀트리온', totalAssets: 10850000, date: '2026-06-27' },
  { name: '본전이 목표', yieldRate: 0.00, symbol: '카카오', totalAssets: 10000000, date: '2026-06-26' },
  { name: '지수추종파', yieldRate: -2.40, symbol: '현대차', totalAssets: 9760000, date: '2026-06-25' },
  { name: '지하실구경꾼', yieldRate: -15.80, symbol: '에코프로', totalAssets: 8420000, date: '2026-06-24' },
  { name: '한강수온측정기', yieldRate: -48.50, symbol: '알테오젠', totalAssets: 5150000, date: '2026-06-23' }
];

function getLeaderboard(): LeaderboardEntry[] {
  try {
    if (!fs.existsSync(LEADERBOARD_FILE)) {
      fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(DEFAULT_LEADERBOARD, null, 2), 'utf-8');
      return DEFAULT_LEADERBOARD;
    }
    const rawData = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return DEFAULT_LEADERBOARD;
  } catch (err) {
    console.error('Error reading leaderboard file:', err);
    return DEFAULT_LEADERBOARD;
  }
}

function saveLeaderboard(entries: LeaderboardEntry[]): boolean {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing leaderboard file:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Add JSON parsing middleware
  app.use(express.json());

  // 1. API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Get Leaderboard (Sorted by yieldRate descending, limit top 100, we render top 10 on UI)
  app.get('/api/leaderboard', (req, res) => {
    const list = getLeaderboard();
    const sorted = [...list].sort((a, b) => b.yieldRate - a.yieldRate);
    res.json({ leaderboard: sorted.slice(0, 50) }); // Send top 50
  });

  // Post new score to leaderboard
  app.post('/api/leaderboard', (req, res) => {
    const { name, yieldRate, symbol, totalAssets } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: '유효한 닉네임을 입력해주세요.' });
    }
    if (typeof yieldRate !== 'number' || typeof totalAssets !== 'number') {
      return res.status(400).json({ error: '올바르지 않은 자산 및 수익률 데이터입니다.' });
    }

    const cleanName = name.trim().slice(0, 12); // Limit to 12 chars for safety and responsiveness
    const list = getLeaderboard();
    
    const today = new Date();
    const krDateStr = new Date(today.getTime() + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10); // Simple KST date string

    const newEntry: LeaderboardEntry = {
      name: cleanName,
      yieldRate: parseFloat(yieldRate.toFixed(2)),
      symbol: symbol || '랜덤 종목',
      totalAssets: Math.round(totalAssets),
      date: krDateStr
    };

    list.push(newEntry);
    const sorted = [...list].sort((a, b) => b.yieldRate - a.yieldRate);
    // Keep top 100 maximum entries to prevent massive file size over time
    const trimmed = sorted.slice(0, 100);

    const success = saveLeaderboard(trimmed);
    if (success) {
      res.json({ success: true, entry: newEntry });
    } else {
      res.status(500).json({ error: '랭킹 저장에 실패했습니다.' });
    }
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
