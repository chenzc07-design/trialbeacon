import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import {
  getCurrentUser,
  savePrefs,
  checkIpRate,
  clientIp,
  isProActive,
} from '@/lib/auth';
import { ALERT_FREE_LIMIT } from '@/lib/auth-shared';
import { store } from '@/lib/subscriptions';
import type { Region } from '@/lib/types';
import { COOKIE_NAME, isLocale } from '@/lib/i18n-runtime';

export const dynamic = 'force-dynamic';

/**
 * Mirrors the account's alert settings into the subscription store, which is
 * what the weekly digest job actually reads. Signing in already proved the
 * address (email code or Google), so the record is marked confirmed here
 * rather than sending a second opt-in email.
 *
 * The weekly digest email is a Pro feature: a confirmed subscriber is only
 * written when the caller is an active Pro. Free followers still keep their
 * followed-cancer list in `alertCancers` (visible in /following) but receive
 * no email.
 */
async function syncDigestSubscription(
  email: string,
  enabled: boolean,
  cancers: string[],
  regions: Region[],
  proUntil: number
): Promise<void> {
  try {
    const wantsDigest = enabled && proUntil > Date.now() && cancers.length > 0;
    if (!wantsDigest) {
      await store.remove(email);
      return;
    }
    const sub = await store.upsert({
      email,
      cancers,
      regions,
      proUntil,
    });
    if (!sub.confirmed) await store.confirm(sub.token);
  } catch {
    /* preferences are saved either way; the digest can resync next save */
  }
}

/**
 * POST /api/auth/alerts { enabled, cancers, regions, locale? }
 *
 * Free accounts may follow ALERT_FREE_LIMIT cancer types; anything beyond
 * that is trimmed server-side rather than rejected, so the UI never ends up
 * showing a selection the server did not accept.
 */
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ip = await clientIp();
  if (!checkIpRate(`al:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const enabled = !!body?.enabled;

  let cancers: string[] = Array.isArray(body?.cancers)
    ? body.cancers.filter((x: unknown) => typeof x === 'string')
    : u.alertCancers;
  if (cancers.length > ALERT_FREE_LIMIT) cancers = cancers.slice(0, ALERT_FREE_LIMIT);

  let regions: Region[] = Array.isArray(body?.regions)
    ? body.regions.filter((r: unknown) => r === 'US' || r === 'EU' || r === 'CN')
    : u.alertRegions;
  if (regions.length === 0) regions = ['US', 'EU', 'CN'];

  // Persist the preferred locale so the digest renders in their language.
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(COOKIE_NAME)?.value;
  const locale =
    typeof body?.locale === 'string' && isLocale(body.locale)
      ? body.locale
      : isLocale(localeCookie)
        ? localeCookie
        : u.locale;

  const { prefs, cookie } = await savePrefs(u.id, {
    ...u,
    alertEnabled: enabled,
    alertCancers: cancers,
    alertRegions: regions,
    locale,
  });

  await syncDigestSubscription(
    u.email,
    prefs.alertEnabled,
    prefs.alertCancers,
    prefs.alertRegions,
    isProActive(prefs) ? prefs.proUntil : 0
  );

  const res = NextResponse.json({
    ok: true,
    alertEnabled: prefs.alertEnabled,
    alertCancers: prefs.alertCancers,
    alertRegions: prefs.alertRegions,
    locale: prefs.locale ?? null,
    max: ALERT_FREE_LIMIT,
  });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
