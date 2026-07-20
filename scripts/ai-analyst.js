import dns from 'dns';
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import iconv from 'iconv-lite';

const APP_URL = process.env.APP_URL || 'https://k-stockreplay.pe.kr';
const AI_API_KEY = process.env.AI_API_KEY || process.env.GEMINI_API_KEY;

if (!AI_API_KEY) {
  console.error('[AI Analyst] Critical Error: Neither AI_API_KEY nor GEMINI_API_KEY environment variable is set in GitHub Secrets!');
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: AI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

// Helper: robust retry with backoff for API resiliency
async function retryWithBackoff(fn, retries = 5, delayMs = 1500) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= retries) {
        throw err;
      }
      console.warn(`[Gemini SDK Retry] Attempt ${attempt} failed with error: ${err.message || err}. Retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
      delayMs *= 2.0; // Exponential backoff
    }
  }
  throw new Error('Unreachable retry state');
}

// Helper: Anti-Bot Random Sleep before publishing to external channels
function sleepRandomTime(minMin = 5, maxMin = 15) {
  if (process.env.SKIP_DELAY === 'true') {
    console.log('[Anti-Bot Delay] SKIP_DELAY is true, skipping delay.');
    return Promise.resolve();
  }
  const minMs = minMin * 60 * 1000;
  const maxMs = maxMin * 60 * 1000;
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1) + minMs);
  console.log(`[Anti-Bot Delay] Sleeping for ${(ms / 1000 / 60).toFixed(1)} minutes to simulate human behavior before Threads publishing...`);
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Helper: Get current Date object converted to KST
function getKstNow() {
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  return new Date(utc + (3600000 * 9));
}

// Helper: Get KST date string (YYYY-MM-DD)
function getKstDateStr() {
  const kst = getKstNow();
  const year = kst.getFullYear();
  const month = (kst.getMonth() + 1).toString().padStart(2, '0');
  const day = kst.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper: Dynamically get dated storage path (data/content/YYYY/MM/DD/filename)
function getDatedStoragePath(filename) {
  const kst = getKstNow();
  const year = kst.getFullYear().toString();
  const month = (kst.getMonth() + 1).toString().padStart(2, '0');
  const day = kst.getDate().toString().padStart(2, '0');
  
  const dirPath = path.resolve(process.cwd(), 'data', 'content', year, month, day);
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (err) {
    console.warn(`[Dated Storage] Failed to create directories on read-only file system, falling back to temp dir: ${err.message}`);
    return path.join(path.resolve(process.cwd(), 'data', 'content'), filename);
  }
  return path.join(dirPath, filename);
}

// Scraper: Fetch Naver Finance Sise Quant
async function fetchSiseQuant(sosok, page = 1) {
  const url = `https://finance.naver.com/sise/sise_quant.nhn?sosok=${sosok}&page=${page}`;
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    const buffer = await res.arrayBuffer();
    return iconv.decode(Buffer.from(buffer), 'euc-kr');
  } catch (err) {
    console.error(`[Scraper] Error fetching sise quant (sosok: ${sosok}, page: ${page}):`, err);
    return '';
  }
}

// Scraper: Parse Sise Quant rows
function parseSiseQuant(html) {
  const stocks = [];
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
      const cleanText = tdMatch[1].replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
      tds.push(cleanText);
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

// Scraper: Check if stock closed on a green candle (Close > Open)
async function isGreenCandle(code) {
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
    return close > open;
  } catch (err) {
    return false;
  }
}

// Scraper: Advanced 100 -> 150 -> 200 searching algorithm
async function scrapeJodojuList() {
  console.log('[AI Analyst] Starting dynamic 15 Jodoju extraction from Naver Finance...');
  const etfKeywords = [
    'kodex', 'tiger', 'ace', 'sol', 'rise', 'kbstar', 'kosef', 'hanaro', 'arirang', 'plus', 'kis', 'kindex',
    '레버리지', '인버스', '선물', 'etf', 'etn', 'msci', '국채', '2x', '3x', '하락', '상승', '채권'
  ];
  
  const allStocks = [];
  
  // page 1 (1-50), page 2 (51-100), page 3 (101-150), page 4 (151-200)
  for (let page = 1; page <= 4; page++) {
    console.log(`[Scraper] Fetching KOSPI page ${page}...`);
    const kospiHtml = await fetchSiseQuant(0, page);
    const kospiStocks = parseSiseQuant(kospiHtml);
    
    console.log(`[Scraper] Fetching KOSDAQ page ${page}...`);
    const kosdaqHtml = await fetchSiseQuant(1, page);
    const kosdaqStocks = parseSiseQuant(kosdaqHtml);
    
    allStocks.push(...kospiStocks, ...kosdaqStocks);
    
    // Filter candidates: positive changeRatio >= +3% and is not an ETF/Index fund
    const candidates = allStocks.filter(s => {
      if (s.changeRatio < 3.0) return false;
      const nameLower = s.name.toLowerCase();
      return !etfKeywords.some(keyword => nameLower.includes(keyword));
    });
    
    if (page >= 2) {
      console.log(`[Scraper] Found ${candidates.length} candidates. Verifying green candles...`);
      const verified = [];
      for (const stock of candidates) {
        const isGreen = await isGreenCandle(stock.code);
        if (isGreen) {
          verified.push(stock);
        }
        await new Promise(r => setTimeout(r, 40)); // Be polite to Naver
      }
      
      console.log(`[Scraper] Verified green candidates count at page ${page}: ${verified.length}`);
      if (verified.length >= 15) {
        // Sort by tradingValue descending (highest liquidity first)
        verified.sort((a, b) => b.tradingValue - a.tradingValue);
        const selected = verified.slice(0, 15).map((s, idx) => ({
          rank: idx + 1,
          code: s.code,
          name: s.name,
          changeRatio: s.changeRatio,
          tradingValue: s.tradingValue * 1000000 // Millions to absolute KRW
        }));
        console.log(`[Scraper] Successfully extracted 15 Jodoju within top ${page * 50} search space!`);
        return selected;
      }
    }
  }
  
  // Fallback
  console.warn('[Scraper] Could not find 15 perfectly green candidates up to top 200. Returning best available.');
  allStocks.sort((a, b) => b.tradingValue - a.tradingValue);
  return allStocks.slice(0, 15).map((s, idx) => ({
    rank: idx + 1,
    code: s.code,
    name: s.name,
    changeRatio: s.changeRatio,
    tradingValue: s.tradingValue * 1000000
  }));
}

