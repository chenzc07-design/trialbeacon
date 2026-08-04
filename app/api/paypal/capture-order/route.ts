import { NextResponse } from 'next/server';
import { captureOrder, paypalConfigured } from '@/lib/paypal';
import { grantUnlock } from '@/lib/entitlement';
import { recordEvent } from '@/lib/stats';

export const dynamic = 'force-dynamic';

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
    await captureOrder(orderId);
    const cookie = await grantUnlock(1);
    await recordEvent('payment_success');
    const res = NextResponse.json({ ok: true });
    res.cookies.set(cookie.name, cookie.value, cookie.options);
    return res;
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'paypal_error' },
      { status: 502 }
    );
  }
}
