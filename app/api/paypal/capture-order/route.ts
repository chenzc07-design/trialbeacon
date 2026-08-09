import { NextResponse } from 'next/server';
import { captureOrder, paypalConfigured } from '@/lib/paypal';
import { grantUnlock, recordOrder, buildOrder } from '@/lib/entitlement';
import { recordEvent } from '@/lib/stats';
import { recordPayment } from '@/lib/metrics';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Pull the PayPal capture id out of a v2 orders capture response. */
function captureIdOf(json: any): string | undefined {
  const caps: any[] = json?.purchase_units?.[0]?.payments?.captures ?? [];
  return caps[0]?.id as string | undefined;
}

export async function POST(req: Request) {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'paypal_not_configured' }, { status: 503 });
  }
  let orderId: string | undefined;
  try {
    const b = (await req.json()) as { orderId?: unknown };
    orderId = typeof b?.orderId === 'string' ? b.orderId : undefined;
  } catch {
    /* fall through */
  }
  if (!orderId) {
    return NextResponse.json({ error: 'missing_order' }, { status: 400 });
  }
  try {
    const captured = await captureOrder(orderId);
    const cookie = await grantUnlock(1);
    // Persist a minimal order record (payment metadata only — no PHI).
    const paypalId = captureIdOf(captured) ?? orderId;
    const order = await buildOrder('single', '4.90', 'USD', paypalId);
    const orderCookie = await recordOrder(order);
    // Central payment record for owner revenue / paid-user metrics.
    const user = await getCurrentUser().catch(() => null);
    await recordPayment({
      type: 'single',
      amount: 4.9,
      currency: 'USD',
      paypalId,
      email: user?.email,
    }).catch(() => undefined);
    await recordEvent('payment_success');
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    res.cookies.set(orderCookie.name, orderCookie.value, orderCookie.options);
    return res;
  } catch (e) {
    await recordEvent('payment_failure');
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'paypal_error' },
      { status: 502 }
    );
  }
}