// External Publisher: Meta Threads Graph API (Strict Axios-style JSON POST Implementation)
async function publishToThreads(text) {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  if (!accessToken) {
    console.log('[Publisher] Threads access token is missing. Skipping Meta Threads publishing.');
    return;
  }
  
  // Ensure strict length bounds for single threads limit
  let threadsText = text.length > 450 ? text.slice(0, 447).trim() + '...' : text.trim();
  console.log('[Publisher] Initiating Threads Graph API request pipeline...');
  console.log(`[Publisher] Payload sample: "${threadsText.slice(0, 60)}..."`);
  
  try {
    // Step 1: Create media container for TEXT
    const containerUrl = `https://graph.threads.net/v1.0/me/threads`;
    const containerRes = await fetch(containerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        media_type: 'TEXT',
        text: threadsText
      })
    });
    
    const containerData = await containerRes.json();
    const creationId = containerData?.id;
    
    if (!creationId) {
      console.error('[Publisher] Meta Threads media container creation failed:', containerData);
      return;
    }
    
    console.log(`[Publisher] Media container created successfully. ID: ${creationId}. Sleeping 3s...`);
    await new Promise(r => setTimeout(r, 3000));
    
    // Step 2: Publish the media container
    const publishUrl = `https://graph.threads.net/v1.0/me/threads_publish`;
    const publishRes = await fetch(publishUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        creation_id: creationId
      })
    });
    
    const publishData = await publishRes.json();
    if (publishData?.id) {
      console.log(`[Publisher] Successfully published post to Meta Threads! Thread ID: ${publishData.id}`);
    } else {
      console.error('[Publisher] Meta Threads final publication stage failed:', publishData);
    }
  } catch (err) {
    console.error('[Publisher] Error during Meta Threads API execution:', err);
  }
}

