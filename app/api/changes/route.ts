import { NextRequest, NextResponse } from 'next/server';
import { getChangeTracker } from '@/lib/data';

export const dynamic = 'force-dynamic';

/**
 * Change Tracker feed: what changed in the official records over the last N days.
 *
 * Query params:
 *   days   window length (1–90, default 14)
 *
 * Powers the Alerts view and is the natural source for the email digest and
 * app push notifications (new / updated / closed records per cancer).
 */
export async function GET(req: NextRequest) {
  const days = Math.max(
    1,
    Math.min(Number(req.nextUrl.searchParams.get('days') ?? 14) || 14, 90)
  );

  const result = await getChangeTracker(days);

  return NextResponse.json(
    {
      live: result.live,
      windowStart: result.windowStart,
      total: result.total,
      groups: result.groups,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
