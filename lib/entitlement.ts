// Entitlement writes — the only place that grants or removes Pro / single
// unlock. Every function resolves the current request's identity + prefs
// through the existing auth helpers and returns the signed cookie the caller
// must attach to the response. No new storage; state lives in the tb_prefs
// cookie (and the optional Upstash sync).

import { getRequestPrefs, savePrefs, isProActive, ANON_UID, type CookieSpec, type OrderRecord } from './auth';
import { PRO_MONTH_MS } from './auth-shared';

/** Add `count` single-unlock credits (each unlocks one full list ≤10 records). */
export async function grantUnlock(count = 1): Promise<CookieSpec> {
  const { uid, prefs } = await getRequestPrefs();
  const next = {
    ...prefs,
    unlockCredits: (prefs.unlockCredits || 0) + Math.max(0, count),
  };
  const { cookie } = await savePrefs(uid, next);
  return cookie;
}

/**
 * Activate Pro for `months` months. If already Pro, the window is extended
 * from its current end rather than reset. Keeps any remaining single-unlock
 * credits intact.
 */
export async function grantPro(months = 1): Promise<{ cookie: CookieSpec; proUntil: number }> {
  const { uid, prefs } = await getRequestPrefs();
  const now = Date.now();
  const start = isProActive(prefs) && prefs.proUntil > now ? prefs.proUntil : now;
  const proUntil = start + months * PRO_MONTH_MS;
  const next = {
    ...prefs,
    plan: 'pro' as const,
    proUntil,
    paypalSubscriptionId: prefs.paypalSubscriptionId,
  };
  const { cookie } = await savePrefs(uid, next);
  return { cookie, proUntil };
}

/** Mark the PayPal subscription id once a recurring plan is confirmed active. */
export async function setSubscriptionId(
  subscriptionId: string
): Promise<CookieSpec> {
  const { uid, prefs } = await getRequestPrefs();
  const next = { ...prefs, paypalSubscriptionId: subscriptionId };
  const { cookie } = await savePrefs(uid, next);
  return cookie;
}

/**
 * Cancel: stop renewals by clearing the subscription id. Any remaining Pro
 * time is left intact so the service keeps working until it naturally lapses.
 */
export async function cancelPro(): Promise<CookieSpec> {
  const { uid, prefs } = await getRequestPrefs();
  const next = { ...prefs, paypalSubscriptionId: undefined };
  const { cookie } = await savePrefs(uid, next);
  return cookie;
}

/**
 * Persist a minimal, privacy-first record of the most recent paid export
 * entitlement. Stores only payment metadata (no health information) and
 * supersedes any previous order. Returns the cookie the caller must attach.
 */
export async function recordOrder(order: OrderRecord): Promise<CookieSpec> {
  const { uid, prefs } = await getRequestPrefs();
  const next = { ...prefs, lastOrder: order };
  const { cookie } = await savePrefs(uid, next);
  return cookie;
}

/** Build an OrderRecord flagged guest/signed-in from the current request. */
export async function buildOrder(
  type: 'single' | 'subscription',
  amount: string,
  currency: string,
  paypalId: string
): Promise<OrderRecord> {
  const { uid } = await getRequestPrefs();
  return { type, amount, currency, paypalId, at: Date.now(), guest: uid === ANON_UID };
}
