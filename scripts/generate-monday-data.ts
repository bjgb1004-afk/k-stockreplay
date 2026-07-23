import dns from 'dns';
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first');
}
import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import iconv from 'iconv-lite';

dotenv.config();

const AI_API_KEY = process.env.GEMINI_API_KEY;
if (!AI_API_KEY) {
  console.error('[Monday Injector] Error: GEMINI_API_KEY is not defined.');
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

async function generateWithRetry(prompt: string, temperature: number = 0.2): Promise<string> {
  const maxRetries = 5;
  let delay = 2000;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: prompt,
        config: { responseMimeType: 'application/json', temperature }
      });
      if (response && response.text) {
        return response.text;
      }
      throw new Error('Empty response from Gemini');
    } catch (err: any) {
      console.warn(`[Gemini Retry] Attempt ${attempt} failed with error:`, err.message || err);
      if (attempt === maxRetries) {
        throw err;
      }
      console.log(`[Gemini Retry] Waiting ${delay}ms before retrying...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 1.5;
    }
  }
  throw new Error('Unreachable code in generateWithRetry');
}

const DATA_DIR = path.resolve(process.cwd(), 'data', 'platform');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DATE_STR = '2026-07-13';

// =========================================================================
// Naver Sise Quant & Value Crawler (Identical to express-app.ts for parity)
// =========================================================================

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

async function fetchSiseValue(sosok: number): Promise<string> {
  const url = `https://finance.naver.com/sise/sise_value.nhn?sosok=${sosok}`;
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

async function generateJodojuList(): Promise<any[]> {
  try {
    console.log(`[Crawler] Fetching real-time KOSPI & KOSDAQ volume and transaction rankers...`);
    const [kospiQuantHtml, kosdaqQuantHtml, kospiValueHtml, kosdaqValueHtml] = await Promise.all([
      fetchSiseQuant(0),
      fetchSiseQuant(1),
      fetchSiseValue(0),
      fetchSiseValue(1)
    ]);
    
    const kospiQuant = parseSiseQuant(kospiQuantHtml);
    const kosdaqQuant = parseSiseQuant(kosdaqQuantHtml);
    const kospiValue = parseSiseQuant(kospiValueHtml);
    const kosdaqValue = parseSiseQuant(kosdaqValueHtml);
    
    const mergedMap = new Map<string, any>();
    for (const stock of [...kospiQuant, ...kosdaqQuant, ...kospiValue, ...kosdaqValue]) {
      mergedMap.set(stock.code, stock);
    }
    const allStocks = Array.from(mergedMap.values());
    
    // Filter ETFs
    const stocksPool = allStocks.filter(s => {
      const nameLower = s.name.toLowerCase();
      const etfKeywords = [
        'kodex', 'tiger', 'ace', 'sol', 'rise', 'kbstar', 'kosef', 'hanaro', 'arirang', 'plus', 'kis', 'kindex',
        '레버리지', '인버스', '선물', 'etf', 'etn', 'msci', '국채', '2x', '3x', '하락', '상승', '채권'
      ];
      return !etfKeywords.some(keyword => nameLower.includes(keyword));
    });
    
    // 1. Fix Top 100 by Change Rate (상승률 상위 100위 고정)
    const top100Change = [...stocksPool]
      .sort((a, b) => b.changeRatio - a.changeRatio)
      .slice(0, 100);
      
    const changeCodes = new Set(top100Change.map(s => s.code));
    
    // 2. Expand Trading Value Cutoff M from 100 by steps of 50
    let M = 100;
    let intersectionStocks: any[] = [];
    
    while (M <= 1000) {
      const topMValue = [...stocksPool]
        .sort((a, b) => b.tradingValue - a.tradingValue)
        .slice(0, M);
        
      intersectionStocks = topMValue.filter(s => changeCodes.has(s.code));
      
      if (intersectionStocks.length >= 15) {
        break;
      }
      M += 50;
    }
    
    // Fallback if we still don't have 15 stocks (Highly unlikely but kept for safety)
    if (intersectionStocks.length < 15) {
      console.log('Intersection yields less than 15 stocks. Falling back to top 100 change sorted by trading value.');
      intersectionStocks = [...top100Change].sort((a, b) => b.tradingValue - a.tradingValue);
    }
    
    // 3. Sort final selected intersection stocks by Change Rate descending (순위는 상승률로 내림차순해서 나열)
    intersectionStocks.sort((a, b) => b.changeRatio - a.changeRatio);
    const selectedStocks = intersectionStocks.slice(0, 15);
    
    return selectedStocks.map((s, idx) => ({
      rank: idx + 1,
      ticker: s.code,
      name: s.name,
      closePrice: s.price,
      changeRate: s.changeRatio,
      volume: s.volume,
      tradeValuePct: Math.round(s.tradingValue / 100) // Convert millions to hundred millions (억 원)
    }));
  } catch (err: any) {
    console.error('[Crawler] Error crawling leading stocks:', err.message || err);
    return [];
  }
}

// =========================================================================
// AI Generators
// =========================================================================

async function generateMorningBriefing(): Promise<any> {
  console.log('[Monday Injector] Generating Pre-Market Briefing via Gemini...');
  const prompt = `
당신은 대한민국 금융 시장 최고의 투자 전략가입니다.
날짜는 2026-07-13 (월요일)입니다. 오늘 아침 장전에 트레이더들에게 전달할 고품격 '장전 브리핑' JSON 데이터를 작성하십시오.

당일 핵심 상황:
- 뉴욕 증시가 견조한 흐름을 지속하며 상승 마감했습니다. (다우: 39,450 (+0.35%), 나스닥: 18,250 (+0.88%), S&P500: 5,580 (+0.55%))
- 반도체 및 AI 기술주가 강한 매수 우위를 주도하고 있습니다. (엔비디아: $132.80 (+1.2%), 필라델피아 반도체 지수 강세)
- 이에 따라 오늘 국내 증시 역시 코스피 반도체 대장주(SK하이닉스, 삼성전자) 및 최근 급격한 임상 소식이 있는 바이오 주도주(알테오젠, 유한양행) 등으로 활발한 외인/기관 수급이 예상됩니다.

작성 규칙:
- 홍보성 문구나 기계적 번역투를 완전히 배제하고, 여의도 최고의 트레이더가 동료들에게 직관적이고 묵직하게 분석을 전달하는 전문 어조로 작성하세요.
- 출력 형식은 오직 JSON이어야 하며 마크다운 백틱 등은 없이 순수 JSON만 반환해야 합니다.

JSON 구조 스키마:
{
  "usSummary": {
    "dow": "39,450.15 (+0.35%)",
    "nasdaq": "18,250.40 (+0.88%)",
    "sp500": "5,580.20 (+0.55%)",
    "russell2000": "2,058.45 (+0.25%)",
    "vix": "12.05 (-2.10%)"
  },
  "macro": {
    "interestRate": "5.25% - 5.50% (금리 동결, 하반기 인하 기대감 확장)",
    "cpi": "3.0%대 진입 안정세 확인",
    "ppi": "생산자물가 예상치 부합하며 안정",
    "fomc": "비둘기파적 연준 위원 발언 잇따라 매크로 안도감 형성",
    "bondYield": "미 10년물 국채금리 4.19% (금리 안정화)",
    "exchangeRate": "1,379.10원 (환율 약보합)",
    "oilPrice": "WTI $81.90 (-0.15%)"
  },
  "worldNews": [
    "엔비디아 차세대 인프라용 칩 공급망 확대로 글로벌 테크 랠리 회복세 지속",
    "금리 인하 기대로 글로벌 하이일드 펀드 및 패시브 성장주 자금 대거 유입",
    "유럽 연합 및 중국 전기차 관세 분쟁 협상 국면 진입으로 매크로 노이즈 완화"
  ],
  "usFeaturedStocks": [
    "NVIDIA [종가: $132.80, 전일대비 +1.22%]: 차세대 Blackwell 양산 지연 우려 해소에 따르는 기관 매수세 수반",
    "Tesla [종가: $195.10, 전일대비 +1.40%]: 연내 상하이 FSD 최종 테스트 소식 및 로보택시 기대감 반영",
    "Broadcom [종가: $1,695.00, 전일대비 +1.20%]: 2분기 사상 최고 매출 전망 및 ASIC 칩 수요 지속"
  ],
  "usJodoju": [
    "엔비디아 (종가: $132.80, 전일대비 +1.22% / AI 반도체)",
    "테슬라 (종가: $195.10, 전일대비 +1.40% / 자율주행)",
    "애플 (종가: $218.40, 전일대비 +1.10% / 온디바이스 AI)"
  ],
  "koreanImpact": "글로벌 매크로 지표의 안도감과 미 국채금리 4.1%대 수렴은 외국인들의 패시브 자금이 국내 기술주 및 성장주로 집중될 최적의 상황을 연출하고 있습니다. 오늘 장 초반 KOSPI 반도체 및 HBM 밸류체인(SK하이닉스, 한미반도체)의 동반 수급 유입이 지수 상방을 견인할 것이며, 글로벌 빅파마 파트너쉽 계약 모멘텀이 이어지는 알테오젠 및 유한양행 등 최고 선호 바이오 종목들이 코스닥 지수의 급상승을 주도할 것입니다. 추격매수 대신 거래대금이 집중되는 주도주 눌림목 지지에 집중하십시오.",
  "relatedKoreanStocks": [
    { "name": "SK하이닉스", "reason": "엔비디아 HBM 수혜 강화에 따른 외인 대량 선매수 수급 연동" },
    { "name": "알테오젠", "reason": "머크 키트루다SC 계약 마일스톤 본격 유입 기대감으로 투심 극대화" },
    { "name": "한미반도체", "reason": "글로벌 듀얼 TC본더 독점 공급 소식에 따른 신고가 매물 소화 연속성" }
  ],
  "aiSummary5Lines": [
    "미국 증시는 완화된 물가 지표와 금리 인하 기대가 공존하며 우상향 랠리를 펼치고 나스닥은 0.88% 견조하게 올랐습니다.",
    "엔비디아 및 기술주의 든든한 상승세가 오늘 코스피 반도체 중심 외국인 수급 확장에 강한 촉매가 됩니다.",
    "환율과 유가의 하향 안정화는 우리 증시 수급 부담을 완전히 덜어주며 지수 안착에 큰 도움을 줍니다.",
    "유한양행의 FDA 최종 승인 기대감 및 바이오 대장들의 신고가 트렌드가 제약바이오 업종의 동반 상승을 선도합니다.",
    "오늘 국내 증시는 반도체 소부장 대장주와 바이오 플랫폼 대형주가 이끄는 전형적인 주도주 압축 장세가 전망됩니다."
  ],
  "interestThemes": [
    { "theme": "HBM3E / AI 반도체 대형주 및 장비", "relatedStocks": ["한미반도체 (+12.50% / 5,200억)", "SK하이닉스 (+4.20% / 6,100억)", "삼성전자 (+1.80% / 9,200억)"] },
    { "theme": "SC 제형 변경 바이오 플랫폼 및 면역항암제", "relatedStocks": ["알테오젠 (+7.40% / 3,100억)", "유한양행 (+8.10% / 2,900억)", "펩트론 (+10.20% / 1,800억)"] }
  ],
  "interestStocks": [
    { "name": "한미반도체", "ticker": "042700", "catalyst": "글로벌 후공정 패키징 고도화 수혜로 차세대 대규모 공급 공시 기대감이 고가 돌파 지지에 탄탄하게 기여" },
    { "name": "알테오젠", "ticker": "196170", "catalyst": "글로벌 특허권 취득과 연말 키트루다 SC 본 출하 일정 개시에 따른 실적 폭발 신뢰도 누적" }
  ],
  "riskIssues": [
    "장 초반 대형 IT의 갭상승 직후 개인들의 무분별한 뇌동 매매 시 고점 밀림 변동성에 주의",
    "개별 테마주 및 실체 없는 한계 기업의 자금 수혈을 유발하는 전환사채 물량 상장 주의"
  ],
  "seo": {
    "title": "2026년 7월 13일 장전 브리핑 - 미 증시 기술주 상승 안착과 국내 반도체·바이오 수급 쏠림 분석",
    "description": "엔비디아 안정적 상승 및 매크로 우호적 지표 전환. 오늘 오전 국내 증시 대장 반도체와 최고의 바이오 테크주로 외국인·기관 수급 극대화 리포트.",
    "keywords": ["주식리플레이", "장전시황", "7월 13일 브리핑", "한미반도체", "알테오젠", "유한양행"]
  }
}
`;

  const text = await generateWithRetry(prompt, 0.2);
  return JSON.parse(text.trim());
}

async function generateLunchBriefing(): Promise<any> {
  console.log('[Monday Injector] Generating Lunch Briefing via Gemini...');
  const prompt = `
당신은 대한민국 실전 주식 투자 최고수입니다.
날짜는 2026-07-13 (월요일)입니다. 오늘 12시 30분 시점에 발행할 '장중 실시간 수급 및 동향 분석' JSON 데이터를 작성하십시오.

오전 상황:
- 한미반도체, 알테오젠, 유한양행 등 대표 주도주들로 수천억 원의 거대한 유동성이 거래대금으로 흡수되며 코스피 및 코스닥이 가뿐하게 전일 대비 강세를 수립하고 있습니다.
- 외국인들이 양 시장에서 무려 6천억 원 이상의 현선물을 폭발적으로 순매수하여 시장 상승의 핵심 동력이 되고 있습니다.
- 장중 눌림을 기다리는 스마트 트레이더들을 위한 날카로운 차트 매수 맥점 분석과 뇌동매매를 방지하기 위한 전문적 조언을 묵직하게 제공하십시오.

작성 규칙:
- 기계적인 번역투나 가벼운 어조는 금지합니다.
- 마크다운 없이 오직 JSON만 반환해야 합니다.

JSON 구조 스키마:
{
  "date": "2026-07-13",
  "title": "월요일 거래대금 2.5조 집중 진단: 반도체 밸류체인과 바이오 테크의 거침없는 질주",
  "midDayAnalysis": "오전 12시 30분 현재, 한국 주식 시장은 월요일 개장과 동시에 엄청난 에너지의 기관·외인 양 매수가 집중되고 있습니다. 코스피는 외국인의 5,800억 원 무차별 현물 매집 세력에 힘입어 전일 대비 1% 이상 상승한 2,500선 안착을 목전에 두고 있으며, 코스닥은 +2.5% 이상의 탄력적인 도약을 통해 850선 저항을 힘차게 노크하고 있습니다. 오늘 오전의 진정한 화두는 주도 테마의 '쏠림의 미학'입니다. AI 반도체 TC 본더 독점적 지위의 한미반도체(042700)가 시가 대비 거대한 매수 수급과 함께 17만 원 라인을 탄탄한 지지로 안착하여 상방 박스권을 넓히고 있으며, 알테오젠(196170)과 유한양행(000100) 등 제약바이오 플랫폼의 절대 강자들 역시 글로벌 승인 모멘텀에 힘입어 장중 각각 5%, 8% 이상의 폭발적인 장대양봉을 그리고 있습니다. 이와 같은 시장에서 개인 투자자들이 저지르는 단 한 가지 치명적 실책은 바로 '추격 매수'입니다. 장 초반의 장대양봉 꼭대기에서 참지 못하고 FOMO에 사로잡혀 시장가 매수를 누르는 것은 순식간에 외국인의 단기 차익 프로그램 매도 물량에 직격타를 맞아 하루치의 심각한 손실을 초래합니다. 진정한 프로 트레이더라면 거래대금이 급증하며 고가를 형성한 뒤, 3분봉 상 20선이나 피봇 2차 지지대 부근에서 분봉 거래대금이 극도로 수렴하며 안정 흐름을 그릴 때까지 끝까지 사냥감의 숨소리를 죽이고 기다렸다가 진입하는 차분한 승부사의 침착성이 필요할 때입니다.",
  "tags": ["장중체크", "오전장결산", "반도체소부장", "바이오플랫폼"]
}
`;

  const text = await generateWithRetry(prompt, 0.2);
  return JSON.parse(text.trim());
}

async function generateAfterMarketReport(stocks: any[]): Promise<any> {
  console.log('[Monday Injector] Generating After-Market Report via Gemini with real-time stocks...');
  const prompt = `
당신은 대한민국 여의도 최고의 프롭 트레이딩 매니저이자 대한민국 대표 주식 연구원입니다.
오늘 날짜는 2026-07-13 (월요일)입니다. 오늘 성공적으로 마감된 주식시장의 '장마감 브리핑 및 주도주 15' JSON 데이터를 정밀하고 풍성하게 작성하십시오.

장마감 결과 요약:
- 코스피 마감 지수: 2,501.20 (+1.25% 급등)
- 코스닥 마감 지수: 852.14 (+2.15% 강한 상승)
- 오늘 우리 시장에서 실제 거래대금과 상승률의 동적 균형을 이루며 시장을 하드캐리한 15종목 명단은 다음과 같습니다. 이 리스트를 가이드로 삼아 각 항목의 세부 필드를 전문가 시각에서 가공하십시오:
${JSON.stringify(stocks, null, 2)}

작성 규칙:
- 상위 5개 종목(특히 명단 내 1~5위 종목)에 대해서는 극단적으로 디테일하고 방대한 상승 이유(상업화 환경, 매크로 밸류체인 수혜), 하락 요인(고가 저항 매물 벽 분석), 장중 3분봉 상의 실전 매수 맥점 가격(Buy Point 2군데의 구체적이고 논리적인 가격선 및 보조지표/이평선 근거), 손절선, 익일 영업일 모니터링 포인트를 충실하고 꽉 채워 작성해주십시오.
- 나머지 10개 종목에 대해서도 프로페셔널한 어조와 정확한 수치로 성실히 채워주세요.
- 출력 형식은 오직 JSON이어야 하며 마크다운 백틱 등은 없이 순수 JSON만 반환해야 합니다.

JSON 구조 스키마:
{
  "jodoju15": [
    {
      "ticker": "6자리 종목코드",
      "name": "종목명",
      "rank": 1,
      "closePrice": 오늘 종가 정수(예: 172400),
      "changeRate": 오늘 상승률 실수(예: 14.55),
      "volume": 오늘 거래량 정수,
      "tradeValuePct": 오늘 거래대금(단위: 억 원) 정수,
      "marketStrength": 1~100 시장강도 정수(예: 95),
      "themeStrength": 1~100 테마강도 정수(예: 98),
      "score": 0~100 주도주 점수 정수,
      "stars": 1~5 별점 정수,
      "relatedThemes": ["핵심테마1", "테마2"],
      "relatedPeerGroup": ["피어그룹1", "피어그룹2"],
      "marketImpact": "당일 지수 방어 및 다른 섹터 자금을 강탈한 영향 구체적 요약",
      "supplyDemand": {
        "foreigner": "외국인 매수액 설명 (예: +380억 순매수)",
        "institution": "기관 수급 설명 (예: 금융투자 및 사모펀드 연쇄 매집)"
      },
      "riseReason": "상승 원인 1줄 직관적 요약",
      "declineReason": "고점 대비 미세 둔화 이유 설명 (없을 경우 생략)",
      "disclosures": [
        { "title": "관련 공시 제목", "date": "2026-07-13" }
      ],
      "news": [
        { "title": "주가 영향 보도 뉴스 기사 제목", "date": "2026-07-13" }
      ],
      "aiSummary": "이 종목의 당일 차트 패턴과 세력 입금 흐름을 관통하는 고품격 3줄 요약 코멘트",
      "aiAnalysis": {
        "riseReasonDetailed": "글로벌 밸류체인 및 수급, 산업 성장성 분석이 녹아든 아주 디테일하고 정밀한 상세 상승 이유",
        "declineReasonDetailed": "장중 저항선 부근에서 일시적 실망 매물이 출회된 요인 분석 및 저항 매물벽 진단",
        "buyPoints": [
          "실전 3분봉 돌파 맥점: 장중 분봉 상에서 안전하고 높은 확률로 진입(매수)할 수 있었던 구체적인 타점 가격(예: '168,000원선')과 상세 기법 근거",
          "추가 매수 맥점: 오후 장 혹은 안정 횡보 밴드 구간에서의 진입 가격 및 근거"
        ],
        "cautionPoints": [
          "호가창 장난질이나 고가 불타기 뇌동매매를 피하기 위한 트레이더가 인지해야 할 급소 및 리스크 요인"
        ],
        "tomorrowCheckpoints": [
          "익일 개장 직후 우선 모니터링해야 할 호가창의 연속 수급 세기 및 대외 글로벌 선물 가격 동향"
        ]
      }
    }
  ],
  "features": [
    {
      "ticker": "6자리 종목코드",
      "name": "종목명",
      "category": "GOOD 또는 BAD 문자열",
      "keywords": ["키워드1", "키워드2"],
      "catalyst": "AI 특징주 분류 지침에 의거한 객관적 호재/악재 재료 분석 기술",
      "relatedStocks": ["연동하여 움직인 동반 섹터 종목명1", "종목명2"]
    }
  ],
  "marketAnalysisSummary": "코스피 코스닥의 장마감 상세 동향과 외국인/기관 수급 주체별 순매수 현황, 그리고 반도체 및 제약바이오 쏠림 현상에 대해 고도의 여의도 CIO 어조로 분석한 장문의 글을 작성하십시오. 호재성 특징주들과 악재 공시 특징주들을 유기적으로 엮어 마크다운 포맷이나 성실한 리스트 형태로 완벽하게 종합한 긴 글을 리턴해야 합니다."
}
`;

  const text = await generateWithRetry(prompt, 0.3);
  return JSON.parse(text.trim());
}

async function generateEveningColumn(): Promise<any> {
  console.log('[Monday Injector] Generating Evening Column via Gemini...');
  const prompt = `
당신은 대한민국 최고 명성의 자본시장 경제 주필이자 인문학적 소양을 깊이 겸비한 트레이더 칼럼니스트입니다.
날짜는 2026-07-13 (월요일)입니다. 오늘 저녁 20시 시점에 발행할 '저녁 AI 금융 칼럼: 메가트렌드 경제 전망' JSON 데이터를 작성하십시오.

월요일 장 상황:
- 코스피 마감: 2,501.20 (+1.25% 돌파 성공), 코스닥 마감: 852.14 (+2.15%)
- 외국인과 기관 양 주체의 코스피 9천억, 코스닥 3천억 동반 폭발 매집 순매수 대세 형성
- 매크로 지표 안정에 따라 묶여있던 가치 유동성의 자물쇠가 풀리며 한국 최고의 성장주들이 지수의 대세적 우상향 레일을 구축했습니다.
- 시장에 흐르는 탐욕과 공포, 그리고 그것이 잉태한 기술 혁신의 위대함과 자본 순환의 거친 파도를 관통하는 깊이 있는 통찰의 에세이 칼럼(1500자 이상으로 꽉 채울 것)을 작성하십시오.

작성 규칙:
- 가벼운 번역 어투는 금지합니다.
- 마크다운 없이 오직 JSON만 반환해야 합니다.

JSON 구조 스키마:
{
  "date": "2026-07-13",
  "title": "월요일의 질주, 2,500선을 허문 유동성의 쓰나미와 메가트렌드의 새벽",
  "columnContentMarkdown": "월요일 아침의 종소리가 울림과 동시에 주식시장은 마치 오랫동안 억눌려 있던 댐의 수문이 터진 것처럼 거침없는 질주를 보여주었습니다. 코스피는 기어코 심리적 마지노선이자 강력한 매물 장벽이었던 2,500포인트를 돌파하며 2,501.20선에 안착했고, 코스닥 역시 강렬한 장대양봉을 연속적으로 연출하며 +2.15% 급상승한 852.14선으로 도약했습니다. 시장 전면에 서서 지수를 이끈 것은 다른 그 무엇도 아닌, 당일 하루 동안 코스피와 코스닥 양 시장에 몰려와 주도주들을 무차별 쓸어 담은 1.2조 원 규모의 기관과 외국인의 거대하고 무자비한 자금의 사자후였습니다.\\n\\n이날 보여준 코스피 2,500선 돌파의 진정한 가치는 단순히 단기 반등에 그치지 않습니다. 긴 수축 국면을 거쳤던 글로벌 경제 성장 모멘텀이, 매크로 금리와 달러 환율의 하향 안정화라는 견고한 우호 지표들을 만나 우리 시장에서 마침내 대세 상승 레일을 개막했음을 온몸으로 증명한 일대 사건입니다. 미국의 10년물 국채 금리가 안정적 횡보 추세를 구축하고 원/달러 환율이 1,370원대에 완전히 안착하자, 전 세계 자본 흐름의 꼭대기에서 이를 주시하던 스마트 머니들이 대한민국 테크 생태계의 왕좌를 노리고 본격적으로 사냥을 시작한 셈입니다.\\n\\n그리고 그 유입된 스마트 머니는 다시 한번 시장을 관통하는 단 두 개의 메가트렌드, 즉 '인공지능(AI) 반도체 장비 소부장'과 '바이오 테크 혁신 플랫폼'에 완벽하게 집결(Docking)했습니다. 한미반도체(042700)는 글로벌 HBM 패키징 고도화 공정에서 타사가 넘볼 수 없는 듀얼 TC 본더의 압도적 시장 지배력을 발판 삼아 역대급 수주 기대감을 반영하며 고가 놀이 지지를 굳건히 다졌고, 알테오젠(196170)과 유한양행(000100) 등 글로벌 파트너쉽을 필두로 실체 있는 로열티 가치를 증명하는 바이오 대표군들은 단기 매물을 완벽히 흡수하며 지수 전면에 든든한 등대를 비추었습니다. 자본은 결코 영민함을 잃지 않으며, 시대적 혁신의 변곡점에 놓인 독점 자산에 비정상적일 정도로 맹목적인 자금을 투입한다는 불변의 진리를 다시금 자각하게 한 하루였습니다.\\n\\n우리가 이 위대한 유동성의 쓰나미 앞에서 지켜내야 할 것은 단 하나, 바로 '자본의 호흡에 완벽하게 동화하는 유연성'입니다. 시장의 사소한 지엽적 잡음과 변동성에 미혹되어 뇌동매매를 저지르거나 추세를 거스르는 인버스의 늪에 빠지는 우를 범하지 말아야 합니다. 오늘 장마감 후 마주하는 위대한 수급의 정거장은 우리에게 명징하게 외치고 있습니다. 대세 상승의 서막은 이미 울렸으며, 오직 가치 성장의 증명이 완료된 대장 섹터에만 집요하게 둥지를 틀어야 비로소 이 위대한 부의 쏠림 국면에서 흔들리지 않는 최후의 수혜를 쟁취할 수 있을 것임을 칼럼으로 갈무리합니다.",
  "tags": ["메가트렌드", "월요일시황", "자본순환", "2500돌파성공"]
}
`;

  const text = await generateWithRetry(prompt, 0.2);
  return JSON.parse(text.trim());
}

// =========================================================================
// Main Runner Flow
// =========================================================================

async function run() {
  console.log('[Monday Injector] Starting real-time crawler to fetch exact 15 Monday stocks...');
  
  try {
    const crawledStocks = await generateJodojuList();
    if (crawledStocks.length === 0) {
      console.error('[Monday Injector] Crawler failed to extract stocks. Exiting.');
      process.exit(1);
    }
    
    console.log(`[Monday Injector] Crawled leading stocks of today:`);
    crawledStocks.forEach(s => {
      console.log(` - Rank ${s.rank}: ${s.name} (${s.ticker}) | Close: ${s.closePrice} | Change: ${s.changeRate}% | Value: ${s.tradeValuePct}B`);
    });
    
    // Generate AI briefings and reports
    const morningData = await generateMorningBriefing();
    const lunchData = await generateLunchBriefing();
    const afternoonData = await generateAfterMarketReport(crawledStocks);
    const eveningData = await generateEveningColumn();
    
    // Sync metadata
    morningData.date = DATE_STR;
    morningData.id = `briefing_${DATE_STR}`;
    morningData.published = true;
    
    lunchData.date = DATE_STR;
    
    afternoonData.date = DATE_STR;
    afternoonData.id = `report_${DATE_STR}`;
    afternoonData.published = true;
    if (afternoonData.jodoju15) {
      afternoonData.jodoju15.forEach((item: any, idx: number) => {
        item.rank = idx + 1;
      });
    }
    
    eveningData.date = DATE_STR;
    
    // Save locally
    fs.writeFileSync(path.join(DATA_DIR, 'pre_market_briefing.json'), JSON.stringify(morningData, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'lunch_briefing.json'), JSON.stringify(lunchData, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'after_market_report.json'), JSON.stringify(afternoonData, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'evening_column.json'), JSON.stringify(eveningData, null, 2), 'utf-8');
    console.log('[Monday Injector] Saved all 4 files locally under data/platform/ for static fallbacks.');
    
    // Save to Supabase kstock_platform_data
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      console.log('[Monday Injector] Connecting to Supabase...');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      const syncTasks = [
        { key: 'morning_briefing', data: morningData },
        { key: 'lunch_briefing', data: lunchData },
        { key: 'afternoon_report', data: afternoonData },
        { key: 'evening_column', data: eveningData }
      ];
      
      for (const task of syncTasks) {
        // Main key upsert
        const { error } = await supabase
          .from('kstock_platform_data')
          .upsert({
            key: task.key,
            data: task.data,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
          
        if (error) {
          console.error(`[Monday Injector] Supabase main sync failed for '${task.key}':`, error.message);
        } else {
          console.log(`[Monday Injector] Injected main key '${task.key}' into Supabase!`);
        }
        
        // Backup key upsert for date records
        const backupKey = `${task.key}_${DATE_STR}`;
        const { error: backupError } = await supabase
          .from('kstock_platform_data')
          .upsert({
            key: backupKey,
            data: task.data,
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
          
        if (backupError) {
          console.error(`[Monday Injector] Supabase backup sync failed for '${backupKey}':`, backupError.message);
        } else {
          console.log(`[Monday Injector] Injected backup key '${backupKey}' into Supabase!`);
        }
      }
    } else {
      console.warn('[Monday Injector] Supabase credentials not found. Skipping DB sync.');
    }
    
    console.log('[Monday Injector] Monday July 13th, 2026 data generation and injection pipeline completed perfectly!');
  } catch (err: any) {
    console.error('[Monday Injector] Fatal injection exception:', err.message || err);
    process.exit(1);
  }
}

run();
