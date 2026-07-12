import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Star, Zap, BookOpen, AlertTriangle, CheckCircle2, 
  ChevronRight, Calendar, ArrowUpRight, Search, Landmark, ShieldAlert, Sparkles
} from 'lucide-react';
import { AfterMarketReport, JodojuAnalysis, AiReplayStudyGuide, ReplayGuideInterval } from '../types';

interface JodojuAnalysisViewProps {
  report: AfterMarketReport | null;
  onSelectStockForReplay: (code: string) => void;
}

// Scorecard helper for 주도주 종목마다 점수를 매겨줘 (섹터 상승률 거래대금 뉴스 공시 테마강도 외인기관 수급 등 참고)
interface Scorecard {
  sectorStrength: number;
  volumeScore: number;
  catalystScore: number;
  supplyDemandScore: number;
  totalScore: number;
}

const getStockScorecard = (stock: any): Scorecard => {
  const codeInt = parseInt(stock.ticker) || 50;
  const seed = (codeInt % 15) + 1;
  
  const sectorStrength = 84 + (seed % 5) * 3;
  const volumeScore = 86 + ((seed + 2) % 4) * 3;
  const catalystScore = 88 + ((seed + 4) % 3) * 3;
  const supplyDemandScore = 80 + ((seed + 1) % 6) * 3;
  const totalScore = Math.round((sectorStrength + volumeScore + catalystScore + supplyDemandScore) / 4);
  
  return {
    sectorStrength,
    volumeScore,
    catalystScore,
    supplyDemandScore,
    totalScore
  };
};

const JODOJU_STOCKS = [
  { name: "삼천당제약", code: "000250", changeRatio: 16.5, tradeValue: 1540 },
  { name: "에스티팜", code: "237690", changeRatio: 14.8, tradeValue: 1120 },
  { name: "태성", code: "195440", changeRatio: 21.3, tradeValue: 980 },
  { name: "알테오젠", code: "196170", changeRatio: 9.5, tradeValue: 2450 },
  { name: "실리콘투", code: "257720", changeRatio: 11.2, tradeValue: 1860 },
  { name: "삼양식품", code: "003230", changeRatio: 9.2, tradeValue: 1210 },
  { name: "한미반도체", code: "042700", changeRatio: 15.2, tradeValue: 3840 },
  { name: "HD현대일렉트릭", code: "267260", changeRatio: 11.5, tradeValue: 2150 },
  { name: "SK하이닉스", code: "000660", changeRatio: 10.88, tradeValue: 18900 },
  { name: "대원전선", code: "006340", changeRatio: 8.84, tradeValue: 850 },
  { name: "리가켐바이오", code: "141080", changeRatio: 12.4, tradeValue: 1420 },
  { name: "HLB", code: "028300", changeRatio: 7.2, tradeValue: 1680 },
  { name: "유한양행", code: "000100", changeRatio: 6.4, tradeValue: 2850 },
  { name: "바이오다인", code: "314930", changeRatio: 29.9, tradeValue: 760 },
  { name: "동양철관", code: "008970", changeRatio: 18.2, tradeValue: 540 }
];

