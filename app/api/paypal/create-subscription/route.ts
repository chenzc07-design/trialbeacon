import { NextResponse } from 'next/server';
import {
  createSubscription,
  paypalSubscriptionConfigured,
} from '@/lib/paypal';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST() {
  if (!paypalSubscriptionConfigured()) {
    return NextResponse.json({ error: 'paypal_sub_not_configured' }, { status: 503 });
  }
  try {
    const u = await getCurrentUser();
    const subscriptionId = await createSubscription(u?.email);
    return NextResponse.json({ subscriptionId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'paypal_error' },
      { status: 502 }
    );
  }
}
