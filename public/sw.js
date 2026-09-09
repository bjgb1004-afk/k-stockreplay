// Web Push service worker (§2-3 로컬 우선: 서버는 "새 소식 있음" wake-up만 보내고,
// 이 워커가 로컬 워치리스트와 대조해서 관련 있을 때만 알림을 띄운다).
// Vanilla JS on purpose - no bundler runs against public/sw.js, so it can't
// import the TS modules under src/lib; the small bit of IndexedDB read logic
// it needs from watchlistDb.ts is duplicated here rather than pulled in.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

function getWatchlistTickers() {
  return new Promise((resolve) => {
    // 버전 인자 없이 연다 - db.ts의 DB_VERSION이 올라갈 때마다 여기 숫자도 같이
    // 맞춰야 했는데(버전 불일치는 VersionError로 조용히 실패해 워치리스트를 못 읽음),
    // 버전 없이 열면 그 문제 자체가 없어진다.
    const req = indexedDB.open('kstockreplay');
    req.onsuccess = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('watchlist_items')) return resolve([]);
      const tx = db.transaction('watchlist_items', 'readonly');
      const getAll = tx.objectStore('watchlist_items').getAll();
      getAll.onsuccess = () => resolve(getAll.result.map((w) => w.ticker));
      getAll.onerror = () => resolve([]);
    };
    req.onerror = () => resolve([]);
  });
}

self.addEventListener('push', (event) => {
  event.waitUntil(
    (async () => {
      const tickers = await getWatchlistTickers();
      if (tickers.length === 0) return;

      // 주간 리캡은 서버가 내용을 모른다(§2-3) - 그냥 깨우기만 하고, 실제 요약은
      // 앱을 열었을 때 로컬 데이터로 계산해서 보여준다(TodayScreen의 WeeklyRecapCard).
      let payload = {};
      try {
        payload = event.data?.json() ?? {};
      } catch {
        /* 페이로드 없거나 JSON이 아니면 기존 today-updated로 취급 */
      }
      if (payload.type === 'weekly-recap') {
        await self.registration.showNotification('이번 주 리캡이 도착했어요', {
          body: '워치리스트에 무슨 일이 있었는지 확인해보세요.',
          icon: '/favicon.png',
          badge: '/favicon.png',
          data: { url: '/' },
        });
        return;
      }

      const res = await fetch('/data/today.json');
      if (!res.ok) return;
      const today = await res.json();
      const watched = new Set(tickers);
      const relevant = (today.newToday || []).filter((e) => watched.has(e.ticker));
      if (relevant.length === 0) return;

      const title =
        relevant.length === 1
          ? `${relevant[0].companyName} 새 소식`
          : `${relevant[0].companyName} 외 ${relevant.length - 1}건 새 소식`;
      await self.registration.showNotification(title, {
        body: relevant[0].title,
        icon: '/favicon.png',
        badge: '/favicon.png',
        data: { url: '/' },
      });
    })(),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return self.clients.openWindow(url);
    }),
  );
});