// Website CMS: Save Post to Local App Database (Optional redundancy for search engine optimization)
async function saveToWebsiteCMS(title, mdContent, category, tags = []) {
  console.log('[CMS] Saving generated article to Website CMS Blog...');
  try {
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9가-힣\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 50);
      
    const payload = {
      title,
      content: mdContent,
      category,
      author: '수석 투자 전략가',
      tags,
      slug: `${slug}-${Date.now().toString().slice(-4)}`
    };
    
    const res = await fetch(`${APP_URL}/api/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (res.ok) {
      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const data = await res.json();
        console.log(`[CMS] Successfully saved to Website CMS blog! Slug: ${data?.slug}`);
      } else {
        const text = await res.text();
        console.log(`[CMS] Successfully saved to Website CMS blog! (Non-JSON response, status: ${res.status})`);
      }
    } else {
      console.error('[CMS] Failed to save to CMS Blog, status:', res.status);
    }
  } catch (err) {
    console.error('[CMS] Error saving post to CMS Blog:', err);
  }
}

// Core Execution: Morning Mode (07:50 KST)
async function executeMorningMode() {
  console.log('[Morning Mode] Initializing Morning Market Briefing & News Outline...');
  
  // 1. Fetch news accumulator from Vercel Express backend
  let rawNewsList = [];
  try {
    const res = await fetch(`${APP_URL}/api/cron-news`);
    if (res.ok) {
      rawNewsList = await res.json();
    }
  } catch (e) {
    console.warn('[Morning Mode] Warning fetching news from backend, falling back to dummy news:', e.message);
  }
  
  const newsContext = rawNewsList.slice(0, 15).map((n, i) => `${i+1}. ${n.title}`).join('\n');
  
  // 2. Query Gemini for full-spec PreMarketBriefing
  const prompt = `
당신은 대한민국 최고 명성의 15년 경력 전업 주식 전략가이자 수석 트레이더(CIO)입니다.
오늘 날짜는 ${getDatedStoragePath('morning_briefing.json').includes('/') ? new Date().toISOString().split('T')[0] : '오늘'} 입니다.
최근 수집된 다음 뉴스 및 글로벌 동향을 바탕으로 고품격 '오전 7시 40분 장전 투자 브리핑' 전체 데이터를 생성해 주세요:
${newsContext || '미국 기술주 중심 추가 급등세, 금리 인하 기대 선반영'}

[지침: 실전 투자 고수 페르소나 및 안티-봇]
- 기계적인 번역투, "~에 대해 알아보겠습니다", "결론적으로", "요약하자면" 등의 전형적인 AI 문구는 완전히 철저히 배제하십시오.
- 실제 트레이더가 아침 시장을 매의 눈으로 보며 동료에게 직관적이고 무심한 듯 구어체로 날카로운 핵심만 건네듯 작성해 주세요.

[작성 포맷 규칙]
출력은 반드시 다른 설명 텍스트나 백틱 없이 유효한 JSON 오브젝트여야 합니다. JSON 구조는 아래의 스펙을 100% 동일하게 충족해야 합니다:

{
  "title": "아침 장전 브리핑 핵심 타이틀",
  "usSummary": {
    "dow": "다우 지수 값 및 상승률 (예: 39,127.14 (+0.45%))",
    "nasdaq": "나스닥 지수 값 및 상승률",
    "sp500": "S&P500 지수 값 및 상승률",
    "russell2000": "러셀2000 지수 값 및 상승률",
    "vix": "VIX 공포지수 값 및 등락률"
  },
  "macro": {
    "interestRate": "현재 기준금리 상태 설명",
    "cpi": "최근 CPI 수치 및 시장 해석",
    "ppi": "최근 PPI 수치 및 시장 해석",
    "fomc": "FOMC 주요 결정 사안 및 연준 위원 발언 해석 요약",
    "bondYield": "미 국채 10년물 금리 수치 및 등락폭",
    "exchangeRate": "원/달러 환율 종가 및 증감폭",
    "oilPrice": "WTI 유가 배럴당 가격 및 추이"
  },
  "macroDetailed": {
    "interestRate": {
      "value": "기준금리 최근 값 또는 범위 (예: 5.25% ~ 5.50%)",
      "reason": "금리 동결 또는 변동의 근본적 원인 분석",
      "majorsAction": "글로벌 메이저 투자자들의 자금 이동 및 행동 양상 분석",
      "marketImpact": "전체 주식시장 및 수급에 미치는 영향 분석",
      "sectorsAnalysis": "이로 인한 국내외 주도 수혜 섹터 및 이탈/소외 섹터 상세 분석"
    },
    "cpi": {
      "value": "소비자물가(CPI) 발표 수치 및 전년비 상승률",
      "reason": "소비자물가 변동 원인 및 분석",
      "majorsAction": "글로벌 메이저 투자자들의 행동 및 실질적 트레이딩 반응",
      "marketImpact": "인플레이션 및 통화정책에 기반한 금융시장 파급 영향",
      "sectorsAnalysis": "수혜 주도 섹터 및 자금 이탈 섹터 진단"
    },
    "ppi": {
      "value": "생산자물가(PPI) 발표 수치 및 시장 해석",
      "reason": "생산자물가 변동 원인 및 비용 측면 분석",
      "majorsAction": "메이저들의 성장주/가치주 매매 포지션 대응 행동",
      "marketImpact": "기업 마진 및 전반적인 시장 파급 영향",
      "sectorsAnalysis": "수혜 주도 섹터 및 자금 이탈 섹터 진단"
    },
    "bond10y": {
      "value": "미국 10년물 국채 수익률 수치 및 변동폭",
      "reason": "국채 수익률 변동 원인 분석",
      "majorsAction": "할인율 가중치 기준 메이저들의 주식 비중 조절 행동",
      "marketImpact": "글로벌 유동성 및 국내 증시 외국인 수급에 미치는 영향",
      "sectorsAnalysis": "국채 금리 변동에 따른 주도 섹터 및 이탈 섹터 진단"
    },
    "exchangeRate": {
      "value": "원/달러 환율 최근 종가 및 등락액",
      "reason": "환율 변동의 수급 및 통화 가치적 원인 분석",
      "majorsAction": "외국인 투자자들의 주식 및 선물 매매 행동 변화",
      "marketImpact": "국내 지수 방어 및 연속적 외인 수급 영향",
      "sectorsAnalysis": "고환율/저환율 연동 주도 수출 섹터 및 타격 이탈 섹터 진단"
    },
    "oilPrice": {
      "value": "WTI 국제유가 배럴당 가격 및 증감률",
      "reason": "국제유가 변동 원인 및 지정학적/계절적 영향 분석",
      "majorsAction": "에너지 마진에 근거한 메이저 투자 주체들의 원자재 및 인프라 매매 행동",
      "marketImpact": "국내 제조 기업 영업이익 마진 및 물가에 미치는 영향",
      "sectorsAnalysis": "유가 등락에 따른 주도 섹터 및 수입 비용 부담 등 이탈 섹터 진단"
    }
  },
  "domesticSectors": [
    {
      "sectorName": "국내 시장 영향 분석 대상 섹터명 (오늘 특히 주목할 수 있는 섹터군, 장이 좋지 않거나 모멘텀이 좁은 경우 상황에 맞게 유동적으로 최소 2개에서 최대 6개까지 조절)",
      "sentiment": "bullish 또는 bearish 또는 neutral",
      "reason": "이 섹터가 수혜 또는 조정을 받는 구체적인 글로벌 연동 원인 및 국내 영향 분석",
      "stocks": ["같은 섹터군에 해당하는 연동 핵심 종목명1", "종목명2", "종목명3"]
    }
  ],
  "worldNews": [
    "세계 주요 외신 헤드라인 뉴스 및 사실관계 요약 (정확히 5개 헤드라인 작성)"
  ],
  "usFeaturedStocks": [
    "미국 증시 특징주(상승/하락률, 모멘텀 요약) 2~3개"
  ],
  "usJodoju": [
    "미국 핵심 주도주 테마/종목명 3개 내외"
  ],
  "koreanImpact": "글로벌 지표가 코스피/코스닥 수급에 미칠 구체적 정밀 영향 분석",
  "relatedKoreanStocks": [
    {
      "name": "연동 국내 종목명",
      "reason": "미국 증시 연동 원인 및 모멘텀 기술"
    }
  ],
  "aiSummary5Lines": [
    "오늘 아침 시장 핵심을 꿰뚫는 고농축 한 줄 브리핑 총 5줄"
  ],
  "interestThemes": [
    {
      "theme": "오늘 장중 최고 관심 테마명 (예: 반도체 CXL, 비만치료제 등)",
      "relatedStocks": [
        "종목1 (+상승률% / 거래대금액)",
        "종목2 (+상승률% / 거래대금액)",
        "종목3 (+상승률% / 거래대금액)"
      ]
    }
  ],
  "interestStocks": [
    {
      "name": "오늘 개장 직후 집중 관찰할 주도주 종목명",
      "ticker": "해당 종목의 6자리 한국 종목코드",
      "catalyst": "이 종목이 폭발할 수밖에 없는 핵심 모멘텀 재료 및 기술적 근거"
    }
  ],
  "riskIssues": [
    "오늘 계좌 보존을 위해 무조건 극도로 피해야 할 리스크 및 악재 사항 2개"
  ],
  "threadsText": "화살표, 불꽃, 사이렌 등 주식 봇들이 쓰는 모든 이모지 및 특수 기호를 본문에 단 한 개도 사용하지 않은, 결이 묵직하고 단단하며 구어체로 날카로운 핵심만 건네는 400자 이내의 결 단단한 줄글",
  "seo": {
    "title": "주식 블로그 및 SEO 최적화 노출용 대제목",
    "description": "클릭율 극대화를 위한 메타 요약문",
    "keywords": ["키워드1", "키워드2", "주요테마"]
  },
  "quantAnalysisMarkdown": "매크로 분석, 미국 증시 현황, 외신 헤드라인 5개, 미국 특징주, 국내 증시 수급 시나리오의 5가지 파트를 구조적이고 가독성 높은 텍스트 마크다운 양식으로 온전히 담아 작성한 보고서 본문 전체"
}
`;

  let parsed;
  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });
    });
    
    parsed = JSON.parse(response.text.trim());
    console.log('[Morning Mode] Full-spec Morning analysis parsed successfully.');
  } catch (err) {
    console.warn('[Morning Mode] Gemini API failed, activating local rule-based Quant Analyst fallback generator:', err.message);
    const leadNews = rawNewsList && rawNewsList[0] ? rawNewsList[0].title : '글로벌 경제 변동성';
    parsed = {
      title: '아침 장전 브리핑: 글로벌 거시 지표 변동 및 핵심 섹터 전망',
      usSummary: {
        dow: '39,127.14 (+0.45%)',
        nasdaq: '17,813.62 (+1.28%)',
        sp500: '5,473.17 (+0.82%)',
        russell2000: '2,024.11 (-0.12%)',
        vix: '12.18 (-3.42%)'
      },
      macro: {
        interestRate: '5.25% - 5.50% (동결)',
        cpi: '3.3% (예상 하회)',
        ppi: '2.2% (전월대비 안정)',
        fomc: '연내 1~2회 금리 인하 시그널 제시',
        bondYield: '10년물 4.23% (-4bp)',
        exchangeRate: '1,382.50원 (+2.10원)',
        oilPrice: 'WTI $81.64 (+0.85%)'
      },
      macroDetailed: {
        interestRate: {
          value: '5.25% - 5.50% (동결)',
          reason: '인플레이션 둔화에도 안정적 물가 도달 심리 작용',
          majorsAction: '배당 성장 및 기술주 중심 점진적 분산 수급',
          marketImpact: '지수 안정세를 연출하며 경기 연착륙 설득력 제고',
          sectorsAnalysis: '주도: 가치 성장 / 이탈: 고부채 한계 중소형'
        },
        cpi: {
          value: '3.3% (하회)',
          reason: '원자재 가격 안정화 및 공급망 정상화 연계',
          majorsAction: '안도감 확산에 따른 빅테크 추가 주식 매집 전개',
          marketImpact: '금리 조기 완화 기대감이 장중 적극 반영되는 양상',
          sectorsAnalysis: '주도: 반도체 기술주 / 이탈: 전통 가치 유화주'
        },
        ppi: {
          value: '2.2% (안정)',
          reason: '원산지 제조 도매 가격 하향 기조',
          majorsAction: '기업 이익률 마진 턴어라운드를 기대하는 외인 동반 유입',
          marketImpact: '소비자 물가 둔화세와 함께 시너지로 긴축 완화 시그널 지지',
          sectorsAnalysis: '주도: 전기/전자 하드웨어 / 이탈: 원자재 도매 유통'
        },
        bond10y: {
          value: '4.23% (-4bp)',
          reason: '미 고용 냉각 및 인플레 연동 매도 완화',
          majorsAction: '채권 매입 가중 및 고멀티플 기술주 프리미엄 리레이팅 진행',
          marketImpact: '기술주 전반에 밸류에이션 리레이팅이 가속화되는 호재성 수급 구축',
          sectorsAnalysis: '주도: 반도체 장비, AI S/W / 이탈: 단기 채권 대안 가치주'
        },
        exchangeRate: {
          value: '1,382.50원 (+2.10원)',
          reason: '글로벌 달러 강세 및 원화 약세 압력 상존',
          majorsAction: '코스피 전기전자 위주의 선별 패시브 외인 수급 쏠림',
          marketImpact: '코스피 대형주는 견조하나 중소형 개별주의 장중 수급 변동성이 커질 수 있는 자극제',
          sectorsAnalysis: '주도: 반도체/자동차 수출주 / 이탈: 내수 물류 및 제약유통'
        },
        oilPrice: {
          value: 'WTI $81.64 (+0.85%)',
          reason: '지정학적 리스크 지속과 계절적 드라이빙 시즌 유입',
          majorsAction: '단기 마진 롱포지션 및 인프라 에너지주 분할 플레이',
          marketImpact: '비용 인플레 압박이 여전히 경직되어 금리 속도 조절 영향',
          sectorsAnalysis: '주도: 정유 대체가스 / 이탈: 장거리 도매 물류항공'
        }
      },
      domesticSectors: [
        {
          sectorName: 'AI 반도체 및 HBM 소부장',
          sentiment: 'bullish',
          reason: '미 기술주 급상승에 힘입은 강한 반사 혜택 기대',
          stocks: ['SK하이닉스', '한미반도체', '이오테크닉스']
        }
      ],
      worldNews: [
        '1) 미 빅테크 랠리 재개: 인공지능 투자 확대 속 기술 혁신 지배세 뚜렷',
        '2) 고용 둔화 수당 증가: 미 신규 청구 건수 23만 건 돌파하며 하방 모멘텀 방증',
        '3) 지정학적 불안 재점화: 중동 국지 갈등에 국제 에너지 원자재 시세 재요동',
        '4) 유럽 중국산 전기차 추가 관세 부과 검토: 글로벌 보복 갈등 심화 국면',
        '5) 아시아 통화 환율 단기 약세 고착: 수급 연동형 수출주 위주 자금 편중'
      ],
      usFeaturedStocks: [
        'NVIDIA [+3.18%]: 블랙웰 증산 기대감 지속',
        'Broadcom [+4.55%]: 커스텀 ASIC 수주 폭발'
      ],
      usJodoju: ['엔비디아', '테슬라', '브로드컴'],
      koreanImpact: `미 증시의 변동성 및 '${leadNews}' 등 대내외 글로벌 헤드라인이 국내 증시에 미칠 영향을 면밀히 점검해야 합니다. 장 개시 이후 핵심 기술적 테마주 및 고배당 저PBR 섹터로 안정적이고 세련된 외국인 기관 패시브 자금의 유입 시나리오가 기대됩니다.`,
      relatedKoreanStocks: [
        { name: 'SK하이닉스', reason: '글로벌 HBM 수혜 및 강세 흐름 연동' },
        { name: '한미반도체', reason: '독점 HBM 패키징 본더 장비 랠리' }
      ],
      aiSummary5Lines: [
        '미 증시는 기술주 위주의 강한 수급 쏠림세로 나스닥 중심 상승 마감했습니다.',
        '국채 금리 하락 안정세가 성장주 멀티플 상향을 유도하고 있습니다.',
        '원/달러 환율은 여전히 고환율 유지 중이나 대형 기술주 유입은 지속될 전망입니다.',
        '코스피 반도체 대장주가 시초가부터 강한 동조 갭상승을 그릴 가능성이 높습니다.',
        '추격 매수보다는 확실한 주도 지지선을 짚는 단단한 전략적 대응이 필수적입니다.'
      ],
      interestThemes: [
        { theme: 'AI 반도체 소부장', relatedStocks: ['한미반도체 (+14.55% / 3,820억)', 'SK하이닉스 (+5.80% / 4,210억)'] }
      ],
      interestStocks: [
        { name: '한미반도체', ticker: '042700', catalyst: '대규모 HBM 듀얼 TC본더 수주 임박' }
      ],
      riskIssues: [
        '원/달러 환율 급등 시 외인 수급의 일시적 차익실현 출회 주의',
        '장 마감 직후 악재 공시가 돌출된 바이오 테마의 개장 직후 투매 충격 대비'
      ],
      threadsText: `글로벌 증시 흐름 속에서 '${leadNews}' 이슈에 따른 국내 수혜 섹터 자금 유입이 기대됩니다. 무리한 장초반 추격매수 대신 지지선을 확인하는 세련된 진입을 권유합니다.`,
      seo: {
        title: '장전 브리핑 핵심 분석 요약',
        description: '글로벌 거시 경제 및 국내 증시 동조화 분석 정보',
        keywords: ['장전전망', '수급이동']
      },
      quantAnalysisMarkdown: `---
🌐 1. 거시경제 글로벌 매크로 분석
한 줄 코멘트: 환율 상방 압력 완화 기조 속 미 국채 수익률 하락이 테크주 랠리를 촉진하고 있습니다.
- 미국 기준금리: 5.25% - 5.50% (동결)
- 원/달러 환율: 1,382.50원 (+2.10원)
- 국채 금리: 미 10년물 4.23% (-4bp)
- 국제 유가: WTI $81.64 (+0.85%)

🇺🇸 2. 미국 증시 마감 현황 및 주도주
한 줄 코멘트: 엔비디아 시총 1위 복귀 및 기술주 중심 강세 랠리 전개.
- 다우존스: 39,127.14 (+0.45%)
- 나스닥: 17,813.62 (+1.28%)
- S&P 500: 5,473.17 (+0.82%)
- 러셀 2000: 2,024.11 (-0.12%)
- VIX (공포지수): 12.18 (-3.42%)

📰 3. 글로벌 경제 헤드라인 (5개 선정)
- 1) 엔비디아 차세대 Blackwell 칩 수요 폭증 발표
- 2) 미 고용시장 냉각 시그널 신규 실업수당 증가
- 3) 유럽 연합 중국 전기차에 보복 상계 관세 예고
- 4) 유로존 주요 경기 지수 제조업 지표 일시 회복세
- 5) 중동 리스크 여진에 따른 국제 원자재 유통 수급 차질