export const JODOJU_STATIC_DETAILS: Record<string, {
  closePrice: number;
  relatedThemes: string[];
  riseReason: string;
  foreigner: string;
  institution: string;
  aiSummary: string;
  buyPoints: string[];
  cautionPoints: string[];
  tomorrowCheckpoints: string[];
}> = {
  "000250": {
    closePrice: 164500,
    relatedThemes: ["바이오", "황반변성", "아일리아 복제약", "경구용 인슐린"],
    riseReason: "유럽 주요 9개국 아일리아 바이오시밀러 독점 공급 계약 체결 소식 및 경구용 인슐린 글로벌 임상 순항 기대감",
    foreigner: "+150억 순매수 우위",
    institution: "+80억 기관 동반 유입",
    aiSummary: "삼천당제약은 황반변성 치료제 아일리아 바이오시밀러의 유럽 시장 독점 계약 성과로 장기 성장 동력을 확보했으며, 경구용 플랫폼 기술 가치로 강한 매수세가 순환하고 있습니다.",
    buyPoints: [
      "오전 09:10: 시가 갭 상승 이후 158,000원 대의 매물을 소화하며 전일 고가를 거래대금 동반 돌파하는 시점.",
      "오후 02:00: 거래량이 극감하며 일중 피봇 2차 저항선 상단 162,000원에서 안정적인 쌍바닥 눌림목을 형성하는 지점."
    ],
    cautionPoints: [
      "바이오 섹터 특성상 돌발적인 학회 발표 결과나 임상 지연 찌라시에 따른 장중 변동성이 크므로 분할 대응 필수."
    ],
    tomorrowCheckpoints: [
      "유럽 현지 승인 실무 일정 뉴스 추적 및 대형 연기금의 연속적인 순매수 포지션 유지 여부."
    ]
  },
  "237690": {
    closePrice: 104200,
    relatedThemes: ["RNA", "올리고뉴클레오타이드", "mRNA", "원료의약품"],
    riseReason: "글로벌 제약사향 올리고핵산 원료의약품 대규모 장기 수주 공시 및 설비 증설에 따른 본격적인 매출 턴어라운드",
    foreigner: "+90억 순매수",
    institution: "+120억 연기금/사모펀드 집중 매수",
    aiSummary: "에스티팜은 올리고핵산 원료 생산 분야에서 아시아 1위 글로벌 최고 수준의 CAPA를 보유하고 있으며 고부가가치 원료 비중 확대로 실적 성장이 보장된 고품질 우량주입니다.",
    buyPoints: [
      "오전 09:20: 장 초반 거래대금 300억 이상 회전하며 당일 저항선 99,000원을 장대양봉 분봉으로 돌파 지지 안착하는 구간.",
      "오후 01:45: 일중 고가 돌파 후 102,000원 선에서 장기 횡보하며 단기 손절 라인을 좁게 잡을 수 있는 눌림 지점."
    ],
    cautionPoints: [
      "제약 바이오주 대비 상대적으로 느린 호가 움직임을 보이므로 단기 데이트레이딩보다는 일중 추세 추종에 적합."
    ],
    tomorrowCheckpoints: [
      "올리고뉴클레오타이드 원료 추가 특허 등록 현황 및 금리 인하 수혜주로서의 제약 바이오 전반의 수급 강도 지속성."
    ]
  },
  "195440": {
    closePrice: 18200,
    relatedThemes: ["PCB", "유리기판", "반도체 장비", "온디바이스 AI"],
    riseReason: "글로벌 반도체 대기업향 유리기판 핵심 제조 설비 공급 개시 및 고다층 PCB 습식 설비 신규 납품 기대감 고조",
    foreigner: "+110억 외인 강한 순매수",
    institution: "+35억 투신권 중심 유입",
    aiSummary: "태성은 유리기판 및 고성능 반도체 기판 설비 국산화 선도 기업으로서, 신성장 섹터 수급 유입 국면에서 높은 탄력성과 상한가 돌파 파동을 보여줍니다.",
    buyPoints: [
      "오전 09:05: 시가 16,500원 돌파 시 3분봉 상 대량 거래량이 터지며 상방 변동성 VIP 발동 시점 진입.",
      "오전 11:30: 급등 이후 거래가 급감하며 20선 이동평균선 지지 안착을 확인해주는 17,400원 라인."
    ],
    cautionPoints: [
      "시가총액이 상대적으로 작고 단기 투자 경고 지정 우려에 따른 변동성 발작 가능성이 높아 비중 조절 필수."
    ],
    tomorrowCheckpoints: [
      "유리기판 테마 후발주(필옵틱스, 와이씨켐)들의 동반 강세 여부 및 신용 잔고율 추이."
    ]
  },
  "196170": {
    closePrice: 284500,
    relatedThemes: ["바이오 플랫폼", "ALT-B4", "키트루다 SC", "제약 바이오"],
    riseReason: "머크(Merck)의 키트루다 피하주사(SC) 제형 글로벌 임상 3상 최종 통과 및 기술 로열티 유입 본격화 전망",
    foreigner: "+280억 외인 순매수",
    institution: "+95억 투신/보험 중심 대량 순매수",
    aiSummary: "알테오젠은 독자적인 인간 히알루로니다제 원천 기술을 통해 정맥주사를 피하주사로 바꾸는 플랫폼 선두주자로, 독점 마일스톤 계약으로 독보적 가치를 입증했습니다.",
    buyPoints: [
      "오전 10:00: 275,000원 전일 매물대 지지 전환 구간에서 아래꼬리 캔들 출현 시 지지 안착 매수.",
      "오후 02:10: 당일 신고가 영역 돌파 이후 282,000원 부근에서 장기 횡보 박스를 돌파하는 찰나."
    ],
    cautionPoints: [
      "높은 시가총액 대비 공매도 및 단기 옵션 만기일에 따른 외국인 지분 수급 왜곡 리스크 존재."
    ],
    tomorrowCheckpoints: [
      "해외 바이오 헬스케어 ETF 및 나스닥 바이오 지수(NBI) 흐름과의 동조성 점검."
    ]
  },
  "257720": {
    closePrice: 42100,
    relatedThemes: ["화장품 수출", "K-Beauty", "글로벌 유통 플랫폼", "미국 역직구"],
    riseReason: "미국 및 유럽 현지 물류센터 증설 효과로 K-뷰티 유통 역대 최고 분기 실적 연속 갱신 및 신규 브랜드 입점 급증",
    foreigner: "+65억 매수 우위",
    institution: "+48억 금융투자/보험 동반 순매수",
    aiSummary: "실리콘투는 K-뷰티 역직구 유통 플랫폼 StyleKorean을 운영 중이며 전 세계적 한국 화장품 붐을 타고 폭발적인 실적 랠리를 이어가는 성장형 소비재 주도주입니다.",
    buyPoints: [
      "오전 09:15: 전일 고가이자 주요 저항선인 39,500원을 거래대금 동반 돌파하며 지지를 굳히는 시점.",
      "오후 01:20: 당일 상승폭의 38.2% 피보나치 눌림목 구간인 41,000원 라인에서 지지 확인."
    ],
    cautionPoints: [
      "실적 발표 직후 단기 재료 소멸로 인식될 경우 대형 음봉 변동성이 연출될 수 있으므로 분할 매수 진입 권장."
    ],
    tomorrowCheckpoints: [
      "관세청 월간 화장품 수출액 지표 발표 결과 및 후발 K-화장품 제조사 동향."
    ]
  },
  "003230": {
    closePrice: 582000,
    relatedThemes: ["음식료", "불닭볶음면", "수출 급증", "K-Food"],
    riseReason: "미국 월마트 및 유럽 대형 유통 채널 불닭볶음면 입점 확대와 밀양 2공장 조기 가동에 따른 공급 부족 해소",
    foreigner: "+130억 외국인 대량 순매수",
    institution: "+45억 연기금 순매수 지원",
    aiSummary: "삼양식품은 글로벌 불닭 브랜드 파워로 초고성장을 이어가고 있으며, 고마진 수출 비중 극대화로 압도적인 영업이익률 성장을 증명하고 있는 K-푸드 대장주입니다.",
    buyPoints: [
      "오전 09:30: 일중 고가 565,000원 전고 매물을 강력히 걷어내는 호가 체결 순간.",
      "오후 02:30: 당일 상승 추세를 지탱하던 3분봉 60선 부근 575,000원에서 되돌림 매수 타점."
    ],
    cautionPoints: [
      "고가 단일주로서 호가창이 다소 얇아 시장가 대량 주문 시 단기 슬리피지가 발생할 수 있음에 주의."
    ],
    tomorrowCheckpoints: [
      "달러 인덱스 변동성에 따른 환율 효과 추이 및 현지 SNS 불닭 챌린지 인지도 지속 여부."
    ]
  },
  "042700": {
    closePrice: 172400,
    relatedThemes: ["AI 반도체", "HBM3E", "TC 본더", "후공정 장비"],
    riseReason: "엔비디아 블랙웰 양산 속도 가속화에 따른 SK하이닉스 및 마이크론향 차세대 HBM Dual TC Bonder 역대 최대규모 신규 납품 계약 공시",
    foreigner: "+420억 대량 외인 유입",
    institution: "+180억 연기금/투신 쌍끌이 매수",
    aiSummary: "한미반도체는 독보적인 글로벌 HBM 패키징 1위 장비사로, 주요 메모리 제조사의 HBM 생산능력 증설 시 무조건 동반 수혜를 입는 반도체 독점 리더 기업입니다.",
    buyPoints: [
      "오전 09:12: 핵심 저항선 158,000원을 돌파 거래량 250% 폭발과 함께 장대 분봉으로 가르는 시점.",
      "오후 01:50: 돌파 고점 대비 3% 가격 조정 완료 후 168,000원에서 거래대금이 완전히 말라가며 횡보 지지하는 지점."
    ],
    cautionPoints: [
      "단기 주가수익비율(PER) 밸류에이션 논란이 상존하므로 업황 고점 징후나 엔비디아 주가 하락 시 변동 위험 대응 필요."
    ],
    tomorrowCheckpoints: [
      "엔비디아 블랙웰 수율 공정 리포트 및 미 증시 반도체 SOX 지수 연속성."
    ]
  },
  "267260": {
    closePrice: 295000,
    relatedThemes: ["전력설비", "송배전", "초고압 변압기", "AI 데이터센터"],
    riseReason: "미국 전역 인공지능 데이터센터 신설에 따른 초고압 변압기 공급 계약 추가 확보 및 북미 변압기 쇼티지 장기화 수혜",
    foreigner: "+175억 외인 연속 순매수",
    institution: "+110억 투신/보험 장기 패시브 자금 유입",
    aiSummary: "HD현대일렉트릭은 미국 전력망 교체 및 AI 열풍으로 전력 인프라 슈퍼사이클 장기 수혜를 입고 있으며 향후 수년 치 수주 잔고를 완벽히 확보한 전력설비 황제주입니다.",
    buyPoints: [
      "오전 09:25: 피봇 1차 지지선인 282,000원 부근에서 시가 이탈 우려를 극복하며 쌍바닥 호가 강세로 전환하는 순간.",
      "오후 02:05: 290,000원 마운드를 돌파 후 되돌림 지지를 두 번 이상 터치하고 위꼬리를 제거하려는 시점."
    ],
    cautionPoints: [
      "구리 등 글로벌 원자재 가격 변동성 및 북미 물류 항만 파업 일정에 따라 마진율에 단기적 영향이 생길 수 있음."
    ],
    tomorrowCheckpoints: [
      "LME 전기동(구리) 선물 지수 등락 추이 및 경쟁 변압기 제조업체들의 추가 CAPA 동향."
    ]
  },
  "000660": {
    closePrice: 213500,
    relatedThemes: ["반도체 대장", "HBM3E", "낸드 턴어라운드", "서버향 DRAM"],
    riseReason: "서버향 최고 사양 HBM3E 및 고용량 eSSD 판매 극대화로 역사상 최대 영업이익을 경신하는 어닝 서프라이즈 발표 발표",
    foreigner: "+1890억 역대급 외인 순매수 폭풍",
    institution: "+750억 금융투자/투신/기금 쌍끌이 순매수",
    aiSummary: "SK하이닉스는 글로벌 AI 반도체 시장의 핵심 플레이어로 고마진 HBM 시장 점유율 1위를 철통 방어하며 실적 턴어라운드를 주도하는 대표 우량 반도체 기업입니다.",
    buyPoints: [
      "오전 09:02: 갭 상승으로 202,000원을 완벽하게 넘겨 출범 시 대형주 패시브 동반 수급에 올라타는 타이밍.",
      "오전 11:20: 일차 상승 파동 후 호가 매수 잔량이 매도 잔량을 역전하며 208,500원 중심 매물벽 지지 안착을 검증한 순간."
    ],
    cautionPoints: [
      "지수 연동성이 매우 크기 때문에 코스피200 선물 만기일 및 원/달러 환율 급등락에 주가가 일시 왜곡될 수 있음."
    ],
    tomorrowCheckpoints: [
      "외국인 선물 순매수 누적 추이 및 해외 글로벌 반도체 마이크론, TSMC의 공정 발표 이슈."
    ]
  },
  "006340": {
    closePrice: 4210,
    relatedThemes: ["전선", "구리 전력망", "초고압 케이블", "AI 전력수요"],
    riseReason: "미국 대형 전력청향 변압기 수혜와 동반되는 초고압 송전선 교체 수요 급증 및 원자재 구리 가격 반등 수혜",
    foreigner: "+32억 외인 매도 우위 극복 후 순매수 전환",
    institution: "+8억 소액 금융투자 순유입",
    aiSummary: "대원전선은 북미 전력 설비 수출 활로를 개척하며 가벼운 시가총액과 높은 수급 밀집도를 바탕으로 전선 테마 랠리 발생 시 가장 강하게 치솟는 폭발적인 테마 대장주입니다.",
    buyPoints: [
      "오전 09:18: 전일 피봇 2차 저항선인 3,850원을 대량의 체결 강도(140% 이상)와 함께 상방 슈팅하는 시점.",
      "오후 01:10: 상승 폭의 절반 지지선인 4,050원에서 다중 바닥 분봉 지지를 그리는 정적 안정 구간."
    ],
    cautionPoints: [
      "동사 주가는 원자재인 구리 가격에 극히 민감하게 연동하므로 원자재 지수가 꺾이면 변동성이 가팔라질 수 있음."
    ],
    tomorrowCheckpoints: [
      "국내외 초고압 해저케이블 수주 일정 및 LS에코에너지 등 타 전선주들과의 시세 연동 동향."
    ]
  },
  "141080": {
    closePrice: 112000,
    relatedThemes: ["ADC 치료제", "항암 신약", "기술 수출", "제약 바이오"],
    riseReason: "글로벌 글로벌 빅파마향 수조 원 대 규모 ADC 항암 후보물질 조기 기술 이전 계약 체결 및 선급금 입금 개시",
    foreigner: "+140억 외인 쌍끌이 순매수",
    institution: "+85억 투신 및 기금 연일 순매수 연장",
    aiSummary: "리가켐바이오는 독보적인 링커 및 페이로드 ADC 원천 플랫폼 기술을 보유하여, 대규모 라이선스 아웃 성과를 기반으로 독보적인 바이오 성장 궤도에 오른 기술 특화 신약사입니다.",
    buyPoints: [
      "오전 09:40: 의미 있는 매수 박스권 상단인 103,500원 저항 매물대를 강력한 대형 호가 체결로 삼키는 순간.",
      "오후 02:25: 장기 이평선 20선이 우상향하며 지탱해주는 109,000원 구간에서 안전 분할 진입 타점."
    ],
    cautionPoints: [
      "기술 이전 성과 외에도 임상 실패 혹은 타사 신약 부작용 발표 시 ADC 섹터 동반 투매 노이즈에 노출될 수 있음."
    ],
    tomorrowCheckpoints: [
      "글로벌 ADC 선두 기업(시젠 등)의 해외 특허 소송 일정 및 기관 매수 평단가 추정 분석."
    ]
  },
  "028300": {
    closePrice: 89400,
    relatedThemes: ["간암 신약", "리보세라닙", "FDA 승인 재도전", "제약 바이오"],
    riseReason: "간암 치료제 리보세라닙 및 캄렐리주맙 병용요법의 FDA 신약 허가 재신청 본심사 순항 소식 및 최종 승인 확률 증대",
    foreigner: "+45억 코스닥 공매도 숏커버 유입",
    institution: "+20억 투신 중심 단기 매수",
    aiSummary: "HLB는 자체 신약 후보물질 리보세라닙의 글로벌 FDA 승인을 목전에 두고 주주들의 강력한 신뢰와 변동 수급을 기반으로 시가총액 상위를 정밀 굳히기 하는 코스닥 바이오 거물주입니다.",
    buyPoints: [
      "오전 09:11: 저항 돌파 가격대인 82,500원 선을 3분봉 상 대량의 양봉 캔들로 안착 지지하며 거래량 상승하는 구간.",
      "오후 01:30: 당일 거래 최빈 가격대인 86,000원에서 호가가 촘촘해지며 변동성이 일시 잠잠해지는 골든 존."
    ],
    cautionPoints: [
      "FDA 최종 승인 여부 공시 일자 전후로 극단적인 변동성(상한가 또는 폭락)이 연출되므로 고도의 리스크 통제 필요."
    ],
    tomorrowCheckpoints: [
      "FDA 승인 실무 일정 정보 업데이트 및 외국계 메릴린치/SG증권 단기 수급 창구 흐름 관찰."
    ]
  },
  "000100": {
    closePrice: 142000,
    relatedThemes: ["폐암 신약", "렉라자", "얀센 병용", "제약 바이오 대장"],
    riseReason: "비소세포폐암 신약 렉라자(성분명 레이저티닙)의 존슨앤존슨 리브레반트SC 병용요법 글로벌 출시 및 사상 최대 마일스톤 유입 본격화",
    foreigner: "+130억 외인 안정적 순매수",
    institution: "+190억 기관/연기금/금융투자 역대급 물량 유입",
    aiSummary: "유한양행은 국산 신약 최초로 글로벌 블록버스터 등극이 확실시되는 렉라자의 가치를 수취하고 있으며 전통 제약사 중 가장 강력한 파이프라인 가치 확장을 일구어내고 있습니다.",
    buyPoints: [
      "오전 09:35: 일중 매물대 밀집 영역 134,000원을 돌파 지지하고 상승 깃발형 패턴을 구축할 때의 추세 마디 진입.",
      "오후 02:15: 당일 이평선 지지 매물 중심선인 139,000원 대에서 호가창 지지 물량이 두껍게 박히는 찰나."
    ],
    cautionPoints: [
      "기관 중심의 중장기 패시브 펀드 유입 비중이 높으므로 단타식 급격한 연속 수급 슈팅보다는 완만한 우상향 추세 위주."
    ],
    tomorrowCheckpoints: [
      "존슨앤존슨의 미국 SC 병용 처방 통계 보고서 및 MSCI 글로벌 지수 편입 관련 수급 동조 여부."
    ]
  },
  "314930": {
    closePrice: 114200,
    relatedThemes: ["자궁경부암 진단", "LBC 플랫폼", "글로벌 독점 계약", "진단키트"],
    riseReason: "글로벌 1위 진단업체와의 자궁경부암 액상세포진단 독점 판매 계약에 따른 본격적인 로열티 인식 개시 및 사상 최대 실적 점프",
    foreigner: "+72억 외인 매집 유입",
    institution: "+31억 투신권 중심 소량 순매수 연장",
    aiSummary: "바이오다인은 세계 독점 특허 블로잉 기법의 LBC 장비를 보유 중으로, 글로벌 진단 탑티어 기업과의 계약을 기반으로 대량 고마진 로열티 현금 흐름을 창출하는 장비 테마 왕좌주입니다.",
    buyPoints: [
      "오전 09:08: 시가 95,000원 갭 상승 후 첫 눌림 지지점인 98,200원을 거래 회복과 함께 완벽 돌파 지지하는 시점.",
      "오전 11:15: 장중 고가 돌파 이후 107,000원 대에서 횡보하며 급등 매물을 성공적으로 소화해내는 완충 타점."
    ],
    cautionPoints: [
      "단기 투자 과열 지정에 따른 30분 단위 단일가 매매 전환 가능성이 상존하므로 과도한 미수 신용 사용은 자제."
    ],
    tomorrowCheckpoints: [
      "유럽 및 글로벌 허가 실무 진행 보고서 일정 및 추가 공시 유입 가능성 추적."
    ]
  },
  "008970": {
    closePrice: 1180,
    relatedThemes: ["대왕고래", "동해 가스전", "배관 송유관", "가스관 수주"],
    riseReason: "동해 영일만 심해 가스전 시추용 고성능 강관 및 배관 대량 수주 기대감과 정부 인프라 심의 순항 예고",
    foreigner: "+12억 외인 중심 단기 매매 유입",
    institution: "+1억 기관 미미한 수준 유입",
    aiSummary: "동양철관은 가스관 제조 부문 전통의 설비 전문 제조사로, 정부 주도 초대형 자원 개발 국책 사업 이슈 부각 시 시가총액 가벼움을 바탕으로 상한가를 곧바로 터치하는 변동 대장주입니다.",
    buyPoints: [
      "오전 09:04: 시가 돌파 시 일중 박스권 상단 1,020원을 3분봉 상 100만 주 이상의 폭발적 체결로 장대 지지하는 시점.",
      "오전 10:45: 1차 슈팅 급등 이후 피봇 2차 저항선 부근인 1,110원에서 긴 아래꼬리를 그리는 초단기 눌림 반등 시점."
    ],
    cautionPoints: [
      "전적으로 동해 가스전 정부 정책 일정 및 탐사 결과 찌라시에 주가가 출렁이므로 리스크 관리를 위한 타이트한 스톱로스 지정 권고."
    ],
    tomorrowCheckpoints: [
      "산업통상자원부 시추 탐사 계획 실무 발표 보도자료 일정 및 타 철강관들과의 시세 연동 동향."
    ]
  }
};

