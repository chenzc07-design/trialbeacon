import { NextResponse } from 'next/server';
import { setSubscriptionId, grantPro, recordOrder, buildOrder } from '@/lib/entitlement';
import { recordEvent } from '@/lib/stats';
import { recordPayment } from '@/lib/metrics';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Called from the browser after PayPal approves a subscription (onApprove).
 * This is the route that can actually set the user's entitlement cookie, so it
 * is the authoritative Pro grant for the scaffold. Production deployments
 * should additionally rely on the verified webhook for renewals.
 */
export async function POST(req: Request) {
  let subscriptionId: string | undefined;
  try {
    const b = (await req.json()) as { subscriptionId?: unknown };
    subscriptionId =
      typeof b?.subscriptionId === 'string' ? b.subscriptionId : undefined;
  } catch {
    /* fall through */
  }
  try {
    const c1 = subscriptionId ? await setSubscriptionId(subscriptionId) : null;
    const { cookie: c2, proUntil } = await grantPro(1);
    // Minimal order record (payment metadata only — no PHI).
    const order = await buildOrder('subscription', '6.90', 'USD', subscriptionId ?? '');
    const orderCookie = await recordOrder(order);
    // Central payment record for owner revenue / paid-user metrics.
    const user = await getCurrentUser().catch(() => null);
    await recordPayment({
      type: 'subscription',
      amount: 6.9,
      currency: 'USD',
      paypalId: subscriptionId ?? '',
      email: user?.email,
    }).catch(() => undefined);
    await recordEvent('payment_success');
    const res = NextResponse.json({ ok: true, proUntil });
    if (c1) res.cookies.set(c1.name, c1.value, c1.options);
    res.cookies.set(c2.name, c2.value, c2.options);
    if (subscriptionId) res.cookies.set(orderCookie.name, orderCookie.value, orderCookie.options);
    return res;
  } catch (e) {
    await recordEvent('payment_failure');
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'error' },
      { status: 500 }
    );
  }
}