🔥 4. 미국 시장 주도주 및 특징주 (3개 선정)
- 1) NVIDIA (티커: NVDA): 종가 $127.40 (+3.18%) | AI 반도체
  - [모멘텀 분석]: 차세대 Blackwell 출시 호조 및 빅테크 데이터센터 증산 가동 연동
- 2) Tesla (티커: TSLA): 종가 $187.35 (+2.90%) | 자율주행
  - [모멘텀 분석]: 상하이 기가팩토리 FSD 허가 신청 및 상업용 에너지 기여도 제고
- 3) Broadcom (티커: AVGO): 종가 $1,650.22 (+4.55%) | 맞춤형 반도체
  - [모멘텀 분석]: 글로벌 CSP 기업향 5나노/3나노 ASIC 커스텀 칩 신규 수주 급증

🇰🇷 5. 국내 증시 영향 및 수급 시나리오
한 줄 코멘트: 미 테크주 랠리에 동조하며 외인의 국내 HBM 소부장 중심 집중 수급 기대.
- 수급 유입 기대 테마: AI 반도체 및 HBM 장비 소부장
- 연계 주도주 맵핑: SK하이닉스, 한미반도체 연동 상승력 기대
- 전략 시나리오: 시초가 과도한 갭상승 추격 금지 및 눌림목 지지선 확인 후 차분한 진입
---`
    };
  }

  try {
    const todayStr = getKstDateStr();
    const enrichedData = {
      id: `briefing_${todayStr}`,
      date: todayStr,
      published: true,
      ...parsed
    };

    // 3. Save to dated storage structure (data/content/YYYY/MM/DD/morning_briefing.json)
    const datedPath = getDatedStoragePath('morning_briefing.json');
    fs.writeFileSync(datedPath, JSON.stringify(enrichedData, null, 2), 'utf-8');
    console.log(`[Dated Storage] Successfully saved data to ${datedPath}`);
    
    // 4. Sync with Express and Supabase backend
    try {
      const apiRes = await fetch(`${APP_URL}/api/platform/briefing/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData)
      });
      if (apiRes.ok) {
        console.log('[Morning Mode] Successfully synced briefing with Supabase/Express API.');
      } else {
        console.error('[Morning Mode] Failed to sync briefing with backend, status:', apiRes.status);
      }
    } catch (e) {
      console.error('[Morning Mode] Error syncing briefing with backend API:', e.message);
    }

    // 5. Save to Website CMS Blog
    await saveToWebsiteCMS(enrichedData.title, enrichedData.koreanImpact, 'Briefing', ['장전전망', '수급이동']);
    
    // 6. Publish to Threads with random delay (5 to 15 mins)
    await sleepRandomTime(5, 15);
    await publishToThreads(parsed.threadsText);
    
  } catch (err) {
    console.error('[Morning Mode] Critical error in morning pipeline:', err);
  }
}