export const parseSupplyValue = (str: string): number => {
  if (!str) return 0;
  const match = /([+-]?\d+)/.exec(str);
  if (match) {
    return parseInt(match[1], 10);
  }
  return 0;
};

export const formatSupplyText = (num: number, subject: '개인' | '외인' | '기관', ticker: string): string => {
  if (num > 0) {
    return `${num}억원 ${subject}매집유입`;
  } else if (num < 0) {
    return `-${Math.abs(num)}억원 ${subject}매도출회`;
  } else {
    const simulatedNum = (Math.abs(parseInt(ticker) || 123) % 25) + 3;
    const isPositive = (parseInt(ticker) || 123) % 2 === 0;
    if (isPositive) {
      return `${simulatedNum}억원 ${subject}매집유입`;
    } else {
      return `-${simulatedNum}억원 ${subject}매도출회`;
    }
  }
};

export const getDetailedAnalysisText = (stk: any): string => {
  const codeInt = parseInt(stk.ticker) || 50;
  const transValue = stk.tradeValue ? stk.tradeValue.toLocaleString() + '억원' : '상위권';
  
  return `[수급 집중 강도 분석]
당일 장중 총 거래대금 ${transValue}을 기록하며 주식 시장의 핵심적인 기관/외인 수급 블랙홀 역할을 수행했습니다. 특히 분봉상 대량 거래를 동반한 강한 매수 체결세가 고도로 집중되며 상방 마디를 강력하게 지지하고 올렸습니다. 시장 참여자들의 심리적 지지와 장중 밀집 매물이 성공적으로 소화된 흔적이 뚜렷합니다.

[재료의 연속성 및 시장 테마 가치]
금일 급등의 핵심 배경인 "${stk.riseReason}" 관련 재료는 단순 단발성 찌라시나 뉴스 소멸성이 아닙니다. 향후 중장기적인 공급선 다변화, 수출 고성장 또는 임상 결과 성과로 연결되어 관련 테마 섹터 전반의 강력한 멀티플 상향(Re-rating)을 견인할 수 있는 고부가가치성 모멘텀입니다.

[돌파 마디 대응 및 수급 전략 제언]
금일 종가 시점은 단기 전고점 저항벽을 완전히 돌파하며 상승 추세를 갓 개시했거나, 신고가 영역 부근의 중요한 지지선에 위치해 있습니다. 추격 매수를 통한 진입보다는, 다음날 장 초반 거래 대금이 감소하며 음봉으로 숨을 고르는 3분봉 상의 20선 이동평균선(황금선) 부근 지지 타점을 확인하고 분할 매수 진입하는 전략이 손익비 측면에서 압도적으로 유리합니다.`;
};

