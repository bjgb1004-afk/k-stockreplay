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
  const headerRef = useRef<HTMLDivElement | null>(null);
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
          setPanelHeight(height);
        }
      }
    });
    observer.observe(panelRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const height = entry.contentRect.height;
        if (height > 0) {
          setHeaderHeight(height);
        }
      }
    });
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, [candles]);

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
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
        candlestickSeriesRef.current = null;
        ma5SeriesRef.current = null;
        ma20SeriesRef.current = null;
        tradeSeriesRef.current = null;
        priceLineRef.current = null;
      }
    }

    let chart: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeAnimationFrameId: number | null = null;

    try {
      const container = containerRef.current;
      const priceChartHeight = priceHeightRef.current;

      chart = createChart(container, {
        width: container.clientWidth || 300,
        height: priceChartHeight,
        layout: {
          background: { type: 'solid' as any, color: '#020617' }, // matching slate-950
          textColor: '#94a3b8', // slate-400
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
        if (!param || !param.time || param.point === undefined) {
          setHoverIndex(null);
          return;
        }
        const matchedIndex = candles.findIndex(c => parseTimeToChart(c.date) === param.time);
        if (matchedIndex !== -1) {
          setHoverIndex(matchedIndex);
        } else {
          setHoverIndex(null);
        }
      });

      let lastWidth = container.clientWidth;
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          if (width && Math.abs(width - lastWidth) > 1 && chartRef.current) {
            lastWidth = width;
            if (resizeAnimationFrameId !== null) {
              cancelAnimationFrame(resizeAnimationFrameId);
            }
            resizeAnimationFrameId = requestAnimationFrame(() => {
              try {
                if (chartRef.current) {
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
      // Cleanup is handled on complete unmount or reset
    };
  }, [candles[0]?.date]);

  // Effect 2: Update the chart series data and elements whenever props change
  useEffect(() => {
    if (!chartRef.current || !candlestickSeriesRef.current || candles.length === 0) return;

    // Prepare Data
    const ma5Data: any[] = [];
    const ma20Data: any[] = [];
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
    }

    candlestickSeriesRef.current.setData(candlestickData);
    if (ma5SeriesRef.current) ma5SeriesRef.current.setData(ma5Data);
    if (ma20SeriesRef.current) ma20SeriesRef.current.setData(ma20Data);

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
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
        setPriceChartInstance(null);
      }
    };
  }, []);

  // Listen to mousedown on the chart container to show OHLCV tooltip and mousemove to hide it
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // Only handle left click
      if (hoverIndex !== null && candles[hoverIndex]) {
        const candle = candles[hoverIndex];
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setTooltipData({
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume,
          date: candle.date,
          x: x,
          y: y,
        });
      }
    };

    const handleMouseMove = () => {
      setTooltipData(null);
    };

    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [candles, hoverIndex]);

  const activeCandle = hoverIndex !== null ? candles[hoverIndex] : candles[candles.length - 1];

  return (
    <div ref={panelRef} className="relative flex flex-col w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl" id="canvas-chart-panel">
      {/* Static Indicator Top Bar Header */}
      {activeCandle && (
        <div ref={headerRef} className="w-full bg-slate-900 border-b border-slate-800/80 p-3 flex flex-col gap-2 z-10" id="canvas-indicator-header">
          {/* Indicators Legend & Progress Box */}
          <div className="flex items-center justify-between w-full text-[10px] font-mono" id="canvas-indicator-legend-container">
            <div className="flex items-center gap-3" id="canvas-indicator-legend">
              <span className="text-slate-500 font-semibold uppercase tracking-wider text-[8px] mr-1">지표:</span>
              <span className="text-[#eab308] flex items-center gap-1 bg-[#eab308]/5 px-1.5 py-0.5 rounded border border-[#eab308]/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" /> 5
              </span>
              <span className="text-[#d946ef] flex items-center gap-1 bg-[#d946ef]/5 px-1.5 py-0.5 rounded border border-[#d946ef]/10">
                <span className="h-1.5 w-1.5 rounded-full bg-[#d946ef]" /> 20
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
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-400 z-10">
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
        {tooltipData && (
          <div
            className="absolute bg-slate-900/95 border border-slate-700/80 rounded-lg p-3 shadow-2xl z-50 pointer-events-none text-xs font-mono text-slate-200 min-w-[150px] flex flex-col gap-1.5"
            style={{
              left: `${Math.min(tooltipData.x + 15, (containerRef.current?.clientWidth || 300) - 170)}px`,
              top: `${Math.max(tooltipData.y - 120, 10)}px`,
            }}
            id="candle-detail-tooltip"
          >
            <div className="border-b border-slate-800 pb-1 mb-0.5 text-slate-400 font-bold text-[10px]" id="tooltip-date">
              {tooltipData.date}
            </div>
            <div className="flex justify-between gap-4" id="tooltip-open">
              <span className="text-slate-400">시가</span>
              <span className="font-semibold text-white">{Math.round(tooltipData.open).toLocaleString()}원</span>
            </div>
            <div className="flex justify-between gap-4" id="tooltip-high">
              <span className="text-slate-400">고가</span>
              <span className="font-semibold text-emerald-400">{Math.round(tooltipData.high).toLocaleString()}원</span>
            </div>
            <div className="flex justify-between gap-4" id="tooltip-low">
              <span className="text-slate-400">저가</span>
              <span className="font-semibold text-sky-400">{Math.round(tooltipData.low).toLocaleString()}원</span>
            </div>
            <div className="flex justify-between gap-4" id="tooltip-close">
              <span className="text-slate-400">종가</span>
              <span className="font-semibold text-white">{Math.round(tooltipData.close).toLocaleString()}원</span>
            </div>
            <div className="flex justify-between gap-4 border-t border-slate-800/80 pt-1.5 mt-0.5" id="tooltip-volume">
              <span className="text-slate-400">거래대금</span>
              <span className="font-semibold text-amber-400">{Math.round(tooltipData.close * tooltipData.volume).toLocaleString()}원</span>
            </div>
          </div>
        )}
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
