import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi } from 'lightweight-charts';
import type { MarketDataRow } from '../lib/marketDataNormalize';

const UP_COLOR = '#26a69a';
const DOWN_COLOR = '#ef5350';

export default function ReplayChart({ rows }: { rows: MarketDataRow[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const hasFitRef = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      layout: {
        background: { type: ColorType.Solid, color: '#0f172a' },
        textColor: '#cbd5e1',
      },
      grid: {
        vertLines: { color: '#1e293b' },
        horzLines: { color: '#1e293b' },
      },
      autoSize: true,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderVisible: false,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    });

    // 별도 priceScaleId('volume')를 주면 캔들 스케일과 겹치지 않으면서도
    // 우측에 별도 축을 그리지 않는 오버레이가 된다 (라이브러리 공식 거래량 예제 패턴).
    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: UP_COLOR,
      priceScaleId: 'volume',
      priceFormat: { type: 'volume' },
    });
    volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const candleSeries = candleRef.current;
    const volumeSeries = volumeRef.current;
    if (!candleSeries || !volumeSeries) return;

    // lightweight-charts는 time 기준 엄격 오름차순만 허용한다 - 같은 날짜가
    // 두 번 나오면(증권사 파일 중복행, 또는 일중 데이터를 날짜 단위로 뭉갠 경우)
    // setData가 예외를 던진다. 여기서 걸러내는 게 이 컴포넌트가 신뢰 경계이기
    // 때문에 맞는 위치다 - 업로드 파일 내용을 통제할 수 없다.
    const monotonic = rows.filter((row, i) => i === 0 || row.date > rows[i - 1].date);

    candleSeries.setData(
      monotonic.map((row) => ({ time: row.date, open: row.open, high: row.high, low: row.low, close: row.close }))
    );
    volumeSeries.setData(
      monotonic.map((row) => ({
        time: row.date,
        value: row.volume,
        color: row.close >= row.open ? UP_COLOR : DOWN_COLOR,
      }))
    );

    // 최초 데이터 적재 때만 화면을 전체 맞춤한다 - 매 프레임(플레이백 재생 중
    // rows가 계속 바뀔 때) fitContent를 다시 부르면 사용자가 맞춰둔 확대/이동이
    // 프레임마다 초기화된다.
    if (!hasFitRef.current && monotonic.length > 0) {
      chartRef.current?.timeScale().fitContent();
      hasFitRef.current = true;
    }
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
