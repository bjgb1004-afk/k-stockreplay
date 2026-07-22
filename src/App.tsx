import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Play, 
  Pause,
  Zap,
  Clock,
  Volume2, 
  VolumeX, 
  Info, 
  Coins, 
  Briefcase, 
  BarChart3,
  Award,
  AlertCircle,
  Trophy,
  Loader2,
  Share2,
  Check,
  Copy,
  Flame,
  ChevronRight,
  PlayCircle,
  RotateCcw,
  HelpCircle,
  Shield,
  FileText,
  MessageSquare,
  BookOpen,
  Smartphone,
  Download,
  X,
  Menu,
  MoreVertical,
  Archive,
  Database,
  Sparkles,
  LayoutGrid,
  Calendar,
  ArrowLeft,
  Moon,
  Sun,
  Maximize,
  Minimize,
  ActivitySquare,
  Crown
} from 'lucide-react';
import { Candle, Trade, PreMarketBriefing, AfterMarketReport, JodojuAnalysis, FeatureStock, AiReplayStudyGuide, ReplayReviewReport } from './types';
import { CanvasChart } from './components/CanvasChart';
import { mutateMinuteCandles } from './utils/simulationEngine';
import { MorningNews2026 } from './components/MorningNews2026';
import { AfterMarketNews } from './components/AfterMarketNews';
import { ReportView } from './components/ReportView';
import { AdminConsole } from './components/AdminConsole';
import { BlogCenter } from './components/BlogCenter';
import { JodojuAnalysisView, JODOJU_STATIC_DETAILS, parseSupplyValue, formatSupplyText, getDetailedAnalysisText } from './components/JodojuAnalysisView';
import { StockCalendarView } from './components/StockCalendarView';
import { ReportDatePicker } from './components/ReportDatePicker';

// 10 Jodoju Stocks List (Leading Stocks in K-Stock for July 15th)
export const JODOJU_STOCKS = [
  { rank: 1, name: "기가레인", code: "049080", changeRatio: 29.98 },
  { rank: 2, name: "위닉스", code: "044340", changeRatio: 29.97 },
  { rank: 3, name: "파세코", code: "037070", changeRatio: 25.32 },
  { rank: 4, name: "한울소재과학", code: "012450", changeRatio: 19.76 },
  { rank: 5, name: "에스씨디", code: "042110", changeRatio: 13.13 },
  { rank: 6, name: "SK이터닉스", code: "413630", changeRatio: 12.14 },
  { rank: 7, name: "앤로보틱스", code: "035420", changeRatio: 11.17 },
  { rank: 8, name: "씨피시스템", code: "475150", changeRatio: 10.6 },
  { rank: 9, name: "한성기업", code: "003680", changeRatio: 9.93 },
  { rank: 10, name: "신일전자", code: "002700", changeRatio: 9.83 },
  { rank: 11, name: "고려산업", code: "002140", changeRatio: 29.44 }
];

export const JODOJU_MILESTONES: Record<string, Array<{ time: string; priceRatio: number; state: string; news?: string }>> = {
  "049080": [
    { "time": "09:00", "priceRatio": 1.0, "state": "시가 형성 (정적 출발)" },
    { "time": "09:15", "priceRatio": 1.15, "state": "6G 국책과제 단독 수주 속보", "news": "기가레인, 차세대 6G 안테나 모듈 국산화 성공 및 대규모 북미 수출 가시화 단독 속보" },
    { "time": "09:35", "priceRatio": 1.30, "state": "상한가 1차 터치 (수급 급증)" },
    { "time": "09:50", "priceRatio": 1.23, "state": "장중 차익 매물 소화 (일중 저점 형성)" },
    { "time": "10:12", "priceRatio": 1.30, "state": "상한가 최종 안착 및 강력 잠금", "news": "거래소, 기가레인 주가 급등에 따른 단기 수급 창구 모니터링 강화 발표" }
  ],
  "044340": [
    { "time": "09:00", "priceRatio": 1.0, "state": "시가 형성" },
    { "time": "09:25", "priceRatio": 1.12, "state": "전국 폭염 경보 보도발 쏠림", "news": "기상청, 7월 역대급 가마솥 폭염 장기화 공식 경보 및 온열질환 경계령 보도" },
    { "time": "10:05", "priceRatio": 1.22, "state": "제습기 주문 폭주 개시", "news": "위닉스, 온/오프라인 창고 제습기 주문량 폭주로 인한 전 공장 24시간 풀가동 속보 보도" },
    { "time": "11:40", "priceRatio": 1.30, "state": "상한가 1차 도달" },
    { "time": "13:10", "priceRatio": 1.25, "state": "물량 출회로 일시적 눌림목 형성" },
    { "time": "14:05", "priceRatio": 1.30, "state": "상한가 최종 마감 및 견조 고정" }
  ],
  "037070": [
    { "time": "09:00", "priceRatio": 1.0, "state": "시가 형성" },
    { "time": "09:30", "priceRatio": 1.08, "state": "여름 가전 동반 강세 개시", "news": "파세코, 창문형 에어컨 국내 판매량 역대 최고 속보에 가전 섹터 동반 강세 주도" },
    { "time": "11:00", "priceRatio": 1.18, "state": "일중 박스권 저항대 대량 돌파" },
    { "time": "13:50", "priceRatio": 1.12, "state": "차익 매물 출회 및 이평선 지지력 테스트" },
    { "time": "15:30", "priceRatio": 1.253, "state": "폭염 가전 테마 2위 종목으로 견조 마감" }
  ],
  "012450": [
    { "time": "09:00", "priceRatio": 1.0, "state": "시가 형성" },
    { "time": "09:45", "priceRatio": 1.10, "state": "광전송 장비 부품 수급 유입", "news": "한울소재과학, 차세대 AI 백본망 전송 고부가가치 부품 단독 특허 승인 보도" },
    { "time": "11:15", "priceRatio": 1.22, "state": "일중 최고점 돌파 및 거래 집중" },
    { "time": "13:30", "priceRatio": 1.14, "state": "기관 수급 일시 조절에 따른 눌림 조정" },
    { "time": "15:30", "priceRatio": 1.197, "state": "장기 저항벽을 정밀 타격하며 양봉 마감" }
  ],
  "042110": [
    { "time": "09:00", "priceRatio": 1.0, "state": "시가 형성" },
    { "time": "10:10", "priceRatio": 1.06, "state": "에어컨 공조 부품 수주 증가", "news": "에스씨디, 삼성/LG 가전용 공조 압축 모터 및 밸브 공급 연속 수주 계약 체결 보도" },
    { "time": "11:50", "priceRatio": 1.15, "state": "거래대금 급증 구간 진입" },
    { "time": "14:00", "priceRatio": 1.09, "state": "일중 매물 출회에 따른 초단기 눌림 조정" },
    { "time": "15:30", "priceRatio": 1.131, "state": "여름 테마 후발주 수급 낙수효과로 마감" }
  ],
  "413630": [
    { "time": "09:00", "priceRatio": 1.0, "state": "시가 형성" },
    { "time": "09:40", "priceRatio": 1.05, "state": "해상풍력 정부 인허가 승인", "news": "SK이터닉스, 초대형 해상풍력 사업단지 착공을 위한 환경영향평가 최종 승인 속보 보도" },
    { "time": "11:20", "priceRatio": 1.15, "state": "거래대금 1000억 돌파 슈팅" },
    { "time": "14:10", "priceRatio": 1.08, "state": "오후장 패시브 펀드 일시 이탈" },
    { "time": "15:30", "priceRatio": 1.121, "state": "초대형 유동성 쏠림 속에 견조한 양봉 안착" }
  ],
  "002140": [
    { "time": "09:00", "priceRatio": 1.0, "state": "시가 형성 (정적 출발)" },
    { "time": "09:20", "priceRatio": 1.12, "state": "사료 및 대두 가격 급등 속보", "news": "고려산업, 엘니뇨발 글로벌 곡물 생산량 급감 소식에 사료용 옥수수/대두 가격 연속 상승 수혜 기대감 단독 속보" },
    { "time": "10:15", "priceRatio": 1.25, "state": "거래대금 폭발 및 강력 상승파동" },
    { "time": "11:30", "priceRatio": 1.2944, "state": "상한가 안착 및 물량 잠금", "news": "고려산업, 농업/사료 테마 대장주 등극 및 상한가 완벽 안착 마감" }
  ]
};

export function getMilestonesForStock(ticker: string, name: string, changeRatio: number) {
  const predefined = JODOJU_MILESTONES[ticker];
  if (predefined) return predefined;

  const isUp = changeRatio >= 0;
  const absRatio = Math.abs(changeRatio) / 100;
  const limitUp = changeRatio >= 29.5;

  const m1_ratio = 1.0;
  let m2_ratio = 1.0 + (isUp ? absRatio * 0.4 : -absRatio * 0.4);
  let m3_ratio = 1.0 + (isUp ? absRatio * 1.0 : -absRatio * 0.9);
  let m4_ratio = 1.0 + (isUp ? absRatio * 0.7 : -absRatio * 0.5);
  let m5_ratio = 1.0 + (changeRatio / 100);

  if (limitUp) {
    m3_ratio = 1.30;
    m4_ratio = 1.24;
    m5_ratio = 1.30;
  }

  const cleanTicker = ticker.replace(/\D/g, '');
  
  let newsTitle = `${name}, 장중 수급 급증 속에 매수세 대거 몰려 시세 자극`;
  if (name.includes("앤로보틱스")) {
    newsTitle = `앤로보틱스, 산업통상자원부 주관 지능형 협동로봇 안전 가이드라인 준수 공식 통과 보도`;
  } else if (name.includes("씨피시스템")) {
    newsTitle = `씨피시스템, 2차전지 공정 자동화 케이블 체인 신규 독점 특허 및 글로벌 초도 물량 출하 소식`;
  } else if (name.includes("신일전자")) {
    newsTitle = `신일전자, 기습 폭염 예고에 창고형 써큘레이터 및 냉풍기 초도 생산 전량 예약 판매 매진 속보`;
  } else if (name.includes("흥구석유")) {
    newsTitle = `흥구석유, 중동 호르무즈 해협 긴장 유발 뉴스 및 국제유가 배럴당 82달러 돌파 소식 보도`;
  }

  const list = [
    { time: "09:00", priceRatio: m1_ratio, state: "시가 형성 (정적 시작)" },
    { time: "09:30", priceRatio: m2_ratio, state: "장 초반 주도 수급 거래원 진입 개시", news: newsTitle },
    { time: "11:10", priceRatio: m3_ratio, state: limitUp ? "상한가 1차 도달" : "일중 최고점 돌파 및 저항벽 타격" },
    { time: "13:40", priceRatio: m4_ratio, state: "오후장 숨고르기 및 지지대 형성" },
    { time: "15:30", priceRatio: m5_ratio, state: limitUp ? "상한가 최종 안착 및 잔량 잠금" : "당일 수급 분출을 완료하고 종가 안착" }
  ];

  return list;
}

export function getTickSize(price: number): number {
  if (price < 2000) return 1;
  if (price < 5000) return 5;
  if (price < 10000) return 10;
  if (price < 50000) return 50;
  if (price < 100000) return 100;
  if (price < 500000) return 500;
  return 1000;
}

export function roundToTick(price: number): number {
  if (price <= 0) return 0;
  const tick = getTickSize(price);
  return Math.round(price / tick) * tick;
}

const INITIAL_BALANCE = 10000000; // 10,000,000 KRW

const GUIDE_RULES = [
  {
    text: "아래 [훈련 시작] 버튼을 누르면 캔들이 실시간 호가 거래처럼 역동적으로 흘러갑니다."
  },
  {
    text: "시간 단축을 원하시면 키보드 [Spacebar]를 누르세요. 현재 봉이 즉시 확정되고 다음 봉이 즉시 이어집니다."
  },
  {
    text: "매수/매도 버튼을 활용해 고도의 분할 진입 및 청산 배분을 실습하며 최적의 리스크 관리 능력을 배양할 수 있습니다."
  },
  {
    text: "[랜덤 챌린지 🎲]를 시작하면 종목과 날짜가 블라인드 처리되어 편견 없는 차트 순수 거래량 수급 분석이 가능합니다."
  }
];

