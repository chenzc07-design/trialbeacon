import { NextResponse } from 'next/server';
import { createOneTimeOrder, paypalConfigured } from '@/lib/paypal';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!paypalConfigured()) {
    return NextResponse.json({ error: 'paypal_not_configured' }, { status: 503 });
  }
  try {
    const orderId = await createOneTimeOrder();
    return NextResponse.json({ orderId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'paypal_error' },
      { status: 502 }
    );
  }
}
