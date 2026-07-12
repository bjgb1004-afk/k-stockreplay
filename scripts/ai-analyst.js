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

// Helper: Dynamically get dated storage path (data/content/YYYY/MM/DD/filename)
function getDatedStoragePath(filename) {
  const now = new Date();
  const year = now.getFullYear().toString();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  
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
      const data = await res.json();
      console.log(`[CMS] Successfully saved to Website CMS blog! Slug: ${data?.slug}`);
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
  
  // 2. Query Gemini for Morning Summary & Threads-specific strict short form
  const prompt = `
당신은 대한민국 최고 명성의 15년 경력 전업 주식 전략가이자 수석 트레이더입니다.
최근 수집된 다음 실시간 뉴스들을 바탕으로, 장전 아침 '글로벌 브리핑 및 섹터 핵심 한줄 전망'을 작성해 주세요:
${newsContext || '미국 기술주 중심 추가 급등세, 금리 인하 기대 선반영'}

[지침: 실전 투자 고수 페르소나 및 안티-봇]
- 첫째, 둘째 같은 딱딱한 순서 매기기나 기계적인 번역투, "~에 대해 알아보겠습니다", "결론적으로", "요약하자면" 등의 전형적인 AI 문구는 완전히 철저히 배제하십시오.
- 실제 트레이더가 아침 시장을 매의 눈으로 보며 동료에게 직관적이고 무심한 듯 구어체로 날카로운 핵심만 건네듯 작성해 주세요.

[안티-스팸 스레드 특수 지침 - 절대 수칙]
- 화살표, 불꽃, 사이렌, 돈자루, 체크표시 등 주식 봇들이 쓰는 모든 종류의 이모지(예: 📈, 📉, 🚨, 💸, 🔥, 🔹, 🎯) 및 특수 기호를 본문에 단 한 개도 사용하지 마십시오. 오직 수려하고 묵직한 줄글 텍스트와 개행(엔터)만으로 가동합니다.
- 스레드 글자 수 제약에 맞춰, 불필요한 인삿말이나 꼬리말 없이 딱 400자 이내의 결이 단단한 줄글 형태로 "threadsText"를 완성하십시오.
- 오늘 장 개시 직후 자금이 무조건 쏠려 들어갈 '국내 수혜 섹터 1개'와 그 명확한 이유를 날카롭게 짚어야 합니다.

[작성 포맷 규칙]
출력은 반드시 다른 설명 텍스트나 백틱 없이 유효한 JSON 오브젝트여야 합니다:
{
  "title": "아침 장전 브리핑 핵심 타이틀",
  "koreanImpact": "국내 증시로의 구체적 자금 이동 시나리오 및 테마 수급 경로 분석",
  "threadsText": "이모지가 전혀 없고, 기계적인 표현을 완벽히 밴한, 15년 경력 고수의 400자 이내 스레드 전용 무심하고 담백한 장전 브리핑 본문 (오직 줄글과 줄바꿈만 사용)"
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });
    
    const parsed = JSON.parse(response.text.trim());
    console.log('[Morning Mode] Morning analysis parsed successfully.');
    
    // 3. Save to dated storage structure (data/content/YYYY/MM/DD/morning_briefing.json)
    const datedPath = getDatedStoragePath('morning_briefing.json');
    fs.writeFileSync(datedPath, JSON.stringify(parsed, null, 2), 'utf-8');
    console.log(`[Dated Storage] Successfully saved data to ${datedPath}`);
    
    // 4. Sync with Express and Supabase backend
    try {
      const apiRes = await fetch(`${APP_URL}/api/platform/briefing/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
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
    await saveToWebsiteCMS(parsed.title, parsed.koreanImpact, 'Briefing', ['장전전망', '수급이동']);
    
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7
      }
    });
    
    const parsed = JSON.parse(response.text.trim());
    console.log('[Lunch Mode] Lunch analysis parsed successfully.');
    
    // 3. Save to dated storage structure (data/content/YYYY/MM/DD/lunch_briefing.json)
    const datedPath = getDatedStoragePath('lunch_briefing.json');
    fs.writeFileSync(datedPath, JSON.stringify(parsed, null, 2), 'utf-8');
    console.log(`[Dated Storage] Successfully saved lunch data to ${datedPath}`);
    
    // 4. Sync with Express and Supabase backend
    try {
      const apiRes = await fetch(`${APP_URL}/api/platform/lunch/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
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
    await saveToWebsiteCMS(parsed.title, parsed.midDayAnalysis, 'Briefing', ['장중체크', '오전장결산']);
    
    // 6. Publish to Threads with random delay
    await sleepRandomTime(5, 15);
    await publishToThreads(parsed.threadsText);
    
  } catch (err) {
    console.error('[Lunch Mode] Critical error in lunch pipeline:', err);
  }
}

// Core Execution: Afternoon Mode (16:00 KST)
async function executeAfternoonMode() {
  console.log('[Afternoon Mode] Initializing Afternoon Jodoju 15 Extraction & Analysis...');
  
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.6
      }
    });
    
    const parsed = JSON.parse(response.text.trim());
    console.log('[Afternoon Mode] Afternoon analysis parsed successfully.');
    
    const todayStr = new Date().toISOString().split('T')[0];
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

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.8
      }
    });
    
    const parsed = JSON.parse(response.text.trim());
    console.log('[Evening Mode] Evening Megatrend Column analysis parsed successfully.');
    
    // 3. Save to dated storage structure (data/content/YYYY/MM/DD/evening_column.json)
    const datedPath = getDatedStoragePath('evening_column.json');
    fs.writeFileSync(datedPath, JSON.stringify(parsed, null, 2), 'utf-8');
    console.log(`[Dated Storage] Successfully saved evening data to ${datedPath}`);
    
    // 4. Sync with Express and Supabase backend
    try {
      const apiRes = await fetch(`${APP_URL}/api/platform/evening/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
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
    await saveToWebsiteCMS(parsed.columnTitle, parsed.columnContentMarkdown, 'Column', ['메가트렌드', '경제칼럼']);
    
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
