import { useState } from 'react';
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
  WARMUP,
  START_CASH,
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

/** 리플레이 방 이용 안내 (규칙·자동 퇴장·차트 안내). 입구와 방 안에서 함께 쓴다. */
export function RoomGuide({ defaultOpen = false }: { defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className="rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-[12.5px] text-slate-300 open:pb-3">
      <summary className="cursor-pointer font-medium text-slate-100 py-0.5">리플레이 방 이용 안내</summary>
      <ul className="mt-2 space-y-1.5 list-disc list-inside">
        <li>
          <b className="text-slate-100">방 정원은 {ROOM_CAPACITY}명</b>이고 방은 {ROOM_COUNT}개입니다. 방이 가득 차면 다른 방을 고르거나 혼자 연습할 수 있습니다.
        </li>
        <li>
          <b className="text-amber-600">다른 탭으로 옮기거나 화면을 1분 이상 숨겨 두면 자동으로 방에서 나가집니다.</b> 기다리는 다른 분들께 자리를 돌려드리기 위해서입니다.
          돌아오면 &lsquo;다시 입장&rsquo; 버튼으로 바로 들어갈 수 있고, 그 판의 계좌는 초기화될 수 있습니다.
        </li>
        <li>한 판은 이미 보이는 {WARMUP}개 봉 뒤로 새 봉 {PLAY_CANDLES}개가 2초마다 열립니다 (약 2분). 끝나면 순위를 보여주고 12초 뒤 다음 판이 시작됩니다.</li>
        <li>매수·매도는 지금 보이는 마지막 봉의 종가로 체결되고 수수료와 세금은 없습니다. 판마다 1,000만 원으로 다시 시작합니다.</li>
        <li>
          <b className="text-slate-100">차트는 실제 종목이 아닌 가상 차트입니다.</b> 실제 시세처럼 오르내리도록 만든 연습용이며, 특정 종목이나 실제 가격과 관계가 없습니다.
        </li>
        <li>실시간 접속자가 많거나 연결이 불안정하면 &lsquo;혼자 이어서 하기&rsquo;로 같은 게임을 계속할 수 있습니다.</li>
        <li>닉네임은 이 기기에만 저장되고, 게임 기록은 서버에 남지 않습니다. 상금이나 경품은 없는 모의 게임이며 투자 권유가 아닙니다.</li>
      </ul>
    </details>
  );
}

/** 리플레이 목록 화면 위에 붙는 "여럿이 하기" 입구 */
export function ReplayRoomLobby({ onEnter }: { onEnter: (room: number | 'solo', name: string) => void }) {
  const [name, setName] = useState(defaultName);

  function enter(room: number | 'solo') {
    const n = name.trim().slice(0, 12) || defaultName();
    try {
      localStorage.setItem(NAME_KEY, n);
    } catch {
      // 무시
    }
    onEnter(room, n);
  }

  return (
    <Panel title="리플레이 방 · 여럿이 같은 차트로 겨루기" meta={`방당 ${ROOM_CAPACITY}명 · 한 판 약 2분`}>
      <div className="p-4 space-y-3">
        <p className="text-[13px] text-slate-300">
          방에 들어온 모두가 같은 가상 차트를 보고, 2초마다 한 봉씩 열립니다. 가상 자금 1,000만 원으로 사고팔아 수익률 순위를 겨룹니다.
        </p>
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
        <RoomGuide />
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
  const [forceSolo, setForceSolo] = useState(room === 'solo');
  const [roomKey, setRoomKey] = useState(0); // '다시 입장'용

  const roomId = room === 'solo' ? 0 : room;
  const g = useReplayRoom(roomId, name, forceSolo, roomKey);

  const visible = g.rows && g.state ? g.rows.slice(0, g.state.start + g.state.idx) : [];
  const reveal = g.state?.phase === 'result';
  // 비교 기준: 판 시작 때 사서 끝까지 들고 있었다면
  const holdRet =
    g.rows && g.state && g.rows[g.state.start - 1] && g.price
      ? Math.round(((g.price - g.rows[g.state.start - 1].close) / g.rows[g.state.start - 1].close) * 10000) / 100
      : null;
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
          <p className="text-xs text-slate-500">가상 차트</p>
          <p className="font-semibold">
            {reveal && holdRet !== null ? `그냥 들고 있었다면 ${holdRet > 0 ? '+' : ''}${holdRet.toFixed(2)}%` : '실제 종목이 아닌 연습용 차트'}
          </p>
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
          {g.status !== 'solo' && (
            <p className="text-[11px] text-amber-600">화면을 1분 이상 숨기면 자동으로 방에서 나가집니다.</p>
          )}
          <RoomGuide />
        </div>
      </div>
    </div>
  );
}
