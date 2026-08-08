import { NextResponse } from 'next/server';
import { z } from '@/lib/zod-mini';
import {
  verifyEmailCode,
  issueSessionCookie,
  readChallenge,
  bumpChallengeCookie,
  clearChallengeCookie,
  CHALLENGE_MAX_ATTEMPTS,
  checkIpRate,
  clientIp,
  uidForEmail,
  resolvePrefsOnSignIn,
  providerPrefsCookie,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/verify { email, code }
 *
 * The challenge cookie set by /start is required: it proves a code was
 * actually requested from this browser and carries the attempt counter,
 * which is the real brute-force limit (the IP bucket is per-instance and
 * therefore only advisory).
 */
export async function POST(req: Request) {
  const ip = await clientIp();
  if (!checkIpRate(ip, 12, 10 * 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const parsed = z.object({ email: z.email(), code: z.string() }).safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 });
  }
  const { email, code } = parsed.data;

  const chal = await readChallenge();
  if (!chal || chal.e !== email.toLowerCase()) {
    return NextResponse.json({ error: 'no_challenge' }, { status: 400 });
  }
  if (chal.n >= CHALLENGE_MAX_ATTEMPTS) {
    const cleared = clearChallengeCookie();
    const res = NextResponse.json({ error: 'too_many_attempts' }, { status: 429 });
    res.cookies.set(cleared.name, cleared.value, cleared.options);
    return res;
  }

  if (!verifyEmailCode(email, code)) {
    const bumped = bumpChallengeCookie(chal);
    const res = NextResponse.json({ error: 'invalid_code' }, { status: 401 });
    res.cookies.set(bumped.name, bumped.value, bumped.options);
    return res;
  }

  const session = issueSessionCookie(email, 'email');
  const uid = uidForEmail(email);

  // Anything already saved for this account — in the sync store, or left on
  // this device by an earlier session — comes back. Record the login method.
  const prefs = await resolvePrefsOnSignIn(uid);
  const pc = await providerPrefsCookie(uid, 'email');
  const userPrefs: typeof prefs = {
    ...prefs,
    providers: Array.from(new Set([...(prefs.providers ?? []), 'email'])),
  };

  const res = NextResponse.json({
    ok: true,
    user: { id: uid, email, provider: 'email', ...userPrefs },
  });
  res.cookies.set(session.name, session.value, session.options);
  res.cookies.set(pc.name, pc.value, pc.options);
  const cleared = clearChallengeCookie();
  res.cookies.set(cleared.name, cleared.value, cleared.options);
  return res;
}
