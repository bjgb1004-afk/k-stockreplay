import { GoogleGenAI } from '@google/genai';
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
async function run() {
  const prompt = "2024년 7월 16일 한국 주식시장(코스피/코스닥)의 당일 상한가 및 특징주 10개와 상승 이유를 JSON 배열 포맷([{name: '...', note: '...'}])으로 알려줘. 정확한 팩트 체크를 바탕으로 과거 데이터를 제공해줘.";
  try {
    const res = await ai.models.generateContent({ model: 'gemini-3.5-flash', contents: prompt });
    console.log(res.text);
  } catch (e) {
    console.log(e);
  }
}
run();
