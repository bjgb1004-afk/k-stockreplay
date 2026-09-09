import { useEffect, useRef, useState } from 'react';
import { createChart, createSeriesMarkers, CandlestickSeries, HistogramSeries, LineSeries, ColorType } from 'lightweight-charts';
import type { IChartApi, ISeriesApi, ISeriesMarkersPluginApi, IPriceLine, Time } from 'lightweight-charts';
import type { MarketDataRow } from '../lib/marketDataNormalize';
import type { ReplayTrade } from '../lib/replayPosition';
import { computeSMA } from '../lib/movingAverage';

const UP_COLOR = '#26a69a';
const DOWN_COLOR = '#ef5350';
const AVG_COST_COLOR = '#f0b90b';

const MA_CONFIG = [
  { period: 5, color: '#38bdf8' },
  { period: 20, color: '#fb923c' },
  { period: 60, color: '#a78bfa' },
  { period: 120, color: '#f472b6' },
];
const DEFAULT_MA_PERIODS = [5, 20];

export default function ReplayChart({
  rows,
  trades,
  avgCost,
  position,
}: {
  rows: MarketDataRow[];
  trades?: ReplayTrade[];
  avgCost?: number;
  position?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const avgCostLineRef = useRef<IPriceLine | null>(null);
  const maSeriesRef = useRef<Map<number, ISeriesApi<'Line'>>>(new Map());
  const hasFitRef = useRef(false);
  const prevLenRef = useRef(0);
  const animTimerRef = useRef<number | null>(null);
  const [enabledMA, setEnabledMA] = useState<Set<number>>(new Set(DEFAULT_MA_PERIODS));

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
    markersRef.current = createSeriesMarkers(candleSeries, []);

    return () => {
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      markersRef.current = null;
      avgCostLineRef.current = null;
      maSeriesRef.current.clear();
    };
  }, []);

  useEffect(() => {
    const candleSeries = candleRef.current;
    const volumeSeries = volumeRef.current;
    if (!candleSeries || !volumeSeries) return;

    if (animTimerRef.current !== null) {
      clearInterval(animTimerRef.current);
      animTimerRef.current = null;
    }

    // lightweight-charts는 time 기준 엄격 오름차순만 허용한다 - 같은 날짜가
    // 두 번 나오면(증권사 파일 중복행, 또는 일중 데이터를 날짜 단위로 뭉갠 경우)
    // setData가 예외를 던진다. 여기서 걸러내는 게 이 컴포넌트가 신뢰 경계이기
    // 때문에 맞는 위치다 - 업로드 파일 내용을 통제할 수 없다.
    const monotonic = rows.filter((row, i) => i === 0 || row.date > rows[i - 1].date);
    const toCandle = (row: MarketDataRow) => ({ time: row.date, open: row.open, high: row.high, low: row.low, close: row.close });
    const toVolume = (row: MarketDataRow) => ({
      time: row.date,
      value: row.volume,
      color: row.close >= row.open ? UP_COLOR : DOWN_COLOR,
    });

    // 재생 중 한 칸씩 전진할 때만(직전보다 정확히 1개 늘었을 때) 리빌 모션을 준다 -
    // 슬라이더로 여러 칸 건너뛰거나 "처음으로"로 되돌아갈 때까지 매번 흔들면 어지럽다.
    const isSingleStep = prevLenRef.current > 0 && monotonic.length === prevLenRef.current + 1;
    prevLenRef.current = monotonic.length;

    if (isSingleStep) {
      const settled = monotonic.slice(0, -1);
      const last = monotonic[monotonic.length - 1];
      candleSeries.setData(settled.map(toCandle));
      volumeSeries.setData(settled.map(toVolume));

      // 종가가 바로 뜨는 대신 시가->고가->저가->종가 순으로 짧게 흔들다 확정한다.
      const wiggle = [last.open, last.high, last.low, last.close];
      let step = 0;
      animTimerRef.current = window.setInterval(() => {
        candleSeries.update({ time: last.date, open: last.open, high: last.high, low: last.low, close: wiggle[step] });
        step += 1;
        if (step >= wiggle.length) {
          volumeSeries.update(toVolume(last));
          if (animTimerRef.current !== null) {
            clearInterval(animTimerRef.current);
            animTimerRef.current = null;
          }
        }
      }, 70);
    } else {
      candleSeries.setData(monotonic.map(toCandle));
      volumeSeries.setData(monotonic.map(toVolume));
    }

    // 최초 데이터 적재 때만 화면을 전체 맞춤한다 - 매 프레임(플레이백 재생 중
    // rows가 계속 바뀔 때) fitContent를 다시 부르면 사용자가 맞춰둔 확대/이동이
    // 프레임마다 초기화된다.
    if (!hasFitRef.current && monotonic.length > 0) {
      chartRef.current?.timeScale().fitContent();
      hasFitRef.current = true;
    }

    return () => {
      if (animTimerRef.current !== null) {
        clearInterval(animTimerRef.current);
        animTimerRef.current = null;
      }
    };
  }, [rows]);

  // 매수/매도 지점에 화살표 마커 표시.
  useEffect(() => {
    if (!markersRef.current) return;
    const markers = (trades ?? [])
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((t) => ({
        time: t.date as Time,
        position: t.type === 'buy' ? ('belowBar' as const) : ('aboveBar' as const),
        color: t.type === 'buy' ? UP_COLOR : DOWN_COLOR,
        shape: t.type === 'buy' ? ('arrowUp' as const) : ('arrowDown' as const),
        text: `${t.type === 'buy' ? '매수' : '매도'} ${t.quantity}주`,
      }));
    markersRef.current.setMarkers(markers);
  }, [trades]);

  // 이동평균선 - 켜진 기간만 시리즈로 추가하고, 끄면 완전히 제거한다(끈 채로
  // 숨기기만 하면 다음 rows 갱신 때 옛날 데이터가 다시 그려질 수 있어서 제거가 맞다).
  useEffect(() => {
    const chart = chartRef.current;
    if (!chart) return;
    const monotonic = rows.filter((row, i) => i === 0 || row.date > rows[i - 1].date);

    for (const { period, color } of MA_CONFIG) {
      const existing = maSeriesRef.current.get(period);
      if (enabledMA.has(period)) {
        const series = existing ?? chart.addSeries(LineSeries, {
          color,
          lineWidth: 1,
          priceLineVisible: false,
          lastValueVisible: false,
        });
        if (!existing) maSeriesRef.current.set(period, series);
        series.setData(computeSMA(monotonic, period));
      } else if (existing) {
        chart.removeSeries(existing);
        maSeriesRef.current.delete(period);
      }
    }
  }, [rows, enabledMA]);

  // 보유 중일 때만 평단가 가로선을 보여주고, 청산되면 지운다.
  useEffect(() => {
    const candleSeries = candleRef.current;
    if (!candleSeries) return;

    if (!position || position <= 0 || !avgCost) {
      if (avgCostLineRef.current) {
        candleSeries.removePriceLine(avgCostLineRef.current);
        avgCostLineRef.current = null;
      }
      return;
    }

    if (avgCostLineRef.current) {
      avgCostLineRef.current.applyOptions({ price: avgCost });
    } else {
      avgCostLineRef.current = candleSeries.createPriceLine({
        price: avgCost,
        color: AVG_COST_COLOR,
        lineWidth: 1,
        lineStyle: 2,
        axisLabelVisible: true,
        title: '평단가',
      });
    }
  }, [avgCost, position]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] lg:h-[520px] text-slate-500 text-sm">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  function toggleMA(period: number) {
    setEnabledMA((prev) => {
      const next = new Set(prev);
      if (next.has(period)) next.delete(period);
      else next.add(period);
      return next;
    });
  }

  return (
    <div>
      <div className="flex gap-1 mb-2">
        {MA_CONFIG.map(({ period, color }) => (
          <button
            key={period}
            onClick={() => toggleMA(period)}
            style={enabledMA.has(period) ? { color, borderColor: color } : undefined}
            className={`text-[11px] px-2 py-1 rounded border ${
              enabledMA.has(period) ? 'bg-slate-900' : 'bg-slate-900 border-transparent text-slate-600'
            }`}
          >
            {period}일선
          </button>
        ))}
      </div>
      <div ref={containerRef} className="w-full h-[400px] lg:h-[520px]" />
    </div>
  );
}
