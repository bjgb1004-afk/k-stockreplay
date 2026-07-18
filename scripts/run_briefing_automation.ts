import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import fetch from 'node-fetch'; // 런타임 환경에 따라 전역 fetch를 사용할 수 있습니다.

// 1. 환경 변수 검증 및 클라이언트 초기화
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error("환경 변수가 누락되었습니다. SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY를 확인하세요.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// 2. 외부 데이터 수집 (웹 스크래핑, Open API 호출 모방)
async function fetchMarketData() {
  console.log("[1/3] 실시간 장마감 데이터 수집 중...");
  
  // 실제 환경에서는 Yahoo Finance(yahoo-finance2), 한국투자증권 Open API, 또는 네이버 금융 크롤링 등을 수행합니다.
  // 이 예제에서는 구조를 시뮬레이션하기 위한 데이터를 구성합니다.
  
  const today = new Date();
  // KST(한국 시간) 기준 날짜 구하기
  const kstTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const dateStr = kstTime.toISOString().split('T')[0];

  // 수집 및 분석 대상 데이터 카테고리에 맞는 원천 데이터 (모의/크롤링 결과)
  const rawData = {
    date: dateStr,
    indices: {
      kospi: { close: 2785.4, changeRate: 1.25, note: "연중 최고점 경신 임박" },
      kosdaq: { close: 885.2, changeRate: 0.85, note: "안정적 지지선 확보" }
    },
    supply_demand: {
      foreigner: "순매수 4,500억",
      institution: "순매도 1,200억",
      retail: "순매도 3,300억",
      program: "비차익 중심 2,500억 순매수 유입"
    },
    macro: {
      exchange_rate: 1385.5,
      us_10y_treasury: 4.25,
      dollar_index: 105.2,
      wti: 81.5,
      gold: 2350.2,
      copper: 4.15,
      nasdaq_prev: 17100.5, // 전일 나스닥
      sox_prev: 5200.3      // 전일 필라델피아 반도체
    },
    sectors_and_stocks: {
      strong_sectors: ["HBM 및 온디바이스 AI", "K-뷰티/화장품", "ESS 및 전력설비"],
      weak_sectors: ["2차전지 일부 셀 메이커", "인터넷/게임 플랫폼"],
      highlights: [
        { name: "삼성전자", note: "외국인 대량 매수세 유입, HBM 퀄테스트 기대감" },
        { name: "삼천당제약", note: "아일리아 바이오시밀러 글로벌 계약 모멘텀 상한가" }
      ]
    },
    major_flow_and_events: {
      basket_trends: "외국인은 반도체 장비 및 화장품 섹터로 바스켓 매수 집중",
      short_covering: "최근 공매도 과열 종목군(바이오 일부) 환매수 유입 특징",
      window_dressing: "분기말 임박에 따른 기관 윈도우 드레싱 유입 조짐"
    },
    outlook_and_risk: {
      upcoming_events: ["미국 6월 CPI 발표 (수요일)", "FOMC 의사록 공개"],
      tech_analysis: "코스피 2,750선 돌파 후 안착 시도, 코스닥은 60일선 강력 지지 중",
      risks: ["유럽 정치적 불확실성에 따른 단기 변동성", "원달러 환율 1,390원 돌파 여부"]
    }
  };

  return rawData;
}

// 3. Gemini LLM을 통한 분석 및 텍스트화
async function analyzeWithGemini(rawData: any) {
  console.log("[2/3] Gemini AI를 통한 데이터 분석 및 브리핑 생성 중...");
  
  const prompt = `
당신은 대한민국 최고의 금융 데이터 엔지니어이자 전문 주식 투자 분석가입니다.
데이터 검증 및 실시간성 규칙에 따라 최신 시점의 데이터를 바탕으로, 객관적이고 전문적인 어조의 장마감 브리핑을 작성해야 합니다.

오늘 날짜(${rawData.date})를 기준으로 수집된 아래의 원천 데이터를 바탕으로 완벽한 분석을 진행하세요.

[원천 데이터]
${JSON.stringify(rawData, null, 2)}

[작성 요구사항]
아래 5가지 카테고리로 나누어 내용을 분석하고 서술하세요:
1. 지수 및 수급 상황 (시장 요약)
2. 매크로 및 외부 변수 (원인 분석)
3. 주도 섹터 및 특징주 (미시 분석)
4. 메이저의 행동 및 수급 특징
5. 다음 영업일 관전 포인트 및 리스크 (전망)

결과는 반드시 JSON 포맷으로 응답해야 하며, 아래의 스키마를 엄격히 준수하세요:
{
  "market_summary": { ...요약 내용을 구조화된 JSON 객체로... },
  "macro_analysis": { ... },
  "sector_analysis": { ... },
  "major_flow": { ... },
  "future_outlook": { ... },
  "ai_full_text": "위 5개 항목을 엮어서 가독성 있게 줄바꿈(\n)을 포함한 전체 텍스트 브리핑 내용"
}
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-pro',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text();
    if (!text) {
      throw new Error("Gemini AI로부터 빈 응답이 반환되었습니다.");
    }

    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini AI 분석 실패:", error);
    throw error;
  }
}

// 4. Supabase 데이터베이스 적재 (Upsert)
async function saveToSupabase(date: string, analysisResult: any) {
  console.log("[3/3] Supabase 데이터베이스에 저장 중...");
  
  const { data, error } = await supabase
    .from('daily_market_briefing')
    .upsert({
      date: date,
      market_summary: analysisResult.market_summary,
      macro_analysis: analysisResult.macro_analysis,
      sector_analysis: analysisResult.sector_analysis,
      major_flow: analysisResult.major_flow,
      future_outlook: analysisResult.future_outlook,
      ai_full_text: analysisResult.ai_full_text
    }, { 
      onConflict: 'date' 
    });

  if (error) {
    console.error("Supabase 저장 중 오류 발생:", error.message);
    throw error;
  }

  console.log(`✅ [${date}] 장마감 브리핑이 성공적으로 데이터베이스에 적재되었습니다.`);
}

// 메인 실행 함수
async function main() {
  try {
    const rawData = await fetchMarketData();
    const analysisResult = await analyzeWithGemini(rawData);
    await saveToSupabase(rawData.date, analysisResult);
  } catch (err) {
    console.error("장마감 자동화 파이프라인 실행 중 치명적 오류:", err);
    process.exit(1);
  }
}

// 스크립트 실행
main();
