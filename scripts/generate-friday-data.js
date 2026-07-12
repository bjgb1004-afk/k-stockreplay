import fs from 'fs';
import path from 'path';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const AI_API_KEY = process.env.GEMINI_API_KEY;
if (!AI_API_KEY) {
  console.error('[Friday Injector] Error: GEMINI_API_KEY is not defined.');
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

const DATA_DIR = path.resolve(process.cwd(), 'data', 'platform');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 1. Core Facts of Friday, July 10, 2026
const DATE_STR = '2026-07-10';
const KOSPI_INDEX = '2,475.94 (+2.52%)';
const KOSDAQ_INDEX = '837.41 (+5.47%)';

const JODOJU_15_INFO = [
  { ticker: '042700', name: '한미반도체', closePrice: 172400, changeRate: 14.55, volume: 3840200, tradeValuePct: 6540, theme: 'AI 반도체 / HBM / TC 본더', reason: '엔비디아 Blackwell 양산 및 공급 확대 기대감에 따른 TC본더 대규모 추가 수주 임박 보도' },
  { ticker: '196170', name: '알테오젠', closePrice: 284500, changeRate: 8.32, volume: 1250400, tradeValuePct: 3520, theme: '바이오 플랫폼 / 키트루다 SC', reason: '머크의 키트루다 SC 제형 임상 3상 성공에 따른 로열티 수익 유입 본격화 및 글로벌 추가 계약 기대감' },
  { ticker: '000100', name: '유한양행', closePrice: 94200, changeRate: 12.14, volume: 4501200, tradeValuePct: 4180, theme: '폐암 신약 / 렉라자 FDA 승인', reason: '국산 항암 최초의 렉라자 미국 FDA 최종 단독 및 병용요법 승인 결정 임박설 및 블록버스터 신약 도약 전망' },
  { ticker: '005930', name: '삼성전자', closePrice: 87500, changeRate: 2.10, volume: 14500000, tradeValuePct: 12300, theme: '반도체 대장주 / HBM3E 테스트', reason: '엔비디아향 HBM3E 12단 퀄 테스트 통과 기대감 및 글로벌 반도체 업황 턴어라운드 수혜 외인 집중 매수' },
  { ticker: '000660', name: 'SK하이닉스', closePrice: 232000, changeRate: -0.43, volume: 3850000, tradeValuePct: 8900, theme: '반도체 대장주 / HBM 대장', reason: '장 초반 강세 출발하였으나 단기 급등에 따른 차익 매물 소화하며 약보합 안착. 여전히 강력한 우상향 기조' },
  { ticker: '086520', name: '펩트론', closePrice: 52400, changeRate: 12.40, volume: 4100000, tradeValuePct: 2150, theme: 'GLP-1 비만치료제 / 스마트디포', reason: '글로벌 빅파마(일라이 릴리 등)와의 약효지속성 플랫폼 기술이전 공동개발 본계약 타결 기대감 최고조' },
  { ticker: '058470', name: '리노공업', closePrice: 245000, changeRate: 4.82, volume: 580000, tradeValuePct: 1420, theme: '반도체 테스트 핀 / AI 칩 수요', reason: 'AI 스마트폰 및 온디바이스 AI 시장 성장에 따른 고부가가치 소켓 및 리노핀 신규 주문 증가' },
  { ticker: '141080', name: '리가켐바이오', closePrice: 105000, changeRate: 7.60, volume: 1720000, tradeValuePct: 1800, theme: '바이오 ADC 플랫폼 / 기술수출', reason: '글로벌 제약사로의 ADC 플랫폼 기술 이전 추가 로열티 유입 소식 및 신약 파이프라인 개발 순항' },
  { ticker: '450080', name: '에코프로머티', closePrice: 112000, changeRate: 9.45, volume: 1880000, tradeValuePct: 2100, theme: '2차전지 전구체 / 공급망', reason: '미국 IRA 보조금 요건에 맞춘 북미향 전구체 공급 계약 추진 소식 및 2차전지 바닥 투심 반등' },
  { ticker: '028300', name: 'HLB', closePrice: 89000, changeRate: 6.12, volume: 3040000, tradeValuePct: 2700, theme: '간암 신약 / 리보세라닙 FDA', reason: '간암 치료제 리보세라닙 미국 FDA 승인 재심사 신청 완료 공식 보도 및 공매도 쇼트커버링 수급 유입' },
  { ticker: '443560', name: 'HD현대일렉트릭', closePrice: 312000, changeRate: 5.40, volume: 530000, tradeValuePct: 1650, theme: '전력 인프라 / 초고압 변압기', reason: '미국 내 AI 데이터센터 폭발에 따른 송배전 인프라 쇼티지 장기화 및 2분기 사상 최대 실적 전망' },
  { ticker: '000250', name: '삼천당제약', closePrice: 158000, changeRate: 8.20, volume: 1230000, tradeValuePct: 1950, theme: '황반변성 치료제 / 아일리아 복제', reason: '유럽 9개국 독점 공급 계약 체결 정식 공시 및 마일스톤 수익 유입 본격화 기대감 부각' },
  { ticker: '039030', name: '이오테크닉스', closePrice: 215000, changeRate: 3.20, volume: 700000, tradeValuePct: 1510, theme: 'HBM 레이저 장비 / 소부장', reason: 'HBM 패키징 공정용 레이저 그루빙 장비 공급량 확대 및 AI 메모리 제조 공정 고도화 수혜' },
  { ticker: '247540', name: '에코프로비엠', closePrice: 185000, changeRate: 3.50, volume: 1300000, tradeValuePct: 2400, theme: '2차전지 양극재 / 쇼트커버', reason: '삼성SDI향 대규모 양극재 양산 개시 및 테슬라 주가 반등에 따른 국내 2차전지 투심 동조화 낙수효과' },
  { ticker: '054180', name: '태성', closePrice: 12800, changeRate: 15.20, volume: 10540000, tradeValuePct: 1350, theme: '유리 기판 장비 / PCB 장비', reason: '글로벌 대기업향 유리 기판 제조 특화 설비 장비 단독 공급설 보도 및 차세대 기판 트렌드 대장주 낙점' }
];

async function generateMorningBriefing() {
  console.log('[Friday Injector] Generating Morning Briefing via Gemini...');
  const prompt = `
당신은 대한민국 금융 시장 최고의 투자 전략가입니다.
날짜는 2026-07-10 (금요일)입니다. 오늘 아침 장전에 트레이더들에게 전달할 고품격 '장전 브리핑' JSON 데이터를 작성하십시오.

당일 핵심 상황:
- 뉴욕 증시가 전날 미 반도체 투자심리 개선으로 나스닥을 비롯해 크게 상승했습니다. (다우: 39,291.97 (+0.62%), 나스닥: 18,124.50 (+1.43%), S&P500: 5,532.12 (+0.95%))
- 엔비디아가 +3.5% 상승하며 130달러선을 회복, 빅테크 수급이 완벽하게 살아났습니다.
- 이에 맞춰 오늘 한국 증시는 반도체 소부장(한미반도체, 삼성전자, SK하이닉스)과 바이오 플랫폼(알테오젠, 유한양행) 등으로 엄청난 외국인/기관 수급이 집중될 것으로 보입니다.

작성 규칙:
- 홍보성 문구나 기계적 번역투를 완전히 배제하고, 여의도 최고의 트레이더가 동료들에게 직관적이고 묵직하게 분석을 전달하는 전문 어조로 작성하세요.
- 출력 형식은 오직 JSON이어야 하며 마크다운 백틱 등은 없이 순수 JSON만 반환해야 합니다.

JSON 구조 스키마:
{
  "usSummary": {
    "dow": "39,291.97 (+0.62%)",
    "nasdaq": "18,124.50 (+1.43%)",
    "sp500": "5,532.12 (+0.95%)",
    "russell2000": "2,045.18 (+0.75%)",
    "vix": "11.85 (-4.20%)"
  },
  "macro": {
    "interestRate": "5.25% - 5.50% (금리 동결 및 연내 2회 인하 시그널)",
    "cpi": "3.1% (소비자물가 예상치 하회하며 안정세 돌입)",
    "ppi": "2.1% (생산자물가 역시 하향 안정화되며 매크로 호재로 작용)",
    "fomc": "파월 의장의 비둘기파적 스탠스 공식화, 국채 금리 급락 유도",
    "bondYield": "미 10년물 국채금리 4.18% (-6bp 급락)",
    "exchangeRate": "1,378.20원 (-4.30원 하락)",
    "oilPrice": "WTI $82.15 (+0.45%)"
  },
  "worldNews": [
    "엔비디아 블랙웰 차세대 AI 가속기 주문 대폭 증가 소식에 빅테크 동반 랠리",
    "미 노동부 주간 실업청구 건수 점진적 증가세 유지로 연준 금리 인하 여력 추가 확보",
    "글로벌 인공지능 인프라 투자 펀드 규모 역대 최대치 경신 보도"
  ],
  "usFeaturedStocks": [
    "NVIDIA [종가: $131.20, 전일대비 +3.48%]: 블랙웰 전공정 독점 공급망 견고화 소식과 수주 랠리 가속화에 강세",
    "Tesla [종가: $192.40, 전일대비 +2.15%]: 완전자율주행 FSD 라이선스 판매 파트너쉽 보도에 반등 성공",
    "Broadcom [종가: $1,680.50, 전일대비 +3.82%]: 커스텀 AI ASIC 칩 물량 확대 뉴스로 기술주 동반 랠리 주도"
  ],
  "usJodoju": [
    "엔비디아 (종가: $131.20, 전일대비 +3.48% / AI 반도체)",
    "브로드컴 (종가: $1,680.50, 전일대비 +3.82% / 인프라 칩)",
    "테슬라 (종가: $192.40, 전일대비 +2.15% / 자율주행)"
  ],
  "koreanImpact": "미국 빅테크의 강력한 반등과 국채 금리의 하향 안정화(4.18%대 진입), 환율 하락(1,370원대 중반 회복)은 코스피 및 코스닥 대형 테크주로의 외국인 순매수를 극대화할 최적의 환경입니다. 특히 HBM 전용 TC본더 독점 수혜주인 한미반도체 및 삼성전자, SK하이닉스로의 대규모 패시브 매수세 유입이 거의 확실시되며, FDA 결정을 앞둔 유한양행 및 기술이전 로열티를 받는 알테오젠 등 탑티어 바이오 섹터가 지수의 추가 상방 폭발을 견인할 예정입니다. 무조건 이 핵심 테마 두 개에 거래대금을 압축하십시오.",
  "relatedKoreanStocks": [
    { "name": "한미반도체", "reason": "엔비디아발 글로벌 HBM 패키징 수요 증가에 따른 핵심 듀얼 TC 본더 대규모 공급계약 체결 뉴스와 직접 연동" },
    { "name": "알테오젠", "reason": "머크의 키트루다 SC 글로벌 3상 성공에 따라 인간 히알루로니다제 플랫폼 가치 극대화 및 연계 수혜" },
    { "name": "삼성전자", "reason": "글로벌 HBM 12단 퀄 테스트 통과 기대감 및 필라델피아 반도체 지수 폭등 수급 유입" }
  ],
  "aiSummary5Lines": [
    "미국 증시는 금리 인하 기대감 선반영 및 반도체 투심 대폭 부활로 나스닥 1.43% 상승 마감하였습니다.",
    "엔비디아의 130달러선 회복과 테슬라의 자율주행 모멘텀이 국내 IT 및 2차전지 소재주로 낙수 효과를 줍니다.",
    "원/달러 환율은 1,378원으로 크게 낮아져 외국인의 양대 시장 현선물 동반 매수세 유입 가능성이 극대화되었습니다.",
    "유한양행의 FDA 승인 디데이 카운트다운과 알테오젠의 기술이전 시너지가 제약바이오 업종의 수급을 장악할 예정입니다.",
    "금일 한국 증시는 코스피 반도체 대형주와 코스닥 알테오젠 중심 바이오 플랫폼의 압도적 주도주 장세가 기대됩니다."
  ],
  "interestThemes": [
    { "theme": "HBM3E / AI 반도체 장비 소부장", "relatedStocks": ["한미반도체 (+14.55% / 6,540억)", "SK하이닉스 (-0.43% / 8,900억)", "이오테크닉스 (+3.20% / 1,510억)"] },
    { "theme": "FDA 승인 및 SC 제형 바이오 플랫폼", "relatedStocks": ["유한양행 (+12.14% / 4,180억)", "알테오젠 (+8.32% / 3,520억)", "펩트론 (+12.40% / 2,150억)"] },
    { "theme": "차세대 유리 기판 및 온디바이스 소부장", "relatedStocks": ["태성 (+15.20% / 1,350억)", "리노공업 (+4.82% / 1,420억)", "리가켐바이오 (+7.60% / 1,800억)"] }
  ],
  "interestStocks": [
    { "name": "한미반도체", "ticker": "042700", "catalyst": "엔비디아 차세대 칩 블랙웰 양산 확대 공정에서 압도적인 TC 본더 글로벌 1위 공급 지위를 다시 한번 확고히 하는 대규모 수주 소식 임박설" },
    { "name": "알테오젠", "ticker": "196170", "catalyst": "머크 키트루다 SC 3상 통과 공식 보도에 따른 로열티 지분 수익성 재평가 및 인간 히알루로니다제 ALT-B4 가치 본격 반영" },
    { "name": "유한양행", "ticker": "000100", "catalyst": "국산 폐암 신약 렉라자 미국 FDA 사상 최초 최종 승인 결과의 초읽기 진입 보도에 따른 역대급 기관 포트폴리오 비중 확대 수급" }
  ],
  "riskIssues": [
    "반도체 대형주의 갭상승 이후 개인들의 돌파 추격 매수 시 호가창 변동성에 따른 단기 고점 낙폭 리스크 유의",
    "개별 중소형 바이오주 중 장 마감 후 불시의 자금 조달 유상증자 공시 우려가 있는 관리 부실 기업 추격 주의"
  ],
  "seo": {
    "title": "2026년 7월 10일 장전 브리핑 - 미 나스닥 반도체 폭등 수급과 국내 HBM 장비 신기록 전망",
    "description": "엔비디아 130달러 탈환 및 미국 국채 금리 하락 안정. 오늘 오전 한국 증시 반도체 및 제약바이오 투톱 대장주의 엄청난 패시브 외국인 수급 유입 예상 분석 리포트.",
    "keywords": ["주식리플레이", "장전브리핑", "7월 10일 시황", "한미반도체", "알테오젠", "유한양행"]
  }
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: { responseMimeType: 'application/json', temperature: 0.2 }
  });

  return JSON.parse(response.text.trim());
}

async function generateLunchBriefing() {
  console.log('[Friday Injector] Generating Lunch Briefing via Gemini...');
  const prompt = `
당신은 대한민국 실전 주식 투자 최고수입니다.
날짜는 2026-07-10 (금요일)입니다. 오늘 12시 30분 시점에 발행할 '장중 실시간 수급 및 동향 분석' JSON 데이터를 작성하십시오.

오전 상황:
- 개장하자마자 한미반도체, 알테오젠, 유한양행으로 상상을 초월하는 거래대금(각각 수천억 원)이 집중되면서 코스피는 +2%, 코스닥은 +4% 이상 폭등하는 기염을 토하고 있습니다.
- 삼성전자가 2% 이상 굳건히 오르면서 시장 전체 지수를 완벽히 수호하고 있고, 외국인은 7천억 원 이상 현물을 싹쓸이하고 있습니다.
- 개인 트레이더들에게 뇌동매매를 방지하고 최상의 돌파/눌림목 맥점을 전달할 수 있는 날카로운 분석을 한강 칼럼처럼 작성하십시오.

작성 규칙:
- 기계적인 문투는 절대 사절입니다.
- 마크다운 등 없이 오직 JSON만 반환해야 합니다.

JSON 구조 스키마:
{
  "date": "2026-07-10",
  "title": "오전장 거래대금 3조 폭발: 한미반도체 역사적 신고가 돌파와 바이오 플랫폼 광풍 진단",
  "midDayAnalysis": "오전 12시 30분 현재 대한민국 주식시장은 말 그대로 '역사적인 수급 폭발의 날'을 맞이하고 있습니다. 코스피는 외국인의 8,200억 원 무차별 현물 매수세에 힘입어 2.5% 가까이 올라 2,470선을 회복했으며, 코스닥은 무려 +5%가 넘는 수직 상승세를 그리며 830선을 가볍게 돌파했습니다. 오전장의 주인공은 단연 한미반도체(042700)입니다. 엔비디아의 블랙웰 양산 증설 소식에 개장과 동시에 피봇 2차 저항선인 158,000원을 역사적 최대 거래량으로 가볍게 돌파하더니 현재 장중 고가 173,000원을 마크하며 반도체 소부장 전반의 패시브 매수 자금을 모조리 빨아들이고 있습니다. 바이오 진영 역시 전례 없는 수준의 수급 몰이가 관측됩니다. 알테오젠(196170)이 머크사와의 키트루다SC 글로벌 3상 성공 마일스톤 기대감으로 코스닥 시총 1위 자리를 공고히 다지는 8%대 폭등을 만들었고, 폐암 신약 렉라자 FDA 최종 승인을 눈앞에 둔 유한양행(000100) 역시 장중 12%를 넘어서는 대형 장대양봉을 세우며 코스피 제약 섹터 전체를 하드 캐리하고 있습니다. 지금 시점에서 개인 트레이더가 범하기 가장 쉬운 치명적 오류는 바로 '불타기 뇌동 매수'입니다. 현재 한미반도체나 유한양행처럼 수천억 거래대금을 터트리며 오버슈팅이 난 구간은 철저히 외국인의 패시브 알고리즘 매수세 영역입니다. 기회를 놓쳤다는 포모(FOMO)에 사로잡혀 장중 20% 이상 고점 구간에 무작정 시장가로 탑승하는 것은 불과 3분 만에 계좌에 깊은 낙폭을 안겨줄 수 있는 자살행위와 다름없습니다. 훈련 중이신 트레이더분들은 차분하게 한미반도체 168,000원대 3분봉 상 20선 첫 눌림 지지대 확인 후 거래대금이 마를 때를 기다리거나, 바이오 플랫폼의 대장 수급 낙수가 흐르는 펩트론 등의 후발 눌림목 매수 타점을 포착하는 노련한 지혜가 빛을 발해야 하는 시간대입니다.",
  "tags": ["오전장결산", "수급폭발", "한미반도체신고가", "바이오플랫폼"]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: { responseMimeType: 'application/json', temperature: 0.2 }
  });

  return JSON.parse(response.text.trim());
}

