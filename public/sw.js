// Web Push service worker (§2-3 로컬 우선: 서버는 "새 소식 있음" wake-up만 보내고,
// 이 워커가 로컬 워치리스트와 대조해서 관련 있을 때만 알림을 띄운다).
// Vanilla JS on purpose - no bundler runs against public/sw.js, so it can't
// import the TS modules under src/lib; the small bit of IndexedDB read logic
// it needs from watchlistDb.ts is duplicated here rather than pulled in.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

function getWatchlistTickers() {
  return new Promise((resolve) => {
    const req = indexedDB.open('kstockreplay', 2);
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
