import path from 'path';
import fs from 'fs';
import zlib from 'zlib';
import iconv from 'iconv-lite';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// Shared interfaces
export interface LeaderboardEntry {
  name: string;
  yieldRate: number; // cumulative yield rate in %
  symbol: string;
  totalAssets: number;
  date: string;
}

export interface AuditDiffDetail {
  field: string;
  expected: string;
  actual: string;
  delta: string;
  message: string;
}

export interface AuditLog {
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

export interface CacheEntry {
  timestamp: number;
  candles: any[];
  name: string;
}

// Global cached values
export const stockCache = new Map<string, CacheEntry>();
export const CACHE_TTL = 1000 * 60 * 60 * 4; // 4 hours

export const KNOWN_TICKER_NAMES: Record<string, string> = {
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

export const FALLBACK_15_JODOJU = [
  { rank: 1, name: "SK하이닉스", code: "000660", changeRatio: 12.4, tradingValue: 1250000000000 },
  { rank: 2, name: "한화에어로스페이스", code: "012450", changeRatio: 14.8, tradingValue: 840000000000 },
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

const ILBONG_LEADERBOARD_FILE = path.join(process.cwd(), 'leaderboard_ilbong.json');
const DANTA_LEADERBOARD_FILE = path.join(process.cwd(), 'leaderboard_danta.json');
const ALL_ILBONG_SCORES_FILE = path.join(process.cwd(), 'all_scores_ilbong.json');
const ALL_DANTA_SCORES_FILE = path.join(process.cwd(), 'all_scores_danta.json');
const AUDIT_LOGS_FILE = path.join(process.cwd(), 'audit_logs.json');
const JODOJU_CACHE_FILE = path.join(process.cwd(), 'jodoju_cache.json');
const CONTENT_DIR = path.join(process.cwd(), 'data', 'content');
const POSTS_FILE = path.join(CONTENT_DIR, 'posts.json');

// Lazy initialized Supabase client
let supabaseClient: any = null;

export function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY;
    if (url && key) {
      supabaseClient = createClient(url, key);
    }
  }
  return supabaseClient;
}

export function isSupabaseActive(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY);
}

// Platform Data syncing helper functions for Supabase
export async function getPlatformDataFromSupabase(key: string): Promise<any | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('kstock_platform_data')
      .select('data')
      .eq('key', key)
      .maybeSingle();
    
    if (!error && data) {
      return data.data;
    }
    return null;
  } catch (err: any) {
    console.warn(`Supabase Platform Data fetch note for '${key}':`, err.message || err);
    return null;
  }
}

export async function savePlatformDataToSupabase(key: string, dataVal: any): Promise<boolean> {
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
      console.warn(`Supabase Platform Data save note for '${key}':`, error.message || error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Supabase save exception for '${key}':`, err.message || err);
    return false;
  }
}

// Supabase leaderboard helpers
export async function getLeaderboardFromSupabase(type: 'ilbong' | 'danta'): Promise<LeaderboardEntry[] | null> {
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
      console.warn('Supabase Leaderboard Table access note:', error.message || error);
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
    console.warn('Supabase fetch exception (local fallback active):', err.message || err);
    return null;
  }
}

export async function saveScoreToSupabase(entry: LeaderboardEntry, type: 'ilbong' | 'danta'): Promise<boolean> {
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
      console.warn('Supabase Leaderboard Table save note:', error.message || error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn('Supabase insert exception (local fallback active):', err.message || err);
    return false;
  }
}

export async function getAllScoresFromSupabase(type: 'ilbong' | 'danta'): Promise<LeaderboardEntry[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('kstock_leaderboard')
      .select('name, yield_rate, symbol, total_assets, date')
      .eq('type', type)
      .order('yield_rate', { ascending: false });
    
    if (error) {
      console.warn('Supabase Leaderboard Table fetch all note:', error.message || error);
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
    console.warn('Supabase fetch all exception (local fallback active):', err.message || err);
    return null;
  }
}

// Local file-based leaderboard helpers (for Vercel local /tmp ephemeral writes and fallback)
export function getLeaderboard(type: 'ilbong' | 'danta'): LeaderboardEntry[] {
  const file = type === 'danta' ? DANTA_LEADERBOARD_FILE : ILBONG_LEADERBOARD_FILE;
  try {
    if (!fs.existsSync(file)) {
      try {
        fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
      } catch (writeErr) {
        // Handle read-only file systems gracefully on serverless
      }
      return [];
    }
    const rawData = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      const hasFake = parsed.some(entry => entry.name === '워런 버핏 후계자' || entry.name === '초전도 스캘퍼');
      if (hasFake) {
        try {
          fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
        } catch (e) {}
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

export function saveLeaderboard(type: 'ilbong' | 'danta', entries: LeaderboardEntry[]): boolean {
  const file = type === 'danta' ? DANTA_LEADERBOARD_FILE : ILBONG_LEADERBOARD_FILE;
  try {
    fs.writeFileSync(file, JSON.stringify(entries, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${type} leaderboard file:`, err);
    return false;
  }
}

