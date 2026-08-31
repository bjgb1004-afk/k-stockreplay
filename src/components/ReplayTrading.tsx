import { useEffect, useState } from 'react';
import ReplayPlayback from './ReplayPlayback';
import { Section } from './ui';
import type { MarketDataRow } from '../lib/marketDataNormalize';
import { startSession, recordTrade, getSessionTrades } from '../lib/replayTradesStore';
import { computePosition, computeRemainingCash, type ReplayTrade } from '../lib/replayPosition';
import { calculateProfitLoss } from '../calculations/profitLoss';

const DEFAULT_CAPITAL = 1000000;

export default function ReplayTrading({ datasetId, rows }: { datasetId: string; rows: MarketDataRow[] }) {
  const [capital, setCapital] = useState<number | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [trades, setTrades] = useState<ReplayTrade[]>([]);
  const [current, setCurrent] = useState<{ cursor: number; row: MarketDataRow } | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (capital === null) return;
    startSession(datasetId, capital).then((id) => {
      setSessionId(id);
      return getSessionTrades(id);
    }).then(setTrades);
  }, [datasetId, capital]);

  if (capital === null) {
    return <CapitalGate onStart={setCapital} />;
  }

  const position = computePosition(trades);
  const remainingCash = computeRemainingCash(capital, trades);
  const { closedTrades, totalProfit, avgCost } = calculateProfitLoss(trades);
  const profitBySellId = new Map(closedTrades.map((c) => [c.sell.id, c.profit]));

  const price = current?.row.close ?? 0;
  const canBuy = !!current && !busy && quantity > 0 && quantity * price <= remainingCash;
  const canSell = !!current && !busy && quantity > 0 && quantity <= position;

  async function trade(type: 'buy' | 'sell') {
    if (!sessionId || !current || busy) return;
    setBusy(true);
    const recorded = await recordTrade({
      sessionId,
      cursor: current.cursor,
      date: current.row.date,
      type,
      price: current.row.close,
      quantity,
    });
    setTrades((prev) => [...prev, recorded]);
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <ReplayPlayback
        rows={rows}
        trades={trades}
        avgCost={avgCost}
        position={position}
        onCursorChange={(cursor, row) => setCurrent({ cursor, row })}
      />

      <div className="flex gap-2 px-2 text-xs text-slate-400">
        <span>잔여 현금 <span className="text-slate-100 tabular-nums">{remainingCash.toLocaleString()}원</span></span>
        {position > 0 && (
          <span>· 보유 {position}주 평단 <span className="text-slate-100 tabular-nums">{Math.round(avgCost).toLocaleString()}원</span></span>
        )}
      </div>

      {/* 분할매수 퍼센트 버튼 - 잔여 현금의 n%만큼 살 수 있는 수량을 계산해서 채워준다.
          바로 매수하지 않고 수량 입력칸만 채우는 이유: 매도 시에도 같은 수량칸을
          쓰는데, 매도까지 "잔여 현금 기준 %"로 계산하면 의미가 이상해지기 때문 -
          채워진 수량은 매수/매도 아무 쪽이든 그대로 눌러서 확정한다. */}
      <div className="flex gap-1 px-2">
        {[10, 25, 50, 100].map((pct) => (
          <button
            key={pct}
            onClick={() => price > 0 && setQuantity(Math.floor((remainingCash * pct) / 100 / price))}
            disabled={price <= 0}
            className="flex-1 text-[11px] py-1 rounded bg-slate-900 text-slate-400 disabled:opacity-30"
          >
            {pct}%
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 px-2">
        <input
          type="number"
          min={1}
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
          className="w-20 bg-slate-900 border border-slate-800 rounded-lg px-2 py-2 text-sm text-center"
          aria-label="수량"
        />
        <span className="text-xs text-slate-500">주</span>
        <button
          onClick={() => trade('buy')}
          disabled={!canBuy}
          className="flex-1 bg-emerald-600 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-30"
        >
          매수
        </button>
        <button
          onClick={() => trade('sell')}
          disabled={!canSell}
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

// 1,000,000 -> "100만원" 같은 한글 단위 표기 - 콤마 숫자만으로는 자릿수가
// 바로 안 읽혀서 만/억 단위로 보조 표시한다.
function toKoreanUnit(n: number): string {
  if (n === 0) return '0원';
  const eok = Math.floor(n / 100000000);
  const man = Math.floor((n % 100000000) / 10000);
  const won = n % 10000;
  const parts: string[] = [];
  if (eok > 0) parts.push(`${eok}억`);
  if (man > 0) parts.push(`${man}만`);
  if (won > 0 || parts.length === 0) parts.push(`${won}`);
  return parts.join(' ') + '원';
}

function CapitalGate({ onStart }: { onStart: (capital: number) => void }) {
  const [capital, setCapital] = useState(DEFAULT_CAPITAL);
  const valid = capital > 0;

  return (
    <Section title="투자금 설정">
      <div className="space-y-2">
        <input
          type="text"
          inputMode="numeric"
          value={capital.toLocaleString()}
          onChange={(e) => setCapital(Number(e.target.value.replace(/[^0-9]/g, '')) || 0)}
          placeholder="투자금 (원)"
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm placeholder:text-slate-600 focus:outline-none focus:border-cyan-600"
        />
        <p className="text-xs text-slate-500">{toKoreanUnit(capital)}</p>
        <button
          onClick={() => valid && onStart(capital)}
          disabled={!valid}
          className="w-full bg-slate-100 text-slate-950 rounded-lg py-2 text-sm font-medium disabled:opacity-40"
        >
          시작
        </button>
      </div>
    </Section>
  );
}
