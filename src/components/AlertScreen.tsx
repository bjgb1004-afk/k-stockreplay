import { useEffect, useState } from 'react';
import { Screen, Panel, PageHeader } from './ui';
import { pushSupport, getExistingSubscription, subscribeToPush, unsubscribeFromPush, type PushSupport } from '../lib/push';
import { useAlerts, type EventType } from '../lib/useAlerts';

const typeLabel: Record<EventType, string> = {
  DISCLOSURE: '공시',
  CONTRACT: '계약',
  DIVIDEND: '배당',
  MANAGEMENT_CHANGE: '임원변경',
  INSIDER: '내부자매매',
};

export default function AlertScreen() {
  const { alerts, readIds, unreadCount, watchlist, markRead } = useAlerts();

  return (
    <Screen>
      <PageHeader
        en="ALERT"
        title="알림"
        sub={`관심종목 알림함${unreadCount > 0 ? ` · 안 읽음 ${unreadCount}건` : ''}`}
      />

      <div className="mb-4"><PushSection /></div>

      <Panel title="알림함" meta={`${alerts.length}건`}>
        {watchlist.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">
            아직 관심종목이 없습니다. 관심종목 메뉴에서 추가해보세요.
          </p>
        ) : alerts.length === 0 ? (
          <p className="px-4 py-6 text-sm text-slate-500">관심종목에 대한 알림이 아직 없습니다.</p>
        ) : (
          <ul className="divide-y divide-slate-800">
              {alerts.map((a) => {
                const isRead = readIds.has(a.id);
                return (
                  <li key={a.id}>
                    <button
                      onClick={() => markRead(a.id)}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-950 ${a.silentSurprise ? 'bg-amber-500/10' : isRead ? 'bg-slate-950/60' : ''}`}
                    >
                      {a.silentSurprise && (
                        <p className="text-xs text-amber-600 font-medium mb-1">🔕→🔔 오랜만의 소식</p>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                        <span className={`font-medium ${isRead ? 'text-slate-400' : 'text-slate-100'}`}>{a.companyName}</span>
                        <span className="text-[11px] font-semibold bg-slate-950 border border-slate-800 text-slate-300 rounded px-1.5 py-px shrink-0">{typeLabel[a.type]}</span>
                        <span className="font-mono text-xs text-slate-500 ml-auto shrink-0">{a.date}</span>
                      </div>
                      <p className={`text-xs mt-1 ${isRead ? 'text-slate-500' : 'text-slate-300'}`}>{a.title}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
        )}
      </Panel>
    </Screen>
  );
}

function PushSection() {
  const [support, setSupport] = useState<PushSupport>('unsupported');
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSupport(pushSupport());
    getExistingSubscription().then((sub) => setSubscribed(!!sub));
  }, []);

  async function handleToggle() {
    setBusy(true);
    setError(null);
    try {
      if (subscribed) {
        await unsubscribeFromPush();
        setSubscribed(false);
      } else {
        await subscribeToPush();
        setSubscribed(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : '알 수 없는 오류');
    } finally {
      setBusy(false);
    }
  }

  if (support === 'unsupported') return null;

  return (
    <Panel title="알림 받을 방법">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">브라우저 푸시</p>
          <p className="text-xs text-slate-300 mt-0.5">
            {support === 'unconfigured'
              ? '아직 서버에 설정되지 않았습니다.'
              : subscribed
                ? '관심종목에 새 소식이 있으면 알려드려요.'
                : '꺼져 있습니다. 스위치를 눌러 켜보세요.'}
          </p>
          {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
        </div>
        <button
          role="switch"
          aria-checked={subscribed}
          aria-label={subscribed ? '알림 끄기' : '알림 켜기'}
          onClick={handleToggle}
          disabled={busy || support === 'unconfigured'}
          className={`ml-auto relative shrink-0 w-[38px] h-[22px] rounded-full transition-colors disabled:opacity-50 ${subscribed ? 'bg-cyan-500' : 'bg-slate-700'}`}
        >
          <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white transition-all ${subscribed ? 'left-[19px]' : 'left-[3px]'}`} />
        </button>
      </div>
    </Panel>
  );
}

