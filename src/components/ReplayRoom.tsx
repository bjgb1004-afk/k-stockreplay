import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Trophy, User } from 'lucide-react';
import { Panel } from './ui';
import ReplayChart from './ReplayChart';
import { supabaseConfigured } from '../lib/supabase';
import {
  useReplayRoom,
  equityReturn,
  ROOM_COUNT,
  ROOM_CAPACITY,
  PLAY_CANDLES,
  START_CASH,
  type PackInfo,
} from '../lib/replayRoom';

const NAME_KEY = 'kstockreplay_room_name';

function defaultName() {
  try {
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) return saved;
  } catch {
    // 저장소를 못 쓰는 환경 - 무작위 이름으로 간다.
  }
  return `개미${Math.floor(1000 + Math.random() * 9000)}`;
}

/** 리플레이 목록 화면 위에 붙는 "여럿이 하기" 입구 */
export function ReplayRoomLobby({ onEnter }: { onEnter: (room: number | 'solo', name: string) => void }) {
  const [packs, setPacks] = useState<PackInfo[] | null>(null);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    fetch('/data/replay/index.json')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPacks(d?.packs ?? []))
      .catch(() => setPacks([]));
  }, []);

  function enter(room: number | 'solo') {
    const n = name.trim().slice(0, 12) || defaultName();
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {
      // 무시
    }
    onEnter(room, n);
  }

  const ready = !!packs && packs.length > 0;

  return (
    <Panel title="리플레이 방 · 여럿이 같은 차트로 겨루기" meta={`방당 ${ROOM_CAPACITY}명 · 한 판 약 2분`}>
      <div className="p-4 space-y-3">
        <p className="text-[13px] text-slate-300">
          종목 이름을 가린 과거 차트가 2초마다 한 봉씩 열립니다. 가상 자금 1,000만 원으로 사고팔아 수익률 순위를 겨루고, 판이 끝나면 종목이 공개됩니다.
        </p>
        {!ready ? (
          <p className="text-sm text-slate-500">{packs === null ? '불러오는 중...' : '방에서 쓸 차트 데이터를 준비 중입니다. 첫 수집이 끝나면 열립니다.'}</p>
        ) : (
          <>
            <label className="flex items-center gap-2 text-[13px]">
              <span className="text-slate-400 shrink-0">닉네임</span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={12}
                className="w-40 h-8 bg-slate-900 border border-slate-800 rounded-md px-2.5 focus:outline-none focus:border-cyan-600"
              />
            </label>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
              {Array.from({ length: ROOM_COUNT }, (_, i) => i + 1).map((room) => (
                <button
                  key={room}
                  onClick={() => enter(room)}
                  disabled={!supabaseConfigured}
                  className="h-10 rounded-md border border-slate-700 text-[13px] font-semibold hover:bg-cyan-500 hover:text-white hover:border-cyan-500 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-inherit"
                >
                  {room}번 방
                </button>
              ))}
            </div>
            <button onClick={() => enter('solo')} className="inline-flex items-center gap-1.5 text-[13px] text-slate-400 hover:text-slate-100">
              <User size={14} /> 혼자 연습하기
            </button>
            {!supabaseConfigured && <p className="text-xs text-amber-600">실시간 서버가 연결되지 않아 지금은 혼자 연습만 할 수 있습니다.</p>}
          </>
        )}
      </div>
    </Panel>
  );
}

