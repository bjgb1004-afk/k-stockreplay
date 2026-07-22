import { sanitizeRiseReason } from './JodojuAnalysisView';
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Info, 
  AlertCircle, 
  Flame, 
  TrendingUp, 
  DollarSign, 
  Cpu, 
  Globe, 
  TrendingDown,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  ArrowLeft,
  Loader2
} from 'lucide-react';

export interface CalendarEvent {
  id: string;
  day: number;
  title: string;
  type: 'kr-market' | 'us-market' | 'option' | 'macro' | 'earnings';
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  time?: string;
  description: string;
  marketReaction?: string; // 예상 영향 또는 팁
}

// 2026년 7월 증시 일정 고정 데이터
export const JULY_2026_EVENTS: CalendarEvent[] = [
  {
    id: 'ev-1',
    day: 1,
    title: '미국 6월 ISM 제조업 PMI 발표',
    type: 'macro',
    impact: 'MEDIUM',
    time: '23:00 (한국시간)',
    description: '미국의 제조업 경기 상황을 나타내는 대표적인 심리 지표입니다. 기준선인 50을 상회하는지 여부와 하부 지표인 신규 주문, 고용, 지불 가격 동향이 연준의 금리 경로에 영향을 미칩니다.',
    marketReaction: '전망치 하회 시 금리 인하 기대감 상승으로 기술주 반등 가능, 대폭 상회 시 국채 금리 상승 가능.'
  },
  {
    id: 'ev-2',
    day: 2,
    title: '미국 6월 챌린저 감원보고서',
    type: 'macro',
    impact: 'LOW',
    time: '20:30 (한국시간)',
    description: '미국 대기업들의 인력 감축 계획을 수집해 발표하는 노동 시장 지표입니다. 고용 둔화 시그널을 선제적으로 감지하는 역할을 합니다.',
    marketReaction: '감원 수치가 크게 늘어날 경우 고용 시장 냉각으로 받아들여져 금리 인하 압박으로 작용.'
  },
  {
    id: 'ev-3',
    day: 3,
    title: '뉴욕 증시 휴장 (독립기념일 대체휴일)',
    type: 'us-market',
    impact: 'HIGH',
    description: '미국 독립기념일(7월 4일)이 토요일임에 따라 금요일인 3일 대체휴일로 뉴욕 증시가 하루 휴장합니다. 한국 시장의 거래량이 다소 감소할 수 있습니다.',
    marketReaction: '외인 거래대금 감소로 국내 주도주 위주의 개별 종목 장세 가능성 상존.'
  },
  {
    id: 'ev-4',
    day: 7,
    title: '삼성전자 2분기 잠정실적 발표',
    type: 'earnings',
    impact: 'HIGH',
    time: '08:40 (한국시간)',
    description: '국내 증시의 최대 풍향계 역할을 하는 삼성전자의 2분기 매출 및 영업이익 잠정치(Guidance)가 발표됩니다. 특히 고대역폭메모리(HBM3E/HBM4) 공급 현황과 낸드/디램 반도체 단가 흐름에 대한 시장 평가가 핵심입니다.',
    marketReaction: '반도체 소부장(소재·부품·장비) 섹터 전반의 수급을 좌우하며, 어닝 서프라이즈 시 코스피 지수 강한 견인 예상.'
  },
  {
    id: 'ev-5',
    day: 8,
    title: '미국 연준 6월 FOMC 의사록 공개',
    type: 'macro',
    impact: 'MEDIUM',
    time: '03:00 (한국시간)',
    description: '지난 6월 개최된 FOMC 정례회의의 상세 의사록이 공개됩니다. 위원들의 물가 하락 신뢰도 수준, 고용 냉각에 대한 우려 정도, 향후 금리 인하에 대한 정량적 내부 의견 분포를 확인할 수 있습니다.',
    marketReaction: '매파적 발언 비중이 높을 시 야간 선물 및 익일 국내 증시 성장주 섹터에 다소 압박.'
  },
  {
    id: 'ev-6',
    day: 9,
    title: '한국 7월 옵션 만기일 (선물·옵션)',
    type: 'option',
    impact: 'HIGH',
    time: '09:00 - 15:30',
    description: '코스피200 옵션의 만기일입니다. 장 마감 10분 전(동시호가 시간)에 기관과 외국인의 차익거래 물량 청산으로 인해 대형주 위주의 급격한 변동성이 출현할 수 있는 날입니다.',
    marketReaction: '오후 3시 20분 이후 프로그램 매도/매수 유입에 따른 지수 왜곡 및 장막판 급변동 주의.'
  },
  {
    id: 'ev-7',
    day: 10,
    title: '미국 6월 생산자물가지수(PPI) 발표',
    type: 'macro',
    impact: 'MEDIUM',
    time: '21:30 (한국시간)',
    description: '제조업체가 생산하는 재화의 가격 변동을 나타내며, 소비자물가지수(CPI)의 선행 지표 역할을 수행합니다. 원자재 및 에너지 가격의 하향 안정이 지속되는지 확인해야 합니다.',
    marketReaction: '수치 둔화 지속 시 하반기 인플레이션 안심 국면 진입으로 해석되어 기술 성장주 호재.'
  },
  {
    id: 'ev-8',
    day: 15,
    title: '미국 6월 소비자물가지수(CPI) 발표',
    type: 'macro',
    impact: 'HIGH',
    time: '21:30 (한국시간)',
    description: '글로벌 금융 시장이 가장 주목하는 핵심 물가 데이터입니다. 헤드라인 CPI 전년 대비(YoY) 수치 및 근원(Core) CPI의 전월 대비(MoM) 흐름이 연준의 금리 인하 단행 시점을 결정짓는 핵심 잣대입니다.',
    marketReaction: '예상치 부합 혹은 하회 시 금리 인하 모멘텀이 극대화되며 나스닥 및 국내 반도체, 바이오 섹터 급등 유발 가능.'
  },
  {
    id: 'ev-9',
    day: 16,
    title: 'ECB(유럽중앙은행) 기준금리 결정',
    type: 'macro',
    impact: 'HIGH',
    time: '21:15 (한국시간)',
    description: '유럽 대륙의 통화 정책 방향을 결정하는 회의입니다. 유로존 인플레이션 둔화 속도에 맞추어 추가 금리 인하 혹은 동결을 발표하며, 크리스틴 라가르드 총재의 발언에 따라 달러 인덱스가 출렁입니다.',
    marketReaction: '유럽의 완화적 제스처가 강할 시 유로화 약세 → 달러 강세로 이어져 신흥국 환율 압박 가능.'
  },
  {
    id: 'ev-10',
    day: 17,
    title: '미국 7월 옵션 만기일',
    type: 'option',
    impact: 'HIGH',
    time: '22:30 - 익일 05:00',
    description: '미국 주식 및 지수 옵션 만기일입니다. 시가총액 거대 공룡 기업들(Apple, Microsoft, NVIDIA, Tesla 등)의 콜/풋 옵션 행사가 집중되어 개별 주가의 등락폭이 확대되는 경향이 있습니다.',
    marketReaction: '기관들의 포지션 롤오버로 인해 거래대금이 폭발하며, 미국 대형 성장주의 장중 꼬리 흔들기 변동성 증가.'
  },
  {
    id: 'ev-11',
    day: 21,
    title: '미국 넷플릭스(Netflix) Q2 실적 발표',
    type: 'earnings',
    impact: 'MEDIUM',
    time: '익일 05:00 발표',
    description: '빅테크 실적 시즌의 포문을 여는 스트리밍 대장주입니다. 유료 가입자 순증 수치 및 광고 요금제 매출 기여도가 엔터테인먼트, 미디어 섹터의 동조 흐름을 유발합니다.',
    marketReaction: '국내 미디어/콘텐츠 관련주(콘텐트리중앙, 스튜디오드래곤 등)의 센티먼트에 직접 영향.'
  },
  {
    id: 'ev-12',
    day: 22,
    title: '테슬라(Tesla) & 알파벳(Google) Q2 실적 발표',
    type: 'earnings',
    impact: 'HIGH',
    time: '익일 05:10 발표',
    description: '글로벌 2차전지 및 자율주행 시장의 상징인 테슬라와 AI 검색/클라우드 왕좌를 다투는 알파벳의 2분기 영업실적 및 컨퍼런스 콜이 진행됩니다. 인프라 투자 규모와 로보택시/AI 수익화 현황이 관건입니다.',
    marketReaction: '국내 에코프로, 엘앤에프 등 2차전지 밸류체인 및 네이버, 크라우드웍스 등 AI 관련주에 직접적인 초대형 변동성 전이.'
  },
  {
    id: 'ev-13',
    day: 23,
    title: '한국은행 금융통화위원회 기준금리 결정',
    type: 'macro',
    impact: 'HIGH',
    time: '10:00 (한국시간)',
    description: '국내 기준금리(현 3.50%) 동결 혹은 인하를 심의 결정합니다. 부동산 PF 대출 리스크와 원·달러 환율 방어 사이에서 이창용 총재 및 금통위원들의 고뇌가 담긴 성명서가 발표됩니다.',
    marketReaction: '금리 인하 단행 혹은 인하 소수의견 출현 시 건설, 바이오 등 고부채/성장주 업종 수혜 예상.'
  },
  {
    id: 'ev-14',
    day: 24,
    title: '미국 7월 S&P 글로벌 제조업/서비스업 PMI 속보치',
    type: 'macro',
    impact: 'MEDIUM',
    time: '22:45 (한국시간)',
    description: '가장 신속하게 현장 기업 실무자들을 조사하여 매월 말 발표하는 실물 경기 선행 속보치입니다. 경기 침체 우려가 과장되었는지 여부를 매크로 관점에서 조명합니다.',
    marketReaction: '서비스업 수치 둔화 시 서비스 인플레이션 압박 해소로 시장에 안도감 선사.'
  },
  {
    id: 'ev-15',
    day: 28,
    title: '한국 7월 소비자동향조사 (CSI)',
    type: 'macro',
    impact: 'LOW',
    time: '06:00 (한국시간)',
    description: '국내 소비자들이 느끼는 현재 경기 및 향후 소비 지출 전망을 종합한 심리 지표입니다. 고금리 장기화에 따른 내수 회복 강도를 반영합니다.',
    marketReaction: '소비자 기대 지수 악화 시 내수 소비재(유통, 요식업) 관련 주식 흐름이 저조할 가능성.'
  },
  {
    id: 'ev-16',
    day: 29,
    title: '미국 연준 FOMC 금리결정 및 성명서 발표',
    type: 'macro',
    impact: 'HIGH',
    time: '03:00 (익일 한국시간)',
    description: '글로벌 유동성 공급의 통제탑인 미국의 기준금리 인하 여부가 결정됩니다. 성명서 자구 수정 내용과 함께 이어서 진행되는 제롬 파월 연준 의장의 기자회견 질의응답이 시장 방향성을 궁극적으로 제어합니다.',
    marketReaction: '대망의 금리 인하 발표 시 전 세계 증시 랠리 폭발 가능, 추가 대기 스탠스 유지 시 일시적 숨고르기 양상.'
  },
  {
    id: 'ev-17',
    day: 30,
    title: '미국 2분기 GDP 성장률(속보치) 발표',
    type: 'macro',
    impact: 'HIGH',
    time: '21:30 (한국시간)',
    description: '미국 경제의 성장 궤도를 입증하는 가장 포괄적인 경제 성과 평가 지표입니다. 연착륙(Soft Landing) 시나리오가 여전히 작동 중인지, 혹은 역성장 조짐이 숨어 있는지 해독하는 키카드입니다.',
    marketReaction: '전망치 내외의 완만하고 견고한 성장률 기록 시 최적의 골디락스 환경으로 환영받아 지수 추가 동력 확보.'
  },
  {
    id: 'ev-18',
    day: 31,
    title: '미국 6월 개인소비지출(PCE) 물가지수',
    type: 'macro',
    impact: 'HIGH',
    time: '21:30 (한국시간)',
    description: '연준이 공식 통화 정책 목표치(2.0%)로 준용하는 가장 정밀한 물가 지표입니다. 가계 소비 행태 변화를 유연하게 반영하여 CPI보다 물가 추세를 노이즈 없이 정밀 측정합니다.',
    marketReaction: '7월 한 달 동안 쏟아진 매크로 일정의 마지막 퍼즐로, 물가 안정화 안착 입증 시 연내 추가 인하 로드맵이 탄탄해짐.'
  }
];

