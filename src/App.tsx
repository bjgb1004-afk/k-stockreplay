/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef, ChangeEvent } from 'react';
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

    const newTrade: Trade = {
      id: Math.random().toString(36).substring(2, 9),
      type: 'SELL',
      date: currentCandle.date,
      price: currentPrice,
      quantity: holdings,
      amount: sellProceeds,
      balanceAfter: balanceAfter
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

          {/* 단축키 정보바 */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-lg px-4 py-3 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
              <span>
                <strong className="text-blue-400 font-semibold">[스페이스바(Spacebar)]</strong> 키를 누르면 다음 일봉 캔들로 빠르게 넘어갑니다.
              </span>
            </div>
            
            {/* Audio Toggle in HUD */}
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)} 
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 bg-slate-800 px-2 py-1 rounded border border-slate-700/50"
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
              
              <div className="bg-blue-950/20 border border-blue-900/30 p-4 rounded-xl">
                <p className="font-semibold text-blue-400 text-center text-xs">
                  💡 본 가이드는 사이트의 학술적 가치 제고와 사용자의 올바른 금융 지식 배양, 그리고 투명한 면책 조항 안내를 위해 제공되는 고품질 교육 자료입니다.
                </p>
              </div>

              {/* 1. 최근 3개월간의 시장 주도주(삼성전자, SK하이닉스) 타점 복기 방법 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full" />
                  <h4 className="text-white font-bold text-sm">1. 시장 주도주(삼성전자, SK하이닉스) 실전 타점 복기 요령</h4>
                </div>
                <p>
                  종합주가지수(KOSPI)를 견인하는 초대형 시장 주도주인 <strong>삼성전자</strong>와 <strong>SK하이닉스</strong>는 풍부한 유동성과 정밀한 기술적 신뢰도로 인해 개인 투자자들의 훌륭한 교과서 역할을 합니다. 최근 3개월간의 반도체 고대역폭메모리(HBM) 이슈 및 인공지능(AI) 사이클 흐름을 본 리플레이 시뮬레이터로 복기할 때 최우선적으로 관찰해야 할 세 가지 핵심 타점 추출 공식은 다음과 같습니다.
                </p>
                <ul className="list-decimal pl-5 space-y-2 text-slate-400">
                  <li>
                    <strong className="text-slate-200">주도봉 몸통의 50% 눌림목 추적:</strong> SK하이닉스와 같이 강력한 실적 가이던스를 바탕으로 52주 신고가 영역을 거래 대금과 함께 상방 돌파할 때, 당일 형성된 가장 큰 거래량의 양봉(주도봉)을 확인하십시오. 이 주도봉 몸통의 중간 영역(50% 값)은 강한 메이저 세력의 평균 단가 역할을 합니다. 캔들을 하루씩 넘기면서 주가가 이 50% 지점까지 하락하되, 거래량이 전일 대비 1/3 이하로 숨이 죽는 순간을 감지하는 것이 정석적인 분할 매수 타점입니다.
                  </li>
                  <li>
                    <strong className="text-slate-200">옵션 연계 라운드 피겨(Round Figure) 저항 판별:</strong> 삼성전자는 시가총액 비중이 막대하여 외국인 및 기관의 파생상품 옵션 행사가격대와 긴밀히 연계되어 있습니다. 예를 들어 75,000원, 80,000원처럼 딱 떨어지는 앞자리 라운드 피겨 가격대는 강력한 매도 매물이 쌓여 있는 매물 저항 벽입니다. 리플레이 시뮬레이터 훈련 중 이 저항대를 거래량 없이 단순히 캔들의 윗꼬리로 뚫는 휩소(속임수)가 출현하는지 면밀히 확인하십시오. 거래량을 수반하지 않은 가짜 돌파는 100% 장대음봉 낙폭으로 직행하는 지름길입니다.
                  </li>
                  <li>
                    <strong className="text-slate-200">20일 이평선의 지지 탄력 회복 복기:</strong> 주가가 우상향 추세를 유지하고 있을 때 가장 중요한 생명선은 '황금선'이라고 불리는 20일 이동평균선입니다. 리플레이 기능으로 이전 과거 캔들을 백테스팅하며, 삼성전자가 20일 이동평균선 밑으로 고의로 주가를 일시적으로 떨어뜨렸다가(소위 개미 털기 지점) 하루 혹은 사흘 만에 대량 거래량과 함께 20일선 위로 다시 우뚝 일어서는 지점을 추적하십시오. 그 우뚝 일어선 장대양봉의 종가 부근이 안전한 스윙 및 단타 진입 타점입니다.
                  </li>
                </ul>
              </div>

              {/* 2. 시가/고가/저가/종가 및 거래량 캔들 리플레이 훈련 팁 */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
                  <div className="w-1.5 h-4 bg-red-500 rounded-full" />
                  <h4 className="text-white font-bold text-sm">2. 시가 · 고가 · 저가 · 종가(OHLC) 및 거래량 캔들 트레이닝 팁</h4>
                </div>
                <p>
                  단순히 버튼을 연타하며 기계적으로 지나치는 훈련은 무의미합니다. 하나의 봉에 함축된 네 가지 데이터(OHLC)와 거래량의 절대적 비율 관계를 뇌리에 각인하기 위한 고도의 트레이닝 기법을 전수합니다.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/60">
                  <div>
                    <h5 className="font-bold text-white mb-1.5">💡 장중 아래꼬리-몸통 균형 독해법</h5>
                    <p className="text-[11px] text-slate-400">
                      당일 시가(O)가 전일 종가와 비교하여 마이너스로 시작했으나, 장중에 세력의 대량 지지 수급이 들어와 저가(L)를 찍은 뒤 아래꼬리를 길게 달고 양봉 몸통으로 종가(C) 마감했다면 최상급 방어력의 징표입니다. 다음 날 거래일의 강한 반등을 직관적으로 예측하는 리플레이 피드백 훈련을 지속하십시오.
                    </p>
                  </div>
                  <div>
                    <h5 className="font-bold text-white mb-1.5">💡 윗꼬리 이탈 및 거래 대금 탈출 판별법</h5>
                    <p className="text-[11px] text-slate-400">
                      당일 고가(H)가 전일 대비 폭등했으나 장 마감 시간(오후 3시 30분)이 임박할수록 윗꼬리가 하염없이 길어지며 종가(C)가 주저앉았다면 이는 개인 투자자에게 물량을 전가하고 탈출한 흔적입니다. 윗꼬리가 몸통 대비 1.5배를 초과하는 음봉은 즉각적인 포지션 청산 및 손절 신호로 대응해야 계좌를 살릴 수 있습니다.
                    </p>
                  </div>
                </div>
                <p className="text-[11px]">
                  <strong>거래량 가속도 기법:</strong> 차트 상에서 주가가 완만하게 하강 추세를 그릴 때 거래량이 이전의 20% 미만으로 바짝 마른다면, 이는 투매가 진정되고 바닥 다지기에 들어간 시그널입니다. 이러한 바닥 국면에서 일봉 거래량이 직전 평균치의 최소 300% 이상 순증하며 작은 망치형 양봉(Doji) 캔들이 연속 생성되는 구간이야말로, 단타 트레이더들이 추세 반전을 믿고 1차 선취매 분할 매수로 진입해야 하는 핵심 맥점 영역입니다.
                </p>
              </div>

              {/* 3. 상세 면책고지 (법조문 및 가이드라인 - 1,500자 이상 구성) */}
              <div className="space-y-3 bg-slate-950/80 border border-slate-800 rounded-xl p-4 md:p-5">
                <div className="flex items-center gap-2 border-b border-slate-700 pb-1.5">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <h4 className="text-yellow-500 font-bold text-sm">3. 법적 책임 면책고지 규정 (Legal Disclaimer Guidelines)</h4>
                </div>
                
                <div className="space-y-3.5 text-[10px] text-slate-400 leading-relaxed max-h-[250px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                  <p className="text-slate-300 font-semibold">
                    [중요 선언] 본 "K-주식 리플레이 시뮬레이터" 서비스 및 모의 훈련 시스템(이하 "본 사이트" 혹은 "서비스")을 이용하기에 앞서, 아래 명시된 모든 법적 면책 사항 및 서비스 이용 한계 규정을 충분히 인지하고 완전하게 숙지하였음을 법률상 전제로 합니다. 본 사이트의 어떠한 데이터나 교육 콘텐츠도 실제 투자를 권유하는 투자 조언 또는 재무 자문으로 해석될 수 없습니다.
                  </p>
                  
                  <div>
                    <strong className="text-slate-200">제1조 (과거 데이터의 시뮬레이션 한계 및 비보증)</strong>
                    <p>
                      1. 본 서비스에서 노출하는 주가 정보, 이동평균선, 보조 지표, 거래량 차트 등은 과거 실제 발생하였던 역사적 장 마감 가격 데이터(Historical Data)에 기반한 모의 훈련 데이터셋입니다. 이는 과거의 시각적 흐름을 빠르게 복기하여 학습 효과를 극대화하려는 목적에 국한되며, 과거의 데이터 흐름 및 모의 훈련 수익률 성과가 향후 미래 시장의 주가 움직임이나 실제 투자 수익률을 보증, 예측, 혹은 보장하지 않습니다.
                    </p>
                    <p>
                      2. 미래의 주식 시장은 거시 경제 환경, 기업 실적의 변동, 정치적 변수, 예기치 못한 시장 뉴스, 유동성 변화 등 수많은 복합 요소로 작동하므로, 과거의 차트 유형이 동일하게 반복되지 않습니다. 따라서 시뮬레이터상에서의 모의 수익 발생 여부와 상관없이 실제 주식 시장에서의 거래는 원금의 전액 혹은 상당 부분의 손실 위험을 상시 내포하고 있습니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-200">제2조 (실제 투자 의사결정 책임의 귀속 및 귀책사유의 부존재)</strong>
                    <p>
                      1. 본 서비스가 제공하는 메인 화면 하단의 '주식 리플레이 시뮬레이터 탄생 배경 및 활용 가이드', '단타 매매 꿀팁', '시가, 고가, 저가, 종가(OHLC)를 지배하는 캔들 독해 비책' 및 본 팝업 내 가이드를 포함하여, 사이트상에 수록된 모든 분석 텍스트, 차트 해석 방법, 설명문, 교육 자료 등은 정보 제공과 자가 학습 지원 목적에 한정됩니다. 
                    </p>
                    <p>
                      2. 사용자는 본 서비스 내의 교육용 콘텐츠나 가상 매매 테스트 결과를 기반으로 하여 실제 주식 시장, 선물, 옵션, 해외 주식, 암호화폐 등 어떠한 실제 유가증권 거래도 직접 수행하여서는 안 됩니다. 만일 사용자가 본 사이트의 정보 또는 시뮬레이션 결과를 참고, 신용, 유추하여 실제 매매를 진행할 경우, 그로 인해 발생할 수 있는 모든 직접적, 간접적, 우발적, 특수적, 결과적 경제적 손실, 채무 불이행, 파산, 정신적 고통 등 어떠한 부정적 결과에 대해서도 본 서비스 운영자, 개발자, 및 관계자는 일체의 민형사상 손해배상 책임, 보상 책임, 사후 수습 의무를 부담하지 아니함을 엄숙히 규정합니다. 
                    </p>
                    <p>
                      3. 실제 금융 시장에서의 모든 거래는 전적으로 사용자 본인의 고유한 주관적 투자 철학과 지식 하에 행해지는 독립적인 행위이며, 그에 따르는 이익뿐 아니라 모든 손실 책임 또한 100% 온전히 투자자 본인(사용자)에게 전속됩니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-200">제3조 (금융업 및 법률 중개 행위 불이행 고지)</strong>
                    <p>
                      1. 본 사이트와 서비스 운영자는 자본시장과 금융투자업에 관한 법률(자본시장법)상 인가 또는 등록을 필한 전문 금융투자업자, 자문업자, 일임업자, 유사투자자문업자가 아닙니다. 당사는 주식 시장의 특정 종목에 대한 시세 조종, 리딩, 주식 추천, 매수/매도 신호의 실시간 송출 및 개별 금융 컨설팅을 일체 수행하지 않습니다. 
                    </p>
                    <p>
                      2. 당사는 특정 유가증권의 매입이나 매도를 알선, 주선, 대행, 혹은 청약 중개하지 않으며, 투자자 소유 자산을 예치하거나 대신 운용하는 상사 행위를 원천적으로 금지 및 차단하고 있습니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-200">제4조 (데이터 신뢰성 및 무중단 서비스의 한계 고지)</strong>
                    <p>
                      1. 본 서비스의 차트 캔들 데이터는 공신력 있는 금융 소스 API(예: Yahoo Finance 등)로부터 후행적으로 전송받아 정렬한 자료입니다. 당사는 데이터의 정밀함과 고유 완성도를 유지하기 위해 최선의 기술적 노력을 다하고 있으나, 원천 API 제공처의 오류, 정정 공시의 누락, 통신 인프라 지연, 데이터 정합성 왜곡 등으로 인하여 일부 캔들이 실제 과거 역사적 수치와 일치하지 않거나 누락될 가능성이 존재합니다. 
                    </p>
                    <p>
                      2. 당사는 데이터의 완전무결성, 최신성, 정확성, 적합성 여부에 대해 명시적 혹은 묵시적인 보증을 제공하지 않습니다. 아울러 서버 점검, 네트워크 중단, 천재지변, 브라우저 로컬 저장소 캐시 유실 등 불가항력적인 시스템 고장으로 인하여 사용자의 훈련 누적 데이터가 임시 소실되는 경우에 대해서도 당사는 면책됩니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-200">제5조 (구글 애드센스 등 외부 광고 매체 정책 준수 및 수익 고지)</strong>
                    <p>
                      1. 본 사이트는 완전 익명 기반의 비로그인 가상 학습 서비스로서, 일체의 회원 가입 정보나 민감한 개인 신원 식별 정보를 수집하지 않습니다.
                    </p>
                    <p>
                      2. 다만 서비스 인프라 및 서버 가동 자금 보충을 목적으로 구글 애드센스(Google AdSense) 등 서드파티 광고 네트워크 플랫폼을 활용하고 있습니다. 본 서비스 내에서 표출되는 광고물 및 이와 연계된 쿠키(Cookie) 수집 활동 등은 구글 사의 자체 개인정보 보호정책 및 사용 기록 추적 원리에 근거하여 독립적으로 실행되며, 본 서비스 운영자가 임의로 개입하거나 그 내용을 직접 수집 및 열람할 수 없음을 명백히 합니다.
                    </p>
                  </div>

                  <div>
                    <strong className="text-slate-200">제6조 (관할 법원의 지정)</strong>
                    <p>
                      본 서비스 이용 및 본 면책 사항의 해석과 관련하여 분쟁이 발생할 경우, 서비스 운영자의 소재지 관할 법원을 전속 합의 관할 법원으로 지정하여 해결할 것을 명시합니다.
                    </p>
                  </div>
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
