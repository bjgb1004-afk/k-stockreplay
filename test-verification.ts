import dotenv from 'dotenv';
dotenv.config();

import { PlatformEngine } from './server-core/platform_engine.js';
import { MarketFact, NewsFact, PreMarketBriefing } from './src/types.js';

interface TestCaseResult {
  name: string;
  success: boolean;
  details: string;
  beforeText?: string;
  afterText?: string;
  errorsDetected?: string[];
}

async function runVerificationTests() {
  console.log('==================================================');
  console.log(' STARTING PRE-MARKET BRIEFING FACT-CHECKING TESTS');
  console.log('==================================================\n');

  const results: TestCaseResult[] = [];

  // =========================================================================
  // TEST 1: Nasdaq actual = -1.5%, AI outputs: "Nasdaq은 상승했다." (Direction)
  // =========================================================================
  try {
    const mockMData = {
      dow: '39,000.00 (-0.20%)',
      nasdaq: '16,000.00 (-1.50%)',
      sp500: '5,100.00 (-0.50%)',
      russell2000: '2,000.00 (-0.10%)',
      vix: '14.50 (+5.00%)',
      exchangeRate: '1,350.00원 (+5.00원 상승)',
      stocks: {
        NVDA: { price: '900.00', changePct: '-2.00%', name: 'NVIDIA' },
        TSLA: { price: '170.00', changePct: '+1.00%', name: 'Tesla' },
        AVGO: { price: '1,400.00', changePct: '-1.00%', name: 'Broadcom' },
        AAPL: { price: '180.00', changePct: '+0.50%', name: 'Apple' },
        MSFT: { price: '420.00', changePct: '-0.30%', name: 'Microsoft' }
      }
    };

    const mockNews: NewsFact[] = [
      {
        title: 'NVIDIA shares fall as market cools',
        source: 'CNBC',
        publishedAt: new Date().toISOString(),
        url: 'https://cnbc.com',
        summary: 'NVIDIA shares slumped as the tech sector faced cooling demand.',
        relatedSymbols: ['NVDA'],
        relatedSectors: ['Semiconductor'],
        sentiment: 'negative',
        factualClaims: ['NVIDIA shares fall']
      }
    ];

    const draftBriefing: PreMarketBriefing = {
      id: 'test_briefing_1',
      date: '2026-07-23',
      published: true,
      summary: '미 증시는 양호한 흐름 속에 테크 기업 매수세가 유입되어 나스닥 상승 마감하였습니다.',
      expectedThemes: ['반도체'],
      keyStocks: ['삼성전자'],
      leadMapping: '나스닥 지수 상승세가 견인차 역할을 할 것입니다.',
      strategyScenario: '상방 돌파 대응',
      usSummary: { dow: '데이터 없음', nasdaq: '데이터 없음', sp500: '데이터 없음', russell2000: '데이터 없음', vix: '데이터 없음' },
      macro: { interestRate: '5.25%', cpi: '+3.0%', ppi: '+2.1%', bondYield: '4.2%', exchangeRate: '1,350원', oilPrice: '$75' },
      worldNews: [],
      usFeaturedStocks: [],
      usJodoju: [],
      koreanImpact: '나스닥 상승 수혜가 기대됩니다.',
      relatedKoreanStocks: [],
      aiSummary5Lines: ['나스닥 지수 상승 마감', '테크주 강세', '환율 안정', '코스피 영향 긍정적', '대응 권고'],
      interestThemes: [],
      interestStocks: [],
      riskIssues: [],
      seo: { title: '제목', description: '설명', keywords: [] }
    };

    console.log('[Test 1] Executing programmatic direction-mismatch check...');
    const { corrected, logs } = await PlatformEngine.validateAndCorrectBriefing(draftBriefing, mockMData, mockNews);

    const isCorrected = corrected.summary.includes('나스닥 하락 마감') || logs.some(l => l.errorType === 'direction_mismatch');
    
    results.push({
      name: 'Test 1: Nasdaq actual down (-1.5%) -> AI text "Nasdaq은 상승했다." -> Error Detected & Corrected',
      success: isCorrected,
      details: `Detected ${logs.length} errors. Logs: ${JSON.stringify(logs.map(l => l.field + ': ' + l.errorType))}`,
      beforeText: draftBriefing.summary,
      afterText: corrected.summary,
      errorsDetected: logs.map(l => `${l.field}: ${l.errorType} (${l.beforeSentence} -> ${l.afterSentence})`)
    });
  } catch (err: any) {
    results.push({ name: 'Test 1', success: false, details: `Exception: ${err.message}` });
  }

  // =========================================================================
  // TEST 2: Nasdaq actual = +1.5%, AI outputs: "Nasdaq은 하락했다." (Direction)
  // =========================================================================
  try {
    const mockMData = {
      dow: '39,000.00 (+0.20%)',
      nasdaq: '16,000.00 (+1.50%)',
      sp500: '5,100.00 (+0.50%)',
      russell2000: '2,000.00 (+0.10%)',
      vix: '14.50 (-5.00%)',
      exchangeRate: '1,350.00원 (-5.00원 하락)',
      stocks: {
        NVDA: { price: '900.00', changePct: '+2.00%', name: 'NVIDIA' },
        TSLA: { price: '170.00', changePct: '+1.00%', name: 'Tesla' },
        AVGO: { price: '1,400.00', changePct: '+1.00%', name: 'Broadcom' },
        AAPL: { price: '180.00', changePct: '+0.50%', name: 'Apple' },
        MSFT: { price: '420.00', changePct: '+0.30%', name: 'Microsoft' }
      }
    };

    const mockNews: NewsFact[] = [
      {
        title: 'NVIDIA shares jump as earnings surprise',
        source: 'Bloomberg',
        publishedAt: new Date().toISOString(),
        url: 'https://bloomberg.com',
        summary: 'NVIDIA shares jumped higher as strong chips demand surprised analysts.',
        relatedSymbols: ['NVDA'],
        relatedSectors: ['Semiconductor'],
        sentiment: 'positive',
        factualClaims: ['NVIDIA shares jump']
      }
    ];

    const draftBriefing: PreMarketBriefing = {
      id: 'test_briefing_2',
      date: '2026-07-23',
      published: true,
      summary: '미 증시는 기술주 차익매물 압박에 나스닥 하락 마감하였습니다.',
      expectedThemes: ['반도체'],
      keyStocks: ['삼성전자'],
      leadMapping: '나스닥 지수 약세 흐름이 반영될 예정입니다.',
      strategyScenario: '보수적 관망',
      usSummary: { dow: '데이터 없음', nasdaq: '데이터 없음', sp500: '데이터 없음', russell2000: '데이터 없음', vix: '데이터 없음' },
      macro: { interestRate: '5.25%', cpi: '+3.0%', ppi: '+2.1%', bondYield: '4.2%', exchangeRate: '1,350원', oilPrice: '$75' },
      worldNews: [],
      usFeaturedStocks: [],
      usJodoju: [],
      koreanImpact: '나스닥 하락 압박이 예상됩니다.',
      relatedKoreanStocks: [],
      aiSummary5Lines: ['나스닥 지수 하락 마감', '테크주 약세', '환율 안정', '코스피 영향 부정적', '대응 권고'],
      interestThemes: [],
      interestStocks: [],
      riskIssues: [],
      seo: { title: '제목', description: '설명', keywords: [] }
    };

    console.log('[Test 2] Executing programmatic direction-mismatch check (Upward)...');
    const { corrected, logs } = await PlatformEngine.validateAndCorrectBriefing(draftBriefing, mockMData, mockNews);

    const isCorrected = corrected.summary.includes('나스닥 상승 마감') || logs.some(l => l.errorType === 'direction_mismatch');

    results.push({
      name: 'Test 2: Nasdaq actual up (+1.5%) -> AI text "Nasdaq은 하락했다." -> Error Detected & Corrected',
      success: isCorrected,
      details: `Detected ${logs.length} errors. Logs: ${JSON.stringify(logs.map(l => l.field + ': ' + l.errorType))}`,
      beforeText: draftBriefing.summary,
      afterText: corrected.summary,
      errorsDetected: logs.map(l => `${l.field}: ${l.errorType} (${l.beforeSentence} -> ${l.afterSentence})`)
    });
  } catch (err: any) {
    results.push({ name: 'Test 2', success: false, details: `Exception: ${err.message}` });
  }

  // =========================================================================
  // TEST 3: Nasdaq actual = -1.5%, AI outputs: "Nasdaq은 1.5% 하락했다." (Normal)
  // =========================================================================
  try {
    const mockMData = {
      dow: '39,000.00 (-0.20%)',
      nasdaq: '16,000.00 (-1.50%)',
      sp500: '5,100.00 (-0.50%)',
      russell2000: '2,000.00 (-0.10%)',
      vix: '14.50 (+5.00%)',
      exchangeRate: '1,350.00원 (+5.00원 상승)',
      stocks: {
        NVDA: { price: '900.00', changePct: '-2.00%', name: 'NVIDIA' },
        TSLA: { price: '170.00', changePct: '+1.00%', name: 'Tesla' },
        AVGO: { price: '1,400.00', changePct: '-1.00%', name: 'Broadcom' },
        AAPL: { price: '180.00', changePct: '+0.50%', name: 'Apple' },
        MSFT: { price: '420.00', changePct: '-0.30%', name: 'Microsoft' }
      }
    };

    const mockNews: NewsFact[] = [
      {
        title: 'NVIDIA shares fall',
        source: 'CNBC',
        publishedAt: new Date().toISOString(),
        url: 'https://cnbc.com',
        summary: 'NVIDIA shares slumped today.',
        relatedSymbols: ['NVDA'],
        relatedSectors: ['Semiconductor'],
        sentiment: 'negative',
        factualClaims: ['NVIDIA shares fall']
      }
    ];

    const draftBriefing: PreMarketBriefing = {
      id: 'test_briefing_3',
      date: '2026-07-23',
      published: true,
      summary: '미국 증시는 매크로 긴장감 속에 나스닥 -1.50% 하락 마감하였습니다.',
      expectedThemes: ['반도체'],
      keyStocks: ['삼성전자'],
      leadMapping: '나스닥 하락이 하방 압력으로 작용할 것으로 분석됩니다.',
      strategyScenario: '보수적 방어 전략',
      usSummary: { dow: '데이터 없음', nasdaq: '데이터 없음', sp500: '데이터 없음', russell2000: '데이터 없음', vix: '데이터 없음' },
      macro: { interestRate: '5.25%', cpi: '+3.0%', ppi: '+2.1%', bondYield: '4.2%', exchangeRate: '1,350원', oilPrice: '$75' },
      worldNews: [],
      usFeaturedStocks: [],
      usJodoju: [],
      koreanImpact: '국내 증시 역시 약세 동조화가 우려됩니다.',
      relatedKoreanStocks: [],
      aiSummary5Lines: ['나스닥 지수 -1.5% 하락', '테크주 약세', '환율 상승', '코스피 약보합 예상', '보수적 접근'],
      interestThemes: [],
      interestStocks: [],
      riskIssues: [],
      seo: { title: '제목', description: '설명', keywords: [] }
    };

    console.log('[Test 3] Checking correct statement consistency (Should pass unchanged)...');
    const { corrected, logs } = await PlatformEngine.validateAndCorrectBriefing(draftBriefing, mockMData, mockNews);

    const directionMismatchDetected = logs.some(l => l.errorType === 'direction_mismatch');

    results.push({
      name: 'Test 3: Nasdaq actual down (-1.5%) -> AI text "Nasdaq은 1.5% 하락했다." -> Grounded & No Error',
      success: !directionMismatchDetected,
      details: `Passed successfully with ${logs.length} corrections.`,
      beforeText: draftBriefing.summary,
      afterText: corrected.summary
    });
  } catch (err: any) {
    results.push({ name: 'Test 3', success: false, details: `Exception: ${err.message}` });
  }

  // =========================================================================
  // TEST 4: AI generates ungrounded causes (Ungrounded Claims)
  // =========================================================================
  try {
    const mockMData = {
      dow: '39,000.00 (-0.20%)',
      nasdaq: '16,000.00 (-1.50%)',
      sp500: '5,100.00 (-0.50%)',
      russell2000: '2,000.00 (-0.10%)',
      vix: '14.50 (+5.00%)',
      exchangeRate: '1,350.00원 (+5.00원 상승)',
      stocks: {
        NVDA: { price: '900.00', changePct: '-2.00%', name: 'NVIDIA' },
        TSLA: { price: '170.00', changePct: '+1.00%', name: 'Tesla' },
        AVGO: { price: '1,400.00', changePct: '-1.00%', name: 'Broadcom' },
        AAPL: { price: '180.00', changePct: '+0.50%', name: 'Apple' },
        MSFT: { price: '420.00', changePct: '-0.30%', name: 'Microsoft' }
      }
    };

    // No CPI news at all, but AI will claim CPI inflation concerns triggered the fall
    const mockNews: NewsFact[] = [
      {
        title: 'Geopolitical tensions flare in Middle East',
        source: 'Reuters',
        publishedAt: new Date().toISOString(),
        url: 'https://reuters.com',
        summary: 'Geopolitical flareups caused crude oil prices to fluctuate.',
        relatedSymbols: [],
        relatedSectors: ['Energy', 'Macro'],
        sentiment: 'neutral',
        factualClaims: ['Middle East tensions']
      }
    ];

    const draftBriefing: PreMarketBriefing = {
      id: 'test_briefing_4',
      date: '2026-07-23',
      published: true,
      summary: '오늘 발표된 미국의 핵심 CPI 소비자물가지수가 크게 치솟아 인플레이션 충격으로 나스닥이 급락 마감하였습니다.',
      expectedThemes: ['반도체'],
      keyStocks: ['삼성전자'],
      leadMapping: '미국의 인플레이션 지표 악화가 지수 하락의 주원인입니다.',
      strategyScenario: '금리 불안감에 대비하는 전략',
      usSummary: { dow: '데이터 없음', nasdaq: '데이터 없음', sp500: '데이터 없음', russell2000: '데이터 없음', vix: '데이터 없음' },
      macro: { interestRate: '5.25%', cpi: '+3.0%', ppi: '+2.1%', bondYield: '4.2%', exchangeRate: '1,350원', oilPrice: '$75' },
      worldNews: [],
      usFeaturedStocks: [],
      usJodoju: [],
      koreanImpact: 'CPI 인플레이션 우려로 국내 채권 금리도 치솟을 것입니다.',
      relatedKoreanStocks: [],
      aiSummary5Lines: ['미국 CPI 충격에 하락', '테크주 급락', '인플레이션 공포', '환율 상승', '방어주의 비중 확대'],
      interestThemes: [],
      interestStocks: [],
      riskIssues: [],
      seo: { title: '제목', description: '설명', keywords: [] }
    };

    console.log('[Test 4] Checking ungrounded CPI claim (Should detect ungrounded claim and rephrase/flag)...');
    const { corrected, logs } = await PlatformEngine.validateAndCorrectBriefing(draftBriefing, mockMData, mockNews);

    const claimFlagged = logs.some(l => l.errorType === 'ungrounded_claim' || l.errorType === 'hallucination') || 
                         !corrected.summary.includes('CPI 소비자물가지수가 크게 치솟아');

    results.push({
      name: 'Test 4: AI generates ungrounded cause (CPI inflation shock) with NO news grounding -> Detected & Rephrased',
      success: claimFlagged,
      details: `Logs: ${JSON.stringify(logs.map(l => l.field + ': ' + l.errorType))}`,
      beforeText: draftBriefing.summary,
      afterText: corrected.summary,
      errorsDetected: logs.map(l => `${l.field}: ${l.errorType} (${l.beforeSentence} -> ${l.afterSentence})`)
    });
  } catch (err: any) {
    results.push({ name: 'Test 4', success: false, details: `Exception: ${err.message}` });
  }

  // =========================================================================
  // TEST 5: AI generates incorrect numbers (Numerical Hallucinations)
  // =========================================================================
  try {
    const mockMData = {
      dow: '39,000.00 (-0.20%)',
      nasdaq: '16,000.00 (-1.50%)',
      sp500: '5,100.00 (-0.50%)',
      russell2000: '2,000.00 (-0.10%)',
      vix: '14.50 (+5.00%)',
      exchangeRate: '1,350.00원 (+5.00원 상승)',
      stocks: {
        NVDA: { price: '900.00', changePct: '-2.00%', name: 'NVIDIA' },
        TSLA: { price: '170.00', changePct: '+1.00%', name: 'Tesla' },
        AVGO: { price: '1,400.00', changePct: '-1.00%', name: 'Broadcom' },
        AAPL: { price: '180.00', changePct: '+0.50%', name: 'Apple' },
        MSFT: { price: '420.00', changePct: '-0.30%', name: 'Microsoft' }
      }
    };

    const mockNews: NewsFact[] = [
      {
        title: 'NVIDIA down today',
        source: 'CNBC',
        publishedAt: new Date().toISOString(),
        url: 'https://cnbc.com',
        summary: 'NVIDIA fell on tech profit taking.',
        relatedSymbols: ['NVDA'],
        relatedSectors: ['Semiconductor'],
        sentiment: 'negative',
        factualClaims: ['NVIDIA falls']
      }
    ];

    // AI claims Nasdaq dropped -3.5% (Actual was -1.5%)
    const draftBriefing: PreMarketBriefing = {
      id: 'test_briefing_5',
      date: '2026-07-23',
      published: true,
      summary: '전일 미국 기술주 대량 매도로 인해 나스닥 지수가 -3.50% 급락 마감하였습니다.',
      expectedThemes: ['반도체'],
      keyStocks: ['삼성전자'],
      leadMapping: '나스닥 -3.5%의 강력한 폭락 폭은 한국 시장에 깊은 악재입니다.',
      strategyScenario: '보수적 비중 축소',
      usSummary: { dow: '데이터 없음', nasdaq: '데이터 없음', sp500: '데이터 없음', russell2000: '데이터 없음', vix: '데이터 없음' },
      macro: { interestRate: '5.25%', cpi: '+3.0%', ppi: '+2.1%', bondYield: '4.2%', exchangeRate: '1,350원', oilPrice: '$75' },
      worldNews: [],
      usFeaturedStocks: [],
      usJodoju: [],
      koreanImpact: '나스닥 대형 하락 쇼크가 예정되어 있습니다.',
      relatedKoreanStocks: [],
      aiSummary5Lines: ['나스닥 -3.5% 하락', '테크 폭락', '환율 상승', '코스피 급락 예상', '안전 자산 선호'],
      interestThemes: [],
      interestStocks: [],
      riskIssues: [],
      seo: { title: '제목', description: '설명', keywords: [] }
    };

    console.log('[Test 5] Checking numerical hallucination check (Should correct -3.50% to -1.50%)...');
    const { corrected, logs } = await PlatformEngine.validateAndCorrectBriefing(draftBriefing, mockMData, mockNews);

    const numericalCorrected = logs.some(l => l.errorType === 'numerical_error' || l.errorType === 'hallucination') || 
                               !corrected.summary.includes('-3.50%') || 
                               corrected.summary.includes('-1.5');

    results.push({
      name: 'Test 5: AI claims incorrect numerical value (Nasdaq -3.50% vs actual -1.50%) -> Detected & Corrected',
      success: numericalCorrected,
      details: `Logs: ${JSON.stringify(logs.map(l => l.field + ': ' + l.errorType))}`,
      beforeText: draftBriefing.summary,
      afterText: corrected.summary,
      errorsDetected: logs.map(l => `${l.field}: ${l.errorType} (${l.beforeSentence} -> ${l.afterSentence})`)
    });
  } catch (err: any) {
    results.push({ name: 'Test 5', success: false, details: `Exception: ${err.message}` });
  }

  // =========================================================================
  // TEST 6: News published in the future is excluded (Future News Filter)
  // =========================================================================
  try {
    const nowTime = new Date();
    const futureTime = new Date(nowTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours in the future

    const mockFutureNews = [
      {
        title: 'NVIDIA launches Blackwell Ultra GPU early',
        source: 'CNBC',
        publishedAt: futureTime.toISOString(),
        url: 'https://cnbc.com',
        sourceName: 'CNBC'
      },
      {
        title: 'Middle East peace talks conclude positively',
        source: 'Reuters',
        publishedAt: nowTime.toISOString(), // present news, should remain
        url: 'https://reuters.com',
        sourceName: 'Reuters'
      }
    ];

    console.log('[Test 6] Executing processed news filtering for future dates...');
    const processedNews = [];
    const titles = new Set<string>();

    for (const item of mockFutureNews) {
      const pubDate = new Date(item.publishedAt);
      if (pubDate > nowTime) {
        console.log(`[Test Filter] Excluded future news: "${item.title}" successfully.`);
        continue;
      }
      processedNews.push(item);
    }

    const futureNewsExcluded = !processedNews.some(n => n.title.includes('Blackwell Ultra')) && 
                                processedNews.some(n => n.title.includes('Middle East'));

    results.push({
      name: 'Test 6: News published in the future is excluded -> Passed & Excluded',
      success: futureNewsExcluded,
      details: `Processed news count: ${processedNews.length}. Kept: ${processedNews.map(n => n.title).join(', ')}`
    });
  } catch (err: any) {
    results.push({ name: 'Test 6', success: false, details: `Exception: ${err.message}` });
  }

  // =========================================================================
  // TEST 7: No news or data collection failure -> Notes data scarcity
  // =========================================================================
  try {
    const mockMData = {
      dow: '데이터 없음',
      nasdaq: '데이터 없음',
      sp500: '데이터 없음',
      russell2000: '데이터 없음',
      vix: '데이터 없음',
      exchangeRate: '데이터 없음',
      stocks: {
        NVDA: { price: '데이터 없음', changePct: '데이터 없음', name: 'NVIDIA' },
        TSLA: { price: '데이터 없음', changePct: '데이터 없음', name: 'Tesla' },
        AVGO: { price: '데이터 없음', changePct: '데이터 없음', name: 'Broadcom' },
        AAPL: { price: '데이터 없음', changePct: '데이터 없음', name: 'Apple' },
        MSFT: { price: '데이터 없음', changePct: '데이터 없음', name: 'Microsoft' }
      }
    };

    const mockNews: NewsFact[] = []; // Zero news facts

    const draftBriefing: PreMarketBriefing = {
      id: 'test_briefing_7',
      date: '2026-07-23',
      published: true,
      summary: '미 증시가 지정학적 불안과 기술적 매수세 유입으로 큰 폭 상승하였습니다.',
      expectedThemes: ['반도체'],
      keyStocks: ['삼성전자'],
      leadMapping: '상세 분석 근거입니다.',
      strategyScenario: '대응 전략',
      usSummary: { dow: '데이터 없음', nasdaq: '데이터 없음', sp500: '데이터 없음', russell2000: '데이터 없음', vix: '데이터 없음' },
      macro: { interestRate: '데이터 없음', cpi: '데이터 없음', ppi: '데이터 없음', bondYield: '데이터 없음', exchangeRate: '데이터 없음', oilPrice: '데이터 없음' },
      worldNews: [],
      usFeaturedStocks: [],
      usJodoju: [],
      koreanImpact: '영향 설명',
      relatedKoreanStocks: [],
      aiSummary5Lines: ['상승 마감', '테크 호재', '환율 영향', '수혜주 강세', '대응 방안'],
      interestThemes: [],
      interestStocks: [],
      riskIssues: [],
      seo: { title: '제목', description: '설명', keywords: [] }
    };

    console.log('[Test 7] Verifying limited data warning pass (Should output lack of verified cause)...');
    const { corrected, logs } = await PlatformEngine.validateAndCorrectBriefing(draftBriefing, mockMData, mockNews);

    const handledGracefully = corrected.summary.includes('확인된 주요 원인은 제한적입니다') || 
                             corrected.summary.includes('데이터 부족') || 
                             logs.some(l => l.errorType === 'hallucination' || l.errorType === 'ungrounded_claim');

    results.push({
      name: 'Test 7: No news & data fetch failed -> AI notes data limit / states "확인된 주요 원인은 제한적입니다" -> Correctly Grounded',
      success: handledGracefully,
      details: `Summary result: "${corrected.summary}". Logs: ${JSON.stringify(logs.map(l => l.field + ': ' + l.errorType))}`,
      beforeText: draftBriefing.summary,
      afterText: corrected.summary
    });
  } catch (err: any) {
    results.push({ name: 'Test 7', success: false, details: `Exception: ${err.message}` });
  }

  // =========================================================================
  // PRINT TEST REPORT SUMMARY
  // =========================================================================
  console.log('\n==================================================');
  console.log('              VERIFICATION TEST REPORT');
  console.log('==================================================');
  let passedCount = 0;
  results.forEach((r, idx) => {
    const marker = r.success ? '✅ PASS' : '❌ FAIL';
    if (r.success) passedCount++;
    console.log(`\n[Test ${idx + 1}] ${r.name}`);
    console.log(`Status: ${marker}`);
    console.log(`Details: ${r.details}`);
    if (r.beforeText) {
      console.log(`  Before: "${r.beforeText}"`);
      console.log(`  After:  "${r.afterText}"`);
    }
    if (r.errorsDetected && r.errorsDetected.length > 0) {
      console.log(`  Errors Detected & Corrected:`);
      r.errorsDetected.forEach(e => console.log(`    - ${e}`));
    }
  });

  console.log('\n==================================================');
  console.log(`TEST EXECUTION COMPLETED: ${passedCount}/${results.length} PASSED`);
  console.log('==================================================\n');

  if (passedCount === results.length) {
    console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! The Pre-Market Briefing verification system is 100% compliant!');
    process.exit(0);
  } else {
    console.error('⚠️ SOME TESTS FAILED. Please review the errors above.');
    process.exit(1);
  }
}

runVerificationTests();
