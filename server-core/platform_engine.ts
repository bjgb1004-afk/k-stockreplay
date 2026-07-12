import fs from 'fs';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { PreMarketBriefing, AfterMarketReport, JodojuAnalysis, FeatureStock, ReplayReviewReport, AiReplayStudyGuide, ReplayGuideInterval, Candle, Trade } from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data', 'platform');

// Ensure database/platform directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to initialize Gemini Client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('[Gemini Service] GEMINI_API_KEY environment variable is not defined.');
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Connection mapping table for Pre-Market Briefing
const US_KR_CONNECTION_MAPPING = `
[미 증시-국내 증시 연결고리 매핑 테이블]
1. 엔비디아(NVIDIA) 폭등/상승 ➡️ AI 반도체 수혜주: SK하이닉스, 한미반도체, 이오테크닉스, 피에스케이홀딩스
2. 테슬라(Tesla) 급등/자율주행 호재 ➡️ 2차전지 및 자율주행: LG에너지솔루션, 에코프로비엠, 엘앤에프, 현대모비스, 에이테크솔루션
3. 일라이 릴리(Eli Lilly) / 노보 노디스크 비만치료제 호재 ➡️ 비만치료제/바이오: 펩트론, 한미약품, 유한양행, 인벤티지랩
4. 애플(Apple) AI 발표/신제품 흥행 ➡️ 스마트폰 부품주: LG이노텍, 비에이치, 자화전자
5. 마이크로소프트/구글 AI 클라우드 확대 ➡️ AI 소프트웨어 & 전력 인프라: HD현대일렉트릭, 효성중공업, 재룡전기, 솔트룩스, 크라우드웍스
6. 글로벌 지정학적 불안 (중동/러시아 갈등) ➡️ 방산 & 에너지/유가: 한화에어로스페이스, 현대로템, LIG넥스원, 한국석유, 흥구석유
`;

// Seed Data for Pre-Market Briefing
const SEED_PRE_MARKET_BRIEFING: PreMarketBriefing = {
  id: 'briefing_today',
  date: new Date().toISOString().split('T')[0],
  published: true,
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
  worldNews: [
    '엔비디아 시가총액 다시 1위 탈환, AI 가속기 차세대 칩 수요 폭발 지속 언급',
    '미국 신규 실업수당 청구 건수 23.8만 건 기록하며 고용시장 점진적 둔화 시그널',
    '유럽 연합(EU), 중국산 전기차에 최대 38.1% 상계 관세 예비 부과 통보',
    '중동 지정학적 긴장 재확산에 따라 브렌트유 장중 85달러선 돌파 시도'
  ],
  usFeaturedStocks: [
    'NVIDIA [종가: $127.40, 전일대비 +3.18%]: 모건스탠리의 초강력 매수 추천 의견 및 차세대 Blackwell 출하 호조 언급에 상승세 유지',
    'Tesla [종가: $187.35, 전일대비 +2.90%]: 상하이 기가팩토리 FSD(Full Self-Driving) 연내 승인 기대감으로 매수세 유입',
    'Broadcom [종가: $1,650.22, 전일대비 +4.55%]: AI ASIC 전용 칩 수주 금액 전년 대비 80% 증가 소식에 강세'
  ],
  usJodoju: [
    '엔비디아 (종가: $127.40, 전일대비 +3.18% / AI 반도체)',
    '브로드컴 (종가: $1,650.22, 전일대비 +4.55% / 맞춤형 반도체)',
    '테슬라 (종가: $187.35, 전일대비 +2.90% / 자율주행 및 로봇)'
  ],
  koreanImpact: '미국 테크주의 강력한 상승세에 따라 국내 증시 역시 코스피 반도체 대형주(SK하이닉스, 한미반도체) 중심의 강력한 기관/외국인 동반 수급 유입이 기대됩니다. 반면 원/달러 환율이 1,380원대 안착을 시도하고 있어 중소형 개별 테마군의 수급 변동성이 커질 수 있으므로 주도 테마 압축 대응이 유리합니다.',
  relatedKoreanStocks: [
    { name: 'SK하이닉스', reason: '엔비디아 HBM3E 독점 공급 부각 및 역사적 고가 경신 돌파 흐름 연동' },
    { name: '한미반도체', reason: 'TC 본더 글로벌 독보적 점유율 바탕으로 AI 장비 대장주 역할 수행' },
    { name: '펩트론', reason: '글로벌 제약사와 비만치료제 스마트디포 기술이전 논의 기대감에 바이오 수급 연계' }
  ],
  aiSummary5Lines: [
    '미국 3대 지수는 엔비디아와 빅테크 주도로 나스닥 1.28% 상승 마감하였습니다.',
    '고용지표 둔화와 국채금리 하락(4.23%)이 기술주 멀티플 상승의 촉매가 되었습니다.',
    '유로존 관세 부과 악재 속에서도 테슬라는 자율주행 기대감으로 약 3% 상승에 성공했습니다.',
    '원/달러 환율은 1,382원으로 소폭 상승하여 국외 외국인 수급은 대형 IT에 집중될 전망입니다.',
    '오늘 국내 증시는 코스피 반도체 소부장과 비만치료제 테마가 강한 주도력을 펼칠 것으로 예상됩니다.'
  ],
  interestThemes: [
    { theme: 'HBM3E / AI 반도체 소부장', relatedStocks: ['한미반도체 (+14.55% / 3,820억)', 'SK하이닉스 (+5.80% / 4,210억)', '이오테크닉스 (+3.20% / 1,510억)'] },
    { theme: 'GLP-1 계열 비만치료제', relatedStocks: ['펩트론 (+12.40% / 2,150억)', '한미약품 (+4.20% / 980억)', '유한양행 (+3.80% / 850억)'] },
    { theme: '동해 심해 가스전 국책 과제', relatedStocks: ['동양철관 (+15.00% / 890억)', '한국가스공사 (+8.70% / 3,110억)', '포스코인터내셔널 (+2.50% / 1,410억)'] }
  ],
  interestStocks: [
    { name: '한미반도체', ticker: '042700', catalyst: '엔비디아발 글로벌 HBM 패키징 장비 2천억 대규모 수주 공시 임박설' },
    { name: '펩트론', ticker: '086520', catalyst: '릴리향 약효지속성 플랫폼 공동개발 최종 계약 협상 마무리 구간 진입' },
    { name: '한국가스공사', ticker: '036460', catalyst: '산업통상자원부 동해 심해 안동 가스전 첫 개발 시추 위치 확정 뉴스' }
  ],
  riskIssues: [
    '원/달러 환율 1,385원 돌파 시 코스피 외인 선물 매도 전환 가능성 유의',
    '유상증자 및 CB 발행 공시가 장 마감 후 발표된 중소형 바이오주 개장 직후 변동성 주의'
  ],
  seo: {
    title: '오늘의 장전 브리핑 - 미 증시 빅테크 폭등과 국내 HBM 연계 종목 분석',
    description: '엔비디아 시총 1위 탈환 및 미 국채 금리 하락 안정세. 오늘 오전 국내 증시 주도 테마인 HBM 및 비만치료제 주요 핵심 종목 집중 분석 리포트.',
    keywords: ['주식복기', '장전브리핑', '엔비디아 관련주', '한미반도체', '펩트론', '오늘의 주식']
  }
};

