// Badging API - only takes effect when installed as a PWA on a supporting
// browser (Chromium-based). No-op elsewhere; there's nothing to feature-detect
// around since setAppBadge/clearAppBadge simply won't exist.
export function updateAppBadge(unreadCount: number): void {
  if (!('setAppBadge' in navigator)) return;
  if (unreadCount > 0) {
    navigator.setAppBadge(unreadCount).catch(() => {});
  } else {
    navigator.clearAppBadge().catch(() => {});
  }
}