/** 방 안 화면 */
export function ReplayRoomView({
  room,
  name,
  onExit,
}: {
  room: number | 'solo';
  name: string;
  onExit: () => void;
}) {
  const [packs, setPacks] = useState<PackInfo[]>([]);
  const [forceSolo, setForceSolo] = useState(room === 'solo');
  const [roomKey, setRoomKey] = useState(0); // '다시 입장'용

  useEffect(() => {
    fetch('/data/replay/index.json')
      .then((r) => r.json())
      .then((d) => setPacks(d.packs ?? []))
      .catch(() => setPacks([]));
  }, []);

  const roomId = room === 'solo' ? 0 : room;
  const g = useReplayRoom(packs.length ? roomId : null, name, packs, forceSolo, roomKey);

  const visible = g.rows && g.state ? g.rows.slice(0, g.state.start + g.state.idx) : [];
  const pack = packs.find((p) => p.ticker === g.state?.ticker);
  const reveal = g.state?.phase === 'result';
  const myRet = equityReturn(g.account, g.price);
  const left = g.state ? PLAY_CANDLES - g.state.idx : PLAY_CANDLES;

  if (g.status === 'full' || g.status === 'error' || g.status === 'paused') {
    const msg =
      g.status === 'full'
        ? `${room}번 방이 가득 찼어요 (정원 ${ROOM_CAPACITY}명).`
        : g.status === 'paused'
          ? '화면을 오래 비워 두어 방에서 나왔어요.'
          : '지금은 실시간 서버에 접속이 어려워요 (접속자가 많거나 연결 오류).';
    return (
      <div className="panel p-6 space-y-3">
        <p className="text-sm text-slate-200">{msg}</p>
        <div className="flex gap-2 flex-wrap">
          {g.status === 'paused' && (
            <button onClick={() => setRoomKey((k) => k + 1)} className="h-9 px-3 rounded-md bg-cyan-500 text-white text-[13px] font-semibold">
              다시 입장
            </button>
          )}
          <button onClick={() => setForceSolo(true)} className="h-9 px-3 rounded-md bg-cyan-500 text-white text-[13px] font-semibold">
            혼자 이어서 하기
          </button>
          <button onClick={onExit} className="h-9 px-3 rounded-md border border-slate-700 text-[13px]">
            다른 방 고르기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center gap-3 flex-wrap">
        <button onClick={onExit} aria-label="방 나가기" className="text-slate-400 p-1.5">
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0">
          <h1 className="text-base font-bold">{g.status === 'solo' ? '혼자 연습' : `${room}번 방`}</h1>
          <p className="text-xs text-slate-500 flex items-center gap-1">
            <Users size={12} /> {g.players.length}명{g.status === 'connecting' && ' · 접속 중...'}
            {g.isHost && g.status !== 'solo' && ' · 내가 진행 중'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-xs text-slate-500">{reveal ? '이번 판 종목' : '종목'}</p>
          <p className="font-semibold">{reveal && pack ? `${pack.name} (${pack.ticker})` : '??? (판이 끝나면 공개)'}</p>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px] items-start">
        <div className="panel overflow-hidden min-w-0">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-slate-800 text-[13px]">
            <span className="font-mono">{g.state?.phase === 'play' ? `남은 봉 ${left}` : '결과 발표 · 곧 다음 판'}</span>
            <div className="flex-1 h-1.5 rounded bg-slate-800 overflow-hidden">
              <div className="h-full bg-cyan-500 transition-all" style={{ width: `${((g.state?.idx ?? 0) / PLAY_CANDLES) * 100}%` }} />
            </div>
            <span className="font-mono">{g.price ? g.price.toLocaleString('ko-KR') : '—'}</span>
          </div>
          <div className="p-2">
            {visible.length > 0 ? (
              <ReplayChart rows={visible} avgCost={g.account.shares > 0 ? g.account.avgCost : undefined} position={g.account.shares} />
            ) : (
              <p className="p-6 text-sm text-slate-500">차트 불러오는 중...</p>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="내 계좌" meta="가상 자금">
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-[13px]">
                <div>
                  <p className="text-[11px] text-slate-500">수익률</p>
                  <p className={`font-mono text-xl font-bold ${myRet > 0 ? 'text-red-600' : myRet < 0 ? 'text-blue-600' : ''}`}>
                    {myRet > 0 ? '+' : ''}
                    {myRet.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">평가금액</p>
                  <p className="font-mono">{Math.round(g.account.cash + g.account.shares * g.price).toLocaleString('ko-KR')}</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">보유 주식</p>
                  <p className="font-mono">{g.account.shares.toLocaleString('ko-KR')}주</p>
                </div>
                <div>
                  <p className="text-[11px] text-slate-500">현금</p>
                  <p className="font-mono">{Math.round(g.account.cash).toLocaleString('ko-KR')}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {(
                  [
                    ['buy', 1, '전액 매수'],
                    ['buy', 0.5, '절반 매수'],
                    ['sell', 1, '전량 매도'],
                    ['sell', 0.5, '절반 매도'],
                  ] as const
                ).map(([side, f, label]) => (
                  <button
                    key={label}
                    onClick={() => g.doTrade(side, f)}
                    disabled={g.state?.phase !== 'play' || !g.price}
                    className={`h-10 rounded-md text-[13px] font-semibold text-white disabled:opacity-40 ${side === 'buy' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">시작 자금 {START_CASH.toLocaleString('ko-KR')}원 · 현재 봉 종가로 체결 · 수수료 없음</p>
            </div>
          </Panel>

          <Panel title="이번 판 순위" meta={<span className="inline-flex items-center gap-1"><Trophy size={12} /> 실시간</span>}>
            {g.leaderboard.length === 0 ? (
              <p className="px-4 py-4 text-sm text-slate-500">매매하면 순위에 올라갑니다.</p>
            ) : (
              <ol className="divide-y divide-slate-800">
                {g.leaderboard
                  .map((s) => (s.id === g.myId && g.state?.phase === 'play' ? { ...s, ret: myRet } : s))
                  .sort((a, b) => b.ret - a.ret)
                  .slice(0, ROOM_CAPACITY)
                  .map((s, i) => (
                  <li key={s.id} className={`flex items-center gap-2 px-4 py-2 text-[13px] ${s.id === g.myId ? 'bg-cyan-500/10' : ''}`}>
                    <span className="w-5 font-mono text-slate-500">{i + 1}</span>
                    <span className="flex-1 truncate">{s.name}{s.id === g.myId && ' (나)'}</span>
                    <span className={`font-mono ${s.ret > 0 ? 'text-red-600' : s.ret < 0 ? 'text-blue-600' : 'text-slate-500'}`}>
                      {s.ret > 0 ? '+' : ''}
                      {s.ret.toFixed(2)}%
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
          <p className="text-[11px] text-slate-500">과거 실제 시세로 하는 모의 게임이며 투자 권유가 아닙니다.</p>
        </div>
      </div>
    </div>
  );
}
