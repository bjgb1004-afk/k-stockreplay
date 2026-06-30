/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, LineSeries, createSeriesMarkers } from 'lightweight-charts';
import { Candle, Trade } from '../types';

interface ReplayChartProps {
  candles: Candle[];
  trades: Trade[];
  averagePrice?: number;
}

export const ReplayChart: React.FC<ReplayChartProps> = ({ candles, trades, averagePrice }) => {
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
          timeVisible: false,
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
          minMove: 1,
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
          type: 'volume',
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

        candlestickData.push({
          time: dateStr,
          open: item.open,
          high: item.high,
          low: item.low,
          close: item.close,
        });

        const isUp = item.close >= item.open;
        volumeData.push({
          time: dateStr,
          value: item.volume,
          color: isUp ? 'rgba(239, 68, 68, 0.25)' : 'rgba(59, 130, 246, 0.25)',
        });

        // Calculate MA 5
        if (i >= 4) {
          let sum = 0;
          for (let k = 0; k < 5; k++) sum += candles[i - k].close;
          ma5Data.push({ time: dateStr, value: sum / 5 });
        }

        // Calculate MA 20
        if (i >= 19) {
          let sum = 0;
          for (let k = 0; k < 20; k++) sum += candles[i - k].close;
          ma20Data.push({ time: dateStr, value: sum / 20 });
        }
      }

      candlestickSeries.setData(candlestickData);
      volumeSeries.setData(volumeData);
      if (ma5Data.length > 0) ma5Series.setData(ma5Data);
      if (ma20Data.length > 0) ma20Series.setData(ma20Data);

      // 6. Draw Execution Buy/Sell Markers (Sorted chronologically)
      const markers = trades
        .filter(t => candles.some(c => c.date === t.date))
        .map(trade => {
          const isBuy = trade.type === 'BUY';
          return {
            time: trade.date,
            position: isBuy ? 'belowBar' : 'aboveBar' as any,
            color: isBuy ? '#22c55e' : '#eab308',
            shape: isBuy ? 'arrowUp' : 'arrowDown' as any,
            text: isBuy ? '매수' : '매도',
            size: 1.2,
          };
        })
        .sort((a, b) => a.time.localeCompare(b.time));

      createSeriesMarkers(candlestickSeries, markers);

      // 7. Subscribe to Hover / Crosshair Move
      chart.subscribeCrosshairMove((param: any) => {
        if (!param || !param.time || param.point === undefined) {
          setHoverCandle(null);
          return;
        }
        const timeStr = param.time as string;
        const matchedCandle = candles.find(c => c.date === timeStr);
        if (matchedCandle) {
          setHoverCandle(matchedCandle);
        } else {
          setHoverCandle(null);
        }
      });

      // 8. Fit Content
      chart.timeScale().fitContent();

      // 9. Resize Observer
      resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          if (width && width > 0 && chart) {
            try {
              const currentHeight = window.innerWidth < 640 ? 280 : 420;
              chart.resize(width, currentHeight);
              chart.timeScale().fitContent();
            } catch (err) {}
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
      if (chart) {
        try {
          chart.remove();
        } catch (e) {}
      }
      chartRef.current = null;
    };
  }, [candles, trades, averagePrice]);

  // Fallback to last candle if not hovering
  const activeCandle = hoverCandle || candles[candles.length - 1];
  const isUp = activeCandle ? activeCandle.close >= activeCandle.open : true;
  const changeAmt = activeCandle ? activeCandle.close - activeCandle.open : 0;
  const changePct = activeCandle ? (changeAmt / activeCandle.open) * 100 : 0;

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-xl" id="chart-panel">
      {/* Static OHLC & Indicator Top Bar Header to avoid overlap on mobile */}
      {activeCandle && (
        <div className="w-full bg-slate-900 border-b border-slate-800/80 p-3 flex flex-col gap-2 z-10" id="ohlc-header">
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
              <span className="text-slate-500">거래량:</span>
              <span className="text-slate-300 font-medium">{activeCandle.volume.toLocaleString()}주</span>
            </div>
          </div>

          {/* Indicators Legend */}
          <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-mono border-t border-slate-800/40 pt-1.5" id="indicator-legend">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[8px] mr-1">지표:</span>
            <span className="text-[#eab308] flex items-center gap-1 bg-[#eab308]/5 px-1.5 py-0.5 rounded border border-[#eab308]/10">
              <span className="h-1.5 w-1.5 rounded-full bg-[#eab308]" /> 5일선 (MA 5)
            </span>
            <span className="text-[#d946ef] flex items-center gap-1 bg-[#d946ef]/5 px-1.5 py-0.5 rounded border border-[#d946ef]/10">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d946ef]" /> 20일선 (MA 20)
            </span>
          </div>
        </div>
      )}

      {/* Loading Placeholder */}
      {candles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-400 z-50">
          <span className="animate-pulse">데이터 로딩 중...</span>
        </div>
      )}

      {/* Lightweight Chart DOM container */}
      <div
        ref={containerRef}
        className="w-full block"
        style={{ height: `${chartHeight}px` }}
        id="lightweight-chart-container"
      />
    </div>
  );
};
