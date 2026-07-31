import { NextResponse } from 'next/server';
import { subscriptionStore } from '@/lib/subscriptions';
import { renderWeeklyDigest } from '@/lib/email';
import { sendEmail, isEmailConfigured } from '@/lib/mailer';
import { getCancerFeed, windowStartISO } from '@/lib/data';
import { getCancer } from '@/lib/cancers';
import type { UpdateItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Weekly digest job.
 *
 * Trigger once a week from any scheduler (Vercel Cron, GitHub Actions,
 * systemd timer, cron + curl). Protect it with CRON_SECRET.
 *
 *   vercel.json:
 *   { "crons": [{ "path": "/api/cron/digest", "schedule": "0 8 * * 1" }] }
 *
 * With no email provider configured the route runs in dry-run mode and
 * returns the rendered payloads, so the pipeline can be verified end to end
 * before any address is contacted.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  const { searchParams } = new URL(request.url);
  const dryRun = searchParams.get('dryRun') === '1' || !isEmailConfigured();
  const siteUrl = process.env.SITE_URL ?? 'https://trialbeacon.example.com';
  const since = windowStartISO(7);

  const subscribers = await subscriptionStore.list();
  const results: {
    email: string;
    itemCount: number;
    subject: string;
    sent: boolean;
  }[] = [];

  // Cache feeds so N subscribers following the same cancer cost one lookup.
  const feedCache = new Map<string, UpdateItem[]>();
  const feedFor = async (slug: string): Promise<UpdateItem[]> => {
    const cached = feedCache.get(slug);
    if (cached) return cached;
    const { items } = await getCancerFeed(slug, { limit: 25 });
    feedCache.set(slug, items);
    return items;
  };

  for (const sub of subscribers) {
    const collected: UpdateItem[] = [];
    for (const slug of sub.cancers) {
      const items = await feedFor(slug);
      collected.push(
        ...items.filter(
          (i) =>
            i.date !== null &&
            i.date >= since &&
            sub.regions.includes(i.region)
        )
      );
    }

    const unique = Array.from(
      new Map(collected.map((i) => [i.id, i])).values()
    ).slice(0, 25);

    const labels = sub.cancers.map((s) => getCancer(s)?.label ?? s);
    const { subject, text } = renderWeeklyDigest({
      cancerLabels: labels,
      items: unique,
      siteUrl,
      unsubscribeUrl: `${siteUrl}/unsubscribe?email=${encodeURIComponent(sub.email)}`,
    });

    let sent = false;
    if (!dryRun) {
      sent = await sendEmail({ to: sub.email, subject, text });
    }

    results.push({
      email: sub.email,
      itemCount: unique.length,
      subject,
      sent,
    });
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    since,
    subscribers: subscribers.length,
    results,
  });
}
