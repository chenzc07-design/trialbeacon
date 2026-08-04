import { NextResponse } from 'next/server';
import { cancelSubscription, paypalConfigured } from '@/lib/paypal';
import { cancelPro } from '@/lib/entitlement';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    const u = await getCurrentUser();
    if (u?.paypalSubscriptionId && paypalConfigured()) {
      // Best-effort; ignore failures so the local entitlement still clears.
      await cancelSubscription(u.paypalSubscriptionId).catch(() => undefined);
    }
    const cookie = await cancelPro();
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'error' },
      { status: 500 }
    );
  }
}
