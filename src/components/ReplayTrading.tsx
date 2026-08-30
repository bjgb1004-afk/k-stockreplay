import { useEffect, useState } from 'react';
import ReplayPlayback from './ReplayPlayback';
import type { MarketDataRow } from '../lib/marketDataNormalize';
import { startSession, recordTrade, getSessionTrades } from '../lib/replayTradesStore';
import { computePosition, type ReplayTrade } from '../lib/replayPosition';
import { calculateProfitLoss } from '../calculations/profitLoss';

// ponytail: 고정 1주 - 가상 포지션 크기 조절이 필요해지면 입력값으로 뺀다.
const QUANTITY = 1;

export default function ReplayTrading({ datasetId, rows }: { datasetId: string; rows: MarketDataRow[] }) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trades, setTrades] = useState<ReplayTrade[]>([]);
  const [current, setCurrent] = useState<{ cursor: number; row: MarketDataRow } | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    startSession(datasetId).then((id) => {
      setSessionId(id);
      return getSessionTrades(id);
    }).then(setTrades);
  }, [datasetId]);

  const position = computePosition(trades);
  const { closedTrades, totalProfit } = calculateProfitLoss(trades);
  const profitBySellId = new Map(closedTrades.map((c) => [c.sell.id, c.profit]));

  async function trade(type: 'buy' | 'sell') {
    if (!sessionId || !current || busy) return;
    setBusy(true);
    const recorded = await recordTrade({
      sessionId,
      cursor: current.cursor,
      date: current.row.date,
      type,
      price: current.row.close,
      quantity: QUANTITY,
    });
    setTrades((prev) => [...prev, recorded]);
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <ReplayPlayback rows={rows} onCursorChange={(cursor, row) => setCurrent({ cursor, row })} />

      <div className="flex gap-2 px-2">
        <button
          onClick={() => trade('buy')}
          disabled={position > 0 || busy || !current}
          className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-30"
        >
          매수
        </button>
        <button
          onClick={() => trade('sell')}
          disabled={position <= 0 || busy || !current}
          className="flex-1 bg-red-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-30"
        >
          매도
        </button>
      </div>

      {trades.length > 0 && (
        <ul className="px-2 space-y-1">
          {trades.map((t) => (
            <li key={t.id} className="flex justify-between text-xs text-slate-400">
              <span>{t.date}</span>
              <span className={t.type === 'buy' ? 'text-emerald-400' : 'text-red-400'}>
                {t.type === 'buy' ? '매수' : '매도'} {t.quantity}주
              </span>
              <span className="tabular-nums">{t.price.toLocaleString()}</span>
              {t.type === 'sell' && profitBySellId.has(t.id) && (
                <span className={`tabular-nums ${profitBySellId.get(t.id)! >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {profitBySellId.get(t.id)! >= 0 ? '+' : ''}{profitBySellId.get(t.id)!.toLocaleString()}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {closedTrades.length > 0 && (
        <p className={`px-2 text-sm font-medium ${totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          총 손익 {totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString()}
        </p>
      )}
    </div>
  );
}
