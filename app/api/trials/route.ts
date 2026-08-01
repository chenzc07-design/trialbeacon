import { NextRequest, NextResponse } from 'next/server';
import {
  getCancerFeed,
  getAfterCareFeed,
  applyFilters,
} from '@/lib/data';
import type { Region } from '@/lib/types';

// Live registry data — never cache the handler, let the underlying fetch
// revalidation decide freshness.
export const dynamic = 'force-dynamic';

/**
 * Public, read-only feed of trial/regulator/guideline records.
 *
 * Query params:
 *   cancer     cancer slug (e.g. lung, breast) or "all"
 *   afterCare  1 → conservative / palliative-care view
 *   region     US | EU | CN | OTHER
 *   open       1 → only records still open to enrolment
 *   phases     comma list, e.g. Phase%203,Phase%202%2F3
 *   limit      max items (1–200, default 40)
 *
 * The future iOS/Android app and the email/WeChat digest both consume this
 * same endpoint, so the web and native clients never diverge.
 */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const cancer = sp.get('cancer') ?? 'all';
  const afterCare = sp.get('afterCare') === '1';
  const region = (sp.get('region') as Region | null) ?? undefined;
  const openOnly = sp.get('open') === '1';
  const phases = sp.get('phases')?.split(',').filter(Boolean);
  const limit = Math.max(1, Math.min(Number(sp.get('limit') ?? 40) || 40, 200));

  const feed = afterCare
    ? await getAfterCareFeed(limit)
    : await getCancerFeed(cancer, { limit });

  const items = applyFilters(feed.items, {
    region,
    openOnly,
    phases: phases?.length ? phases : undefined,
  }).slice(0, limit);

  return NextResponse.json(
    {
      cancer,
      afterCare,
      live: feed.live,
      fetchedAt: feed.fetchedAt,
      count: items.length,
      items,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}
