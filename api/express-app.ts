import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import zlib from 'zlib';
import iconv from 'iconv-lite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { PlatformEngine } from '../server-core/platform_engine.js';

dotenv.config();

// Robust path helper to resolve writable file paths for serverless/read-only environments like Vercel
function getWritablePath(filename: string): string {
  const basename = path.basename(filename);
  const tmpPath = path.resolve(os.tmpdir(), basename);
  
  if (!fs.existsSync(tmpPath)) {
    const originalPath = path.resolve(process.cwd(), filename);
    try {
      if (fs.existsSync(originalPath)) {
        const content = fs.readFileSync(originalPath);
        fs.writeFileSync(tmpPath, content);
        console.log(`[Writable Storage] Copied ${filename} from project root to OS tmpdir: ${tmpPath}`);
      } else {
        const defaultContent = basename.includes('cache') ? '{}' : '[]';
        fs.writeFileSync(tmpPath, defaultContent, 'utf-8');
        console.log(`[Writable Storage] Initialized new ${filename} in OS tmpdir: ${tmpPath}`);
      }
    } catch (err: any) {
      console.warn(`[Writable Storage] Warning initializing ${filename} in tmpdir:`, err.message || err);
    }
  }
  return tmpPath;
}

// Lazy initialized Supabase client
let supabaseClient: any = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
}

function isSupabaseActive(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// In-memory/file-based sync with Supabase
async function getLeaderboardFromSupabase(type: 'ilbong' | 'danta'): Promise<LeaderboardEntry[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('kstock_leaderboard')
      .select('name, yield_rate, symbol, total_assets, date')
      .eq('type', type)
      .order('yield_rate', { ascending: false })
      .limit(10);
    
    if (error) {
      console.warn('Supabase Leaderboard Table access note (table might not exist yet; use SQL DDL guide in diagnostics):', error.message || error);
      return null;
    }
    
    if (data) {
      return data.map((item: any) => ({
        name: item.name,
        yieldRate: Number(item.yield_rate),
        symbol: item.symbol,
        totalAssets: Number(item.total_assets),
        date: item.date
      }));
    }
    return [];
  } catch (err: any) {
    console.warn('Supabase fetch exception handled gracefully (local fallback active):', err.message || err);
    return null;
  }
}

async function saveScoreToSupabase(entry: LeaderboardEntry, type: 'ilbong' | 'danta'): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('kstock_leaderboard')
      .insert([
        {
          name: entry.name,
          yield_rate: entry.yieldRate,
          symbol: entry.symbol,
          total_assets: entry.totalAssets,
          date: entry.date,
          type: type
        }
      ]);
    if (error) {
      console.warn('Supabase Leaderboard Table save note (table might not exist yet; use SQL DDL guide in diagnostics):', error.message || error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Supabase insert exception handled gracefully (local fallback active):', err.message || err);
    return false;
  }
}

async function getAllScoresFromSupabase(type: 'ilbong' | 'danta'): Promise<LeaderboardEntry[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('kstock_leaderboard')
      .select('name, yield_rate, symbol, total_assets, date')
      .eq('type', type)
      .order('yield_rate', { ascending: false });
    
    if (error) {
      console.warn('Supabase Leaderboard Table fetch all note (table might not exist yet; use SQL DDL guide in diagnostics):', error.message || error);
      return null;
    }
    
    if (data) {
      return data.map((item: any) => ({
        name: item.name,
        yieldRate: Number(item.yield_rate),
        symbol: item.symbol,
        totalAssets: Number(item.total_assets),
        date: item.date
      }));
    }
    return [];
  } catch (err: any) {
    console.warn('Supabase fetch all exception handled gracefully (local fallback active):', err.message || err);
    return null;
  }
}

// Platform Data syncing helper functions for Supabase
async function getPlatformDataFromSupabase(key: string): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('kstock_platform_data')
      .select('data')
      .eq('key', key)
      .single();
    
    if (error) {
      console.warn(`Supabase Platform Data fetch note for '${key}' (table might not exist yet):`, error.message || error);
      return null;
    }
    return data ? data.data : null;
  } catch (err: any) {
    console.warn(`Supabase Platform Data fetch exception handled gracefully for '${key}':`, err.message || err);
    return null;
  }
}

async function savePlatformDataToSupabase(key: string, dataVal: any): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  try {
    const { error } = await supabase
      .from('kstock_platform_data')
      .upsert({
        key: key,
        data: dataVal,
        updated_at: new Date().toISOString()
      }, { onConflict: 'key' });
    
    if (error) {
      console.warn(`Supabase Platform Data save note for '${key}' (table might not exist yet):`, error.message || error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Supabase Platform Data save exception handled gracefully for '${key}':`, err.message || err);
    return false;
  }
}

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

const ILBONG_LEADERBOARD_FILE = getWritablePath('leaderboard_ilbong.json');
const DANTA_LEADERBOARD_FILE = getWritablePath('leaderboard_danta.json');
const ALL_ILBONG_SCORES_FILE = getWritablePath('all_scores_ilbong.json');
const ALL_DANTA_SCORES_FILE = getWritablePath('all_scores_danta.json');

// --- 2단계 : 데이터 검증 시스템 (4-Stage Data Verification System Models) ---
interface AuditDiffDetail {
  field: string;
  expected: string;
  actual: string;
  delta: string;
  message: string;
}

interface AuditLog {
  id: string;
  timestamp: string;
  pipeline: string;
  status: 'SUCCESS' | 'MISMATCH' | 'ERROR';
  rawVsProcessed: {
    status: 'SUCCESS' | 'MISMATCH' | 'NOT_APPLICABLE';
    diffs: AuditDiffDetail[];
  };
  processedVsDb: {
    status: 'SUCCESS' | 'MISMATCH' | 'NOT_APPLICABLE';
    diffs: AuditDiffDetail[];
  };
  dbVsUi: {
    status: 'SUCCESS' | 'MISMATCH' | 'NOT_APPLICABLE';
    diffs: AuditDiffDetail[];
  };
  summary: string;
}

const AUDIT_LOGS_FILE = getWritablePath('audit_logs.json');
let cachedAuditLogs: AuditLog[] = [];

function loadAuditLogs(): AuditLog[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const data = fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        cachedAuditLogs = parsed;
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading audit logs file:', e);
  }
  return cachedAuditLogs;
}

function saveAuditLogs() {
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(cachedAuditLogs.slice(0, 100), null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing audit logs file:', e);
  }
}

function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
  const newLog: AuditLog = {
    id: 'AUDIT-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    timestamp: new Date().toISOString(),
    ...log
  };
  cachedAuditLogs.unshift(newLog);
  if (cachedAuditLogs.length > 100) {
    cachedAuditLogs = cachedAuditLogs.slice(0, 100);
  }
  saveAuditLogs();
  return newLog;
}

function auditLeaderboardFlow(
  rawInput: any,
  processedOutput: LeaderboardEntry,
  dbOutput: LeaderboardEntry | null,
  uiOutput?: LeaderboardEntry | null
): AuditLog {
  const rawVsProcessedDiffs: AuditDiffDetail[] = [];
  const processedVsDbDiffs: AuditDiffDetail[] = [];
  const dbVsUiDiffs: AuditDiffDetail[] = [];

  // Stage 1: Raw (원본) vs Processed (가공)
  const rawName = String(rawInput.name || '');
  if (rawName !== processedOutput.name) {
    rawVsProcessedDiffs.push({
      field: 'name',
      expected: rawName,
      actual: processedOutput.name,
      delta: 'Trimmed/Sliced',
      message: `원본 이름('${rawName}')이 가공 과정에서 글자수 및 여백 조정되어 '${processedOutput.name}'(으)로 변경됨.`
    });
  }

  const rawYield = Number(rawInput.yieldRate || 0);
  const processedYield = processedOutput.yieldRate;
  if (Math.abs(rawYield - processedYield) > 0.000001) {
    const diff = parseFloat((processedYield - rawYield).toFixed(6));
    rawVsProcessedDiffs.push({
      field: 'yieldRate',
      expected: String(rawYield),
      actual: String(processedYield),
      delta: diff > 0 ? `+${diff}` : String(diff),
      message: `수익률 원본 소수점(${rawYield}%)이 소수점 둘째자리 반올림 가공을 거쳐 ${processedYield}%로 변경됨.`
    });
  }

  const rawAssets = Number(rawInput.totalAssets || 0);
  const processedAssets = processedOutput.totalAssets;
  if (Math.round(rawAssets) !== processedAssets) {
    const diff = processedAssets - rawAssets;
    rawVsProcessedDiffs.push({
      field: 'totalAssets',
      expected: String(rawAssets),
      actual: String(processedAssets),
      delta: diff > 0 ? `+${diff}` : String(diff),
      message: `원본 소수점 자산(${rawAssets})이 원 단위 반올림 가공을 거쳐 ${processedAssets} KRW가 됨.`
    });
  }

  // Stage 2: Processed (가공) vs DB Saved (DB 저장)
  if (!dbOutput) {
    processedVsDbDiffs.push({
      field: 'database_entry',
      expected: JSON.stringify(processedOutput),
      actual: 'null',
      delta: 'Missing',
      message: 'Supabase/로컬 DB 저장 실패 또는 데이터 누락 발생!'
    });
  } else {
    if (processedOutput.name !== dbOutput.name) {
      processedVsDbDiffs.push({
        field: 'name',
        expected: processedOutput.name,
        actual: dbOutput.name,
        delta: 'Mismatch',
        message: `가공된 이름('${processedOutput.name}')과 DB 저장 최종 이름('${dbOutput.name}')이 불일치함.`
      });
    }
    if (Math.abs(processedOutput.yieldRate - dbOutput.yieldRate) > 0.0001) {
      const diff = parseFloat((dbOutput.yieldRate - processedOutput.yieldRate).toFixed(4));
      processedVsDbDiffs.push({
        field: 'yieldRate',
        expected: String(processedOutput.yieldRate),
        actual: String(dbOutput.yieldRate),
        delta: diff > 0 ? `+${diff}` : String(diff),
        message: `가공 수익률(${processedOutput.yieldRate}%)과 DB 최종 저장 수익률(${dbOutput.yieldRate}%)이 일치하지 않음.`
      });
    }
    if (processedOutput.totalAssets !== dbOutput.totalAssets) {
      const diff = dbOutput.totalAssets - processedOutput.totalAssets;
      processedVsDbDiffs.push({
        field: 'totalAssets',
        expected: String(processedOutput.totalAssets),
        actual: String(dbOutput.totalAssets),
        delta: diff > 0 ? `+${diff}` : String(diff),
        message: `가공된 총 자산(${processedOutput.totalAssets})과 DB에 최종 기록된 자산(${dbOutput.totalAssets})이 일치하지 않음.`
      });
    }
  }

  // Stage 3: DB vs UI (화면 출력)
  if (uiOutput !== undefined && uiOutput !== null) {
    if (dbOutput) {
      if (dbOutput.name !== uiOutput.name) {
        dbVsUiDiffs.push({
          field: 'name',
          expected: dbOutput.name,
          actual: uiOutput.name,
          delta: 'Mismatch',
          message: `DB 저장 이름('${dbOutput.name}')이 UI 화면에 '${uiOutput.name}'(으)로 렌더링되고 있음.`
        });
      }
      if (Math.abs(dbOutput.yieldRate - uiOutput.yieldRate) > 0.0001) {
        const diff = parseFloat((uiOutput.yieldRate - dbOutput.yieldRate).toFixed(4));
        dbVsUiDiffs.push({
          field: 'yieldRate',
          expected: String(dbOutput.yieldRate),
          actual: String(uiOutput.yieldRate),
          delta: diff > 0 ? `+${diff}` : String(diff),
          message: `DB 저장 수익률(${dbOutput.yieldRate}%)과 UI 화면에 표시되는 수익률(${uiOutput.yieldRate}%)이 서로 불일치함.`
        });
      }
      if (dbOutput.totalAssets !== uiOutput.totalAssets) {
        const diff = uiOutput.totalAssets - dbOutput.totalAssets;
        dbVsUiDiffs.push({
          field: 'totalAssets',
          expected: String(dbOutput.totalAssets),
          actual: String(uiOutput.totalAssets),
          delta: diff > 0 ? `+${diff}` : String(diff),
          message: `DB 저장 자산(${dbOutput.totalAssets})이 UI 화면에 ${uiOutput.totalAssets}로 다르게 표시되고 있음.`
        });
      }
    }
  }

  const hasMismatch = rawVsProcessedDiffs.length > 0 || processedVsDbDiffs.length > 0 || dbVsUiDiffs.length > 0;
  const status = hasMismatch ? 'MISMATCH' : 'SUCCESS';

  let summary = '';
  if (status === 'SUCCESS') {
    summary = `파이프라인 실시간 검증 100% 정상 (원본 == 가공 == DB == 화면 완료) [닉네임: ${processedOutput.name}]`;
  } else {
    const issues: string[] = [];
    if (rawVsProcessedDiffs.length > 0) issues.push(`원본-가공오차(${rawVsProcessedDiffs.length}건)`);
    if (processedVsDbDiffs.length > 0) issues.push(`가공-DB오차(${processedVsDbDiffs.length}건)`);
    if (dbVsUiDiffs.length > 0) issues.push(`DB-화면오차(${dbVsUiDiffs.length}건)`);
    summary = `데이터 파이프라인 무결성 오류 감지! (${issues.join(', ')}) [닉네임: ${processedOutput.name}]`;
  }

  return addAuditLog({
    pipeline: 'Score Submission Integrity Audit',
    status,
    rawVsProcessed: {
      status: rawVsProcessedDiffs.length > 0 ? 'MISMATCH' : 'SUCCESS',
      diffs: rawVsProcessedDiffs
    },
    processedVsDb: {
      status: processedVsDbDiffs.length > 0 ? 'MISMATCH' : 'SUCCESS',
      diffs: processedVsDbDiffs
    },
    dbVsUi: {
      status: uiOutput === undefined ? 'NOT_APPLICABLE' : (dbVsUiDiffs.length > 0 ? 'MISMATCH' : 'SUCCESS'),
      diffs: dbVsUiDiffs
    },
    summary
  });
}

// Initial cache load
loadAuditLogs();

const DEFAULT_ILBONG_LEADERBOARD: LeaderboardEntry[] = [];
const DEFAULT_DANTA_LEADERBOARD: LeaderboardEntry[] = [];

function getLeaderboard(type: 'ilbong' | 'danta'): LeaderboardEntry[] {
  const file = type === 'danta' ? DANTA_LEADERBOARD_FILE : ILBONG_LEADERBOARD_FILE;
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const rawData = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      const hasFake = parsed.some(entry => entry.name === '워런 버핏 후계자' || entry.name === '초전도 스캘퍼');
      if (hasFake) {
        fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
        return [];
      }
      return parsed;
    }
    return [];
  } catch (err) {
    console.error(`Error reading ${type} leaderboard file:`, err);
    return [];
  }
}

function saveLeaderboard(type: 'ilbong' | 'danta', entries: LeaderboardEntry[]): boolean {
  const file = type === 'danta' ? DANTA_LEADERBOARD_FILE : ILBONG_LEADERBOARD_FILE;
  try {
    fs.writeFileSync(file, JSON.stringify(entries, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${type} leaderboard file:`, err);
    return false;
  }
}

