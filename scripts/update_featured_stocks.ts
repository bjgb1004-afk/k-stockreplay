import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY || !GEMINI_API_KEY) {
  console.error("Missing environment variables.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

async function runFeaturedStocks() {
  const today = new Date();
  const kstTime = new Date(today.getTime() + (9 * 60 * 60 * 1000));
  const dateStr = kstTime.toISOString().split('T')[0];
  
  console.log(`[${dateStr}] 당일 특징주 파이프라인 시작...`);

  const prompt = `당신은 주식 시장 데이터 분석가입니다. 오늘 날짜(${dateStr}) 한국 증시(코스피/코스닥)의 주요 '특징주'를 다음 카테고리별로 팩트체크하여 실감나는 데이터를 생성하십시오.
최신 시장 흐름을 반영하여 종목명과 간략한 특징(팩트체크)을 작성해야 합니다.

[요구 카테고리]
- high_52w: 52주 신고가 종목
- upper_limit: 당일 상한가 종목
- lower_limit: 당일 하한가 종목
- supply_contracts: 공급/계약 (수주, 턴키, 독점 공급 등)
- mna_stakes: M&A/지분 (인수합병, 지분 인수, 경영권 분쟁 등)
- tech_cert: 기술/인증 (세계 최초, FDA 승인, 임상 3상 등)
- policy_gov: 정책/정부 (수혜, 국책과제, 법안 통과 등)
- earnings: 실적발표 (어닝 서프라이즈, 흑자전환 등)
- capital: 자본 (무상증자, 자사주 매입/소각 등)

결과는 반드시 JSON 포맷으로 응답해야 하며, 아래 스키마를 엄격히 준수하세요:
{
  "date": "${dateStr}",
  "high_52w": [{ "name": "종목명", "note": "사유" }],
  "upper_limit": [{ "name": "종목명", "note": "사유" }],
  "lower_limit": [{ "name": "종목명", "note": "사유" }],
  "supply_contracts": [{ "name": "종목명", "note": "사유" }],
  "mna_stakes": [{ "name": "종목명", "note": "사유" }],
  "tech_cert": [{ "name": "종목명", "note": "사유" }],
  "policy_gov": [{ "name": "종목명", "note": "사유" }],
  "earnings": [{ "name": "종목명", "note": "사유" }],
  "capital": [{ "name": "종목명", "note": "사유" }]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text;
    if (!text) throw new Error("Empty response");

    const featuredData = JSON.parse(text);

    const { data, error } = await supabase
      .from('featured_stocks_daily')
      .upsert({
        date: dateStr,
        data: featuredData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'date'
      });

    if (error) {
      console.error("Supabase 저장 실패:", error.message);
    } else {
      console.log(`[${dateStr}] 당일 특징주 Supabase 적재 완료.`);
    }
  } catch(e) {
    console.error("AI 생성 또는 데이터베이스 처리 실패:", e);
  }
}

runFeaturedStocks();
