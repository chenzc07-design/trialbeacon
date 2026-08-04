import { NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/paypal';
import { recordEvent } from '@/lib/stats';

export const dynamic = 'force-dynamic';

/**
 * PayPal webhook receiver. Verifies the signature, then reacts to subscription
 * lifecycle events.
 *
 * NOTE: a webhook is a server-to-server call — it cannot set the *user's*
 * cookie, so it cannot by itself grant Pro to the right account without a
 * subscription-id → user mapping (a small store). For the scaffold we verify,
 * log, and record the payment event; production should persist the
 * subscription→user mapping on approval and update that record here. The
 * authoritative per-user grant happens in /api/paypal/subscription-approved,
 * which runs in the user's own browser flow.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const hdrs: Record<string, string | undefined> = {};
  req.headers.forEach((v, k) => {
    hdrs[k] = v;
  });

  let verified = false;
  try {
    verified = await verifyWebhookSignature(hdrs, raw);
  } catch {
    verified = false;
  }
  if (!verified) {
    return NextResponse.json({ error: 'bad_signature' }, { status: 400 });
  }

  let event: { event_type?: string; resource?: { id?: string } } | null = null;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const type = event?.event_type;
  try {
    if (
      type === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
      type === 'PAYMENT.SALE.COMPLETED'
    ) {
      // Production: map event.resource.id -> user, update their Pro window.
      await recordEvent('payment_success');
    } else if (
      type === 'BILLING.SUBSCRIPTION.CANCELLED' ||
      type === 'BILLING.SUBSCRIPTION.SUSPENDED' ||
      type === 'BILLING.SUBSCRIPTION.EXPIRED'
    ) {
      // Production: clear Pro renewal for the mapped user.
    }
  } catch {
    /* log only */
  }
  return NextResponse.json({ ok: true });
}
