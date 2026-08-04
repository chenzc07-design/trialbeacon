// POST /api/discussion-list/quota
//   body: { items: number }
//   ?action=consume  → checks AND writes the generation back to the prefs cookie.
//   (no action)      → read-only check, no write.
//
// This is the single authority for whether the current request may generate a
// discussion list. The client UI only reflects it; it never enforces on its own.

import { NextRequest, NextResponse } from 'next/server';
import { checkQuota, consumeQuota } from '@/lib/quota';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  let items = 1;
  try {
    const body = (await req.json()) as { items?: unknown };
    if (typeof body?.items === 'number' && Number.isFinite(body.items) && body.items > 0) {
      items = Math.floor(body.items);
    }
  } catch {
    /* default to 1 when the body is missing/garbled */
  }

  const consume = req.nextUrl.searchParams.get('action') === 'consume';
  const res = consume ? await consumeQuota(items) : await checkQuota(items);

  const json = {
    allowed: res.allowed,
    plan: res.plan,
    signedIn: res.signedIn,
    reason: res.reason,
    dailyRemaining: res.dailyRemaining,
    dailyLimit: res.dailyLimit,
    genLimit: res.genLimit,
    unlockCredits: res.unlockCredits,
    usesCredit: res.usesCredit,
    proUntil: res.proUntil,
  };

  const out = NextResponse.json(json);
  const cookie = (res as { cookie?: { name: string; value: string; options: Record<string, unknown> } }).cookie;
  if (cookie) {
    out.cookies.set(cookie.name, cookie.value, cookie.options as Record<string, unknown>);
  }
  return out;
}
