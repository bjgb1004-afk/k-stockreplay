// Sends the "wake-up" push (§2-3: server doesn't know per-user watchlists,
// it just tells every subscribed browser "something's new" - the service
// worker decides whether it's relevant by checking the local watchlist).
// Runs server-side only, after fetch-facts.mjs publishes a new today.json.
//
// Usage:
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... \
//   node scripts/send-push.mjs

import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY } = process.env;
for (const [name, value] of Object.entries({ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY })) {
  if (!value) {
    console.error(`${name} env var is required.`);
    process.exit(1);
  }
}

webpush.setVapidDetails('mailto:bjgb1004@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const { data: subs, error } = await supabase.from('push_subscriptions').select('id, endpoint, p256dh, auth_key');
if (error) {
  console.error('Failed to load push_subscriptions:', error.message);
  process.exit(1);
}

if (!subs || subs.length === 0) {
  console.log('No subscriptions to notify.');
  process.exit(0);
}

const payload = JSON.stringify({ type: 'today-updated' });
let sent = 0;
let pruned = 0;

for (const sub of subs) {
  const subscription = { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } };
  try {
    await webpush.sendNotification(subscription, payload);
    sent++;
    await supabase.from('push_subscriptions').update({ last_notified_at: new Date().toISOString() }).eq('id', sub.id);
  } catch (err) {
    // 410 Gone / 404 Not Found = the browser unsubscribed or the endpoint
    // expired. Prune it so this list doesn't grow stale forever.
    if (err.statusCode === 410 || err.statusCode === 404) {
      await supabase.from('push_subscriptions').delete().eq('id', sub.id);
      pruned++;
    } else {
      console.error(`Push failed for subscription ${sub.id}:`, err.message);
    }
  }
}

console.log(`Sent ${sent}/${subs.length} pushes, pruned ${pruned} dead subscription(s).`);