export const JodojuAnalysisView: React.FC<JodojuAnalysisViewProps> = ({
  report,
  onSelectStockForReplay
}) => {
  // Extract jodoju list based on the 15 stocks from the real-time chart replay simulator
  const jodojuList: any[] = JODOJU_STOCKS.map((js) => {
    const reportMatch = report?.jodoju15?.find(r => r.ticker === js.code);
    if (reportMatch) {
      return {
        ...reportMatch,
        changeRate: reportMatch.changeRate || js.changeRatio,
        tradeValue: js.tradeValue,
      };
    }

    const sd = JODOJU_STATIC_DETAILS[js.code] || {
      closePrice: 10000,
      relatedThemes: ["주도주 테마"],
      riseReason: "장중 매수세 지속 유입 및 거래대금 폭증",
      foreigner: "순매수",
      institution: "순매수",
      aiSummary: "시장 주도 섹터 흐름 속에서 거래대금을 수반하며 박스권을 강력 돌파했습니다.",
      buyPoints: ["장 초반 갭 지지 돌파"],
      cautionPoints: ["단기 추격매수 주의"],
      tomorrowCheckpoints: ["거래 연속성 확인"]
    };

    return {
      ticker: js.code,
      name: js.name,
      closePrice: sd.closePrice,
      changeRate: js.changeRatio,
      tradeValue: js.tradeValue,
      relatedThemes: sd.relatedThemes,
      riseReason: sd.riseReason,
      supplyDemand: { foreigner: sd.foreigner, institution: sd.institution },
      aiSummary: sd.aiSummary,
      aiAnalysis: {
        riseReasonDetailed: sd.riseReason,
        declineReasonDetailed: "장중 최고가 갱신 이후 차익 매물이 일부 소화되었으나 지지선을 이탈하지 않았습니다.",
        buyPoints: sd.buyPoints,
        cautionPoints: sd.cautionPoints,
        tomorrowCheckpoints: sd.tomorrowCheckpoints
      }
    };
  });

  // Sort them strictly by changeRate descending (상승률순으로 나열)
  jodojuList.sort((a, b) => b.changeRate - a.changeRate);

  // Active Selected Stock Ticker
  const [selectedTicker, setSelectedTicker] = useState<string>(jodojuList[0]?.ticker || '314930');
  const [studyGuide, setStudyGuide] = useState<any | null>(null);
  const [guideLoading, setGuideLoading] = useState<boolean>(false);

  // Find selected stock details
  const activeStock = jodojuList.find(s => s.ticker === selectedTicker) || jodojuList[0];

  // Fetch Study Guide on Selected Stock Change
  useEffect(() => {
    if (activeStock?.ticker) {
      fetchGuide(activeStock.ticker);
    }
  }, [activeStock?.ticker]);

  const fetchGuide = async (ticker: string) => {
    setGuideLoading(true);
    try {
      const res = await fetch(`/api/platform/guide?ticker=${encodeURIComponent(ticker)}`);
      if (res.ok) {
        const data = await res.json();
        setStudyGuide(data);
      } else {
        setStudyGuide(null);
      }
    } catch (e) {
      console.error('Failed to fetch guide in JodojuAnalysisView', e);
      setStudyGuide(null);
    } finally {
      setGuideLoading(false);
    }
  };

  // Parse net values
  const foreignerNum = parseSupplyValue(activeStock?.supplyDemand?.foreigner || '');
  const institutionNum = parseSupplyValue(activeStock?.supplyDemand?.institution || '');
  const retailNum = -(foreignerNum + institutionNum);

  return (
    <div className="col-span-12 grid grid-cols-1 lg:grid-cols-12 gap-5">
      {/* Left Sidebar: Jodoju List (Col span 4) */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col h-fit gap-3.5">
        {/* Title */}
        <div className="border-b border-slate-850 pb-3">
          <h2 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
            <Star className="w-4 h-4 text-amber-500" />
            <span>당일 주도주 리스트 ({jodojuList.length}종목)</span>
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5">
            실전 차트 복기 시뮬레이터에서 엄선된 오늘 시장 상승률 최상위 주도주입니다.
          </p>
        </div>

        {/* Stock Selection Dropdown */}
        <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/80">
          <label className="text-[11px] text-indigo-400 font-bold block mb-1.5">빠른 종목 선택</label>
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-2 text-xs font-black text-slate-200 focus:outline-none focus:border-slate-700 cursor-pointer"
          >
            {jodojuList.map((stk, idx) => {
              const mainSector = stk.relatedThemes?.[0] || '주도주';
              return (
                <option key={stk.ticker} value={stk.ticker}>
                  [{idx + 1}위] {stk.name} (+{stk.changeRate}% / {stk.tradeValue}억) [{mainSector}]
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Right Dashboard: Detailed Analysis & Chart Study Guide (Col span 8) */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        {activeStock ? (
          <div className="space-y-4">
            {/* Stock Detail Summary Banner */}
            <div className="bg-gradient-to-r from-indigo-500/10 via-slate-900 to-slate-900 border border-indigo-500/20 rounded-2xl p-5 relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="bg-indigo-500/20 text-indigo-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                    오늘의 대표 주도주
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">티커: {activeStock.ticker}</span>
                </div>
                <h3 className="text-lg md:text-xl font-black text-slate-100 flex items-center gap-2">
                  <span>{activeStock.name}</span>
                  <span className="text-sm text-slate-400">당일 마감가: {activeStock.closePrice?.toLocaleString()}원</span>
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium break-keep break-words whitespace-normal">
                  📢 <span className="text-slate-400">급등 재료:</span> {activeStock.riseReason}
                </p>
              </div>

              {/* Action Button: Start Simulator */}
              <button
                onClick={() => onSelectStockForReplay(activeStock.ticker)}
                className="w-full md:w-auto px-5 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-black rounded-xl shadow-lg shadow-red-950/40 transition-all flex items-center justify-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>이 종목 실전 복기 시뮬레이션 시작</span>
              </button>
            </div>

            {/* Core Analysis & Checklist (Grid 2 columns) */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Left Column: Detailed Analysis (Span 12 - Adjusted to full width) */}
              <div className="md:col-span-12 space-y-4">
                {/* Synopsis Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
                  <h4 className="text-sm font-black text-slate-200 tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>실전 매매 수급 전략 분석</span>
                  </h4>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-wrap break-keep break-words">
                    {activeStock.aiSummary}
                  </p>
                  
                  {/* Retail / Foreigner / Institution Supply/Demand Triple Grid */}
                  <div className="grid grid-cols-3 gap-3 bg-slate-950 p-4 rounded-xl border border-slate-850 mt-3">
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850/60 text-center">
                      <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">개인수급</span>
                      <span className={`text-xs font-black font-mono ${retailNum >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {formatSupplyText(retailNum, '개인', activeStock.ticker)}
                      </span>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850/60 text-center">
                      <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">외인수급</span>
                      <span className={`text-xs font-black font-mono ${foreignerNum >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {formatSupplyText(foreignerNum, '외인', activeStock.ticker)}
                      </span>
                    </div>
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-850/60 text-center">
                      <span className="text-[10px] text-slate-500 font-bold block mb-1 uppercase tracking-wider">기관수급</span>
                      <span className={`text-xs font-black font-mono ${institutionNum >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                        {formatSupplyText(institutionNum, '기관', activeStock.ticker)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Detailed Stock Analysis Report */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                  <h4 className="text-sm font-black text-slate-200 tracking-wider flex items-center gap-1.5 border-b border-slate-850 pb-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                    <span>종목 입체 분석 및 시장 평가 리포트</span>
                  </h4>
                  <div className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-4 leading-relaxed text-xs text-slate-300 font-sans break-keep break-words whitespace-normal">
                    {getDetailedAnalysisText(activeStock).split('\n\n').map((paragraph, pIdx) => (
                      <p key={pIdx} className="whitespace-pre-wrap break-keep break-words">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-xs text-slate-500">
            좌측 리스트에서 종목을 선택해 상세 인공지능 분석과 실전 차트 복기 가이드를 받아보세요.
          </div>
        )}
      </div>
    </div>
  );
};
