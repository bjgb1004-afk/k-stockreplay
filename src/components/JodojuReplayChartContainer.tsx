import React, { useEffect, useState } from 'react';
import { ReplayChart } from './ReplayChart';
import { Candle } from '../types';
import { Loader2 } from 'lucide-react';

interface JodojuReplayChartContainerProps {
  ticker: string;
  reportDate: string;
}

export const JodojuReplayChartContainer: React.FC<JodojuReplayChartContainerProps> = ({ ticker, reportDate }) => {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!ticker) return;

    const fetchDailyData = async () => {
      setLoading(true);
      try {
        const cleanTicker = ticker.replace(/\.(KS|KQ)$/i, '').trim();
        const res = await fetch(`/api/stock-data?ticker=${cleanTicker}&timeframe=day&date=${reportDate}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Data fetch failed');
        const data = await res.json();
        if (Array.isArray(data.candles)) {
          setCandles(data.candles);
        }
      } catch (err) {
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDailyData();
  }, [ticker, reportDate]);

  if (loading) return <div className="h-[420px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-400" /></div>;

  return <ReplayChart candles={candles} trades={[]} />;
};
