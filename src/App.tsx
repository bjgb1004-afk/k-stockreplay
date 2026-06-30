/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, 
  TrendingDown, 
  RefreshCw, 
  Play, 
  ArrowRight, 
  Volume2, 
  VolumeX, 
  Info, 
  FileText, 
  Coins, 
  Briefcase, 
  BarChart3,
  Award,
  Search,
  AlertCircle,
  Wifi,
  WifiOff,
  MessageSquare,
  BookOpen
} from 'lucide-react';
import { Candle, StockSymbol, Trade } from './types';
import { getStockData, fetchRealStockData, resolveStockTicker } from './data';
import { ReplayChart } from './components/ReplayChart';

const INITIAL_BALANCE = 10000000; // 10,000,000 KRW

export default function App() {
  // Simulator State
  const [symbol, setSymbol] = useState<StockSymbol>('삼성전자');
  const [currentIndex, setCurrentIndex] = useState<number>(9); // Start with 10 candles (index 0 to 9)
  const [balance, setBalance] = useState<number>(INITIAL_BALANCE);
  const [holdings, setHoldings] = useState<number>(0);
  const [averagePrice, setAveragePrice] = useState<number>(0);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showResultModal, setShowResultModal] = useState<boolean>(false);
  const [showPremiumModal, setShowPremiumModal] = useState<boolean>(false);
  const [activeLegalModal, setActiveLegalModal] = useState<'terms' | 'privacy' | null>(null);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(() => {
    try {
      const hiddenUntil = localStorage.getItem('hideGuideUntil');
      if (hiddenUntil) {
        if (Date.now() < parseInt(hiddenUntil, 10)) {
          return false;
        }
      }
    } catch (e) {}
    return true;
  });

  // Rotating Tips / Notices State
  const [noticeIndex, setNoticeIndex] = useState<number>(0);
  const notices = [
    "[스페이스바(Spacebar)] 키를 누르면 다음 일봉 캔들로 빠르게 넘어갑니다.",
    "5일 이동평균선(노란선)이 20일 이동평균선(자홍선)을 상향 돌파(골든크로스)할 때 주목해보세요.",
    "효과음 소리가 크다면 우측 버튼(ON/OFF)을 통해 효과음을 간편하게 끌 수 있습니다.",
    "거래량(Volume) 막대의 색상이 빨간색이면 상승 마감, 파란색이면 하락 마감을 의미합니다."
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setNoticeIndex((prev) => (prev + 1) % notices.length);
    }, 5000); // 5 seconds
    return () => clearInterval(timer);
  }, [notices.length]);

  // Dynamic Data Loading States
  const [stockData, setStockData] = useState<Candle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRealData, setIsRealData] = useState<boolean>(false);
  const [customTickerInput, setCustomTickerInput] = useState<string>('005930');
  const [activeCustomTicker, setActiveCustomTicker] = useState<string>('005930');
  const [customStockName, setCustomStockName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Autocomplete & Search States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<{ name: string; ticker: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  // Real-time Autocomplete Suggestions Fetching
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search-stock?query=${encodeURIComponent(searchQuery)}`);
        if (response.ok) {
          const data = await response.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error('Failed to fetch search suggestions:', err);
      }
    }, 200);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Handle click on suggestions
  const selectSearchResult = (item: { name: string; ticker: string }) => {
    setSymbol('사용자정의');
    setActiveCustomTicker(item.ticker);
    setCustomStockName(item.name);
    setSearchQuery('');
    setSearchResults([]);
    setShowSuggestions(false);
    
    // Reset trading state
    setBalance(INITIAL_BALANCE);
    setHoldings(0);
    setAveragePrice(0);
    setTrades([]);
    setCurrentIndex(9);
  };

  // Direct manual search / Enter key handler
  const handleDirectSearch = async () => {
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    try {
      if (/^\d{6}$/.test(trimmed)) {
        // If it's a 6-digit numeric ticker code
        setSymbol('사용자정의');
        setActiveCustomTicker(trimmed);
        setCustomStockName(trimmed); // Will be updated to name when loaded
        setSearchQuery('');
        setSearchResults([]);
        setShowSuggestions(false);
        
        // Reset trading state
        setBalance(INITIAL_BALANCE);
        setHoldings(0);
        setAveragePrice(0);
        setTrades([]);
        setCurrentIndex(9);
      } else {
        // Search by name via API
        const response = await fetch(`/api/search-stock?query=${encodeURIComponent(trimmed)}`);
        if (response.ok) {
          const data = await response.json();
          const items = data.results || [];
          if (items.length > 0) {
            selectSearchResult(items[0]);
          } else {
            throw new Error(`'${trimmed}'에 해당하는 종목을 찾을 수 없습니다.`);
          }
        } else {
          throw new Error('종목 검색에 실패했습니다.');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || '종목을 찾을 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load stock data dynamically
  useEffect(() => {
    let active = true;
    async function loadData() {
      setIsLoading(true);
      setErrorMsg(null);
      try {
        const result = await fetchRealStockData(symbol, symbol === '사용자정의' ? activeCustomTicker : undefined);
        if (active) {
          setStockData(result.candles);
          setIsRealData(true);
          if (result.name && symbol === '사용자정의') {
            setCustomStockName(result.name);
          }
          setCurrentIndex(Math.min(9, result.candles.length - 1));
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('API load failed, using fallback mock data:', err);
        if (active) {
          if (symbol === '사용자정의') {
            setErrorMsg(err.message || '데이터를 불러오는 데 실패했습니다.');
            setStockData([]);
            setIsLoading(false);
          } else {
            // Fallback to high-quality local dataset
            const mock = getStockData(symbol);
            setStockData(mock);
            setIsRealData(false);
            setCurrentIndex(Math.min(9, mock.length - 1));
            setIsLoading(false);
          }
        }
      }
    }

    loadData();
    // Reset trading state on stock change
    setBalance(INITIAL_BALANCE);
    setHoldings(0);
    setAveragePrice(0);
    setTrades([]);

    return () => {
      active = false;
    };
  }, [symbol, activeCustomTicker]);

  // Google AdSense auto-push initialization on mount
  useEffect(() => {
    try {
      // @ts-ignore
      if (window.adsbygoogle) {
        // @ts-ignore
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.error('Google AdSense initialization error:', e);
    }
  }, []);

  // 웹사이트 보안 및 콘텐츠 무단 도용 방지 (우클릭 금지, 드래그 금지, 개발자 도구 단축키 방지)
  useEffect(() => {
    // 1. 마우스 오른쪽 클릭 금지
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // 2. 드래그 및 선택 금지
    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };
    const handleDragStart = (e: Event) => {
      e.preventDefault();
    };

    // 3. 주요 개발자 도구 및 소스 유출 방지 단축키 차단
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = (navigator.userAgent || navigator.platform || '').toUpperCase().indexOf('MAC') >= 0;
      const isControlOrCmd = isMac ? e.metaKey : e.ctrlKey;

      // F12 차단
      if (e.key === 'F12') {
        e.preventDefault();
        return false;
      }

      // 소스 보기 (Ctrl + U 또는 Cmd + Opt + U) 차단
      if (isControlOrCmd && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        return false;
      }

      // 개발자 도구 (Ctrl + Shift + I 또는 Cmd + Opt + I) 차단
      if (isControlOrCmd && e.shiftKey && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        return false;
      }

      // 개발자 도구 콘솔 (Ctrl + Shift + J 또는 Cmd + Opt + J) 차단
      if (isControlOrCmd && e.shiftKey && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        return false;
      }

      // 저장 (Ctrl + S 또는 Cmd + S) 차단
      if (isControlOrCmd && e.key.toLowerCase() === 's') {
        e.preventDefault();
        return false;
      }

      // 복사 (Ctrl + C 또는 Cmd + C) 차단 (입력창/텍스트 영역 제외)
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isControlOrCmd && e.key.toLowerCase() === 'c' && !isInput) {
        e.preventDefault();
        return false;
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('dragstart', handleDragStart);
    document.addEventListener('keydown', handleKeyDown);

    // cleanup
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('dragstart', handleDragStart);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Current visible candles (up to currentIndex)
  const visibleCandles = stockData.slice(0, currentIndex + 1);
  const currentCandle = stockData[currentIndex];
  const currentPrice = currentCandle ? currentCandle.close : 0;

  // Real-time calculations
  const evaluationAmount = holdings * currentPrice;
  const totalAssets = balance + evaluationAmount;
  const sessionReturnRate = ((totalAssets - INITIAL_BALANCE) / INITIAL_BALANCE) * 100;

  // Active holding metrics
  const holdingReturnRate = holdings > 0 ? ((currentPrice - averagePrice) / averagePrice) * 100 : 0;
  const holdingReturnAmount = holdings > 0 ? (currentPrice - averagePrice) * holdings : 0;

  // Completed trades metrics (for summary modal)
  const sellTrades = trades.filter(t => t.type === 'SELL');
  const completedCount = sellTrades.length;
  const winTrades = sellTrades.filter(t => (t.realizedPnL || 0) > 0);
  const loseTrades = sellTrades.filter(t => (t.realizedPnL || 0) < 0);
  const winCount = winTrades.length;
  const loseCount = loseTrades.length;
  const winRate = completedCount > 0 ? (winCount / completedCount) * 100 : 0;
  const avgWinPct = winCount > 0 ? winTrades.reduce((sum, t) => sum + (t.realizedPnLPct || 0), 0) / winCount : 0;
  const avgLossPct = loseCount > 0 ? Math.abs(loseTrades.reduce((sum, t) => sum + (t.realizedPnLPct || 0), 0) / loseCount) : 0;
  
  let profitLossRatioStr = '-';
  if (completedCount > 0) {
    if (loseCount === 0) {
      profitLossRatioStr = winCount > 0 ? '무제한 (손실 없음) 🚀' : '0.00';
    } else {
      const ratio = avgLossPct > 0 ? avgWinPct / avgLossPct : 0;
      profitLossRatioStr = ratio.toFixed(2);
    }
  }

  // Current daily candle fluctuation
  const dailyChange = currentCandle ? currentCandle.close - currentCandle.open : 0;
  const dailyChangePct = currentCandle ? (dailyChange / currentCandle.open) * 100 : 0;
  const isDailyUp = dailyChange >= 0;

  // Web Audio SFX Engine
  const playSound = (type: 'tick' | 'buy' | 'sell' | 'complete' | 'reset') => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'tick') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.04);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.05);
      } else if (type === 'buy') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'sell') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(392.00, audioCtx.currentTime + 0.08); // G4
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.25);
      } else if (type === 'complete') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3); // C6
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.65);
      } else if (type === 'reset') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.12);
      }
    } catch (e) {}
  };

  // Keyboard Event Listener: Spacebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts when typing in input, textarea, or select elements
      const activeEl = document.activeElement;
      if (activeEl && (
        activeEl.tagName === 'INPUT' || 
        activeEl.tagName === 'TEXTAREA' || 
        activeEl.tagName === 'SELECT' ||
        activeEl.getAttribute('contenteditable') === 'true'
      )) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        // If a button has focus, pressing spacebar will naturally trigger a click.
        // To prevent double-triggering handleNextCandle, we blur the button.
        if (activeEl && activeEl.tagName === 'BUTTON') {
          (activeEl as HTMLElement).blur();
        }
        handleNextCandle();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, stockData, soundEnabled]);

  // Next Candle Handler
  const handleNextCandle = () => {
    if (stockData.length === 0) return;
    if (currentIndex < stockData.length - 1) {
      setCurrentIndex(prev => prev + 1);
      playSound('tick');
    } else {
      playSound('complete');
      setShowResultModal(true);
    }
  };

  // 100% Market Buy
  const handleMarketBuy = () => {
    if (!currentCandle || balance < currentPrice) return;

    const purchasableQty = Math.floor(balance / currentPrice);
    if (purchasableQty <= 0) return;

    const totalCost = purchasableQty * currentPrice;
    const balanceAfter = balance - totalCost;

    const newTotalQty = holdings + purchasableQty;
    const newAveragePrice = Math.round(((holdings * averagePrice) + totalCost) / newTotalQty);

    setHoldings(newTotalQty);
    setAveragePrice(newAveragePrice);
    setBalance(balanceAfter);

    const newTrade: Trade = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'BUY',
      date: currentCandle.date,
      price: currentPrice,
      quantity: purchasableQty,
      amount: totalCost,
      balanceAfter: balanceAfter
    };

    setTrades(prev => [newTrade, ...prev]);
    playSound('buy');
  };

  // 100% Market Sell
  const handleMarketSell = () => {
    if (!currentCandle || holdings <= 0) return;

    const sellProceeds = holdings * currentPrice;
    const balanceAfter = balance + sellProceeds;
    const costBasis = holdings * averagePrice;
    const realizedPnL = sellProceeds - costBasis;
    const realizedPnLPct = averagePrice > 0 ? ((currentPrice - averagePrice) / averagePrice) * 100 : 0;

    const newTrade: Trade = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'SELL',
      date: currentCandle.date,
      price: currentPrice,
      quantity: holdings,
      amount: sellProceeds,
      balanceAfter: balanceAfter,
      entryPrice: averagePrice,
      realizedPnL,
      realizedPnLPct
    };

    setHoldings(0);
    setAveragePrice(0);
    setBalance(balanceAfter);

    setTrades(prev => [newTrade, ...prev]);
    playSound('sell');
  };

  // Restart / Reset Handler
  const handleReset = () => {
    setCurrentIndex(9);
    setBalance(INITIAL_BALANCE);
    setHoldings(0);
    setAveragePrice(0);
    setTrades([]);
    setShowResultModal(false);
    playSound('reset');
  };

  // Handler for symbol drop down changes
  const handleSymbolChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const selectedSymbol = e.target.value as StockSymbol;
    if (selectedSymbol === '사용자정의') {
      setShowPremiumModal(true);
      // Reset the drop down value visually to the active symbol
      e.target.value = symbol;
      return;
    }
    setSymbol(selectedSymbol);
    setCurrentIndex(9);
    setBalance(INITIAL_BALANCE);
    setHoldings(0);
    setAveragePrice(0);
    setTrades([]);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans overflow-x-hidden border border-slate-800 shadow-2xl pb-24 lg:pb-0 select-none" id="root-container">
      
      {/* 1. 상단 대시보드 바 (가로형 고정 헤더) */}
      <header className="h-auto md:h-16 flex flex-col md:flex-row items-center justify-between px-6 py-4 md:py-0 bg-slate-900 border-b border-slate-800 gap-4" id="top-navbar">
        <div className="flex items-center gap-3">
          <h1 className="text-md md:text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
            K-Stock Replay 
            <span className="text-blue-400 font-normal">Simulator</span> 
          </h1>
          <a 
            href="https://forms.gle/5P3dUTEda5kA3me8A"
            target="_blank" 
            rel="noopener noreferrer"
            className="hidden sm:flex items-center gap-1 text-[11px] bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold px-3 py-1.5 rounded-full border border-red-500/30 transition-all hover:scale-105 ml-2 shadow-sm"
          >
            <MessageSquare className="w-3 h-3 text-red-400" />
            <span>고객 건의함 📩</span>
          </a>
          <button 
            onClick={() => setShowGuideModal(true)}
            className="flex items-center gap-1 text-[11px] bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-bold px-3 py-1.5 rounded-full border border-blue-500/30 transition-all hover:scale-105 ml-1.5 shadow-sm cursor-pointer whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="whitespace-nowrap">활용 가이드</span>
          </button>
        </div>

        {/* 트레이딩 성적표 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 text-sm w-full md:w-auto" id="trading-scoreboard">
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">매수 평단가</span>
            <span id="avgPrice" className="font-mono font-bold text-white mt-0.5">
              {averagePrice.toLocaleString()} 원
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">현재 수익률</span>
            <span id="roi" className={`font-mono font-bold mt-0.5 ${holdings > 0 ? (holdingReturnRate >= 0 ? 'text-red-500' : 'text-blue-500') : 'text-slate-500'}`}>
              {holdings > 0 ? (holdingReturnRate >= 0 ? '▲ ' : '▼ ') : ''}
              {holdings > 0 ? holdingReturnRate.toFixed(2) : '0.00'}%
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">가상 잔고</span>
            <span id="balance" className="font-mono font-bold text-white tracking-wide">
              {Math.round(balance).toLocaleString()} 원
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-slate-500 text-[10px] uppercase font-semibold tracking-wider">보유 수량</span>
            <span id="quantity" className="font-mono font-bold text-white">
              {holdings.toLocaleString()} 주
            </span>
          </div>
        </div>
      </header>

      {/* 2. 중앙 메인 콘텐츠 영역 (좌우 2분할 7:3) */}
      <main className="flex-grow flex flex-col lg:flex-row lg:overflow-hidden w-full" id="main-content">
        
        {/* 왼쪽 차트 패널 (70% 폭) */}
        <section className="flex-1 bg-slate-950 relative lg:border-r border-slate-800 p-4 sm:p-6 flex flex-col gap-5">
          
          {/* 종목 선택 및 데이터 연결 상태 바 - 모바일용 (차트 위) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800/80 rounded-xl p-3 lg:hidden" id="stock-selector-bar-mobile">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 uppercase tracking-wider flex-shrink-0">종목 선택</span>
              <div className="relative flex-grow sm:flex-initial sm:w-60">
                <select 
                  value={symbol}
                  onChange={handleSymbolChange}
                  className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-sm"
                  id="stockSelect"
                >
                  <option value="삼성전자">삼성전자 (005930)</option>
                  <option value="SK하이닉스">SK하이닉스 (000660)</option>
                  <option value="NAVER">NAVER (035420)</option>
                  <option value="카카오">카카오 (035720)</option>
                  <option value="현대차">현대차 (005380)</option>
                  <option value="에코프로비엠">에코프로비엠 (247540)</option>
                  <option value="알테오젠">알테오젠 (196170)</option>
                  <option value="한화에어로스페이스">한화에어로스페이스 (012450)</option>
                  <option value="셀트리온">셀트리온 (068270)</option>
                  <option value="에코프로">에코프로 (086520)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-4">
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {isLoading ? (
                  <span className="text-blue-400 animate-pulse flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                    불러오는 중...
                  </span>
                ) : isRealData ? (
                  <span className="text-green-400 flex items-center gap-1.5 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 text-[11px]" title="실제 거래소 API에서 가져온 일봉 데이터">
                    <Wifi className="w-3.5 h-3.5" /> 실시간 데이터 연결됨
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          {/* 가상 주가 정보 바 - Sophisticated Dark Layout */}
          <div className="flex flex-wrap items-baseline gap-4 z-10" id="price-hud">
            <span id="displayStockName" className="text-2xl font-bold text-white">
              {symbol === '사용자정의' ? (customStockName || activeCustomTicker) : symbol}
            </span>
            <span id="displayPrice" className="text-xl font-mono text-slate-300 font-semibold tracking-tight">
              {currentPrice.toLocaleString()} 원
            </span>
            <span id="displayDiff" className={`text-xs font-semibold tracking-tight ${isDailyUp ? 'text-red-500' : 'text-blue-500'}`}>
              {isDailyUp ? '▲' : '▼'} {Math.abs(dailyChange).toLocaleString()} ({isDailyUp ? '+' : ''}{dailyChangePct.toFixed(2)}%)
            </span>
            
            {/* Real-time details */}
            <div className="ml-auto text-[11px] font-mono text-slate-500 bg-slate-900/80 px-2.5 py-1 rounded border border-slate-800 flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-blue-400" />
              <span>진행:</span>
              <span className="text-slate-200 font-semibold">{currentIndex + 1}</span> / {stockData.length} 일차
            </div>
          </div>

          {errorMsg && (
            <div className="bg-red-950/20 border border-red-900/30 text-red-400 text-xs p-3 rounded-xl flex items-start gap-2 leading-relaxed" id="error-message">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 차트 캔버스 */}
          <div className="flex-grow min-h-[280px] sm:min-h-[400px] relative rounded-xl border border-slate-800/80 bg-slate-950/40 overflow-hidden">
            {isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-[2px] z-20">
                <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-3" />
                <span className="text-xs font-mono text-slate-400">실시간 데이터 불러오는 중...</span>
              </div>
            ) : stockData.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 z-20 text-slate-500 p-4 text-center">
                <AlertCircle className="w-8 h-8 text-red-500/80 mb-2" />
                <span className="text-xs text-slate-300">데이터가 없습니다. 올바른 6자리 한국 주식 종목코드를 입력하고 조회해 주세요.</span>
              </div>
            ) : null}
            <ReplayChart candles={visibleCandles} trades={trades} averagePrice={averagePrice} />
          </div>

          {/* 단축키 및 정보 롤링 배너 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg px-4 py-2.5 flex items-center justify-between text-[11px] text-slate-400 gap-4 overflow-hidden">
            <div className="flex items-center gap-2.5 flex-grow min-w-0">
              <span className="flex-shrink-0 bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider">
                TIP / 안내
              </span>
              <div className="relative flex-grow h-5 overflow-hidden cursor-pointer select-none" onClick={() => setNoticeIndex((prev) => (prev + 1) % notices.length)} title="클릭하여 다음 팁 보기">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={noticeIndex}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="absolute inset-x-0 top-0 bottom-0 flex items-center text-slate-300 font-medium truncate"
                  >
                    {notices[noticeIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            
            {/* Audio Toggle in HUD */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700/50 flex-shrink-0"
              title={soundEnabled ? "효과음 끄기" : "효과음 켜기"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-500" />}
              <span className="text-[10px]">{soundEnabled ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </section>

        {/* 오른쪽 대시보드 컨트롤러 (30% 폭) */}
        <aside className="w-full lg:w-[320px] bg-slate-900 p-6 flex flex-col gap-5 border-t lg:border-t-0 border-slate-800 overflow-y-auto">
          
          {/* 종목 선택 및 데이터 연결 상태 바 - 데스크탑용 (차트 옆칸 우측 사이드바 상단) */}
          <div className="hidden lg:flex flex-col gap-3 bg-slate-850/50 border border-slate-800/80 rounded-xl p-4" id="stock-selector-bar-desktop">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">종목 선택</span>
            <div className="relative w-full">
              <select 
                value={symbol}
                onChange={handleSymbolChange}
                className="w-full bg-slate-800 border border-slate-700 text-slate-100 rounded-lg px-3 py-2 text-xs font-semibold outline-none focus:border-blue-500 transition-colors cursor-pointer shadow-sm"
                id="stockSelectDesktop"
              >
                <option value="삼성전자">삼성전자 (005930)</option>
                <option value="SK하이닉스">SK하이닉스 (000660)</option>
                <option value="NAVER">NAVER (035420)</option>
                <option value="카카오">카카오 (035720)</option>
                <option value="현대차">현대차 (005380)</option>
                <option value="에코프로비엠">에코프로비엠 (247540)</option>
                <option value="알테오젠">알테오젠 (196170)</option>
                <option value="한화에어로스페이스">한화에어로스페이스 (012450)</option>
                <option value="셀트리온">셀트리온 (068270)</option>
                <option value="에코프로">에코프로 (086520)</option>
              </select>
            </div>

            <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-800/40">
              <span className="text-[10px] text-slate-500">데이터 연결 상태</span>
              <div className="flex items-center gap-1.5 font-mono text-xs">
                {isLoading ? (
                  <span className="text-blue-400 animate-pulse flex items-center gap-1 text-[10px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                    불러오는 중...
                  </span>
                ) : isRealData ? (
                  <span className="text-green-400 flex items-center gap-1 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 text-[10px]" title="실제 거래소 API에서 가져온 일봉 데이터">
                    <Wifi className="w-3 h-3 text-green-400" /> 연결됨
                  </span>
                ) : null}
              </div>
            </div>
          </div>
          
          {/* 리셋 & 다음 캔들 버튼 그리드 */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleReset} 
              className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 py-3 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
            >
              <RefreshCw className="w-3 h-3 text-slate-400" />
              초기화 / 시작
            </button>
            <button 
              id="nextBtn"
              onClick={handleNextCandle}
              className="w-full bg-yellow-500 hover:bg-yellow-400 text-slate-950 py-3 rounded-lg text-xs font-black shadow-lg shadow-yellow-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1 group"
            >
              다음 캔들
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* 거래 동작 및 자산 요약 영역 */}
          <div className="mt-auto space-y-4 pt-4 border-t border-slate-800">
            
            {/* 총 평가 자산 프로그레스 카드 */}
            <div id="assetInfo" className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-400">총 자산 평가액</span>
                <span id="totalAsset" className="text-xs font-bold text-white font-mono">
                  {Math.round(totalAssets).toLocaleString()} 원
                </span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full overflow-hidden">
                <div 
                  id="assetBar" 
                  className={`h-full transition-all duration-300 ${totalAssets >= INITIAL_BALANCE ? 'bg-red-500' : 'bg-blue-500'}`} 
                  style={{ width: `${Math.min(Math.max((totalAssets / INITIAL_BALANCE) * 100, 5), 100)}%` }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-500">
                <span>원금: {INITIAL_BALANCE.toLocaleString()}원</span>
                <span className={`font-semibold ${sessionReturnRate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                  누적 수익률: {sessionReturnRate >= 0 ? '+' : ''}{sessionReturnRate.toFixed(2)}%
                </span>
              </div>

              {holdings > 0 && (
                <div className="pt-2 border-t border-slate-700/60 flex flex-col gap-1 text-[11px] text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[10px]">보유 종목 수익률</span>
                    <span className={`font-mono font-bold ${holdingReturnRate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                      {holdingReturnRate >= 0 ? '▲' : '▼'} {Math.abs(holdingReturnRate).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 text-[10px]">평가 손익</span>
                    <span className={`font-mono font-bold ${holdingReturnAmount >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                      {holdingReturnAmount >= 0 ? '+' : ''}{Math.round(holdingReturnAmount).toLocaleString()} 원
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* 시장가 매수 버튼 */}
            <button 
              id="buyBtn"
              onClick={handleMarketBuy}
              disabled={balance < currentPrice}
              className="w-full bg-red-600 hover:bg-red-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed py-4 rounded-xl text-md font-bold shadow-lg shadow-red-900/40 transform active:scale-95 text-white transition-all"
            >
              시장가 매수 (100%)
            </button>

            {/* 시장가 매도 버튼 */}
            <button 
              id="sellBtn"
              onClick={handleMarketSell}
              disabled={holdings <= 0}
              className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed py-4 rounded-xl text-md font-bold shadow-lg shadow-blue-900/40 transform active:scale-95 text-white transition-all"
            >
              시장가 매도 (100%)
            </button>

            <div className="text-center text-[10px] text-slate-500 italic uppercase tracking-wider">
              Market Status: Real-time Simulation
            </div>
          </div>

          {/* 실시간 매매 일지 기록 로그 (Sleek Dark Version) */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-col h-[200px] overflow-hidden" id="trade-history-panel">
            <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2">
              <FileText className="w-3.5 h-3.5 text-blue-400" />
              <h2 className="text-[11px] font-bold text-slate-400">실시간 체결 일지 ({trades.length}건)</h2>
            </div>
            
            <div className="flex-grow overflow-y-auto space-y-1.5 text-[10px] font-mono scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              {trades.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center p-2">
                  <p>체결 내역이 없습니다</p>
                </div>
              ) : (
                trades.map((trade) => {
                  const isBuy = trade.type === 'BUY';
                  return (
                    <div 
                      key={trade.id} 
                      className={`p-2.5 rounded-lg border flex flex-col gap-1 transition-colors ${
                        isBuy 
                          ? 'bg-red-950/30 border-red-800/50 text-red-100' 
                          : 'bg-blue-950/30 border-blue-800/50 text-blue-100'
                      }`}
                    >
                      <div className="flex justify-between items-center font-bold text-[11px]">
                        <span className="text-slate-300 font-semibold">{trade.date}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] ${isBuy ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {isBuy ? '매수 체결' : '매도 체결'}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-200 font-medium text-[11px] mt-0.5 pt-1 border-t border-slate-800/40">
                        <span>단가: <span className="font-mono text-white font-bold">{trade.price.toLocaleString()}</span> 원</span>
                        <span>수량: <span className="font-mono text-white font-bold">{trade.quantity}</span> 주</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </aside>
      </main>

      {/* 구글 애드센스 가로형 반응형 배너 광고 구역 */}
      <div className="max-w-7xl mx-auto w-full px-6 pb-4" id="adsense-banner-container">
        <div className="bg-slate-900 border border-slate-800/80 rounded-xl p-3 flex flex-col items-center justify-center min-h-[90px] relative overflow-hidden group">
          {/* Subtle visual branding accent */}
          <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500/20" />
          <div className="absolute top-1.5 right-2 text-[8px] font-semibold text-slate-600 uppercase tracking-widest select-none pointer-events-none">
            ADVERTISEMENT
          </div>
          
          <div className="w-full flex flex-col items-center justify-center text-center">
            {/* Google AdSense Responsive Unit */}
            <ins className="adsbygoogle"
                 style={{ display: 'block', width: '100%', height: '90px' }}
                 data-ad-client="ca-pub-4850161179932319"
                 data-ad-slot="auto"
                 data-ad-format="auto"
                 data-full-width-responsive="true"></ins>
            
            {/* Elegant visual placeholder for seamless UX prior to AdSense server response loading */}
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 pointer-events-none group-hover:bg-slate-900/90 transition-colors">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">Google AdSense Area</span>
              </div>
              <p className="text-xs text-slate-400 font-medium font-sans">구글 애드센스 가로형 반응형 광고 영역</p>
              <p className="text-[9px] text-slate-600 mt-0.5">애드센스 자동광고 및 지정형 배너가 이 위치에 맞춰 자동으로 게재됩니다.</p>
            </div>
          </div>
        </div>
      </div>

      {/* 주식 리플레이 시뮬레이터 탄생배경 및 활용 가이드 & 단타 매매 꿀팁 (SEO/AdSense 승인용 3,500자 이상의 정성 글) */}
      <section className="max-w-7xl mx-auto w-full px-6 pb-12 mt-6" id="education-guide-center">
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 md:p-8 space-y-8">
          
          <div className="border-b border-slate-800 pb-6">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2 tracking-tight">
              <span className="bg-blue-600 text-white p-1.5 rounded-lg text-xs font-mono">CLASS</span>
              주식 리플레이 시뮬레이터 탄생 배경 및 마스터 가이드
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              본 가이드는 주식 투자 초보자(주린이)부터 전업 투자자를 꿈꾸는 분들을 위해 제작되었습니다. 
              차트의 핵심 작동 메커니즘인 OHLC, 거래량의 정수, 그리고 실전 단타 매매 타점을 잡기 위한 지지와 저항 이론을 상세하게 수록하였습니다.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 세션 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-blue-500 rounded-full" />
                <h3 className="text-md font-bold text-slate-100">1. 시뮬레이터 개발 배경 및 200% 활용 가이드</h3>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                <p>
                  실전 주식 매매는 소중한 자산이 직접 거래되는 극도의 심리전이자 냉혹한 전장입니다. 대다수의 입문 투자자들은 주식 시장의 구조적 메커니즘을 제대로 체득하지 못한 채, 상승하는 종목에 흥분하여 매수하고 하락하는 종목에 공포를 느껴 매도하는 이른바 <strong>'뇌동매수'</strong>와 <strong>'공포 손절'</strong>을 무한 반복하게 됩니다. 이는 결국 치명적인 원금 손실로 이어지는 지름길이 됩니다.
                </p>
                <p>
                  가상투자나 모의투자가 대안으로 거론되기도 하지만, 장중에 실시간으로 흘러가는 모의투자는 호흡이 너무 길어서 초보자가 의미 있는 양의 매매 데이터를 빠르게 누적하기 어렵습니다. 하루에 단 한 두 번의 판단 흐름밖에 겪어보지 못하기 때문입니다. 이러한 문제의식을 바탕으로 우리는 <strong>'투자 경험치의 압축 복기'</strong>와 <strong>'시간 효율성 극대화'</strong>라는 두 가지 절대적 기치 아래 본 <span className="text-blue-400 font-semibold">K-Stock Replay Simulator</span>를 개발 및 출시하게 되었습니다.
                </p>
                <p>
                  본 리플레이 엔진은 과거 수개월간 축적된 실제 역사적 일봉 거래 데이터를 단 몇 분 만에 완벽하게 시뮬레이션할 수 있도록 설계되었습니다. 사용자는 다음 캔들 버튼을 클릭할 때마다 하루치의 피튀기는 세력 공방이 끝난 마감 데이터를 단 0.1초 만에 확인하며 빠르게 결정을 내릴 수 있습니다. 본 시뮬레이터를 200% 활용하기 위해서는 매매 일지를 정독하듯, 자신이 어떤 이동평균선 배열에서 매수를 들어갔는지, 손절선(예: -3% 또는 20일선 이탈)을 정확히 지켰는지 스스로 되물어보며 <strong>'나만의 매매 일관성(Consistency)'</strong>을 구축하는 것에 집중해야 합니다.
                </p>
              </div>

              {/* 주식 차트 복기 시뮬레이터 사용설명서 */}
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 mt-6 space-y-3 shadow-lg shadow-black/20">
                <h4 className="text-xs font-black text-blue-400 flex items-center gap-1.5 uppercase tracking-wide">
                  📖 주식 차트 복기 시뮬레이터 사용설명서 (How To Play)
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  본 시뮬레이터의 매커니즘은 매우 쉽고 단순하게 구성되어 있어 처음 접하시는 분들도 직관적으로 실전 차트 트레이딩을 연습해 보실 수 있습니다.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-400 leading-relaxed font-mono mt-2">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700/60 transition-colors">
                    <span className="text-slate-200 font-bold block mb-1">① 종목 선택 및 데이터 초기화</span>
                    화면 좌측 상단(모바일은 상단) 종목 검색창을 통해 삼성전자, 카카오, 네이버, 에코프로 등 원하는 주도 종목을 골라 즉시 120일간의 복기 캔들 데이터셋을 가동시킵니다.
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700/60 transition-colors">
                    <span className="text-slate-200 font-bold block mb-1">② 캔들 순차 전개 (Spacebar)</span>
                    [다음 일봉(+1일)] 버튼을 누르거나 차트 창에 포커스를 둔 뒤 키보드의 <strong className="text-blue-400 font-semibold">[스페이스바(Spacebar)]</strong> 키를 누르면 다음 날 일봉 캔들이 1개씩 순차적으로 차트에 추가로 형성됩니다.
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700/60 transition-colors">
                    <span className="text-slate-200 font-bold block mb-1">③ 가상 주문 집행 (매수/매도)</span>
                    하단 컨트롤러의 [시장가 매수 (100%)] 버튼을 클릭하여 보유 예수금 전체로 현재 주가에 즉시 풀 매수 진입하며, 평균 단가는 초록색 점선으로 표시됩니다. 청산 시에는 [시장가 매도 (100%)]를 사용하여 포지션을 전부 실현시킵니다.
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800/50 hover:border-slate-700/60 transition-colors">
                    <span className="text-slate-200 font-bold block mb-1">④ 최종 결과 보고서 & 실시간 랭킹</span>
                    120영업일이 전부 경과하여 훈련이 끝나면 실시간 트레이더 리더보드 랭킹 등록과 함께, 이번 연습 세션 동안 매수한 거래의 <strong>평균 승률 및 평균 손익비(Profit-Loss Ratio)</strong>를 정량적으로 도출해 줍니다.
                  </div>
                </div>
              </div>
            </div>

            {/* 세션 2 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                <h3 className="text-md font-bold text-slate-100">2. 시가, 고가, 저가, 종가(OHLC)를 지배하는 캔들 독해 비책</h3>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                <p>
                  기술적 분석의 가장 위대한 첫 단추는 캔들스틱(봉차트)의 구조를 정교하게 독해하는 능력입니다. 하나의 캔들은 당일 시장의 시작부터 마감까지 발생한 모든 투자자의 탐욕, 공포, 주도 세력의 의도와 대중 심리의 결과물을 압축적으로 보여주는 힘의 지도입니다. 캔들은 <strong>시가(Open), 고가(High), 저가(Low), 종가(Close)</strong>의 네 가지 핵심 수치로 완성됩니다.
                </p>
                <p>
                  <strong>시가(Open):</strong> 오전 9시 정각, 전날 장 마감 이후 야간에 누적된 호재와 악재, 글로벌 증시의 움직임 등이 일시에 반영되어 탄생하는 첫 거래가입니다. 시가가 전일 마감 가격(종가)보다 3% 이상 높게 시작하는 것을 '갭 상승(Gap Up)'이라고 하며, 이는 밤사이 매수 대기 에너지가 매우 강했음을 시사합니다. 반대로 시가가 갭 하락으로 시작된다면 이는 강력한 공포 매물이 시장을 지배한 것입니다.
                </p>
                <p>
                  <strong>고가(High)와 저가(Low):</strong> 당일 장중에 도달한 극한의 정점들을 의미합니다. 고가는 탐욕의 최대치이며, 저가는 공포의 바닥선입니다. 캔들의 몸통 위로 길게 솟아오른 <strong>'윗꼬리(Upper Shadow)'</strong>는 고점 도달 후 대량의 차익 실현 물량과 매도 저항에 부딪혀 밀려 내려왔음을 뜻하는 부정적 신호입니다. 반면 아래로 깊게 내려앉은 <strong>'아래꼬리(Lower Shadow)'</strong>는 바닥에서 세력 또는 기관의 견고한 방어 매수세가 가동되었음을 알리는 매우 긍정적인 지지 신호입니다.
                </p>
                <p>
                  <strong>종가(Close):</strong> 오후 3시 30분, 하루 동안의 치열했던 공방이 최종 타협을 이뤄 확정된 마지막 가격입니다. 주식 바닥의 오랜 격언 중 하나는 <strong>"시가는 아마추어와 세력의 의도가 만들고, 종가는 진정한 프로와 시장 전체의 합의가 만든다"</strong>는 것입니다. 종가가 시가보다 높게 끝나면 붉은색의 양봉이 되고, 낮게 끝나면 푸른색의 음봉이 됩니다. 특히 장 막판까지 매수세를 길게 유지하며 윗꼬리 없는 장대양봉으로 종가를 형성하는 경우, 다음 거래일에도 강한 추가 상승 추세를 예고하는 중요한 전조가 됩니다.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-slate-800">
            {/* 세션 3 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-yellow-500 rounded-full" />
                <h3 className="text-md font-bold text-slate-100">3. 거래량(Volume): 영혼을 흔드는 시장의 진실 지표</h3>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                <p>
                  초보 투자자들은 차트의 캔들 형상과 보조지표(RSI, MACD 등)에만 목을 매는 경향이 있습니다. 그러나 이 지표들은 후행성 성격이 강하며, 주도 세력의 페이크(속임수) 패턴에 쉽게 무력화되곤 합니다. 이때 세력이 절대로 조작하거나 숨길 수 없는 유일한 기록이 바로 <strong>'거래량(Volume)'</strong>입니다. 거래량은 주식이 체결된 총량으로, 돈의 실시간 유입 크기를 직접적으로 대변합니다.
                </p>
                <p>
                  거래량이 평소 평균치의 500%를 초과하며 이전 매물대를 관통하는 장대양봉은, 강력한 주도 세력이 마침내 개입하여 시세를 상방으로 발산하기 시작했다는 확실한 <strong>추세 전환 신호</strong>입니다. 반대로 전고점 돌파를 시도하고 있음에도 거래량이 이전 거래량에 미치지 못한다면, 그것은 '가짜 돌파(Fake Breakout)'일 가능성이 다분합니다. 이 경우 돌파 직후 순식간에 매수세가 바닥나며 제자리로 고꾸라지기 십상입니다.
                </p>
                <p>
                  또한, 급격하게 상승한 주가가 단기 과열로 인해 횡보하거나 조정을 받는 국면에서도 거래량의 분석은 중요합니다. 조정을 받는 하락 음봉에서 거래량이 눈에 띄게 격감(예: 거래대금이 이전 상승 거래일의 1/5 수준으로 축소)한다면, 상승을 견인했던 중심 주체(스마트 머니)가 아직 주식을 팔지 않고 매집한 채 쥐고 있음을 반증합니다. 이러한 거래량 격감 시점이 바로 5일선이나 10일 이동평균선과 맞닿는 <strong>황금 눌림목 매수 타점</strong>이 되는 것입니다.
                </p>
              </div>
            </div>

            {/* 세션 4 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-6 bg-green-500 rounded-full" />
                <h3 className="text-md font-bold text-slate-100">4. 지지와 저항(S&R)을 응용한 실전 단타 매매 절대 타점</h3>
              </div>
              <div className="text-xs text-slate-400 leading-relaxed space-y-3">
                <p>
                  데이트레이딩(단타 매매)에서 수익을 꾸준히 내기 위한 열쇠는 복잡한 수식이 아니라 단순한 <strong>'지지와 저항(Support and Resistance)'</strong>에 기반한 일관된 타점입니다. 손실은 가혹할 정도로 짧게 잡고, 이익은 넉넉하게 극대화하는 손익비 우위를 점해야 장기적으로 우상향 계좌를 만들 수 있습니다.
                </p>
                <p>
                  <strong>지지선(Support Zone):</strong> 하락하던 주가가 특정 가격대만 되면 하락세를 멈추고 하방 압력을 밀어내는 매수 지탱 구간입니다. 지지선은 대개 전저점, 심리적으로 중요하게 여겨지는 라운드 피겨(예: 50,000원, 100,000원처럼 자릿수가 바뀔 때의 정수 가격), 혹은 중기 이동평균선(20일선, 60일선)으로 형성됩니다. 지지선 바로 위에 매수 주문을 분할로 걸어두고, 지지선 붕괴 시 즉시 손절하는 전략은 안전하면서도 강력한 타점 기법입니다.
                </p>
                <p>
                  <strong>저항선(Resistance Zone):</strong> 주가가 우상향하며 탄력을 받다가도 특정 가격대 부근만 이르면 차익 실현 및 매물 매도 폭탄이 집중되어 위로 돌파하지 못하는 가격대입니다. 전고점과 장기 매물대가 대표적인 저항선입니다. 저항선을 돌파하기 위해서는 반드시 기존의 모든 악성 대기 매물을 전부 쓸어담는 엄청난 양의 거래량이 수반되어야 합니다. 흥미로운 사실은 저항선을 폭발적인 힘으로 마침내 넘어서게 되면, 기존의 저항선이 이제는 강력한 하방 방어벽인 <strong>'지지선'으로 성격이 반전(Role Reversal)</strong>된다는 점입니다. 이 돌파 직후 첫 되돌림 지지 현상(Re-test)을 확인하며 진입하는 것이 전설적인 돌파 눌림목 전략입니다.
                </p>
                <p>
                  <strong>핵심 자금 관리 철칙:</strong> 주식 매매에서 100% 성공을 담보하는 비책은 존재하지 않습니다. 프로 투자자들은 매수에 들어가기 전 "내가 틀렸을 때 어디서 손절할 것인가?"를 먼저 결정합니다. 손절 기준선을 타이트하게(보통 -1.5% ~ -3% 이내) 설정하고, 매매 대상 종목에 한 번에 모든 시드를 진입하기보다 3단계에 걸친 분할 진입 전략을 철저히 집행하십시오. 무모한 뇌동 매수를 제어하고, 본 리플레이 시뮬레이터에서 수없이 반복 연습한 '나의 필살 패턴'이 출현할 때까지 사냥꾼처럼 기다리는 인내심이야말로 투자자로 살아남는 마지막 승부수입니다.
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 3. 하단 푸터 (건의함 및 약관/개인정보 페이지) */}
      <footer className="h-auto md:h-20 flex flex-col md:flex-row items-center px-6 py-6 md:py-0 bg-slate-950 border-t border-slate-800 gap-4" id="footer-panel">
        <div className="flex-1 flex flex-col md:flex-row justify-between items-center w-full gap-4">
          <div className="flex flex-col items-center md:items-start gap-1">
            <p className="text-[10px] text-slate-500 leading-tight text-center md:text-left max-w-xl">
              본 사이트는 과거 데이터를 활용한 교육용 시뮬레이션입니다. 실제 투자를 유도하지 않으며 매매 결과는 실제 수익을 보장하지 않습니다.
            </p>
            <div className="flex items-center gap-2.5 text-[10px] text-slate-400 mt-1">
              <button 
                onClick={() => setActiveLegalModal('terms')} 
                className="hover:text-blue-400 underline transition-colors cursor-pointer"
              >
                이용약관 및 면책조항
              </button>
              <span className="text-slate-800">|</span>
              <button 
                onClick={() => setActiveLegalModal('privacy')} 
                className="hover:text-blue-400 underline transition-colors cursor-pointer"
              >
                개인정보처리방침
              </button>
              <span className="text-slate-800">|</span>
              <span className="text-slate-600 font-mono">© K-Stock Replay. All rights reserved.</span>
            </div>
          </div>
          
          <a 
            href="https://forms.gle/5P3dUTEda5kA3me8A"
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-500 hover:to-orange-400 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg hover:shadow-red-500/20 transition-all active:scale-[0.98] border border-red-500/30"
          >
            <MessageSquare className="w-4 h-4 text-white" />
            <span>고객 건의함 (의견 보내기) 📩</span>
          </a>
        </div>
      </footer>

      {/* 결과 분석 완료 모달 */}
      {showResultModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="result-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden">
            
            {/* Top glowing bar */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500" />
            
            <div className="flex justify-center mb-4">
              <div className="bg-yellow-500/10 p-3 rounded-full border border-yellow-500/20 text-yellow-500">
                <Award className="w-10 h-10" />
              </div>
            </div>

            <h3 className="text-lg font-black text-white text-center">시뮬레이션 종료!</h3>
            <p className="text-xs text-slate-400 text-center mt-1">지정한 일봉 리플레이 데이터가 모두 노출되었습니다.</p>

            {/* 성적 지표 카드 */}
            <div className="bg-slate-950/60 rounded-xl p-4 my-5 border border-slate-800 space-y-3 font-mono">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">종목명:</span>
                <span className="text-white font-bold">{symbol}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">초기 투자 원금:</span>
                <span className="text-slate-300 font-bold">{INITIAL_BALANCE.toLocaleString()} 원</span>
              </div>
              <div className="flex justify-between items-center text-xs border-b border-slate-800/60 pb-2">
                <span className="text-slate-400">최종 청산 자산:</span>
                <span className="text-white font-bold">{Math.round(totalAssets).toLocaleString()} 원</span>
              </div>

              {/* 실전 매매 통계 (승률, 수익률, 손익비) */}
              <div className="border-t border-b border-slate-800/80 py-3.5 space-y-3 font-sans">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 text-center">📊 실전 트레이딩 성과 지표</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-slate-900/80 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
                    <span className="text-slate-500 text-[10px] font-medium">총 실현 거래</span>
                    <span className="text-slate-200 font-bold text-sm mt-1">{completedCount} 건</span>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
                    <span className="text-slate-500 text-[10px] font-medium">평균 승률</span>
                    <span className="text-emerald-400 font-black text-sm mt-1">{winRate.toFixed(1)}%</span>
                  </div>
                  
                  <div className="bg-slate-900/80 border border-slate-800/60 rounded-xl p-2.5 flex flex-col justify-between">
                    <span className="text-slate-500 text-[10px] font-medium">평균 수익/손실률</span>
                    <div className="text-slate-200 font-bold text-[11px] mt-1 flex items-center gap-1">
                      <span className="text-red-400">+{avgWinPct.toFixed(1)}%</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-blue-400">-{avgLossPct.toFixed(1)}%</span>
                    </div>
                  </div>
                  
                  <div className="bg-amber-500/5 border border-amber-500/25 rounded-xl p-2.5 flex flex-col justify-between shadow-sm">
                    <span className="text-amber-500/90 text-[10px] font-bold">평균 손익비 (P/L)</span>
                    <span className="text-amber-400 font-black text-sm mt-1">{profitLossRatioStr}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-slate-400 text-xs">최종 누적 수익률:</span>
                <span className={`text-md font-black ${sessionReturnRate >= 0 ? 'text-red-500' : 'text-blue-500'}`}>
                  {sessionReturnRate >= 0 ? '+' : ''}{sessionReturnRate.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* 코멘트 문구 */}
            <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800/50 leading-relaxed mb-6">
              {sessionReturnRate > 15 ? (
                <p className="text-red-400 font-semibold">🏆 당신은 훌륭한 추세 추종 능력을 가지고 있습니다! 적절한 돌파 매수와 홀딩 능력으로 상당한 초과 수익을 거두셨네요.</p>
              ) : sessionReturnRate > 0 ? (
                <p className="text-emerald-400 font-semibold">📈 훌륭합니다! 시장 평균 수익률을 상회하는 안정적인 현금 보존 및 매매 분할 원칙을 보여주었습니다.</p>
              ) : (
                <p className="text-blue-400 font-semibold">💡 아쉽지만 손실이 발생했습니다. 5일선 및 20일선 이동평균선 역배열 상태에서 무리하게 홀딩하거나, 바닥에서 뇌동매수하지 않았는지 일지를 복기해 보세요.</p>
              )}
            </div>

            {/* 모달 제어 버튼 */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-black py-2.5 rounded-xl transition-all active:scale-95 text-xs text-center"
              >
                다시 훈련하기
              </button>
              <button
                onClick={() => setShowResultModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 px-4 rounded-xl text-xs transition-colors"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 베타 서비스 의견 제안 및 소통 안내 모달 */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="premium-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase">BETA</span>
                <h3 className="text-md font-bold text-white flex items-center gap-1">
                  💬 전종목 오픈 및 의견 수렴 안내
                </h3>
              </div>
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/5 border border-blue-500/20 p-4 rounded-xl text-center space-y-1">
                <p className="font-semibold text-blue-400">
                  🌱 함께 만들어가는 열린 시뮬레이터
                </p>
                <p className="text-[11px] text-slate-400">
                  현재는 더 많은 분들이 편하게 차트 매매를 연습하고 의견을 공유하실 수 있도록<br />
                  <span className="text-white font-bold">10대 인기 대표 주도주 세션을 상시 개방</span>하여 운영 중입니다.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <h4 className="text-slate-200 font-bold text-xs flex items-center gap-1.5">
                  💡 여러분의 소중한 의견을 들려주세요!
                </h4>
                
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  "이 종목도 연습해보고 싶어요", "이런 차트 보조지표가 추가되었으면 좋겠어요" 등 연습하시면서 느끼신 생각들을 편하게 알려주세요. 소통을 통해 가장 요청이 많은 종목과 유용한 기능들을 우선순위로 적극 업데이트하겠습니다!
                </p>

                <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400">📧 피드백/제안 문의처</span>
                    <span className="font-mono text-blue-400 font-semibold select-all">bjgb1004@gmail.com</span>
                  </div>
                  <div className="h-[1px] bg-slate-800/60 w-full" />
                  <p className="text-[10px] text-slate-500 leading-snug">
                    보내주신 종목 의견이나 개선점은 꼼꼼히 확인하여 서비스의 발전 방향과 다음 업데이트에 온전히 반영하겠습니다.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-800/80 flex gap-2">
              <button 
                onClick={() => setShowPremiumModal(false)}
                className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs transition-colors cursor-pointer text-center"
              >
                10대 인기종목으로 차트 복기 계속하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이용약관 및 면책조항 모달 */}
      {activeLegalModal === 'terms' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="terms-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-500" />
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-500" />
                이용약관 및 면책조항 (Terms of Service)
              </h3>
              <button 
                onClick={() => setActiveLegalModal(null)}
                className="text-slate-400 hover:text-slate-200 font-bold px-2.5 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4 text-xs text-slate-400 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div>
                <h4 className="text-white font-bold text-sm mb-1">제1조 (목적)</h4>
                <p>본 약관은 "K-주식 리플레이 시뮬레이터"(이하 "서비스")가 제공하는 금융 차트 시뮬레이션 및 데이터 활용 조건, 사용자의 권리 및 의무, 그리고 법적 면책 요건을 명확히 규정하는 것을 목적으로 합니다.</p>
              </div>

              <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl space-y-2">
                <h4 className="text-blue-400 font-black text-sm mb-1">제2조 (금융 거래 면책 조항 - Disclaimer)</h4>
                <p className="font-semibold text-slate-200">
                  1. 본 서비스에서 노출 및 가공되는 모든 주가 차트 정보, 과거 매매 캔들스틱, 이동평균선(MA), 보조 지표 및 거래량 정보 등은 야후 파이낸스(Yahoo Finance) 및 기타 금융 오픈 소스 등에서 제공받은 과거 시계열 데이터를 교육 및 모의 훈련용으로 임시 재조합한 가상의 데이터입니다.
                </p>
                <p className="font-semibold text-slate-200">
                  2. 본 서비스는 실제 금융 투자 회사가 아니며, 어떠한 형태의 유가 증권 거래를 중개, 알선, 대행하지 않습니다. 본 시뮬레이션의 최종 수익률, 가상 자산 평가액 등 모든 결과는 오직 과거 데이터에 기반한 연습 성과일 뿐이며 실제 주식 시장에서의 거래 수익을 보증하거나 담보하지 않습니다.
                </p>
                <p className="font-semibold text-slate-200">
                  3. 본 사이트가 제공하는 교육용 가이드, 단타 매매 팁 및 차트 해설은 정보 제공을 위한 목적에 국한되며, 특정 종목에 대한 투자 권유나 추천, 또는 개별적인 금융 자문(Investment Advice)이 아닙니다. 본 서비스의 정보 및 가상 시뮬레이션 훈련 결과를 근거로 이루어진 사용자의 실제 유가증권 거래 성과 및 손실에 대해 서비스 운영자와 플랫폼은 민형사상의 어떠한 직간접적인 책임도 부담하지 않습니다. 모든 실제 투자의 궁극적인 판단과 결과 책임은 전적으로 사용자 본인에게 귀속됩니다.
                </p>
                <p className="font-semibold text-slate-200">
                  4. 오픈 API 제공자의 네트워크 장애, 데이터 제공 지연, 기기 캐시 청소, 로컬 브라우저의 오작동 등으로 인해 발생할 수 있는 데이터 로딩 오류나 진행 데이터 유실에 대해서 서비스 제공자는 복구 및 보상 의무를 포함한 어떠한 책임도 지지 않습니다.
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-1">제3조 (서비스 이용 및 소유권)</h4>
                <p>본 사이트의 UI 설계, 가상 모의투자 엔진 알고리즘 및 훈련 대시보드 구조에 대한 모든 원천 소스 및 지식재산권은 본 서비스 운영자에 귀속되어 있습니다. 사용자는 학습 및 복기 목적으로만 본 서비스를 이용해야 하며, 비정상적인 방법으로 자동화 요청(스크랩, 크롤링)을 지속 발송하여 웹 서비스 인프라에 악의적인 부하를 주는 행위는 금지됩니다.</p>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-1">제4조 (약관의 개정)</h4>
                <p>운영자는 서비스 기능 개편 및 법규 준수 등을 이유로 필요 시 본 약관을 사전 공지 없이 유동적으로 수정할 수 있으며, 수정된 약관은 본 페이지에 게재된 시점부터 효력을 즉시 가집니다.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setActiveLegalModal(null)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
              >
                위 면책사항을 이해했으며 동의합니다
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개인정보처리방침 모달 */}
      {activeLegalModal === 'privacy' && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in" id="privacy-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-green-500" />
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-green-500" />
                개인정보처리방침 (Privacy Policy)
              </h3>
              <button 
                onClick={() => setActiveLegalModal(null)}
                className="text-slate-400 hover:text-slate-200 font-bold px-2.5 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-4 text-xs text-slate-400 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              <div>
                <h4 className="text-white font-bold text-sm mb-1">1. 수집하는 개인정보 항목 및 목적</h4>
                <p>본 서비스는 별도의 회원 가입 절차나 로그인 기능이 없는 완전 익명 기반의 가상 훈련 도구입니다. 따라서 사용자의 성명, 이메일 주소, 전화번호, 주민등록번호, 계좌 정보 등 <strong>어떠한 식별 가능한 형태의 개인정보도 직접적으로 서버에 저장하거나 수집하지 않습니다.</strong></p>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-1">2. 브라우저 로컬 저장소(localStorage) 활용</h4>
                <p>사용자에게 연속성 있는 모의 훈련 환경을 제공하기 위해 브라우저의 기본 기능인 로컬 저장소(localStorage)에 아래의 설정 데이터를 임시 보관합니다:</p>
                <ul className="list-disc pl-5 mt-1 space-y-1">
                  <li>효과음 음소거 여부 설정 (`soundEnabled` 상태값)</li>
                  <li>시뮬레이션 진행 중인 훈련 종목명 및 누적 자산 현황</li>
                  <li>기타 단순 UI 컴포넌트 세션 상태</li>
                </ul>
                <p className="mt-1">해당 로컬 데이터는 전적으로 사용자의 기기 브라우저 환경에만 격리되어 저장되며, 당사의 원격 웹 서버로 전송되거나 외부에 누출되지 않습니다. 사용자는 브라우저의 인터넷 기록 삭제 기능을 통해 언제든지 이 정보를 파기할 수 있습니다.</p>
              </div>

              <div className="bg-green-950/20 border border-green-900/30 p-4 rounded-xl">
                <h4 className="text-green-400 font-black text-sm mb-1">3. 제3자 맞춤 광고 플랫폼(Google AdSense) 연동 고지</h4>
                <p className="text-slate-200">
                  본 서비스는 구글 애드센스(Google AdSense) 광고 서비스를 탑재하여 운영비를 보충하고 있습니다. 구글은 사용자가 본 웹사이트 및 인터넷상의 다른 웹사이트를 방문한 기록을 바탕으로 최적화된 맞춤형 광고를 노출하기 위해 '쿠키(DART 쿠키 포함)' 정보를 분석할 수 있습니다. 사용자는 구글의 개인정보 보호 및 약관 페이지를 방문하거나 브라우저 쿠키 설정을 차단하여 맞춤형 광고 수집을 상시 거부할 수 있습니다.
                </p>
              </div>

              <div>
                <h4 className="text-white font-bold text-sm mb-1">4. 개인정보 관련 문의 및 책임자</h4>
                <p>서비스의 안정적인 작동 방식 및 개인정보 유출 방지 조치에 관한 건의, 혹은 기타 문의 사항은 하단 푸터 영역에 항시 배치되어 있는 구글 폼 링크인 '고객 건의함'을 통해 의견을 전송해 주시면 담당자가 즉시 확인하고 조치하도록 하겠습니다.</p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button 
                onClick={() => setActiveLegalModal(null)}
                className="bg-green-600 hover:bg-green-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
              >
                동의하고 닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 개발 배경 및 활용 가이드 모달 팝업 */}
      {showGuideModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in" id="guide-modal">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-600" />
            
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="bg-blue-600 text-white px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider">GUIDE</span>
                <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                  📈 주식 리플레이 시뮬레이터 실전 활용 가이드
                </h3>
              </div>
              <button 
                onClick={() => setShowGuideModal(false)}
                className="text-slate-400 hover:text-slate-200 font-bold px-2.5 py-1 text-sm bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 mt-4 space-y-6 text-xs text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
              
              <div className="bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-900/30 p-5 rounded-2xl">
                <p className="font-bold text-blue-400 text-center text-xs md:text-sm leading-relaxed">
                  "투자는 단순한 예측의 영역이 아닌, 통제와 대응의 과학입니다."<br />
                  <span className="text-slate-300 text-xs font-normal mt-1 block">본 복기 시뮬레이터는 반복 훈련을 통해 실전에서 흔들리지 않는 최상의 매매 감각을 이끌어 냅니다.</span>
                </p>
              </div>

              {/* 1. 기획 의도 */}
              <div className="space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                  <h4 className="text-white font-bold text-xs md:text-sm">1. 시뮬레이터 기획 의도: 이성적 프로세스의 정밀한 훈련</h4>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  개인 투자자가 금융 시장에서 실패하는 가장 큰 요인은 <strong>정보의 격차</strong>가 아니라, 상승장에서의 <strong>탐욕적 추격 매수(뇌동매매)</strong>와 하락장에서의 <strong>감정적 패닉 셀링(공포 투매)</strong>에 따른 자금 관리 실패입니다.
                </p>
                <p className="text-slate-300 leading-relaxed text-xs">
                  이러한 고질적인 한계를 기술과 과학적 훈련을 통해 극복하고자 본 <strong>K-주식 리플레이 시뮬레이터</strong>를 기획하였습니다. 역사적으로 검증된 실제 시장 데이터(Historical Data)를 바탕으로, 불필요한 감정 개입을 완벽히 필터링하고 오직 <strong>정량적 통계, 지지와 저항, 거래량 패턴</strong>에 근거하여 냉정하게 대응할 수 있는 전문적인 트레이딩 트레이닝 환경을 구성하는 것에 초점을 맞추었습니다.
                </p>
              </div>

              {/* 2. 차트 복기 훈련의 압도적 중요성 */}
              <div className="space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                  <div className="w-1.5 h-4 bg-red-500 rounded-full" />
                  <h4 className="text-white font-bold text-xs md:text-sm">2. 차트 복기(Replay)의 절대적 가치: 압축 성장과 일관성</h4>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  실제 라이브 시장에서 매매를 통해 경험치를 쌓는 것은 최소 수개월에서 수년의 절대적 시간이 소요됩니다. 하루에 단 하나의 일봉 캔들만 생성되기 때문입니다. 
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/60 my-1">
                  <div>
                    <h5 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1">
                      <span className="w-1 h-3 bg-red-500 rounded-full" />
                      압도적인 경험치 시간 압축
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      본 시뮬레이터는 피튀기는 장중 120거래일 동안의 치열했던 주도 세력과 시장 수급의 마감 데이터를 단 몇 분 만에 완벽하게 순차 전개합니다. 수개월 동안 고생하며 겪어야 할 파동의 사이클을 단 5분으로 압축하여 훈련할 수 있어 성장 효율성이 극대화됩니다.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white mb-1.5 text-xs flex items-center gap-1">
                      <span className="w-1 h-3 bg-blue-500 rounded-full" />
                      차트 유형의 시각 인지 지각(지각 패턴)
                    </h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      주가 흐름에서 반복적으로 포착되는 5일 이평선 골든크로스, 거래량 급감 시점의 거래량 눌림목, 강력한 전고점 돌파와 뒤이은 되돌림 지지 현상(Role Reversal) 등 고확률 매매 타점을 뇌와 안구에 그대로 입력시켜 실전 장세에서 망설임 없이 기계적으로 대응하도록 돕습니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. 연습하면 누구나 할 수 있다는 자신감 */}
              <div className="space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                  <div className="w-1.5 h-4 bg-yellow-500 rounded-full" />
                  <h4 className="text-white font-bold text-xs md:text-sm">3. 연습하면 할 수 있습니다: 트레이딩은 배울 수 있는 과학적 수련입니다</h4>
                </div>
                <p className="text-slate-300 leading-relaxed text-xs">
                  세계적으로 명성이 자자한 전설의 트레이더 모임 '터틀 트레이더(Turtle Traders)' 실험은 <strong>"트레이딩은 타고난 재능이 아니라 철저하게 교육되고 연습을 통해 훈련될 수 있는 영역"</strong>임을 영구히 증명하였습니다. 
                </p>
                <p className="text-slate-300 leading-relaxed text-xs">
                  바둑 기사들이 평생 끊임없이 수십만 판의 기보를 세심하게 복기(復棋)하며 최선의 수를 완성해 가듯, 주식 트레이더 또한 과거의 역사를 철저하게 역추적하고 복기하는 반복 숙련을 거치면 누구나 안정적인 우상향 성과를 내는 프로의 길로 진입할 수 있습니다. 
                </p>
                <p className="text-slate-200 font-medium leading-relaxed text-xs bg-slate-950/50 p-3.5 rounded-lg border border-slate-800/80 text-center">
                  ✨ 처음에는 손실이 발생하거나 매도 타점을 놓칠지라도 낙담하지 마십시오. 5번, 20번, 100번 시뮬레이터로 타점을 연마하고 자신만의 리스크 관리 원칙(자금 관리 철칙)을 수립하면 차트판은 투기장이 아닌 고도의 과학적이고 안전한 확률 게임으로 변모할 것입니다. 당신은 연습을 통해 반드시 스스로 성공적인 의사결정을 내리는 자립형 주도적 트레이더가 될 수 있습니다!
                </p>
              </div>

              {/* 4. 법적 책임 면책고지 */}
              <div className="space-y-3 bg-slate-950/20 p-4 rounded-xl border border-slate-800/40">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1.5">
                  <div className="w-1.5 h-4 bg-amber-500 rounded-full" />
                  <h4 className="text-white font-bold text-xs md:text-sm">4. 교육 목적 및 법적 책임 면책안내 (Disclaimer)</h4>
                </div>
                <div className="text-xs text-slate-300 leading-relaxed space-y-2.5 max-h-[140px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  <p>
                    본 서비스는 과거 실제 발생하였던 종가 수치 데이터셋에 기반하여 시뮬레이션을 제공하는 금융 학습 교육용 시뮬레이터입니다. 본 서비스가 수록하고 있는 기술적 분석 요령, 설명문, 팁 등 모든 콘텐츠는 일반 금융 지식 증진을 위한 교육 자료에 불과하며, 실제 특정 금융 투자 상품의 매수, 매도, 리스크 자문, 혹은 추천 행위를 제공하지 않습니다.
                  </p>
                  <p>
                    실제 금융 시장에서의 모든 투자는 거시경제 환경, 유동성 변화, 정치적 변수 등 복합적 요소로 가동되므로 본 시뮬레이터에서의 가상 투자 수익률 성과가 실제 시장에서의 성과를 보증하거나 예측하지 아니하며, 실제 매매에 따른 모든 수익과 손실 책임은 전적으로 투자자 본인(사용자)에게 전속되고 운영자 및 관계자는 일체의 법적 책임을 지지 않음을 알려드립니다.
                  </p>
                </div>
              </div>

            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <button 
                onClick={() => {
                  try {
                    const oneDay = 24 * 60 * 60 * 1000;
                    localStorage.setItem('hideGuideUntil', (Date.now() + oneDay).toString());
                  } catch (e) {}
                  setShowGuideModal(false);
                }}
                className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
              >
                오늘 하루 이 창을 다시 열지 않기 (24시간 동안 비활성화)
              </button>
              
              <button 
                onClick={() => setShowGuideModal(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-2.5 rounded-xl text-xs transition-all w-full sm:w-auto shadow-md shadow-blue-900/20 cursor-pointer"
              >
                가이드 닫기 및 훈련 시작
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 스마트폰 세로 화면용 엄지손가락 친화적 Sticky Bottom 트레이딩 컨트롤러 */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800/90 px-4 py-3.5 lg:hidden flex flex-col gap-2.5 shadow-[0_-8px_30px_rgb(0,0,0,0.5)]" id="mobile-sticky-controller">
        {/* 모바일 미니 정보 HUD */}
        <div className="flex justify-between items-center text-[11px] text-slate-300 font-mono">
          <div className="flex items-center gap-3">
            <div>
              <span className="text-[9px] text-slate-500 block leading-none uppercase">예수금</span>
              <span className="font-bold text-white">{Math.round(balance).toLocaleString()}원</span>
            </div>
            <div className="border-l border-slate-800 h-6" />
            <div>
              <span className="text-[9px] text-slate-500 block leading-none uppercase">보유수량</span>
              <span className="font-bold text-white">{holdings}주</span>
            </div>
          </div>
          {holdings > 0 && (
            <div className="text-right">
              <span className="text-[9px] text-slate-500 block leading-none uppercase">보유수익률</span>
              <span className={`font-bold ${holdingReturnRate >= 0 ? 'text-red-400' : 'text-blue-400'}`}>
                {holdingReturnRate >= 0 ? '▲' : '▼'} {Math.abs(holdingReturnRate).toFixed(2)}%
              </span>
            </div>
          )}
        </div>
        
        {/* 모바일 큼직한 매수/매도/다음 캔들 3대 핵심 버튼 그리드 */}
        <div className="grid grid-cols-3 gap-2.5">
          <button 
            onClick={handleMarketBuy}
            disabled={balance < currentPrice}
            className="bg-red-600 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 disabled:transform-none disabled:opacity-50 py-3.5 px-1 rounded-xl text-xs font-bold text-white transition-all flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-red-900/20"
          >
            <span className="text-[9px] opacity-70 font-normal">시장가</span>
            <span className="font-black tracking-tight">매수 (100%)</span>
          </button>
          
          <button 
            onClick={handleMarketSell}
            disabled={holdings <= 0}
            className="bg-blue-600 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 disabled:transform-none disabled:opacity-50 py-3.5 px-1 rounded-xl text-xs font-bold text-white transition-all flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-blue-900/20"
          >
            <span className="text-[9px] opacity-70 font-normal">시장가</span>
            <span className="font-black tracking-tight">매도 (100%)</span>
          </button>
          
          <button 
            onClick={handleNextCandle}
            className="bg-yellow-500 active:scale-[0.97] text-slate-950 py-3.5 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-0.5 shadow-lg shadow-yellow-900/10"
          >
            <span className="text-[9px] text-slate-800 opacity-80 font-normal">스페이스</span>
            <span className="flex items-center gap-0.5 font-black">다음 캔들 <ArrowRight className="w-3 h-3 stroke-[2.5]" /></span>
          </button>
        </div>
      </div>

    </div>
  );
}