async function generateAfterMarketReport() {
  console.log('[Friday Injector] Generating After-Market Report via Gemini...');
  const prompt = `
당신은 대한민국 여의도 최고의 프롭 트레이딩 매니저입니다.
날짜는 2026-07-10 (금요일)입니다. 오늘 마감된 주식시장의 '장마감 브리핑 및 주도주 15' JSON 데이터를 정밀하게 작성하십시오.

장마감 결과 요약:
- 코스피 마감 지수: 2,475.94 (+2.52% 폭등)
- 코스닥 마감 지수: 837.41 (+5.47% 초폭등)
- 오늘 시장을 완벽하게 지배한 주도주 15개 종목은 다음과 같습니다:
${JSON.stringify(JODOJU_15_INFO, null, 2)}

작성 규칙:
- 한미반도체, 알테오젠, 유한양행, 삼성전자의 네 종목에 대해서는 극단적으로 디테일하고 방대한 상승 원인, 하락 요인, 장중 3분봉 상의 실전 매수 타점(Buy Point 2군데의 구체적인 가격과 기술적 기법 근거), 손절선, 내일 영업일 모니터링 체크포인트를 반드시 누락 없이 꽉 채워 작성하십시오.
- 나머지 11개 종목에 대해서도 성실하고 충실하게 데이터를 다 채우십시오.
- 출력 형식은 오직 JSON이어야 하며 마크다운 백틱 등은 없이 순수 JSON만 반환해야 합니다.

JSON 구조 스키마:
{
  "jodoju15": [
    {
      "ticker": "6자리 종목코드",
      "name": "종목명",
      "rank": 1,
      "closePrice": 172400,
      "changeRate": 14.55,
      "volume": 3840200,
      "tradeValuePct": 6540,
      "marketStrength": 95,
      "themeStrength": 98,
      "score": 97,
      "stars": 5,
      "relatedThemes": ["AI 반도체", "HBM", "TC 본더"],
      "relatedPeerGroup": ["SK하이닉스", "삼성전자", "이오테크닉스", "태성"],
      "marketImpact": "반도체 소부장 전반의 멀티플을 상향 확장하며 코스닥 지수 상승 견인의 절대적 1등 공신 대장주 역할 수행",
      "supplyDemand": {
        "foreigner": "+2,480억 순매수 (역대급 대량 편입)",
        "institution": "+1,120억 순매수 (기관 사모펀드 및 연기금 패시브 매입 동참)"
      },
      "riseReason": "엔비디아 블랙웰 양산 및 공급 확대 기대감에 따른 TC본더 대규모 추가 수주 임박 보도",
      "declineReason": "장 초반 갭상승 이후 차익 물량 출회로 일시 눌림을 겪었으나 오후에 재돌파하며 마감",
      "disclosures": [
        { "title": "단일판매·공급계약체결 (제조장비 공급계약)", "date": "2026-07-10" }
      ],
      "news": [
        { "title": "[특징주] 한미반도체, 엔비디아 블랙웰 수혜 수주 기대감에 14%대 역사적 신고가 돌파", "date": "2026-07-10" }
      ],
      "aiSummary": "글로벌 HBM 패키징용 듀얼 TC 본더 1위 공급사로서 독보적 독점 수혜를 입었으며, 오늘 엄청난 거래대금과 기관/외인의 동반 패시브 자금이 집중되며 시장을 완벽하게 하드캐리했습니다.",
      "aiAnalysis": {
        "riseReasonDetailed": "엔비디아의 차세대 AI 칩인 블랙웰 가속기 출하가 예상을 크게 뛰어넘으면서 글로벌 파운드리 및 후공정 OSAT 업체들의 장비 발주가 쏟아졌습니다. 특히 동종 업종 내 유일하게 다년간 검증된 듀얼 TC 본더 장비를 독점 생산 중인 동사는 해외 대형 반도체 제조사로부터의 조 단위 대규모 추가 계약 공시가 조만간 공식화될 것이라는 분석 보고서가 나오며 패시브 외국인 펀드 자금과 기관 투신의 대량 추종 수급이 상단 매물을 한 번에 쓸어 담으며 장대양봉을 장식하였습니다.",
        "declineReasonDetailed": "오전 10시경 일봉 상 단기 전고점 돌파에 따른 개인 트레이더들의 단타 차익 실현 물량이 한때 집중되었으나, 하단의 강력한 5일선 지지와 기관의 지속적인 프로그램 대량 순매수 유입으로 가격이 완벽히 방어되어 낙폭이 빠르게 회복되었습니다.",
        "buyPoints": [
          "오전 09시 15분: 전일 최고가이자 강력한 박스권 매물 저항선이었던 158,000원을 전일 대비 400% 이상 폭발한 체결강도로 돌파 지지해 내는 첫 분봉 지지 확인 타점.",
          "오후 01시 45분: 장중 가격 조정 구간에서 3분봉 상 20일 이평선(168,000원선)까지 거래량이 극도로 말라가며 수렴 횡보한 직후, 재차 아래 꼬리를 달고 튕겨 오르는 눌림목 매수 타점."
        ],
        "cautionPoints": [
          "역사적 신고가 영역이므로 직전 눌림 지지대인 165,000원선을 이탈하면 즉각 비중을 줄이는 손절 규율을 엄수해야 하며, 장중 오버슈팅에 흥분한 뇌동매매는 큰 상처를 줍니다."
        ],
        "tomorrowCheckpoints": [
          "외국인 수급의 핵심 창구인 모건스탠리 및 JP모건에서의 지속적 순매입 유지 여부 모니터링",
          "시간외 단일가 등락율 및 엔비디아 본주의 뉴욕 증시 추가 신고가 달성 여부"
        ]
      }
    }
    // ... 나머지 14개 종목 양식에 맞춰 완벽하게 채울 것
  ],
  "features": [
    {
      "ticker": "042700",
      "name": "한미반도체",
      "category": "GOOD",
      "keywords": ["신고가", "TC본더", "엔비디아", "수주", "대장주"],
      "catalyst": "엔비디아 차세대 칩 블랙웰 양산 확대 수혜로 대규모 글로벌 수주 계약 가시화 소식 부각",
      "relatedStocks": ["SK하이닉스", "삼성전자", "이오테크닉스"]
    }
  ],
  "marketAnalysisSummary": "..."
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: { responseMimeType: 'application/json', temperature: 0.2 }
  });

  return JSON.parse(response.text.trim());
}

async function generateEveningColumn() {
  console.log('[Friday Injector] Generating Evening Column via Gemini...');
  const prompt = `
당신은 대한민국 최고 명성의 자본시장 경제 주필이자 트레이더 칼럼니스트입니다.
날짜는 2026-07-10 (금요일)입니다. 오늘 저녁 20시 시점에 발행할 '저녁 AI 금융 칼럼: 메가트렌드 경제 전망' JSON 데이터를 작성하십시오.

금요일 장 상황:
- 코스피 2.52% 폭등 (2,475.94), 코스닥 5.47% 초폭등 (837.41)
- 외국인 양 시장 1.5조 순매수
- 글로벌 매크로 하향 안정화 (환율 급락, 10년물 국채 금리 4.18% 붕괴)
- AI 가속기 및 HBM 반도체(한미반도체, 삼성전자)와 바이오 플랫폼(알테오젠, 유한양행)이라는 두 거대한 시대적 축이 시장을 지배했습니다.
- 시장의 이면에 흐르는 돈의 위대한 힘과, 거시 경제가 빚어낸 이 파괴적인 순환매의 본질을 꿰뚫는 한 편의 완벽한 문학적 에세이 칼럼(1500자 이상으로 꽉 채울 것)을 작성하십시오.

작성 규칙:
- 기계적인 문투는 완전 사절입니다.
- 마크다운 등 없이 오직 JSON만 반환해야 합니다.

JSON 구조 스키마:
{
  "date": "2026-07-10",
  "title": "금요일의 침묵을 깬 1.5조의 사자후: AI 반도체와 바이오 플랫폼이 그리는 위대한 부의 도킹",
  "columnContentMarkdown": "한 주 동안 숨 막히는 긴장감과 하방 압력 속에 침묵을 지키던 주식시장이, 금요일 장 마감과 동시에 거대한 폭발을 일으키며 자본시장의 위대한 힘을 증명해 보였습니다. 코스피는 오랜 저항이었던 박스권을 뚫어내며 2,475.94선에 안착했고, 코스닥은 무려 +5.47%라는 역사적 대폭등을 기록하며 837.41선으로 직행했습니다. 이 사자후의 진원지는 하루 동안 양대 시장에서 무려 1.5조 원의 현물을 흔들림 없이 쓸어 담은 외국인의 거대한 양 손이었습니다.\\n\\n이날의 대폭등은 단순한 '낙폭 과대에 따른 기술적 반등'이 아닙니다. 매크로 경제 지표의 완벽한 하향 안정화가 빚어낸 필연적인 유동성의 보복적 매집이었습니다. 밤사이 뉴욕 증시에서 미국의 10년물 국채 금리가 연준의 비둘기파적 스탠스 공식화와 함께 마지노선이었던 4.2%를 깨고 4.18%로 급락했고, 원/달러 환율은 하루 만에 4원 이상 밀리며 1,378원대로 안정되었습니다. 짓눌려 있던 글로벌 성장주들의 멀티플을 가두던 빗장이 일시에 풀리는 순간이었습니다.\\n\\n그리고 그 풀려난 자금은 대한민국 증시를 지탱하는 두 개의 가장 강력한 엔진, 즉 'AI 반도체 소부장'과 '바이오 테크 플랫폼'이라는 위대한 양대 축으로 완벽하게 접합(Docking)되었습니다. 한미반도체(042700)는 엔비디아 블랙웰 수혜 수주가 임박했다는 소식과 함께 역사적인 최고가 172,400원을 뚫어내며 반도체 후공정 밸류체인의 왕좌에 올랐습니다. 동시에 바이오 진영에서는 머크의 혁신적 SC 제형 파트너인 알테오젠(196170)과 폐암 항암 신약 렉라자 FDA 승인의 초읽기에 들어간 유한양행(000100)이 각각 8%, 12%의 초대형 폭등 흐름을 이어가며 코스닥과 코스피의 심장부를 관통했습니다.\\n\\n이것이 가리키는 자본의 본질은 명확합니다. 돈은 결코 애매한 곳으로 흘러가지 않으며, 오직 '가장 파괴적이고 확실한 성장을 보여주는 혁신 기술'에만 무자비하게 쏠린다는 점입니다. HBM이라는 물리적 하드웨어의 병목을 해결하는 한미반도체와, 인간 생명 연장 및 편의성의 극대화를 실현하는 정맥주사의 SC 제형 변경 기술을 보유한 알테오젠은 단순히 주식 시장의 테마주가 아닙니다. 인류 문명의 패러다임을 전환하는 거대한 메가트렌드의 정점에 서 있는 상징적 자산들입니다. 외국인 스마트 머니는 바로 이 거대한 성장의 실체를 꿰뚫고, 국채 금리가 하락하는 골디락스 국면에 도래하자마자 사상 최대로 자금을 집행한 것입니다.\\n\\n이제 다가올 새로운 한 주를 준비하는 트레이더들의 마인드셋 역시 이 위대한 양대 축에 완전히 동화되어야 합니다. 금요일 하루 동안 터진 역대급 거래대금은 이 추세가 단발성 피날레가 아니며, 이제 막 본격적인 추세적 우상향 레일 위에 전동차가 안착했음을 의미합니다. 눌림은 언제나 매수 타점이며, 시장의 지엽적인 소음과 공포에 휘둘리지 않고 돈의 거대한 수급 이동 경로를 그대로 뒤쫓는 자만이 이 거대한 부의 도킹 국면에서 진정한 위너가 될 수 있을 것입니다.",
  "tags": ["메가트렌드", "경제칼럼", "자본의본질", "HBM바이오"]
}
`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt,
    config: { responseMimeType: 'application/json', temperature: 0.2 }
  });

  return JSON.parse(response.text.trim());
}

async function run() {
  console.log('[Friday Injector] Initializing Friday (July 10, 2026) Market Data Generation & Syncing pipeline.');
  
  try {
    const morningData = await generateMorningBriefing();
    const lunchData = await generateLunchBriefing();
    const afternoonData = await generateAfterMarketReport();
    const eveningData = await generateEveningColumn();
    
    // Set specific fields
    morningData.date = DATE_STR;
    morningData.id = `briefing_${DATE_STR}`;
    morningData.published = true;
    
    lunchData.date = DATE_STR;
    
    afternoonData.date = DATE_STR;
    afternoonData.id = `report_${DATE_STR}`;
    afternoonData.published = true;
    if (afternoonData.jodoju15) {
      afternoonData.jodoju15.forEach((item, idx) => {
        item.rank = idx + 1;
      });
    }
    
    eveningData.date = DATE_STR;

    // 1. Write locally to platform files (Fallback support)
    fs.writeFileSync(path.join(DATA_DIR, 'pre_market_briefing.json'), JSON.stringify(morningData, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'lunch_briefing.json'), JSON.stringify(lunchData, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'after_market_report.json'), JSON.stringify(afternoonData, null, 2), 'utf-8');
    fs.writeFileSync(path.join(DATA_DIR, 'evening_column.json'), JSON.stringify(eveningData, null, 2), 'utf-8');
    console.log('[Friday Injector] Successfully wrote all 4 JSON files locally in data/platform/. Fallback is fully armed!');

    // 2. Try to save to Supabase
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
      console.log('[Friday Injector] Supabase config found. Attempting table UPSERTs...');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
      
      const syncTasks = [
        { key: 'morning_briefing', data: morningData },
        { key: 'lunch_briefing', data: lunchData },
        { key: 'afternoon_report', data: afternoonData },
        { key: 'evening_column', data: eveningData }
      ];

      for (const task of syncTasks) {
        try {
          const { error } = await supabase
            .from('kstock_platform_data')
            .upsert({
              key: task.key,
              data: task.data,
              updated_at: new Date().toISOString()
            }, { onConflict: 'key' });
          
          if (error) {
            console.error(`[Friday Injector] Supabase Sync failed for key '${task.key}':`, error.message);
          } else {
            console.log(`[Friday Injector] Successfully injected key '${task.key}' into Supabase kstock_platform_data!`);
          }
        } catch (taskErr) {
          console.error(`[Friday Injector] Exception syncing key '${task.key}':`, taskErr);
        }
      }
    } else {
      console.warn('[Friday Injector] Supabase credentials are not found in process.env. Skipping database sync.');
    }
    
    console.log('[Friday Injector] All injection pipelines are complete!');
  } catch (err) {
    console.error('[Friday Injector] Fatal injection exception:', err);
    process.exit(1);
  }
}

run();
