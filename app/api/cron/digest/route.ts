import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/subscriptions';
import { renderWeeklyDigest } from '@/lib/email';
import { sendEmail, isEmailConfigured } from '@/lib/mailer';
import { getCancerFeed, getChangeTracker, windowStartISO } from '@/lib/data';
import {
  sendWecomMarkdown,
  renderWecomDigest,
  isWecomConfigured,
} from '@/lib/wecom';
import { getCancer } from '@/lib/cancers';
import type { UpdateItem } from '@/lib/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

/**
 * Weekly digest job.
 *
 * Trigger once a week from any scheduler (Vercel Cron, GitHub Actions,
 * systemd timer, curl). Protect with CRON_SECRET. With no provider configured
 * it runs in dry-run mode and returns the rendered payloads for verification.
 *
 * Responsibilities:
 *   1. Email every CONFIRMED subscriber a minimal digest of new official
 *      records for the cancer types + regions they follow.
 *   2. Push one 企业微信 group message summarising recent registry changes.
 *
 * vercel.json:
 *   { "crons": [{ "path": "/api/cron/digest", "schedule": "0 8 * * 1" }] }
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const provided =
      request.nextUrl.searchParams.get('secret') ??
      request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
      '';
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
  }

  const dryRun = !isEmailConfigured() && !isWecomConfigured();
  const siteUrl = process.env.SITE_URL ?? 'https://trialbeacon.vercel.app';
  const since = windowStartISO(7);

  // Only email people who completed double opt-in.
  const subscribers = (await store.list()).filter((s) => s.confirmed);

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
            (sub.regions.length === 0 || sub.regions.includes(i.region))
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
    if (isEmailConfigured()) {
      sent = await sendEmail({ to: sub.email, subject, text });
    }

    results.push({ email: sub.email, itemCount: unique.length, subject, sent });
  }

  // ---- 企业微信 group push (single message) ----
  let wecomOk = false;
  if (isWecomConfigured()) {
    const changes = await getChangeTracker(7);
    const flat: UpdateItem[] = changes.groups
      .filter((g) => g.kind !== 'closed')
      .flatMap((g) => g.items);
    const content = renderWecomDigest({
      heading: `TrialBeacon 近 7 天官方记录更新（${changes.total} 条）`,
      items: flat,
      unsubscribeNote:
        '来源：ClinicalTrials.gov / CDE / EMA 等官方登记平台。详情以原文为准。',
    });
    wecomOk = (await sendWecomMarkdown(content)).ok;
  }

  return NextResponse.json({
    ok: true,
    dryRun,
    since,
    subscribers: subscribers.length,
    emailsSent: results.filter((r) => r.sent).length,
    emailsFailed: results.filter((r) => !r.sent && r.itemCount >= 0).length,
    emailConfigured: isEmailConfigured(),
    wecomConfigured: isWecomConfigured(),
    wecomOk,
    results,
  });
}

export const POST = GET;
