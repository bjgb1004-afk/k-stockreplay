import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from './supabase';
import type { MarketDataRow } from './marketDataNormalize';

// 리플레이 방: 여러 명이 같은 과거 차트를 같은 속도로 보며 가상매매하고 수익률 순위를 겨룬다.
// Supabase Realtime의 Broadcast(진행 신호·점수)와 Presence(누가 방에 있나)만 쓰고 DB 테이블은 안 쓴다.
//
// 무료 한도(동시접속 200, 초당 메시지 100, Presence 초당 20)를 넘지 않게:
//  - 방 정원 20명, 방은 ROOM_COUNT개 → 최대 200명
//  - 진행 신호는 방장 1명만 2초에 1번, 점수는 매매할 때 + 10초에 1번
//  - Presence는 입장·퇴장 때만 (점수를 presence로 보내지 않는다)
//  - 탭을 숨긴 채 1분이 지나면 연결을 끊는다
// 연결이 안 되면(설정 없음·한도 초과·오류) 같은 게임을 혼자 모드로 이어서 할 수 있다.

export const ROOM_COUNT = 10;
export const ROOM_CAPACITY = 20;
export const WARMUP = 120; // 시작할 때 이미 보여주는 봉 수
export const PLAY_CANDLES = 60; // 한 판 동안 새로 열리는 봉 수
export const TICK_MS = 2000;
export const RESULT_MS = 12000;
export const START_CASH = 10_000_000;
const SCORE_EVERY_TICKS = 5;
const HIDDEN_LIMIT_MS = 60_000;

export interface PackInfo {
  ticker: string;
  name: string;
  rows: number;
}

export interface GameState {
  gameId: string;
  ticker: string;
  start: number; // rows 배열에서 이 판이 시작하는 위치 (이 앞 WARMUP개를 미리 보여준다)
  idx: number; // 0..PLAY_CANDLES
  phase: 'play' | 'result';
  at: number; // 방장이 이 상태를 보낸 시각
}

export interface Player {
  id: string;
  name: string;
  joinedAt: number;
}

export interface Score {
  id: string;
  name: string;
  ret: number; // 수익률 %
  gameId: string;
}

export type ConnStatus = 'idle' | 'connecting' | 'joined' | 'full' | 'error' | 'solo' | 'paused';

function randomId() {
  return crypto.randomUUID().slice(0, 8);
}

export function pickNewGame(packs: PackInfo[], prev?: GameState | null): GameState | null {
  const usable = packs.filter((p) => p.rows >= WARMUP + PLAY_CANDLES + 1 && p.ticker !== prev?.ticker);
  const list = usable.length ? usable : packs.filter((p) => p.rows >= WARMUP + PLAY_CANDLES + 1);
  if (list.length === 0) return null;
  const pack = list[Math.floor(Math.random() * list.length)];
  const maxStart = pack.rows - PLAY_CANDLES - 1;
  const start = WARMUP + Math.floor(Math.random() * Math.max(1, maxStart - WARMUP + 1));
  return { gameId: randomId(), ticker: pack.ticker, start, idx: 0, phase: 'play', at: Date.now() };
}

// 다음 상태: 봉을 하나 더 열거나, 다 열었으면 결과 화면, 결과 시간이 지나면 새 판.
export function advance(state: GameState, packs: PackInfo[], now = Date.now()): GameState | null {
  if (state.phase === 'play') {
    if (state.idx < PLAY_CANDLES) return { ...state, idx: state.idx + 1, at: now };
    return { ...state, phase: 'result', at: now };
  }
  if (now - state.at >= RESULT_MS) return pickNewGame(packs, state);
  return state;
}

// 방장 = 가장 먼저 들어온 사람 (같으면 id 순). 방장이 나가면 다음 사람이 이어받는다.
export function pickHost(players: Player[]): string | null {
  if (players.length === 0) return null;
  return [...players].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))[0].id;
}

// 정원 판정: 내가 들어온 순서가 정원 밖이면 나간다.
export function isOverCapacity(players: Player[], myId: string, capacity = ROOM_CAPACITY): boolean {
  const order = [...players].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
  const i = order.findIndex((p) => p.id === myId);
  return i >= capacity;
}

// ---- 가상 계좌 (각자 브라우저에서 계산) ----
export interface Account {
  cash: number;
  shares: number;
  avgCost: number;
}