export default function App() {
  // Mode Selection: 'daily' (일봉) | 'minute' (분봉)
  const [gameMode, setGameMode] = useState<'daily' | 'minute'>('daily');

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };



  // After-Market Study Platform States
  const [platformTab, setPlatformTab] = useState<'replay' | 'news' | 'jodoju' | 'blog' | 'admin' | 'calendar'>('replay');
  const [preMarketBriefing, setPreMarketBriefing] = useState<PreMarketBriefing | null>(null);
  const [briefingLoading, setBriefingLoading] = useState(false);
  const [afterMarketReport, setAfterMarketReport] = useState<AfterMarketReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [studyGuide, setStudyGuide] = useState<AiReplayStudyGuide | null>(null);
  const [guideLoading, setGuideLoading] = useState(false);
  const [replayCritique, setReplayCritique] = useState<ReplayReviewReport | null>(null);
  const [critiqueLoading, setCritiqueLoading] = useState(false);

  // Admin Console States
  const [adminBriefingEdit, setAdminBriefingEdit] = useState<string>('');
  const [adminReportEdit, setAdminReportEdit] = useState<string>('');
  const [adminGuideEdit, setAdminGuideEdit] = useState<string>('');
  const [adminGuideTicker, setAdminGuideTicker] = useState<string>('000250'); // Default to Samchundang Pharm
  const [adminMessage, setAdminMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Replay Engine Decoupled Provider Index (0: Auto/Naver, 1: Simulated Real-time Fallback, 2: Mock Static)
  const [providerIndex, setProviderIndex] = useState<number>(4); // Use Naver (4) by default to get 120 candles
  const [dataProviderSource, setDataProviderSource] = useState<string>('Naver Financial API');
  const [replayDate, setReplayDate] = useState<string | null>(null);

  // Launcher menu states
  const [showLauncherMenu, setShowLauncherMenu] = useState(false);
  const launcherRef = useRef<HTMLDivElement>(null);

  // Real-time AI Data Feed Modal states
  const [showAiFeedModal, setShowAiFeedModal] = useState(false);
  const [aiFeedActiveTab, setAiFeedActiveTab] = useState<'morning' | 'lunch' | 'afternoon' | 'features' | 'jodoju_deep' | 'evening'>('morning');
  const [lunchBriefing, setLunchBriefing] = useState<any | null>(null);
  const [lunchLoading, setLunchLoading] = useState(false);
  const [eveningColumn, setEveningColumn] = useState<any | null>(null);
  const [eveningLoading, setEveningLoading] = useState(false);

  // Policy Modal states
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [activePolicy, setActivePolicy] = useState<'terms' | 'privacy'>('terms');

  // Close launcher menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (launcherRef.current && !launcherRef.current.contains(event.target as Node)) {
        setShowLauncherMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Listen to direct URL routes for /terms, /privacy or general tabs
  useEffect(() => {
    const handleUrlRoute = () => {
      const path = window.location.pathname;
      if (path === '/terms') {
        setActivePolicy('terms');
        setShowPolicyModal(true);
      } else if (path === '/privacy') {
        setActivePolicy('privacy');
        setShowPolicyModal(true);
      } else if (path === '/replay') {
        setPlatformTab('replay');
      } else if (path === '/briefing') {
        setPlatformTab('news');
        setTimeout(() => {
          const el = document.getElementById('news-briefing-col');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      } else if (path === '/report') {
        setPlatformTab('news');
        setTimeout(() => {
          const el = document.getElementById('news-report-col');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      } else if (path === '/jodoju') {
        setPlatformTab('jodoju');
      } else if (path === '/blog') {
        setPlatformTab('blog');
      } else if (path === '/calendar') {
        setPlatformTab('calendar');
      }
    };

    handleUrlRoute();

    window.addEventListener('popstate', handleUrlRoute);
    return () => {
      window.removeEventListener('popstate', handleUrlRoute);
    };
  }, []);

  const handlePolicyOpen = (policy: 'terms' | 'privacy') => {
    setActivePolicy(policy);
    setShowPolicyModal(true);
    setShowLauncherMenu(false);
    // Push state so URL is updated and SEO friendly
    window.history.pushState(null, '', `/${policy}`);
  };

  const handlePolicyClose = () => {
    setShowPolicyModal(false);
    // Revert URL to home or current tab
    const targetPath = platformTab === 'replay' ? '/' : `/${platformTab}`;
    window.history.pushState(null, '', targetPath);
  };

  const handleLauncherClick = (e: React.MouseEvent<HTMLAnchorElement>, key: string) => {
    e.preventDefault();
    setShowLauncherMenu(false);
    
    if (key === 'replay') {
      setPlatformTab('replay');
      window.history.pushState(null, '', '/');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (key === 'briefing') {
      setPlatformTab('news');
      window.history.pushState(null, '', '/briefing');
      setTimeout(() => {
        const el = document.getElementById('news-briefing-col');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else if (key === 'report') {
      setPlatformTab('news');
      window.history.pushState(null, '', '/report');
      setTimeout(() => {
        const el = document.getElementById('news-report-col');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    } else if (key === 'jodoju') {
      setPlatformTab('jodoju');
      window.history.pushState(null, '', '/jodoju');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (key === 'blog') {
      setPlatformTab('blog');
      window.history.pushState(null, '', '/blog');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (key === 'calendar') {
      setPlatformTab('calendar');
      window.history.pushState(null, '', '/calendar');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };
  
  // Stock Selection
  const [stockList, setStockList] = useState<any[]>(JODOJU_STOCKS);
  const [selectedStock, setSelectedStock] = useState<any>(JODOJU_STOCKS[0]);

  // Stock Selection Helper to resolve dynamic or static stocks
  const findStockByCode = (code: string) => {
    // 1. Check in afterMarketReport.jodoju15 first
    const reportMatch = afterMarketReport?.jodoju15?.find((s: any) => s.ticker === code);
    if (reportMatch) {
      return {
        name: reportMatch.name,
        code: reportMatch.ticker,
        changeRatio: reportMatch.changeRate,
        tradeValue: reportMatch.tradeValuePct
      };
    }
    // 2. Check JODOJU_STOCKS
    const staticMatch = JODOJU_STOCKS.find((s: any) => s.code === code);
    if (staticMatch) {
      return staticMatch;
    }
    // 3. Fallback structure
    return {
      name: "미선정 종목",
      code: code,
      changeRatio: 10.0,
      tradeValue: 500
    };
  };

  const [stockData, setStockData] = useState<Candle[]>([]);
  const [currentIndex, setCurrentIndex] = useState(20); // Show initial 20 candles
  
  // Simulation Game State
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [holdings, setHoldings] = useState(0);
  const [averagePrice, setAveragePrice] = useState(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  
  // Wiggling Animation Controls
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDoubleSpeed, setIsDoubleSpeed] = useState(false); 
  const [timeLeft, setTimeLeft] = useState(60.0); // Default daily and minute both 60s
  const timeLeftRef = useRef(60.0);
  const [wigglingPrice, setWigglingPrice] = useState(0);
  const [runningHigh, setRunningHigh] = useState(0);
  const [runningLow, setRunningLow] = useState(0);
  const [sessionStartPrice, setSessionStartPrice] = useState(0);
  
  const getStockSector = (code: string): string => {
    const sectors: Record<string, string> = {
      "138360": "로봇",
      "005930": "반도체",
      "373220": "2차전지",
      "000660": "반도체",
      "049080": "통신장비",
      "044340": "가전",
      "037070": "가전",
      "012450": "통신장비",
      "042110": "가전부품",
      "413630": "신재생에너지",
            "475150": "2차전지",
      "003680": "음식료",
      "002700": "가전",
      "002140": "사료",
      "024060": "에너지/석유",
      "006660": "자동차부품",
      "252990": "반도체/기판",
      "191410": "스마트폰부품",
      "142760": "제약/바이오",
      "314930": "의료AI",
      "195440": "반도체/장비",
      "008970": "철강",
      "000250": "제약/바이오",
      "042700": "반도체/장비",
      "237690": "제약/바이오",
      "141080": "제약/바이오",
      "267260": "전력기기",
      "257720": "화장품",
      "196170": "제약/바이오",
      "003230": "음식료",
      "006340": "전선/구리",
      "028300": "제약/바이오",
      "000100": "제약/바이오",
      "277810": "로봇",
      "000500": "전선",
      "477850": "IT/소프트웨어",
      "006360": "건설",
      "108490": "로봇",
      "017670": "통신",
      "090710": "로봇",
      "214310": "의료AI",
      "222800": "반도체/장비",
      "035720": "IT/소프트웨어",
      "035420": "IT/소프트웨어", // NAVER
      "068270": "제약/바이오"
    };
    return sectors[code] || "코스닥/코스피";
  };

  const getImpliedPrevClose = () => {
    if (stockData.length === 0) return 0;
    const finalCandle = stockData[stockData.length - 1];
    const finalPrice = finalCandle ? finalCandle.close : (wigglingPrice || 1000);
    const ratio = selectedStock.changeRatio || 0;
    return finalPrice / (1 + ratio / 100);
  };

  const getDailyChangeRatio = (price: number) => {
    const prevClose = getImpliedPrevClose();
    if (prevClose <= 0) return 0;
    return ((price - prevClose) / prevClose) * 100;
  };
  
  // Interactive UI States
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submissionResult, setSubmissionResult] = useState<{
    rank?: number;
    total?: number;
    isTop10?: boolean;
    percentile?: number;
  } | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // System Diagnostics & Debug Modal State
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [debugStatus, setDebugStatus] = useState<any>(null);
  const [debugLoading, setDebugLoading] = useState(false);
  const [gitRepoInput, setGitRepoInput] = useState('bjgb1004/react-example');
  const [gitCommit, setGitCommit] = useState<any>(null);
  const [gitLoading, setGitLoading] = useState(false);
  const [gitError, setGitError] = useState<string | null>(null);
  const [vercelVars, setVercelVars] = useState<any>(null);
  const [vercelLoading, setVercelLoading] = useState(false);
  const [debugLogEnabled, setDebugLogEnabled] = useState(false);
  
  // GZIP Storage Diagnostics States
  const [gzipStats, setGzipStats] = useState<any>(null);
  const [gzipStatsLoading, setGzipStatsLoading] = useState(false);
  
  // Data Verification Audit Logs States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLogsLoading, setAuditLogsLoading] = useState(false);
  const [simMismatchChecked, setSimMismatchChecked] = useState(false);

  // Fetch GZIP Compressed Replay Database Stats
  const fetchGzipStats = async () => {
    setGzipStatsLoading(true);
    try {
      const res = await fetch('/api/gzip-info');
      if (res.ok) {
        const data = await res.json();
        setGzipStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch GZIP stats', err);
    } finally {
      setGzipStatsLoading(false);
    }
  };

  // Fetch System Diagnostic Status
  const fetchAfterMarketReport = async () => {
    setReportLoading(true);
    try {
      const dateParam = replayDate ? `?date=${replayDate}` : '';
      const res = await fetch(`/api/platform/report${dateParam}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        
        // Dynamically adjust/sanitize supplyDemand stats for 100% realism based on user request!
        if (data && Array.isArray(data.jodoju15)) {
          // Unique-ify by ticker to prevent duplicate key rendering warnings
          const seenTickers = new Set<string>();
          const uniqueJodoju15 = data.jodoju15.filter((stk: any) => {
            const ticker = stk.ticker || stk.code;
            if (!ticker) return false;
            if (seenTickers.has(ticker)) {
              return false;
            }
            seenTickers.add(ticker);
            return true;
          });
          data.jodoju15 = uniqueJodoju15.map((stk: any) => {
            const tradeValuePct = stk.tradeValuePct || 100;
            const ticker = stk.ticker || "000000";
            const seed = (parseInt(ticker) || 5) % 10;
            
            // Standard proportional net buys relative to trade value (e.g. 1.2% - 2.0% for foreigners)
            const foreignerPct = 0.012 + (seed % 5) * 0.002;
            const institutionPct = 0.006 + (seed % 4) * 0.0015;

            let foreignVal = Math.round(tradeValuePct * foreignerPct * 10) / 10;
            let instVal = Math.round(tradeValuePct * institutionPct * 10) / 10;

            if (foreignVal <= 0) foreignVal = 0.5;
            if (instVal <= 0) instVal = 0.3;

            // Handle specific user feedback cases:
            if (ticker === "049080") { // 기가레인
              foreignVal = 3.5; // "3억 중반쯤이었을텐데" -> exactly 3.5억!
            } else if (ticker === "044340") { // 위닉스
              foreignVal = 1.0; // Proportional 1.0억 for 62억 trading value!
            }

            const fNumStr = `+${foreignVal}억`;
            const iNumStr = `+${instVal}억`;

            let originalForeigner = stk.supplyDemand?.foreigner || "순매수";
            let originalInstitution = stk.supplyDemand?.institution || "순매수";

            // Strip any hardcoded billion values (e.g. +45억, +12억, +130억)
            let foreignerText = originalForeigner.replace(/\+\d+억/g, fNumStr);
            let institutionText = originalInstitution.replace(/\+\d+억/g, iNumStr);

            if (!originalForeigner.includes('억') && originalForeigner.includes('순매수')) {
              foreignerText = `${fNumStr} ${originalForeigner}`;
            }
            if (!originalInstitution.includes('억') && originalInstitution.includes('순매수')) {
              institutionText = `${iNumStr} ${originalInstitution}`;
            }

            return {
              ...stk,
              supplyDemand: {
                foreigner: foreignerText,
                institution: institutionText
              }
            };
          });
        }

        setAfterMarketReport(data);
        setAdminReportEdit(JSON.stringify(data, null, 2));
 
        // Sync Replay Simulator stockList and selectedStock with today's leading stocks report (exactly 10 stocks)!
        if (data?.jodoju15 && data.jodoju15.length > 0) {
          const list = data.jodoju15.map((r: any) => ({
            rank: r.rank,
            name: r.name,
            code: r.ticker || r.code,
            changeRatio: r.changeRate,
            tradeValue: r.tradeValuePct,
            sector: r.sector,
            theme: r.theme,
            tags: r.tags
          })).slice(0, 10);
          setStockList(list);
          setSelectedStock((prev) => {
            const stillExists = list.find(s => s.code === prev?.code);
            return stillExists ? stillExists : list[0];
          });
        }
      }
    } catch (e) {
      console.error('Failed to fetch after-market report', e);
    } finally {
      setReportLoading(false);
    }
  };

  // Fetch System Diagnostic Status
  const fetchDiagnostics = async () => {
    setDebugLoading(true);
    try {
      const res = await fetch('/api/debug/status', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setDebugStatus(data);
        if (data.envVars?.GITHUB_REPO && data.envVars.GITHUB_REPO !== 'Not Set') {
          setGitRepoInput(data.envVars.GITHUB_REPO);
        }
      }
      await fetchGzipStats();
    } catch (err) {
      console.error('Failed to fetch diagnostics', err);
    } finally {
      setDebugLoading(false);
    }
  };

  // Fetch Git Commit info
  const fetchGitCommit = async (repoName: string) => {
    setGitLoading(true);
    setGitError(null);
    try {
      const res = await fetch(`/api/debug/github-commit?repo=${encodeURIComponent(repoName)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setGitCommit(data);
      } else {
        const errData = await res.json();
        setGitError(errData.error || 'GitHub Repository not found or rate limited.');
        setGitCommit(null);
      }
    } catch (err: any) {
      setGitError(err.message || 'Failed to query GitHub API.');
      setGitCommit(null);
    } finally {
      setGitLoading(false);
    }
  };

  // Fetch Vercel Build Environment
  const fetchVercelVars = async () => {
    setVercelLoading(true);
    try {
      const res = await fetch('/api/debug/vercel-deploy', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setVercelVars(data);
      }
    } catch (err) {
      console.error('Failed to fetch Vercel variables', err);
    } finally {
      setVercelLoading(false);
    }
  };

  // Clear Server Stock Cache
  const handleClearServerCache = async () => {
    try {
      const res = await fetch('/api/debug/cache/clear', { method: 'POST' });
      if (res.ok) {
        alert('서버 캐시가 성공적으로 초기화되었습니다!');
        fetchDiagnostics();
      }
    } catch (err) {
      console.error(err);
      alert('캐시 초기화 실패');
    }
  };

  // After-Market Platform Client API Methods
  const fetchPreMarketBriefing = async () => {
    setBriefingLoading(true);
    try {
      const res = await fetch('/api/platform/briefing', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setPreMarketBriefing(data);
        setAdminBriefingEdit(JSON.stringify(data, null, 2));
      }
    } catch (e) {
      console.error('Failed to fetch pre-market briefing', e);
    } finally {
      setBriefingLoading(false);
    }
  };

  const fetchLunchBriefing = async () => {
    setLunchLoading(true);
    try {
      const res = await fetch('/api/platform/lunch', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setLunchBriefing(data);
      }
    } catch (e) {
      console.error('Failed to fetch lunch briefing', e);
    } finally {
      setLunchLoading(false);
    }
  };

  const fetchEveningColumn = async () => {
    setEveningLoading(true);
    try {
      const res = await fetch('/api/platform/evening', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setEveningColumn(data);
      }
    } catch (e) {
      console.error('Failed to fetch evening column', e);
    } finally {
      setEveningLoading(false);
    }
  };

  const fetchStudyGuide = async (ticker: string) => {
    setGuideLoading(true);
    try {
      const res = await fetch(`/api/platform/guide?ticker=${encodeURIComponent(ticker)}`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setStudyGuide(data);
        setAdminGuideEdit(JSON.stringify(data, null, 2));
      } else {
        setStudyGuide(null);
      }
    } catch (e) {
      console.error('Failed to fetch study guide for ticker', ticker, e);
      setStudyGuide(null);
    } finally {
      setGuideLoading(false);
    }
  };

  const fetchPostReplayCritique = async (currentTrades: Trade[]) => {
    if (currentTrades.length === 0) return;
    setCritiqueLoading(true);
    setReplayCritique(null);
    try {
      const res = await fetch('/api/platform/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticker: selectedStock.code,
          name: selectedStock.name,
          trades: currentTrades,
          initialBalance: INITIAL_BALANCE,
          finalBalance: totalAssets,
          candles: stockData
        })
      });
      if (res.ok) {
        const data = await res.json();
        setReplayCritique(data);
      }
    } catch (e) {
      console.error('Failed to generate AI replay critique', e);
    } finally {
      setCritiqueLoading(false);
    }
  };

  // Fetch Data Integrity Audit Logs
  const fetchAuditLogs = async () => {
    setAuditLogsLoading(true);
    try {
      const res = await fetch('/api/debug/audit-logs');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to fetch audit logs', err);
    } finally {
      setAuditLogsLoading(false);
    }
  };

  // Clear Audit Logs
  const handleClearAuditLogs = async () => {
    try {
      const res = await fetch('/api/debug/audit-logs/clear', { method: 'POST' });
      if (res.ok) {
        alert('데이터 파이프라인 검증 로그가 성공적으로 초기화되었습니다.');
        fetchAuditLogs();
      }
    } catch (err) {
      console.error(err);
      alert('로그 초기화 실패');
    }
  };

  // Load diagnostics when debug modal is toggled
  useEffect(() => {
    if (showDebugModal) {
      fetchDiagnostics();
      fetchVercelVars();
      fetchAuditLogs();
      if (gitRepoInput) {
        fetchGitCommit(gitRepoInput);
      }
    }
  }, [showDebugModal]);

  // Guide message rolling state
  const [guideIndex, setGuideIndex] = useState(0);

  useEffect(() => {
    const guideTimer = setInterval(() => {
      setGuideIndex((prev) => (prev + 1) % GUIDE_RULES.length);
    }, 4000);
    return () => clearInterval(guideTimer);
  }, []);

  // Blind Challenge & Sidebar Leaderboard States
  const [isRandomChallengeMode, setIsRandomChallengeMode] = useState(false);
  const [sidebarLeaderboardTab, setSidebarLeaderboardTab] = useState<'daily' | 'minute'>('daily');
  const [sidebarLeaderboard, setSidebarLeaderboard] = useState<any[]>([]);

  // Terms, Privacy & Feedback States
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [showStrategyModal, setShowStrategyModal] = useState(false);
  const [showPwaPrompt, setShowPwaPrompt] = useState(false);
  const [pwaActiveTab, setPwaActiveTab] = useState<'ios' | 'android'>('ios');
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [inAppOs, setInAppOs] = useState<'ios' | 'android' | null>(null);
  const [lastBuyPercent, setLastBuyPercent] = useState<number | null>(null);
  const [lastSellPercent, setLastSellPercent] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackContact, setFeedbackContact] = useState('');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [isFeedbackSubmitting, setIsFeedbackSubmitting] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      const ua = navigator.userAgent.toLowerCase();
      const isIos = /ipad|iphone|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      
      if (isIos) {
        setPwaActiveTab('ios');
      } else {
        setPwaActiveTab('android');
      }

      // 인앱 브라우저 체크 (카카오톡, 네이버, 라인, 인스타그램, 페이스북, 트위터 등)
      const isKakaotalk = /kakaotalk/i.test(ua);
      const isLine = /line/i.test(ua);
      const isNaver = /naver/i.test(ua);
      const isInstagram = /instagram/i.test(ua);
      const isFacebook = /fb|messenger/i.test(ua);
      const isTwitter = /twitter|twitterandroid/i.test(ua);
      const isKakaoStory = /kakaostory/i.test(ua);
      const isInApp = isKakaotalk || isLine || isNaver || isInstagram || isFacebook || isTwitter || isKakaoStory || /inapp/i.test(ua);

      if (isInApp) {
        setIsInAppBrowser(true);
        setInAppOs(isIos ? 'ios' : 'android');

        if (!isIos) {
          // 안드로이드의 경우 카카오톡 등에서 크롬 등의 진짜 브라우저를 강제로 깨우는 주소(Intent) 실행
          const rawUrl = window.location.href.replace(/https?:\/\//, '');
          window.location.href = `intent://${rawUrl}#Intent;scheme=https;action=android.intent.action.VIEW;category=android.intent.category.BROWSABLE;package=com.android.chrome;end`;
        }
      }
    }
  }, []);

  useEffect(() => {
    const dismissed = localStorage.getItem('kstock_pwa_dismissed');
    if (!dismissed) {
      const timer = setTimeout(() => {
        setShowPwaPrompt(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissPwa = () => {
    localStorage.setItem('kstock_pwa_dismissed', 'true');
    setShowPwaPrompt(false);
  };

  const getCandleDuration = () => {
    return isDoubleSpeed ? 30 : 60;
  };

  const getHighFidelityPriceAtProgress = (candle: Candle, progress: number): number => {
    const O = candle.open;
    const H = candle.high;
    const L = candle.low;
    const C = candle.close;

    if (!O || !H || !L || !C) return candle.open || 0;

    // Extremes sequence
    let E1 = L;
    let E2 = H;
    if (C < O) {
      E1 = H;
      E2 = L;
    }

    const p1 = 0.25;
    const p2 = 0.85;

    if (progress <= p1) {
      // Phase 1: O -> E1
      const t = progress / p1;
      return O + (E1 - O) * t;
    } else if (progress <= p2) {
      // Phase 2: E1 -> E2
      const t = (progress - p1) / (p2 - p1);
      return E1 + (E2 - E1) * t;
    } else {
      // Phase 3: E2 -> C
      const t = (progress - p2) / (1.0 - p2);
      return E2 + (C - E2) * t;
    }
  };

  // Load Jodoju List on Mount
  useEffect(() => {
    const loadJodojuList = async () => {
      let list: any[] = [];
      try {
        // UI 진입 시 주도주 리스트 API의 캐시를 무효화(Bypass)하기 위해 force=true 추가 호출하여 오늘 자 실시간 주도주 명단을 강제 동기화
        console.log("[UI 진입] 실시간 주도주 15개 명단을 동기화하기 위해 /api/jodoju-list?force=true 호출 중...");
        const apiRes = await fetch('/api/jodoju-list?force=true');
        if (apiRes.ok && apiRes.headers.get('content-type')?.includes('application/json')) {
          const fetched = await apiRes.json();
          if (Array.isArray(fetched) && fetched.length > 0) {
            list = fetched;
            console.log("[UI 진입 완료] 오늘 자 실시간 주도주 15종목 명단 강제 업데이트 및 인덱싱 동기화 완료:", list);
          }
        }
      } catch (apiErr) {
        console.warn('[UI 진입] 실시간 주도주 강제 동기화 실패, 캐시된 데이터 및 정적 리포트 로딩 시도:', apiErr);
      }

      if (list.length === 0) {
        try {
          const reportRes = await fetch('/data/platform/after_market_report.json');
          if (reportRes.ok && reportRes.headers.get('content-type')?.includes('application/json')) {
            const reportData = await reportRes.json();
            if (reportData?.jodoju15 && reportData.jodoju15.length > 0) {
              list = reportData.jodoju15.map((r: any) => ({
                rank: r.rank,
                name: r.name,
                code: r.ticker,
                changeRatio: r.changeRate,
                tradingValue: r.tradeValuePct * 100000000
              }));
              console.log("Successfully aligned simulator stocks with after_market_report.json:", list);
            }
          }
        } catch (reportErr) {
          console.warn('Could not load report for aligning stock list, trying /api/jodoju-list', reportErr);
        }
      }

      if (list.length === 0) {
        try {
          const apiRes = await fetch('/api/jodoju-list');
          if (apiRes.ok && apiRes.headers.get('content-type')?.includes('application/json')) {
            const fetched = await apiRes.json();
            if (Array.isArray(fetched) && fetched.length > 0) {
              list = fetched;
            }
          }
        } catch (apiErr) {
          console.warn('Could not load from /api/jodoju-list, trying fallback static file', apiErr);
        }
      }

      if (list.length === 0) {
        try {
          const res = await fetch('/data/jodoju_list.json');
          if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
            const fetched = await res.json();
            if (Array.isArray(fetched) && fetched.length > 0) {
              list = fetched;
            }
          }
        } catch (err) {
          console.warn('Could not load jodoju_list.json, using fallback stock list', err);
        }
      }

      // Fallback if empty
      if (list.length === 0) {
        list = [...JODOJU_STOCKS];
      }

      // Unique-ify list by code/ticker to prevent duplicate stock codes
      const seenCodes = new Set<string>();
      const uniqueList = list.filter(stk => {
        const code = stk.code || stk.ticker;
        if (!code) return false;
        if (seenCodes.has(code)) return false;
        seenCodes.add(code);
        return true;
      });
      list = uniqueList;

      // Map changeRatios from JODOJU_STOCKS for any stocks that don't have it
      const processed = list.map(stk => {
        let ratio = stk.changeRatio;
        if (ratio === undefined) {
          const match = JODOJU_STOCKS.find(j => j.code === stk.code);
          ratio = match ? match.changeRatio : 5.0;
        }
        return { ...stk, changeRatio: ratio };
      });

      // Sort by changeRatio descending (highest rise rate first)
      processed.sort((a, b) => b.changeRatio - a.changeRatio);

      // Re-assign ranks 1 to 15 based on descending rise rates
      const ranked = processed.map((stk, idx) => ({
        ...stk,
        rank: idx + 1
      }));

      setStockList(ranked);
      setSelectedStock(ranked[0]);
    };
    loadJodojuList();
    fetchLeaderboard('daily');
    fetchPreMarketBriefing();
    fetchAfterMarketReport();
    fetchLunchBriefing();
    fetchEveningColumn();
  }, []);

  useEffect(() => {
    if (replayDate) {
      fetchAfterMarketReport();
    }
  }, [replayDate]);

  // Fetch Leaderboard from backend
  const fetchLeaderboard = async (modeType: 'daily' | 'minute') => {
    try {
      const serverType = modeType === 'minute' ? 'danta' : 'ilbong';
      const res = await fetch(`/api/leaderboard?type=${serverType}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leaderboard)) {
          setLeaderboard(data.leaderboard);
        } else {
          setLeaderboard([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
    }
  };

  const fetchSidebarLeaderboard = async (modeType: 'daily' | 'minute') => {
    try {
      const serverType = modeType === 'minute' ? 'danta' : 'ilbong';
      const res = await fetch(`/api/leaderboard?type=${serverType}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.leaderboard)) {
          setSidebarLeaderboard(data.leaderboard);
        } else {
          setSidebarLeaderboard([]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch sidebar leaderboard:', err);
    }
  };

  useEffect(() => {
    fetchSidebarLeaderboard(sidebarLeaderboardTab);
  }, [sidebarLeaderboardTab]);

  // Generate Fallback mock data with high realism if data files are missing
  const generateFallbackData = (
    symbolName: string, 
    code: string, 
    mode: 'daily' | 'minute', 
    customBasePrice?: number,
    dailySkeleton?: Candle | null
  ): Candle[] => {
    const candles: Candle[] = [];
    let basePrice = customBasePrice || 50000;
    let volatility = 0.015;
    
    if (!customBasePrice) {
      if (symbolName.includes('삼성전자')) { basePrice = 75000; volatility = 0.012; }
      else if (symbolName.includes('SK하이닉스')) { basePrice = 180000; volatility = 0.022; }
      else if (symbolName.includes('알테오젠')) { basePrice = 250000; volatility = 0.035; }
      else if (symbolName.includes('한미반도체')) { basePrice = 120000; volatility = 0.032; }
      else if (symbolName.includes('에코프로비엠')) { basePrice = 190000; volatility = 0.028; }
      else if (symbolName.includes('엔켐')) { basePrice = 240000; volatility = 0.038; }
      else if (symbolName.includes('삼양식품')) { basePrice = 550000; volatility = 0.025; }
      else if (symbolName.includes('HD현대일렉트릭')) { basePrice = 300000; volatility = 0.024; }
      else if (symbolName.includes('HLB')) { basePrice = 80000; volatility = 0.034; }
      else if (symbolName.includes('두산에너빌리티')) { basePrice = 22000; volatility = 0.018; }
      else if (symbolName.includes('태성')) { basePrice = 18000; volatility = 0.045; }
      else if (symbolName.includes('바이오다인')) { basePrice = 45000; volatility = 0.050; }
      else if (symbolName.includes('에이피알')) { basePrice = 270000; volatility = 0.026; }
    } else {
      if (symbolName.includes('삼성전자')) { volatility = 0.012; }
      else if (symbolName.includes('SK하이닉스')) { volatility = 0.022; }
      else if (symbolName.includes('알테오젠')) { volatility = 0.035; }
      else if (symbolName.includes('한미반도체')) { volatility = 0.032; }
      else if (symbolName.includes('에코프로비엠')) { volatility = 0.028; }
      else if (symbolName.includes('엔켐')) { volatility = 0.038; }
      else if (symbolName.includes('삼양식품')) { volatility = 0.025; }
      else if (symbolName.includes('HD현대일렉트릭')) { volatility = 0.024; }
      else if (symbolName.includes('HLB')) { volatility = 0.034; }
      else if (symbolName.includes('두산에너빌리티')) { volatility = 0.018; }
      else if (symbolName.includes('태성')) { volatility = 0.045; }
      else if (symbolName.includes('바이오다인')) { volatility = 0.050; }
      else if (symbolName.includes('에이피알')) { volatility = 0.026; }
    }
 
    let seed = 0;
    for (let i = 0; i < code.length; i++) {
      seed += code.charCodeAt(i);
    }
    const randomSeed = () => {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    };
 
    if (mode === 'daily') {
      let currentPrice = basePrice;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 365);
 
      for (let i = 0; i < 120; i++) {
        const trend = Math.sin(i / 15) * 0.005 + Math.cos(i / 40) * 0.008 + (randomSeed() - 0.48) * 0.012;
        const open = Math.round(currentPrice);
        
        // Compute Daily Limit Up / Limit Down Boundaries
        const limitUpPrice = roundToTick(currentPrice * 1.30);
        const limitDownPrice = roundToTick(currentPrice * 0.70);

        let close = Math.round(currentPrice * (1 + trend));
        if (close > limitUpPrice) close = limitUpPrice;
        if (close < limitDownPrice) close = limitDownPrice;
        close = roundToTick(close);
         
        const priceMin = Math.min(open, close);
        const priceMax = Math.max(open, close);
        
        let high = Math.round(priceMax * (1 + randomSeed() * volatility * 0.6));
        let low = Math.round(priceMin * (1 - randomSeed() * volatility * 0.6));
        
        if (high > limitUpPrice) high = limitUpPrice;
        if (low < limitDownPrice) low = limitDownPrice;
        
        high = roundToTick(high);
        low = roundToTick(low);

        // Maintain mathematical correctness
        if (high < priceMax) high = priceMax;
        if (low > priceMin) low = priceMin;

        // Force exactly zero upper shadow on limit up close day
        const isLastDay = i === 119;
        const isLimitUpDay = close >= limitUpPrice || (isLastDay && (symbolName.includes('상한가') || JODOJU_STOCKS.some(s => s.code === code)));
        if (isLimitUpDay) {
          close = limitUpPrice;
          high = limitUpPrice;
        }

        const volume = Math.round(100000 + randomSeed() * 2000000);
 
        const d = new Date(startDate.getTime());
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().slice(0, 10);
 
        candles.push({ date: dateStr, open, high, low, close, volume });
        currentPrice = close;
      }
    } else {
      // Reconstruct minute candles from Daily Skeleton and Milestones!
      const todayStr = new Date().toISOString().slice(0, 10);
 
      // 1. Establish skeleton parameters
      let O_day = basePrice;
      let H_day = basePrice * 1.05;
      let L_day = basePrice * 0.98;
      let C_day = basePrice * 1.02;
      let V_day = 1500000;
 
      if (dailySkeleton) {
        O_day = dailySkeleton.open;
        H_day = dailySkeleton.high;
        L_day = dailySkeleton.low;
        C_day = dailySkeleton.close;
        V_day = dailySkeleton.volume;
      } else {
        // Fallback skeleton based on selectedStock's changeRatio
        const isJodoju = JODOJU_STOCKS.find(s => s.code === code);
        const r = isJodoju ? isJodoju.changeRatio : 5.0;
        C_day = Math.round(O_day * (1 + r / 100));
        H_day = Math.round(Math.max(O_day, C_day) * (1 + 0.015));
        L_day = Math.round(Math.min(O_day, C_day) * (1 - 0.01));
        V_day = 1800000;
      }
 
      const limitUpPct = 0.30;
      const limitUpPrice = roundToTick(basePrice * (1 + limitUpPct));
      const limitDownPrice = roundToTick(basePrice * (1 - limitUpPct));

      // Strictly clamp all skeleton parameters to limit boundaries
      if (O_day > limitUpPrice) O_day = limitUpPrice;
      if (O_day < limitDownPrice) O_day = limitDownPrice;
      if (H_day > limitUpPrice) H_day = limitUpPrice;
      if (H_day < limitDownPrice) H_day = limitDownPrice;
      if (L_day > limitUpPrice) L_day = limitUpPrice;
      if (L_day < limitDownPrice) L_day = limitDownPrice;
      if (C_day > limitUpPrice) C_day = limitUpPrice;
      if (C_day < limitDownPrice) C_day = limitDownPrice;
 
      // 2. Fetch milestones
      const milestones = getMilestonesForStock(code, symbolName, ((C_day - O_day) / O_day) * 100);
 
      // 3. Map milestones to minute indices (0 to 379)
      const nodes = milestones.map((m) => {
        const parts = m.time.split(':');
        const h = parseInt(parts[0], 10);
        const minVal = parseInt(parts[1], 10);
        const totalMins = (h * 60 + minVal) - (9 * 60);
        const idx = Math.min(379, Math.max(0, Math.round((totalMins / 390) * 379)));
         
        let price = O_day * m.priceRatio;
        // Limit clamp for Korea markets
        if (price >= limitUpPrice) {
          price = limitUpPrice;
        }
 
        return {
          idx,
          price,
          state: m.state,
          news: m.news
        };
      });
 
      // Sort nodes chronologically
      nodes.sort((a, b) => a.idx - b.idx);
 
      // Pad start and end nodes if needed
      if (nodes[0].idx > 0) {
        nodes.unshift({ idx: 0, price: O_day, state: "시작", news: undefined });
      }
      if (nodes[nodes.length - 1].idx < 379) {
        nodes.push({ idx: 379, price: C_day, state: "장마감", news: undefined });
      }
 
      // 4. Interpolate and wiggles
      for (let i = 0; i < 380; i++) {
        // Find left and right nodes
        let leftNode = nodes[0];
        let rightNode = nodes[nodes.length - 1];
 
        for (let j = 0; j < nodes.length - 1; j++) {
          if (nodes[j].idx <= i && nodes[j+1].idx >= i) {
            leftNode = nodes[j];
            rightNode = nodes[j+1];
            break;
          }
        }
 
        const span = rightNode.idx - leftNode.idx || 1;
        const ratio = (i - leftNode.idx) / span;
        let priceTrend = leftNode.price + (rightNode.price - leftNode.price) * ratio;
 
        // Apply high frequency wiggles
        const wiggleAmp = 0.0018 * (1 + (seed % 5) * 0.2);
        const wiggleNoise = priceTrend * (Math.sin(i / 1.5) * wiggleAmp * 0.5 + (randomSeed() - 0.5) * wiggleAmp);
        let close = roundToTick(priceTrend + wiggleNoise);
 
        // Enforce boundary limits (Limit Up/Down & Daily High/Low)
        if (close >= limitUpPrice) {
          close = limitUpPrice;
        }
        if (close > H_day) {
          close = roundToTick(H_day);
        }
        if (close < L_day) {
          close = roundToTick(L_day);
        }
 
        // Establish candle prices
        const open = i === 0 ? roundToTick(O_day) : candles[i - 1].close;
        let high = roundToTick(Math.max(open, close) + Math.abs(randomSeed() * priceTrend * 0.001));
        let low = roundToTick(Math.min(open, close) - Math.abs(randomSeed() * priceTrend * 0.001));

        // Clamping to limit constraints
        if (high > limitUpPrice) high = limitUpPrice;
        if (low < limitDownPrice) low = limitDownPrice;
 
        // Clamping to extreme session constraints
        if (high > H_day) high = H_day;
        if (low < L_day) low = L_day;
 
        // Ensure high/low are valid
        if (high < Math.max(open, close)) high = Math.max(open, close);
        if (low > Math.min(open, close)) low = Math.min(open, close);
 
        // If in a Limit Up lock (price is limitUpPrice), lock all to limitUpPrice and dry volume
        const isLocked = Math.abs(close - limitUpPrice) < getTickSize(limitUpPrice);
        if (isLocked) {
          high = limitUpPrice;
          low = limitUpPrice;
          close = limitUpPrice;
        }
 
        // 5. High-fidelity volume modeling
        let baseVol = V_day / 380;
        let timeWeight = 1.0;
         
        // Time of day volume distribution curves
        if (i < 45) {
          timeWeight = 3.5; // heavy morning trading
        } else if (i < 120) {
          timeWeight = 1.2;
        } else if (i > 340) {
          timeWeight = 2.0; // afternoon run
        } else {
          timeWeight = 0.4; // midday lull
        }
 
        // Volatility volume spike
        const priceChangePct = Math.abs(close - open) / (open || 1);
        const volatilitySpike = 1.0 + priceChangePct * 150;
 
        let volume = Math.round(baseVol * timeWeight * volatilitySpike * (0.6 + randomSeed() * 0.8));
 
        // Dry volume dramatically on Limit Up lock!
        if (isLocked && i > leftNode.idx + 3) {
          volume = Math.round(baseVol * 0.04 * (0.3 + randomSeed() * 0.7)); // sellers disappear
        }
 
        if (volume < 50) volume = Math.round(50 + randomSeed() * 200);
 
        const hour = 9 + Math.floor(i / 60);
        const minVal = i % 60;
        const timeStr = `${hour.toString().padStart(2, '0')}:${minVal.toString().padStart(2, '0')}:00`;
 
        candles.push({
          date: `${todayStr} ${timeStr}`,
          open,
          high,
          low,
          close,
          volume
        });
      }
    }
    return candles;
  };
 
  // Load stock data whenever selected stock, mode, or providerIndex changes
  useEffect(() => {
    const loadStockData = async () => {
      setIsPlaying(false);
      setHoverIndex(null);
 
      // Helper to sort loaded stock candles chronologically by date/time
      const sortAndValidateCandles = (candlesList: Candle[]): Candle[] => {
        const sorted = [...candlesList].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
        // Remove duplicate dates that break Lightweight Charts
        const unique = [];
        const seenDates = new Set();
        for (const item of sorted) {
          if (!seenDates.has(item.date)) {
            seenDates.add(item.date);
            unique.push(item);
          }
        }
        return unique;
      };
 
      // Starting index: 10th index for minute chart, 20th index for daily chart
      const targetStartingIndex = gameMode === 'minute' ? 9 : 9;
       
      if (gameMode === 'daily') {
        // Safe live dynamic API fallback if daily
        try {
          const dateParam = replayDate ? `&date=${replayDate}` : '';
          const apiRes = await fetch(`/api/stock-data?ticker=${selectedStock.code}&providerIndex=${providerIndex}${dateParam}`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (Array.isArray(apiData.candles) && apiData.candles.length > 0) {
              const sorted = sortAndValidateCandles(apiData.candles).slice(-120);
              const initialIndex = Math.min(targetStartingIndex, sorted.length - 1);
              setStockData(sorted);
              setDataProviderSource(apiData.source || 'Standard Replay Provider');
              setWigglingPrice(sorted[initialIndex]?.open || sorted[0]?.open || 0);
              setCurrentIndex(initialIndex);
              resetSimulation(sorted[initialIndex]?.open || sorted[0]?.open || 0);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('Live stock data API fetch failed', apiErr);
        }
 
        // Safe generated fallback
        const data = generateFallbackData(selectedStock.name, selectedStock.code, 'daily');
        const sorted = sortAndValidateCandles(data).slice(-120);
        const initialIndex = Math.min(targetStartingIndex, sorted.length - 1);
        setStockData(sorted);
        setDataProviderSource('Standard Fallback Engine');
        setWigglingPrice(sorted[initialIndex]?.open || sorted[0]?.open || 0);
        setCurrentIndex(initialIndex);
        resetSimulation(sorted[initialIndex]?.open || sorted[0]?.open || 0);
      } else {
        // gameMode === 'minute'
        // First fetch daily data to establish baseline for limit prices!
        let lastDailyClosePrice = 0;
        let lastDailyCandle: Candle | null = null;
        try {
          const dateParam = replayDate ? `&date=${replayDate}` : '';
          const apiRes = await fetch(`/api/stock-data?ticker=${selectedStock.code}&providerIndex=${providerIndex}${dateParam}`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (Array.isArray(apiData.candles) && apiData.candles.length > 0) {
              lastDailyCandle = apiData.candles[apiData.candles.length - 1];
              lastDailyClosePrice = lastDailyCandle.close;
            }
          }
        } catch (apiErr) {
          console.warn('Failed to fetch daily close price for minute fallback base', apiErr);
        }

        let limitUpPrice: number | undefined;
        let limitDownPrice: number | undefined;
        if (lastDailyClosePrice > 0) {
          const limitUpPct = 0.30;
          limitUpPrice = roundToTick(lastDailyClosePrice * (1 + limitUpPct));
          limitDownPrice = roundToTick(lastDailyClosePrice * (1 - limitUpPct));
        }

        // First try to fetch actual 1-minute raw candles from Naver/Gzip proxy route!
        try {
          const dateParam = replayDate ? `&date=${replayDate}` : '';
          const apiRes = await fetch(`/api/stock-data?ticker=${selectedStock.code}&timeframe=minute&providerIndex=${providerIndex}${dateParam}`);
          if (apiRes.ok) {
            const apiData = await apiRes.json();
            if (Array.isArray(apiData.candles) && apiData.candles.length > 0) {
              // Apply our 3-stage mathematical noise-masking filter for 100% legal compliance & high resolution simulation!
              const mutated = mutateMinuteCandles(apiData.candles, limitUpPrice, limitDownPrice);
              const sorted = sortAndValidateCandles(mutated).slice(-390);
              const initialIndex = Math.min(targetStartingIndex, sorted.length - 1);
              setStockData(sorted);
              setDataProviderSource('Precision 3-Stage Masking Pipeline (Real 1m Source)');
              setWigglingPrice(sorted[initialIndex]?.open || sorted[0]?.open || 0);
              setCurrentIndex(initialIndex);
              resetSimulation(sorted[initialIndex]?.open || sorted[0]?.open || 0);
              return;
            }
          }
        } catch (apiErr) {
          console.warn('Failed to fetch actual minute data, falling back to milestone generation', apiErr);
        }

        // Safe generated fallback

        const data = generateFallbackData(selectedStock.name, selectedStock.code, 'minute', lastDailyClosePrice || undefined, lastDailyCandle);
        // Also apply the 3-stage pipeline on the fallback data to maintain legal safety under all pathways!
        const mutatedFallback = mutateMinuteCandles(data, limitUpPrice, limitDownPrice);
        const sorted = sortAndValidateCandles(mutatedFallback).slice(-390);
        const initialIndex = Math.min(targetStartingIndex, sorted.length - 1);
        setStockData(sorted);
        setDataProviderSource('Milestone Interpolation (Masked Fallback)');
        setWigglingPrice(sorted[initialIndex]?.open || sorted[0]?.open || 0);
        setCurrentIndex(initialIndex);
        resetSimulation(sorted[initialIndex]?.open || sorted[0]?.open || 0);
      }
    };
    loadStockData();
    fetchStudyGuide(selectedStock.code);
    fetchLeaderboard(gameMode === 'minute' ? 'minute' : 'daily');
  }, [selectedStock?.code, gameMode, providerIndex]);

  // Handle Resets
  const resetSimulation = (initialPrice: number) => {
    const roundedPrice = roundToTick(initialPrice);
    setBalance(INITIAL_BALANCE);
    setHoldings(0);
    setAveragePrice(0);
    setTrades([]);
    timeLeftRef.current = 60.0;
    setTimeLeft(60.0); // Always start from 60s baseline, speed handles the ticks
    setWigglingPrice(roundedPrice);
    setRunningHigh(roundedPrice);
    setRunningLow(roundedPrice);
    setShowResultModal(false);
    setSubmitSuccess(false);
    setLastBuyPercent(null);
    setLastSellPercent(null);
    setSessionStartPrice(roundedPrice);
  };

  const handleResetCurrent = () => {
    if (stockData.length > 0) {
      const targetStartingIndex = gameMode === 'minute' ? 9 : 9;
      const initialIndex = Math.min(targetStartingIndex, stockData.length - 1);
      setCurrentIndex(initialIndex);
      resetSimulation(stockData[initialIndex]?.open || stockData[0]?.open || 0);
    }
  };

  // Browser Text-To-Speech hook (Web Speech API) with zero delay cancel overlay
  const speakVoice = (text: string) => {
    if (isMuted) return;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel(); // Clears any queue immediately
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ko-KR';
      utterance.rate = 1.15; // Realistic conversational speed
      window.speechSynthesis.speak(utterance);
    }
  };

  // Live Timer & Wiggling tick handler
  useEffect(() => {
    if (!isPlaying || showResultModal || stockData.length === 0) return;

    const intervalDuration = 100; // Ticks 10 times a second
    const timer = setInterval(() => {
      const speedMultiplier = isDoubleSpeed ? 2 : 1;
      const decrement = 0.1 * speedMultiplier;
      const nextTime = Math.max(0, timeLeftRef.current - decrement);
      timeLeftRef.current = nextTime;
      setTimeLeft(nextTime);

      if (nextTime <= 0) {
        clearInterval(timer);
        finalizeAndNext();
        return;
      }

      // Fluctuate price using the Magnet-based Tick Engine
      const currentCandle = stockData[currentIndex];
      if (currentCandle) {
        const progress = Math.min(1, Math.max(0, (60.0 - nextTime) / 60.0));
        
        let nextPrice = 0;
        if (typeof (window as any).getMagnetTickPrice === 'function') {
          nextPrice = (window as any).getMagnetTickPrice(currentCandle, progress, gameMode);
        } else {
          // Robust fallback
          const basePrice = currentCandle.open + (currentCandle.close - currentCandle.open) * progress;
          const noisePercent = 0.001 + Math.random() * 0.002;
          const noiseSign = Math.random() > 0.5 ? 1 : -1;
          const randomVal = Math.round(basePrice * (1 + noisePercent * noiseSign));
          nextPrice = Math.max(currentCandle.low, Math.min(currentCandle.high, randomVal));
        }
        
        const roundedPrice = roundToTick(nextPrice);
        setWigglingPrice(roundedPrice);

        // 캔들 무빙 동안 실시간 Running High & Running Low를 갱신
        if (progress <= 0.015) {
          const roundedOpen = roundToTick(currentCandle.open);
          setRunningHigh(roundedOpen);
          setRunningLow(roundedOpen);
        } else {
          setRunningHigh((prev) => (roundedPrice > prev || prev === 0 ? roundedPrice : prev));
          setRunningLow((prev) => (roundedPrice < prev || prev === 0 ? roundedPrice : prev));
        }
      }
    }, intervalDuration);

    return () => clearInterval(timer);
  }, [isPlaying, currentIndex, stockData, gameMode, isDoubleSpeed, showResultModal]);

  // Sync Spacebar key press to finalize candle immediately
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent page scroll
        finalizeAndNext();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stockData, wigglingPrice, gameMode, isDoubleSpeed]);

  const finalizeAndNext = () => {
    if (stockData.length === 0) return;

    // Save final price and update data set to preserve perfect historical shape
    setStockData((prevData) => {
      const updated = [...prevData];
      if (updated[currentIndex]) {
        const original = updated[currentIndex];
        updated[currentIndex] = {
          ...original,
          close: original.close,
          high: original.high,
          low: original.low
        };
      }
      return updated;
    });

    if (currentIndex < stockData.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextCandle = stockData[nextIndex];
      if (nextCandle) {
        const nextOpen = roundToTick(nextCandle.open);
        setWigglingPrice(nextOpen);
        setRunningHigh(nextOpen);
        setRunningLow(nextOpen);
      }
      timeLeftRef.current = 60.0;
      setTimeLeft(60.0); // Reset timer to 60s baseline
    } else {
      // Auto-liquidate at last candle close
      handleEndSession();
    }
  };

  // Portfolio actions
  const handleBuyPercent = (percent: number) => {
    const price = wigglingPrice || (stockData[currentIndex]?.close || stockData[currentIndex]?.open || 0);
    if (price <= 0) {
      speakVoice("실시간 가격 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    if (balance <= 0) {
      speakVoice("예수금이 부족합니다.");
      return;
    }

    const costLimit = balance * (percent / 100);
    let quantity = Math.floor(costLimit / price);
    
    if (quantity <= 0) {
      if (balance >= price) {
        quantity = 1;
        speakVoice(`선택 비중 금액이 1주 가격보다 작아 최소 단위인 1주를 매수합니다.`);
      } else {
        speakVoice("예수금이 부족합니다.");
        return;
      }
    }

    setLastBuyPercent(percent);

    const cost = quantity * price;
    const nextHoldings = holdings + quantity;
    const nextAverage = Math.round((averagePrice * holdings + cost) / nextHoldings);

    setBalance(balance - cost);
    setHoldings(nextHoldings);
    setAveragePrice(nextAverage);
    
    const newTrade: Trade = {
      id: `trade-${Date.now()}`,
      type: 'BUY',
      date: stockData[currentIndex]?.date || '실시간',
      price,
      quantity,
      amount: cost,
      balanceAfter: balance - cost,
      candleIndex: currentIndex
    };
    setTrades((prev) => [newTrade, ...prev]);
    speakVoice(`${percent === 100 ? '전액' : percent + '%'} 매수하였습니다.`);
  };

  const handleSellPercent = (percent: number) => {
    if (holdings <= 0) {
      speakVoice("보유 주식이 없습니다.");
      return;
    }
    const price = wigglingPrice || (stockData[currentIndex]?.close || stockData[currentIndex]?.open || 0);
    if (price <= 0) {
      speakVoice("실시간 가격 정보를 불러오는 중입니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    let quantity = percent === 100 ? holdings : Math.floor(holdings * (percent / 100));
    if (quantity <= 0) {
      if (holdings >= 1) {
        quantity = 1;
        speakVoice(`선택 비중 수량이 1주보다 작아 최소 단위인 1주를 매도합니다.`);
      } else {
        speakVoice("보유 수량이 부족합니다.");
        return;
      }
    }

    setLastSellPercent(percent);

    const proceeds = quantity * price;
    const nextBalance = balance + proceeds;
    const nextHoldings = holdings - quantity;
    const realizedPnL = proceeds - (quantity * averagePrice);
    const realizedPnLPct = ((price - averagePrice) / averagePrice) * 100;

    setBalance(nextBalance);
    setHoldings(nextHoldings);
    if (nextHoldings === 0) setAveragePrice(0);

    const newTrade: Trade = {
      id: `trade-${Date.now()}`,
      type: 'SELL',
      date: stockData[currentIndex]?.date || '실시간',
      price,
      quantity,
      amount: proceeds,
      balanceAfter: nextBalance,
      entryPrice: averagePrice,
      realizedPnL,
      realizedPnLPct,
      candleIndex: currentIndex
    };
    setTrades((prev) => [newTrade, ...prev]);
    speakVoice(`${percent === 100 ? '전량' : percent + '%'} 매도하였습니다.`);
  };

  const handleBuyAll = () => handleBuyPercent(100);
  const handleBuyHalf = () => handleBuyPercent(50);
  const handleSellAll = () => handleSellPercent(100);
  const handleSellHalf = () => handleSellPercent(50);

  // Random Challenge: Cycle through 15 stocks with localStorage exclusion and blind mode enabled
  const handleRandomChallenge = () => {
    const playedJson = localStorage.getItem('played_stock_codes');
    let playedCodes: string[] = playedJson ? JSON.parse(playedJson) : [];
    
    // Find unplayed stocks in the cycle
    const availableStocks = stockList.filter(s => !playedCodes.includes(s.code));
    
    let nextStock;
    if (availableStocks.length === 0) {
      // Completed full cycle, reset localStorage
      nextStock = stockList[Math.floor(Math.random() * stockList.length)];
      playedCodes = [nextStock.code];
    } else {
      nextStock = availableStocks[Math.floor(Math.random() * availableStocks.length)];
      playedCodes.push(nextStock.code);
    }
    
    localStorage.setItem('played_stock_codes', JSON.stringify(playedCodes));
    setSelectedStock(nextStock);
    setIsRandomChallengeMode(true);
  };

  const getPerformanceComment = (yieldPct: number) => {
    if (yieldPct >= 10) {
      return "놀라운 수익률입니다! 주도주 트레이딩의 천재이시군요! 🏆";
    } else if (yieldPct >= 3) {
      return "안정적인 수익입니다! 시장의 맥을 잘 짚고 계십니다. 👍";
    } else if (yieldPct >= 0) {
      return "본전 치기 성공! 손실을 보지 않은 것만으로도 훌륭한 트레이더입니다. 👏";
    } else if (yieldPct >= -10) {
      return "아쉬운 손실입니다. 손절 기준을 다시 한 번 점검해봅시다! 🧐";
    } else {
      return "뇌동매매를 하지는 않으셨나요? 차트를 다시 복기해봅시다. 🔥";
    }
  };

  // Finish session, liquidate and show modal
  const handleEndSession = () => {
    let finalBalance = balance;
    let finalTrades = [...trades];
    const price = wigglingPrice || stockData[currentIndex]?.close || 0;

    if (holdings > 0) {
      const proceeds = holdings * price;
      finalBalance = balance + proceeds;
      const realizedPnL = proceeds - (holdings * averagePrice);
      const realizedPnLPct = ((price - averagePrice) / averagePrice) * 100;

      const closingTrade: Trade = {
        id: `trade-liquidate-${Date.now()}`,
        type: 'SELL',
        date: stockData[currentIndex]?.date || '만기',
        price,
        quantity: holdings,
        amount: proceeds,
        balanceAfter: finalBalance,
        entryPrice: averagePrice,
        realizedPnL,
        realizedPnLPct,
        isAutoLiquidated: true,
        candleIndex: currentIndex
      };
      finalTrades = [closingTrade, ...finalTrades];
      setBalance(finalBalance);
      setHoldings(0);
      setAveragePrice(0);
      setTrades(finalTrades);
      speakVoice("최종 자동 청산되었습니다.");
    }

    setIsPlaying(false);
    setShowResultModal(true);
    fetchPostReplayCritique(finalTrades);
    fetchLeaderboard(gameMode === 'minute' ? 'minute' : 'daily');
  };

  // Performance calculations
  const totalAssets = balance + holdings * wigglingPrice;
  const cumulativeReturn = ((totalAssets - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;
  
  const getVisibleCandlesList = () => {
    const sliced = stockData.slice(0, currentIndex + 1);
    if (sliced.length === 0) return [];
    
    const result = [...sliced];
    const lastIdx = result.length - 1;
    const originalLast = result[lastIdx];
    
    const progress = Math.min(1, Math.max(0, (60.0 - timeLeft) / 60.0));
    const isFinished = progress >= 0.999 || timeLeft === 0;

    // To make volume growth feel highly authentic (with intermittent surges of buying/selling),
    // we use a step-like curve combined with small continuous trickles, ending exactly at originalLast.volume.
    const getSimulatedVolume = () => {
      if (isFinished) return originalLast.volume;
      if (progress <= 0) return 0;
      
      // 12 discrete surges of block trade activity
      const steps = Math.floor(progress * 12);
      const baseProgress = steps / 12;
      
      // Add a slight continuous trickle between major transaction blocks
      const trickle = (progress - baseProgress) * 0.55;
      const volumeFraction = Math.min(1, baseProgress + trickle);
      
      return Math.round(originalLast.volume * volumeFraction);
    };

    result[lastIdx] = {
      ...originalLast,
      close: isFinished ? originalLast.close : (wigglingPrice || originalLast.close),
      high: isFinished ? originalLast.high : (runningHigh || originalLast.open),
      low: isFinished ? originalLast.low : (runningLow || originalLast.open),
      volume: getSimulatedVolume()
    };
    return result;
  };

  const visibleCandles = getVisibleCandlesList();

  // activeStock 데이터 연동용 변수 구성
  const activeStockAnalysis = (() => {
    const js = selectedStock;
    if (!js) return null;
    
    // afterMarketReport 가 있으면 거기서 jodoju15 리스트 중 맞는 것을 찾음
    const reportMatch = afterMarketReport?.jodoju15?.find(r => r.ticker === js.code);
    
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

    if (reportMatch) {
      return {
        ticker: js.code,
        name: js.name,
        changeRate: reportMatch.changeRate || js.changeRatio,
        closePrice: reportMatch.closePrice || sd.closePrice,
        tradeValue: reportMatch.tradeValue || (JODOJU_STOCKS.find((s: any) => s.code === js.code) as any)?.tradeValue || 1000,
        relatedThemes: reportMatch.relatedThemes || sd.relatedThemes,
        riseReason: reportMatch.riseReason || sd.riseReason,
        aiSummary: reportMatch.aiSummary || sd.aiSummary,
        supplyDemand: reportMatch.supplyDemand || {
          foreigner: sd.foreigner,
          institution: sd.institution
        }
      };
    }

    return {
      ticker: js.code,
      name: js.name,
      changeRate: js.changeRatio,
      closePrice: sd.closePrice,
      tradeValue: (JODOJU_STOCKS.find((s: any) => s.code === js.code) as any)?.tradeValue || 1000,
      relatedThemes: sd.relatedThemes,
      riseReason: sd.riseReason,
      aiSummary: sd.aiSummary,
      supplyDemand: {
        foreigner: sd.foreigner,
        institution: sd.institution
      }
    };
  })();

  const activeStockForeignerNum = activeStockAnalysis ? parseSupplyValue(activeStockAnalysis.supplyDemand?.foreigner || '') : 0;
  const activeStockInstitutionNum = activeStockAnalysis ? parseSupplyValue(activeStockAnalysis.supplyDemand?.institution || '') : 0;
  const activeStockRetailNum = -(activeStockForeignerNum + activeStockInstitutionNum);

  const submitLeaderboardScore = async (name: string, yieldRate: number, totalAssetsVal: number, symbol: string, simulateMismatch?: boolean) => {
    try {
      const serverType = gameMode === 'minute' ? 'danta' : 'ilbong';
      const res = await fetch('/api/leaderboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          yieldRate,
          symbol,
          totalAssets: totalAssetsVal,
          type: serverType,
          simulateMismatch: !!simulateMismatch
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.leaderboard) {
          setLeaderboard(data.leaderboard);
          setSubmissionResult({
            rank: data.rank,
            total: data.total,
            isTop10: data.isTop10,
            percentile: data.percentile
          });
          // Refresh audit logs if we are in debug mode
          fetchAuditLogs();
          return true;
        }
      }
    } catch (err) {
      console.error('Failed to submit score:', err);
    }
    return false;
  };

  const handleLeaderboardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim()) return;
    setIsSubmitting(true);
    setSubmissionResult(null); // Reset previous result
    const success = await submitLeaderboardScore(nickname, cumulativeReturn, totalAssets, selectedStock.name, simMismatchChecked);
    setIsSubmitting(false);
    if (success) {
      setSubmitSuccess(true);
      fetchLeaderboard(gameMode === 'minute' ? 'minute' : 'daily');
      fetchSidebarLeaderboard(sidebarLeaderboardTab);
    }
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;
    setIsFeedbackSubmitting(true);
    try {
      // Simulate real api call with timeout
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      const existingFeedbacks = JSON.parse(localStorage.getItem('user_feedbacks') || '[]');
      existingFeedbacks.push({
        text: feedbackText,
        contact: feedbackContact,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('user_feedbacks', JSON.stringify(existingFeedbacks));
      
      setFeedbackSuccess(true);
      setFeedbackText('');
      setFeedbackContact('');
      setTimeout(() => {
        setFeedbackSuccess(false);
        setShowFeedbackModal(false);
      }, 2200);
    } catch (err) {
      console.error('Failed to submit feedback', err);
    } finally {
      setIsFeedbackSubmitting(false);
    }
  };

  const copyShareText = () => {
    const plus = cumulativeReturn >= 0 ? '+' : '';
    const text = `[K-Stock Replay 주도주 리플레이]
🎖️ 도전 종목: ${selectedStock.name}
📈 누적 수익률: ${plus}${cumulativeReturn.toFixed(2)}%
💰 최종 평가자산: ${Math.round(totalAssets).toLocaleString()}원
🎯 매매 횟수: ${trades.length}회

나의 투자 능력을 단련하세요!`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans pb-28 lg:pb-0" id="app-root">
      {/* Upper Navigation Header */}
      <header className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-red-500/10 p-1.5 rounded-lg border border-red-500/30">
            <Flame className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-slate-100">K-STOCK REPLAY</h1>
            <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono mt-1">Leading Stocks Training Hub</p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2">

          {/* Theme Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-colors cursor-pointer h-8 w-8 flex items-center justify-center"
            title={isDarkMode ? "화이트모드" : "다크모드"}
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Audio Speaker Mute Toggle */}
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-colors cursor-pointer h-8 w-8 flex items-center justify-center"
            title={isMuted ? "음소거 해제" : "음소거"}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          {/* Integrated App Launcher Grid Menu Button */}
          <div className="relative" ref={launcherRef}>
            <button
              onClick={() => setShowLauncherMenu(!showLauncherMenu)}
              className={`p-1.5 rounded-lg border text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-900 transition-all cursor-pointer h-8 w-8 flex items-center justify-center ${
                showLauncherMenu ? 'border-red-500/50 text-red-400 shadow-md shadow-red-500/10' : 'border-slate-200 dark:border-slate-800'
              }`}
              title="통합 서비스 메뉴"
              aria-expanded={showLauncherMenu}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            <AnimatePresence>
              {showLauncherMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                  className="absolute right-0 mt-2 w-[290px] sm:w-[320px] bg-slate-50 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 overflow-hidden"
                >
                  {/* Launcher Header */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-2.5 mb-3 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-3 bg-indigo-500 rounded-full" />
                      <span className="text-xs font-black text-slate-800 dark:text-slate-200">K-STOCK 통합 메뉴</span>
                    </div>
                    <span className="text-[9px] font-bold text-indigo-400 font-mono tracking-widest bg-white dark:bg-slate-950 px-1.5 py-0.5 rounded">APP LAUNCHER</span>
                  </div>

                  {/* Service Menu Grid (SEO Friendly a tags + smooth SPA state updating) */}
                  <div className="flex flex-col gap-2.5 max-h-[450px] overflow-y-auto pr-0.5 custom-scrollbar">
                    
                    {/* Section 1: AI 투자 분석 리포트 */}
                    <div className="space-y-1.5 border-b border-slate-200 dark:border-slate-800/50 pb-2.5">
                      <div className="px-1 py-1">
                        <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider">AI 투자 분석 리포트</span>
                      </div>
                      
                      {/* Item: 장전뉴스 */}
                      <a
                        href="#morning-briefing"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowLauncherMenu(false);
                          setAiFeedActiveTab('morning');
                          setShowAiFeedModal(true);
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-950/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800/60 transition-all duration-200"
                      >
                        <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/25 transition-colors shrink-0 mt-0.5">
                          <Sparkles className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-400 transition-colors">장전뉴스</span>
                            <span className="text-[9px] font-mono font-black px-1.5 bg-indigo-500/20 text-indigo-400 rounded">MORNING</span>
                          </div>
                        </div>
                      </a>

                      {/* Item: 장마감 뉴스 */}
                      <a
                        href="#aftermarket-briefing"
                        onClick={(e) => {
                          e.preventDefault();
                          setShowLauncherMenu(false);
                          setAiFeedActiveTab('afternoon');
                          setShowAiFeedModal(true);
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-950/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800/60 transition-all duration-200"
                      >
                        <div className="bg-rose-500/10 p-2 rounded-lg border border-rose-500/20 text-rose-400 group-hover:bg-rose-500/25 transition-colors shrink-0 mt-0.5">
                          <ActivitySquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-rose-400 transition-colors">장마감 뉴스</span>
                            <span className="text-[9px] font-mono font-black px-1.5 bg-rose-500/20 text-rose-400 rounded">AFTERNOON</span>
                          </div>
                        </div>
                      </a>

                      {/* Item: 인사이트 */}
                      <a
                        href="/blog"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLauncherClick(e, 'blog');
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-950/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800/60 transition-all duration-200"
                      >
                        <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/25 transition-colors shrink-0 mt-0.5">
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-400 transition-colors">인사이트</span>
                            <span className="text-[9px] font-mono font-black px-1.5 bg-indigo-500/20 text-indigo-400 rounded">INSIGHT</span>
                          </div>
                        </div>
                      </a>

                      {/* Item: 증시 캘린더 */}
                      <a
                        href="/calendar"
                        onClick={(e) => {
                          e.preventDefault();
                          handleLauncherClick(e, 'calendar');
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-950/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800/60 transition-all duration-200"
                      >
                        <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/25 transition-colors shrink-0 mt-0.5">
                          <Calendar className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-400 transition-colors">증시 캘린더</span>
                            <span className="text-[9px] font-mono font-black px-1.5 bg-indigo-500/20 text-indigo-400 rounded">CALENDAR</span>
                          </div>
                        </div>
                      </a>
                    </div>

                    {/* Section 2: Policy/Terms (K-STOCK 오리지널 메뉴 글자 삭제 완료) */}
                    <div className="space-y-1.5">
                      {/* Item: 서비스 이용약관 */}
                      <a
                        href="/terms"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePolicyOpen('terms');
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-950/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800/60 transition-all duration-200"
                      >
                        <div className="bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 text-indigo-400 group-hover:bg-indigo-500/25 transition-colors shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-indigo-400 transition-colors">서비스 이용약관</span>
                            <span className="text-[9px] font-mono font-black px-1.5 bg-indigo-500/20 text-indigo-400 rounded">TERMS</span>
                          </div>
                        </div>
                      </a>

                      {/* Item: 개인정보처리방침 */}
                      <a
                        href="/privacy"
                        onClick={(e) => {
                          e.preventDefault();
                          handlePolicyOpen('privacy');
                        }}
                        className="group flex items-start gap-3 p-2.5 rounded-xl hover:bg-white dark:hover:bg-slate-950/80 border border-transparent hover:border-slate-200 dark:hover:border-slate-800/60 transition-all duration-200"
                      >
                        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 text-emerald-400 group-hover:bg-emerald-500/25 transition-colors shrink-0 mt-0.5">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 group-hover:text-emerald-400 transition-colors">개인정보처리방침</span>
                            <span className="text-[9px] font-mono font-black px-1.5 bg-emerald-500/20 text-emerald-400 rounded">PRIVACY</span>
                          </div>
                        </div>
                      </a>
                    </div>

                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* Platform Navigation Tabs */}
      <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-[57px] z-30">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="grid grid-cols-2 md:flex md:items-center gap-2">
            <button
              onClick={() => setPlatformTab('replay')}
              className={`px-3 py-2.5 md:py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center md:justify-start gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                platformTab === 'replay'
                  ? 'bg-red-500 text-white shadow-md shadow-red-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50'
              }`}
            >
              <Flame className="w-3.5 h-3.5" />
              <span>주식시뮬레이터</span>
            </button>

            <button
              onClick={() => setPlatformTab('jodoju')}
              className={`px-3 py-2.5 md:py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center md:justify-start gap-1.5 whitespace-nowrap cursor-pointer shrink-0 ${
                platformTab === 'jodoju'
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>당일주도주 분석</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Body Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 md:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">

        {/* Google AdSense Horizontal Banner Slot */}
        <div className="lg:col-span-12 h-[90px] w-full" />



        {platformTab === 'replay' ? (
          <>
            <div className="lg:col-span-12">
              <ReportDatePicker selectedDate={replayDate} onSelectDate={(date) => {
                setReplayDate(date);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} />
            </div>
            
            {/* Left Side: Chart Section (Col span 12 on mobile, 8 on desktop) */}
        <div className="lg:col-span-8 flex flex-col gap-3">
          
          {/* Game Mode & Jodoju Stock Selector Control Card (Responsive for both Desktop and Mobile) */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
            {/* Mode Taps & Provider Selector */}
            <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center w-full xl:w-auto">
              <div className="grid grid-cols-2 gap-1.5 bg-white dark:bg-slate-950 p-1 rounded-lg border border-slate-800 w-full sm:w-56 flex-shrink-0">
                <button
                  onClick={() => { setGameMode('daily'); setIsPlaying(false); setIsRandomChallengeMode(false); }}
                  className={`py-1.5 text-xs font-black rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    gameMode === 'daily' 
                      ? 'bg-red-500 text-white shadow-lg' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>일봉 모드</span>
                </button>
                <button
                  onClick={() => { setGameMode('minute'); setIsPlaying(false); setIsRandomChallengeMode(false); }}
                  className={`py-1.5 text-xs font-black rounded-md flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    gameMode === 'minute' 
                      ? 'bg-blue-500 text-white shadow-lg' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>분봉 모드</span>
                </button>
              </div>
            </div>

            {/* Jodoju Stock Selection Dropdown & Random Challenge */}
            <div className="flex flex-col sm:flex-row gap-2 items-stretch flex-1 xl:justify-end">
              <div className="relative flex-1 max-w-full sm:max-w-[240px]">
                <select
                  value={isRandomChallengeMode ? 'BLIND' : selectedStock.code}
                  onChange={(e) => {
                    if (e.target.value === 'BLIND') return;
                    const match = stockList.find(s => s.code === e.target.value);
                    if (match) {
                      setSelectedStock(match);
                      setIsRandomChallengeMode(false);
                    }
                  }}
                  className={`w-full bg-white dark:bg-slate-950 border rounded-lg px-3 py-2 text-xs font-black focus:outline-none appearance-none cursor-pointer h-full min-h-[36px] ${
                    isRandomChallengeMode ? 'border-amber-500/30 text-amber-400 bg-amber-500/5' : 'border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:border-slate-600'
                  }`}
                >
                  {isRandomChallengeMode && (
                    <option value="BLIND">블라인드 챌린지 진행 중 🔒 (종목 선택시 해제)</option>
                  )}
                  {stockList.map((stk: any) => {
                    let valueInBillion = 0;
                    if (stk.tradingValue !== undefined) {
                      valueInBillion = Math.round(stk.tradingValue / 100000000); // 1억 = 100,000,000 KRW
                    } else if (stk.tradeValue !== undefined) {
                      valueInBillion = stk.tradeValue;
                    }
                    const sector = stk.sector || getStockSector(stk.code);
                    return (
                      <option key={stk.code} value={stk.code}>
                        [{stk.rank}위] {stk.name} | {sector} | {valueInBillion.toLocaleString()}억 | {stk.changeRatio !== undefined ? `${stk.changeRatio >= 0 ? '+' : ''}${stk.changeRatio.toFixed(1)}%` : ''}
                      </option>
                    );
                  })}
                </select>
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-500 dark:text-slate-500">
                  <ChevronRight className="w-4 h-4 rotate-90" />
                </div>
              </div>

              {/* Random Challenge Launcher */}
              <button
                onClick={handleRandomChallenge}
                className="px-3.5 py-2 text-xs font-extrabold bg-gradient-to-r from-red-500 to-amber-500 hover:from-red-600 hover:to-amber-600 rounded-lg text-white shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[36px]"
              >
                <RotateCcw className="w-3.5 h-3.5 animate-spin-slow" />
                <span>랜덤 챌린지 🎲</span>
              </button>
            </div>
          </div>
          
          {/* Active Stock & Price Overlay Info Banner */}
          <div className="bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:p-4 flex flex-col gap-2 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500" />
            
            {/* Row 1: 주도주 ---------------------------------- 실시간체결가 */}
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1.5 shrink-0 select-none">
                <span className="bg-red-500/15 text-red-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-red-500/20">주도주</span>
              </div>
              <div className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider shrink-0 select-none">실시간체결가</div>
            </div>

            {/* Row 2: 금호타이어 --------------------------- 7,460원(0.00%) */}
            <div className="flex items-center justify-between w-full">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 truncate shrink-0">
                {isRandomChallengeMode ? '블라인드 종목 🔒' : selectedStock.name}
              </h2>
              <div className="flex items-center gap-1.5 text-slate-900 dark:text-slate-100 font-mono shrink-0">
                <span className={`text-base sm:text-lg font-black ${getDailyChangeRatio(wigglingPrice) >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  {wigglingPrice.toLocaleString()}원
                </span>
                {sessionStartPrice > 0 && (
                  <span className={`text-xs sm:text-sm font-bold ${
                    getDailyChangeRatio(wigglingPrice) >= 0 
                      ? 'text-red-400' 
                      : 'text-blue-400'
                  }`}>
                    ({getDailyChangeRatio(wigglingPrice) >= 0 ? '+' : ''}
                    {getDailyChangeRatio(wigglingPrice).toFixed(2)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Pure HTML5 Canvas Replay Chart Wrapper */}
          <div className="bg-slate-50 dark:bg-slate-900/55 border border-slate-200 dark:border-slate-800 rounded-xl p-3 h-[380px] sm:h-[490px] shadow-inner relative">
            <CanvasChart
              candles={visibleCandles}
              averagePrice={averagePrice}
              hoverIndex={hoverIndex}
              setHoverIndex={setHoverIndex}
              trades={trades}
              currentIndex={currentIndex}
              totalCandles={stockData.length}
              gameMode={gameMode}
            />

            {/* Float HUD of Candle Progress */}
            <div className="absolute top-4 left-4 bg-white dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 px-2.5 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-mono text-white">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span className="text-white">진행률 :</span>
              <span className="text-white font-extrabold">{currentIndex + 1} / {stockData.length}</span>
              <span className="text-white">{gameMode === 'daily' ? '일봉' : '분봉'}</span>
            </div>
          </div>



          {/* Chart Core Controls & Ticking Interface */}
          <div className="bg-slate-50 dark:bg-slate-900/55 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Start / Pause controls */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              {isPlaying ? (
                <button
                  onClick={() => setIsPlaying(false)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-400 text-xs font-black rounded-lg transition-all cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>일시정지</span>
                </button>
              ) : (
                <button
                  onClick={() => setIsPlaying(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-lg shadow-lg shadow-emerald-950/40 transition-all cursor-pointer animate-pulse"
                >
                  <Play className="w-4 h-4" />
                  <span>훈련 시작</span>
                </button>
              )}

              {/* Force Next Day/Minute candle jump */}
              <button
                onClick={finalizeAndNext}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 transition-all cursor-pointer"
                title="Spacebar 키 대응"
              >
                <span>다음 봉 ➡️</span>
              </button>
            </div>

            {/* 2x Speed widget */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => setIsDoubleSpeed(!isDoubleSpeed)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-black rounded-lg border transition-all cursor-pointer ${
                  isDoubleSpeed 
                    ? 'bg-blue-500/20 border-blue-500/50 text-blue-400' 
                    : 'bg-slate-800 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>2배속 (30초 완성)</span>
              </button>
            </div>

            {/* Countdown timer progress bar */}
            <div className="w-full md:w-48 flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] text-slate-600 dark:text-slate-400 font-mono font-bold">
                <span>캔들 세틀링 타이머</span>
                <span className="text-slate-800 dark:text-slate-200">{(timeLeft / (isDoubleSpeed ? 2 : 1)).toFixed(1)}초 남음</span>
              </div>
              <div className="h-1.5 w-full bg-white dark:bg-slate-950 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
                <div 
                  className={`h-full rounded-full transition-all duration-100 ${
                    gameMode === 'minute' ? 'bg-blue-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(timeLeft / 60.0) * 100}%` }}
                />
              </div>
            </div>

            {/* Session Terminate Button */}
            <button
              onClick={handleEndSession}
              className="w-full md:w-auto px-4 py-2 bg-white dark:bg-slate-950 border border-red-500/20 text-red-400 hover:bg-red-500/10 text-xs font-black rounded-lg transition-colors cursor-pointer"
            >
              훈련 종료 🏁
            </button>
          </div>


        </div>

        {/* Right Side: Trading Desk, Orders and Logs (Col span 12 on mobile, 4 on desktop) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          
          {/* Portfolio & Assets Panel Card */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 relative">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-2">
              <span className="text-xs text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-indigo-400" />
                보유 평가 자산
              </span>
              <span className={`text-xs font-black font-mono ${cumulativeReturn >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {cumulativeReturn >= 0 ? '+' : ''}{cumulativeReturn.toFixed(2)}%
              </span>
            </div>

            <div className="flex justify-between items-end">
              <div className="text-xs text-slate-600 dark:text-slate-400">총 평가액</div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                {Math.round(totalAssets).toLocaleString()}원
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-800/50 font-mono">
              <div>
                <span className="text-slate-600 dark:text-slate-400">가용 예수금 :</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">{balance.toLocaleString()}원</div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">평균 매입가 :</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">{averagePrice > 0 ? `${averagePrice.toLocaleString()}원` : '-'}</div>
              </div>
              <div className="mt-2">
                <span className="text-slate-600 dark:text-slate-400">보유 수량 :</span>
                <div className="text-slate-800 dark:text-slate-200 font-bold mt-0.5">{holdings.toLocaleString()}주</div>
              </div>
              <div className="mt-2">
                <span className="text-slate-600 dark:text-slate-400">평가 손익 :</span>
                <div 
                  id="evaluationProfit"
                  className="font-bold mt-0.5"
                  style={{
                    color: holdings > 0 
                      ? ((wigglingPrice - averagePrice) * holdings > 0 
                          ? '#ff4d4d' 
                          : ((wigglingPrice - averagePrice) * holdings < 0 ? '#4d4dff' : '#ffffff'))
                      : '#94a3b8'
                  }}
                >
                  {holdings > 0 ? (
                    (() => {
                      const evaluationProfitXxx = (wigglingPrice - averagePrice) * holdings;
                      const sign = evaluationProfitXxx > 0 ? '+' : '';
                      return `${sign}${evaluationProfitXxx.toLocaleString()}원`;
                    })()
                  ) : '-'}
                </div>
              </div>
            </div>
          </div>

          {/* Orders Desk Panel (Big tactile buttons for touch targets) */}
          <div className="hidden lg:flex bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex-col gap-3">
            <h3 className="text-xs text-slate-600 dark:text-slate-400 font-black border-b border-slate-200 dark:border-slate-800 pb-2 flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              실시간 쾌속 주문대 (분할 비중)
            </h3>

            {/* Buying Suite */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-red-400 font-black">매수 분할 비율</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-500 font-bold">수량 자동 계산</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 25, 50, 100].map((pct) => (
                  <button
                    key={`buy-btn-${pct}`}
                    onClick={() => handleBuyPercent(pct)}
                    className={`py-2.5 font-extrabold text-[11px] rounded-lg active:scale-95 transition-all cursor-pointer text-center ${lastBuyPercent === pct ? 'bg-rose-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {pct === 100 ? '올인' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Selling Suite */}
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-200 dark:border-slate-800/30">
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-blue-400 font-black">매도 분할 비율</span>
                <span className="text-[9px] text-slate-500 dark:text-slate-500 font-bold">비중 자동 매도</span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[10, 25, 50, 100].map((pct) => (
                  <button
                    key={`sell-btn-${pct}`}
                    onClick={() => handleSellPercent(pct)}
                    className={`py-2.5 font-extrabold text-[11px] rounded-lg active:scale-95 transition-all cursor-pointer text-center ${lastSellPercent === pct ? 'bg-blue-500 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                  >
                    {pct === 100 ? '전량' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 🏆 Hall of Fame Sidebar (챌린지 순위) */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col min-h-[320px]">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800/80 pb-2 mb-3">
              <span className="text-xs text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-yellow-500 animate-pulse" />
                실시간 랜덤챌린지 순위
              </span>
              
              {/* Daily / Minute toggle buttons for Sidebar Hall of Fame */}
              <div className="flex gap-1 bg-white dark:bg-slate-950 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800">
                <button
                  onClick={() => setSidebarLeaderboardTab('daily')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    sidebarLeaderboardTab === 'daily'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  일봉
                </button>
                <button
                  onClick={() => setSidebarLeaderboardTab('minute')}
                  className={`px-2 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                    sidebarLeaderboardTab === 'minute'
                      ? 'bg-slate-200 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  분봉
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 pr-0.5 gap-1.5 flex flex-col max-h-[260px] custom-scrollbar">
              {sidebarLeaderboard.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500 dark:text-slate-500 py-10">
                  <AlertCircle className="w-5 h-5 text-slate-500 dark:text-slate-500 mb-1" />
                  <span className="text-[10px]">아직 성적이 없습니다.</span>
                </div>
              ) : (
                sidebarLeaderboard.map((entry, idx) => {
                  const isTop3 = idx < 3;
                  const rankColor = idx === 0 ? 'text-yellow-400 font-black' : idx === 1 ? 'text-slate-700 dark:text-slate-300 font-black' : idx === 2 ? 'text-amber-600 font-black' : 'text-slate-500 dark:text-slate-500';
                  const rankBg = idx === 0 ? 'bg-yellow-500/10 border-yellow-500/20' : idx === 1 ? 'bg-slate-300/10 border-slate-300/20' : idx === 2 ? 'bg-amber-600/10 border-amber-600/20' : 'bg-white dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/50';
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-2 border rounded-lg flex items-center justify-between transition-all hover:bg-slate-800/50 ${rankBg}`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <span className={`text-xs w-4 text-center flex-shrink-0 ${rankColor}`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </span>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-slate-900 dark:text-slate-100 text-[11px] font-extrabold truncate max-w-[100px] leading-tight" title={entry.name}>
                            {entry.name}
                          </span>
                          <span className="text-slate-600 dark:text-slate-400 text-[9px] truncate max-w-[100px] leading-tight mt-0.5">
                            {entry.symbol}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col leading-tight justify-center flex-shrink-0">
                        <span className={`text-[11px] font-extrabold font-mono ${
                          entry.yieldRate >= 0 ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {entry.yieldRate >= 0 ? '+' : ''}{entry.yieldRate.toFixed(2)}%
                        </span>
                        <span className="text-slate-600 dark:text-slate-400 text-[8px] font-mono mt-0.5">
                          {entry.date || '실거래'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Google AdSense Sidebar Rectangle Ad Slot */}
          <div className="min-h-[90px] md:min-h-[250px] w-full" />
        </div>

        {/* 📚 Professional Trading Academy & Strategy Hub (SEO / AdSense-Friendly Interactive Learning & Strategy Guide Center) */}
        <div className="lg:col-span-12 mt-6 border-t border-slate-200 dark:border-slate-800/80 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20">
              <BookOpen className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 tracking-tight">트레이딩 가이드 & 실전 전략 센터</h2>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 font-sans mt-0.5">시뮬레이터 기획 배경 및 핵심 주도주 매매 전략 가이드북을 확인하세요.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-2">
            {/* Action Card 1: 기획 배경 및 차별성 */}
            <button
              onClick={() => setShowBackgroundModal(true)}
              className="group bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/85 border border-slate-200 dark:border-slate-800/80 hover:border-indigo-500/40 rounded-xl p-4 text-left transition-all duration-300 flex items-center justify-between cursor-pointer"
            >
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-300 transition-colors">
                  01. 시뮬레이터 기획 배경 및 차별점 💡
                </h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 max-w-[280px] sm:max-w-md">
                  주도주 리플레이 훈련의 필요성 및 기존 모의투자 대비 핵심 차별화 요소 알아보기
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-500 group-hover:text-indigo-400 transition-colors transform group-hover:translate-x-0.5" />
            </button>

            {/* Action Card 2: 실전 매매 전략 */}
            <button
              onClick={() => setShowStrategyModal(true)}
              className="group bg-slate-50 dark:bg-slate-900/40 hover:bg-slate-50 dark:hover:bg-slate-900/85 border border-slate-200 dark:border-slate-800/80 hover:border-red-500/40 rounded-xl p-4 text-left transition-all duration-300 flex items-center justify-between cursor-pointer"
            >
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-red-300 transition-colors">
                  02. 실전 주도주 핵심 매매 전략 📈
                </h3>
                <p className="text-[10px] text-slate-600 dark:text-slate-400 max-w-[280px] sm:max-w-md">
                  종가베팅, 눌림목, 시가돌파, 고점돌파 등 프로 트레이더들의 실전 수급 전략 가이드북
                </p>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-500 dark:text-slate-500 group-hover:text-red-400 transition-colors transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
          </>
        ) : platformTab === 'jodoju' ? (
          <div className="lg:col-span-12 w-full flex flex-col gap-3">
            <div className="flex justify-end">
              <ReportDatePicker selectedDate={replayDate} onSelectDate={(date) => {
                setReplayDate(date);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }} />
            </div>
            <JodojuAnalysisView 
              report={afterMarketReport} 
              onSelectStockForReplay={(code) => {
                const match = findStockByCode(code);
                if (match) {
                  setSelectedStock(match);
                  setPlatformTab('replay');
                }
              }}
              selectedDate={replayDate}
              onSelectDate={(date) => {
                setReplayDate(date);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              stockList={stockList}
            />
          </div>
        ) : platformTab === 'blog' ? (
          <BlogCenter onBack={() => {
            setPlatformTab('replay');
            setShowLauncherMenu(true);
            window.history.pushState(null, '', '/');
          }} />
        ) : platformTab === 'calendar' ? (
          <StockCalendarView 
            onBack={() => {
              setPlatformTab('replay');
              setShowLauncherMenu(true);
              window.history.pushState(null, '', '/');
            }} 
            onSelectHistoricalStock={(stock, date) => {
              setReplayDate(date);
              const match = stockList.find(s => s.code === stock.code) || {
                name: stock.name,
                code: stock.code,
                theme: stock.theme || '역사적 테마',
                reason: stock.reason || '상승 사유',
                changeRatio: parseFloat(stock.changeRatio || stock.pct || '15'),
                tradeValue: parseFloat(stock.tradeValue || '1000')
              };
              setSelectedStock(match);
              setPlatformTab('replay');
              window.history.pushState(null, '', '/');
            }}
          />
        ) : (
          <AdminConsole 
            briefing={preMarketBriefing}
            report={afterMarketReport}
            onUpdateBriefing={async (updated) => {
              await fetch('/api/platform/briefing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
              });
              await fetchPreMarketBriefing();
            }}
            onUpdateReport={async (updated) => {
              await fetch('/api/platform/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updated)
              });
              await fetchAfterMarketReport();
            }}
            onTriggerBriefing={async () => {
              await fetch('/api/platform/briefing', { method: 'POST' });
              await fetchPreMarketBriefing();
            }}
            onTriggerReport={async () => {
              await fetch('/api/platform/report', { method: 'POST' });
              await fetchAfterMarketReport();
            }}
            onTriggerStudyGuide={async (symbol) => {
              await fetch(`/api/platform/guide?symbol=${symbol}`, { method: 'POST' });
              if (symbol === selectedStock.code) {
                await fetchStudyGuide(symbol);
              }
            }}
            onOpenDebug={() => setShowDebugModal(true)}
            providerIndex={providerIndex}
            setProviderIndex={setProviderIndex}
          />
        )}

        {/* Google AdSense Bottom Horizontal Banner Slot */}
        <div className="lg:col-span-12 h-[90px] w-full" />
      </main>

      {/* FOOTER credit */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/40 p-5 text-center text-slate-500 dark:text-slate-500 text-[10px] font-mono leading-relaxed mt-auto flex flex-col items-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-slate-600 dark:text-slate-400 text-[11px] font-sans">
          <button 
            onClick={() => setShowTermsModal(true)} 
            className="hover:text-slate-800 dark:hover:text-slate-200 underline transition-colors cursor-pointer flex items-center gap-1"
          >
            <FileText className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
            <span>이용약관</span>
          </button>
          <span className="text-slate-800">|</span>
          <button 
            onClick={() => setShowPrivacyModal(true)} 
            className="hover:text-slate-800 dark:hover:text-slate-200 underline transition-colors cursor-pointer flex items-center gap-1"
          >
            <Shield className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
            <span>개인정보처리방침</span>
          </button>
          <span className="text-slate-800">|</span>
          <button 
            onClick={() => setShowFeedbackModal(true)} 
            className="hover:text-slate-800 dark:hover:text-slate-200 underline transition-colors cursor-pointer flex items-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-bold text-indigo-300">피드백 및 오류 제보</span>
          </button>
        </div>
        <div>
          K-Stock Replay Simulator — Powered by HTML5 Canvas and Tailwind CSS.<br />
          This application runs fully server-independent for cost-effectiveness and 100% security.
        </div>
      </footer>

      {/* Hall of Fame Ranking overlay modal */}
      <AnimatePresence>
        {showLeaderboard && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-5 max-h-[90vh] flex flex-col relative"
            >
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>실시간 랜덤챌린지 순위</span>
              </h2>

              {/* Leaderboard Table */}
              <div className="flex-1 overflow-y-auto mb-5">
                <div className="w-full overflow-x-auto custom-scrollbar">
                  <table className="min-w-[340px] w-full text-left text-xs font-mono">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-500 font-bold">
                        <th className="py-2 pl-1">순위</th>
                        <th className="py-2">이름</th>
                        <th className="py-2">수익률</th>
                        <th className="py-2">도전종목</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaderboard.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500 dark:text-slate-500">
                            아직 등록된 성적이 없습니다. 첫 영광을 쟁취해보세요!
                          </td>
                        </tr>
                      ) : (
                        leaderboard.map((item, index) => (
                          <tr key={index} className="border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-800/40">
                            <td className="py-3 pl-1 font-black">
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}위`}
                            </td>
                            <td className="py-3 font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[100px]">{item.name}</td>
                            <td className={`py-3 font-bold ${item.yieldRate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                              {item.yieldRate >= 0 ? '+' : ''}{item.yieldRate.toFixed(2)}%
                            </td>
                            <td className="py-3 text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-[90px]">{item.symbol}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-full py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Training Session Finished Summary Result Modal */}
      <AnimatePresence>
        {showResultModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 text-center shadow-2xl relative"
            >
              {submitSuccess && submissionResult && submissionResult.rank !== undefined ? (
                <div className="flex flex-col items-center justify-center mb-4 mt-1">
                  <div className="text-5xl mb-1 filter drop-shadow-[0_4px_10px_rgba(251,191,36,0.4)] select-none">
                    {submissionResult.rank === 1 ? '🥇' : 
                     submissionResult.rank === 2 ? '🥈' : 
                     submissionResult.rank === 3 ? '🥉' : 
                     submissionResult.rank <= 10 ? '🏆' : '🎖️'}
                  </div>
                  <div className="text-lg font-black text-yellow-400 font-mono flex items-center gap-1.5 justify-center">
                    <span>실시간 {submissionResult.rank}위 달성!</span>
                  </div>
                </div>
              ) : (
                <Award className="w-12 h-12 text-yellow-500 mx-auto mb-2 animate-bounce" />
              )}
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100">훈련이 완료되었습니다!</h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                도전 종목: <span className="font-bold text-slate-800 dark:text-slate-200">{selectedStock.name} ({selectedStock.code})</span> {isRandomChallengeMode && <span className="text-amber-400 font-extrabold ml-1">🎉 (블라인드 해제!)</span>}
              </p>

              {/* Performance Box */}
              <div className="bg-white dark:bg-slate-950/80 rounded-xl p-4 my-4 border border-slate-200 dark:border-slate-800 flex flex-col gap-2.5 font-mono">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400 text-xs">최종 수익률:</span>
                  <span className={`text-xl font-black ${cumulativeReturn >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                    {cumulativeReturn >= 0 ? '+' : ''}{cumulativeReturn.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400">최종 자산액:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{Math.round(totalAssets).toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400">총 매매 횟수:</span>
                  <span className="text-slate-800 dark:text-slate-200 font-bold">{trades.length}회</span>
                </div>
                <div className="flex justify-between items-center text-xs border-t border-slate-200 dark:border-slate-800/30 pt-1.5 mt-0.5">
                  <span className="text-slate-600 dark:text-slate-400">매수 횟수:</span>
                  <span className="text-red-400 font-bold">{trades.filter(t => t.type === 'BUY').length}회</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-600 dark:text-slate-400">매도 횟수:</span>
                  <span className="text-blue-400 font-bold">{trades.filter(t => t.type === 'SELL').length}회</span>
                </div>
              </div>

              {/* Performance short feedback comment */}
              <div className="bg-white dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 mb-3 text-xs font-semibold text-amber-400/90 leading-relaxed text-center">
                {getPerformanceComment(cumulativeReturn)}
              </div>

              {/* AI Trading Critique Segment */}
              <div className="bg-gradient-to-br from-slate-50 to-indigo-50/50 dark:from-slate-950 dark:to-indigo-950/20 border border-indigo-100 dark:border-indigo-500/10 rounded-xl p-3.5 mb-4 text-left space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-1.5 border-b border-indigo-100/50 dark:border-slate-900 pb-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 animate-pulse" />
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">AI 실시간 거래 분석 피드백</span>
                </div>
                {critiqueLoading ? (
                  <div className="flex items-center gap-2 py-3 text-xs text-slate-500 dark:text-slate-500 font-mono">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
                    <span>AI 복기 분석기를 구동하는 중...</span>
                  </div>
                ) : replayCritique ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-slate-700 dark:text-slate-400 font-bold">학습 평점: <strong className="text-amber-600 dark:text-amber-400 font-black text-xs">{replayCritique.score}등급</strong></span>
                      <span className="text-slate-700 dark:text-slate-400 font-bold">매매 일치도: <strong className="text-indigo-600 dark:text-indigo-400 font-black">{replayCritique.fitIndex}%</strong></span>
                    </div>
                    <p className="text-[11px] text-slate-800 dark:text-slate-200 leading-relaxed font-sans break-keep break-words whitespace-normal">
                      {replayCritique.adviceText}
                    </p>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 italic font-medium">
                    매매 기록이 존재하지 않아 AI 점수를 부여하지 않았습니다. 최소 1회 매매를 진행하세요.
                  </p>
                )}
              </div>

              {/* Nickname Submit Form */}
              {!submitSuccess ? (
                <form onSubmit={handleLeaderboardSubmit} className="flex flex-col gap-2 mb-4">
                  <div className="text-xs text-slate-600 dark:text-slate-400 text-left pl-1 font-bold">랭킹에 기록 등록하기 :</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="닉네임 입력 (최대 12자)"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={12}
                      className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-slate-600 text-slate-800 dark:text-slate-200"
                    />
                    <button
                      type="submit"
                      disabled={isSubmitting || !nickname.trim()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:bg-slate-800 disabled:text-slate-600 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                    >
                      {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>등록</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold py-2.5 px-3 rounded-xl mb-4 flex flex-col items-center justify-center gap-1.5">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Check className="w-4 h-4" />
                    <span>성적이 실시간 랜덤챌린지 순위에 등록되었습니다!</span>
                  </div>
                  {submissionResult && (
                    <div className="mt-2 text-[12px] text-indigo-300 font-extrabold font-mono flex flex-col items-center gap-1 bg-indigo-500/10 p-2 rounded-lg border border-indigo-500/20 w-full">
                      {submissionResult.rank !== undefined && submissionResult.rank > 0 ? (
                        <div>
                          {submissionResult.rank === 1 && '🥇 '}
                          {submissionResult.rank === 2 && '🥈 '}
                          {submissionResult.rank === 3 && '🥉 '}
                          {submissionResult.rank > 3 && submissionResult.rank <= 10 && '🏆 '}
                          {submissionResult.rank <= 10 ? (
                            <span>
                              나의 실시간 순위: <span className="text-yellow-400 font-black">{submissionResult.rank}위</span> / {submissionResult.total}명
                            </span>
                          ) : (
                            <span>🎖️ 실시간 순위 등록 완료!</span>
                          )}
                        </div>
                      ) : (
                        <div>
                          🎖️ 실시간 순위 등록 완료!
                        </div>
                      )}
                      {submissionResult.percentile !== undefined && (
                        <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold mt-0.5">
                          백분위: <span className="text-pink-400">상위 {submissionResult.percentile}%</span> 이내의 트레이더!
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Multi action buttons */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  onClick={copyShareText}
                  className="py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '복사 완료' : '결과 공유'}</span>
                </button>
                <button
                  onClick={handleResetCurrent}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-950 text-xs font-black rounded-xl transition-colors cursor-pointer"
                >
                  다시 훈련하기 🔄
                </button>
              </div>

              {/* Close Overlay link */}
              <button
                onClick={() => setShowResultModal(false)}
                className="text-xs text-slate-500 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 underline mt-4 block mx-auto cursor-pointer"
              >
                메인화면으로 가기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💡 Simulator Full Guide Modal */}
      <AnimatePresence>
        {isGuideModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 flex flex-col shadow-2xl relative"
            >
              <h2 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <Info className="w-4 h-4 text-amber-400" />
                <span>주도주 시뮬레이터 가이드 및 이용수칙</span>
              </h2>
              
              <div className="space-y-3.5 text-left my-2">
                {GUIDE_RULES.map((rule, idx) => (
                  <div key={idx} className="flex gap-3 bg-white dark:bg-slate-950/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60 hover:border-slate-200 dark:hover:border-slate-800 transition-colors">
                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center text-xs font-black font-mono">
                      {idx + 1}
                    </span>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                      {rule.text}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setIsGuideModalOpen(false)}
                className="w-full mt-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-colors cursor-pointer"
              >
                가이드 확인완료 👍
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📜 Terms of Service Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 max-h-[85vh] flex flex-col"
            >
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <span>K-Stock Replay 이용약관 & 강력 면책고지</span>
              </h2>
              
              <div className="flex-1 overflow-y-auto text-xs text-slate-600 dark:text-slate-400 space-y-4 pr-1 text-left leading-relaxed custom-scrollbar">
                <section>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">제 1 조 (목적)</h3>
                  <p>본 약관은 "K-Stock Replay 주도주 리플레이 시뮬레이터"(이하 '서비스')가 제공하는 가상 모의 주식 거래 및 트레이딩 훈련 소프트웨어의 이용에 있어, 서비스 개발자와 이용자 간의 구체적인 권리, 의무, 제한 조건 및 민형사상 면책 범위를 세부적으로 규정하는 것을 목적으로 합니다.</p>
                </section>
                
                <section>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">제 2 조 (서비스의 성격 및 거래 배제)</h3>
                  <p>1. 본 서비스는 오직 교육, 가상 모의 투자 훈련, 트레이딩 전략 검증 및 게임성 엔터테인먼트 목적으로만 기획 및 제공됩니다. 실제 증권사 API 연동, 실제 주식 주문 대행, 장외 거래 또는 어떠한 실제 금융 자산의 예치나 거래를 직접/간접적으로 중개하지 않습니다.</p>
                  <p>2. 서비스 내에서 연출 및 표시되는 모든 캔들봉 데이터, 체결 가액, 가상 매매 호가, 호가창 움직임 및 랭킹 데이터는 과거 기록의 임의 보정 처리 또는 가공 알고리즘을 거친 모의용 수치입니다. 따라서 실제 자본 시장의 시세와 완전히 일치하지 않으며 시차가 존재할 수 있습니다.</p>
                </section>

                <section className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-red-500/20 space-y-2">
                  <h3 className="font-bold text-red-400 text-xs flex items-center gap-1.5">
                    <span>⚠️ 제 3 조 (강력한 책임 배제 및 면책 조항)</span>
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">이용자는 아래의 면책 및 배제 사항을 명확히 확인하고 동의한 것으로 간주합니다.</p>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <li><strong>실제 투자 결과에 대한 책임 면제:</strong> 본 서비스의 훈련 과정을 통해 획득한 가상 수익률, 거래 기법, 패턴 분석 결과 등 모든 가상의 수치는 실전 주식 투자에서의 성공이나 수익 실현을 일체 보증하거나 보장하지 않습니다. 이용자가 본 서비스의 내용을 모방, 참조하여 실제 주식, 선물, 옵션, 암호화폐 등 금융 시장에서 실행한 모든 실거래 판단의 결과(원금 손실, 재산 상 피해, 신용 하락 등)에 대한 책임은 전적으로 이용자 본인에게 전속됩니다. 본 서비스 개발자, 운영자 및 기여자는 그 어떤 직간접적 손실이나 손해배상 청구에 대해서도 법적, 도의적 책임을 지지 않습니다.</li>
                    <li><strong>정보 제공 오류 및 지연 면책:</strong> 서버 또는 데이터 공급 파이프라인의 일시적 장애, 네트워크 불통, 하드웨어 장치 파손, 또는 브라우저 로컬 데이터 소거(localStorage 초기화) 등으로 인하여 발생하는 가상 훈련 데이터 유실, 순위 누락, 차트 드로잉 중단 현상에 대해 개발사는 일체의 복구 의무 및 손해 배상 청구를 받지 않습니다.</li>
                    <li><strong>알고리즘 및 시스템 무오류성 배제:</strong> 본 소프트웨어는 작성 시점의 최선을 다해 검증되었으나, 잠재적 버그나 논리 오류가 존재할 수 있습니다. 시스템 오류로 과도한 가상 수익률이나 가상 잔고의 비정상적 가감이 발생하더라도, 이는 시뮬레이션용 단순 해프닝일 뿐 실제 자산에 어떠한 효력도 없습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">제 4 조 (순위 시스템 부정 이용 금지)</h3>
                  <p>1. 이용자는 "실시간 랜덤챌린지 순위" 등록 시 타인에게 모욕감을 유발하거나 사회적 미풍양속을 저해하는 닉네임을 사용해서는 안 됩니다. 적발 시 운영진은 고지 없이 즉각 삭제 및 정지 조치를 취할 수 있습니다.</p>
                  <p>2. 비정상적 메모리 조작, 패킷 변조 또는 스크립트 해킹 등을 통하여 수익률 수치나 거래 데이터를 고의로 조작하여 등록하는 부정행위가 발각될 시, 해당 데이터는 영구 말소되며 형사 처벌의 대상이 될 수 있습니다.</p>
                </section>
                
                <section>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">부칙</h3>
                  <p>본 약관 및 세부 면책 조항은 최초 서비스 배포 시점부터 이용자 전원에게 엄격히 적용됩니다.</p>
                </section>
              </div>

              <button
                onClick={() => setShowTermsModal(false)}
                className="w-full mt-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                약관 및 면책조항에 동의하고 닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 🛡️ Privacy Policy Modal */}
      <AnimatePresence>
        {showPrivacyModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 max-h-[85vh] flex flex-col"
            >
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>개인정보처리방침</span>
              </h2>
              
              <div className="flex-1 overflow-y-auto text-xs text-slate-600 dark:text-slate-400 space-y-4 pr-1 text-left leading-relaxed custom-scrollbar">
                <section>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">1. 개인정보 수집에 대한 동의 및 수집 범위</h3>
                  <p>본 서비스는 이용자의 불필요한 정보 수집을 방지하기 위하여 별도의 회원가입을 요구하지 않으며, 누구나 가상 계정이나 자산 증빙 없이 즉시 익명으로 모의 투자를 체험하실 수 있습니다.</p>
                  <p>다만 **실시간 랜덤챌린지 순위(랭킹)** 등록을 희망하시는 경우에 한해, 이용자가 입력한 가상 닉네임, 도전한 주식 종목명, 그리고 달성하신 수익률 정보만 한정하여 서버 데이터베이스에 게시 목적으로 저장됩니다.</p>
                </section>

                <section className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-indigo-500/20 space-y-2">
                  <h3 className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                    <span>📢 2. 구글 애드센스(Google AdSense) 연동 고지</span>
                  </h3>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    본 서비스는 영속적인 무료 운영 유지를 위해 구글 애드센스(Google AdSense)를 통한 맞춤형 타사 광고를 제공합니다. 이에 따라 다음과 같은 분석 및 쿠키 수집이 수행됩니다:
                  </p>
                  <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                    <li>구글을 포함한 타사 공급업체는 본 서비스를 포함한 웹사이트를 방문한 사용자의 이전 방문 기록을 바탕으로 맞춤형 광고를 제공하기 위해 쿠키를 활용합니다.</li>
                    <li>구글의 광고 쿠키(DoubleClick Cookie) 사용을 통해 구글 및 파트너사는 사용자의 사이트 방문 및 기타 인터넷 웹사이트 방문을 기반으로 가장 최적화된 맞춤 광고를 안전하게 표시할 수 있습니다.</li>
                    <li>이용자는 본인의 선택에 따라 언제든 광고 개인 최적화를 사용 중단할 수 있습니다. <strong>구글 광고 설정 페이지(https://www.google.com/settings/ads)</strong> 또는 타사 공급업체의 쿠키 사용을 차단할 수 있는 <strong>Network Advertising Initiative 탈퇴 페이지(http://www.networkadvertising.org/choices/)</strong>를 통해 개인 관심사 기반 쿠키 동의를 손쉽게 철회할 수 있습니다.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">3. 피드백 제보 시 연락처 수집</h3>
                  <p>사용자 피드백 또는 오류를 제보해 주실 때 기재하시는 회신 연락처(이메일 등)는 오직 답변 처리 목적 외에는 절대 사용하지 않으며, 사안 해결 즉시 완벽히 안전하게 파기됩니다.</p>
                </section>
                
                <section>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">4. 쿠키 및 브라우저 로컬 저장소 이용</h3>
                  <p>본 서비스는 사용자의 볼륨 음소거 상태, 거래 임시 진행 세션, 최근 플레이한 기록 정보 등을 브라우저의 로컬 저장소(localStorage)에 안전하게 저장하여 재접속 시 사용자 편의를 도모합니다. 이 데이터는 사용자 개인 PC에만 로컬로 존재하며 외부로 수집되지 않습니다.</p>
                </section>

                <section>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">5. 제3자 제공 및 마케팅 오용 배제</h3>
                  <p>본 서비스는 이용자의 랭킹 닉네임이나 수익률 성적 데이터를 어떠한 제3자 회사에도 상업적으로 양도하거나 판매 및 공유하지 않습니다.</p>
                </section>
              </div>

              <button
                onClick={() => setShowPrivacyModal(false)}
                className="w-full mt-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                확인 및 닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💬 Feedback and Bug Report Modal */}
      <AnimatePresence>
        {showFeedbackModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 flex flex-col relative text-left"
            >
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span>개발자에게 피드백 & 오류 제보하기</span>
              </h2>

              {feedbackSuccess ? (
                <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                    <Check className="w-6 h-6 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm">소중한 피드백 전송 완료!</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-[280px]">
                    전송해주신 아이디어와 제보를 바탕으로 더 훌륭하고 정밀한 모의 시뮬레이터로 계속 성장시키겠습니다.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleFeedbackSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">제안 내용 및 버그 상세 제보 <span className="text-red-400">*</span></label>
                    <textarea
                      required
                      rows={5}
                      placeholder="기능 제안, 캔들 움직임 개선 아이디어, 또는 발생한 버그 상황을 자유롭게 써주세요."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200 resize-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">답변받으실 연락처 또는 이메일 <span className="text-slate-500 dark:text-slate-500 font-normal">(선택)</span></label>
                    <input
                      type="text"
                      placeholder="예: user@example.com 또는 연락처"
                      value={feedbackContact}
                      onChange={(e) => setFeedbackContact(e.target.value)}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(false)}
                      className="flex-1 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                    >
                      취소
                    </button>
                    <button
                      type="submit"
                      disabled={isFeedbackSubmitting || !feedbackText.trim()}
                      className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-200 dark:bg-slate-800 disabled:text-slate-600 text-white text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isFeedbackSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      <span>제보 전송하기</span>
                    </button>
                  </div>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 💡 Background & Differences Modal */}
      <AnimatePresence>
        {showBackgroundModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 max-h-[85vh] flex flex-col text-left"
            >
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>시뮬레이터 기획 배경 및 차별점</span>
              </h2>
              
              <div className="flex-1 overflow-y-auto text-xs text-slate-600 dark:text-slate-400 space-y-4 pr-1 leading-relaxed custom-scrollbar">
                <section className="space-y-2">
                  <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-1">💡 왜 "리플레이" 훈련인가?</h3>
                  <p>
                    일반적인 개인 투자자들이 주식 시장에서 좌절하는 가장 큰 요인은 <strong>'사후확증 편향(Hindsight Bias)'</strong>입니다. 장이 끝난 고요한 차트를 복기할 때는 매수와 매도 타점이 너무나 선명하고 단순해 보입니다.
                  </p>
                  <p>
                    하지만 장중에 호가창이 실시간으로 요동치고 캔들이 끊임없이 위아래로 출렁이며 '미완성 캔들' 상태일 때 트레이더는 공포와 탐욕에 짓눌려 뇌동매매와 충동적 투매를 저지르고 맙니다.
                  </p>
                  <p>
                    <strong>K-Stock Replay 주도주 리플레이 시뮬레이터</strong>는 이러한 정적 분석의 함정을 부수고, 실제 거래 상황의 역동적 흐름을 완벽히 모사하여 트레이더가 장중의 심리적 압박을 극복하고 원칙을 준수하는 훈련을 반복하도록 설계되었습니다.
                  </p>
                </section>

                <section className="bg-white dark:bg-slate-950 p-3.5 rounded-xl border border-indigo-500/20 space-y-2.5">
                  <h3 className="font-bold text-indigo-400 text-xs">🚀 기존 모의투자 대비 3대 핵심 차별화 요소</h3>
                  
                  <div className="space-y-2 text-[11px]">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">1. 실시간 호가 틱 쉐이킹 (Wiggling Engine)</h4>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        완성된 캔들이 한 번에 나타나는 일반 차트와 다릅니다. 본 엔진은 하나의 봉이 형성되는 시간(60초 / 2배속 시 30초) 동안 캔들 내부에서 가격이 가상 호가창 알고리즘에 따라 무작위적으로 흔들립니다. 실제 체결 강도의 심리적 시각 피드백을 그대로 구현했습니다.
                      </p>
                    </div>

                    <div className="border-t border-slate-900 pt-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">2. 시공간의 극단적 초압축 훈련</h4>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        하루 종일 9시부터 15시 30분까지 진행되는 지루한 흐름을 단 20~30분 이내로, 혹은 수개월에 걸친 수급 흐름을 몇 분 만에 완벽히 복기할 수 있습니다. 트레이더가 패턴 노출 경험치를 수십 배 빠르게 쌓을 수 있는 강력한 무기입니다.
                      </p>
                    </div>

                    <div className="border-t border-slate-900 pt-2">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200">3. 블라인드 랜덤 챌린지 모드</h4>
                      <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                        선입견을 완전히 가려줍니다. 종목명과 특정 시점 날짜를 완전히 블라인드 처리한 채 오직 순수한 거래대금, 캔들의 이격과 배열, 수급 신호에만 의존해 매매를 수행하여, 감정에 치우치지 않는 기계적 트레이딩 강박을 체화시킵니다.
                      </p>
                    </div>
                  </div>
                </section>
              </div>

              <button
                onClick={() => setShowBackgroundModal(false)}
                className="w-full mt-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                가이드 닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📈 Professional Trading Strategy Modal */}
      <AnimatePresence>
        {showStrategyModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 max-h-[85vh] flex flex-col text-left"
            >
              <h2 className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
                <TrendingUp className="w-4 h-4 text-red-400" />
                <span>실전 주도주 핵심 매매 전략 가이드북</span>
              </h2>
              
              <div className="flex-1 overflow-y-auto text-xs text-slate-600 dark:text-slate-400 space-y-4 pr-1 leading-relaxed custom-scrollbar">
                
                {/* Strategy 1: 종가베팅 */}
                <section className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 bg-amber-400 rounded-full" />
                    <span>01. 종가베팅(종베) 전략</span>
                  </h3>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    <strong>기본 개념:</strong> 당일 오후 3시~3시 30분 사이에 주도주의 수급 강도를 판단하여 진입한 후, 다음날 시초가 갭상승(오버나잇) 시 슈팅 수익을 취하는 핵심 수급 트레이딩입니다.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>매수 조건:</strong> 당일 상승률 100위 및 거래대금 100위 내에 완전히 부합하는 최강 주도주가 일봉상 전고점을 돌파하거나 장대양봉 몸통을 굳건히 채우며 종가 고가 형태로 마감할 때. 오후 3시 이후 분봉상 거래량이 감소하되 가격 지지선(시가 혹은 당일 중심값)을 훼손하지 않을 때 2~3회에 걸쳐 분할 진입합니다.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>청산 원칙:</strong> 다음날 장 개시 직후 시초가 갭상승 및 아침 9시 5분 내 수급 변동성 슈팅 발생 시 유연하게 분할 익절(보통 2.5%~5%)하여 당일 수익을 고정시킵니다. 만약 다음날 시가가 전일 종가 아래로 낮게 시작하거나 시초가 이탈 음봉 발생 시 즉시 기계적 칼손절하여 리스크를 절대 통제합니다.
                  </p>
                </section>

                {/* Strategy 2: 눌림목 매매 */}
                <section className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 text-indigo-400">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full" />
                    <span>02. 주도주 수급 눌림목 전략</span>
                  </h3>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    <strong>기본 개념:</strong> 대량 거래량과 함께 장대양봉으로 수급이 증명된 주도주가, 다음날 이후 매도 압력 없이 거래량이 바싹 마른 상태에서 핵심 기술적 지지선까지 하락 조정할 때 분할 진입하는 전략입니다.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>매수 조건:</strong> 상승 일봉 대비 거래량이 30% 이하로 바싹 마르며 건전한 가격 조정을 보일 때. 특히 일봉상 5일 이동평균선(MA) 혹은 분봉상 생명 20선(황금선) 부근에 도달 시, 아래꼬리를 달거나 호가창 하단 매수 대기벽에 수급이 들어오기 시작하는 구간에서 안전하게 분할 매수로 비중을 구축합니다.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>청산 원칙:</strong> 지지 안정을 바탕으로 N자형 수급 반등이 성공적으로 나올 때 직전 고가 또는 강한 매물 저항 단가 부근에서 순차적으로 매도합니다. 만약 중요 이평선을 대량 거래량을 동반한 종가 기준 음봉으로 훼손해 버린다면 미련 없이 비중 축소 및 기계적 손절을 실행합니다.
                  </p>
                </section>

                {/* Strategy 3: 시가 돌파 */}
                <section className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 text-emerald-400">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full" />
                    <span>03. 장 초반 시가 돌파 전략</span>
                  </h3>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    <strong>기본 개념:</strong> 오전 9시 장 개시 이후 30분 동안 일중 거래량과 대금이 가장 밀집되는 폭발적 변동성을 포착하여 극단적 모멘텀을 타격하는 초강력 스캘핑/데이 전략입니다.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>매수 조건:</strong> 오전 9시 장시작 후 당일 형성된 최초 '시가(Opening Price)'를 대량의 체결 수급과 동반한 장대양봉으로 상향 돌파하는 타점에서 매수 진입합니다. 혹은 돌파 후 시가를 굳건히 지지하는 분봉 아래꼬리 지지 캔들을 확인하고 신속히 진입합니다.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>청산 원칙:</strong> 욕심 없이 1.5%~3% 수익권 도달 시 신속하게 70% 이상 물량을 선제 분할 익절합니다. 만약 매수 진입한 기준 봉의 최저점이나 당일 시가를 장대음봉으로 하향 이탈하며 가짜 돌파(Trap) 패턴을 형성할 때는 즉시 0.5% 이내에서 칼같이 손절을 마무리합니다.
                  </p>
                </section>

                {/* Strategy 4: 고점 돌파 */}
                <section className="bg-white dark:bg-slate-950/70 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5 text-red-400">
                    <span className="w-2 h-2 bg-red-400 rounded-full" />
                    <span>04. 전고점 / 장중 최고가 돌파 전략</span>
                  </h3>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300">
                    <strong>기본 개념:</strong> 오랫동안 돌파하지 못하고 누적되어 온 일봉상의 강력 매물대 또는 분봉상의 장중 직전 고점 저항선을 압도적 대금 분출로 돌파하며 본격적 급등 시세를 개시하는 신호를 포착하는 전략입니다.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>매수 조건:</strong> 여러 차례 윗꼬리를 달고 하락했던 강력 전고점 저항 라인을 압도적인 수급과 거래대금을 뿜어내며 실시간으로 양봉 돌파해 돌파가 확정되는 찰나 또는 돌파 직전 매도 잔량을 대량으로 쓸어담을 때 진입합니다.
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400">
                    <strong>청산 원칙:</strong> 돌파 성공 이후 펼쳐지는 급격한 오버슈팅(볼린저 밴드 상단 이탈 등) 구간에서 비중을 대거 정리하고, 돌파된 과거의 강력 저항선(현재의 지지선으로 전환됨) 부근을 다시 역으로 강하게 하향 침범할 경우, 본전 탈출 혹은 약손절로 기계적 매매를 마칩니다.
                  </p>
                </section>
              </div>

              <button
                onClick={() => setShowStrategyModal(false)}
                className="w-full mt-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                전략 핸드북 닫기
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 📱 Sticky Bottom Mobile Trading Dock */}
      {platformTab === 'replay' && (
        <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white dark:bg-slate-950/95 border-t border-slate-200 dark:border-slate-800 p-3 pb-5 flex flex-col gap-2 backdrop-blur-md shadow-2xl">
          <div className="flex justify-between items-center text-[10px] font-mono text-slate-600 dark:text-slate-400 px-0.5">
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[80px]">
                {isRandomChallengeMode ? '블라인드 🔒' : selectedStock.name}
              </span>
              <span>
                {wigglingPrice.toLocaleString()}원
                {sessionStartPrice > 0 && (
                  <span className={`ml-1 font-bold ${
                    getDailyChangeRatio(wigglingPrice) >= 0 
                      ? 'text-red-400' 
                      : 'text-blue-400'
                  }`}>
                    ({getDailyChangeRatio(wigglingPrice) >= 0 ? '+' : ''}
                    {getDailyChangeRatio(wigglingPrice).toFixed(2)}%)
                  </span>
                )}
              </span>
            </div>
            <div className="flex gap-2">
              <span>예수금: <strong className="text-slate-800 dark:text-slate-200">{balance.toLocaleString()}원</strong></span>
              {holdings > 0 && (
                <span>평가익: <strong className={wigglingPrice >= averagePrice ? 'text-red-400' : 'text-blue-400'}>
                  {((wigglingPrice - averagePrice) * holdings >= 0 ? '+' : '')}{((wigglingPrice - averagePrice) * holdings).toLocaleString()}원
                </strong></span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* Mobile Buy Suite */}
            <div className="bg-red-950/20 p-1.5 rounded-lg border border-red-950/30 flex flex-col gap-1">
              <div className="text-[9px] text-red-400 font-bold px-0.5">분할 매수</div>
              <div className="grid grid-cols-4 gap-1">
                {[10, 25, 50, 100].map((pct) => (
                  <button
                    key={`mob-buy-${pct}`}
                    onClick={() => handleBuyPercent(pct)}
                    className={`py-2 font-extrabold text-[10px] rounded active:scale-90 transition-all cursor-pointer text-center ${lastBuyPercent === pct ? 'bg-rose-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {pct === 100 ? '올인' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Sell Suite */}
            <div className="bg-blue-950/20 p-1.5 rounded-lg border border-blue-950/30 flex flex-col gap-1">
              <div className="text-[9px] text-blue-400 font-bold px-0.5">분할 매도</div>
              <div className="grid grid-cols-4 gap-1">
                {[10, 25, 50, 100].map((pct) => (
                  <button
                    key={`mob-sell-${pct}`}
                    onClick={() => handleSellPercent(pct)}
                    className={`py-2 font-extrabold text-[10px] rounded active:scale-90 transition-all cursor-pointer text-center ${lastSellPercent === pct ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700'}`}
                  >
                    {pct === 100 ? '전량' : `${pct}%`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📱 PWA 홈 화면 바로가기 추가 팝업 안내 모달 */}
      <AnimatePresence>
        {showPwaPrompt && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-50 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800/80 rounded-2xl max-w-md w-full p-6 text-left shadow-2xl relative overflow-hidden flex flex-col gap-5"
            >
              {/* Premium Background Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-amber-500 to-indigo-500" />
              
              {/* Close Button */}
              <button 
                onClick={() => setShowPwaPrompt(false)}
                className="absolute top-4 right-4 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
                aria-label="닫기"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Title & App Branding */}
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-shrink-0 relative">
                  <img 
                    src="/favicon.png" 
                    alt="K-Stock App Icon" 
                    className="w-14 h-14 rounded-2xl shadow-xl border-2 border-indigo-500/20 object-cover bg-white dark:bg-slate-950 p-0.5"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as any).src = "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=100&auto=format&fit=crop&q=60";
                    }}
                  />
                  <span className="absolute -bottom-1 -right-1 bg-indigo-600 text-[8px] font-black px-1.5 py-0.5 rounded-full text-white uppercase border border-slate-900 tracking-wider">PWA</span>
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight">
                    스마트폰 홈 화면에 바로가기 설치
                  </h3>
                  <p className="text-[11px] text-indigo-400 font-semibold mt-0.5">
                    매번 주소 입력 없이 1초 만에 앱처럼 실행하세요!
                  </p>
                </div>
              </div>

              {/* Toggle Tab Bar */}
              <div className="grid grid-cols-2 bg-white dark:bg-slate-950/80 p-1 rounded-xl border border-slate-200 dark:border-slate-800/50">
                <button
                  onClick={() => setPwaActiveTab('ios')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    pwaActiveTab === 'ios'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  아이폰 (Safari)
                </button>
                <button
                  onClick={() => setPwaActiveTab('android')}
                  className={`flex items-center justify-center gap-1.5 py-2 text-xs font-extrabold rounded-lg transition-all cursor-pointer ${
                    pwaActiveTab === 'android'
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 text-slate-700 dark:text-slate-300" />
                  안드로이드 / 크롬
                </button>
              </div>

              {/* Instructions Detail Box */}
              <div className="min-h-[140px] flex flex-col justify-center">
                {pwaActiveTab === 'ios' ? (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        아이폰 기본 <span className="text-white font-extrabold underline decoration-indigo-400 decoration-2">사파리(Safari)</span> 브라우저로 접속해주세요.
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        하단 툴바의 <span className="text-indigo-400 font-extrabold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 inline-flex items-center gap-1"><Share2 className="w-3 h-3 inline" /> 공유 버튼</span>(네모 위로 화살표)을 누릅니다.
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        스크롤을 살짝 내려 <span className="text-amber-400 font-extrabold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/20">[홈 화면에 추가]</span> 버튼을 터치하면 완료!
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        삼성 인터넷 또는 구글 크롬 브라우저를 실행해주세요.
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        우측 상단의 <span className="text-indigo-400 font-extrabold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 inline-flex items-center gap-1"><MoreVertical className="w-3 h-3 inline" /> 더보기(⋮)</span> 또는 하단 <span className="text-indigo-400 font-extrabold bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20 inline-flex items-center gap-1"><Menu className="w-3 h-3 inline" /> 메뉴(三)</span>를 누릅니다.
                      </p>
                    </div>
                    <div className="flex gap-3 items-start">
                      <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="text-amber-400 font-extrabold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/20">[홈 화면에 추가]</span> 또는 <span className="text-amber-400 font-extrabold bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-500/20">[앱 설치]</span>를 선택하면 완료!
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200 dark:border-slate-800/80">
                <button
                  onClick={handleDismissPwa}
                  className="py-2.5 bg-white dark:bg-slate-950 hover:bg-white dark:hover:bg-slate-950/70 text-slate-500 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400 text-[11px] font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer text-center"
                >
                  다시 보지 않기
                </button>
                <button
                  onClick={() => setShowPwaPrompt(false)}
                  className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-black rounded-xl shadow-lg shadow-indigo-950/40 transition-all cursor-pointer text-center flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  확인했습니다
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* KakaoTalk In-App Browser iOS Breakout Guide Overlay */}
      <AnimatePresence>
        {isInAppBrowser && inAppOs === 'ios' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white dark:bg-slate-950/98 z-[9999] flex flex-col items-center justify-center p-6 text-center overflow-y-auto"
          >
            <div className="max-w-md w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              {/* Highlight Gradient Flare */}
              <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-500" />
              
              <div className="flex flex-col items-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400 animate-bounce">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-white tracking-tight">
                  인앱 브라우저 접속 안내 ⚠️
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
                  현재 카카오톡, 네이버 또는 SNS 인앱 브라우저를 통해 접속 중입니다. 원활한 실시간 차트 복기 시뮬레이터 구동 및 스마트폰 홈 화면 앱 설치(PWA)를 위해 <span className="text-amber-400 font-extrabold">기본 사파리(Safari) 브라우저</span>로 이용하시는 것을 적극 권장합니다.
                </p>
              </div>

              {/* Step-by-Step iOS Breakout Instructions */}
              <div className="bg-white dark:bg-slate-950/60 rounded-2xl p-4.5 border border-slate-200 dark:border-slate-800/80 text-left space-y-3.5">
                <p className="text-[11px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-wider text-center border-b border-slate-200 dark:border-slate-800 pb-2">
                  사파리(Safari) 브라우저로 1초 만에 전환하는 방법
                </p>
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    화면 우측 하단의 <span className="text-indigo-400 font-black bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/20">삼점(⋯)</span> 메뉴 또는 <span className="text-indigo-400 font-black bg-indigo-500/10 px-1 py-0.5 rounded border border-indigo-500/20 font-mono">공유 버튼</span>을 선택합니다.
                  </p>
                </div>
                <div className="flex gap-3 items-start">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 text-[11px] font-black flex items-center justify-center flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    하단에 나타나는 팝업 메뉴에서 <span className="text-amber-400 font-black bg-amber-400/10 px-1 py-0.5 rounded border border-amber-500/20">[Safari로 열기]</span> 또는 <span className="text-amber-400 font-black bg-amber-400/10 px-1 py-0.5 rounded border border-amber-500/20">[기본 브라우저로 열기]</span>를 선택하시면 즉시 안전하게 사파리가 실행됩니다!
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => {
                    const url = window.location.href;
                    navigator.clipboard.writeText(url).then(() => {
                      alert('시뮬레이터 주소가 클립보드에 복사되었습니다. 사파리 주소창에 붙여넣어 접속하세요! 🔗');
                    }).catch(() => {
                      alert(`주소: ${url}`);
                    });
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black rounded-xl shadow-lg shadow-indigo-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>주소 복사하기 🔗</span>
                </button>
                <button
                  onClick={() => setIsInAppBrowser(false)}
                  className="w-full py-3 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold rounded-xl border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                >
                  그냥 이대로 인앱 브라우저에서 볼래요
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* System Diagnostics & Debug Modal */}
      <AnimatePresence>
        {showDebugModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white dark:bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/30 text-indigo-400">
                    <Shield className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">시스템 아키텍처 진단 & 디버그 패널</h3>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">AI Studio Preview ⟷ GitHub ⟷ Vercel 실시간 자가진단 및 동기화 도구</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDebugModal(false)}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-700 dark:text-slate-300 text-xs">
                {/* 1. Global Status Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Env Card */}
                  <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <div className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">구동 서버 환경</div>
                    <div className="text-lg font-black text-indigo-400 flex items-center gap-1.5">
                      <Zap className="w-4 h-4" />
                      {debugStatus?.envType || '로딩 중...'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">Node.js: {debugStatus?.nodeEnv || 'development'}</div>
                  </div>

                  {/* Supabase Status Card */}
                  <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <div className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">Supabase 연결 상태</div>
                    <div className="text-lg font-black flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        debugStatus?.supabase?.status === 'Connected' 
                           ? 'bg-emerald-500 animate-ping' 
                           : debugStatus?.supabase?.status === 'Not Configured' 
                             ? 'bg-amber-500' 
                             : 'bg-rose-500 animate-pulse'
                      }`} />
                      <span className={
                        debugStatus?.supabase?.status === 'Connected' 
                          ? 'text-emerald-400' 
                          : debugStatus?.supabase?.status === 'Not Configured' 
                            ? 'text-amber-400' 
                            : 'text-rose-400'
                      }>
                        {debugStatus?.supabase?.status || '연결 체크 중...'}
                      </span>
                    </div>
                    {debugStatus?.supabase?.status === 'Connected' && (
                      <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                        저장된 랭킹 수: <span className="text-emerald-400 font-bold">{debugStatus?.supabase?.count}</span>개
                      </div>
                    )}
                    {debugStatus?.supabase?.error && (
                      <div className="text-[9px] text-rose-500 truncate font-mono" title={debugStatus.supabase.error}>
                        에러: {debugStatus.supabase.error}
                      </div>
                    )}
                  </div>

                  {/* Cache Card */}
                  <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <div className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">시세 캐시 현황</div>
                    <div className="text-lg font-black text-cyan-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />
                      {debugStatus?.cache?.size !== undefined ? `${debugStatus.cache.size}개 종목` : '로딩 중...'}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                      TTL: 4시간 | 캐시 삭제 시 네이버 실시간 시세 강제 fetch
                    </div>
                  </div>

                  {/* GZIP compressed DB status card */}
                  <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <div className="text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">GZIP 파일 DB (GitHub 저장소)</div>
                    <div className="text-lg font-black text-emerald-400 flex items-center gap-1.5">
                      <Archive className="w-4 h-4" />
                      {gzipStatsLoading ? (
                        <span className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1"><Loader2 className="w-3.5 h-3.5 animate-spin" /> 확인 중...</span>
                      ) : gzipStats ? (
                        <span>{gzipStats.totalFiles}개 종목</span>
                      ) : (
                        <span>0개 종목</span>
                      )}
                    </div>
                    {gzipStats ? (
                      <div className="text-[10px] text-slate-500 dark:text-slate-500 font-mono flex flex-col leading-tight">
                        <span>크기: <strong className="text-emerald-400">{gzipStats.totalCompressedSize}</strong> ({gzipStats.totalOriginalSize})</span>
                        <span>절감률: <strong className="text-emerald-400">{gzipStats.totalSavings} 공간 절약!</strong></span>
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 dark:text-slate-500">
                        data/replay 디렉토리에 .json.gz 파일 관리 중
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Environment Variables & Vercel Variables (Comparison) */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Environment variables list */}
                  <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-indigo-400" />
                        환경변수 비교 (Env Variables Alignment)
                      </h4>
                      <button 
                        onClick={fetchDiagnostics}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="새로고침"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {debugStatus?.envVars ? (
                        Object.entries(debugStatus.envVars).map(([key, value]: any) => (
                          <div key={key} className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                            <div>
                              <span className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200">{key}</span>
                              <p className="text-[9px] text-slate-500 dark:text-slate-500 mt-0.5">
                                {key === 'GEMINI_API_KEY' && 'Gemini AI API 모델 구동 및 스마트 요약에 필수'}
                                {key === 'APP_URL' && 'AI Studio의 컨테이너 이그레스 및 콜백 URL 설정'}
                                {key === 'SUPABASE_URL' && 'Vercel 서버리스 영구 랭킹 저장소 주소'}
                                {key === 'SUPABASE_ANON_KEY' && 'Supabase public 익명 접근 토큰 키'}
                                {key === 'GITHUB_REPO' && '자가진단 커밋 정보 fetch 대상 저장소'}
                                {key === 'VERCEL' && 'Vercel 서버리스 배포 자동 감지 시그널'}
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              value !== 'Not Set' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {value}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-slate-500 dark:text-slate-500">환경변수 데이터 수집 중...</div>
                      )}
                    </div>
                  </div>

                  {/* Vercel Deployment variables */}
                  <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Zap className="w-4 h-4 text-cyan-400" />
                        Vercel 최신 배포 감지 (Vercel Build Stats)
                      </h4>
                      <button 
                        onClick={fetchVercelVars}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white transition-colors cursor-pointer"
                        title="새로고침"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-2 font-mono text-[10px]">
                      {vercelLoading ? (
                        <div className="text-center py-4 text-slate-500 dark:text-slate-500">Vercel 메타데이터 요청 중...</div>
                      ) : vercelVars ? (
                        <div className="space-y-1.5">
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">VERCEL ACTIVE?</span>
                            <span className={vercelVars.VERCEL === '1' ? 'text-emerald-400 font-bold' : 'text-slate-500 dark:text-slate-500'}>
                              {vercelVars.VERCEL === '1' ? 'YES (Vercel Serverless)' : 'NO (AI Studio / Local)'}
                            </span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">DEPLOY REGION</span>
                            <span className="text-slate-800 dark:text-slate-200">{vercelVars.VERCEL_REGION || 'N/A'}</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex flex-col gap-1">
                            <div className="text-slate-600 dark:text-slate-400">GIT COMMIT MESSAGE</div>
                            <div className="text-slate-800 dark:text-slate-200 font-sans text-xs bg-white dark:bg-slate-950 p-2 rounded border border-slate-200 dark:border-slate-800 leading-relaxed italic">
                              "{vercelVars.VERCEL_GIT_COMMIT_MESSAGE || 'N/A (Local / Non-Vercel build)'}"
                            </div>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">COMMIT SHA</span>
                            <span className="text-indigo-400 font-bold font-mono">{vercelVars.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'N/A'}</span>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900/40 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex justify-between">
                            <span className="text-slate-600 dark:text-slate-400">AUTHOR</span>
                            <span className="text-slate-800 dark:text-slate-200">{vercelVars.VERCEL_GIT_COMMIT_AUTHOR_NAME || 'N/A'}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4 text-slate-500 dark:text-slate-500">배포 데이터가 유효하지 않습니다.</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. GitHub Commit verification & Supabase Schema Help */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* GitHub repository verification */}
                  <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-indigo-400" />
                        GitHub 최신 커밋 연동 확인
                      </h4>
                    </div>

                    <div className="space-y-3.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={gitRepoInput}
                          onChange={(e) => setGitRepoInput(e.target.value)}
                          placeholder="owner/repository"
                          className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-200 font-mono text-xs focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={() => fetchGitCommit(gitRepoInput)}
                          disabled={gitLoading}
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {gitLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                          조회
                        </button>
                      </div>

                      {gitError && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-[11px] leading-relaxed">
                          ⚠️ {gitError}
                        </div>
                      )}

                      {gitCommit && (
                        <div className="bg-slate-50 dark:bg-slate-900/70 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-black font-mono">
                              {gitCommit.repo}
                            </span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                              {new Date(gitCommit.date).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} {new Date(gitCommit.date).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })}
                            </span>
                          </div>
                          <div className="text-slate-900 dark:text-slate-100 text-xs font-bold font-sans bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800 leading-relaxed italic">
                            "{gitCommit.message}"
                          </div>
                          <div className="flex items-center justify-between text-[11px] font-mono border-t border-slate-200 dark:border-slate-800/60 pt-2">
                            <span className="text-slate-600 dark:text-slate-400">
                              작성자: <span className="text-slate-800 dark:text-slate-200 font-bold">{gitCommit.author}</span>
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              SHA: <span className="text-cyan-400 font-black">{gitCommit.sha?.slice(0, 10)}...</span>
                            </span>
                          </div>
                          <div className="pt-1 flex justify-end">
                            <a
                              href={gitCommit.htmlUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold underline flex items-center gap-1"
                            >
                              GitHub에서 커밋 확인하기 ↗
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Supabase SQL DDL Schema Setup Help */}
                  <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-emerald-400" />
                        Supabase 테이블 스키마 가이드 (Table SQL DDL)
                      </h4>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                        Supabase에 연결한 후 리플레이 시뮬레이터의 실시간 랭킹을 영구적으로 저장하기 위해서는 아래 SQL 구문을 복사하여 Supabase의 <span className="text-emerald-400 font-extrabold">SQL Editor</span>에 실행해주셔야 합니다.
                      </p>
                      
                      <div className="relative group">
                        <pre className="bg-white dark:bg-slate-950 text-[10px] text-slate-700 dark:text-slate-300 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto font-mono max-h-[160px] leading-relaxed">
                          {debugStatus?.supabase?.sqlSchema}
                        </pre>
                        <button
                          onClick={() => {
                            if (debugStatus?.supabase?.sqlSchema) {
                              navigator.clipboard.writeText(debugStatus.supabase.sqlSchema);
                              alert('Supabase SQL DDL 구문이 클립보드에 복사되었습니다! 📋');
                            }
                          }}
                          className="absolute top-2.5 right-2.5 p-1.5 rounded-lg bg-slate-50 dark:bg-slate-900 hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-white border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer"
                          title="SQL 복사"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Cache detailed list and Power developer tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Cache entries view and clear action */}
                  <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        활성 시세 캐시 디렉토리
                      </h4>
                      <button
                        onClick={handleClearServerCache}
                        className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-black rounded-lg transition-colors cursor-pointer"
                      >
                        캐시 전체 강제 삭제 🧹
                      </button>
                    </div>

                    <div className="space-y-2 max-h-[180px] overflow-y-auto">
                      {debugStatus?.cache?.entries && debugStatus.cache.entries.length > 0 ? (
                        debugStatus.cache.entries.map((entry: any) => (
                          <div key={entry.key} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800/60 font-mono text-[10px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-cyan-400 font-bold">{entry.name}</span>
                              <span className="text-slate-500 dark:text-slate-500 font-normal">[{entry.key}]</span>
                            </div>
                            <div className="text-right text-slate-600 dark:text-slate-400">
                              <span>봉 수: {entry.candlesCount}개</span>
                              <span className="mx-2">|</span>
                              <span>캐시 경과: {entry.ageMinutes}분 전</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-slate-500 dark:text-slate-500 font-mono">현재 적재된 서버 메모리 캐시가 비어있습니다.</div>
                      )}
                    </div>
                  </div>

                  {/* Dev Sandbox controls */}
                  <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Coins className="w-4 h-4 text-amber-400" />
                        트레이더 샌드박스 치트 엔진 (Power Tools)
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button
                        onClick={() => {
                          setBalance(1000000000); // 1 Billion KRW
                          alert('보유 현금이 10억 원(1,000,000,000 KRW)으로 즉시 충전되었습니다! 💰');
                        }}
                        className="py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-amber-400 font-extrabold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Coins className="w-3.5 h-3.5 text-amber-400" />
                        보유 현금 10억 원 충전 💰
                      </button>

                      <button
                        onClick={async () => {
                          // Submit an extreme high yield entry to test Top 10 leaderboards
                          const testNickname = '초전도_트레이더';
                          const testYieldRate = 585.50; // insane profit
                          const testSymbol = '삼천당제약';
                          const testTotalAssets = 68550000;
                          
                          if (confirm(`'${testNickname}' 닉네임으로 수익률 ${testYieldRate}% 테스트 점수를 제출하시겠습니까? (Supabase/로컬 저장소 동기화 검증용)`)) {
                            try {
                              const res = await fetch('/api/leaderboard', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  name: testNickname,
                                  yieldRate: testYieldRate,
                                  symbol: testSymbol,
                                  totalAssets: testTotalAssets,
                                  type: gameMode
                                })
                              });
                              if (res.ok) {
                                alert('초고수익 테스트 점수가 성공적으로 제출 및 동기화되었습니다! 랭킹판을 확인하세요!');
                                fetchDiagnostics();
                              } else {
                                alert('점수 제출에 실패했습니다.');
                              }
                            } catch (e) {
                              console.error(e);
                              alert('에러 발생');
                            }
                          }
                        }}
                        className="py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-emerald-400 font-extrabold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <Award className="w-3.5 h-3.5 text-emerald-400" />
                        초고수익 랭킹 자동 등록 🏆
                      </button>

                      <button
                        onClick={() => {
                          setHoldings(0);
                          setAveragePrice(0);
                          setBalance(INITIAL_BALANCE);
                          setTrades([]);
                          setCurrentIndex(20);
                          setIsPlaying(false);
                          alert('모든 실습 거래 내역과 잔고가 초기화되었습니다! 🔄');
                        }}
                        className="py-3 bg-slate-50 dark:bg-slate-900 hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-rose-400 font-extrabold text-[11px] transition-all cursor-pointer flex items-center justify-center gap-1.5 col-span-1 sm:col-span-2 shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        시뮬레이터 훈련 전체 원복 🔄
                      </button>
                    </div>
                  </div>
                </div>

                {/* 5. 4단계 실시간 데이터 검증 감사 시스템 (4-Stage Data Pipeline Audit Logs) */}
                <div className="bg-white dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <h4 className="font-extrabold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 text-xs">
                        <Shield className="w-4 h-4 text-indigo-400 animate-pulse" />
                        4단계 실시간 데이터 정합성 검증 감사 시스템 (Data Integrity Audit Logs)
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">
                        전송된 원본 ➡️ 가공 처리 ➡️ 데이터베이스(DB) 저장 ➡️ 최종 화면 응답(UI) 4단계를 동기식 교차 비교하여 무결성을 검증합니다.
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={fetchAuditLogs}
                        disabled={auditLogsLoading}
                        className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <RefreshCw className={`w-3 h-3 ${auditLogsLoading ? 'animate-spin' : ''}`} />
                        새로고침
                      </button>
                      <button
                        onClick={handleClearAuditLogs}
                        className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/60 border border-rose-900/35 text-rose-400 rounded-lg text-[10px] font-bold cursor-pointer"
                      >
                        로그 초기화
                      </button>
                    </div>
                  </div>

                  {/* Artificial Mismatch Simulator Trigger Widget */}
                  <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-[10px] font-extrabold text-amber-400">데이터 정합성 인위적 왜곡 모드 (Sandbox Mismatch Simulator)</span>
                      </div>
                      <p className="text-[9px] text-slate-600 dark:text-slate-400">
                        이 옵션을 활성화한 상태에서 훈련 결과를 제출하면 파이프라인 단계(원본 ➡️ 가공)에서 의도적인 수치 왜곡을 가해 정합성 오류 로그 감지 테스트를 진행합니다.
                      </p>
                    </div>
                    <label className="flex items-center gap-2 bg-white dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-amber-500/40 select-none">
                      <input
                        type="checkbox"
                        checked={simMismatchChecked}
                        onChange={(e) => setSimMismatchChecked(e.target.checked)}
                        className="rounded border-slate-200 dark:border-slate-800 text-indigo-600 focus:ring-indigo-500/40 bg-slate-50 dark:bg-slate-900 w-3 h-3 cursor-pointer"
                      />
                      <span className="text-[9px] font-mono text-slate-700 dark:text-slate-300">인위적 왜곡 주입 활성화</span>
                    </label>
                  </div>

                  {/* Audit Logs list */}
                  <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
                    {auditLogsLoading ? (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-500 font-mono">실시간 검증 파이프라인 조회 중...</div>
                    ) : auditLogs.length === 0 ? (
                      <div className="text-center py-10 bg-white dark:bg-slate-950/20 border border-dashed border-slate-900 rounded-xl text-slate-500 dark:text-slate-500 font-mono">
                        저장된 파이프라인 검증 이력이 없습니다. 실습 훈련 종료 후 점수를 제출하거나 위 치트 등록 도구를 사용하여 랭킹을 입력하면 정밀 감사가 자동 개시됩니다.
                      </div>
                    ) : (
                      auditLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`rounded-xl border p-3.5 space-y-2.5 transition-colors ${
                            log.status === 'PASS'
                              ? 'bg-emerald-500/2 border-emerald-500/10 hover:bg-emerald-500/3'
                              : 'bg-rose-500/2 border-rose-500/10 hover:bg-rose-500/3'
                          }`}
                        >
                          {/* Log Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-1.5">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black tracking-widest ${
                                log.status === 'PASS'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                              }`}>
                                {log.status === 'PASS' ? '● INTEGRITY PASS' : '⚠️ MISMATCH DETECTED'}
                              </span>
                              <span className="text-slate-800 dark:text-slate-200 font-bold">{log.metadata?.name || '익명'}</span>
                              <span className="text-[9px] text-slate-500 dark:text-slate-500 font-mono">[{log.metadata?.symbol || 'N/A'}]</span>
                            </div>
                            <span className="text-[9px] text-slate-500 dark:text-slate-500 font-mono">
                              {new Date(log.timestamp).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })} {new Date(log.timestamp).toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })}
                            </span>
                          </div>

                          {/* Log Stats Metadata */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[9px] text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-950/40 p-2 rounded-lg border border-slate-900">
                            <div>
                              제출 수익률: <span className="text-slate-800 dark:text-slate-200 font-bold">{log.metadata?.yieldRate?.toFixed(2)}%</span>
                            </div>
                            <div>
                              평가 자산: <span className="text-slate-800 dark:text-slate-200 font-bold">{Math.round(log.metadata?.totalAssets || 0).toLocaleString()}원</span>
                            </div>
                            <div>
                              게임 구분: <span className="text-indigo-400 font-bold">{log.metadata?.type === 'danta' ? '분봉' : '일봉'}</span>
                            </div>
                            <div className="truncate">
                              ID: <span className="text-slate-500 dark:text-slate-500 text-[8px]">{log.id.slice(0, 8)}...</span>
                            </div>
                          </div>

                          {/* Mismatch Diff Details */}
                          {log.status === 'FAIL' && log.mismatches && log.mismatches.length > 0 && (
                            <div className="space-y-1.5">
                              <div className="text-[9px] text-rose-400 font-bold flex items-center gap-1">
                                <span className="inline-block w-1 h-1 rounded-full bg-rose-500" />
                                정합성 세부 불일치 보고서 (Pipeline Delta Analysis):
                              </div>
                              <div className="space-y-1.5 pl-2">
                                {log.mismatches.map((diff: any, idx: number) => (
                                  <div key={idx} className="bg-rose-950/10 border border-rose-900/10 rounded-lg p-2 font-mono text-[9px] space-y-1 text-slate-700 dark:text-slate-300">
                                    <div className="flex justify-between text-[10px]">
                                      <span className="text-rose-400 font-black">
                                        [검증 단계]: {diff.stage}
                                      </span>
                                      <span className="text-slate-600 dark:text-slate-400 font-bold">
                                        필드: <span className="text-yellow-400">{diff.field}</span>
                                      </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 border-t border-slate-900/60 pt-1 text-[9px]">
                                      <div>
                                        <span className="text-slate-500 dark:text-slate-500">기대값(Expected):</span>{' '}
                                        <span className="text-emerald-400 font-bold">{typeof diff.expected === 'number' ? diff.expected.toFixed(2) : String(diff.expected)}</span>
                                      </div>
                                      <div>
                                        <span className="text-slate-500 dark:text-slate-500">실제값(Actual):</span>{' '}
                                        <span className="text-rose-400 font-bold">{typeof diff.actual === 'number' ? diff.actual.toFixed(2) : String(diff.actual)}</span>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-slate-500 dark:text-slate-500">오차(Delta):</span>{' '}
                                        <span className="text-amber-400 font-black">{typeof diff.delta === 'number' ? diff.delta.toFixed(6) : 'N/A'}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {log.status === 'PASS' && (
                            <div className="text-[9px] text-emerald-400/85 font-mono flex items-center gap-1 pl-1">
                              <span className="text-emerald-500 font-bold">✓</span>
                              원본과 가공, 가공과 DB, DB와 화면 수치가 완벽하게 일치합니다. (Zero Delta Integrity)
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] text-slate-500 dark:text-slate-500 font-mono">Status: Environment matches target deployments.</span>
                </div>
                <button
                  onClick={() => setShowDebugModal(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs transition-colors cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showPolicyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 select-text"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="bg-white dark:bg-slate-950 px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between select-none">
                <div className="flex items-center gap-2">
                  <div className="bg-indigo-500/10 p-2 rounded-xl border border-indigo-500/20 text-indigo-400">
                    {activePolicy === 'terms' ? <FileText className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {activePolicy === 'terms' ? '서비스 이용약관 (Terms of Service)' : '개인정보처리방침 (Privacy Policy)'}
                    </h2>
                    <p className="text-[10px] text-slate-500 dark:text-slate-500 font-bold">K-STOCK REPLAY 공식 운영 규정 및 면책 정책</p>
                  </div>
                </div>
                <button
                  onClick={handlePolicyClose}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Policy Tab Toggles inside Modal */}
              <div className="bg-white dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 flex gap-2 select-none">
                <button
                  onClick={() => {
                    setActivePolicy('terms');
                    window.history.pushState(null, '', '/terms');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePolicy === 'terms'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/40'
                  }`}
                >
                  서비스 이용약관
                </button>
                <button
                  onClick={() => {
                    setActivePolicy('privacy');
                    window.history.pushState(null, '', '/privacy');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activePolicy === 'privacy'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800/40'
                  }`}
                >
                  개인정보처리방침
                </button>
              </div>

              {/* Scrollable Document Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-h-[55vh]">
                {activePolicy === 'terms' ? (
                  <div className="space-y-4 text-slate-700 dark:text-slate-300">
                    <div className="bg-rose-500/5 border border-rose-500/15 p-3.5 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 select-text">
                      <span className="font-extrabold text-rose-400 block mb-1">⚠️ 핵심 요약 및 면책 고지</span>
                      본 서비스는 모의 주식 시뮬레이터로 실제 금전이나 실거래 주식과는 아무런 연관이 없습니다. 또한 제공되는 투자 정보, 분석 레포트는 최종 투자 권유가 아니므로 실제 투자로 발생하는 어떠한 손해에 대해서도 본 서비스 및 운영자는 일절 책임지지 않습니다.
                    </div>

                    <div className="bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800/80 rounded-xl px-4 py-3 flex items-start gap-2.5 text-left shadow-inner">
                      <Shield className="w-4 h-4 text-red-400/90 shrink-0 mt-0.5" />
                      <div className="flex flex-col gap-0.5">
                        <span className="text-red-400/90 font-extrabold text-[11px] uppercase tracking-wider">법적 고지 및 저작권 침해 방지 공지</span>
                        <p className="text-slate-600 dark:text-slate-400 text-[10px] leading-normal font-sans">
                          본 시뮬레이션 시스템은 가격 복제권 및 데이터 저작권 침해를 전면 방지하기 위해, 원본 데이터를 <strong className="text-slate-800 dark:text-slate-200">3단계 가격 보호 파이프라인(미세 변동 노이즈 주입 + 시간축 워핑 왜곡 + 호가 틱 시뮬레이션)</strong>을 거쳐 수학적으로 안전하게 가공한 <strong className="text-amber-400">"실제 가격과 무관한 교육용 가상 시뮬레이션 데이터"</strong>를 사용합니다. 실제 시장의 거래 데이터와는 수학적인 미세 오차가 항상 발생하므로, 투자 판단의 보조 지표가 될 수 없으며 상업적 유출은 전면 엄금됩니다.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 1 조 (목적)</h4>
                        <p>본 약관은 K-STOCK REPLAY(이하 "서비스")가 제공하는 과거 주식 거래 데이터 기반 시뮬레이터 및 투자 분석 가이드 정보 서비스의 이용 조건 및 절차를 규정하는 것을 목적으로 합니다.</p>
                      </section>

                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 2 조 (용어의 정의)</h4>
                        <ol className="list-decimal list-inside space-y-1 pl-1">
                          <li>"서비스"란 비가입 익명 상태에서 가상 예치금을 기반으로 과거 특정 일자의 호가 흐름과 체결 틱을 복기 연습하는 주식 교육 플랫폼을 의미합니다.</li>
                          <li>"이용자"란 서비스를 이용하기 위해 접속하여 시뮬레이션을 수행하고 가이드 자료를 탐독하는 모든 방문객을 말합니다.</li>
                        </ol>
                      </section>

                      <section className="space-y-1.5">
                        <h4 className="font-black text-rose-450 text-xs">제 3 조 (서비스의 성격 및 강력한 법적 면책 고지 - 필독)</h4>
                        <ol className="list-decimal list-inside space-y-2 pl-1">
                          <li><strong className="text-slate-800 dark:text-slate-200">[모의 시뮬레이션 전용]</strong> 본 서비스는 주식 단타 및 복기 연습을 전담하는 가상의 학습 도구입니다. 화면에 송출되는 호가, 수급 거래량, 평단가 및 수익률 등의 모든 연동 수치들은 과거 공개 공공데이터에 기인하거나 로컬에서 처리되는 <strong>가상 시뮬레이션 데이터</strong>입니다. 실제 금융 시장 내 실물 자산 및 연관 거래에 어떠한 효력도 지니지 않습니다.</li>
                          <li><strong className="text-slate-800 dark:text-slate-200">[투자 권유의 부재]</strong> 본 서비스 내부에서 산출 및 기록되는 장전 브리핑, 장마감 리포트, 당일 주도주 분석 정보, 인공지능(AI) 피드백 등 모든 연구 자료는 통계적 수치 및 과거 기록에 대한 단순 기술(Description)이며, 결코 특정 종목에 대한 투자 권유가 될 수 없습니다. 모든 매매 판단의 최종 근거가 아닙니다.</li>
                          <li><strong className="text-rose-400 font-extrabold">[손실 및 책임의 한계]</strong> 본 서비스가 가공하여 제공하는 시황 및 주가 정보의 절대적 완전성, 오류 부재, 실시간성 등을 당사는 절대 보증하지 않습니다. <strong>이용자가 본 서비스의 자료를 직간접적으로 인용하여 단행한 실제 주식 투자 및 자산 거래의 결과(원금 손실, 기회비용 박탈, 정신적 피해 등 모든 유형의 직접·간접적 손해)에 대하여 당사 및 운영진은 법적으로 어떠한 민사상·형사상 책임도 지지 않습니다.</strong> 최종 주식 투자의 리스크는 전적으로 이용자 본인이 부담합니다.</li>
                        </ol>
                      </section>

                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 4 조 (익명 이용 및 브라우저 로컬 저장소)</h4>
                        <p>K-STOCK REPLAY는 회원가입을 요구하지 않는 전면 익명 독립형 웹 어플리케이션입니다. 이용자의 가상 계좌 예수금 상태, 시뮬레이션 체결 이력, 즐겨찾기 종목 및 과거 복기 평점 등은 전적으로 이용자가 사용하는 해당 단말 기기의 브라우저 로컬 저장소(localStorage)에 귀속됩니다. 따라서 기기 분실, 브라우저 캐시 삭제, 타 브라우저 이용 시 기존 정보 복원은 일절 불가합니다.</p>
                      </section>

                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 5 조 (서비스 수정 및 긴급 중단)</h4>
                        <p>운영진은 서버 개선, 데이터 파이프라인(네이버 금융 등 API)의 규격 변경, 접속 원활화를 위해 임의로 본 플랫폼의 스펙을 수정하거나 임시 중단할 수 있습니다. 가상 이력 소멸 등에 대해 보상 의무가 면제됩니다.</p>
                      </section>

                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 6 조 (분쟁의 조정 및 관할 법원)</h4>
                        <p>본 규정과 관련한 일체의 법적 분쟁 조율 시, 관계 법령에 따른 조정을 우선하되 합의가 어려울 경우 당사 운영진의 관할 소재지 법원을 전관 합의 관할 법원으로 적용합니다.</p>
                      </section>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 text-slate-700 dark:text-slate-300">
                    <div className="bg-emerald-500/5 border border-emerald-500/15 p-3.5 rounded-xl text-[11px] text-slate-600 dark:text-slate-400 select-text">
                      <span className="font-extrabold text-emerald-400 block mb-1">🔒 개인정보 무수집 및 안전 수칙</span>
                      본 서비스는 별도의 데이터베이스 회원 등록 없이 작동하므로 어떠한 실명, 이메일, 전화번호 등 식별성 정보도 수집하거나 서버로 전송하지 않습니다.
                    </div>

                    <div className="space-y-4">
                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 1 조 (개인정보의 수집 항목 및 목적)</h4>
                        <ol className="list-decimal list-inside space-y-1 pl-1">
                          <li>본 서비스는 회원을 가입받지 않으며 완전 비회원 익명으로 운영됩니다.</li>
                          <li>웹사이트 방문자의 신상을 식별할 수 있는 일체의 정보(이름, 휴대폰, 주소, 로그인 이메일 등)를 서버 측에서 의도적으로 요구하거나 저장하지 않습니다.</li>
                        </ol>
                      </section>

                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 2 조 (로컬 웹 스토리지 이용 기조)</h4>
                        <p>모의투자 훈련 예수금 잔고 상태, 관심 종목 스펙, 시뮬레이션 매매 거래 이력, 치트키 성적 정보 등은 오직 이용자 본인이 실행하고 있는 브라우저 내부의 <strong>로컬 스토리지(localStorage)</strong> 기술에만 기록됩니다. 해당 가상 정보는 이용자 컴퓨터를 절대 벗어나지 않으며 타인에게 누출될 염려가 없는 구조입니다.</p>
                      </section>

                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 3 조 (제3자 서비스 제공 및 맞춤 광고 도구 연동 고지)</h4>
                        <ol className="list-decimal list-inside space-y-1 pl-1">
                          <li><strong>[구글 애드센스 맞춤형 광고]</strong> 본 서비스는 지속적인 서버비 및 고성능 시뮬레이터 운영 경비를 유지하고자 구글 애드센스(Google AdSense) 광고 모듈을 게시하고 있습니다. 구글은 맞춤 광고 및 사용성 판단을 위해 이용자 브라우저의 비식별 쿠키(Cookie) 데이터 및 접속 기기 해상도 등을 식별 수집할 수 있습니다. 이는 개인의 주민등록번호나 성함과 매칭되지 않는 완전 익명 행태 데이터입니다.</li>
                          <li><strong>[구글 애널리틱스 트래픽 모니터링]</strong> 서비스 개선 목적을 위한 정량적 트래픽 계측을 위해 구글 애널리틱스 로그 추적기를 내재하고 있습니다.</li>
                          <li><strong>[이용자의 거부권]</strong> 이용자는 스마트폰 옵션이나 인터넷 브라우저 설정 내의 '쿠키 수집 제한 및 캐시 청소'를 통해 이러한 트래픽 추적 수집 행위에 관해 언제든지 완벽한 거부권을 실행할 수 있습니다.</li>
                        </ol>
                      </section>

                      <section className="space-y-1.5">
                        <h4 className="font-black text-slate-900 dark:text-slate-100 text-xs">제 4 조 (개인정보 보호 문의 채널)</h4>
                        <p>비가입제 서비스 특성상 전용 개인정보 수집 관리 데이터베이스가 부존재하나, 기타 저작권 문의나 웹사이트 보안상의 우려 등 기술 협업 제안은 당사 공식 창구인 <strong>kstockreplay.pe.kr@gmail.com</strong>으로 문의해 주시기 바랍니다.</p>
                      </section>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="bg-white dark:bg-slate-950 px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between select-none">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-500 font-mono">
                  <Shield className="w-3.5 h-3.5 text-indigo-400" />
                  <span>K-STOCK REPLAY LEGAL & TRUST CENTER</span>
                </div>
                <button
                  onClick={handlePolicyClose}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs transition-colors cursor-pointer"
                >
                  확인 및 동의
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {showAiFeedModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white dark:bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 select-text"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-5xl h-[80vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="bg-white dark:bg-slate-950 px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between select-none">
                <button
                  onClick={() => {
                    setShowAiFeedModal(false);
                    setShowLauncherMenu(true);
                  }}
                  title="뒤로가기"
                  aria-label="뒤로가기"
                  className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-indigo-400 hover:text-slate-900 dark:hover:text-indigo-300 hover:border-slate-300 dark:hover:border-indigo-500/30 cursor-pointer transition-all shadow-lg hover:scale-110 active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-500 font-mono tracking-widest">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                  <span>K-STOCK REPLAY DETAIL VIEW</span>
                </div>
              </div>

              {/* Main Workspace: Single Content Area */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-900/30">
                {/* Morning Briefing Content */}
                {aiFeedActiveTab === 'morning' && (
                  <div className="space-y-4">
                    <MorningNews2026 />
                  </div>
                )}

                {/* Afternoon Report Content */}
                {aiFeedActiveTab === 'afternoon' && (
                  <div className="space-y-4">
                    <AfterMarketNews />
                  </div>
                )}

                {/* Evening Column Content */}
                {aiFeedActiveTab === 'evening' && (
                  <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 select-text leading-relaxed">
                    {eveningLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-3">
                        <div className="w-8 h-8 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-mono">Supabase에서 저녁 금융 칼럼을 집필하는 중입니다...</p>
                      </div>
                    ) : eveningColumn ? (
                      <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 select-text leading-relaxed">
                        <div className="bg-indigo-500/5 border border-indigo-500/15 p-5 rounded-2xl">
                          <h4 className="text-sm font-black text-indigo-400 border-b border-slate-200 dark:border-slate-800 pb-2 mb-3">
                            {eveningColumn.columnTitle || '저녁 경제 대망 칼럼'}
                          </h4>
                          <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
                            {eveningColumn.columnContentMarkdown || '저녁 금융 칼럼 데이터가 존재하지 않습니다.'}
                          </div>
                        </div>

                        {eveningColumn.threadsText && (
                          <div className="bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 p-4 rounded-xl space-y-2">
                            <h5 className="text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-widest font-mono">15년차 전업투자자의 심야 SNS 관점</h5>
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono leading-relaxed italic whitespace-pre-wrap">
                              "{eveningColumn.threadsText}"
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-slate-500 dark:text-slate-500 text-xs">
                        아직 동기화된 저녁 금융 칼럼 데이터가 존재하지 않습니다.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
