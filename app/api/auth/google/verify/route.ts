import { NextResponse } from 'next/server';
import {
  verifyState,
  verifyGoogleIdToken,
  issueSessionCookie,
  uidForEmail,
  resolvePrefsOnSignIn,
  providerPrefsCookie,
} from '@/lib/auth';
import { markAccountSeen } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/google/verify  { id_token, state }
 *
 * The browser performs the Google code→token exchange and posts the resulting
 * id_token here. We verify (a) the HMAC-signed `state` and (b) the id_token's
 * RS256 signature against Google's public JWKS — without ever calling Google.
 * On success we issue the session + provider-preference cookies.
 */
export async function POST(req: Request) {
  let body: { id_token?: string; state?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad_body' }, { status: 400 });
  }
  const { id_token, state } = body;
  if (!id_token || !state) {
    return NextResponse.json({ ok: false, error: 'missing_params' }, { status: 400 });
  }
  const s = verifyState(state);
  if (!s) {
    return NextResponse.json({ ok: false, error: 'bad_state' }, { status: 400 });
  }
  let profile: { email: string; email_verified?: boolean };
  try {
    profile = verifyGoogleIdToken(id_token, s.n);
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message ?? 'verify_failed') },
      { status: 400 }
    );
  }
  if (!profile.email || profile.email_verified === false) {
    return NextResponse.json({ ok: false, error: 'email_unverified' }, { status: 400 });
  }
  // Same address ⇒ same account across every provider (no linking step).
  const uid = uidForEmail(profile.email);
  await resolvePrefsOnSignIn(uid);
  try {
    await markAccountSeen(profile.email);
  } catch {
    /* metrics are non-critical */
  }
  const res = NextResponse.json({
    ok: true,
    next: s.next.startsWith('/') ? s.next : '/account',
  });
  const session = issueSessionCookie(profile.email, 'google');
  res.cookies.set(session.name, session.value, session.options);
  const pc = await providerPrefsCookie(uid, 'google');
  res.cookies.set(pc.name, pc.value, pc.options);
  return res;
}
