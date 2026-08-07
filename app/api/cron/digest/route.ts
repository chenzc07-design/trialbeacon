import { NextRequest, NextResponse } from 'next/server';
import { store } from '@/lib/subscriptions';
import { renderWeeklyDigest } from '@/lib/email';
import { sendEmail, isEmailConfigured } from '@/lib/mailer';
import { buildDigestContext } from '@/lib/digest';
import { getCancerFeed, windowStartISO, allBaseline, matchesCancer } from '@/lib/data';
import {
  sendWecomMarkdown,
  renderWecomDigest,
  isWecomConfigured,
} from '@/lib/wecom';
import { getChangeTracker } from '@/lib/data';
import { readUserPrefsByEmail, defaultPrefs } from '@/lib/auth';
import type { Prefs } from '@/lib/auth';
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
 *   1. Email every CONFIRMED Pro subscriber a minimal digest: saved records
 *      that changed this week, plus new/updated public records for the cancer
 *      types they follow. The weekly digest is a Pro feature — free followers
 *      keep their in-site list but receive no email.
 *   2. Skip subscribers with no changes at all (only-when-there-are-changes).
 *   3. Push one 企业微信 group message summarising recent registry changes.
 *
 * Manual trigger:
 *   ?test=you@example.com   render + (if configured) send for that subscriber
 *   ?demo=1                  render a synthetic sample (1 cancer + 2 records)
 *   ?html=1                  include the rendered HTML in the JSON response
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
  const params = request.nextUrl.searchParams;
  const testEmail = params.get('test');
  const demo = params.get('demo') === '1';
  const includeHtml = params.get('html') === '1' || demo;

  // ---- manual test / demo trigger --------------------------------------
  if (testEmail || demo) {
    const email = testEmail ?? 'demo@trialbeacon.example';
    let prefs: Prefs;

    if (demo) {
      // Synthetic sample so the email can be verified without a real account:
      // 1 cancer type + 2 of its public records, treated as an active Pro.
      // Use offline-baseline records (which resolve via findBaselineItem and
      // carry a recent change date) so the "Record updates" section renders.
      const recentLung = allBaseline()
        .filter((i) => matchesCancer(i, 'lung') && i.date && i.date >= since)
        .slice(0, 2);
      prefs = {
        ...defaultPrefs(),
        myList: recentLung.map((i) => i.id),
        alertCancers: ['lung'],
        alertRegions: ['US', 'EU', 'CN'],
        locale: 'en',
        alertEnabled: true,
        plan: 'pro',
        proUntil: Date.now() + 32 * 24 * 60 * 60 * 1000,
      };
    } else {
      const sub = await store.find(email);
      const stored = await readUserPrefsByEmail(email);
      if (!sub && !stored) {
        return NextResponse.json(
          { error: 'no_subscriber', email },
          { status: 404 }
        );
      }
      prefs = {
        ...defaultPrefs(),
        ...(stored ?? {}),
        alertCancers: sub?.cancers?.length ? sub.cancers : stored?.alertCancers ?? [],
        alertRegions: sub?.regions?.length ? sub.regions : stored?.alertRegions ?? ['US', 'EU', 'CN'],
      };
    }

    const ctx = await buildDigestContext({
      email,
      prefs,
      sinceIso: since,
      siteUrl,
      unsubscribeBase: `${siteUrl}/unsubscribe`,
    });
    const { subject, text, html } = renderWeeklyDigest(ctx);
    let sent = false;
    if (isEmailConfigured()) sent = await sendEmail({ to: email, subject, text, html });
    return NextResponse.json({
      ok: true,
      test: true,
      demo,
      dryRun,
      email,
      itemCount: ctx.recordItems.length + ctx.cancerItems.length,
      subject,
      text,
      ...(includeHtml ? { html } : {}),
      sent,
    });
  }

  // ---- normal weekly job -----------------------------------------------
  // Only confirmed subscribers whose Pro entitlement is still active.
  const subscribers = (await store.list()).filter(
    (s) => s.confirmed && (!s.proUntil || s.proUntil > Date.now())
  );

  const results: {
    email: string;
    itemCount: number;
    subject: string;
    sent: boolean;
    skipped?: string;
  }[] = [];

  for (const sub of subscribers) {
    const stored = await readUserPrefsByEmail(sub.email);
    const prefs: Prefs = {
      ...defaultPrefs(),
      ...(stored ?? {}),
      alertCancers: sub.cancers,
      alertRegions: sub.regions,
    };

    const ctx = await buildDigestContext({
      email: sub.email,
      prefs,
      sinceIso: since,
      siteUrl,
      unsubscribeBase: `${siteUrl}/unsubscribe`,
    });

    // Only-when-there-are-changes: skip a subscriber with nothing new.
    if (ctx.recordItems.length === 0 && ctx.cancerItems.length === 0) {
      results.push({ email: sub.email, itemCount: 0, subject: '', sent: false, skipped: 'no_changes' });
      continue;
    }

    const { subject, text, html } = renderWeeklyDigest(ctx);
    let sent = false;
    if (isEmailConfigured()) {
      sent = await sendEmail({ to: sub.email, subject, text, html });
    }
    results.push({ email: sub.email, itemCount: ctx.recordItems.length + ctx.cancerItems.length, subject, sent });
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
    emailsSkipped: results.filter((r) => r.skipped).length,
    emailConfigured: isEmailConfigured(),
    wecomConfigured: isWecomConfigured(),
    wecomOk,
    results,
  });
}

export const POST = GET;
