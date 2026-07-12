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
}

const parseTimeToChart = (dateStr: string): string | number => {
  if (dateStr.includes(':') || dateStr.includes(' ')) {
    const clean = dateStr.replace(' ', 'T');
    const d = new Date(clean + 'Z');
    const ts = Math.floor(d.getTime() / 1000);
    return isNaN(ts) ? dateStr : ts;
  }
  return dateStr;
};

export const VolumeChart: React.FC<VolumeChartProps> = ({
  candles,
  height,
  priceChart,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const volumeSeriesRef = useRef<any>(null);
  const firstCandleDateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;

    const firstCandleDate = candles[0].date;

    // Recreate only if stock/dataset changes
    if (chartRef.current) {
      if (firstCandleDateRef.current === firstCandleDate) {
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

    try {
      const container = containerRef.current;
      
      chart = createChart(container, {
        width: container.clientWidth || 300,
        height: height,
        handleScale: false,
        handleScroll: false,
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
          priceFormatter: (value: number) => {
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

      chartRef.current = chart;
      firstCandleDateRef.current = firstCandleDate;

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
          if (width && Math.abs(width - lastWidth) > 1 && chartRef.current) {
            lastWidth = width;
            if (resizeAnimationFrameId !== null) {
              cancelAnimationFrame(resizeAnimationFrameId);
            }
            resizeAnimationFrameId = requestAnimationFrame(() => {
              try {
                if (chartRef.current) {
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
      // Clean up handled on unmount
    };
  }, [candles[0]?.date, height]);

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
      className="w-full block border-t border-slate-800/60 bg-slate-950"
      style={{ height: `${height}px` }}
      id="volume-chart-container"
    />
  );
};