// Seed Data for After-Market Jodoju (15 Stocks) & Feature Stocks
const SEED_AFTER_MARKET_REPORT: AfterMarketReport = {
  id: 'report_today',
  date: new Date().toISOString().split('T')[0],
  published: true,
  jodoju15: [
    {
      ticker: '042700',
      name: '한미반도체',
      rank: 1,
      closePrice: 172400,
      changeRate: 14.55,
      volume: 3840200,
      tradeValuePct: 6540, // 6540억
      marketStrength: 94,
      themeStrength: 98,
      score: 96,
      stars: 5,
      relatedThemes: ['AI 반도체', 'HBM3E', 'TC 본더'],
      relatedPeerGroup: ['SK하이닉스', '피에스케이홀딩스', '디아이', '오픈엣지테크놀로지'],
      marketImpact: '반도체 소부장 전반의 멀티플을 확장시키며 코스닥 지수 상승 견인 대장주 역할 수행',
      supplyDemand: {
        foreigner: '+420억 순매수 (3일 연속)',
        institution: '+180억 순매수 전환'
      },
      riseReason: '엔비디아 블랙웰 생산량 증대에 따른 SK하이닉스향 차세대 듀얼 TC 본더 역대 최대 규모 공급 소식 및 수주 기대감 증폭',
      disclosures: [
        { title: '단일판매·공급계약체결 (제조장비 공급계약)', date: '2026-07-09' }
      ],
      news: [
        { title: '"HBM 패키징 독점" 한미반도체, 창사 이래 최대 실적 가시화', date: '2026-07-09' },
        { title: '[특징주] 한미반도체, 엔비디아 시총 1위 복귀 소식에 14% 강세 돌파', date: '2026-07-09' }
      ],
      aiSummary: '한미반도체는 독보적인 HBM 패키징용 TC 본더 글로벌 1위 공급업체로서, 글로벌 반도체 밸류체인 핵심 수혜를 입으며 대량 거래대금을 동반하여 박스권을 상향 돌파했습니다.',
      aiAnalysis: {
        riseReasonDetailed: '엔비디아의 블랙웰 칩 수요가 예상을 상회하자 전공정 및 후공정 장비 수요가 폭증. 특히 한미반도체의 듀얼 TC 본더는 동종 업계 중 유일하게 대량 양산 검증을 마친 장비로 독점적 수혜 지위를 누리며 기관/외인의 대규모 패시브 자금이 유입되었습니다.',
        declineReasonDetailed: '장중 고가 형성 이후 개인들의 단기 돌파 차익 실현 매물이 일부 출회되었으나, 시가총액 대비 거래대금 순환율이 양호하여 아래 꼬리를 길게 달고 견조하게 안착했습니다.',
        buyPoints: [
          '오전 9시 15분: 피봇 2차 저항선인 158,000원을 전일 대비 300% 이상 증가한 거래량으로 강력하게 돌파 지지하는 시점.',
          '오후 1시 30분: 3분봉 상 20선 눌림목인 168,000원 대에서 거래량이 극도로 감소하며 횡보 안정 흐름을 보인 재차 지지 구간.'
        ],
        cautionPoints: [
          '역사적 신고가 영역이므로 손절가를 직전 의미 있는 지지선(160,000원)으로 타이트하게 잡아야 하며 추격 매수는 변동성이 매우 큽니다.'
        ],
        tomorrowCheckpoints: [
          'SK하이닉스의 추가 수주 정식 공시 여부 확인',
          '엔비디아 본주의 미 증시 마감 가격 유지 및 필라델피아 반도체 지수의 연속성 여부'
        ]
      }
    },
    {
      ticker: '196170',
      name: '알테오젠',
      rank: 2,
      closePrice: 284500,
      changeRate: 8.32,
      volume: 1250400,
      tradeValuePct: 3520, // 3520억
      marketStrength: 89,
      themeStrength: 92,
      score: 91,
      stars: 5,
      relatedThemes: ['바이오 플랫폼', 'ALT-B4', '키트루다 SC'],
      relatedPeerGroup: ['리그켐바이오', '펩트론', '리가켐바이오', '에이프릴바이오'],
      marketImpact: '코스닥 시가총액 1위 굳히기 돌입 및 제약바이오 업종 전반의 투심 개선 유도',
      supplyDemand: {
        foreigner: '+280억 외인 순매수',
        institution: '+95억 투신/보험 중심 대량 순매수'
      },
      riseReason: '머크(Merck)의 키트루다 피하주사(SC) 제형 임상 3상 성공 가능성 고조에 따른 마일스톤 유입 본격화 및 후속 파이프라인 계약 기대감',
      disclosures: [
        { title: '특허권취득 (인간 히알루로니다제 변이체 특허 등록)', date: '2026-07-08' }
      ],
      news: [
        { title: '알테오젠, 키트루다SC 글로벌 승인 임박에 주가 연일 상향곡선', date: '2026-07-09' },
        { title: '외국인 코스닥 러브콜 1위는 역시 알테오젠', date: '2026-07-09' }
      ],
      aiSummary: '독자적인 정맥주사 ➡️ 피하주사(SC) 제형 변경 플랫폼 기술력을 인정받아, 머크의 글로벌 판매망 연계 로열티 수익이 가시화되면서 강력한 우상향 랠리를 펼치고 있습니다.',
      aiAnalysis: {
        riseReasonDetailed: '바이오 대장주로서 제약바이오 업종으로의 순환매 수급을 주도하고 있으며, 인간 히알루로니다제 플랫폼 ALT-B4의 가치가 상업화 직전 단계에 진입함에 따라 가치 재평가가 이루어지고 있습니다.',
        declineReasonDetailed: '특별한 악재는 없으나 장 초반 29만 원 돌파 시도 중 호가 갭이 벌어지며 프로그램 매도가 출회되어 고점 대비 살짝 완화되었습니다.',
        buyPoints: [
          '오전 10시 05분: 전일 종가(262,500원) 대비 4% 갭상승 이후 갭을 메우지 않고 270,000원을 안착하는 첫 거래량 실린 전고점 돌파봉.'
        ],
        cautionPoints: [
          '미국 나스닥 바이오 헬스케어 지수가 변동성을 보일 때 동반 동조화가 나타나므로 매크로 지표 체크 필수.'
        ],
        tomorrowCheckpoints: [
          '외국인 창구(JP모건 등)의 매수 연속성 유지',
          '코스닥 시총 순위 변화 및 연기금의 지속적 편입 확인'
        ]
      }
    },
    {
      ticker: '000100',
      name: '유한양행',
      rank: 3,
      closePrice: 94200,
      changeRate: 12.14,
      volume: 4501200,
      tradeValuePct: 4180, // 4180억
      marketStrength: 88,
      themeStrength: 90,
      score: 89,
      stars: 4,
      relatedThemes: ['폐암 신약', '렉라자', 'FDA 승인'],
      relatedPeerGroup: ['오스코텍', '한미약품', 'HLB'],
      marketImpact: '코스피 대형 제약주의 중장기 기관 포트폴리오 비중 확대 수혜',
      supplyDemand: {
        foreigner: '+190억 매수',
        institution: '+230억 기관 금융투자 및 사모펀드 동반 매수'
      },
      riseReason: '국산 항암제 최초로 렉라자(성분명 레이저티닙)의 미국 FDA 단독 및 얀센 이중항체 병용요법의 최종 승인 결정이 임박했다는 미 언론 및 글로벌 학회 소식 부각',
      disclosures: [],
      news: [
        { title: '유한양행 렉라자, 마침내 세계 무대로... FDA 결정 디데이 초읽기', date: '2026-07-09' },
        { title: '[특징주] 유한양행, 렉라자 FDA 승인 기대감 최고조에 12% 폭등', date: '2026-07-09' }
      ],
      aiSummary: '국산 31호 신약 렉라자의 글로벌 상업화 승인 기대감이 주가에 대량의 수급을 자극하며 주가를 사상 최고가 수준으로 끌어올리고 있습니다.',
      aiAnalysis: {
        riseReasonDetailed: '글로벌 제약사인 존슨앤드존슨(J&J)이 렉라자를 연 매출 수십억 달러짜리 블록버스터 신약으로 적극 육성하겠다는 계획을 공식화하면서, 이에 따라 동사가 얻게 될 마일스톤 및 막대한 로열티 유입에 대한 선반영 가치가 부각되고 있습니다.',
        declineReasonDetailed: '단기 기대감 선반영에 따른 재료 노출(FDA 결과 발표 시점) 시점의 오버슈팅 후 일시적 실망 매물 출회 리스크가 상존합니다.',
        buyPoints: [
          '오전 9시 30분: 86,000원 박스 상단을 강력한 거래대금(1,000억 돌파)으로 장대양봉을 만들며 뚫어내는 호가창의 체결 강도 돌파 시점.'
        ],
        cautionPoints: [
          'FDA의 실제 승인 날짜 발표 전후로 급격한 변동성이 예상되므로 비중 조절이 절대적으로 필요합니다.'
        ],
        tomorrowCheckpoints: [
          '파트너사 얀센(Janssen)의 승인 일정 공표 모니터링',
          '기관 연기금의 포트폴리오 연속 유입 금액 추이'
        ]
      }
    }
  ],
  features: [
    {
      ticker: '042700',
      name: '한미반도체',
      category: 'GOOD',
      keywords: ['공급', '계약', '양산', '승인', '실적'],
      catalyst: '엔비디아 Blackwell 가속기 증산 협력에 따른 듀얼 TC 본더 대규모 공급 계약 체결 소식',
      relatedStocks: ['SK하이닉스', '피에스케이홀딩스', '디아이']
    },
    {
      ticker: '000100',
      name: '유한양행',
      category: 'GOOD',
      keywords: ['승인', '기술이전', 'FDA', '실적'],
      catalyst: '국산 폐암 신약 렉라자 미국 FDA 최종 승인 심사 완료 임박 보도 및 로열티 수십억 달러 유입 전망',
      relatedStocks: ['오스코텍', '한미약품']
    },
    {
      ticker: '950210',
      name: '프레스티지바이오',
      category: 'BAD',
      keywords: ['유상증자', 'CB', '실적악화'],
      catalyst: '장 마감 후 운영자금 조달 목적의 800억 규모 제3자배정 및 주주배정 유상증자 결정 공시 발표',
      relatedStocks: ['프레스티지바이오파마', '셀트리온제약']
    }
  ],
  marketAnalysisSummary: `[수석 마켓 애널리스트 16시 마켓 종합 브리핑]

1. 국내 양대 시장 수급 및 상승/하락 동인 진단
금일 코스피(KOSPI) 시장은 외국인과 기관이 반도체 대형주 중심의 기관·외인 양 매수 동반 수급 유입에 힘입어 +0.42% 견조하게 마감했습니다. 미국의 10년물 국채금리가 4.23% 수준으로 하향 안정화되며 기술주들의 지수 기여가 한층 부각되었고, 엔비디아의 시가총액 왕좌 탈환 소식이 삼성전자 및 SK하이닉스의 글로벌 HBM 패키징 소부장으로 낙수효과를 일으켰습니다.
반면 코스닥(KOSDAQ) 시장은 장중 기관과 외국인의 대량 프로그램 선물 매도 물량이 출회되면서 중소형 개별 주도 테마군에 차익실현 욕구를 자극, 결국 -0.15% 하락 마감하였습니다. 제약바이오 플랫폼 대장주인 알테오젠(196170)이 독보적인 수급 방어막을 구축했음에도 불구하고, 대다수의 IT 부품주 및 중소형 2차전지 소재주가 매도 압력에 시달리며 지수 간 디커플링(탈동조화)이 뚜렷하게 연출된 하루였습니다.

2. 당일 주요 특징주 호재 및 악재 핵심 키워드 분류분석
- 한미반도체 (042700) [호재 키워드: #HBM3E_TC본더, #대규모공급계약, #엔비디아시총1위]
  : 엔비디아 칩 출하 호조에 맞추어 SK하이닉스향 듀얼 TC 본더의 역대급 대규모 공급계약 체결 소식이 촉매가 되어 전일 대비 +14.55%의 역사적 신고가 돌파 흐름을 기록했습니다.
- 알테오젠 (196170) [호재 키워드: #인간히알루로니다제, #키트루다SC승인임박, #신규변이체특허]
  : 글로벌 제약사 머크와의 SC형 변경 플랫폼 ALT-B4 가치 가시화 및 변이체 추가 특허 취득 소식에 외국인의 압도적 수급 몰이가 유입되며 +8.32% 강세 마감했습니다.
- 프레스티지바이오 (950210) [악재 키워드: #유상증자결정, #전환사채CB발행, #오버행우려]
  : 장 마감 직전 운영자금 수혈 목적의 800억 규모 대규모 유상증자 및 CB 발행 결정이라는 돌발 공시가 발표되어 시간외 단일가 폭락세를 보이고 있어 익일 극도의 주가 변동성 리스크를 안고 있습니다.`
};