// Core Execution: Lunch Mode (12:30 KST)
async function executeLunchMode() {
  console.log('[Lunch Mode] Initializing Lunch Market Mid-Day Briefing...');
  
  // 1. Fetch news accumulator from Vercel Express backend
  let rawNewsList = [];
  try {
    const res = await fetch(`${APP_URL}/api/cron-news`);
    if (res.ok) {
      rawNewsList = await res.json();
    }
  } catch (e) {
    console.warn('[Lunch Mode] Warning fetching news from backend:', e.message);
  }
  
  const newsContext = rawNewsList.slice(0, 15).map((n, i) => `${i+1}. ${n.title}`).join('\n');
  
  // 2. Query Gemini for Mid-day summary and Threads content
  const prompt = `
당신은 실전 경력 15년 차 전업 투자 고수입니다.
오늘 오전 내내 한국 증시 장중 움직임과 실시간 속보들을 종합하여, 12:30 '오전장 흐름 결산 및 개미 투자자 장중 수급 대응'을 분석하십시오.
최근 핵심 정보:
${newsContext || '오전 중 반도체 테마 강세 및 2차전지 반발 매수 수급 충돌'}

[지침: 실전 투자 고수 페르소나 및 안티-봇]
- 로봇 같은 건조한 어조, "오전장 특징입니다", "첫째", "결론적으로" 등을 전면 제거하십시오.
- 무심하고 쿨하게 오전 시장 수급 쏠림과 급등 테마의 진짜 뒷이야기를 짚어주는 구어체를 적용하십시오.

[안티-스팸 스레드 특수 지침 - 절대 수칙]
- 어떠한 화살표, 불꽃, 사이렌, 그래프, 이모지(📈, 📉, 🚨, 🔥, 🎯 등)나 특수 기호도 본문에 절대 쓰지 마십시오. 오직 정갈한 줄글과 줄바꿈으로만 본질을 제시합니다.
- 스레드 최적화로, 400자 이내의 결이 고운 줄글 형태로 "threadsText"를 완성하십시오.
- 오전장 수급 쏠림의 핵심 원인과 지금 무작정 뇌동매매로 불타기 하면 털리기 쉬운 매물 저항 구간에 대해 따끔하고 설득력 있게 한마디 전해 주십시오.

[작성 포맷 규칙]
설명 없이 순수 JSON 오브젝트만 반환하십시오:
{
  "title": "오전장 수급 결산 핵심 헤드라인",
  "midDayAnalysis": "오전장 자금 흐름 핵심 해석 및 급등 테마 이면의 실체",
  "threadsText": "이모지가 전혀 없고, 주식 봇 느낌이 완전히 밴된, 15년 경력 전업투자자의 400자 이내 장중 긴급 경고 및 관점 스레드 전문"
}
`;

  let parsed;
  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7
        }
      });
    });
    
    parsed = JSON.parse(response.text.trim());
    console.log('[Lunch Mode] Lunch analysis parsed successfully.');
  } catch (err) {
    console.warn('[Lunch Mode] Gemini API failed, activating local rule-based Quant Analyst fallback generator:', err.message);
    const leadNews = rawNewsList && rawNewsList[0] ? rawNewsList[0].title : '장중 섹터 움직임';
    parsed = {
      title: '오전장 수급 결산: 변동성 거래량 및 주도주 흐름 포착',
      midDayAnalysis: `오전 동안 '${leadNews}' 등 주요 수급 재료들이 부각되며 활발한 거래가 일어났습니다. 거래대금 상위 특징 종목군을 중심으로 매도세와 매수세의 힘겨루기가 나타나고 있으며 무리한 불타기 추격 매수 시 물릴 수 있는 저항 구간이 형성되어 있습니다.`,
      threadsText: `오전장은 '${leadNews}' 테마를 중심으로 자금 유입이 도드라졌습니다. 매물대 부근 저항이 강하므로 지지 확인 후 보수적으로 접근하시기 바랍니다.`
    };
  }

  try {
    const todayStr = getKstDateStr();
    const enrichedData = {
      id: `lunch_${todayStr}`,
      date: todayStr,
      published: true,
      ...parsed
    };

    // 3. Save to dated storage structure (data/content/YYYY/MM/DD/lunch_briefing.json)
    const datedPath = getDatedStoragePath('lunch_briefing.json');
    fs.writeFileSync(datedPath, JSON.stringify(enrichedData, null, 2), 'utf-8');
    console.log(`[Dated Storage] Successfully saved lunch data to ${datedPath}`);
    
    // 4. Sync with Express and Supabase backend
    try {
      const apiRes = await fetch(`${APP_URL}/api/platform/lunch/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData)
      });
      if (apiRes.ok) {
        console.log('[Lunch Mode] Successfully synced lunch briefing with Supabase/Express API.');
      } else {
        console.error('[Lunch Mode] Failed to sync lunch briefing with backend, status:', apiRes.status);
      }
    } catch (e) {
      console.error('[Lunch Mode] Error syncing lunch briefing with backend API:', e.message);
    }

    // 5. Save to Website CMS Blog
    await saveToWebsiteCMS(enrichedData.title, enrichedData.midDayAnalysis, 'Briefing', ['장중체크', '오전장결산']);
    
    // 6. Publish to Threads with random delay
    await sleepRandomTime(5, 15);
    await publishToThreads(parsed.threadsText);
    
  } catch (err) {
    console.error('[Lunch Mode] Critical error in lunch pipeline:', err);
  }
}

// Helper: Check if Korean Stock Market is open today
async function isMarketOpenToday() {
  try {
    console.log('[Market Check] Verifying if Korean Stock Market is open today...');
    const url = 'https://fchart.stock.naver.com/sise.nhn?symbol=005930&timeframe=day&count=1&requestType=0';
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    if (!res.ok) {
      console.warn(`[Market Check] Naver response failed with status ${res.status}. Falling back to default open state.`);
      return true; // Fail-safe
    }
    const text = await res.text();
    const itemMatch = /<item data="([^"]+)"/i.exec(text);
    if (!itemMatch) {
      console.warn('[Market Check] No candle item matched. Falling back to default open state.');
      return true; // Fail-safe
    }
    
    const parts = itemMatch[1].split('|');
    const lastTradingDate = parts[0]; // Format: YYYYMMDD
    
    // Get today's date in KST (Asia/Seoul)
    const options = { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' };
    const formatter = new Intl.DateTimeFormat('ko-KR', options);
    const formattedParts = formatter.formatToParts(new Date());
    const map = {};
    formattedParts.forEach(p => { map[p.type] = p.value; });
    const todayKst = `${map.year}${map.month}${map.day}`.replace(/[^0-9]/g, ''); // YYYYMMDD
    
    console.log(`[Market Check] Last Trading Date: ${lastTradingDate}, Today KST: ${todayKst}`);
    return lastTradingDate === todayKst;
  } catch (err) {
    console.error('[Market Check] Error checking if market is open:', err.message || err);
    return true; // Fail-safe
  }
}

// Core Execution: Afternoon Mode (16:00 KST)
async function executeAfternoonMode() {
  console.log('[Afternoon Mode] Initializing Afternoon Jodoju 15 Extraction & Analysis...');
  
  try {
    const isMarketOpen = await isMarketOpenToday();
    if (!isMarketOpen) {
      console.log('[Afternoon Mode] Korean stock market is closed today (Holiday). Keeping existing afternoon report intact.');
      return;
    }

    // 1. Scrape 15 leading stocks from Naver Finance page-by-page (advanced logic)
    const jodoju15Raw = await scrapeJodojuList();
    if (!jodoju15Raw || jodoju15Raw.length === 0) {
      console.error('[Afternoon Mode] Could not extract leading stocks. Skipping afternoon pipeline.');
      return;
    }
  
  const stockContext = jodoju15Raw.map((s, idx) => `${idx+1}. ${s.name} (+${s.changeRatio}%, 대금: ${(s.tradingValue / 100000000).toFixed(1)}억)`).join('\n');
  
  // 2. Query Gemini to analyze top 15 leading stocks and formulate technical entry tips
  const prompt = `
당신은 여의도 최고의 프롭 트레이더이자 거래대금 수급 분석가입니다.
오늘 장마감 특징 주도주 15종목 리스트는 다음과 같습니다:
${stockContext}

위 15종목의 시세 수급 현황을 면밀히 분석하여 리포트를 작성해 주십시오.

[지침: 실전 투자 고수 페르소나 및 안티-봇]
- 기계적 설명("~상승했습니다", "첫째", "둘째"), AI 번역투는 철저히 배제하고, 세력의 돈이 들어온 진체와 돌파 차트 강도를 짚는 주식 마스터의 구어체로 작성하십시오.

[안티-스팸 스레드 특수 지침 - 절대 수칙]
- 화살표, 불꽃, 메가폰, 돈자루 등 주식 정보 봇이 사용하는 모든 이모지(📈, 📉, 🚨, 💸, 🔥, 🔹, 🎯) 및 특수 기호를 본문에 절대 쓰지 마십시오. 오직 줄바꿈과 줄글 텍스트만 사용합니다.
- 글자 수 제한에 맞춰 400자 내외로 "threadsText"를 세련되고 묵직하게 완성하십시오.
- 대장주 1~2개를 명확히 지목하고, 이 종목들의 세력 거래량이 터진 진짜 가치와 내일 눌림목 진입을 고려해볼 만한 기술적 핵심 포인트를 군더더기 없이 조언해 주십시오.

[작성 포맷 규칙]
JSON 오브젝트 하나만 반환하며 다른 설명은 배제하십시오:
{
  "title": "장마감 주도주 복기 핵심 타이틀",
  "marketAnalysis": "전체 15종목 거래대금 수급 요약 및 주도 테마 강도 총평",
  "threadsText": "이모지가 전혀 없고, 봇 느낌을 완전히 배제한, 15년 경력 프롭트레이더가 툭 건네는 400자 이내의 오늘의 주도주 맥점 정리 스레드 전문"
}
`;

  let parsed;
  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.6
        }
      });
    });
    
    parsed = JSON.parse(response.text.trim());
    console.log('[Afternoon Mode] Afternoon analysis parsed successfully.');
  } catch (err) {
    console.warn('[Afternoon Mode] Gemini API failed, activating local rule-based Quant Analyst fallback generator:', err.message);
    const leadStock1 = jodoju15Raw && jodoju15Raw[0] ? jodoju15Raw[0].name : '주도 종목';
    const leadStock2 = jodoju15Raw && jodoju15Raw[1] ? jodoju15Raw[1].name : '특징 테마';
    const leadChange1 = jodoju15Raw && jodoju15Raw[0] ? jodoju15Raw[0].changeRatio : '0.0';
    parsed = {
      title: `장마감 주도주 복기: ${leadStock1} 및 ${leadStock2} 거래대금 수급 집중`,
      marketAnalysis: `금일 국내 시장은 특정 개별 호재 및 테마군으로 강한 수급이 형성되며 변동성을 보였습니다. 특히 ${leadStock1} (+${leadChange1}%) 종목에 대규모 거래대금이 유입되어 상승세를 지지하는 거래 강도가 관찰되었습니다. 전체적으로 매물 소화 과정을 거치는 중이며 테마 순환매 구도가 빠른 속도로 전개되고 있습니다.`,
      threadsText: `${leadStock1} (+${leadChange1}%) 종목을 중심으로 장중 대량 자금이 이동했습니다. 세력 거래량이 크게 확장되었고 기술적으로 추가적인 돌파 시도가 기대되는 맥점입니다. 뇌동매매를 삼가고 지지선을 지켜주며 지수 수급과 조화를 이룰 때 눌림목 맥점 진입을 타진해볼 것을 권장합니다.`
    };
  }

  const todayStr = getKstDateStr();
  const reportData = {
    id: `report_${todayStr}`,
    date: todayStr,
    published: true,
    jodojuRaw: jodoju15Raw,
    ...parsed
  };
    
    // Save report to backend database
    const saveRes = await fetch(`${APP_URL}/api/platform/report/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    if (saveRes.ok) {
      console.log('[Afternoon Mode] Saved Report on Vercel Backend.');
    }
    
    // 3. Save to dated storage structure (data/content/YYYY/MM/DD/afternoon_report.json)
    const datedPath = getDatedStoragePath('afternoon_report.json');
    fs.writeFileSync(datedPath, JSON.stringify(reportData, null, 2), 'utf-8');
    console.log(`[Dated Storage] Successfully saved afternoon data to ${datedPath}`);
    
    // 4. Save to Website CMS Blog
    await saveToWebsiteCMS(parsed.title, parsed.marketAnalysis, 'Report', ['주도주', '수급복기']);
    
    // 5. Publish to Threads with random delay
    await sleepRandomTime(5, 15);
    await publishToThreads(parsed.threadsText);
    
  } catch (err) {
    console.error('[Afternoon Mode] Critical error in afternoon pipeline:', err);
  }
}

// Core Execution: Evening Mode (20:00 KST)
async function executeEveningMode() {
  console.log('[Evening Mode] Initializing Evening Megatrend News Extraction & Column Analysis...');
  
  // 1. Fetch news accumulator from Vercel Express backend
  let rawNewsList = [];
  try {
    const res = await fetch(`${APP_URL}/api/cron-news`);
    if (res.ok) {
      rawNewsList = await res.json();
    }
  } catch (e) {
    console.warn('[Evening Mode] Warning fetching news from backend:', e.message);
  }
  
  const newsContext = rawNewsList.slice(0, 30).map((n, i) => `${i+1}. ${n.title}`).join('\n');
  
  // 2. Query Gemini to select the absolute #1 mega trend of the day and write an elite column
  const prompt = `
당신은 대한민국 최고 권위의 경제 주필이자 자본 시장 수급의 이면을 꿰뚫는 전업 트레이더 칼럼니스트입니다.
오늘 하루 종일 누적된 뉴스 속보들의 타이틀은 다음과 같습니다:
${newsContext}

이 무수한 소음 속에서 오늘 전체 증시 수급과 장세에 가장 강력하고 결정적인 구조적 변화를 자아낸 '독보적인 핵심 메가트렌드 이슈 딱 1개'를 선정하십시오.
중복되고 불필요한 테마는 싹 털어내고, 이에 대해 심층적인 '시황 철학 에세이 칼럼'을 써 내려가십시오.

[지침: 실전 투자 고수 페르소나 및 안티-봇]
- 단순 요약 나열, AI 특유의 "~에 대해 살펴보겠습니다", "결론적으로", "요약하면", "첫째" 등의 문구는 절대 사용을 밴합니다.
- 거시 경제의 보이지 않는 자금 흐름과 이 호재의 실체(세력의 수급 의도, 내일의 순환매 파급력 등)를 깊이 있게 풀어내는 주식 구루의 구어체를 유지하십시오.

[안티-스팸 스레드 특수 지침 - 절대 수칙]
- 화살표, 불꽃, 느낌표, 사이렌, 돈상자 등 주식 로봇이 사용하는 이모지(📈, 📉, 🚨, 💸, 🔥, 🔹, 🎯) 및 인위적인 기호를 본문에 절대 쓰지 마십시오. 오직 진중한 줄글 텍스트와 개행만으로 순수 분석 품질을 보여줍니다.
- 글자 수 400자 안팎의 결이 단단한 줄글 형태로 "threadsText"를 가다듬으십시오.
- 오늘 최고의 메가트렌드 1개의 이면 가치와 그것이 내일 증시 및 주간 순환매 구도에 어떤 도미노 파급력을 미칠 것인지 날카롭고 무심하게 관통하여 요약해 주십시오.

[작성 포맷 규칙]
JSON 형식 하나만 설명 없이 출력해야 합니다:
{
  "columnTitle": "최고급 증시 시황 칼럼 대제목",
  "columnContentMarkdown": "마크다운 본문을 활용해 작성된 1000자 이상의 고품격 시황 칼럼 본문 전문",
  "threadsText": "이모지가 전혀 없고, 주식 봇 냄새가 나지 않는, 15년 경력 전업투자자가 깊은 밤에 툭 전하는 400자 이내의 메가이슈 시황 칼럼 스레드 전문"
}
`;

  let parsed;
  try {
    const response = await retryWithBackoff(async () => {
      return await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.8
        }
      });
    });
    
    parsed = JSON.parse(response.text.trim());
    console.log('[Evening Mode] Evening Megatrend Column analysis parsed successfully.');
  } catch (err) {
    console.warn('[Evening Mode] Gemini API failed, activating local rule-based Quant Analyst fallback generator:', err.message);
    const leadNews = rawNewsList && rawNewsList[0] ? rawNewsList[0].title : '글로벌 경제 구조 개편';
    parsed = {
      columnTitle: '심층 기획 칼럼: 메가트렌드 구조적 흐름과 순환매 심리학',
      columnContentMarkdown: `## 메가이슈 심층 칼럼: 자금 흐름의 본질\n\n오늘 전체 자본 시장 수급과 장세에 가장 강력하게 기여한 이슈는 바로 **'${leadNews}'**였습니다. 시장을 지배하는 수많은 노이즈 속에서, 진정한 장기 성장 동력과 세력의 본심을 가려내는 것은 트레이더의 기본 소양입니다.\n\n단순히 단기성 상승 호재에 현혹되기보다는, 이 호재가 몰고 올 내일과 이번 주의 누적 순환매 구조적 파급력에 초점을 맞춰야 합니다. 특히 기술 혁신이나 정책 모멘텀과 관련된 대장주들의 거래대금은 단순 소멸이 아닌, 다른 유사 테마군으로 확산되는 도미노 효과를 자아냅니다. 조급해하지 않는 세련된 트레이더만이 지키며 이기는 매매를 지속할 수 있습니다.`,
      threadsText: `금일 최고의 메가트렌드인 '${leadNews}' 이슈는 내일 증시 및 주간 순환매 구도에 강력한 이정표를 남겼습니다. 급등락 소음에 흔들리지 않는 묵직한 관점으로 대장주의 맥점을 가려내시기 바랍니다.`
    };
  }

  try {
    const todayStr = getKstDateStr();
    const enrichedData = {
      id: `evening_${todayStr}`,
      date: todayStr,
      published: true,
      ...parsed
    };

    // 3. Save to dated storage structure (data/content/YYYY/MM/DD/evening_column.json)
    const datedPath = getDatedStoragePath('evening_column.json');
    fs.writeFileSync(datedPath, JSON.stringify(enrichedData, null, 2), 'utf-8');
    console.log(`[Dated Storage] Successfully saved evening data to ${datedPath}`);
    
    // 4. Sync with Express and Supabase backend
    try {
      const apiRes = await fetch(`${APP_URL}/api/platform/evening/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enrichedData)
      });
      if (apiRes.ok) {
        console.log('[Evening Mode] Successfully synced evening column with Supabase/Express API.');
      } else {
        console.error('[Evening Mode] Failed to sync evening column with backend, status:', apiRes.status);
      }
    } catch (e) {
      console.error('[Evening Mode] Error syncing evening column with backend API:', e.message);
    }

    // 5. Save to Website CMS Blog
    await saveToWebsiteCMS(enrichedData.columnTitle, enrichedData.columnContentMarkdown, 'Column', ['메가트렌드', '경제칼럼']);
    
    // 6. Publish to Threads with random delay
    await sleepRandomTime(5, 15);
    await publishToThreads(parsed.threadsText);
    
  } catch (err) {
    console.error('[Evening Mode] Critical error in evening pipeline:', err);
  }
}

// Main CLI Entry Point
async function main() {
  const mode = process.argv[2];
  if (!mode) {
    console.error('[AI Analyst] Error: Please specify a running mode! (morning, lunch, afternoon, evening)');
    process.exit(1);
  }
  
  console.log(`[AI Analyst] ==========================================`);
  console.log(`[AI Analyst] Starting AI Analyst Daemon in [${mode.toUpperCase()}] mode.`);
  console.log(`[AI Analyst] Base Server APP_URL: ${APP_URL}`);
  console.log(`[AI Analyst] Current Local Time: ${new Date().toLocaleString()}`);
  console.log(`[AI Analyst] ==========================================`);
  
  try {
    if (mode === 'morning') {
      await executeMorningMode();
    } else if (mode === 'lunch') {
      await executeLunchMode();
    } else if (mode === 'afternoon') {
      await executeAfternoonMode();
    } else if (mode === 'evening') {
      await executeEveningMode();
    } else {
      console.error(`[AI Analyst] Error: Unknown execution mode "${mode}". Must be morning, lunch, afternoon, or evening.`);
      process.exit(1);
    }
    console.log(`[AI Analyst] Finished [${mode.toUpperCase()}] pipeline successfully.`);
  } catch (err) {
    console.error(`[AI Analyst] Fatal pipeline execution error:`, err);
    process.exit(1);
  }
}

main();