export function trade(acc: Account, side: 'buy' | 'sell', fraction: number, price: number): Account {
  if (price <= 0) return acc;
  if (side === 'buy') {
    const qty = Math.floor((acc.cash * fraction) / price);
    if (qty <= 0) return acc;
    const shares = acc.shares + qty;
    return { cash: acc.cash - qty * price, shares, avgCost: (acc.avgCost * acc.shares + price * qty) / shares };
  }
  const qty = fraction >= 1 ? acc.shares : Math.floor(acc.shares * fraction);
  if (qty <= 0) return acc;
  const shares = acc.shares - qty;
  return { cash: acc.cash + qty * price, shares, avgCost: shares === 0 ? 0 : acc.avgCost };
}

export function equityReturn(acc: Account, price: number): number {
  const equity = acc.cash + acc.shares * price;
  return Math.round(((equity - START_CASH) / START_CASH) * 10000) / 100;
}

const packCache = new Map<string, Promise<MarketDataRow[]>>();
export function loadPack(ticker: string): Promise<MarketDataRow[]> {
  if (!packCache.has(ticker)) {
    packCache.set(
      ticker,
      fetch(`/data/replay/${ticker}.json`).then((r) => (r.ok ? r.json() : Promise.reject(new Error('pack missing'))))
    );
  }
  return packCache.get(ticker)!;
}

