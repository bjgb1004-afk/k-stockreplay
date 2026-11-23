import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, supabaseConfigured } from './supabase';
import type { MarketDataRow } from './marketDataNormalize';
import { generateChart } from './syntheticChart';

// 리플레이 방: 여러 명이 같은 과거 차트를 같은 속도로 보며 가상매매하고 수익률 순위를 겨룬다.
// Supabase Realtime의 Broadcast(진행 신호·점수)와 Presence(누가 방에 있나)만 쓰고 DB 테이블은 안 쓴다.
//
// 무료 한도(동시접속 200, 초당 메시지 100, Presence 초당 20)를 넘지 않게:
//  - 방 정원 20명, 방은 ROOM_COUNT개 → 최대 20명
//  - 진행 신호는 방장 1명만 3초에 1번, 점수는 매매할 때 + 15초에 1번
//  - Presence는 입장·퇴장 때만 (점수를 presence로 보내지 않는다)
//  - 탭을 숨긴 채 1분이 지나면 연결을 끊는다
// 연결이 안 되면(설정 없음·한도 초과·오류) 같은 게임을 혼자 모드로 이어서 할 수 있다.
//
// 차트는 실제 시세가 아니라 가상 차트다 (syntheticChart.ts 참고 - 실제 시세는 재배포 금지 라이선스).
// 방장이 시드만 보내면 모두가 같은 차트를 만든다.

export const ROOM_COUNT = 1;
export const ROOM_CAPACITY = 20;
export const WARMUP = 120; // 시작할 때 이미 보여주는 봉 수
export const PLAY_CANDLES = 100; // 한 판 동안 새로 열리는 봉 수 (3초 틱 × 100 = 5분)
export const TICK_MS = 3000;
export const RESULT_MS = 12000;
// 방장이 이 시간 동안 진행 신호를 안 보내면 죽은 것으로 보고 다음 사람이 이어받는다.
// (탭 종료·절전·네트워크 끊김 때 서버에 접속 흔적만 남아 방 전체가 멈추는 걸 막는다.)
export const HOST_TIMEOUT_MS = 9000;
export const START_CASH = 10_000_000;
const SCORE_EVERY_TICKS = 5;
const HIDDEN_LIMIT_MS = 60_000;

