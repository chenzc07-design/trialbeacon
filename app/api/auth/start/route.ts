import { NextResponse } from 'next/server';
import { z } from '@/lib/zod-mini';
import {
  createEmailCode,
  issueChallengeCookie,
  checkIpRate,
  clientIp,
} from '@/lib/auth';
import { sendEmail } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/start { email }
 *
 * Emails a 6-digit code and sets a short-lived signed challenge cookie that
 * carries the attempt counter. No account record is created here — identity
 * is derived from the address at verification time.
 */
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!checkIpRate(ip, 6, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const parsed = z.object({ email: z.email() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_email' }, { status: 400 });
  }

  const email = parsed.data.email.trim();
  const { code, expires } = createEmailCode(email);

  const sent = await sendEmail({
    to: email,
    subject: 'Your TrialBeacon sign-in code',
    text:
      `Your TrialBeacon sign-in code is ${code}. ` +
      `It expires in 10 minutes. If you did not request this, ignore this email.`,
  }).catch(() => false);

  // A code we cannot deliver is a dead end. Say so instead of leaving the
  // person waiting for mail that will never arrive.
  if (!sent && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'email_unavailable' }, { status: 503 });
  }

  const chal = issueChallengeCookie(email);
  const res = NextResponse.json({
    ok: true,
    expires,
    delivered: sent,
    // Development convenience only: lets the local UI complete the flow
    // without an SMTP provider configured.
    ...(sent ? {} : { devCode: code }),
  });
  res.cookies.set(chal.name, chal.value, chal.options);
  return res;
}
