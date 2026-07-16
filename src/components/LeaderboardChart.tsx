/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { Candle, Trade } from '../types';
import { getTickSize } from './CanvasChart';

interface LeaderboardChartProps {
  candles: Candle[];
  trades: Trade[];
  averagePrice?: number;
}

const parseTimeToChart = (dateStr: string): string | number => {
  if (dateStr.includes(':') || dateStr.includes(' ')) {
    const clean = dateStr.replace(' ', 'T');
    const d = new Date(clean);
    const ts = Math.floor(d.getTime() / 1000);
    return isNaN(ts) ? dateStr : ts;
  }
  return dateStr;
};

export const LeaderboardChart: React.FC<LeaderboardChartProps> = ({ candles, trades, averagePrice }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const [hoverCandle, setHoverCandle] = useState<Candle | null>(null);
  const [chartHeight, setChartHeight] = useState<number>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 640 ? 280 : 420;
  });

  useEffect(() => {
    const handleResize = () => {
      setChartHeight(window.innerWidth < 640 ? 280 : 420);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    let chart: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeAnimationFrameId: number | null = null;

    try {
      // 1. Create Chart
      const container = containerRef.current;
      const initialHeight = window.innerWidth < 640 ? 280 : 420;
      chart = createChart(container, {
        width: container.clientWidth || 300,
        height: initialHeight,
        layout: {
          background: { type: 'solid' as any, color: '#020617' }, // matching slate-950 background
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
        },
        crosshair: {
          mode: 0, // Normal crosshair
          vertLine: {
            color: 'rgba(148, 163, 184, 0.4)',
            width: 1,
            style: 3, // dashed
            labelVisible: true,
          },
          horzLine: {
            color: 'rgba(148, 163, 184, 0.4)',
            width: 1,
            style: 3, // dashed
            labelVisible: true,
          },
        },
        rightPriceScale: {
          borderColor: 'rgba(51, 65, 85, 0.3)',
          scaleMargins: {
            top: 0.1,
            bottom: 0.35, // Keep candlestick in top 65% to prevent overlapping with volume
          },
        },
        timeScale: {
          borderColor: 'rgba(51, 65, 85, 0.3)',
          timeVisible: true,
          secondsVisible: false,
        },
        handleScale: {
          axisPressedMouseMove: {
            time: true,
            price: false,
          },
        },
      });

      chartRef.current = chart;

      // Determine the reference price to calculate dynamic tick size
      const referencePrice = candles.length > 0 ? candles[candles.length - 1].close : 10000;
      const tickSize = getTickSize(referencePrice);

      // 2. Add Candlestick Series
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: '#ef4444',     // 한국 주식 시장 상승: 빨강
        downColor: '#3b82f6',   // 한국 주식 시장 하락: 파랑
        borderVisible: false,
        wickUpColor: '#ef4444',
        wickDownColor: '#3b82f6',
        priceFormat: {
          type: 'price',
          precision: 0,
          minMove: tickSize,
        },
      });

      // Draw Average Price line if holding
      if (averagePrice && averagePrice > 0) {
        candlestickSeries.createPriceLine({
          price: averagePrice,
          color: '#10b981', // emerald-500
          lineWidth: 2,
          lineStyle: 2, // Dashed style in lightweight-charts (0: Solid, 1: Dotted, 2: Dashed, 3: LargeDashed)
          axisLabelVisible: false,
          title: '매수평단',
        });
      }

      // 3. Add Volume Series as Overlay
      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'custom',
          formatter: (value: number) => {
            if (value >= 100000000) {
              return (value / 100000000).toFixed(1) + '억';
            }
            if (value >= 1000000) {
              return (value / 1000000).toFixed(1) + '백만';
            }
            if (value >= 1000) {
              return (value / 1000).toFixed(1) + '천';
            }
            return Math.round(value).toLocaleString();
          },
        },
        priceScaleId: 'volume-scale',
      });

      chart.priceScale('volume-scale').applyOptions({
        scaleMargins: {
          top: 0.8, // Volume takes only bottom 20%
          bottom: 0,
        },
      });

      // 4. Add Line Series for Moving Averages
      const ma5Series = chart.addSeries(LineSeries, {
        color: '#eab308', // yellow-500
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: {
          type: 'price',
          precision: 0,
          minMove: 1,
        },
      });

      const ma20Series = chart.addSeries(LineSeries, {
        color: '#d946ef', // magenta-500
        lineWidth: 1.5,
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: {
          type: 'price',
          precision: 0,
          minMove: 1,
        },
      });

      // 5. Prepare Data
      const ma5Data: any[] = [];
      const ma20Data: any[] = [];
      const candlestickData: any[] = [];
      const volumeData: any[] = [];

      for (let i = 0; i < candles.length; i++) {
        const item = candles[i];
        const dateStr = item.date;
        const chartTime = parseTimeToChart(dateStr);

        candlestickData.push({
          time: chartTime,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        });

        const isUp = item.close >= item.open;
        volumeData.push({
          time: chartTime,
          value: item.volume * item.close,
          color: isUp ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)',
        });

        // Calculate MA 5
        if (i >= 4) {
          let sum = 0;
          for (let k = 0; k < 5; k++) sum += candles[i - k].close;
          ma5Data.push({ time: chartTime, value: sum / 5 });
        }

        // Calculate MA 20
        if (i >= 19) {
          let sum = 0;
          for (let k = 0; k < 20; k++) sum += candles[i - k].close;
          ma20Data.push({ time: chartTime, value: sum / 20 });
        }
      }

      candlestickSeries.setData(candlestickData);
      volumeSeries.setData(volumeData);
      if (ma5Data.length > 0) ma5Series.setData(ma5Data);
      if (ma20Data.length > 0) ma20Series.setData(ma20Data);

      // 6. Draw Execution Buy/Sell Markers (Grouped by time to prevent duplicate marker bugs)
      const filteredTrades = trades.filter(t => candles.some(c => c.date === t.date));
      const tradesByTime = new Map<any, typeof filteredTrades>();
      filteredTrades.forEach(trade => {
        const t = parseTimeToChart(trade.date);
        if (!tradesByTime.has(t)) {
          tradesByTime.set(t, []);
        }
        tradesByTime.get(t)!.push(trade);
      });

      // Add Trade Series for EXACT price markers
      const tradeSeries = chart.addSeries(LineSeries, {
        color: 'rgba(0, 0, 0, 0)', // fully transparent
        lineWidth: 0,
        priceLineVisible: false,
        lastValueVisible: false,
      });

      const tradeSeriesData = filteredTrades
        .map(t => ({
          time: parseTimeToChart(t.date),
          value: t.price,
        }))
        .filter((item, index, self) => self.findIndex(s => s.time === item.time) === index)
        .sort((a, b) => {
          const tA = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime();
          const tB = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime();
          return tA - tB;
        });

      tradeSeries.setData(tradeSeriesData);

      const markers: any[] = [];
      tradesByTime.forEach((tradesAtTime, time) => {
        const buyTrades = tradesAtTime.filter(t => t.type === 'BUY');
        const sellTrades = tradesAtTime.filter(t => t.type === 'SELL');
        const buyCount = buyTrades.length;
        const sellCount = sellTrades.length;
        const hasAuto = sellTrades.some(t => t.isAutoLiquidated);

        if (buyCount > 0) {
          markers.push({
            time,
            position: 'inBar' as any,
            color: '#22c55e', // green
            shape: 'arrowUp' as any,
            text: buyCount > 1 ? `매수 x${buyCount}` : '매수',
            size: 1.2,
          });
        }
        if (sellCount > 0) {
          markers.push({
            time,
            position: 'inBar' as any,
            color: hasAuto ? '#38bdf8' : '#3b82f6', // blue / skyblue instead of yellow (#eab308)
            shape: 'arrowDown' as any,
            text: hasAuto 
              ? (sellCount > 1 ? `자동청산 x${sellCount}` : '자동청산') 
              : (sellCount > 1 ? `매도 x${sellCount}` : '매도'),
            size: 1.2,
          });
        }
      });

      markers.sort((a, b) => {
        const tA = typeof a.time === 'number' ? a.time : new Date(a.time as string).getTime();
        const tB = typeof b.time === 'number' ? b.time : new Date(b.time as string).getTime();
        return tA - tB;
      });

      createSeriesMarkers(tradeSeries, markers);

      // 7. Subscribe to Hover / Crosshair Move
      chart.subscribeCrosshairMove((param: any) => {
        if (!param || !param.time || param.point === undefined) {
          setHoverCandle(null);
          return;
        }
        const matchedCandle = candles.find(c => parseTimeToChart(c.date) === param.time);
        if (matchedCandle) {
          setHoverCandle(matchedCandle);
        } else {
          setHoverCandle(null);
        }
      });

      // 8. Fit Content
      chart.timeScale().fitContent();

      // 9. Resize Observer (Check width deviation > 1px to prevent any potential infinite resizing loop)
      let lastWidth = container.clientWidth;
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          if (width && Math.abs(width - lastWidth) > 1 && chart) {
            lastWidth = width;
            if (resizeAnimationFrameId !== null) {
              cancelAnimationFrame(resizeAnimationFrameId);
            }
            resizeAnimationFrameId = requestAnimationFrame(() => {
              try {
                if (chart) {
                  const currentHeight = window.innerWidth < 640 ? 280 : 420;
                  chart.resize(width, currentHeight);
                  chart.timeScale().fitContent();
                }
              } catch (err) {}
            });
          }
        }
      });
      resizeObserver.observe(container);

    } catch (err) {
      console.error('Failed to initialize lightweight-charts:', err);
    }

    // Cleanup
    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      if (resizeAnimationFrameId !== null) {
        cancelAnimationFrame(resizeAnimationFrameId);
      }
      if (chart) {
        try {
          chart.remove();
        } catch (e) {}
      }
      chartRef.current = null;
    };
  }, [candles, trades, averagePrice]);

  // Fallback to last candle if not hovering
  const activeCandle = hoverCandle || (candles && candles.length > 0 ? candles[candles.length - 1] : null);
  const isUp = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const changeAmt = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const changePct = activeCandle ? (changeAmt / activeCandle.open) * 100 : 0;
  const tradeValueMillion = activeCandle ? (activeCandle.close * activeCandle.volume) / 1000000 : 0;

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl" id="leaderboard-chart-panel">
      {/* Static OHLC & Indicator Top Bar Header to avoid overlap on mobile */}
      {activeCandle && (
        <div className="w-full bg-slate-900 border-b border-slate-800/80 p-3 flex flex-col gap-2 z-10" id="leaderboard-ohlc-header">
          {/* OHLC Values */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] md:text-xs font-mono">
            <span className="text-slate-400 font-bold bg-slate-800 px-1.5 py-0.5 rounded">{activeCandle.date}</span>
            <div className="flex gap-1">
              <span className="text-slate-500">시:</span>
              <span className="text-white font-medium">{Math.round(activeCandle.open).toLocaleString()}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-slate-500">고:</span>
              <span className="text-red-400 font-medium">{Math.round(activeCandle.high).toLocaleString()}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-slate-500">저:</span>
              <span className="text-blue-400 font-medium">{Math.round(activeCandle.low).toLocaleString()}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-slate-500">종:</span>
              <span className={`${isUp ? 'text-red-500' : 'text-blue-500'} font-bold`}>{Math.round(activeCandle.close).toLocaleString()}</span>
            </div>
            <div className="flex gap-1">
              <span className="text-slate-500">변동:</span>
              <span className={`${changeAmt >= 0 ? 'text-red-500' : 'text-blue-500'} font-bold`}>
                {changeAmt >= 0 ? '+' : ''}{Math.round(changeAmt).toLocaleString()} ({changePct >= 0 ? '+' : ''}{changePct.toFixed(2)}%)
              </span>
            </div>
            <div className="flex gap-1">
              <span className="text-slate-500">거래대금:</span>
              <span className="text-amber-400 font-bold">
                {tradeValueMillion.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}백만원
              </span>
            </div>
          </div>

          {/* Indicators Legend */}
          <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-mono border-t border-slate-800/40 pt-1.5" id="leaderboard-indicator-legend">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[8px] mr-1">지표:</span>
            <span className="text-[#eab308] flex items-center gap-1 bg-[#eab308]/5 px-1.5 py-0.5 rounded border border-[#eab308]/10">
              <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" /> 5
            </span>
            <span className="text-[#d946ef] flex items-center gap-1 bg-[#d946ef]/5 px-1.5 py-0.5 rounded border border-[#d946ef]/10">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d946ef]" /> 20
            </span>
          </div>
        </div>
      )}

      {/* Loading Placeholder */}
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-400 z-10">
          <span className="animate-pulse">데이터 로딩 중...</span>
        </div>
      )}

      {/* Lightweight Chart DOM container */}
      <div
        ref={containerRef}
        className="w-full block"
        style={{ height: `${chartHeight}px` }}
        id="lightweight-leaderboard-chart-container"
      />
    </div>
  );
};