export interface GameState {
  gameId: string;
  seed: string; // 가상 차트 시드 - 모두가 이 값으로 같은 차트를 만든다
  start: number; // rows 배열에서 이 판이 시작하는 위치 (이 앞 WARMUP개를 미리 보여준다)
  idx: number; // 0..PLAY_CANDLES
  phase: 'play' | 'result';
  at: number; // 방장이 이 상태를 보낸 시각
  host?: string; // 이 신호를 보낸 방장의 id (둘이 동시에 진행하는 충돌을 가려내는 데 쓴다)
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

export const CHART_LEN = WARMUP + PLAY_CANDLES;

export const SOLO_TOPIC = 'replay-solo'; // 혼자 연습 중인 사람 수만 세는 채널 (presence만, 신호 없음)
export const roomTopic = (id: number) => `replay-room-${id}`;

type PresenceChannel = ReturnType<typeof supabase.channel>;

function presenceList(ch: PresenceChannel): Player[] {
  const raw = ch.presenceState() as Record<string, Player[]>;
  return Object.values(raw).map((arr) => arr[0]).filter(Boolean);
}

export function pickNewGame(): GameState {
  const gameId = randomId();
  return { gameId, seed: `${gameId}-${Math.floor(Math.random() * 1e9)}`, start: WARMUP, idx: 0, phase: 'play', at: Date.now() };
}

// 다음 상태: 봉을 하나 더 열거나, 다 열었으면 결과 화면, 결과 시간이 지나면 새 판.
export function advance(state: GameState, now = Date.now()): GameState {
  if (state.phase === 'play') {
    if (state.idx < PLAY_CANDLES) return { ...state, idx: state.idx + 1, at: now };
    return { ...state, phase: 'result', at: now };
  }
  if (now - state.at >= RESULT_MS) return pickNewGame();
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

/** 방 하나(또는 혼자 모드)의 게임 진행. roomId가 null이면 아무것도 안 한다. */
export function useReplayRoom(roomId: number | null, name: string, forceSolo: boolean, epoch = 0) {
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
  stateRef.current = state;
  playersRef.current = players;
  accountRef.current = account;
  rowsRef.current = rows;

  // 신호가 끊긴 방장 후보들(유령). 로컬 판단이지만 모두가 같은 침묵을 보므로 같은 결론에 도달한다.
  const [silent, setSilent] = useState<string[]>([]);
  // 끊겼던 방장이 돌아와 둘이 동시에 진행하면 차트가 엎치락뒤치락한다 - 한쪽이 물러난다.
  const [standDownTo, setStandDownTo] = useState<string | null>(null);
  const lastSignalRef = useRef(0);
  const silentRef = useRef<string[]>([]);
  silentRef.current = silent;

  const solo = forceSolo || !supabaseConfigured;
  const hostId = pickHost(players.filter((p) => !silent.includes(p.id)));
  const isHost = solo || (hostId === myId && !standDownTo);
  const isHostRef = useRef(isHost);
  isHostRef.current = isHost;

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

  // 새 판이 시작되면 계좌·점수 초기화, 시드로 가상 차트 만들기
  const gameId = state?.gameId;
  const seed = state?.seed;
  useEffect(() => {
    if (!gameId || !seed) return;
    setAccount({ cash: START_CASH, shares: 0, avgCost: 0 });
    setScores((m) => new Map([...m].filter(([, s]) => s.gameId === gameId)));
    setRows(generateChart(seed, CHART_LEN));
  }, [gameId, seed]);

  // 접속 / 혼자 모드
  useEffect(() => {
    if (roomId === null) return;
    setPlayers([]);
    setScores(new Map());
    setState(null);
    setSilent([]);
    setStandDownTo(null);
    if (solo) {
      setStatus('solo');
      const me: Player = { id: myId, name, joinedAt: Date.now() };
      setPlayers([me]);
      if (!supabaseConfigured) return;
      // 혼자 연습도 "지금 몇 명이 연습 중인지"는 보여준다. presence만 쓰고 진행 신호·점수는 주고받지 않는다
      // (channelRef에 넣지 않으므로 sendScore가 이 채널로 나가지 않는다).
      const soloCh = supabase.channel(SOLO_TOPIC, { config: { presence: { key: myId } } });
      soloCh.on('presence', { event: 'sync' }, () => setPlayers(presenceList(soloCh)));
      soloCh.subscribe((st) => {
        if (st === 'SUBSCRIBED') soloCh.track(me);
      });
      return () => {
        soloCh.unsubscribe();
      };
    }
    setStatus('connecting');
    const joinedAt = Date.now();
    const ch = supabase.channel(roomTopic(roomId), { config: { presence: { key: myId }, broadcast: { self: false } } });
    channelRef.current = ch;

    ch.on('presence', { event: 'sync' }, () => {
      const list = presenceList(ch);
      setPlayers(list);
      if (isOverCapacity(list, myId)) {
        setStatus('full');
        ch.unsubscribe();
        channelRef.current = null;
      }
    });
    ch.on('broadcast', { event: 'state' }, ({ payload }) => {
      const s = payload as GameState;
      lastSignalRef.current = Date.now();
      // broadcast self:false라 내 신호는 나한테 안 온다 = 이 신호는 무조건 남이 보낸 것.
      // 내가 진행 중인데 남도 진행 중이면(끊겼다 돌아온 방장 등) 내가 물러난다.
      if (isHostRef.current && s.host && s.host !== myId) setStandDownTo(s.host);
      // 뒤늦게 온 옛 신호는 무시한다.
      const cur = stateRef.current;
      if (cur && cur.gameId === s.gameId && cur.idx > s.idx && cur.phase === s.phase) return;
      setState(s);
    });
    ch.on('broadcast', { event: 'hello' }, () => {
      if (isHostRef.current && stateRef.current) {
        ch.send({ type: 'broadcast', event: 'state', payload: { ...stateRef.current, host: myId } });
      }
    });
    ch.on('broadcast', { event: 'score' }, ({ payload }) => {
      const sc = payload as Score;
      setScores((m) => new Map(m).set(sc.id, sc));
    });
    ch.subscribe(async (st) => {
      if (st === 'SUBSCRIBED') {
        await ch.track({ id: myId, name, joinedAt });
        lastSignalRef.current = Date.now(); // 인수인계 시계 시작
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

  // 방장: 3초마다 진행 신호. 방장이 바뀌면 마지막으로 받은 상태에서 이어간다.
  useEffect(() => {
    if (roomId === null || !isHost || !(status === 'joined' || status === 'solo')) return;
    const broadcast = (s: GameState) => {
      lastSignalRef.current = Date.now();
      channelRef.current?.send({ type: 'broadcast', event: 'state', payload: { ...s, host: myId } });
    };
    if (!stateRef.current) {
      const s = pickNewGame();
      setState(s);
      broadcast(s);
    }
    const t = window.setInterval(() => {
      const cur = stateRef.current;
      if (!cur) return;
      // 차트 데이터가 아직 안 왔으면 기다린다 (봉이 안 보이는 채로 진행되지 않게).
      if (cur.phase === 'play' && !rowsRef.current) return;
      const next = advance(cur);
      if (next !== cur) setState(next);
      broadcast(next);
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [roomId, isHost, status, myId]);

  // 방장 감시: 신호가 HOST_TIMEOUT_MS 넘게 끊기면 그 방장을 유령으로 보고 다음 사람이 이어받는다.
  // 내가 물러나 있던 상태라면(상대도 조용해졌다면) 내가 다시 맡는다.
  useEffect(() => {
    if (roomId === null || solo || status !== 'joined') return;
    const t = window.setInterval(() => {
      if (Date.now() - lastSignalRef.current < HOST_TIMEOUT_MS) return;
      lastSignalRef.current = Date.now(); // 다음 후보에게도 같은 시간을 준다
      if (standDownTo) return setStandDownTo(null);
      const cur = pickHost(playersRef.current.filter((p) => !silentRef.current.includes(p.id)));
      if (!cur || cur === myId) return;
      setSilent((list) => (list.includes(cur) ? list : [...list, cur]));
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [roomId, solo, status, myId, standDownTo]);

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

/** 로비용: 지금 단체방·혼자 연습에 각각 몇 명 있는지. 보기만 하고 자리를 차지하지 않는다(track 안 함). */
export function useLobbyCounts() {
  const [counts, setCounts] = useState({ room: 0, solo: 0 });
  useEffect(() => {
    if (!supabaseConfigured) return;
    const chans = ([['room', roomTopic(1)], ['solo', SOLO_TOPIC]] as const).map(([key, topic]) => {
      // presence.enabled를 켜야 track 하지 않는 구독자도 presence 상태를 받는다
      // (기본값으로는 빈 객체만 와서 0명으로 보였다 - 실측 확인). 구경꾼 자신은 집계에 안 잡힌다.
      const ch = supabase.channel(topic, { config: { presence: { key: `lobby-${key}`, enabled: true } } });
      ch.on('presence', { event: 'sync' }, () =>
        setCounts((c) => ({ ...c, [key]: Object.keys(ch.presenceState()).length }))
      ).subscribe();
      return ch;
    });
    return () => {
      chans.forEach((ch) => ch.unsubscribe());
    };
  }, []);
  return counts;
}
