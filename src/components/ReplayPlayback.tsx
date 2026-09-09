import { useEffect, useMemo, useState } from 'react';
import { Play, Pause, SkipBack, SkipForward, RotateCcw } from 'lucide-react';
import ReplayChart from './ReplayChart';
import type { MarketDataRow } from '../lib/marketDataNormalize';
import type { ReplayTrade } from '../lib/replayPosition';
import { clampCursor, stepForward, stepBackward, isAtEnd } from '../lib/playbackCursor';

// ponytail: 임의 기본값(약 한 달치 거래일 기준) - 데이터셋 맨 앞부터 보여줄 캔들 개수.
// 필요해지면 prop으로 노출.
const INITIAL_REVEAL = 30;

const SPEED_MS = { slow: 1000, normal: 500, fast: 200 } as const;
type Speed = keyof typeof SPEED_MS;
const SPEED_LABEL: Record<Speed, string> = { slow: '느리게', normal: '보통', fast: '빠르게' };

export default function ReplayPlayback({
  rows,
  trades,
  avgCost,
  position,
  onCursorChange,
}: {
  rows: MarketDataRow[];
  trades?: ReplayTrade[];
  avgCost?: number;
  position?: number;
  onCursorChange?: (cursor: number, row: MarketDataRow) => void;
}) {
  const [cursor, setCursor] = useState(() => clampCursor(INITIAL_REVEAL, rows.length));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>('normal');

  useEffect(() => {
    setCursor(clampCursor(INITIAL_REVEAL, rows.length));
    setIsPlaying(false);
  }, [rows]);

  useEffect(() => {
    if (rows.length > 0) onCursorChange?.(cursor, rows[cursor - 1]);
  }, [cursor, rows]);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(() => {
      setCursor((c) => {
        const next = stepForward(c, rows.length);
        if (isAtEnd(next, rows.length)) setIsPlaying(false);
        return next;
      });
    }, SPEED_MS[speed]);
    return () => clearInterval(id);
  }, [isPlaying, speed, rows.length]);

  // rows.slice()는 매 렌더마다 새 배열을 만든다 - cursor/rows가 그대로인데
  // 부모가 다른 이유(예: 거래 기록 갱신)로 재렌더될 때도 새 참조가 나가면
  // ReplayChart가 "한 칸 전진"으로 오인해 리빌 모션이 중간에 끊긴다.
  const visibleRows = useMemo(() => rows.slice(0, cursor), [rows, cursor]);

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-[400px] lg:h-[520px] text-slate-500 text-sm">
        표시할 데이터가 없습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <ReplayChart rows={visibleRows} trades={trades} avgCost={avgCost} position={position} />

      <div className="flex flex-wrap items-center gap-2 px-2">
        <button onClick={() => setCursor(stepBackward(cursor))} className="p-2 text-slate-300" aria-label="이전 구간">
          <SkipBack size={18} />
        </button>
        <button
          onClick={() => setIsPlaying((p) => !p)}
          className="p-2 text-slate-100"
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>
        <button
          onClick={() => setCursor(stepForward(cursor, rows.length))}
          className="p-2 text-slate-300"
          aria-label="다음 구간"
        >
          <SkipForward size={18} />
        </button>
        <button
          onClick={() => {
            setCursor(clampCursor(INITIAL_REVEAL, rows.length));
            setIsPlaying(false);
          }}
          className="p-2 text-slate-300"
          aria-label="처음으로"
        >
          <RotateCcw size={18} />
        </button>

        <input
          type="range"
          min={1}
          max={rows.length}
          value={cursor}
          onChange={(e) => setCursor(clampCursor(Number(e.target.value), rows.length))}
          className="flex-1 min-w-[80px]"
        />

        <span className="text-xs text-slate-500 tabular-nums">
          {cursor} / {rows.length}
        </span>

        <div className="flex gap-1">
          {(Object.keys(SPEED_MS) as Speed[]).map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`text-[10px] px-1.5 py-0.5 rounded ${speed === s ? 'bg-slate-700 text-slate-100' : 'text-slate-500'}`}
            >
              {SPEED_LABEL[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
