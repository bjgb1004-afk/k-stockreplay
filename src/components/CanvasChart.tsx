/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { createChart, CandlestickSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { Candle, Trade } from '../types';
import { VolumeChart } from './VolumeChart';

interface CanvasChartProps {
  candles: Candle[];
  averagePrice: number;
  hoverIndex: number | null;
  setHoverIndex: (index: number | null) => void;
  trades?: Trade[];
  currentIndex: number;
  totalCandles: number;
  gameMode: 'daily' | 'minute';
}

const formatVolumeTime = (dateStr: string, mode: 'daily' | 'minute'): string => {
  if (!dateStr) return '';
  if (mode === 'daily') {
    // Return only MM-DD (exclude Year YYYY- and Day Name)
    if (dateStr.length >= 10 && dateStr.charAt(4) === '-') {
      return dateStr.substring(5);
    }
    return dateStr;
  } else {
    // Return MM-DD HH:MM (exclude Year and Day Name)
    if (dateStr.includes(' ')) {
      const parts = dateStr.split(' ');
      const datePart = parts[0]; // YYYY-MM-DD
      const timePart = parts[1]; // HH:MM:SS
      const cleanTime = timePart.substring(0, 5); // HH:MM
      if (datePart.length >= 10 && datePart.charAt(4) === '-') {
        return `${datePart.substring(5)} ${cleanTime}`;
      }
      return cleanTime;
    }
    return dateStr;
  }
};

export const getTickSize = (price: number): number => {
  if (price < 1000) return 1;
  if (price < 2000) return 5;
  if (price < 10000) return 10;
  if (price < 50000) return 50;
  if (price < 100000) return 100;
  if (price < 500000) return 500;
  return 1000;
};

const parseTimeToChart = (dateStr: string): string | number => {
  if (dateStr.includes(':') || dateStr.includes(' ')) {
    const clean = dateStr.replace(' ', 'T');
    const d = new Date(clean + 'Z');
    const ts = Math.floor(d.getTime() / 1000);
    return isNaN(ts) ? dateStr : ts;
  }
  return dateStr;
};

export const CanvasChart: React.FC<CanvasChartProps> = ({
  candles,
  averagePrice,
  hoverIndex,
  setHoverIndex,
  trades = [],
  currentIndex,
  totalCandles,
  gameMode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const [priceChartInstance, setPriceChartInstance] = useState<any>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [panelHeight, setPanelHeight] = useState<number>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640 ? 350 : 450;
  });
  const [headerHeight, setHeaderHeight] = useState<number>(44);

  useEffect(() => {
    if (!panelRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setPanelHeight((prev) => {
            return Math.abs(prev - height) > 1.5 ? Math.round(height) : prev;
          });
        }
      }
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  const headerObserverRef = useRef<ResizeObserver | null>(null);
  const headerRef = React.useCallback((node: HTMLDivElement | null) => {
    if (headerObserverRef.current) {
      headerObserverRef.current.disconnect();
      headerObserverRef.current = null;
    }
    if (node) {
      const observer = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const height = entry.contentRect.height;
          if (height > 0) {
            setHeaderHeight((prev) => {
              return Math.abs(prev - height) > 1.5 ? Math.round(height) : prev;
            });
          }
        }
      });
      observer.observe(node);
      headerObserverRef.current = observer;
    }
  }, []);

  const remainingHeight = Math.max(180, panelHeight - headerHeight);
  const priceHeight = Math.round(remainingHeight * 0.74);
  const volumeHeight = Math.round(remainingHeight * 0.26);

  const priceHeightRef = useRef(priceHeight);
  useEffect(() => {
    priceHeightRef.current = priceHeight;
  }, [priceHeight]);

  // Handle resizing when height changes
  useEffect(() => {
    if (chartRef.current && containerRef.current) {
      chartRef.current.resize(containerRef.current.clientWidth, priceHeight);
    }
  }, [priceHeight]);

  const candlestickSeriesRef = useRef<any>(null);
  const ma5SeriesRef = useRef<any>(null);
  const ma20SeriesRef = useRef<any>(null);
  const ma60SeriesRef = useRef<any>(null);
  const ma120SeriesRef = useRef<any>(null);
  const tradeSeriesRef = useRef<any>(null);
  const priceLineRef = useRef<any>(null);
  const firstCandleDateRef = useRef<string | null>(null);
  const lastCandlesLengthRef = useRef<number>(0);
  const [tooltipData, setTooltipData] = useState<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    date: string;
    x: number;
    y: number;
    prevClose: number | null;
  } | null>(null);

  // Effect 1: Initialize the chart once or when dataset changes (stock switch/reset)
  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const firstCandleDate = candles[0].date;

    // Check if we need to recreate the chart
    if (chartRef.current) {
      if (firstCandleDateRef.current === firstCandleDate) {
        return; // Safe to keep the existing chart
      } else {
        // Ticker/Dataset changed! Recreate the chart
        try {
          if ((chartRef.current as any)?.__observer) (chartRef.current as any).__observer.disconnect();
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        ma5SeriesRef.current = null;
        ma20SeriesRef.current = null;
        ma60SeriesRef.current = null;
        ma120SeriesRef.current = null;
        tradeSeriesRef.current = null;
        priceLineRef.current = null;
      }
    }

    let chart: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeAnimationFrameId: number | null = null;
    let isChartActive = true;

    try {
      const container = containerRef.current;
      const priceChartHeight = priceHeightRef.current;

      chart = createChart(container, {
        width: container.clientWidth || 300,
        height: priceChartHeight,
        layout: {
          background: { type: 'solid' as any, color: document.documentElement.classList.contains('dark') ? '#020617' : '#ffffff' },
          textColor: document.documentElement.classList.contains('dark') ? '#94a3b8' : '#64748b',
          fontSize: 11,
          fontFamily: 'JetBrains Mono, Inter, sans-serif',
        },
        grid: {
          vertLines: { color: 'rgba(51, 65, 85, 0.15)', style: 1 },
          horzLines: { color: 'rgba(51, 65, 85, 0.15)', style: 1 },
        },
        localization: {
          priceFormatter: (price: number) => {
            return Math.round(price).toLocaleString() + '원';
          },
          timeFormatter: (time: any) => {
            if (typeof time === 'number') {
              const date = new Date(time * 1000);
              const hour = String(date.getUTCHours()).padStart(2, '0');
              const minute = String(date.getUTCMinutes()).padStart(2, '0');
              return `${hour}:${minute}`;
            }
            return time;
          },
        },
        crosshair: {
          mode: 0,
          vertLine: {
            color: 'rgba(148, 163, 184, 0.4)',
            width: 1,
            style: 3,
            labelVisible: true,
          },
          horzLine: {
            color: 'rgba(148, 163, 184, 0.4)',
            width: 1,
            style: 3,
            labelVisible: true,
          },
        },
        rightPriceScale: {
          borderColor: 'rgba(51, 65, 85, 0.3)',
          minimumWidth: 110,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        timeScale: {
          visible: false, // Hide timescale on price chart (volume chart handles it)
        },
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: false,
          },
        },
      });
      (chart as any).__observer = new MutationObserver(() => {
        if (!isChartActive || !chartRef.current) return;
        try {
          const isDark = document.documentElement.classList.contains('dark');
          chart.applyOptions({
            layout: {
              background: { type: 'solid' as any, color: isDark ? '#020617' : '#ffffff' },
              textColor: isDark ? '#94a3b8' : '#64748b',
            }
          });
          chart.priceScale('right').applyOptions({
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          });
          chart.timeScale().applyOptions({
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          });
        } catch (e) {
          console.warn('[CanvasChart] Dark mode toggle failed:', e);
        }
      });
      (chart as any).__observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });


      chartRef.current = chart;
      setPriceChartInstance(chart);
      firstCandleDateRef.current = firstCandleDate;

      const referencePrice = candles.length > 0 ? candles[candles.length - 1].close : 10000;
      const tickSize = getTickSize(referencePrice);

      // Create Candlestick Series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#ef4444',
        downColor: '#3b82f6',
        borderVisible: false,
        wickUpColor: '#ef4444',
        wickDownColor: '#3b82f6',
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: {
          type: 'price',
          precision: 0,
          minMove: tickSize,
        },
      });
      candlestickSeriesRef.current = candlestickSeries;

      // Add MA Lines
      ma5SeriesRef.current = chart.addSeries(LineSeries, {
        color: '#eab308',
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: 'price', precision: 0, minMove: 1 },
      });

      ma20SeriesRef.current = chart.addSeries(LineSeries, {
        color: '#d946ef',
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: 'price', precision: 0, minMove: 1 },
      });

      ma60SeriesRef.current = chart.addSeries(LineSeries, {
        color: '#06b6d4',
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: 'price', precision: 0, minMove: 1 },
      });

      ma120SeriesRef.current = chart.addSeries(LineSeries, {
        color: '#8b5cf6',
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
        priceFormat: { type: 'price', precision: 0, minMove: 1 },
      });

      // Add Trade Series for EXACT price markers
      tradeSeriesRef.current = chart.addSeries(LineSeries, {
        color: 'rgba(0, 0, 0, 0)', // fully transparent line
        lineWidth: 0,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      // Set comfortable timescale options
      chart.timeScale().applyOptions({
        barSpacing: 6,
        rightOffset: 5,
      });

      // Subscribe to Hover
      chart.subscribeCrosshairMove((param: any) => {
        if (!isChartActive || !chartRef.current) return;
        if (!param || !param.time || param.point === undefined) {
          setHoverIndex(null);
          setTooltipData(null);
          return;
        }
        const matchedIndex = candles.findIndex(c => parseTimeToChart(c.date) === param.time);
        if (matchedIndex !== -1) {
          setHoverIndex(matchedIndex);
          const candle = candles[matchedIndex];
          const prevCandle = matchedIndex > 0 ? candles[matchedIndex - 1] : null;
          setTooltipData({
            open: candle.open,
            high: candle.high,
            low: candle.low,
            close: candle.close,
            volume: candle.volume,
            date: candle.date,
            x: param.point.x,
            y: param.point.y,
            prevClose: prevCandle ? prevCandle.close : null,
          });
        } else {
          setHoverIndex(null);
          setTooltipData(null);
        }
      });

      let lastWidth = container.clientWidth;
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          if (width && Math.abs(width - lastWidth) > 1 && isChartActive && chartRef.current) {
            lastWidth = width;
            if (resizeAnimationFrameId !== null) {
              cancelAnimationFrame(resizeAnimationFrameId);
            }
            resizeAnimationFrameId = requestAnimationFrame(() => {
              try {
                if (isChartActive && chartRef.current) {
                  chartRef.current.resize(width, priceHeightRef.current);
                }
              } catch (err) {}
            });
          }
        }
      });
      resizeObserver.observe(container);

    } catch (err) {
      console.error('Failed to initialize lightweight-charts in CanvasChart:', err);
    }

    return () => {
      isChartActive = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (resizeAnimationFrameId !== null) {
        cancelAnimationFrame(resizeAnimationFrameId);
      }
    };
  }, [candles[0]?.date]);

  // Effect 2: Update the chart series data and elements whenever props change
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || candles.length === 0) return;

    // Prepare Data
    const ma5Data: any[] = [];
    const ma20Data: any[] = [];
    const ma60Data: any[] = [];
    const ma120Data: any[] = [];
    const candlestickData: any[] = [];

    const calculateMA = (data: Candle[], period: number): (number | null)[] => {
      const ma: (number | null)[] = [];
      for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
          ma.push(null);
        } else {
          let sum = 0;
          for (let j = 0; j < period; j++) {
            sum += data[i - j].close;
          }
          ma.push(sum / period);
        }
      }
      return ma;
    };

    const ma5Values = calculateMA(candles, 5);
    const ma20Values = calculateMA(candles, 20);
    const ma60Values = calculateMA(candles, 60);
    const ma120Values = calculateMA(candles, 120);

    for (let i = 0; i < candles.length; i++) {
      const item = candles[i];
      const chartTime = parseTimeToChart(item.date);

      candlestickData.push({
        time: chartTime,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
      });

      const m5 = ma5Values[i];
      if (m5 !== null) {
        ma5Data.push({ time: chartTime, value: m5 });
      }

      const m20 = ma20Values[i];
      if (m20 !== null) {
        ma20Data.push({ time: chartTime, value: m20 });
      }

      const m60 = ma60Values[i];
      if (m60 !== null) {
        ma60Data.push({ time: chartTime, value: m60 });
      }

      const m120 = ma120Values[i];
      if (m120 !== null) {
        ma120Data.push({ time: chartTime, value: m120 });
      }
    }

    candlestickSeriesRef.current.setData(candlestickData);
    if (ma5SeriesRef.current) ma5SeriesRef.current.setData(ma5Data);
    if (ma20SeriesRef.current) ma20SeriesRef.current.setData(ma20Data);
    if (ma60SeriesRef.current) ma60SeriesRef.current.setData(ma60Data);
    if (ma120SeriesRef.current) ma120SeriesRef.current.setData(ma120Data);

    // Draw / update Average Price Line if holding
    if (priceLineRef.current) {
      try {
        candlestickSeriesRef.current.removePriceLine(priceLineRef.current);
      } catch (e) {}
      priceLineRef.current = null;
    }

    if (averagePrice && averagePrice > 0) {
      priceLineRef.current = candlestickSeriesRef.current.createPriceLine({
        price: averagePrice,
        color: '#10b981', // emerald-500
        lineWidth: 2,
        lineStyle: 2,
        axisLabelVisible: false,
        title: '매수평단',
      });
    }

    // Draw markers at EXACT execution prices on the trade series
    if (tradeSeriesRef.current) {
      const filteredTrades = (trades || []).filter(t => candles.some(c => c.date === t.date));
      
      const tradeSeriesData = filteredTrades
        .map(t => ({
          time: parseTimeToChart(t.date),
          value: t.price,
        }))
        // Ensure unique times in ascending order for LineSeries
        .filter((item, index, self) => self.findIndex(s => s.time === item.time) === index)
        .sort((a, b) => {
          const tA = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime();
          const tB = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime();
          return tA - tB;
        });

      tradeSeriesRef.current.setData(tradeSeriesData);

      // Group trades by their time index to prevent duplicate marker bugs
      const tradesByTime = new Map<any, typeof filteredTrades>();
      filteredTrades.forEach(trade => {
        const t = parseTimeToChart(trade.date);
        if (!tradesByTime.has(t)) {
          tradesByTime.set(t, []);
        }
        tradesByTime.get(t)!.push(trade);
      });

      const markers: any[] = [];
      tradesByTime.forEach((tradesAtTime, time) => {
        const buyTrades = tradesAtTime.filter(t => t.type === 'BUY');
        const sellTrades = tradesAtTime.filter(t => t.type === 'SELL');
        const buyCount = buyTrades.length;
        const sellCount = sellTrades.length;

        if (buyCount > 0) {
          markers.push({
            time,
            position: 'inBar' as any,
            color: '#10b981', // green
            shape: 'arrowUp' as any,
            text: buyCount > 1 ? `B x${buyCount}` : undefined,
            size: 0.5,
          });
        }
        if (sellCount > 0) {
          markers.push({
            time,
            position: 'inBar' as any,
            color: '#3b82f6', // blue
            shape: 'arrowDown' as any,
            text: sellCount > 1 ? `S x${sellCount}` : undefined,
            size: 0.5,
          });
        }
      });

      markers.sort((a, b) => {
        const tA = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime();
        const tB = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime();
        return tA - tB;
      });

      createSeriesMarkers(tradeSeriesRef.current, markers);
    }

    const lengthChanged = candles.length > lastCandlesLengthRef.current;
    lastCandlesLengthRef.current = candles.length;

    // Preserve the current zoom level (barSpacing) if it exists
    const currentBarSpacing = chartRef.current ? chartRef.current.timeScale().options().barSpacing : 6;

    // Auto-fit content only on the very first candle of a new round
    if (candles.length === 1) {
      chartRef.current.timeScale().fitContent();
    } else if (lengthChanged) {
      // Scroll to show the latest candle when flow advances, preserving zoom level (barSpacing)
      chartRef.current.timeScale().scrollToPosition(0, false);
      // Explicitly restore the user's zoom level to prevent resetting
      chartRef.current.timeScale().applyOptions({ barSpacing: currentBarSpacing });
    }
  }, [candles, trades, averagePrice]);

  // Clean up completely on unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        try {
          if ((chartRef.current as any)?.__observer) (chartRef.current as any).__observer.disconnect();
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
        setPriceChartInstance(null);
      }
      if (headerObserverRef.current) {
        headerObserverRef.current.disconnect();
        headerObserverRef.current = null;
      }
    };
  }, []);



  const activeCandleIndex = hoverIndex !== null ? hoverIndex : (candles && candles.length > 0 ? candles.length - 1 : 0);
  const activeCandle = candles && candles.length > 0 ? candles[activeCandleIndex] : null;

  const prevCandle = activeCandle && activeCandleIndex > 0 ? candles[activeCandleIndex - 1] : null;
  const changePct = activeCandle
    ? (prevCandle 
        ? ((activeCandle.close - prevCandle.close) / prevCandle.close) * 100 
        : ((activeCandle.close - activeCandle.open) / activeCandle.open) * 100)
    : 0;

  const tradeValueMillion = activeCandle ? (activeCandle.close * activeCandle.volume) / 1000000 : 0;

  return (
    <div ref={panelRef} className="relative flex flex-col w-full h-full bg-white dark:bg-slate-950 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl" id="canvas-chart-panel">
      {/* Static Indicator Top Bar Header */}
      {activeCandle && (
        <div ref={headerRef} className="w-full bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800/80 p-3 flex flex-col gap-2.5 z-10" id="canvas-indicator-header">
          {/* Indicators Legend & Progress Box */}
          <div className="flex items-center justify-between w-full text-[10px] font-mono" id="canvas-indicator-legend-container">
            <div className="flex items-center gap-3" id="canvas-indicator-legend">
              <span className="text-slate-500 dark:text-slate-500 font-semibold uppercase tracking-wider text-[8px] mr-1">지표:</span>
              <span className="text-[#eab308] flex items-center gap-1 bg-[#eab308]/5 px-1.5 py-0.5 rounded border border-[#eab308]/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" /> 5
              </span>
              <span className="text-[#d946ef] flex items-center gap-1 bg-[#d946ef]/5 px-1.5 py-0.5 rounded border border-[#d946ef]/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d946ef]" /> 20
              </span>
              <span className="text-[#06b6d4] flex items-center gap-1 bg-[#06b6d4]/5 px-1.5 py-0.5 rounded border border-[#06b6d4]/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#06b6d4]" /> 60
              </span>
              <span className="text-[#8b5cf6] flex items-center gap-1 bg-[#8b5cf6]/5 px-1.5 py-0.5 rounded border border-[#8b5cf6]/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#8b5cf6]" /> 120
              </span>
            </div>
            {/* Progress Badge */}
            <div className="flex items-center gap-1.5 bg-indigo-500/10 border border-indigo-500/30 text-white font-extrabold text-[10px] px-2.5 py-0.5 rounded-full shadow-sm">
              <span className="animate-pulse h-1.5 w-1.5 rounded-full bg-indigo-400" />
              <span className="text-white">진행 {totalCandles > 0 ? `${currentIndex + 1}/${totalCandles}` : '로딩 중...'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Loading Placeholder */}
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 z-10">
          <span className="animate-pulse">데이터 로딩 중...</span>
        </div>
      )}

      {/* Price Chart DOM Container */}
      <div
        ref={containerRef}
        className="w-full block relative"
        style={{ height: `${priceHeight}px` }}
        id="lightweight-canvas-chart-container"
      >
        {tooltipData && (() => {
          const refPrice = tooltipData.prevClose !== null ? tooltipData.prevClose : tooltipData.open;
          
          const openPct = tooltipData.prevClose !== null 
            ? ((tooltipData.open - tooltipData.prevClose) / tooltipData.prevClose) * 100 
            : 0;

          const highPct = ((tooltipData.high - refPrice) / refPrice) * 100;
          const lowPct = ((tooltipData.low - refPrice) / refPrice) * 100;
          const closePct = ((tooltipData.close - refPrice) / refPrice) * 100;

          const tooltipTradeValueMillion = (tooltipData.close * tooltipData.volume) / 1000000;
          
          return (
            <div
              className="absolute bg-slate-905/95 backdrop-blur-md border border-slate-300 dark:border-slate-700/70 rounded-xl p-3 shadow-2xl z-50 pointer-events-none text-xs font-mono text-slate-800 dark:text-slate-200 min-w-[210px] flex flex-col gap-1.5"
              style={{
                left: `${Math.min(tooltipData.x + 15, (containerRef.current?.clientWidth || 300) - 230)}px`,
                top: `${Math.max(tooltipData.y - 140, 10)}px`,
              }}
              id="candle-detail-tooltip"
            >
              <div className="border-b border-slate-200 dark:border-slate-800 pb-1 mb-0.5 text-slate-600 dark:text-slate-400 font-bold text-[10px]" id="tooltip-date">
                {tooltipData.date}
              </div>
              <div className="flex justify-between items-center gap-4" id="tooltip-open">
                <span className="text-slate-600 dark:text-slate-400">시가</span>
                <div className="flex items-center gap-1 font-semibold">
                  <span className="text-white">{Math.round(tooltipData.open).toLocaleString()}원</span>
                  <span className={`text-[10px] ${openPct >= 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                    ({openPct >= 0 ? '+' : ''}{openPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4" id="tooltip-high">
                <span className="text-slate-600 dark:text-slate-400">고가</span>
                <div className="flex items-center gap-1 font-semibold">
                  <span className="text-white">{Math.round(tooltipData.high).toLocaleString()}원</span>
                  <span className={`text-[10px] ${highPct >= 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                    ({highPct >= 0 ? '+' : ''}{highPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4" id="tooltip-low">
                <span className="text-slate-600 dark:text-slate-400">저가</span>
                <div className="flex items-center gap-1 font-semibold">
                  <span className="text-white">{Math.round(tooltipData.low).toLocaleString()}원</span>
                  <span className={`text-[10px] ${lowPct >= 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                    ({lowPct >= 0 ? '+' : ''}{lowPct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4" id="tooltip-close">
                <span className="text-slate-600 dark:text-slate-400">종가</span>
                <div className="flex items-center gap-1 font-semibold">
                  <span className="text-white">{Math.round(tooltipData.close).toLocaleString()}원</span>
                  <span className={`text-[10px] ${closePct >= 0 ? 'text-rose-400' : 'text-sky-400'}`}>
                    ({closePct >= 0 ? '+' : ''}{closePct.toFixed(2)}%)
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center gap-4 border-t border-slate-200 dark:border-slate-800/80 pt-1.5 mt-0.5" id="tooltip-volume">
                <span className="text-slate-600 dark:text-slate-400">거래대금</span>
                <span className="font-semibold text-amber-400">
                  {tooltipTradeValueMillion.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}백만원
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Separated Volume Chart Component */}
      {priceChartInstance && (
        <div className="relative">
          <VolumeChart
            candles={candles}
            height={volumeHeight}
            priceChart={priceChartInstance}
          />
        </div>
      )}
    </div>
  );
};