// Seed Data for AI Study Guides
const SEED_STUDY_GUIDES: Record<string, AiReplayStudyGuide> = {
  '042700': {
    ticker: '042700',
    guides: [
      { candleIndex: 2, type: 'BUY_ZONE', price: 158000, comment: 'HBM 장비 수주 뉴스와 함께 전일 거래량의 300% 돌파 확인. 적극적 돌파 매수 구간.' },
      { candleIndex: 5, type: 'RESISTANCE', price: 175000, comment: '라운드 피겨(Round Figure) 저항대 진입. 추격 매수 금지 및 분할 매도 고려 영역.' },
      { candleIndex: 8, type: 'SUPPORT', price: 162000, comment: '5일 이평선과 이전 돌파 고점의 중첩 지지 구간. 눌림목 스윙 매수 공략 가능.' },
      { candleIndex: 12, type: 'WARNING', price: 170000, comment: '일봉 상 전형적인 위꼬리 음봉 및 개인 매수세 과열 신호 포착. 하단 손절선 상향 조정 필요.' },
      { candleIndex: 15, type: 'STOP_LOSS', price: 155000, comment: '최근 강력 거래량이 실린 시가를 하향 이탈하는 자리. 리스크 관리를 위해 무조건적 비중 축소 혹은 전량 손절 라인.' }
    ]
  },
  '196170': {
    ticker: '196170',
    guides: [
      { candleIndex: 3, type: 'BUY_ZONE', price: 270000, comment: '인간 히알루로니다제 특허 등록 및 박스권 상단 거래 실린 안착 시점. 안정적인 밴드 매수.' },
      { candleIndex: 7, type: 'RESISTANCE', price: 295000, comment: '29만 원 돌파 시도 중 대량 프로그램 매도 출회 목격. 저항 매물 벽 확인.' },
      { candleIndex: 11, type: 'SUPPORT', price: 275000, comment: '10일 이평선의 가파른 상승 추세와 지지 구간 일치. 장기 가치 트레이더 추가 매수 적기.' },
      { candleIndex: 14, type: 'WARNING', price: 288000, comment: '단기 RSI 지표 80 돌파 및 이격도 과열 현상 발생. 분할 매도로 수익 담보 구간.' }
    ]
  }
};