/** 방 하나(또는 혼자 모드)의 게임 진행. roomId가 null이면 아무것도 안 한다. */
export function useReplayRoom(roomId: number | null, name: string, packs: PackInfo[], forceSolo: boolean, epoch = 0) {
  const myId = useMemo(() => randomId(), []);
  const [status, setStatus] = useState<ConnStatus>('idle');
  const [players, setPlayers] = useState<Player[]>([]);
  const [state, setState] = useState<GameState | null>(null);
  const [scores, setScores] = useState<Map<string, Score>>(new Map());
  const [rows, setRows] = useState<MarketDataRow[] | null>(null);
  const [account, setAccount] = useState<Account>({ cash: START_CASH, shares: 0, avgCost: 0 });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const stateRef = useRef<GameState | null>(null);
  const playersRef = useRef<Player[]>([]);
  const accountRef = useRef(account);
  const rowsRef = useRef<MarketDataRow[] | null>(null);
  const packsRef = useRef(packs);
  stateRef.current = state;
  playersRef.current = players;
  accountRef.current = account;
  rowsRef.current = rows;
  packsRef.current = packs;

  const solo = forceSolo || !supabaseConfigured;
  const isHost = solo || pickHost(players) === myId;

  const priceNow = useCallback(() => {
    const s = stateRef.current;
    const r = rowsRef.current;
    if (!s || !r) return 0;
    return r[Math.min(r.length - 1, s.start + s.idx - 1)]?.close ?? 0;
  }, []);

  const sendScore = useCallback(() => {
    const s = stateRef.current;
    if (!s) return;
    const score: Score = { id: myId, name, ret: equityReturn(accountRef.current, priceNow()), gameId: s.gameId };
    setScores((m) => new Map(m).set(myId, score));
    channelRef.current?.send({ type: 'broadcast', event: 'score', payload: score });
  }, [myId, name, priceNow]);

  // 새 판이 시작되면 계좌·점수 초기화, 차트 데이터 불러오기
  const gameId = state?.gameId;
  const ticker = state?.ticker;
  useEffect(() => {
    if (!gameId || !ticker) return;
    setAccount({ cash: START_CASH, shares: 0, avgCost: 0 });
    setScores((m) => new Map([...m].filter(([, s]) => s.gameId === gameId)));
    setRows(null);
    let alive = true;
    loadPack(ticker)
      .then((r) => alive && setRows(r))
      .catch(() => alive && setRows([]));
    return () => {
      alive = false;
    };
  }, [gameId, ticker]);

  // 접속 / 혼자 모드
  useEffect(() => {
    if (roomId === null) return;
    setPlayers([]);
    setScores(new Map());
    setState(null);
    if (solo) {
      setStatus('solo');
      setPlayers([{ id: myId, name, joinedAt: Date.now() }]);
      return;
    }
    setStatus('connecting');
    const joinedAt = Date.now();
    const ch = supabase.channel(`replay-room-${roomId}`, { config: { presence: { key: myId }, broadcast: { self: false } } });
    channelRef.current = ch;

    ch.on('presence', { event: 'sync' }, () => {
      const raw = ch.presenceState() as Record<string, Player[]>;
      const list = Object.values(raw).map((arr) => arr[0]).filter(Boolean);
      setPlayers(list);
      if (isOverCapacity(list, myId)) {
        setStatus('full');
        ch.unsubscribe();
        channelRef.current = null;
      }
    });
    ch.on('broadcast', { event: 'state' }, ({ payload }) => {
      const s = payload as GameState;
      // 뒤늦게 온 옛 신호는 무시한다.
      const cur = stateRef.current;
      if (cur && cur.gameId === s.gameId && cur.idx > s.idx && cur.phase === s.phase) return;
      setState(s);
    });
    ch.on('broadcast', { event: 'hello' }, () => {
      if (pickHost(playersRef.current) === myId && stateRef.current) {
        ch.send({ type: 'broadcast', event: 'state', payload: stateRef.current });
      }
    });
    ch.on('broadcast', { event: 'score' }, ({ payload }) => {
      const sc = payload as Score;
      setScores((m) => new Map(m).set(sc.id, sc));
    });
    ch.subscribe(async (st) => {
      if (st === 'SUBSCRIBED') {
        await ch.track({ id: myId, name, joinedAt });
        setStatus((s) => (s === 'full' ? s : 'joined'));
        ch.send({ type: 'broadcast', event: 'hello', payload: {} });
      } else if (st === 'CHANNEL_ERROR' || st === 'TIMED_OUT') {
        setStatus('error');
      }
    });
    return () => {
      ch.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId, solo, myId, name, epoch]);

  // 방장: 2초마다 진행 신호. 방장이 바뀌면 마지막으로 받은 상태에서 이어간다.
  useEffect(() => {
    if (roomId === null || !isHost || !(status === 'joined' || status === 'solo')) return;
    if (!stateRef.current) {
      const s = pickNewGame(packsRef.current);
      if (s) {
        setState(s);
        channelRef.current?.send({ type: 'broadcast', event: 'state', payload: s });
      }
    }
    const t = window.setInterval(() => {
      const cur = stateRef.current;
      if (!cur) return;
      // 차트 데이터가 아직 안 왔으면 기다린다 (봉이 안 보이는 채로 진행되지 않게).
      if (cur.phase === 'play' && !rowsRef.current) return;
      const next = advance(cur, packsRef.current);
      if (!next) return;
      if (next !== cur) setState(next);
      channelRef.current?.send({ type: 'broadcast', event: 'state', payload: next });
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [roomId, isHost, status, packs.length]);

  // 점수: 10초마다 한 번 (봉 5개마다)
  const idx = state?.idx ?? 0;
  useEffect(() => {
    if (state?.phase === 'play' && idx > 0 && idx % SCORE_EVERY_TICKS === 0) sendScore();
    if (state?.phase === 'result') sendScore();
  }, [idx, state?.phase, sendScore]);

  // 탭을 숨긴 채 1분이 지나면 연결을 끊는다 (동시접속 자리 반납)
  useEffect(() => {
    if (roomId === null || solo) return;
    let timer: number | null = null;
    const onVis = () => {
      if (document.hidden) {
        timer = window.setTimeout(() => {
          channelRef.current?.unsubscribe();
          channelRef.current = null;
          setStatus('paused');
        }, HIDDEN_LIMIT_MS);
      } else if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      if (timer) window.clearTimeout(timer);
    };
  }, [roomId, solo]);

  const doTrade = useCallback(
    (side: 'buy' | 'sell', fraction: number) => {
      if (stateRef.current?.phase !== 'play') return;
      const next = trade(accountRef.current, side, fraction, priceNow());
      if (next === accountRef.current) return;
      accountRef.current = next;
      setAccount(next);
      sendScore();
    },
    [priceNow, sendScore]
  );

  const leaderboard = useMemo(() => {
    const present = new Set(players.map((p) => p.id));
    return [...scores.values()]
      .filter((s) => s.gameId === state?.gameId && (solo || present.has(s.id)))
      .sort((a, b) => b.ret - a.ret);
  }, [scores, players, state?.gameId, solo]);

  return { myId, status, players, state, rows, account, price: priceNow(), isHost, leaderboard, doTrade };
}
