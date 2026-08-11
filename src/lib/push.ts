import { supabase } from './supabase';

// urlBase64ToUint8Array: PushManager.subscribe wants applicationServerKey as
// raw bytes, VAPID public keys are shipped as base64url text.
function urlBase64ToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

export type PushSupport = 'unsupported' | 'unconfigured' | 'ready';

export function pushSupport(): PushSupport {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
  if (!import.meta.env.VITE_VAPID_PUBLIC_KEY) return 'unconfigured';
  return 'ready';
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration();
  return (await reg?.pushManager.getSubscription()) ?? null;
}

export async function subscribeToPush(): Promise<void> {
  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) throw new Error('VITE_VAPID_PUBLIC_KEY가 설정되지 않았습니다.');

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') throw new Error('알림 권한이 거부되었습니다.');

  const reg = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });

  const json = sub.toJSON();
  const { error } = await supabase.from('push_subscriptions').insert({
    endpoint: json.endpoint,
    p256dh: json.keys?.p256dh,
    auth_key: json.keys?.auth,
  });
  // 이미 등록된 endpoint(재구독)는 UNIQUE 제약 위반으로 오류가 나는 게 정상 -
  // 서버는 이미 이 구독을 알고 있으므로 실패로 취급하지 않는다.
  if (error && !error.message?.includes('duplicate')) throw error;
}

export async function unsubscribeFromPush(): Promise<void> {
  const sub = await getExistingSubscription();
  if (!sub) return;
  // 익명 구독이라 클라이언트에 DELETE 권한이 없다 (RLS: service_role만 조회/삭제
  // 가능, §Supabase 스키마 참고). 브라우저 쪽 구독만 끊는다 - 이 endpoint로는
  // 더 이상 푸시가 전달되지 않고, 서버 발송 스크립트가 만료된 구독은 정리한다.
  await sub.unsubscribe();
}
