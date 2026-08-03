import { NextResponse } from 'next/server';
import { getCurrentUser, savePrefs, checkIpRate, clientIp } from '@/lib/auth';
import { ALERT_FREE_LIMIT } from '@/lib/auth-shared';
import { store } from '@/lib/subscriptions';
import type { Region } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Mirrors the account's alert settings into the subscription store, which is
 * what the weekly digest job actually reads. Signing in already proved the
 * address (email code or Google), so the record is marked confirmed here
 * rather than sending a second opt-in email.
 */
async function syncDigestSubscription(
  email: string,
  enabled: boolean,
  cancers: string[],
  regions: Region[]
): Promise<void> {
  try {
    if (!enabled || cancers.length === 0) {
      await store.remove(email);
      return;
    }
    const sub = await store.upsert({ email, cancers, regions });
    if (!sub.confirmed) await store.confirm(sub.token);
  } catch {
    /* preferences are saved either way; the digest can resync next save */
  }
}

/**
 * POST /api/auth/alerts { enabled, cancers, regions }
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

  const { prefs, cookie } = await savePrefs(u.id, {
    ...u,
    alertEnabled: enabled,
    alertCancers: cancers,
    alertRegions: regions,
  });

  await syncDigestSubscription(
    u.email,
    prefs.alertEnabled,
    prefs.alertCancers,
    prefs.alertRegions
  );

  const res = NextResponse.json({
    ok: true,
    alertEnabled: prefs.alertEnabled,
    alertCancers: prefs.alertCancers,
    alertRegions: prefs.alertRegions,
    max: ALERT_FREE_LIMIT,
  });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