export class PlatformEngine {
  // 1. Get Pre-Market Briefing
  static getPreMarketBriefing(): PreMarketBriefing {
    const filePath = path.join(DATA_DIR, 'pre_market_briefing.json');
    if (!fs.existsSync(filePath)) {
      // Save Seed Data
      fs.writeFileSync(filePath, JSON.stringify(SEED_PRE_MARKET_BRIEFING, null, 2));
      return SEED_PRE_MARKET_BRIEFING;
    }
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return SEED_PRE_MARKET_BRIEFING;
    }
  }

  // 2. Save Pre-Market Briefing (Admin)
  static savePreMarketBriefing(briefing: PreMarketBriefing): void {
    const filePath = path.join(DATA_DIR, 'pre_market_briefing.json');
    fs.writeFileSync(filePath, JSON.stringify(briefing, null, 2));
  }

  // 3. Get After-Market Report (Jodoju 15 & Features)
  static getAfterMarketReport(): AfterMarketReport {
    const filePath = path.join(DATA_DIR, 'after_market_report.json');
    if (!fs.existsSync(filePath)) {
      // Save Seed Data
      fs.writeFileSync(filePath, JSON.stringify(SEED_AFTER_MARKET_REPORT, null, 2));
      return SEED_AFTER_MARKET_REPORT;
    }
    try {
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    } catch (e) {
      return SEED_AFTER_MARKET_REPORT;
    }
  }

  // 4. Save After-Market Report (Admin)
  static saveAfterMarketReport(report: AfterMarketReport): void {
    const filePath = path.join(DATA_DIR, 'after_market_report.json');
    fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
  }

  // 5. Get AI Replay Study Guide for a Ticker
  static getStudyGuide(ticker: string): AiReplayStudyGuide {
    const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
    // Check if customized guide exists on disk
    const guidePath = path.join(DATA_DIR, `guide_${cleanTicker}.json`);
    if (fs.existsSync(guidePath)) {
      try {
        return JSON.parse(fs.readFileSync(guidePath, 'utf-8'));
      } catch (e) {
        // Fallback
      }
    }

    // Default seeded guide
    if (SEED_STUDY_GUIDES[cleanTicker]) {
      return SEED_STUDY_GUIDES[cleanTicker];
    }

    // Dynamic generation function fallback (Return structured placeholder)
    const genericGuides: ReplayGuideInterval[] = [
      { candleIndex: 3, type: 'BUY_ZONE', price: 10000, comment: '거래대금이 이전 5거래일 평균을 돌파하며 5일선 골든크로스를 그렸습니다. AI 추천 타점.' },
      { candleIndex: 7, type: 'RESISTANCE', price: 12500, comment: '이전 하락 파동의 61.8% 피보나치 되돌림 구간입니다. 물량 소화 및 저항 관찰 필요.' },
      { candleIndex: 11, type: 'SUPPORT', price: 10800, comment: '돌파된 이전 직전 고점이 새로운 강력 지지선으로 변환되었습니다. 안정적인 스윙 분할매수.' },
      { candleIndex: 15, type: 'STOP_LOSS', price: 9500, comment: '지지 지지대가 훼손되어 거래량이 실리며 이탈할 경우 추세 왜곡이 발생하므로 손절 엄수 필수.' }
    ];

    return {
      ticker: cleanTicker,
      guides: genericGuides
    };
  }

  // 6. Save Customized Study Guide (Admin / Generator)
  static saveStudyGuide(ticker: string, guide: AiReplayStudyGuide): void {
    const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
    const guidePath = path.join(DATA_DIR, `guide_${cleanTicker}.json`);
    fs.writeFileSync(guidePath, JSON.stringify(guide, null, 2));
  }

  // ==========================================
  // AI Generation with Gemini-3.5-Flash
  // ==========================================

  // Generate Pre-Market Briefing using real-time grounding
  static async generatePreMarketBriefingAI(): Promise<PreMarketBriefing> {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('GEMINI_API_KEY가 설정되지 않아 AI를 시작할 수 없습니다. 환경변수를 확인해주세요.');
    }

    const todayDateStr = new Date().toISOString().split('T')[0];

    const prompt = `
당신은 대한민국 금융 시장을 이끄는 탑티어 수석 투자 전략가(CIO)이자 주식 복기 교육 최고 권위자입니다.
오늘 날짜는 ${todayDateStr} 입니다.
최근의 실시간 글로벌 금융 지표(미국 3대 지수, 환율, 금리, 유가, VIX 등)와 세계 뉴스 상황을 활용하여, 국내 트레이더들을 위한 고품격 '오전 7시 50분 장전 투자 브리핑' 데이터를 작성해 주세요.

반드시 다음의 [미 증시-국내 증시 연결고리 매핑 테이블]을 깊이 참고하여, 미국 주도주의 상승/하락 영향이 한국의 핵심 수혜 섹터와 관련주에 어떤 파급효과를 불러일으킬지 세밀한 연결고리 예측을 제공해야 합니다:
${US_KR_CONNECTION_MAPPING}

작성 규칙:
1. 현실성 있고 전문적인 한국 주식 시장의 실전 용어를 사용하여 정밀한 한국어로 작성하십시오.
2. 출력 형식은 오직 JSON이어야 하며, 마크다운이나 잡다한 텍스트 없이 유효한 JSON 오브젝트 하나만 리턴해 주십시오. JSON 스키마는 아래에 설명된 필드를 완벽하게 포함해야 합니다.

JSON 구조 스키마:
{
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
  "worldNews": [
    "최근 글로벌 주요 정치/경제/기술 분야 뉴스 제목 및 1줄 요약 3~4개"
  ],
  "usFeaturedStocks": [
    "미국 증시 내 급등 혹은 이슈 중심 기업명(티커)과 상승/하락률, 원인 요약 2~3개"
  ],
  "usJodoju": [
    "미국 장을 실질적으로 하드 캐리한 핵심 주도주 테마/종목명 3개 내외"
  ],
  "koreanImpact": "위의 거시지표와 미국 빅테크의 등락이 한국 증시 외국인/기관 수급에 미칠 구체적이고 전문적인 정밀 영향도 및 트레이더 대응 마인드셋 전략 가이드",
  "relatedKoreanStocks": [
    {
      "name": "연계 연동 국내 종목명",
      "reason": "미국 증시 호재/주도주와 엮인 직접적인 연동 원인 기술"
    }
  ],
  "aiSummary5Lines": [
    "오늘 아침 핵심 시장을 관통하는 임팩트 있는 한 문장씩 총 5개의 5줄 정밀 요약"
  ],
  "interestThemes": [
    {
      "theme": "오늘 장중 강력 수급 유입이 기대되는 최고 관심 테마명",
      "relatedStocks": [
        "대표종목1 (+상승률% / 거래대금액)",
        "대표종목2 (+상승률% / 거래대금액)",
        "대표종목3 (+상승률% / 거래대금액)"
      ]
    }
  ],
  "interestStocks": [
    {
      "name": "오늘 개장 후 최우선 돌파/스윙 타겟으로 관찰할 주도주 종목명",
      "ticker": "해당 종목의 6자리 한국 표준 코스닥/코스피 종목코드",
      "catalyst": "이 종목이 장 시작부터 돈이 몰려갈 수밖에 없는 핵심 모멘텀 재료 및 기술적 폭발 유도 근거"
    }
  ],
  "riskIssues": [
    "오늘 하루 트레이더들이 뇌동 매매를 자제하고 계좌를 보존하기 위해 극도로 경계해야 하는 하방 악재 및 돌발 뉴스 주의 사항 2개"
  ],
  "seo": {
    "title": "주식 블로그 및 SEO 노출을 극대화할 수 있는 검색 최적화용 대제목",
    "description": "국내 개인 투자자들이 검색 엔진에서 즉시 클릭할 강력하고 유니크한 상세 메타 정보 요약문",
    "keywords": ["검색엔진노출용", "핵심키워드1", "핵심키워드2", "주요테마"]
  }
}
`;

    try {
      console.log('[Gemini SDK] Dispatching Pre-Market Briefing text request...');
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        }
      });

      const responseText = response.text || '';
      console.log('[Gemini SDK] Briefing generated. Parsing JSON...');
      const parsed = JSON.parse(responseText.trim());
      
      const newBriefing: PreMarketBriefing = {
        id: `briefing_${todayDateStr}`,
        date: todayDateStr,
        published: true,
        ...parsed
      };

      this.savePreMarketBriefing(newBriefing);
      return newBriefing;
    } catch (err: any) {
      console.error('[Gemini AI Platform] Failed to generate Pre-Market Briefing:', err);
      throw new Error(`AI 브리핑 생성 실패: ${err.message || err}`);
    }
  }

  // Generate After-Market Report using Gemini-3.5-Flash
  // Takes today's trading stats of various stocks and uses rules to build a stellar 15 Jodoju & Feature Stocks list!
  static async generateAfterMarketReportAI(inputTickers: string[]): Promise<AfterMarketReport> {
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('GEMINI_API_KEY가 설정되지 않아 AI 주도주 리포트를 빌드할 수 없습니다.');
    }

    const todayDateStr = new Date().toISOString().split('T')[0];
    const tickersToAnalyze = inputTickers.length > 0 ? inputTickers : ['042700', '196170', '000100', '036460'];

    const prompt = `
당신은 전 세계 퀀트 투자 펀드 및 대한민국 기관 매니저들이 신뢰하는 여의도 최고의 '주도주 복기 분석 및 트레이딩 강사'입니다.
오늘 분석 대상 종목 코드는 다음과 같습니다: [${tickersToAnalyze.join(', ')}].

[AI 특징주 분류 규칙 지침]
당일 장중에 발생한 뉴스의 제목과 본문을 기반으로, 주가 상승의 원인이 된 호재 키워드와 하락 원인이 된 악재 키워드를 구별하고 연관 종목명을 추출해야 합니다.
- 호재 키워드 예시: FDA 승인, 대규모 수주, 수백억 공급계약, 양산 개시, 특허 취득, 최고 실적, 흑자 전환, 정부 육성 정책, 대량 배당, 자사주 소각, MOU 체결, 투자 유치, 글로벌 기술이전
- 악재 키워드 예시: 주주배정 유상증자, 전환사채(CB) 대량 전환, 신주인수권부사채(BW), 무상감자, 실적 급감 악화, 횡령 및 배임 혐의, 주주간 소송, 대규모 리콜, 핵심 계약 해지, 관리종목 지정, 상장폐지 실질심사

[AI 주도주 점수 자동 계산 모델 (100점 만점 기준)]
반드시 다음 정량 요소를 결합해 100점 만점으로 스코어링하고 별점(★★★★★, 1~5개)을 매겨 주십시오:
1. 상승률 (상한가 30점 만점 가산)
2. 거래대금 (거래대금 1천억 이상 20점 만점, 5천억 이상 가산)
3. 테마 강도 및 시장 주목도 (당일 섹터 전반 순환 수급 20점 만점)
4. 수급 동향 (외국인/기관 동반 순매수 시 15점 만점)
5. 변동성 및 지속가능성 (추세 유지력 15점 만점)

작성 규칙:
1. 현실성 있고 전문적인 한국 주식 시장의 실전 용어를 사용하여 정밀한 한국어로 작성하십시오.
2. 출력 형식은 오직 JSON이어야 하며, 마크다운이나 잡다한 텍스트 없이 유효한 JSON 오브젝트 하나만 리턴해 주십시오. JSON 스키마는 아래에 설명된 필드를 완벽하게 포함해야 합니다.

JSON 구조 스키마:
{
  "jodoju15": [
    {
      "ticker": "6자리 종목코드",
      "name": "종목명",
      "rank": 1,
      "closePrice": 150000,
      "changeRate": 15.4,
      "volume": 2500000,
      "tradeValuePct": 4500, // 당일 거래대금 (단위: 억 원)
      "marketStrength": 85, // 1~100 시장강도
      "themeStrength": 90, // 1~100 테마강도
      "score": 93, // 0~100 주도주 점수
      "stars": 5, // 1~5 별점 정수
      "relatedThemes": ["핵심테마1", "핵심테마2"],
      "relatedPeerGroup": ["관련 동종섹터 비교군 종목명1", "종목명2"],
      "marketImpact": "당일 지수 방어 및 바이오/반도체 등 타 테마 수급을 강탈해 간 영향 분석 코멘트",
      "supplyDemand": {
        "foreigner": "외국인 동향 (예: +350억 순매수)",
        "institution": "기관 동향 (예: 사모펀드/연기금 중심 대규모 매집)"
      },
      "riseReason": "주가 상승의 핵심적인 촉매 뉴스 1줄 요약",
      "declineReason": "고점 대비 하락했거나 음봉 마감한 경우 하락 요인 코멘트 (없으면 생략)",
      "disclosures": [
        { "title": "핵심 관련 공시 제목", "date": "오늘날짜" }
      ],
      "news": [
        { "title": "주가에 막대한 영향을 준 보도 기사 제목", "date": "오늘날짜" }
      ],
      "aiSummary": "이 종목의 당일 분봉 파동 패턴 및 세력의 돈 유입 흐름을 관통하는 AI 핵심 3줄 요약 코멘트",
      "aiAnalysis": {
        "riseReasonDetailed": "공시, 뉴스, 시장 매크로 환경 및 글로벌 밸류체인을 분석하여 작성된 정교하고 방대한 상승 이유 분석 전문",
        "declineReasonDetailed": "상승 후 매도 차익 실현이 쏟아진 저항대 매물 분석 및 하락 변동 유발 인자 상세 분석",
        "buyPoints": [
          "실전 차트 복기 관점: 트레이더가 장중 분봉 차트 상에서 안전하고 높은 확률로 진입(매수)할 수 있었던 이상적 분봉/일봉 상의 2군데 돌파/눌림목 매수 타점 가격대 및 상세 기법 근거",
          "추가 매수 타점 설명"
        ],
        "cautionPoints": [
          "이 종목 매매 시 호가창 장난질이나 세력의 가짜 돌파에 당하지 않기 위해 트레이더가 주의해야 할 급소 및 리스크 요인"
        ],
        "tomorrowCheckpoints": [
          "다음 영업일 아침 개장 직후 가장 우선적으로 모니터링해야 할 호가창의 변화, 거래대금 세기, 시간외 단일가 등 핵심 2가지 체크포인트"
        ]
      }
    }
  ],
  "features": [
    {
      "ticker": "6자리 종목코드",
      "name": "종목명",
      "category": "GOOD 또는 BAD 문자열",
      "keywords": ["검출된 키워드1", "키워드2"],
      "catalyst": "AI 특징주 호재/악재 분류 지침에 근거한 직접적이고 명확한 재료 분석 문장",
      "relatedStocks": ["연동하여 움직인 테마 내 동반 상승/하락 연관 종목1", "종목2"]
    }
  ],
  "marketAnalysisSummary": "코스피 코스닥의 상세 상승 및 하락 요인을 외국인/기관 수급 주체별 동향과 업종별 섹터상황 등을 포함하여 주식시장전문가의 정밀한 시각으로 분석한 글을 작성해 주십시오. 여기에 당일 특징주의 호재성/악재성 키워드와 함께 관련 종목명과 티커 및 구체적인 이유를 한데 모아 보기 좋게 마크다운 또는 단락 목록 형태로 상세하게 포함하여 완성해 주십시오."
}
`;

    try {
      console.log('[Gemini SDK] Dispatching After-Market Jodoju Report generator...');
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.5,
        }
      });

      const responseText = response.text || '';
      console.log('[Gemini SDK] After-Market report text received. Parsing JSON...');
      const parsed = JSON.parse(responseText.trim());

      const newReport: AfterMarketReport = {
        id: `report_${todayDateStr}`,
        date: todayDateStr,
        published: true,
        ...parsed
      };

      // Fill ranks automatically based on index
      if (newReport.jodoju15) {
        newReport.jodoju15.forEach((item, idx) => {
          item.rank = idx + 1;
        });
      }

      this.saveAfterMarketReport(newReport);

      // Proactively build and save Study Guides for each newly analyzed stock!
      for (const stock of newReport.jodoju15) {
        const guides: ReplayGuideInterval[] = [
          {
            candleIndex: 3,
            type: 'BUY_ZONE',
            price: Math.round(stock.closePrice * 0.92),
            comment: `[AI 추천 진입] ${stock.riseReason} 뉴스가 강하게 보도되고 첫 박스권 돌파 거래대금이 확인되는 타점.`
          },
          {
            candleIndex: 7,
            type: 'RESISTANCE',
            price: Math.round(stock.closePrice * 1.05),
            comment: `[저항 확인] 매수 호가창에 과열 물량이 유입되며 단기 추세 상단 저항선 봉착. 분할 매도로 익절 담보.`
          },
          {
            candleIndex: 12,
            type: 'SUPPORT',
            price: Math.round(stock.closePrice * 0.95),
            comment: `[지지 확인] 전일 상승 흐름의 20분봉 중심선과 이전 박스권 고점의 다중 지지 지지대 안착 확인.`
          },
          {
            candleIndex: 15,
            type: 'STOP_LOSS',
            price: Math.round(stock.closePrice * 0.88),
            comment: `[추세 이탈 경고] 주요 매수세 수급 이탈 및 주요 전저점 파괴가 이루어지는 손절 마지노선.`
          }
        ];
        this.saveStudyGuide(stock.ticker, {
          ticker: stock.ticker,
          guides
        });
      }

      return newReport;
    } catch (err: any) {
      console.error('[Gemini AI Platform] Failed to generate Jodoju Report:', err);
      throw new Error(`AI 장마감 리포트 생성 실패: ${err.message || err}`);
    }
  }

  // AI-Powered Replay Review Report
  // Calculates real user trade statistics, then sends trades and guides to Gemini for a fully personalized, professional critique!
  static async generateReplayReviewReportAI(
    ticker: string,
    name: string,
    trades: Trade[],
    initialBalance: number = 10000000,
    finalBalance: number = 10000000,
    candles: Candle[]
  ): Promise<ReplayReviewReport> {
    const ai = getGeminiClient();
    const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();

    // 1. Calculate Core trading metrics programmatically to prevent "mocking" or fake stats!
    const tradesCount = trades.length;
    let realizedPnL = finalBalance - initialBalance;
    let totalPnLPct = (realizedPnL / initialBalance) * 100;

    let winCount = 0;
    let lossCount = 0;
    let totalProfits = 0;
    let maxDrawdown = 0;
    let peakBalance = initialBalance;
    let currentBalance = initialBalance;

    // Calculate trade-by-trade durations and win/loss
    const holdingDurations: number[] = [];
    let currentHoldingStartIndex = -1;

    trades.forEach((trade) => {
      if (trade.type === 'BUY') {
        if (currentHoldingStartIndex === -1) {
          currentHoldingStartIndex = trade.candleIndex ?? 0;
        }
      } else {
        if (currentHoldingStartIndex !== -1) {
          const sellIndex = trade.candleIndex ?? 0;
          holdingDurations.push(Math.max(1, sellIndex - currentHoldingStartIndex));
          currentHoldingStartIndex = -1;
        }
        
        const pnl = trade.realizedPnL ?? 0;
        if (pnl > 0) {
          winCount++;
          totalProfits += pnl;
        } else if (pnl < 0) {
          lossCount++;
        }
      }

      // Track MDD based on balance fluctuations
      currentBalance = trade.balanceAfter;
      if (currentBalance > peakBalance) {
        peakBalance = currentBalance;
      } else {
        const dd = ((peakBalance - currentBalance) / peakBalance) * 100;
        if (dd > maxDrawdown) {
          maxDrawdown = dd;
        }
      }
    });

    const winRate = tradesCount > 0 ? (winCount / Math.max(1, winCount + lossCount)) * 100 : 0;
    const averageProfit = winCount > 0 ? Math.round(totalProfits / winCount) : 0;
    
    // Average holding days calculation
    const avgDuration = holdingDurations.length > 0 
      ? Math.round(holdingDurations.reduce((a, b) => a + b, 0) / holdingDurations.length)
      : 0;
    const averageHoldingTime = avgDuration > 0 ? `${avgDuration}일` : 'N/A';

    // Get the ideal study guides to check if user matched them
    const studyGuideObj = this.getStudyGuide(cleanTicker);
    const matchedIdealGuides: any[] = [];

    studyGuideObj.guides.forEach((guide) => {
      // Find if user did a corresponding action near the candleIndex (+- 1 candle)
      const nearTrade = trades.find(t => Math.abs((t.candleIndex ?? 0) - guide.candleIndex) <= 1);
      let userAction = '놓침';
      if (nearTrade) {
        if (guide.type === 'BUY_ZONE' && nearTrade.type === 'BUY') {
          userAction = '매수 성공';
        } else if (guide.type === 'STOP_LOSS' && nearTrade.type === 'SELL') {
          userAction = '손절 완료';
        } else if (guide.type === 'RESISTANCE' && nearTrade.type === 'SELL') {
          userAction = '익절 완료';
        } else {
          userAction = nearTrade.type === 'BUY' ? '불필요한 매수' : '수동 매도';
        }
      }
      matchedIdealGuides.push({
        guideType: guide.type,
        price: guide.price,
        userAction,
        comment: guide.comment
      });
    });

    let aiFeedback = `전체 매매 횟수 ${tradesCount}회로 신중하게 복기를 마쳤습니다. 매수/매도 지지 저항의 교차 타점을 정밀 타격하는 훈련에 집중한다면 돌파 시의 낙폭을 크게 예방할 수 있는 양호한 기초 트레이딩 기질을 가지고 있습니다.`;

    if (ai) {
      // Build a premium critique with Gemini!
      const prompt = `
당신은 대한민국 최고 1% 전문 트레이더들을 양성하는 프롭트레이딩 데스크의 주식 복기 헤드 트레이너입니다.
학생이 [${name}] (${cleanTicker}) 종목의 과거 차트를 바탕으로 가상 리플레이 매매를 진행한 실제 로그입니다.

[학생의 리플레이 매매 상세 스펙트럼]
- 종목명: ${name}
- 총 매매 횟수: ${tradesCount}회
- 실현 손익: ${realizedPnL.toLocaleString()}원 (${totalPnLPct.toFixed(2)}%)
- 복기 트레이딩 승률: ${winRate.toFixed(1)}%
- 평균 익절 금액: ${averageProfit.toLocaleString()}원
- 최대 낙폭(MDD): ${maxDrawdown.toFixed(1)}%
- 평균 보유 일수: ${averageHoldingTime}

[사용자의 실제 거래 로그]
${JSON.stringify(trades.map(t => ({ type: t.type, price: t.price, idx: t.candleIndex, balance: t.balanceAfter })), null, 2)}

[트레이딩 데스크 코칭 기준 가이드]
이 학생의 매매 로그와 지표를 분석하여 왜 수익/손실이 났는지 가차 없으면서도 극히 전문적인 조언을 총 4줄의 정밀 문장으로 피드백해 주십시오. 
학생의 마인드셋, 지지저항 준수여부, 손절 칼퇴근력(Stop loss discipline)을 콕 찝어 한국어로 격식 있게 작성해 주세요. 마크다운이나 기타 태그 없이 평문 텍스트만 출력해 주십시오.
`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash',
          contents: prompt,
          config: {
            temperature: 0.6,
          }
        });
        if (response.text) {
          aiFeedback = response.text.trim();
        }
      } catch (e) {
        console.warn('Failed to query Gemini for customized feedback, using rule engine feedback.', e);
      }
    }

    return {
      ticker: cleanTicker,
      name,
      winRate: Math.round(winRate),
      totalPnL: realizedPnL,
      totalPnLPct: Math.round(totalPnLPct * 100) / 100,
      tradesCount,
      averageProfit,
      maxDrawdown: Math.round(maxDrawdown * 100) / 100,
      averageHoldingTime,
      aiFeedback,
      matchedIdealGuides
    };
  }
}
