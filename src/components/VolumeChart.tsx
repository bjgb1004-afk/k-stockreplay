/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect } from 'react';
import { createChart, HistogramSeries } from 'lightweight-charts';
import { Candle } from '../types';

interface VolumeChartProps {
  candles: Candle[];
  height: number;
  priceChart: any;
  gameMode: 'daily' | 'minute';
}

const parseTimeToChart = (dateStr: string): string | number => {
  if (!dateStr) return dateStr;
  
  // Format: "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm"
  if (dateStr.includes('-') && (dateStr.includes(':') || dateStr.includes(' '))) {
    const clean = dateStr.replace(' ', 'T');
    const isoStr = clean.endsWith('Z') ? clean : clean + 'Z';
    const d = new Date(isoStr);
    const ts = Math.floor(d.getTime() / 1000);
    if (!isNaN(ts)) return ts;
  }
  
  // Format: "HH:mm:ss" or "HH:mm" (today's time)
  if (dateStr.includes(':') && !dateStr.includes('-')) {
    const todayStr = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().split('T')[0];
    const fullStr = `${todayStr}T${dateStr}Z`;
    const d = new Date(fullStr);
    const ts = Math.floor(d.getTime() / 1000);
    if (!isNaN(ts)) return ts;
  }

  return dateStr;
};

export const VolumeChart: React.FC<VolumeChartProps> = ({
  candles,
  height,
  priceChart,
  gameMode,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const firstCandleDateRef = useRef<string | null>(null);
  const lastGameModeRef = useRef<'daily' | 'minute' | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const firstCandleDate = candles[0].date;

    // Recreate only if stock/dataset or gameMode changes
    if (chartRef.current) {
      if (firstCandleDateRef.current === firstCandleDate && lastGameModeRef.current === gameMode) {
        return;
      } else {
        try {
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
        volumeSeriesRef.current = null;
      }
    }

    let chart: any = null;
    let resizeObserver: ResizeObserver | null = null;
    let resizeAnimationFrameId: number | null = null;
    let isChartActive = true;

    try {
      const container = containerRef.current;
      
      chart = createChart(container, {
        width: container.clientWidth || 300,
        height: height,
        handleScale: false,
        handleScroll: false,
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
          priceFormatter: (value: number) => {
            return (value / 100000000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '억';
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
          borderColor: 'rgba(51, 65, 85, 0.3)',
          timeVisible: true,
          secondsVisible: false,
          tickMarkFormatter: (time: any) => {
            if (typeof time === 'number') {
              const date = new Date(time * 1000);
              const hour = String(date.getUTCHours()).padStart(2, '0');
              const minute = String(date.getUTCMinutes()).padStart(2, '0');
              return `${hour}:${minute}`;
            }
            return time;
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
          console.warn('[VolumeChart] Dark mode toggle failed:', e);
        }
      });
      (chart as any).__observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });


      chartRef.current = chart;
      firstCandleDateRef.current = firstCandleDate;
      lastGameModeRef.current = gameMode;

      const volumeSeries = chart.addSeries(HistogramSeries, {
        priceFormat: {
          type: 'custom',
          formatter: (value: number) => {
            return (value / 100000000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '억';
          },
        },
      });
      volumeSeriesRef.current = volumeSeries;

      // Fit content initial
      chart.timeScale().applyOptions({
        barSpacing: 6,
        rightOffset: 5,
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
                  chartRef.current.resize(width, height);
                }
              } catch (err) {}
            });
          }
        }
      });
      resizeObserver.observe(container);

    } catch (err) {
      console.error('Failed to initialize lightweight-charts in VolumeChart:', err);
    }

    return () => {
      isChartActive = false;
      if (resizeObserver) resizeObserver.disconnect();
      if (resizeAnimationFrameId !== null) {
        cancelAnimationFrame(resizeAnimationFrameId);
      }
    };
  }, [candles[0]?.date, height, gameMode, priceChart]);

  // Effect to update Volume Series Data
  useEffect(() => {
    if (!chartRef.current || !volumeSeriesRef.current || candles.length === 0) return;

    const volumeData: any[] = [];
    for (let i = 0; i < candles.length; i++) {
      const item = candles[i];
      const chartTime = parseTimeToChart(item.date);
      const isUp = item.close >= item.open;
      const rawVol = Number(item.volume);
      const safeVol = isNaN(rawVol) || rawVol < 0 ? 0 : rawVol;

      volumeData.push({
        time: chartTime,
        value: safeVol * item.close,
        color: isUp ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)',
      });
    }

    volumeSeriesRef.current.setData(volumeData);

    if (candles.length === 1) {
      chartRef.current.timeScale().fitContent();
    } else if (priceChart) {
      const priceTimeScale = priceChart.timeScale();
      const volumeTimeScale = chartRef.current.timeScale();
      const currentRange = priceTimeScale.getVisibleLogicalRange();
      if (currentRange) {
        volumeTimeScale.setVisibleLogicalRange(currentRange);
      }
    }
  }, [candles, priceChart]);

  // Clean up chart on complete component unmount
  useEffect(() => {
    return () => {
      if (chartRef.current) {
        try {
          chartRef.current.remove();
        } catch (e) {}
        chartRef.current = null;
      }
    };
  }, []);

  // Synchronize Timescales between Price Chart and Volume Chart
  useEffect(() => {
    const volumeChart = chartRef.current;
    if (!priceChart || !volumeChart) return;

    const priceTimeScale = priceChart.timeScale();
    const volumeTimeScale = volumeChart.timeScale();

    let isSyncing = false;

    const onPriceLogicalRangeChange = (range: any) => {
      if (isSyncing || !range) return;
      isSyncing = true;
      volumeTimeScale.setVisibleLogicalRange(range);
      isSyncing = false;
    };

    const onVolumeLogicalRangeChange = (range: any) => {
      if (isSyncing || !range) return;
      isSyncing = true;
      priceTimeScale.setVisibleLogicalRange(range);
      isSyncing = false;
    };

    priceTimeScale.subscribeVisibleLogicalRangeChange(onPriceLogicalRangeChange);
    volumeTimeScale.subscribeVisibleLogicalRangeChange(onVolumeLogicalRangeChange);

    // Initial sync
    const initialRange = priceTimeScale.getVisibleLogicalRange();
    if (initialRange) {
      volumeTimeScale.setVisibleLogicalRange(initialRange);
    }

    return () => {
      try {
        priceTimeScale.unsubscribeVisibleLogicalRangeChange(onPriceLogicalRangeChange);
        volumeTimeScale.unsubscribeVisibleLogicalRangeChange(onVolumeLogicalRangeChange);
      } catch (e) {}
    };
  }, [priceChart]);

  return (
    <div
      ref={containerRef}
      className="w-full block border-t border-slate-200 dark:border-slate-800/60 bg-white dark:bg-slate-950"
      style={{ height: `${height}px` }}
      id="volume-chart-container"
    />
  );
};
