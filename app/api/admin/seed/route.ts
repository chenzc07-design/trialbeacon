import { NextResponse } from 'next/server';
import { recordEvent, resetStats } from '@/lib/stats';
import { recordPayment, markAccountSeen, resetMetrics } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

/**
 * DEV-ONLY demo seed. Gated by NODE_ENV !== 'production' AND a matching
 * STATS_TOKEN, so it is completely inert once the app is built for production
 * (Vercel). Used only to populate the local preview with sample data so the
 * owner dashboard can be reviewed before real traffic arrives.
 */
export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'dev_only' }, { status: 404 });
  }
  const token = new URL(req.url).searchParams.get('token');
  if (!process.env.STATS_TOKEN || token !== process.env.STATS_TOKEN) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Idempotent: wipe any existing demo state so repeated seeding stays stable.
  await resetStats();
  await resetMetrics();

  // Visits.
  for (let i = 0; i < 1280; i++) await recordEvent('page_view');
  for (let i = 0; i < 540; i++) await recordEvent('view_cancer');
  for (let i = 0; i < 130; i++) await recordEvent('view_aftercare');
  for (let i = 0; i < 96; i++) await recordEvent('pro_visit');
  for (let i = 0; i < 64; i++) await recordEvent('alerts_subscribe');

  // Registrations (distinct emails → first sign-in only).
  const regs = [
    'a@example.com', 'b@example.com', 'c@example.com', 'd@example.com',
    'e@example.com', 'f@example.com', 'g@example.com', 'h@example.com',
    'i@example.com', 'j@example.com', 'k@example.com', 'l@example.com',
    'm@example.com', 'n@example.com', 'o@example.com', 'p@example.com',
    'q@example.com', 'r@example.com', 's@example.com', 't@example.com',
    'u@example.com', 'v@example.com', 'w@example.com', 'x@example.com',
    'y@example.com', 'z@example.com', 'aa@example.com', 'ab@example.com',
  ];
  for (const email of regs) await markAccountSeen(email);

  // Payments: 9 single ($4.90) + 5 subscriptions ($6.90).
  const buyers = [
    'a@example.com', 'c@example.com', 'e@example.com', 'g@example.com',
    'i@example.com', 'k@example.com', 'm@example.com', 'o@example.com',
    'q@example.com',
  ];
  for (const email of buyers) {
    await recordPayment({ type: 'single', amount: 4.9, currency: 'USD', paypalId: `cap_${email}`, email }).catch(() => undefined);
  }
  for (let i = 0; i < 5; i++) {
    await recordPayment({ type: 'subscription', amount: 6.9, currency: 'USD', paypalId: `sub_${i}`, email: regs[i] }).catch(() => undefined);
  }

  return NextResponse.json({ ok: true, visits: 1280, registrations: regs.length, payments: 14 });
}
