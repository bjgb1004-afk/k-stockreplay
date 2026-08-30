import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, ColorType } from 'lightweight-charts';
import type { MarketDataRow } from '../lib/marketDataNormalize';

const UP_COLOR = '#26a69a';
const DOWN_COLOR = '#ef5350';

export default function ReplayChart({ rows }: { rows: MarketDataRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || rows.length === 0) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#cbd5e1',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      width: container.clientWidth,
      height: 400,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderVisible: false,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });
    candleSeries.setData(
      rows.map((row) => ({ time: row.date, open: row.open, high: row.high, low: row.low, close: row.close }))
    );

    // 별도 priceScaleId('volume')를 주면 캔들 스케일과 겹치지 않으면서도
    // 우측에 별도 축을 그리지 않는 오버레이가 된다 (라이브러리 공식 거래량 예제 패턴).
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: UP_COLOR,
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeSeries.setData(
      rows.map((row) => ({
        time: row.date,
        value: row.volume,
        color: row.close >= row.open ? UP_COLOR : DOWN_COLOR,
      }))
    );

    chart.timeScale().fitContent();

    function handleResize() {
      chart.applyOptions({ width: container!.clientWidth });
    }
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] text-slate-500 text-sm">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-[400px]" />;
}
