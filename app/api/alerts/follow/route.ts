import { NextRequest, NextResponse } from 'next/server';
import {
  getCurrentUser,
  savePrefs,
  checkIpRate,
  clientIp,
  isProActive,
} from '@/lib/auth';
import { ALERT_FREE_LIMIT } from '@/lib/auth-shared';
import { syncDigestSubscription } from '@/lib/alerts';
import type { Region } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Single-cancer follow toggle for the /cancers grid and the detail page.
 *
 * Unlike /api/auth/alerts (which persists the whole alert form and silently
 * trims anything past the free limit), this endpoint toggles ONE cancer and
 * returns a clear `limit` error (409) when a free account tries to exceed
 * ALERT_FREE_LIMIT — so the UI can offer "replace a follow" or "view Pro"
 * instead of silently dropping the request.
 *
 * Following writes `alertCancers`, which is exactly what the weekly digest
 * job reads, so a follow is wired into the weekly email topics immediately.
 */
export async function POST(req: NextRequest) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ip = await clientIp();
  if (!checkIpRate(`alf:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const slug = typeof body?.slug === 'string' ? body.slug : '';
  if (!slug) return NextResponse.json({ error: 'bad_slug' }, { status: 400 });

  const follow = body?.follow !== false;
  const replace = body?.replace === true;
  const current = Array.isArray(u.alertCancers) ? u.alertCancers : [];

  let next: string[];
  if (!follow) {
    next = current.filter((s) => s !== slug);
  } else if (current.includes(slug)) {
    next = current;
  } else if (current.length >= ALERT_FREE_LIMIT && !replace) {
    return NextResponse.json(
      { error: 'limit', max: ALERT_FREE_LIMIT, alertCancers: current },
      { status: 409 }
    );
  } else {
    next = replace ? [slug] : [...current, slug];
  }

  // Following implies the person wants updates; keep the flag on. Unfollowing
  // leaves the existing enabled state untouched.
  const alertEnabled = follow ? true : u.alertEnabled;

  const { prefs, cookie } = await savePrefs(u.id, {
    ...u,
    alertEnabled,
    alertCancers: next,
    alertRegions: u.alertRegions,
    locale: u.locale,
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
    alertCancers: prefs.alertCancers,
    alertEnabled: prefs.alertEnabled,
    max: ALERT_FREE_LIMIT,
  });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