export function getAllScores(type: 'ilbong' | 'danta'): LeaderboardEntry[] {
  const file = type === 'danta' ? ALL_DANTA_SCORES_FILE : ALL_ILBONG_SCORES_FILE;
  try {
    if (!fs.existsSync(file)) {
      try {
        fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
      } catch (e) {}
      return [];
    }
    const rawData = fs.readFileSync(file, 'utf-8');
    const parsed = JSON.parse(rawData);
    if (Array.isArray(parsed)) {
      const hasFake = parsed.some(entry => entry.name === '워런 버핏 후계자' || entry.name === '초전도 스캘퍼');
      if (hasFake) {
        try {
          fs.writeFileSync(file, JSON.stringify([], null, 2), 'utf-8');
        } catch (e) {}
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

export function saveAllScores(type: 'ilbong' | 'danta', entries: LeaderboardEntry[]): boolean {
  const file = type === 'danta' ? ALL_DANTA_SCORES_FILE : ALL_ILBONG_SCORES_FILE;
  try {
    fs.writeFileSync(file, JSON.stringify(entries, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`Error writing ${type} all scores file:`, err);
    return false;
  }
}

// Audit Logs helpers
let cachedAuditLogs: AuditLog[] = [];

export function loadAuditLogs(): AuditLog[] {
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

export function saveAuditLogs() {
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(cachedAuditLogs.slice(0, 100), null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing audit logs file:', e);
  }
}

export function clearAuditLogs() {
  cachedAuditLogs = [];
  saveAuditLogs();
}

export function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
  // Lazily load if cache is empty
  if (cachedAuditLogs.length === 0) {
    loadAuditLogs();
  }
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

export function auditLeaderboardFlow(
  rawInput: any,
  processedOutput: LeaderboardEntry,
  dbOutput: LeaderboardEntry | null,
  uiOutput?: LeaderboardEntry | null
): AuditLog {
  const rawVsProcessedDiffs: AuditDiffDetail[] = [];
  const processedVsDbDiffs: AuditDiffDetail[] = [];
  const dbVsUiDiffs: AuditDiffDetail[] = [];

  // Stage 1: Raw vs Processed
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

  // Stage 2: Processed vs DB Saved
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

  // Stage 3: DB vs UI
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

// Blog Posts helpers
export function getPostsList(): any[] {
  if (!fs.existsSync(POSTS_FILE)) {
    if (!fs.existsSync(CONTENT_DIR)) {
      try {
        fs.mkdirSync(CONTENT_DIR, { recursive: true });
      } catch (e) {}
    }
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
    try {
      fs.writeFileSync(POSTS_FILE, JSON.stringify(seedPosts, null, 2));
    } catch (e) {}
    return seedPosts;
  }
  try {
    const data = fs.readFileSync(POSTS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to parse posts file', e);
    return [];
  }
}

export function savePostsList(posts: any[]) {
  try {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
  } catch (e) {
    console.error('Failed to save posts file', e);
  }
}

// Tick calculations
export function getTickSize(price: number): number {
  if (price < 2000) return 1;
  if (price < 5000) return 5;
  if (price < 10000) return 10;
  if (price < 50000) return 50;
  if (price < 100000) return 100;
  if (price < 500000) return 500;
  return 1000;
}

export function roundToTick(price: number): number {
  if (price <= 0) return 0;
  const tick = getTickSize(price);
  return Math.round(price / tick) * tick;
}

export function generateFallbackDailyCandles(ticker: string): any[] {
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

// Replay Engine Provider Architecture
export interface IStockDataProvider {
  name: string;
  fetchStockData(ticker: string, timeframe: 'day' | 'minute'): Promise<{ candles: any[]; name: string }>;
}

export class NaverStockDataProvider implements IStockDataProvider {
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

      let sortedDays = Array.from(daysMap.keys()).sort();
      if (sortedDays.length === 0) {
        throw new Error('No trading days found in minute data');
      }

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
        const item = selectedRawItems;
        const rawItem = selectedRawItems[i];
        const rawDate = rawItem.rawDate;
        let dateStr = rawDate;
        if (rawDate && rawDate.length >= 12) {
          dateStr = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)} ${rawDate.slice(8, 10)}:${rawDate.slice(10, 12)}:00`;
        }

        const close = roundToTick(rawItem.close);

        let openVal = rawItem.open;
        if (openVal === null || openVal === 0 || isNaN(openVal)) {
          openVal = i > 0 ? selectedRawItems[i - 1].close : rawItem.close;
        }
        const open = roundToTick(openVal);

        const prevVolumeAccum = i > 0 ? selectedRawItems[i - 1].volumeAccum : 0;
        const volume = Math.max(0, rawItem.volumeAccum - prevVolumeAccum);

        let highVal = rawItem.high;
        let lowVal = rawItem.low;

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

export class FallbackStockDataProvider implements IStockDataProvider {
  name = "Balanced Simulation Data Provider";

  async fetchStockData(ticker: string, timeframe: 'day' | 'minute'): Promise<{ candles: any[]; name: string }> {
    const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
    const candles = generateFallbackDailyCandles(cleanTicker);
    const name = KNOWN_TICKER_NAMES[cleanTicker] || cleanTicker;
    return { candles, name };
  }
}

export class MockStockDataProvider implements IStockDataProvider {
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

export class GzipStockFileDataProvider implements IStockDataProvider {
  name = "GZIP Compressed File Provider (Gzip DB)";
  private replayDir = path.join(process.cwd(), 'data', 'replay');

  constructor() {
    try {
      if (!fs.existsSync(this.replayDir)) {
        fs.mkdirSync(this.replayDir, { recursive: true });
      }
    } catch (err) {
      console.warn('Failed to ensure GZIP replay folder existence:', err);
    }
  }

  async fetchStockData(ticker: string, timeframe: 'day' | 'minute'): Promise<{ candles: any[]; name: string }> {
    const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
    const filename = `${cleanTicker}_${timeframe}.json.gz`;
    const filePath = path.join(this.replayDir, filename);
    const name = KNOWN_TICKER_NAMES[cleanTicker] || cleanTicker;

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

export class DecoupledReplayEngine {
  private providers: IStockDataProvider[] = [];

  constructor() {
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

export const replayEngineInstance = new DecoupledReplayEngine();

// Jodoju Scraping helpers
export function getKstNow(): Date {
  const utc = Date.now() + (new Date().getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 9)); // UTC + 9 hours for KST
}

export function getJodojuTargetDate(): string {
  const kst = getKstNow();
  if (kst.getHours() < 16) {
    kst.setDate(kst.getDate() - 1);
  }
  let day = kst.getDay();
  while (day === 0 || day === 6) {
    kst.setDate(kst.getDate() - 1);
    day = kst.getDay();
  }
  return kst.toISOString().slice(0, 10);
}

export async function fetchSiseQuant(sosok: number): Promise<string> {
  const url = `https://finance.naver.com/sise/sise_quant.nhn?sosok=${sosok}`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
  });
  const buffer = await res.arrayBuffer();
  return iconv.decode(Buffer.from(buffer), 'euc-kr');
}

export function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export function parseSiseQuant(html: string): any[] {
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

export async function isGreenCandle(code: string): Promise<boolean> {
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
    
    return close > open; // Green candle Close > Open
  } catch (err) {
    return false;
  }
}

export async function generateJodojuList(): Promise<any[]> {
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
    
    console.log('[주도주 자동 업데이트] 실시간 양봉(Close > Open) 여부 병렬 체크 중...');
    const results = await Promise.all(
      candidates.map(async (stock) => {
        const green = await isGreenCandle(stock.code);
        return { ...stock, isGreen: green };
      })
    );
    
    const finalCandidates = results.filter(r => r.isGreen);
    console.log(`[주도주 자동 업데이트] 양봉 기준 충족 종목: ${finalCandidates.length}개`);
    
    finalCandidates.sort((a, b) => b.tradingValue - a.tradingValue);
    
    const selectedJodoju = finalCandidates.slice(0, 15).map((s, idx) => ({
      rank: idx + 1,
      code: s.code,
      name: s.name,
      changeRatio: s.changeRatio,
      tradingValue: s.tradingValue * 1000000 // Convert millions of KRW to KRW
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

export function saveJodojuToCacheAndStatic(stocks: any[], targetDate: string) {
  try {
    fs.writeFileSync(JODOJU_CACHE_FILE, JSON.stringify({ targetDate, stocks }, null, 2), 'utf-8');
    
    const publicDataPath = path.join(process.cwd(), 'public', 'data', 'jodoju_list.json');
    try {
      fs.mkdirSync(path.dirname(publicDataPath), { recursive: true });
      fs.writeFileSync(publicDataPath, JSON.stringify(stocks, null, 2), 'utf-8');
    } catch (e) {}

    const distDataPath = path.join(process.cwd(), 'dist', 'data', 'jodoju_list.json');
    try {
      if (fs.existsSync(path.dirname(distDataPath))) {
        fs.writeFileSync(distDataPath, JSON.stringify(stocks, null, 2), 'utf-8');
      }
    } catch (e) {}
    console.log(`[주도주 저장 완료] 캐시 파일 및 static json 파일 저장 완료 (Target Date: ${targetDate})`);
  } catch (err) {
    console.error('[주도주 저장 에러] 정적 파일 쓰기 실패:', err);
  }
}

export function getJodojuCacheFile() {
  return JODOJU_CACHE_FILE;
}
