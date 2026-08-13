import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Screen, Section } from './ui';
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
      <header className="mb-6">
        <h1 className="text-lg font-bold">ALERT</h1>
        <p className="text-xs text-slate-500">
          관심종목 알림함{unreadCount > 0 ? ` · 안 읽음 ${unreadCount}건` : ''}
        </p>
      </header>

      <PushSection />

      <Section title="🔔 알림">
        {watchlist.length === 0 ? (
          <p className="text-sm text-slate-500">
            아직 관심종목이 없습니다. MY STOCK RADAR 탭에서 추가해보세요.
          </p>
        ) : alerts.length === 0 ? (
          <p className="text-sm text-slate-500">관심종목에 대한 알림이 아직 없습니다.</p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => {
              const isRead = readIds.has(a.id);
              return (
                <li key={a.id}>
                  <button
                    onClick={() => markRead(a.id)}
                    className={`w-full text-left rounded-lg px-3 py-2.5 ${a.silentSurprise ? 'bg-amber-500/10 border border-amber-500/30' : isRead ? 'bg-slate-900/50' : 'bg-slate-900'}`}
                  >
                    {a.silentSurprise && (
                      <p className="text-xs text-amber-400 font-medium mb-1">🔕→🔔 오랜만의 소식</p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      {!isRead && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                      <span className={`font-medium ${isRead ? 'text-slate-400' : 'text-slate-100'}`}>{a.companyName}</span>
                      <span className="text-xs bg-slate-800 text-slate-400 rounded px-1.5 py-0.5 shrink-0">{typeLabel[a.type]}</span>
                      <span className="text-xs text-slate-500 ml-auto shrink-0">{a.date}</span>
                    </div>
                    <p className={`text-xs mt-1 ${isRead ? 'text-slate-500' : 'text-slate-300'}`}>{a.title}</p>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Section>
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
    <div className="mb-6 bg-slate-900 rounded-lg px-3 py-2.5 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium">브라우저 알림</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {support === 'unconfigured'
            ? '아직 서버에 설정되지 않았습니다.'
            : subscribed
              ? '관심종목에 새 소식이 있으면 알려드려요.'
              : '꺼져 있습니다 - 눌러서 켜보세요.'}
        </p>
        {error && <p className="text-xs text-red-400 mt-0.5">{error}</p>}
      </div>
      <button
        onClick={handleToggle}
        disabled={busy || support === 'unconfigured'}
        className={`shrink-0 rounded-full p-2 ${subscribed ? 'bg-slate-800 text-slate-300' : 'bg-emerald-500/20 text-emerald-400'} disabled:opacity-50`}
        aria-label={subscribed ? '알림 끄기' : '알림 켜기'}
      >
        {subscribed ? <BellOff size={16} /> : <Bell size={16} />}
      </button>
    </div>
  );
}