interface StockCalendarViewProps {
  onBack?: () => void;
  onSelectHistoricalStock?: (stock: any, date: string) => void;
}

export const StockCalendarView: React.FC<StockCalendarViewProps> = ({ onBack, onSelectHistoricalStock }) => {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [hoveredEvent, setHoveredEvent] = useState<CalendarEvent | null>(null);

  const [savedReports, setSavedReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState<boolean>(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loadingReportDetail, setLoadingReportDetail] = useState<boolean>(false);

  // 2026년 7월 고정값들 (수요일 시작, 31일 구성)
  const currentYear = 2026;
  const currentMonth = 7; // July
  const daysInMonth = 31;
  const startDayOffset = 3; // 수요일 시작 (0: Sun, 1: Mon, 2: Tue, 3: Wed, ...)

  // Fetch reports list on mount
  React.useEffect(() => {
    fetch('/api/platform/reports')
      .then(res => {
        if (!res.ok || !res.headers.get('content-type')?.includes('application/json')) {
          console.warn('[API Warning] Response is not JSON or not OK in StockCalendarView. Status:', res.status);
          return [];
        }
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setSavedReports(data);
        }
        setLoadingReports(false);
      })
      .catch(err => {
        console.error('Failed to load reports:', err);
        setLoadingReports(false);
      });
  }, []);

  const handleDayClick = async (day: number) => {
    setSelectedDay(day);
    setSelectedReport(null);
    setLoadingReportDetail(true);
    
    // Construct clicked date string: "2026-07-XX"
    const dateStr = `2026-07-${day.toString().padStart(2, '0')}`;
    try {
      const res = await fetch(`/api/platform/report?date=${dateStr}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedReport(data);
      }
    } catch (err) {
      console.error('Failed to load report detail:', err);
    } finally {
      setLoadingReportDetail(false);
    }
  };

  // Check if a specific day has a saved aftermarket report
  const hasSavedReport = (day: number) => {
    const dateStr = `2026-07-${day.toString().padStart(2, '0')}`;
    return savedReports.some(r => r.date === dateStr);
  };

  // 해당 일자의 이벤트 배열 추출
  const getDayEvents = (day: number) => {
    return JULY_2026_EVENTS.filter(e => e.day === day && (filterType === 'all' || e.type === filterType));
  };

  // 월별 달력 칸 수 배열 생성
  const calendarCells = [];
  // 이전 달 빈 칸
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push({ day: null, isCurrentMonth: false });
  }
  // 이번 달 일수
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push({ day: d, isCurrentMonth: true });
  }
  // 다음 달 빈 칸 채우기 (7열 그리드 완성)
  const totalCellsNeeded = Math.ceil(calendarCells.length / 7) * 7;
  const remainingCells = totalCellsNeeded - calendarCells.length;
  for (let i = 1; i <= remainingCells; i++) {
    calendarCells.push({ day: null, isCurrentMonth: false });
  }

  // 선택된 날짜의 이벤트 목록
  const activeEvents = selectedDay ? JULY_2026_EVENTS.filter(e => e.day === selectedDay) : [];

  return (
    <div id="stock-calendar-root" className="col-span-12 min-h-[80vh] bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Upper Brand / SEO Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 select-none">
          <div className="flex items-start gap-3">
            {onBack && (
              <button
                onClick={onBack}
                title="뒤로가기"
                className="mt-1 flex items-center justify-center w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-indigo-400 cursor-pointer transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
              >
                <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs font-black tracking-widest uppercase">
                <CalendarIcon className="w-4 h-4 text-indigo-400" />
                <span>Institutional Calendar System</span>
                <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[9px] px-1.5 py-0.5 rounded font-black">
                  JULY 2026
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                K-STOCK <span className="text-indigo-500">증시 캘린더</span>
              </h1>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                국내외 증시의 변동성을 좌우하는 핵심 금리, 만기일, 매크로 지표, 그리고 실적 발표 실시간 일정을 완전 해부합니다.
              </p>
            </div>
          </div>

          {/* Quick Stats Summary */}
          <div className="flex items-center gap-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 p-3 rounded-2xl shrink-0">
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800/80">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-500 font-mono uppercase">총 주요 일정</span>
              <span className="text-base font-black text-slate-800 dark:text-slate-200 font-mono">{JULY_2026_EVENTS.length}건</span>
            </div>
            <div className="text-center px-3 border-r border-slate-200 dark:border-slate-800/80">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-500 font-mono uppercase">초고변동 (HIGH)</span>
              <span className="text-base font-black text-red-400 font-mono">
                {JULY_2026_EVENTS.filter(e => e.impact === 'HIGH').length}건
              </span>
            </div>
            <div className="text-center px-1">
              <span className="block text-[9px] font-bold text-slate-500 dark:text-slate-500 font-mono uppercase">FOMC 일정</span>
              <span className="text-base font-black text-indigo-400 font-mono">1건</span>
            </div>
          </div>
        </div>

        {/* Categories / Filtering Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-2xl border border-slate-900">
          <div className="flex flex-wrap gap-1.5 select-none">
            {[
              { id: 'all', label: '전체 일정', count: JULY_2026_EVENTS.length, color: 'bg-indigo-600/10 text-indigo-400' },
              { id: 'kr-market', label: '국내 증시', count: JULY_2026_EVENTS.filter(e => e.type === 'kr-market').length, color: 'bg-rose-500/10 text-rose-400' },
              { id: 'us-market', label: '해외 증시', count: JULY_2026_EVENTS.filter(e => e.type === 'us-market').length, color: 'bg-sky-500/10 text-sky-400' },
              { id: 'macro', label: '금리/지표', count: JULY_2026_EVENTS.filter(e => e.type === 'macro').length, color: 'bg-emerald-500/10 text-emerald-400' },
              { id: 'option', label: '옵션 만기', count: JULY_2026_EVENTS.filter(e => e.type === 'option').length, color: 'bg-amber-500/10 text-amber-400' },
              { id: 'earnings', label: '주요 실적', count: JULY_2026_EVENTS.filter(e => e.type === 'earnings').length, color: 'bg-purple-500/10 text-purple-400' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setFilterType(tab.id);
                  setSelectedDay(null);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 border ${
                  filterType === tab.id
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/10'
                    : 'bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-900 hover:border-slate-200 dark:hover:border-slate-800 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-mono font-bold ${
                  filterType === tab.id ? 'bg-indigo-700 text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 dark:text-slate-500'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Current Selection Clear */}
          {selectedDay && (
            <button
              onClick={() => setSelectedDay(null)}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold transition-colors flex items-center gap-1 cursor-pointer select-none bg-indigo-500/5 px-2.5 py-1 rounded-xl border border-indigo-500/10"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>전체 월간 일정 보기</span>
            </button>
          )}
        </div>

        {/* Main Layout */}
        <div className="space-y-6 max-w-4xl mx-auto">
          
          {/* Calendar Month Matrix */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-slate-900 p-4 sm:p-5">
            {/* Calendar Control Header */}
            <div className="flex items-center justify-between mb-5 px-1 select-none">
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-900 dark:text-slate-100 font-mono">2026. 07</span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-500 bg-white dark:bg-slate-950 px-2 py-0.5 rounded-md border border-slate-900">
                  JULY
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button disabled className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-900/80 text-slate-600 cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button disabled className="p-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-900/80 text-slate-600 cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1.5 text-center mb-3 select-none">
              {['일', '월', '화', '수', '목', '금', '토'].map((dow, idx) => (
                <div 
                  key={idx} 
                  className={`text-[11px] font-black pb-1.5 border-b border-slate-900 ${
                    idx === 0 ? 'text-rose-400' : idx === 6 ? 'text-blue-400' : 'text-slate-500 dark:text-slate-500'
                  }`}
                >
                  {dow}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 min-h-[360px]">
              {calendarCells.map((cell, index) => {
                const day = cell.day;
                const isCurrent = cell.isCurrentMonth;
                const dayEvents = day ? getDayEvents(day) : [];
                const hasEvents = dayEvents.length > 0;
                
                // 해당 셀의 요일 인덱스 (0: Sun ~ 6: Sat)
                const dayOfWeek = index % 7;
                const isSunday = dayOfWeek === 0;
                const isSaturday = dayOfWeek === 6;

                // 선택여부 확인
                const isSelected = selectedDay === day;

                return (
                  <div
                    key={index}
                    onClick={() => {
                      if (day) {
                        handleDayClick(day);
                      }
                    }}
                    className={`relative min-h-[72px] sm:min-h-[84px] rounded-2xl p-1.5 flex flex-col justify-between transition-all select-none border group ${
                      !day 
                        ? 'bg-transparent border-transparent cursor-default' 
                        : isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-lg shadow-indigo-500/5 cursor-pointer z-10'
                        : 'bg-white dark:bg-slate-950/50 border-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-900/80 hover:border-slate-200 dark:hover:border-slate-800 cursor-pointer'
                    }`}
                  >
                    {/* Day Number Row */}
                    {day && (
                      <div className="flex items-center justify-between">
                        <span className={`text-[11px] font-black font-mono ${
                          isSelected
                            ? 'text-indigo-400'
                            : isSunday 
                            ? 'text-rose-400' 
                            : isSaturday 
                            ? 'text-blue-400' 
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {day}
                        </span>

                        {/* Saved Report or Impact Icon Dot */}
                        {hasSavedReport(day) ? (
                          <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[8px] font-bold px-1 rounded scale-90 sm:scale-100">
                            📄 분석글
                          </span>
                        ) : dayEvents.some(e => e.impact === 'HIGH') ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                        ) : null}
                      </div>
                    )}

                    {/* Day Events Indicator Strip */}
                    {day && (
                      <div className="space-y-1 mt-1 text-left flex-1 flex flex-col justify-end">
                        {dayEvents.slice(0, 2).map((ev) => (
                          <div 
                            key={ev.id}
                            onMouseEnter={() => setHoveredEvent(ev)}
                            onMouseLeave={() => setHoveredEvent(null)}
                            className={`text-[8px] sm:text-[9px] px-1.5 py-0.5 rounded-md font-bold truncate ${
                              ev.impact === 'HIGH'
                                ? 'bg-rose-950/40 text-rose-300 border border-rose-900/40'
                                : ev.impact === 'MEDIUM'
                                ? 'bg-amber-950/30 text-amber-300 border border-amber-900/40'
                                : 'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800/60'
                            }`}
                          >
                            {ev.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[7px] sm:text-[8px] font-mono text-slate-500 dark:text-slate-500 font-extrabold text-right pr-0.5">
                            +{dayEvents.length - 2}건 더있음
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Educational Disclaimer Panel */}
          <div className="bg-slate-50 dark:bg-slate-900/20 border border-slate-900 p-4 rounded-3xl text-[10px] text-slate-500 dark:text-slate-500 leading-relaxed select-text">
            <span className="font-extrabold text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mb-1 select-none">
              <Info className="w-3.5 h-3.5 text-slate-500 dark:text-slate-500" />
              캘린더 활용 및 투자 면책 안내
            </span>
            K-STOCK REPLAY 증시 캘린더는 실제 공정 공시 및 각 통화당국 공표 일정을 가공하여 제공합니다. 단, 거시경제 여건이나 유관 기관 사정으로 고지일정은 상시 변경될 수 있습니다. <strong>본 가이드 내용은 단순 교육 목적 수치 정보 분석이며 어떠한 주식 매수/매도 권유도 포함하지 않습니다.</strong>
          </div>

        </div>

      </div>

      {/* Details Modal Dialog Popup */}
      <AnimatePresence>
        {selectedDay !== null && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDay(null)}
              className="absolute inset-0 bg-white dark:bg-slate-950/85 backdrop-blur-md"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative w-full max-w-lg bg-slate-50 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl z-10 "
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedDay(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-slate-50 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer select-none"
              >
                <span className="sr-only">닫기</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="space-y-5">
                <div className="flex items-center justify-between select-none pr-8">
                  <span className="text-base font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <CalendarIcon className="w-5 h-5 text-indigo-400" />
                    <span>7월 {selectedDay}일 리포트 및 일정</span>
                  </span>
                  <span className="text-[10px] font-mono font-extrabold bg-white dark:bg-slate-950 px-2 py-0.5 border border-slate-900 text-indigo-400 rounded-md">
                    {activeEvents.length}개 일정
                  </span>
                </div>

                {/* Afternoon Report & Jodoju Dynamic Section */}
                {loadingReportDetail ? (
                  <div className="py-8 text-center text-xs text-slate-500 dark:text-slate-400 space-y-2 flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                    <p className="font-extrabold text-[11px]">당일 주도주 및 마켓 보고서를 불러오는 중...</p>
                  </div>
                ) : (
                  <>
                    {selectedReport && !selectedReport.isFallback && (
                      <div className="space-y-3.5 select-text text-left">
                        {/* Briefing summary card */}
                        <div className="bg-slate-100 dark:bg-slate-950/80 p-3.5 rounded-2xl border border-slate-900/60">
                          <h5 className="text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-1 mb-2">
                            <Globe className="w-4 h-4 text-indigo-400" />
                            <span>{selectedReport.date} 시황 분석 요약</span>
                          </h5>
                          <p className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                            {selectedReport.marketSummary?.koreanMarket || "해당 일자의 주도주 차트와 일정 정보 분석 데이터가 준비되어 있습니다."}
                          </p>
                        </div>

                        {/* Jodoju Stock list */}
                        {selectedReport.jodoju15 && selectedReport.jodoju15.length > 0 && (
                          <div className="space-y-2 pt-1">
                            <h5 className="text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-1">
                              <Flame className="w-4 h-4 text-rose-500" />
                              <span>오늘의 주도주 및 상승 사유 (15% 이상)</span>
                            </h5>
                            <div className="grid grid-cols-1 gap-2 pr-1">
                              {selectedReport.jodoju15.map((stock: any) => (
                                <div key={stock.code} className="bg-white dark:bg-slate-950 p-3 rounded-xl border border-slate-900 hover:border-slate-200 dark:hover:border-slate-800 transition-all flex items-center justify-between gap-3">
                                  <div className="space-y-1 text-left">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-xs font-black text-slate-900 dark:text-slate-100">{stock.name}</span>
                                      <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-500">{stock.code}</span>
                                      <span className="text-[10px] font-black text-rose-400">+{stock.changeRatio || stock.pct}%</span>
                                    </div>
                                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-normal">
                                      <strong className="text-indigo-400">[{stock.sector || stock.theme || "섹터 미확정"}]</strong> {sanitizeRiseReason(stock.riseReason || stock.reason, stock.name, stock.sector || stock.theme)}
                                    </p>
                                  </div>
                                  {onSelectHistoricalStock && (
                                    <button
                                      onClick={() => {
                                        onSelectHistoricalStock(stock, selectedReport.date);
                                        setSelectedDay(null);
                                      }}
                                      className="text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-2.5 py-1.5 rounded-lg transition-colors shrink-0 cursor-pointer"
                                    >
                                      차트 복기
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                <div className="border-t border-slate-200 dark:border-slate-800 pt-3 select-none">
                  <h5 className="text-xs font-black text-slate-800 dark:text-slate-300 flex items-center gap-1 mb-2.5">
                    <CalendarIcon className="w-4 h-4 text-slate-400" />
                    <span>📅 거시경제 매크로 주요 일정</span>
                  </h5>
                  
                  {activeEvents.length === 0 ? (
                    <div className="py-4 text-center text-[11px] text-slate-500 dark:text-slate-500 space-y-1">
                      <HelpCircle className="w-6 h-6 mx-auto text-slate-600 stroke-1" />
                      <p>해당 일자에는 거시경제 일정이 예정되어 있지 않습니다.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 pr-1">
                      {activeEvents.map((ev) => (
                        <div
                          key={ev.id}
                          className="bg-white dark:bg-slate-950 p-4 rounded-2xl border border-slate-900 hover:border-slate-200 dark:border-slate-850 transition-colors select-text"
                        >
                          {/* Event Type & Impact Badges */}
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-[8px] sm:text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider font-mono ${
                              ev.type === 'kr-market' ? 'bg-rose-500/10 text-rose-400' :
                              ev.type === 'us-market' ? 'bg-sky-500/10 text-sky-400' :
                              ev.type === 'macro' ? 'bg-emerald-500/10 text-emerald-400' :
                              ev.type === 'option' ? 'bg-amber-500/10 text-amber-400' :
                              'bg-purple-500/10 text-purple-400'
                            }`}>
                              {ev.type === 'kr-market' ? '국내 증시' :
                               ev.type === 'us-market' ? '해외 증시' :
                               ev.type === 'macro' ? '금리·지표' :
                               ev.type === 'option' ? '옵션 만기' : '기업 실적'}
                            </span>

                            <div className="flex items-center gap-1.5">
                              {ev.time && (
                                <span className="text-[9px] font-semibold text-slate-500 dark:text-slate-500 font-mono">
                                  {ev.time}
                                </span>
                              )}
                              <span className={`text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-md font-mono ${
                                ev.impact === 'HIGH' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                ev.impact === 'MEDIUM' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/20' :
                                'bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                              }`}>
                                {ev.impact} IMPACT
                              </span>
                            </div>
                          </div>

                          {/* Event Title */}
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 mb-1.5">
                            {ev.title}
                          </h4>

                          {/* Description */}
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                            {ev.description}
                          </p>

                          {/* Market Reaction Tip */}
                          {ev.marketReaction && (
                            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-2.5 rounded-xl text-[10px] text-slate-600 dark:text-slate-400 leading-relaxed">
                              <span className="font-extrabold text-indigo-400 flex items-center gap-1 mb-1 select-none">
                                <AlertCircle className="w-3.5 h-3.5" />
                                매매 가이드 및 영향
                              </span>
                              {ev.marketReaction}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="px-4 py-2 rounded-xl text-xs font-black bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer select-none"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