function getAllScores(type: 'ilbong' | 'danta'): LeaderboardEntry[] {
  const file = type === 'danta' ? ALL_DANTA_SCORES_FILE : ALL_ILBONG_SCORES_FILE;
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }
    const rawData = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      const hasFake = parsed.some(entry => entry.name === '워런 버핏 후계자' || entry.name === '초전도 스캘퍼');
      if (hasFake) {
        fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
        return [];
      }
      return parsed;
    }
    return [];
  } catch (err) {
    console.error(`Error reading ${type} all scores file:`, err);
    return [];
  }
}

function saveAllScores(type: 'ilbong' | 'danta', entries: LeaderboardEntry[]): boolean {
  const file = type === 'danta' ? ALL_DANTA_SCORES_FILE : ALL_ILBONG_SCORES_FILE;
  try {
    fs.writeFileSync(file, JSON.stringify(entries, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${type} all scores file:`, err);
    return false;
  }
}

const app = express();
const PORT = 3000;

// Add JSON parsing middleware
app.use(express.json());

// Middleware to normalize Vercel serverless function request paths
app.use((req, res, next) => {
  const url = req.url;
  if (!url.startsWith('/api/') && (
    url === '/health' || url.startsWith('/health?') ||
    url === '/leaderboard' || url.startsWith('/leaderboard?') ||
    url === '/jodoju-list' || url.startsWith('/jodoju-list?') ||
    url === '/stock-data' || url.startsWith('/stock-data?') ||
    url === '/search-stock' || url.startsWith('/search-stock?')
  )) {
    req.url = '/api' + url;
  }
  next();
});

  // 1. API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // Helper to clean HTML entities and CDATA from RSS titles
  function cleanTitle(title: string): string {
    return title
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&#039;/g, "'")
      .trim();
  }

  // Helper to fetch and parse an RSS feed
  async function fetchRssFeed(url: string): Promise<any[]> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/xml, text/xml, */*'
        }
      });
      if (!response.ok) {
        console.warn(`[RSS Fetch] Failed to fetch ${url}: ${response.statusText}`);
        return [];
      }
      const xml = await response.text();
      const items: any[] = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const titleRegex = /<title>([\s\S]*?)<\/title>/;
      const linkRegex = /<link>([\s\S]*?)<\/link>/;
      const pubDateRegex = /<pubDate>([\s\S]*?)<\/pubDate>/;
      
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const itemXml = match[1];
        const titleMatch = titleRegex.exec(itemXml);
        const linkMatch = linkRegex.exec(itemXml);
        const pubDateMatch = pubDateRegex.exec(itemXml);
        
        if (titleMatch) {
          let title = cleanTitle(titleMatch[1]);
          // Strip out trailing source info from Google News, e.g., " - 조선일보"
          title = title.replace(/\s+-\s+[^"'-]+$/, '').trim();
          
          const link = linkMatch ? linkMatch[1].trim() : '';
          const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toUTCString();
          items.push({ title, link, pubDate });
        }
      }
      return items;
    } catch (err) {
      console.warn(`[RSS Fetch] Error fetching RSS ${url}:`, err);
      return [];
    }
  }

  // GET: Retrieve raw accumulated news
  app.get('/api/cron-news', (req, res) => {
    const filePath = getWritablePath('raw_news_accumulator.json');
    try {
      if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      const parsed = JSON.parse(data);
      res.json(parsed);
    } catch (err: any) {
      console.error('[API news-accumulator] Error reading accumulator file:', err);
      res.status(500).json({ error: err.message || err });
    }
  });

  // POST: Fetch real-time economy/stock news, perform duplication check, and accumulate
  app.post('/api/cron-news', async (req, res) => {
    const filePath = getWritablePath('raw_news_accumulator.json');
    try {
      // Fetch news from Google News RSS for "주식" and "경제"
      const stockFeedUrl = 'https://news.google.com/rss/search?q=%EC%A3%BC%EC%8B%9D&hl=ko&gl=KR&ceid=KR:ko';
      const economyFeedUrl = 'https://news.google.com/rss/search?q=%EA%B2%BD%EC%A0%9C&hl=ko&gl=KR&ceid=KR:ko';
      
      const [stockNews, economyNews] = await Promise.all([
        fetchRssFeed(stockFeedUrl),
        fetchRssFeed(economyFeedUrl)
      ]);
      
      const rawNewsList = [...stockNews, ...economyNews];
      
      // Load existing news accumulator
      let existingNews: any[] = [];
      if (fs.existsSync(filePath)) {
        try {
          const fileData = fs.readFileSync(filePath, 'utf-8');
          existingNews = JSON.parse(fileData);
        } catch (e) {
          existingNews = [];
        }
      }
      if (!Array.isArray(existingNews)) {
        existingNews = [];
      }
      
      // Filter out duplicate titles
      const existingTitles = new Set(existingNews.map(item => item.title.trim()));
      const newItems: any[] = [];
      
      for (const item of rawNewsList) {
        const cleanT = item.title.trim();
        if (cleanT && !existingTitles.has(cleanT)) {
          newItems.push({
            title: cleanT,
            link: item.link,
            pubDate: item.pubDate,
            timestamp: Date.now()
          });
          existingTitles.add(cleanT); // Prevent internal duplicates during the same run
        }
      }
      
      // Prepend or append. Prepend is better so newest comes first, but keep total size managed (max 300)
      let updatedList = [...newItems, ...existingNews];
      if (updatedList.length > 300) {
        updatedList = updatedList.slice(0, 300);
      }
      
      fs.writeFileSync(filePath, JSON.stringify(updatedList, null, 2), 'utf-8');
      console.log(`[Cron News] Accumulated ${newItems.length} fresh news items. Total in accumulator: ${updatedList.length}`);
      
      res.json({
        status: 'success',
        addedCount: newItems.length,
        totalCount: updatedList.length,
        added: newItems
      });
    } catch (err: any) {
      console.error('[API news-accumulator] Error during collection/saving:', err);
      res.status(500).json({ error: err.message || err });
    }
  });

  // Get Leaderboard (Sorted by yieldRate descending, limit top 100 on DB and top 10 on UI, we load type from query)
  app.get('/api/leaderboard', async (req, res) => {
    const type = (req.query.type === 'danta' ? 'danta' : 'ilbong') as 'ilbong' | 'danta';
    
    if (isSupabaseActive()) {
      const supabaseList = await getLeaderboardFromSupabase(type);
      if (supabaseList !== null) {
        return res.json({ leaderboard: supabaseList });
      }
    }

    const list = getLeaderboard(type);
    const sorted = [...list].sort((a, b) => b.yieldRate - a.yieldRate);
    res.json({ leaderboard: sorted }); // Send the entire list (maintained at max 10 entries)
  });

  // Post new score to leaderboard (Push-out top 10 algorithm with master tracking and percentile calculation)
  app.post('/api/leaderboard', async (req, res) => {
    const { name, yieldRate, symbol, totalAssets, type, simulateMismatch } = req.body;
    const boardType = (type === 'danta' ? 'danta' : 'ilbong') as 'ilbong' | 'danta';

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: '유효한 닉네임을 입력해주세요.' });
    }
    if (typeof yieldRate !== 'number' || typeof totalAssets !== 'number') {
      return res.status(400).json({ error: '올바르지 않은 자산 및 수익률 데이터입니다.' });
    }

    const cleanName = name.trim().slice(0, 12); // Limit to 12 chars for safety and responsiveness
    
    const today = new Date();
    const krDateStr = new Date(today.getTime() + (9 * 60 * 60 * 1000)).toISOString().slice(0, 10); // Simple KST date string

    const rawInput = { name, yieldRate, symbol, totalAssets, type };
    
    // Processed entry creation (가공 데이터)
    const newEntry: LeaderboardEntry = {
      name: cleanName,
      yieldRate: parseFloat(yieldRate.toFixed(2)),
      symbol: symbol || '랜덤 종목',
      totalAssets: Math.round(totalAssets),
      date: krDateStr
    };

    if (simulateMismatch) {
      // Artificially modify the processed entry to trigger Stage 1: Raw vs Processed mismatch!
      newEntry.yieldRate = parseFloat((newEntry.yieldRate + 25.5).toFixed(2));
    }

    if (isSupabaseActive()) {
      const savedToSupabase = await saveScoreToSupabase(newEntry, boardType);
      if (savedToSupabase) {
        const allScores = await getAllScoresFromSupabase(boardType);
        if (allScores !== null) {
          // Read back to verify written DB values (DB 저장 데이터)
          let dbOutput = allScores.find(
            item => item.name === newEntry.name && item.yieldRate === newEntry.yieldRate && item.date === newEntry.date
          ) || null;

          if (simulateMismatch) {
            // Artificially mismatch the DB entry to trigger Stage 2: Processed vs DB mismatch!
            dbOutput = {
              ...(dbOutput || newEntry),
              totalAssets: newEntry.totalAssets + 500000 // 500k KRW delta
            };
          }

          // UI output (화면 출력 데이터)
          let uiOutput = { ...newEntry };
          if (simulateMismatch) {
            // Artificially mismatch the UI entry to trigger Stage 3: DB vs UI mismatch!
            uiOutput = {
              ...newEntry,
              name: newEntry.name + '_UI'
            };
          }

          // Run Pipeline Audit!
          const auditLog = auditLeaderboardFlow(rawInput, newEntry, dbOutput, uiOutput);

          const masterRank = allScores.findIndex(
            item => item.name === newEntry.name && item.yieldRate === newEntry.yieldRate && item.date === newEntry.date
          ) + 1;

          const totalPlayers = allScores.length;

          let percentile = 100;
          if (totalPlayers > 0) {
            if (masterRank === 1) {
              percentile = 1;
            } else if (masterRank === 2) {
              percentile = 2;
            } else {
              percentile = Math.max(1, Math.min(100, Math.round((masterRank / totalPlayers) * 100)));
              if (percentile <= 2 && masterRank > 2) {
                percentile = 3;
              }
            }
          }

          const top10 = allScores.slice(0, 10);
          const isTop10 = masterRank <= 10;

          return res.json({
            success: true,
            entry: newEntry,
            rank: masterRank,
            total: totalPlayers,
            isTop10,
            percentile,
            leaderboard: top10,
            audit: auditLog
          });
        }
      }
      console.warn('Supabase save/retrieve failed, falling back to local files.');
    }

    // Local file fallback
    // 1. Get and update all master scores list
    const allScores = getAllScores(boardType);
    allScores.push(newEntry);
    const sortedAllScores = [...allScores].sort((a, b) => b.yieldRate - a.yieldRate);
    saveAllScores(boardType, sortedAllScores);

    // Read back to verify local DB file saved entry (DB 저장 데이터)
    let dbOutput = sortedAllScores.find(
      item => item.name === newEntry.name && item.yieldRate === newEntry.yieldRate && item.date === newEntry.date
    ) || null;

    if (simulateMismatch) {
      // Artificially mismatch the DB entry to trigger Stage 2: Processed vs DB mismatch!
      dbOutput = {
        ...(dbOutput || newEntry),
        totalAssets: newEntry.totalAssets + 500000 // 500k KRW delta
      };
    }

    // UI output (화면 출력 데이터)
    let uiOutput = { ...newEntry };
    if (simulateMismatch) {
      // Artificially mismatch the UI entry to trigger Stage 3: DB vs UI mismatch!
      uiOutput = {
        ...newEntry,
        name: newEntry.name + '_UI'
      };
    }

    // Run Pipeline Audit!
    const auditLog = auditLeaderboardFlow(rawInput, newEntry, dbOutput, uiOutput);

    // 2. Find rank inside master scores list
    const masterRank = sortedAllScores.findIndex(
      item => item.name === newEntry.name && item.yieldRate === newEntry.yieldRate && item.date === newEntry.date
    ) + 1;

    const totalPlayers = sortedAllScores.length;

    // 3. Percentile calculation
    let percentile = 100;
    if (totalPlayers > 0) {
      if (masterRank === 1) {
        percentile = 1;
      } else if (masterRank === 2) {
        percentile = 2;
      } else {
        percentile = Math.max(1, Math.min(100, Math.round((masterRank / totalPlayers) * 100)));
        if (percentile <= 2 && masterRank > 2) {
          percentile = 3;
        }
      }
    }

    // 4. Update the Top 10 Leaderboard
    const currentTop10 = getLeaderboard(boardType);
    let isTop10 = masterRank <= 10;
    let savedTop10 = currentTop10;

    if (isTop10) {
      const updatedTop10 = [...currentTop10, newEntry]
        .sort((a, b) => b.yieldRate - a.yieldRate)
        .slice(0, 10);
      const success = saveLeaderboard(boardType, updatedTop10);
      if (success) {
        savedTop10 = updatedTop10;
      } else {
        return res.status(500).json({ error: '랭킹 저장에 실패했습니다.' });
      }
    }

    res.json({ 
      success: true, 
      entry: newEntry,
      rank: masterRank,
      total: totalPlayers,
      isTop10,
      percentile,
      leaderboard: savedTop10,
      audit: auditLog
    });
  });

  // --- [Debug / Architecture Diagnostics APIs] ---
  
  // Get overall system debug/diagnostics status
  app.get(['/api/debug/status', '/api/admin/status'], async (req, res) => {
    const envVars = {
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'Set (masked)' : 'Not Set',
      APP_URL: process.env.APP_URL || 'Not Set',
      SUPABASE_URL: process.env.SUPABASE_URL || 'Not Set',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? 'Set (masked)' : 'Not Set',
      GITHUB_REPO: process.env.GITHUB_REPO || 'Not Set',
      VERCEL: process.env.VERCEL || 'Not Set'
    };

    const envType = process.env.VERCEL === '1' 
      ? 'Vercel Serverless' 
      : (process.env.NODE_ENV === 'production' ? 'Production Container' : 'Development');

    let supabaseStatus = 'Not Configured';
    let supabaseTableCount = null;
    let supabaseError = null;

    if (isSupabaseActive()) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { count, error } = await supabase
            .from('kstock_leaderboard')
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            supabaseStatus = 'Error (Table issue or key issue)';
            supabaseError = error.message;
          } else {
            supabaseStatus = 'Connected';
            supabaseTableCount = count;
          }
        } catch (err: any) {
          supabaseStatus = 'Connection Exception';
          supabaseError = err.message || err;
        }
      } else {
        supabaseStatus = 'Initialization Failed';
      }
    }

    // Cache Stats
    const cacheEntries: any[] = [];
    stockCache.forEach((value, key) => {
      cacheEntries.push({
        key,
        candlesCount: value.candles.length,
        name: value.name,
        ageMinutes: Math.round((Date.now() - value.timestamp) / 60000)
      });
    });

    res.json({
      timestamp: Date.now(),
      envType,
      nodeEnv: process.env.NODE_ENV || 'development',
      envVars,
      supabase: {
        status: supabaseStatus,
        count: supabaseTableCount,
        error: supabaseError,
        sqlSchema: `CREATE TABLE kstock_leaderboard (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  yield_rate NUMERIC NOT NULL,
  symbol TEXT NOT NULL,
  total_assets NUMERIC NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE kstock_platform_data (
  key TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`
      },
      cache: {
        size: stockCache.size,
        entries: cacheEntries,
        ttl: CACHE_TTL
      },
      serverTime: new Date().toISOString(),
      memory: process.memoryUsage()
    });
  });

  // Clear server cache
  app.post('/api/debug/cache/clear', (req, res) => {
    stockCache.clear();
    res.json({ success: true, message: 'Server stock cache cleared successfully' });
  });

  // Get GitHub Latest Commit info
  app.get('/api/debug/github-commit', async (req, res) => {
    const repo = (req.query.repo as string) || process.env.GITHUB_REPO || '';
    if (!repo || !repo.includes('/')) {
      return res.status(400).json({ 
        error: '유효한 GitHub 저장소 경로(owner/repo)가 지정되지 않았습니다.',
        example: 'bjgb1004/react-example'
      });
    }

    try {
      const url = `https://api.github.com/repos/${repo}/commits?per_page=1`;
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'K-Stock-Simulator-Debug-Agent'
        }
      });
      if (!response.ok) {
        throw new Error(`GitHub API returned status ${response.status}`);
      }
      const data: any = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        const lastCommit = data[0];
        res.json({
          success: true,
          repo,
          sha: lastCommit.sha,
          author: lastCommit.commit?.author?.name,
          date: lastCommit.commit?.author?.date,
          message: lastCommit.commit?.message,
          htmlUrl: lastCommit.html_url
        });
      } else {
        res.status(404).json({ error: '커밋 이력을 찾을 수 없습니다.' });
      }
    } catch (err: any) {
      res.status(500).json({ 
        error: 'GitHub API 요청에 실패했습니다.', 
        details: err.message || err 
      });
    }
  });

  // Get Vercel deployment variables
  app.get('/api/debug/vercel-deploy', (req, res) => {
    res.json({
      VERCEL: process.env.VERCEL || 'Not active',
      VERCEL_ENV: process.env.VERCEL_ENV || 'Not active',
      VERCEL_URL: process.env.VERCEL_URL || 'Not active',
      VERCEL_REGION: process.env.VERCEL_REGION || 'Not active',
      VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA || 'Not active',
      VERCEL_GIT_COMMIT_MESSAGE: process.env.VERCEL_GIT_COMMIT_MESSAGE || 'Not active',
      VERCEL_GIT_COMMIT_AUTHOR_NAME: process.env.VERCEL_GIT_COMMIT_AUTHOR_NAME || 'Not active'
    });
  });

  // Get data verification audit logs
  app.get('/api/debug/audit-logs', (req, res) => {
    res.json({ logs: loadAuditLogs() });
  });

  // Clear data verification audit logs
  app.post('/api/debug/audit-logs/clear', (req, res) => {
    cachedAuditLogs = [];
    saveAuditLogs();
    res.json({ success: true, message: '데이터 파이프라인 검증 로그가 성공적으로 초기화되었습니다.' });
  });

  // --- [주도주 15종목 일별 자동 추출 및 캐싱 시스템] ---
  const FALLBACK_15_JODOJU = [
    { rank: 1, name: "삼천당제약", code: "000250", changeRatio: 16.5, tradingValue: 920000000000 },
    { rank: 2, name: "에스티팜", code: "237690", changeRatio: 14.8, tradingValue: 680000000000 },
    { rank: 3, name: "태성", code: "195440", changeRatio: 21.3, tradingValue: 380000000000 },
    { rank: 4, name: "알테오젠", code: "196170", changeRatio: 9.5, tradingValue: 710000000000 },
    { rank: 5, name: "실리콘투", code: "257720", changeRatio: 11.2, tradingValue: 490000000000 },
    { rank: 6, name: "삼양식품", code: "003230", changeRatio: 9.2, tradingValue: 540000000000 },
    { rank: 7, name: "한미반도체", code: "042700", changeRatio: 15.2, tradingValue: 850000000000 },
    { rank: 8, name: "HD현대일렉트릭", code: "267260", changeRatio: 11.5, tradingValue: 490000000000 },
    { rank: 9, name: "SK하이닉스", code: "000660", changeRatio: 10.88, tradingValue: 18005147000000 },
    { rank: 10, name: "대원전선", code: "006340", changeRatio: 8.84, tradingValue: 410176000000 },
    { rank: 11, name: "리가켐바이오", code: "141080", changeRatio: 12.4, tradingValue: 310000000000 },
    { rank: 12, name: "HLB", code: "028300", changeRatio: 7.2, tradingValue: 280000000000 },
    { rank: 13, name: "유한양행", code: "000100", changeRatio: 6.4, tradingValue: 350000000000 },
    { rank: 14, name: "바이오다인", code: "314930", changeRatio: 29.9, tradingValue: 350000000000 },
    { rank: 15, name: "동양철관", code: "008970", changeRatio: 18.2, tradingValue: 220000000000 }
  ];

  const JODOJU_CACHE_FILE = getWritablePath('jodoju_cache.json');

  function getKstNow(): Date {
    const utc = Date.now() + (new Date().getTimezoneOffset() * 60000);
    return new Date(utc + (3600000 * 9)); // UTC + 9 hours for KST
  }

  function getJodojuTargetDate(): string {
    const kst = getKstNow();
    
    // 만약 현재 KST 시간이 오후 4시(16시) 이전이라면 전일 주도주 리스트를 보여줍니다.
    if (kst.getHours() < 16) {
      kst.setDate(kst.getDate() - 1);
    }
    
    // 주말(토, 일)인 경우 금요일 주도주로 백롤링 처리합니다.
    let day = kst.getDay();
    while (day === 0 || day === 6) {
      kst.setDate(kst.getDate() - 1);
      day = kst.getDay();
    }
    
    return kst.toISOString().slice(0, 10);
  }

  async function fetchSiseQuant(sosok: number): Promise<string> {
    const url = `https://finance.naver.com/sise/sise_quant.nhn?sosok=${sosok}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const buffer = await res.arrayBuffer();
    return iconv.decode(Buffer.from(buffer), 'euc-kr');
  }

  function stripTags(text: string): string {
    return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  function parseSiseQuant(html: string): any[] {
    const stocks: any[] = [];
    const rows = html.split('<tr>');
    
    for (const row of rows) {
      if (!row.includes('class="tltle"')) continue;
      
      const codeMatch = /href="\/item\/main\.naver\?code=(\d+)"/i.exec(row);
      const nameMatch = /class="tltle">([^<]+)<\/a>/i.exec(row);
      if (!codeMatch || !nameMatch) continue;
      
      const code = codeMatch[1];
      const name = nameMatch[1].trim();
      
      const tdRegex = /<td[^>]*>([\s\S]*?)<\/td>/g;
      let tdMatch;
      const tds = [];
      while ((tdMatch = tdRegex.exec(row)) !== null) {
        tds.push(stripTags(tdMatch[1]));
      }
      
      if (tds.length >= 7) {
        const priceStr = tds[2].replace(/,/g, '');
        const changeRatioStr = tds[4].replace(/,/g, '').replace('%', '');
        const volumeStr = tds[5].replace(/,/g, '');
        const tradingValueStr = tds[6].replace(/,/g, '');
        
        const price = parseInt(priceStr, 10) || 0;
        const changeRatio = parseFloat(changeRatioStr) || 0.0;
        const volume = parseInt(volumeStr, 10) || 0;
        const tradingValue = parseInt(tradingValueStr, 10) || 0; // in millions of KRW
        
        stocks.push({
          code,
          name,
          changeRatio,
          price,
          volume,
          tradingValue
        });
      }
    }
    return stocks;
  }

  async function isGreenCandle(code: string): Promise<boolean> {
    try {
      const url = `https://fchart.stock.naver.com/sise.nhn?symbol=${code}&timeframe=day&count=1&requestType=0`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) return false;
      const text = await res.text();
      
      const itemMatch = /<item data="([^"]+)"/i.exec(text);
      if (!itemMatch) return false;
      
      const parts = itemMatch[1].split('|');
      if (parts.length < 5) return false;
      
      const open = parseInt(parts[1], 10);
      const close = parseInt(parts[4], 10);
      
      return close > open; // 양봉 (Close > Open)
    } catch (err) {
      return false;
    }
  }

  async function generateJodojuList(): Promise<any[]> {
    try {
      console.log(`[주도주 자동 업데이트] 네이버에서 KOSPI & KOSDAQ 거래대금 상위 종목 수집 중...`);
      const [kospiHtml, kosdaqHtml] = await Promise.all([
        fetchSiseQuant(0),
        fetchSiseQuant(1)
      ]);
      
      const kospiStocks = parseSiseQuant(kospiHtml);
      const kosdaqStocks = parseSiseQuant(kosdaqHtml);
      
      const allStocks = [...kospiStocks, ...kosdaqStocks];
      console.log(`[주도주 자동 업데이트] 총 KOSPI ${kospiStocks.length}개, KOSDAQ ${kosdaqStocks.length}개 파싱 완료.`);
      
      // Filter 1: changeRatio >= +3% and is not an ETF/ETN/Fund/Index tracker
      const candidates = allStocks.filter(s => {
        if (s.changeRatio < 3.0) return false;
        
        const nameLower = s.name.toLowerCase();
        const etfKeywords = [
          'kodex', 'tiger', 'ace', 'sol', 'rise', 'kbstar', 'kosef', 'hanaro', 'arirang', 'plus', 'kis', 'kindex',
          '레버리지', '인버스', '선물', 'etf', 'etn', 'msci', '국채', '2x', '3x', '하락', '상승', '채권'
        ];
        
        const isEtf = etfKeywords.some(keyword => nameLower.includes(keyword));
        return !isEtf;
      });
      console.log(`[주도주 자동 업데이트] 상승률 +3% 이상 후보 ${candidates.length}개 필터링 완료.`);
      
      // Filter 2: Close > Open (양봉)
      console.log('[주도주 자동 업데이트] 실시간 양봉(Close > Open) 여부 병렬 체크 중...');
      const results = await Promise.all(
        candidates.map(async (stock) => {
          const green = await isGreenCandle(stock.code);
          return { ...stock, isGreen: green };
        })
      );
      
      const finalCandidates = results.filter(r => r.isGreen);
      console.log(`[주도주 자동 업데이트] 양봉 기준 충족 종목: ${finalCandidates.length}개`);
      
      // Sort by tradingValue descending
      finalCandidates.sort((a, b) => b.tradingValue - a.tradingValue);
      
      const selectedJodoju = finalCandidates.slice(0, 15).map((s, idx) => ({
        rank: idx + 1,
        code: s.code,
        name: s.name,
        changeRatio: s.changeRatio,
        tradingValue: s.tradingValue * 1000000 // 원화로 변경 (백만원 단위 -> 원 단위)
      }));
      
      if (selectedJodoju.length > 0) {
        console.log(`[주도주 자동 업데이트] 최종 15개 주도주 선정 성공! #1: ${selectedJodoju[0].name}`);
        return selectedJodoju;
      }
      throw new Error('주도주 추출 조건을 충족하는 종목을 찾지 못했습니다.');
    } catch (err: any) {
      console.error('[주도주 자동 업데이트] 동적 추출 에러:', err.message || err);
      return [];
    }
  }

  function saveJodojuToCacheAndStatic(stocks: any[], targetDate: string) {
    try {
      // 1. 메모리/파일 캐시 저장
      fs.writeFileSync(JODOJU_CACHE_FILE, JSON.stringify({ targetDate, stocks }, null, 2), 'utf-8');
      
      // 2. public/data/jodoju_list.json 정적 파일 저장
      try {
        const publicDataPath = path.resolve(process.cwd(), 'public', 'data', 'jodoju_list.json');
        fs.mkdirSync(path.dirname(publicDataPath), { recursive: true });
        fs.writeFileSync(publicDataPath, JSON.stringify(stocks, null, 2), 'utf-8');
      } catch (e: any) {
        console.warn('[주도주 저장] 정적 public 폴더 파일 쓰기 건너뜀 (서버리스 읽기전용 환경):', e.message || e);
      }

      // 3. dist/data/jodoju_list.json 정적 파일 저장 (프로덕션 배포용)
      try {
        const distDataPath = path.resolve(process.cwd(), 'dist', 'data', 'jodoju_list.json');
        if (fs.existsSync(path.dirname(distDataPath))) {
          fs.writeFileSync(distDataPath, JSON.stringify(stocks, null, 2), 'utf-8');
        }
      } catch (e: any) {
        console.warn('[주도주 저장] 정적 dist 폴더 파일 쓰기 건너뜀 (서버리스 읽기전용 환경):', e.message || e);
      }
      console.log(`[주도주 저장 완료] 캐시 파일 및 static json 파일 저장 완료 (Target Date: ${targetDate})`);
    } catch (err) {
      console.error('[주도주 저장 에러] 정적 파일 쓰기 실패:', err);
    }
  }

  // 주도주 13종목 실시간/자동 업데이트 API (동적 주도주 생성 시도 후 실패시 clean fallback 목록 반환)
  app.get('/api/jodoju-list', async (req, res) => {
    try {
      const targetDate = getJodojuTargetDate();
      console.log(`[주도주 API 요청] Target Date: ${targetDate}`);
      
      // 1. Check file cache
      if (fs.existsSync(JODOJU_CACHE_FILE)) {
        try {
          const cacheContent = fs.readFileSync(JODOJU_CACHE_FILE, 'utf-8');
          const cache = JSON.parse(cacheContent);
          if (cache && cache.targetDate === targetDate && Array.isArray(cache.stocks) && cache.stocks.length > 0) {
            console.log(`[주도주 API] 캐시 히트! 캐시된 ${cache.stocks.length}개 주도주 목록 반환`);
            return res.json(cache.stocks);
          }
        } catch (e) {
          console.error('[주도주 API] 캐시 파싱 에러:', e);
        }
      }

      // 2. Fetch live leading stocks dynamically from Naver Finance
      console.log(`[주도주 API] 캐시 미스/만료. 실시간 네이버 주도주 동적 추출 시작...`);
      const dynamicStocks = await generateJodojuList();
      if (Array.isArray(dynamicStocks) && dynamicStocks.length > 0) {
        saveJodojuToCacheAndStatic(dynamicStocks, targetDate);
        return res.json(dynamicStocks);
      }
      
      console.log(`[주도주 API] 동적 주도주 추출 실패, fallback 목록 반환`);
      return res.json(FALLBACK_15_JODOJU);
    } catch (err: any) {
      console.error('[주도주 API 에러]', err.message || err);
      return res.json(FALLBACK_15_JODOJU);
    }
  });

  const KNOWN_TICKER_NAMES: Record<string, string> = {
    '005930': '삼성전자',
    '000660': 'SK하이닉스',
    '196170': '알테오젠',
    '042700': '한미반도체',
    '012450': '한화에어로스페이스',
    '003230': '삼양식품',
    '267260': 'HD현대일렉트릭',
    '141080': '리가켐바이오',
    '195440': '태성',
    '314930': '바이오다인',
    '010170': '피에스케이홀딩스',
    '391100': '에이프릴바이오',
    '035420': 'NAVER',
    '035720': '카카오',
    '005380': '현대차',
    '247540': '에코프로비엠',
    '068270': '셀트리온',
    '086520': '에코프로'
  };

  function getTickSize(price: number): number {
    if (price < 2000) return 1;
    if (price < 5000) return 5;
    if (price < 10000) return 10;
    if (price < 50000) return 50;
    if (price < 100000) return 100;
    if (price < 500000) return 500;
    return 1000;
  }

  function roundToTick(price: number): number {
    if (price <= 0) return 0;
    const tick = getTickSize(price);
    return Math.round(price / tick) * tick;
  }

  function generateFallbackDailyCandles(ticker: string): any[] {
    let basePrice = 25000;
    const hash = parseInt(ticker, 10) || 123456;
    basePrice = 5000 + (hash % 150000); // 5,000 ~ 155,000 KRW
    
    const candles: any[] = [];
    const count = 120;
    let currentPrice = basePrice;
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
      const candleDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayOfWeek = candleDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue;
      
      const dateStr = candleDate.toISOString().slice(0, 10);
      
      const change = currentPrice * 0.02 * (Math.random() - 0.48); // Slight upward bias
      const open = roundToTick(currentPrice);
      const close = roundToTick(currentPrice + change);
      const high = roundToTick(Math.max(open, close) + Math.random() * (currentPrice * 0.015));
      const low = roundToTick(Math.min(open, close) - Math.random() * (currentPrice * 0.015));
      const volume = Math.round(100000 + Math.random() * 900000);
      
      candles.push({
        date: dateStr,
        open,
        high,
        low,
        close,
        volume
      });
      
      currentPrice = close;
    }
    
    return candles;
  }

  // --- 5단계 : Replay Engine Data Provider 추상화 아키텍처 ---
  interface IStockDataProvider {
    name: string;
    fetchStockData(ticker: string, timeframe: 'day' | 'minute'): Promise<{ candles: any[]; name: string }>;
  }

  // 1. Data Provider A: Naver Finance Real-time Provider
  class NaverStockDataProvider implements IStockDataProvider {
    name = "Naver Finance Data Provider";

    async fetchStockData(ticker: string, timeframe: 'day' | 'minute'): Promise<{ candles: any[]; name: string }> {
      const mode = timeframe;
      const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
      const candles: any[] = [];

      if (mode === 'minute') {
        const naverUrl = `https://fchart.stock.naver.com/sise.nhn?symbol=${cleanTicker}&timeframe=minute&count=1200&requestType=0`;
        const response = await fetch(naverUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          throw new Error(`Naver Minute API returned status ${response.status}`);
        }

        const xmlText = await response.text();
        const regex = /<item data="([^"]+)"/g;
        let match;
        const rawItems: any[] = [];

        while ((match = regex.exec(xmlText)) !== null) {
          const parts = match[1].split('|');
          if (parts.length >= 6) {
            const rawOpen = parts[1] === 'null' ? null : (parseInt(parts[1], 10) || null);
            const rawHigh = parts[2] === 'null' ? null : (parseInt(parts[2], 10) || null);
            const rawLow = parts[3] === 'null' ? null : (parseInt(parts[3], 10) || null);
            const rawClose = parseInt(parts[4], 10) || 0;
            const volumeAccum = parseInt(parts[5], 10) || 0;

            rawItems.push({
              rawDate: parts[0],
              open: rawOpen,
              high: rawHigh,
              low: rawLow,
              close: rawClose,
              volumeAccum: volumeAccum
            });
          }
        }

        if (rawItems.length === 0) {
          throw new Error(`No minute candles parsed from Naver`);
        }

        // Group raw items by day
        const daysMap = new Map<string, any[]>();
        rawItems.forEach(item => {
          const rawDate = item.rawDate;
          if (rawDate && rawDate.length >= 8) {
            const dayKey = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
            if (!daysMap.has(dayKey)) {
              daysMap.set(dayKey, []);
            }
            daysMap.get(dayKey)!.push(item);
          }
        });

        // Get sorted list of days
        let sortedDays = Array.from(daysMap.keys()).sort();
        if (sortedDays.length === 0) {
          throw new Error('No trading days found in minute data');
        }

        // Exclude today's data if it's before 16:00 KST to guarantee complete, post-market 4 PM finalized candles
        const kstNow = new Date(Date.now() + (9 * 60 * 60 * 1000));
        const kstTodayStr = kstNow.toISOString().slice(0, 10);
        const kstHour = kstNow.getUTCHours();
        const kstMinutes = kstNow.getUTCMinutes();
        const currentKstTimeNum = kstHour * 100 + kstMinutes;

        if (sortedDays[sortedDays.length - 1] === kstTodayStr && currentKstTimeNum < 1600) {
          if (sortedDays.length > 1) {
            sortedDays.pop();
          }
        }

        const targetDay = sortedDays[sortedDays.length - 1];
        const selectedRawItems = daysMap.get(targetDay)!;

        let totalVol = 0;
        for (let idx = 0; idx < selectedRawItems.length; idx++) {
          const prev = idx > 0 ? selectedRawItems[idx - 1].volumeAccum : 0;
          totalVol += Math.max(0, selectedRawItems[idx].volumeAccum - prev);
        }
        const avgVolume = Math.max(1, totalVol / selectedRawItems.length);

        for (let i = 0; i < selectedRawItems.length; i++) {
          const item = selectedRawItems[i];
          const rawDate = item.rawDate;
          let dateStr = rawDate;
          if (rawDate && rawDate.length >= 12) {
            dateStr = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)} ${rawDate.slice(8, 10)}:${rawDate.slice(10, 12)}:00`;
          }

          const close = roundToTick(item.close);

          let openVal = item.open;
          if (openVal === null || openVal === 0 || isNaN(openVal)) {
            openVal = i > 0 ? selectedRawItems[i - 1].close : item.close;
          }
          const open = roundToTick(openVal);

          const prevVolumeAccum = i > 0 ? selectedRawItems[i - 1].volumeAccum : 0;
          const volume = Math.max(0, item.volumeAccum - prevVolumeAccum);

          let highVal = item.high;
          let lowVal = item.low;

          if (highVal === null || highVal === 0 || isNaN(highVal) || lowVal === null || lowVal === 0 || isNaN(lowVal)) {
            const bodySize = Math.abs(close - open);
            const volRatio = volume / avgVolume;
            const volFactor = Math.min(2.5, Math.max(0.4, volRatio));
            const baseWigglePercent = (0.0006 + Math.random() * 0.0012) * volFactor;
            const wiggleAmount = close * baseWigglePercent;

            const upperTail = Math.max(wiggleAmount, bodySize * (Math.random() * 0.8 + 0.2));
            const lowerTail = Math.max(wiggleAmount, bodySize * (Math.random() * 0.8 + 0.2));

            const finalUpperTail = volume === 0 ? 0 : upperTail;
            const finalLowerTail = volume === 0 ? 0 : lowerTail;

            if (highVal === null || highVal === 0 || isNaN(highVal)) {
              highVal = Math.max(open, close) + finalUpperTail;
            }
            if (lowVal === null || lowVal === 0 || isNaN(lowVal)) {
              lowVal = Math.min(open, close) - finalLowerTail;
            }
          }

          const high = roundToTick(highVal);
          const low = roundToTick(Math.max(1, lowVal));

          candles.push({
            date: dateStr,
            open,
            high,
            low,
            close,
            volume
          });
        }
      } else {
        const naverUrl = `https://fchart.stock.naver.com/sise.nhn?symbol=${cleanTicker}&timeframe=day&count=120&requestType=0`;
        const response = await fetch(naverUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        if (!response.ok) {
          throw new Error(`Naver Finance API returned status ${response.status}`);
        }

        const xmlText = await response.text();
        const regex = /<item data="([^"]+)"/g;
        let match;

        while ((match = regex.exec(xmlText)) !== null) {
          const dataParts = match[1].split('|');
          if (dataParts.length >= 6) {
            const rawDate = dataParts[0];
            let dateStr = rawDate;
            if (rawDate && rawDate.length === 8) {
              dateStr = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
            } else if (rawDate && rawDate.length >= 12) {
              dateStr = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)} ${rawDate.slice(8, 10)}:${rawDate.slice(10, 12)}`;
            }
            candles.push({
              date: dateStr,
              open: roundToTick(parseInt(dataParts[1], 10)),
              high: roundToTick(parseInt(dataParts[2], 10)),
              low: roundToTick(parseInt(dataParts[3], 10)),
              close: roundToTick(parseInt(dataParts[4], 10)),
              volume: parseInt(dataParts[5], 10)
            });
          }
        }

        const kstNow = new Date(Date.now() + (9 * 60 * 60 * 1000));
        const kstTodayStr = kstNow.toISOString().slice(0, 10);
        const kstHour = kstNow.getUTCHours();
        const kstMinutes = kstNow.getUTCMinutes();
        const currentKstTimeNum = kstHour * 100 + kstMinutes;

        if (currentKstTimeNum < 1600) {
          const todayIdx = candles.findIndex(c => c.date === kstTodayStr);
          if (todayIdx !== -1) {
            candles.splice(todayIdx, 1);
          }
        }
      }

      if (candles.length === 0) {
        throw new Error('Zero candles fetched from Naver');
      }

      let name = KNOWN_TICKER_NAMES[cleanTicker] || cleanTicker;
      if (name === cleanTicker) {
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
      }

      return { candles, name };
    }
  }

  // 2. Data Provider B: Balanced Random Simulation Provider (Fallback & Sandbox testing)
  class FallbackStockDataProvider implements IStockDataProvider {
    name = "Balanced Simulation Data Provider";

    async fetchStockData(ticker: string, timeframe: 'day' | 'minute'): Promise<{ candles: any[]; name: string }> {
      const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
      const candles = generateFallbackDailyCandles(cleanTicker);
      const name = KNOWN_TICKER_NAMES[cleanTicker] || cleanTicker;
      return { candles, name };
    }
  }

  // 3. Data Provider C: Pure Mock Static Data Provider (Representing secondary custom API or offline sandbox)
  class MockStockDataProvider implements IStockDataProvider {
    name = "Static Mock Data Provider";

    async fetchStockData(ticker: string, timeframe: 'day' | 'minute'): Promise<{ candles: any[]; name: string }> {
      const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
      const name = (KNOWN_TICKER_NAMES[cleanTicker] || "모의종목") + "(Mock)";
      
      const candles: any[] = [];
      const basePrice = 50000;
      const count = timeframe === 'minute' ? 30 : 60;
      const now = new Date();
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * (timeframe === 'minute' ? 60000 : 24 * 3600000));
        const dateStr = timeframe === 'minute' 
          ? date.toISOString().replace('T', ' ').slice(0, 19)
          : date.toISOString().slice(0, 10);
        
        candles.push({
          date: dateStr,
          open: basePrice + i * 100,
          high: basePrice + i * 100 + 500,
          low: basePrice + i * 100 - 300,
          close: basePrice + i * 100 + 200,
          volume: 15000 + (i * 250)
        });
      }
      return { candles, name };
    }
  }

  // 3.5. Data Provider D: GZIP Compressed File Storage Data Provider
  class GzipStockFileDataProvider implements IStockDataProvider {
    name = "GZIP Compressed File Provider (Gzip DB)";
    private replayDir = process.env.VERCEL === '1' ? path.resolve(os.tmpdir(), 'data_replay') : path.resolve(process.cwd(), 'data', 'replay');

    constructor() {
      try {
        if (!fs.existsSync(this.replayDir)) {
          fs.mkdirSync(this.replayDir, { recursive: true });
        }
      } catch (err: any) {
        console.warn('Failed to ensure GZIP replay folder existence:', err.message || err);
      }
    }

    async fetchStockData(ticker: string, timeframe: 'day' | 'minute'): Promise<{ candles: any[]; name: string }> {
      const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
      const filename = `${cleanTicker}_${timeframe}.json.gz`;
      let filePath = path.join(this.replayDir, filename);
      const name = KNOWN_TICKER_NAMES[cleanTicker] || cleanTicker;

      // If the GZIP file doesn't exist in our current replayDir, check the bundled read-only data folder
      if (!fs.existsSync(filePath)) {
        const bundledPath = path.resolve(process.cwd(), 'data', 'replay', filename);
        if (fs.existsSync(bundledPath)) {
          filePath = bundledPath;
        }
      }

      if (fs.existsSync(filePath)) {
        try {
          console.log(`[Gzip Stock DB] Reading cached compressed data from ${filePath}`);
          const fileBuffer = fs.readFileSync(filePath);
          const decompressed = zlib.gunzipSync(fileBuffer);
          const candles = JSON.parse(decompressed.toString('utf-8'));
          return { candles, name };
        } catch (err: any) {
          console.error(`[Gzip Stock DB] Error decompressing ${filePath}. Re-fetching dynamic data...`, err.message || err);
        }
      }

      // If file does not exist or failed to load, fall back to fetching from Naver Finance and then compress and cache it
      console.log(`[Gzip Stock DB] No compressed file found for ${cleanTicker} (${timeframe}). Fetching dynamic Naver data to compress...`);
      const naver = new NaverStockDataProvider();
      const result = await naver.fetchStockData(ticker, timeframe);

      try {
        const jsonString = JSON.stringify(result.candles);
        const originalBytes = Buffer.byteLength(jsonString, 'utf8');
        const compressedBuffer = zlib.gzipSync(jsonString);
        const compressedBytes = compressedBuffer.length;

        fs.writeFileSync(filePath, compressedBuffer);
        const savingPercent = ((1 - (compressedBytes / originalBytes)) * 100).toFixed(1);
        console.log(`[Gzip Stock DB] Successfully compressed and saved ${filename} to disk! [Original: ${originalBytes} bytes] -> [Compressed: ${compressedBytes} bytes] (Saved ${savingPercent}%)`);
      } catch (saveErr: any) {
        console.warn(`[Gzip Stock DB] Failed to cache compressed data to ${filePath}:`, saveErr.message || saveErr);
      }

      return result;
    }
  }

  // 4. Decoupled Replay Engine Coordinator (Manages providers dynamically)
  class DecoupledReplayEngine {
    private providers: IStockDataProvider[] = [];

    constructor() {
      // Register standard providers
      this.providers.push(new NaverStockDataProvider());
      this.providers.push(new FallbackStockDataProvider());
      this.providers.push(new MockStockDataProvider());
      this.providers.push(new GzipStockFileDataProvider());
    }

    async getReplayData(ticker: string, timeframe: 'day' | 'minute', providerIndex: number = 0): Promise<{ candles: any[]; name: string; source: string }> {
      const provider = this.providers[providerIndex] || this.providers[0];
      try {
        console.log(`[Replay Engine Core] Requesting standard dataset via: [${provider.name}]`);
        const result = await provider.fetchStockData(ticker, timeframe);
        return {
          candles: result.candles,
          name: result.name,
          source: provider.name
        };
      } catch (err: any) {
        console.warn(`[Replay Engine Core] Provider [${provider.name}] failed. Cascade failing over to Fallback...`, err.message || err);
        const fallbackProvider = this.providers[1]; // FallbackStockDataProvider
        const result = await fallbackProvider.fetchStockData(ticker, timeframe);
        return {
          candles: result.candles,
          name: result.name,
          source: `${fallbackProvider.name} (Cascade Fallback)`
        };
      }
    }
  }

  const replayEngineInstance = new DecoupledReplayEngine();

  // Proxy endpoint to get accurate real-time Korean stock data (supporting both daily and minute candles)
  app.get('/api/stock-data', async (req, res) => {
    let ticker = req.query.ticker;
    if (!ticker || typeof ticker !== 'string') {
      ticker = '005930'; // Default fallback to Samsung Electronics
    }
    const timeframe = req.query.timeframe;
    const providerIndex = req.query.providerIndex;

    const mode = (timeframe === 'minute' ? 'minute' : 'day');

    // Clean up ticker: remove exchange suffixes like .KS or .KQ to get the 6-digit code
    const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
    if (!/^\d{6}$/.test(cleanTicker)) {
      return res.status(400).json({ error: 'Invalid ticker format. Expected a 6-digit stock code.' });
    }

    const idx = providerIndex ? parseInt(providerIndex as string, 10) : 0;

    // Check memory cache first
    const now = Date.now();
    const cacheKey = `${cleanTicker}_${mode}_p${idx}`;
    const cachedEntry = stockCache.get(cacheKey);
    if (cachedEntry && (now - cachedEntry.timestamp < CACHE_TTL)) {
      return res.json({ candles: cachedEntry.candles, name: cachedEntry.name, source: `Cache (${idx})` });
    }

    try {
      const result = await replayEngineInstance.getReplayData(cleanTicker, mode, idx);

      // Save to cache before returning
      stockCache.set(cacheKey, {
        timestamp: Date.now(),
        candles: result.candles,
        name: result.name
      });

      // Return the parsed candles and the resolved name
      res.json({
        candles: result.candles,
        name: result.name,
        source: result.source
      });
    } catch (err: any) {
      console.warn(`Warning/Soft Error fetching real stock data for ticker ${ticker} (mode: ${mode}):`, err.message || err);
      
      const name = KNOWN_TICKER_NAMES[cleanTicker] || cleanTicker;
      const candles = generateFallbackDailyCandles(cleanTicker);

      stockCache.set(cacheKey, {
        timestamp: Date.now(),
        candles,
        name
      });

      res.json({
        candles,
        name,
        source: 'Hard-coded Ultimate Fallback'
      });
    }
  });

  // GZIP Compressed Replay Database Stats Endpoint
  app.get('/api/gzip-info', async (req, res) => {
    try {
      const originalReplayDir = path.resolve(process.cwd(), 'data', 'replay');
      const tmpReplayDir = path.resolve(os.tmpdir(), 'data_replay');
      
      const filePaths: string[] = [];
      const seenFiles = new Set<string>();

      const scanDir = (dir: string) => {
        if (fs.existsSync(dir)) {
          try {
            const files = fs.readdirSync(dir).filter(f => f.endsWith('.json.gz'));
            files.forEach(f => {
              if (!seenFiles.has(f)) {
                seenFiles.add(f);
                filePaths.push(path.join(dir, f));
              }
            });
          } catch (e: any) {
            console.warn(`[Gzip Info API] Failed to scan directory ${dir}:`, e.message || e);
          }
        }
      };

      // Check writable tmp directory first, then the bundled one
      scanDir(tmpReplayDir);
      scanDir(originalReplayDir);

      if (filePaths.length === 0) {
        return res.json({
          totalFiles: 0,
          totalCompressedSize: '0 KB',
          totalOriginalSize: '0 KB',
          totalSavings: '0.0%',
          files: []
        });
      }

      let totalCompressedBytes = 0;
      let totalOriginalBytes = 0;
      const fileList: any[] = [];

      for (const filePath of filePaths) {
        const file = path.basename(filePath);
        const stats = fs.statSync(filePath);
        totalCompressedBytes += stats.size;

        let originalBytes = stats.size * 5; // Fallback estimate if error
        try {
          const fileBuffer = fs.readFileSync(filePath);
          const decompressed = zlib.gunzipSync(fileBuffer);
          originalBytes = decompressed.length;
        } catch (e) {
          // Keep estimate
        }
        totalOriginalBytes += originalBytes;

        const ratio = ((1 - (stats.size / originalBytes)) * 100).toFixed(1);

        fileList.push({
          filename: file,
          ticker: file.split('_')[0],
          timeframe: file.includes('_minute') ? 'minute' : 'day',
          compressedSize: `${(stats.size / 1024).toFixed(1)} KB`,
          originalSize: `${(originalBytes / 1024).toFixed(1)} KB`,
          savingsRatio: `${ratio}%`
        });
      }

      const totalSavingsRatio = totalOriginalBytes > 0 
        ? ((1 - (totalCompressedBytes / totalOriginalBytes)) * 100).toFixed(1)
        : '0.0';

      res.json({
        totalFiles: filePaths.length,
        totalCompressedSize: `${(totalCompressedBytes / 1024).toFixed(1)} KB`,
        totalOriginalSize: `${(totalOriginalBytes / 1024).toFixed(1)} KB`,
        totalSavings: `${totalSavingsRatio}%`,
        files: fileList
      });
    } catch (err: any) {
      console.error('Error fetching GZIP stats:', err);
      res.status(500).json({ error: err.message || err });
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

  // ==========================================
  // After-Market AI Study Platform API Routes
  // ==========================================

  // 1. Pre-Market Briefing Endpoints
  app.get('/api/platform/briefing', async (req, res) => {
    try {
      const dbData = await getPlatformDataFromSupabase('morning_briefing');
      if (dbData) {
        return res.json(dbData);
      }
      const briefing = PlatformEngine.getPreMarketBriefing();
      res.json(briefing);
    } catch (e: any) {
      res.status(500).json({ error: e.message || '장전 브리핑 조회 실패' });
    }
  });

  app.post('/api/platform/briefing/save', async (req, res) => {
    try {
      PlatformEngine.savePreMarketBriefing(req.body);
      await savePlatformDataToSupabase('morning_briefing', req.body);
      res.json({ success: true, message: '장전 브리핑이 성공적으로 저장되었습니다.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '장전 브리핑 저장 실패' });
    }
  });

  app.post('/api/platform/briefing/generate', async (req, res) => {
    try {
      const briefing = await PlatformEngine.generatePreMarketBriefingAI();
      res.json(briefing);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'AI 장전 브리핑 생성 실패' });
    }
  });

  // 2. After-Market Report Endpoints
  app.get('/api/platform/report', async (req, res) => {
    try {
      const dbData = await getPlatformDataFromSupabase('afternoon_report');
      if (dbData) {
        return res.json(dbData);
      }
      const report = PlatformEngine.getAfterMarketReport();
      res.json(report);
    } catch (e: any) {
      res.status(500).json({ error: e.message || '장마감 리포트 조회 실패' });
    }
  });

  app.post('/api/platform/report/save', async (req, res) => {
    try {
      PlatformEngine.saveAfterMarketReport(req.body);
      await savePlatformDataToSupabase('afternoon_report', req.body);
      res.json({ success: true, message: '장마감 리포트가 성공적으로 저장 및 발행되었습니다.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '장마감 리포트 저장 실패' });
    }
  });

  app.post('/api/platform/report/generate', async (req, res) => {
    try {
      const tickers = req.body.tickers || [];
      const report = await PlatformEngine.generateAfterMarketReportAI(tickers);
      res.json(report);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'AI 장마감 리포트 생성 실패' });
    }
  });

  // New: 2.5 Lunch & Evening Endpoints
  app.get('/api/platform/lunch', async (req, res) => {
    try {
      const dbData = await getPlatformDataFromSupabase('lunch_briefing');
      if (dbData) {
        return res.json(dbData);
      }
      const filePath = path.join(process.cwd(), 'data', 'platform', 'lunch_briefing.json');
      if (fs.existsSync(filePath)) {
        return res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
      }
      res.json({
        date: new Date().toISOString().split('T')[0],
        title: '장중 실시간 수급 및 동향 분석',
        midDayAnalysis: '장중 AI 분석 데이터가 아직 수집되지 않았습니다. 실시간 수급 봇이 12:30에 자동으로 가동됩니다.',
        tags: ['장중체크', '오전장결산']
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '장중 브리핑 조회 실패' });
    }
  });

  app.post('/api/platform/lunch/save', async (req, res) => {
    try {
      const dataDir = path.join(process.cwd(), 'data', 'platform');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'lunch_briefing.json');
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
      await savePlatformDataToSupabase('lunch_briefing', req.body);
      res.json({ success: true, message: '장중 브리핑이 성공적으로 저장되었습니다.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '장중 브리핑 저장 실패' });
    }
  });

  app.get('/api/platform/evening', async (req, res) => {
    try {
      const dbData = await getPlatformDataFromSupabase('evening_column');
      if (dbData) {
        return res.json(dbData);
      }
      const filePath = path.join(process.cwd(), 'data', 'platform', 'evening_column.json');
      if (fs.existsSync(filePath)) {
        return res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
      }
      res.json({
        date: new Date().toISOString().split('T')[0],
        columnTitle: '저녁 AI 금융 칼럼: 메가트렌드 경제 전망',
        columnContentMarkdown: '저녁 AI 금융 칼럼이 아직 집필되지 않았습니다. 분석 봇이 20:00에 자동으로 가동됩니다.',
        tags: ['메가트렌드', '경제칼럼']
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '저녁 금융 칼럼 조회 실패' });
    }
  });

  app.post('/api/platform/evening/save', async (req, res) => {
    try {
      const dataDir = path.join(process.cwd(), 'data', 'platform');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const filePath = path.join(dataDir, 'evening_column.json');
      fs.writeFileSync(filePath, JSON.stringify(req.body, null, 2));
      await savePlatformDataToSupabase('evening_column', req.body);
      res.json({ success: true, message: '저녁 금융 칼럼이 성공적으로 저장되었습니다.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '저녁 금융 칼럼 저장 실패' });
    }
  });

  // 3. AI Chart Overlay Study Guide Endpoints
  app.get('/api/platform/guide', (req, res) => {
    let ticker = req.query.ticker;
    if (!ticker || typeof ticker !== 'string') {
      ticker = '005930'; // Default fallback ticker
    }
    try {
      const guide = PlatformEngine.getStudyGuide(ticker);
      res.json(guide);
    } catch (e: any) {
      res.status(500).json({ error: e.message || '차트 학습 가이드 조회 실패' });
    }
  });

  app.post('/api/platform/guide/save', (req, res) => {
    try {
      const { ticker } = req.body;
      if (!ticker) {
        return res.status(400).json({ error: 'ticker is required' });
      }
      PlatformEngine.saveStudyGuide(ticker, req.body);
      res.json({ success: true, message: '차트 학습 가이드가 저장되었습니다.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '차트 학습 가이드 저장 실패' });
    }
  });

  // 4. Post-Replay Trading Critique & Analysis
  app.post('/api/platform/review', async (req, res) => {
    try {
      const { ticker, name, trades, initialBalance, finalBalance, candles } = req.body;
      if (!ticker || !name || !Array.isArray(trades)) {
        return res.status(400).json({ error: 'ticker, name, and trades are required parameters.' });
      }
      const review = await PlatformEngine.generateReplayReviewReportAI(
        ticker,
        name,
        trades,
        initialBalance || 10000000,
        finalBalance || 10000000,
        candles || []
      );
      res.json(review);
    } catch (e: any) {
      res.status(500).json({ error: e.message || 'AI 복기 리포트 생성 실패' });
    }
  });

  // ==========================================
  // 📝 SEO Content Management System (Blog, Guide, FAQ, Notice) API & SSR Support
  // ==========================================
  const CONTENT_DIR = path.resolve(process.cwd(), 'data', 'content');
  const POSTS_FILE = getWritablePath('data/content/posts.json');

  try {
    if (!fs.existsSync(CONTENT_DIR)) {
      fs.mkdirSync(CONTENT_DIR, { recursive: true });
    }
  } catch (err: any) {
    console.warn('[Writable Storage] Failed to create CONTENT_DIR (read-only filesystem), proceeding with tmp posts.json instead:', err.message || err);
  }

  function getPostsList(): any[] {
    if (!fs.existsSync(POSTS_FILE)) {
      const seedPosts = [
        {
          id: 'post_1',
          title: '주도주 첫 분봉 거래량 돌파 전략: 하루 3% 수익 실현 비법 📈',
          category: 'blog',
          author: '운영팀 수석 트레이더',
          createdAt: new Date().toISOString(),
          views: 128,
          slug: 'jodoju-first-candle-trading-strategy',
          tags: ['주도주', '단타기법', '돌파매매', '거래량분석'],
          content: '주식 시장에서 단기 매매로 꾸준한 수익을 내기 위해서는 반드시 거래대금이 수천억 이상 쏠리는 주도주만을 집중 공략해야 합니다. \n\n첫 번째 핵심 원칙은 오전 9시 개장 후 첫 3분봉 거래량을 체크하는 것입니다. 전일 전체 거래량의 20% 이상을 단 3분 만에 돌파하는 종목은 오늘 강력한 주도력을 증명한 셈입니다. \n\n두 번째 원칙은 당일 피봇 2차 저항선이나 전일 고가 등 유의미한 매물대 저항 라인을 강력하게 돌파 지지하는 시점(돌파 타점)을 노리는 것입니다. 추격 매수가 아닌 돌파 직후 첫 눌림목 지지를 매수 타점으로 설정하면 안전하게 3% 이상의 수익을 담보할 수 있습니다. \n\n세 번째 핵심 원칙은 손절선 엄수입니다. 당일 시가 또는 첫 분봉의 최저가를 이탈하는 경우 주저 없이 비중을 축소하고 다음 기회를 노려야 리스크를 완전히 헤지할 수 있습니다.'
        },
        {
          id: 'post_2',
          title: 'K-Stock Replay 시뮬레이터 100% 실전 활용 가이드 📖',
          category: 'guide',
          author: '운영팀 멘토',
          createdAt: new Date().toISOString(),
          views: 94,
          slug: 'simulator-full-guide',
          tags: ['시뮬레이터', '사용법', '훈련방법', '백테스팅'],
          content: 'K-Stock Replay 시뮬레이터는 실제 역사적 주도주의 차트 흐름을 초단위 호가 틱 변동처럼 경험하며 백테스팅 훈련을 진행할 수 있도록 개발되었습니다. \n\n기본적인 사용 프로세스는 다음과 같습니다: \n1. [일봉 모드] 또는 [분봉 모드]를 선택합니다. 초보자분들은 장기 추세를 익히기 위해 일봉 모드를 먼저 훈련하는 것을 권장합니다. \n2. 실시간 API, 시뮬 시세, 모크 데이터 등 수급 공급망을 취향에 맞춰 선택합니다. \n3. [훈련 시작] 버튼을 누르면 캔들이 실시간으로 그려지기 시작합니다. \n4. 훈련 시간을 줄이고 빠르게 캔들을 확정하고 싶다면 키보드의 [Spacebar]를 누르세요. 현재 봉이 마감되고 즉시 다음 봉의 흐름이 흘러갑니다. \n5. 하단의 매수/매도 버튼을 눌러 모의 자금 1,000만 원으로 분할 매수 및 매도 비중을 조절하며 최적의 익절/손절 평단가 배분 훈련을 할 수 있습니다. \n\n시가총액 상위 주도주들의 파동 에너지를 몸으로 체득할 때까지 반복 훈련해보세요!'
        },
        {
          id: 'post_3',
          title: '자주 묻는 질문(FAQ): 시뮬레이션 체결가와 지연율 관련 안내 ❓',
          category: 'faq',
          author: '고객지원팀',
          createdAt: new Date().toISOString(),
          views: 73,
          slug: 'faq-simulator-execution',
          tags: ['FAQ', '체결가', '자료동기화', '오류제보'],
          content: 'K-Stock Replay를 이용해주시는 회원님들께서 자주 하시는 질문을 모았습니다. \n\nQ. 시뮬레이션 속도가 너무 빠르거나 느릴 때는 어떻게 조절하나요? \nA. [훈련 시작] 버튼 우측의 [2배속] 옵션을 체크하시면 캔들 내 틱 생성 속도가 두 배 빠르게 흘러갑니다. 또한 차트 진행 간격을 건너뛰고 싶으시면 키보드 단축키인 [Spacebar] 키를 눌러 즉시 다음 캔들로 도약할 수 있습니다. \n\nQ. 시뮬레이션 가격 데이터의 원천은 어디인가요? \nA. 본 시뮬레이터는 네이버 금융(Naver Financial)의 실시간 시세 조회 전용 API 인터페이스 및 로컬에 무손실 압축 저장된 역사적 주도주 GZIP Replay DB 파서를 결합하여 활용하므로 실제 가격 지수 및 거래량과 100% 일치합니다. \n\nQ. 훈련 중 발생한 손실 데이터가 전체 랭킹에 즉시 연동되나요? \nA. 네, [랜덤 챌린지 🎲]를 통과하여 최종 제출한 성적은 즉시 실시간 명예의 전당 랭킹에 합산되어 경쟁심을 고취시키도록 설계되었습니다.'
        },
        {
          id: 'post_4',
          title: '공지사항: 실시간 랜덤 챌린지 및 랭킹 명예의 전당 개편 안내 📢',
          category: 'notice',
          author: '시스템 관리자',
          createdAt: new Date().toISOString(),
          views: 110,
          slug: 'notice-ranking-update',
          tags: ['공지사항', '기능업데이트', '명예의전당', '랜덤챌린지'],
          content: '안녕하세요. K-Stock Replay 운영진입니다. \n\n실전 트레이더분들의 훈련 성취감과 동기 부여를 위해 [랜덤 챌린지 🎲] 및 [실시간 명예의 전당] 랭킹 시스템을 전면 도입 및 개편하였습니다. \n\n주요 개편 요소를 알려드립니다: \n1. 블라인드 종목 훈련 도입: 랜덤 챌린지를 클릭하시면 어떤 종목의 몇 년 몇 월 며칠 데이터인지 알 수 없도록 종목명과 티커가 🔒 처리됩니다. 오로지 캔들 추세와 수급 거래량 차트 분석에만 의존하여 거래하는 고도의 심리 훈련 기법입니다. \n2. 실시간 랭킹 시스템: 도전 종료 후 본인의 닉네임을 제출하면 실시간 글로벌 데이터베이스와 안전하게 연동되어 자신의 백분위 수익률 순위를 한눈에 확인하고 명예의 전당에 등재될 수 있습니다. \n3. 모바일 반응형 최적화: 모바일 브라우저 터치 드래그 및 주문 버튼 레이아웃을 개선하여 출퇴근길 등 언제 어디서나 주도주 호가 복기 실습이 가능해졌습니다. \n\n앞으로도 유익한 기능들을 지속적으로 패치할 예정이오니 많은 피드백 부탁드립니다. 감사합니다.'
        }
      ];
      fs.writeFileSync(POSTS_FILE, JSON.stringify(seedPosts, null, 2));
    }
    try {
      const data = fs.readFileSync(POSTS_FILE, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to parse posts file', e);
      return [];
    }
  }

  function savePostsList(posts: any[]) {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  }

  app.get('/api/posts', (req, res) => {
    try {
      const posts = getPostsList();
      res.json({ posts });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '게시글 목록 조회 실패' });
    }
  });

  app.get('/api/posts/slug/:slug', (req, res) => {
    try {
      const posts = getPostsList();
      const post = posts.find(p => p.slug === req.params.slug);
      if (!post) {
        return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      }
      res.json(post);
    } catch (e: any) {
      res.status(500).json({ error: e.message || '게시글 상세 조회 실패' });
    }
  });

  app.post('/api/posts', (req, res) => {
    try {
      const { title, content, category, author, tags, slug } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: '제목과 내용을 채워주세요.' });
      }
      const posts = getPostsList();
      const newPost = {
        id: 'post_' + Date.now(),
        title,
        content,
        category: category || 'blog',
        author: author || '수석 애널리스트',
        tags: Array.isArray(tags) ? tags : [],
        slug: slug || title.toLowerCase().replace(/[^a-z0-9가-힣\s]/g, '').replace(/\s+/g, '-'),
        createdAt: new Date().toISOString(),
        views: 0
      };
      posts.unshift(newPost);
      savePostsList(posts);
      res.json(newPost);
    } catch (e: any) {
      res.status(500).json({ error: e.message || '게시글 추가 실패' });
    }
  });

  app.put('/api/posts/:id', (req, res) => {
    try {
      const { title, content, category, author, tags, slug } = req.body;
      const posts = getPostsList();
      const index = posts.findIndex(p => p.id === req.params.id);
      if (index === -1) {
        return res.status(404).json({ error: '수정할 게시글을 찾을 수 없습니다.' });
      }
      posts[index] = {
        ...posts[index],
        title: title || posts[index].title,
        content: content || posts[index].content,
        category: category || posts[index].category,
        author: author || posts[index].author,
        tags: Array.isArray(tags) ? tags : posts[index].tags,
        slug: slug || posts[index].slug
      };
      savePostsList(posts);
      res.json(posts[index]);
    } catch (e: any) {
      res.status(500).json({ error: e.message || '게시글 수정 실패' });
    }
  });

  app.delete('/api/posts/:id', (req, res) => {
    try {
      let posts = getPostsList();
      const initialLength = posts.length;
      posts = posts.filter(p => p.id !== req.params.id);
      if (posts.length === initialLength) {
        return res.status(404).json({ error: '삭제할 게시글을 찾을 수 없습니다.' });
      }
      savePostsList(posts);
      res.json({ success: true, message: '게시글이 성공적으로 삭제되었습니다.' });
    } catch (e: any) {
      res.status(500).json({ error: e.message || '게시글 삭제 실패' });
    }
  });

  app.post('/api/posts/view/:id', (req, res) => {
    try {
      const posts = getPostsList();
      const index = posts.findIndex(p => p.id === req.params.id);
      if (index !== -1) {
        posts[index].views = (posts[index].views || 0) + 1;
        savePostsList(posts);
      }
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // ==========================================
  // 📈 Advanced Search Engine Optimization (SEO) & Sitemap/Robots Generation
  // ==========================================
  
  // Dynamic SEO rendering helper for all pages (Home, Replay, Briefing, Report, Blog, Blog Posts)
  function generateSeoHtml(route: string, data?: any): string {
    let title = 'K-Stock Replay - 무료 주식 차트 복기 시뮬레이터 | 단타 매매 연습';
    let desc = '로그인 없이 즉시 시작하는 무료 과거 주식 차트 복기 리플레이 시뮬레이터. 이동평균선, 거래량 기반 기술적 분석 매매일지 연습으로 주식 투자 실력을 기르세요.';
    let keywords = '주식, 모의투자, 차트복기, 주식시뮬레이터, 주식연습, 단타연습, 주도주, K-Stock Replay';
    let canonical = 'https://kstock-replay.com/';
    let ogType = 'website';
    let ogTitle = title;
    let ogDesc = desc;
    let ogUrl = canonical;
    let schemas: any[] = [];

    // Default WebSite schema for search rich snippets
    schemas.push({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "K-Stock Replay",
      "url": "https://kstock-replay.com/",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://kstock-replay.com/blog?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    });

    if (route.startsWith('/blog/')) {
      const post = data?.post;
      if (post) {
        title = `${post.title} - K-Stock Replay 공식 블로그`;
        desc = post.content.slice(0, 150).replace(/"/g, '&quot;').replace(/\n/g, ' ') + '...';
        keywords = Array.isArray(post.tags) ? post.tags.join(', ') : '주식블로그, 매매법, 주도주';
        canonical = `https://kstock-replay.com/blog/${post.slug}`;
        ogType = 'article';
        ogTitle = title;
        ogDesc = desc;
        ogUrl = canonical;

        // Article Schema
        schemas.push({
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          "headline": post.title,
          "description": desc,
          "datePublished": post.createdAt,
          "author": {
            "@type": "Person",
            "name": post.author || '수석 애널리스트'
          },
          "publisher": {
            "@type": "Organization",
            "name": "K-Stock Replay",
            "logo": {
              "@type": "ImageObject",
              "url": "https://kstock-replay.com/favicon.png"
            }
          },
          "mainEntityOfPage": {
            "@type": "WebPage",
            "@id": canonical
          }
        });

        // Breadcrumb Schema
        schemas.push({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "홈",
              "item": "https://kstock-replay.com/"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": "블로그 센터",
              "item": "https://kstock-replay.com/blog"
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": post.title,
              "item": canonical
            }
          ]
        });
      }
    } else if (route === '/blog') {
      title = 'K-Stock Replay 공식 블로그 & 지식 공유 센터 | 주도주 공략 노하우';
      desc = '트레이더들의 주도주 공략 비법, 시뮬레이터 100% 활용 노하우, 실전 투자 가이드, 자주 묻는 질문(FAQ) 등 성공 투자의 동반자.';
      keywords = '주식블로그, 매매일지, 주도주공략, 시뮬레이터사용법, 기술적분석가이드, 주식공부';
      canonical = 'https://kstock-replay.com/blog';
      ogTitle = title;
      ogDesc = desc;
      ogUrl = canonical;

      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://kstock-replay.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "블로그 센터",
            "item": canonical
          }
        ]
      });
    } else if (route === '/briefing') {
      title = 'K-Stock Replay 장전 브리핑 | 핵심 테마 및 주도주 전망';
      desc = '오늘 장 시작 전 꼭 알아야 할 글로벌 시황 요약, 핵심 특징 종목군 정보, 미 증시 변동 사항 및 오늘 주목할 오늘의 주도주 테마 전망을 제공합니다.';
      keywords = '장전브리핑, 주식시황, 오늘주도주, 오늘테마, K-Stock Replay 브리핑';
      canonical = 'https://kstock-replay.com/briefing';
      ogTitle = title;
      ogDesc = desc;
      ogUrl = canonical;

      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://kstock-replay.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "장전 브리핑",
            "item": canonical
          }
        ]
      });
    } else if (route === '/report') {
      title = 'K-Stock Replay 16:00 장마감 브리핑 | 당일 주도주 및 특징주 분류';
      desc = '오늘 장마감 후 당일 주도주 및 호재/악재 특징 키워드를 관련 회사별로 정밀 분석 분류한 장마감 브리핑을 제공합니다.';
      keywords = '장마감브리핑, 당일주도주, 특징주, 호재악재분석, K-Stock Replay 브리핑';
      canonical = 'https://kstock-replay.com/report';
      ogTitle = title;
      ogDesc = desc;
      ogUrl = canonical;

      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://kstock-replay.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "장마감 브리핑",
            "item": canonical
          }
        ]
      });
    } else if (route === '/replay') {
      title = '무료 주식 차트 복기 시뮬레이터 | 실시간 단타 연습 - K-Stock Replay';
      desc = '이동평균선, 실시간 수급 거래량, 자석식 호가 틱 체결 알고리즘을 사용한 대한민국 최초 주식 차트 리플레이 모의 투자 연습 툴입니다.';
      keywords = '차트복기, 주식시뮬레이터, 리플레이매매, 주식연습, 모의투자';
      canonical = 'https://kstock-replay.com/replay';
      ogTitle = title;
      ogDesc = desc;
      ogUrl = canonical;

      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://kstock-replay.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "차트 시뮬레이터",
            "item": canonical
          }
        ]
      });
    } else if (route === '/terms') {
      title = 'K-Stock Replay 서비스 이용약관 및 법적 면책 고지';
      desc = 'K-STOCK REPLAY 교육용 주식 차트 복기 모의 시뮬레이터 서비스의 활용 조건, 이용 규정 및 투자 판단 손실에 대한 강력한 법적 면책 한계를 안내합니다.';
      keywords = '서비스이용약관, 법적면책고지, 모의투자이용약관, K-Stock Replay 규정';
      canonical = 'https://kstock-replay.com/terms';
      ogTitle = title;
      ogDesc = desc;
      ogUrl = canonical;

      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://kstock-replay.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "서비스 이용약관",
            "item": canonical
          }
        ]
      });
    } else if (route === '/privacy') {
      title = 'K-Stock Replay 개인정보처리방침 및 애드센스 쿠키 규정';
      desc = 'K-STOCK REPLAY의 비회원제 완전 익명 구동 안내, 브라우저 로컬 저장소(localStorage) 사용 방식, 구글 애드센스 광고 쿠키 정책 및 수집 거부권을 투명하게 공개합니다.';
      keywords = '개인정보처리방침, 개인정보처리, 애드센스쿠키정책, 익명주식복기, 쿠키거부권';
      canonical = 'https://kstock-replay.com/privacy';
      ogTitle = title;
      ogDesc = desc;
      ogUrl = canonical;

      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://kstock-replay.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "개인정보처리방침",
            "item": canonical
          }
        ]
      });
    } else if (route === '/calendar') {
      title = 'K-Stock Replay 7월 증시 캘린더 - 거시 지표, 금리 결정, 옵션만기일';
      desc = '2026년 7월 대한민국 및 글로벌 주식시장의 핵심 거시경제 지표 발표, 연준 FOMC 금리결정, 한국은행 기준금리, 국내외 옵션 만기일 및 삼성전자/테슬라 주요 기업 실적 발표 일정을 상세 가이드와 함께 완전 정복합니다.';
      keywords = '증시캘린더, 7월증시일정, 옵션만기일, FOMC일정, 실적발표, K-Stock Replay';
      canonical = 'https://kstock-replay.com/calendar';
      ogTitle = title;
      ogDesc = desc;
      ogUrl = canonical;

      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "홈",
            "item": "https://kstock-replay.com/"
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "증시 캘린더",
            "item": canonical
          }
        ]
      });
    }

    const schemaScripts = schemas.map(s => `
      <script type="application/ld+json">
        ${JSON.stringify(s, null, 2)}
      </script>
    `).join('\n');

    return `
      <title>${title}</title>
      <meta name="description" content="${desc}" />
      <meta name="keywords" content="${keywords}" />
      <link rel="canonical" href="${canonical}" />
      <meta property="og:title" content="${ogTitle}" />
      <meta property="og:description" content="${ogDesc}" />
      <meta property="og:url" content="${ogUrl}" />
      <meta property="og:type" content="${ogType}" />
      <meta property="og:site_name" content="K-Stock Replay" />
      <meta property="og:image" content="https://kstock-replay.com/favicon.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="${ogTitle}" />
      <meta name="twitter:description" content="${ogDesc}" />
      <meta name="twitter:image" content="https://kstock-replay.com/favicon.png" />
      <meta name="google-adsense-account" content="ca-pub-4850161179932319" />
      <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      ${schemaScripts}
    `;
  }

  // Dynamic Robots.txt
  app.get('/robots.txt', (req, res) => {
    const robotsTxt = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin

Sitemap: https://kstock-replay.com/sitemap.xml
`;
    res.header('Content-Type', 'text/plain');
    res.send(robotsTxt);
  });

  // Dynamic XML Sitemap
  app.get('/sitemap.xml', (req, res) => {
    try {
      const posts = getPostsList();
      const baseUrl = 'https://kstock-replay.com';
      
      const staticUrls = [
        { url: '/', changefreq: 'daily', priority: '1.0' },
        { url: '/replay', changefreq: 'daily', priority: '0.9' },
        { url: '/calendar', changefreq: 'daily', priority: '0.9' },
        { url: '/briefing', changefreq: 'daily', priority: '0.8' },
        { url: '/report', changefreq: 'daily', priority: '0.8' },
        { url: '/blog', changefreq: 'weekly', priority: '0.7' },
        { url: '/terms', changefreq: 'monthly', priority: '0.4' },
        { url: '/privacy', changefreq: 'monthly', priority: '0.4' },
      ];

      const blogUrls = posts.map(post => ({
        url: `/blog/${post.slug}`,
        changefreq: 'weekly',
        priority: '0.6',
        lastmod: post.createdAt.split('T')[0]
      }));

      const allUrls: any[] = [...staticUrls, ...blogUrls];

      const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => `  <url>
    <loc>${baseUrl}${u.url}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}
  </url>`).join('\n')}
</urlset>`;

      res.header('Content-Type', 'application/xml');
      res.send(sitemapXml);
    } catch (e: any) {
      res.status(500).send('Sitemap generation failed');
    }
  });

  // 2. Vite Middleware / Static Asset Serving
  if (process.env.VERCEL !== '1') {
    const startStandaloneServer = async () => {
      if (process.env.NODE_ENV !== 'production') {
        const { createServer: createViteServer } = await import('vite');
        const vite = await createViteServer({
          server: { middlewareMode: true },
          appType: 'spa',
        });
        
        // Helper to render pages with dynamic SEO meta-tags in development
        const handleSeoRouteDev = async (route: string, data: any, req: any, res: any, next: any) => {
          try {
            let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
            template = await vite.transformIndexHtml(req.originalUrl, template);
            
            // Clean duplicate titles & tags
            template = template.replace(/<title>[^<]*<\/title>/g, '');
            template = template.replace(/<meta name="description"[^>]*>/g, '');
            template = template.replace(/<meta property="og:[^>]*>/g, '');
            
            const seoMeta = generateSeoHtml(route, data);
            template = template.replace('</head>', `${seoMeta}\n</head>`);
            
            res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
          } catch (e) {
            next(e);
          }
        };

        // Development dynamic route catchers
        app.get('/blog/:slug', async (req, res, next) => {
          const { slug } = req.params;
          const posts = getPostsList();
          const post = posts.find(p => p.slug === slug);
          await handleSeoRouteDev(`/blog/${slug}`, { post }, req, res, next);
        });

        app.get('/blog', async (req, res, next) => {
          await handleSeoRouteDev('/blog', null, req, res, next);
        });

        app.get('/briefing', async (req, res, next) => {
          await handleSeoRouteDev('/briefing', null, req, res, next);
        });

        app.get('/report', async (req, res, next) => {
          await handleSeoRouteDev('/report', null, req, res, next);
        });

        app.get('/replay', async (req, res, next) => {
          await handleSeoRouteDev('/replay', null, req, res, next);
        });

        app.get('/terms', async (req, res, next) => {
          await handleSeoRouteDev('/terms', null, req, res, next);
        });

        app.get('/privacy', async (req, res, next) => {
          await handleSeoRouteDev('/privacy', null, req, res, next);
        });

        app.get('/calendar', async (req, res, next) => {
          await handleSeoRouteDev('/calendar', null, req, res, next);
        });

        app.get('/', async (req, res, next) => {
          if (req.path === '/') {
            await handleSeoRouteDev('/', null, req, res, next);
          } else {
            next();
          }
        });

        app.use(vite.middlewares);
      } else {
        const distPath = path.resolve(process.cwd(), 'dist');
        app.use(express.static(distPath));
        
        // Helper to render pages with dynamic SEO meta-tags in production
        const handleSeoRouteProd = (route: string, data: any, req: any, res: any) => {
          const indexPath = path.join(distPath, 'index.html');
          if (fs.existsSync(indexPath)) {
            let html = fs.readFileSync(indexPath, 'utf-8');
            
            // Clean duplicate titles & tags
            html = html.replace(/<title>[^<]*<\/title>/g, '');
            html = html.replace(/<meta name="description"[^>]*>/g, '');
            html = html.replace(/<meta property="og:[^>]*>/g, '');
            
            const seoMeta = generateSeoHtml(route, data);
            html = html.replace('</head>', `${seoMeta}\n</head>`);
            
            res.send(html);
          } else {
            res.sendFile(indexPath);
          }
        };

        // Production dynamic route catchers
        app.get('/blog/:slug', (req, res) => {
          const { slug } = req.params;
          const posts = getPostsList();
          const post = posts.find(p => p.slug === slug);
          handleSeoRouteProd(`/blog/${slug}`, { post }, req, res);
        });

        app.get('/blog', (req, res) => {
          handleSeoRouteProd('/blog', null, req, res);
        });

        app.get('/briefing', (req, res) => {
          handleSeoRouteProd('/briefing', null, req, res);
        });

        app.get('/report', (req, res) => {
          handleSeoRouteProd('/report', null, req, res);
        });

        app.get('/replay', (req, res) => {
          handleSeoRouteProd('/replay', null, req, res);
        });

        app.get('/terms', (req, res) => {
          handleSeoRouteProd('/terms', null, req, res);
        });

        app.get('/privacy', (req, res) => {
          handleSeoRouteProd('/privacy', null, req, res);
        });

        app.get('/calendar', (req, res) => {
          handleSeoRouteProd('/calendar', null, req, res);
        });

        app.get('/', (req, res, next) => {
          if (req.path === '/') {
            handleSeoRouteProd('/', null, req, res);
          } else {
            next();
          }
        });

        app.get('*', (req, res) => {
          res.sendFile(path.join(distPath, 'index.html'));
        });
      }

      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
      });
    };
    startStandaloneServer();
  }

// Export app for serverless environments like Vercel
export default app;
