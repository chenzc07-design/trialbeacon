import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, isProActive } from '@/lib/auth';
import { buildDigestContext } from '@/lib/digest';
import { renderWeeklyDigest } from '@/lib/email';
import { sendEmail, isEmailConfigured } from '@/lib/mailer';
import { windowStartISO } from '@/lib/data';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * Authenticated "send me a test email" endpoint for the follow centre.
 *
 * Sends a real digest (the same neutral template the weekly job uses) to the
 * signed-in person's own address so they can verify the pipeline end to end
 * before relying on the weekly send. Gated to active Pro subscribers who
 * follow at least one record or cancer type and have a known email.
 *
 * The weekly job reads subscribers from the durable store; this endpoint does
 * not — it uses the session directly, so it works regardless of whether the
 * subscription store (Upstash) is configured.
 */
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!isProActive(user)) {
    return NextResponse.json({ error: 'pro_required' }, { status: 403 });
  }
  const hasFollows =
    (user.myList?.length ?? 0) > 0 || (user.alertCancers?.length ?? 0) > 0;
  if (!hasFollows) {
    return NextResponse.json({ error: 'no_follows' }, { status: 400 });
  }
  if (!user.email) {
    return NextResponse.json({ error: 'no_email' }, { status: 400 });
  }
  if (!isEmailConfigured()) {
    return NextResponse.json(
      { error: 'email_not_configured', configured: false },
      { status: 503 }
    );
  }

  const siteUrl = process.env.SITE_URL ?? 'https://trialbeacon.vercel.app';
  const since = windowStartISO(7);
  const ctx = await buildDigestContext({
    email: user.email,
    prefs: user,
    sinceIso: since,
    siteUrl,
    unsubscribeBase: `${siteUrl}/unsubscribe`,
  });
  const { subject, text, html } = renderWeeklyDigest(ctx);
  const delivered = await sendEmail({ to: user.email, subject, text, html });

  return NextResponse.json({
    ok: delivered,
    delivered,
    configured: true,
    email: user.email,
    itemCount: ctx.recordItems.length + ctx.cancerItems.length,
  });
}
