import { NextResponse } from 'next/server';
import {
  verifyState,
  verifyGoogleIdToken,
  issueSessionCookie,
  uidForEmail,
  resolvePrefsOnSignIn,
  providerPrefsCookie,
  publicOrigin,
} from '@/lib/auth';
import { markAccountSeen } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google/callback?code=...&state=...&error=...
 *
 * Google's authorization-code redirect lands here. We:
 *   1. verify the HMAC-signed `state` (CSRF + nonce binding),
 *   2. exchange the `code` for tokens at oauth2.googleapis.com/token
 *      (server-side, using the client_secret),
 *   3. verify the id_token's RS256 signature against Google's public JWKS,
 *   4. issue the session + provider-preference cookies.
 * Any failure redirects back to /account?google_error=<reason>.
 */
export async function GET(req: Request) {
  const origin = publicOrigin(req);
  const url = new URL(req.url);

  const fail = (err: string) => {
    const dest = new URL('/account', origin);
    dest.searchParams.set('google_error', err);
    return NextResponse.redirect(dest);
  };

  const error = url.searchParams.get('error');
  if (error) return fail(error);

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return fail('missing_params');

  const s = verifyState(state);
  if (!s) return fail('bad_state');

  const cid = process.env.GOOGLE_CLIENT_ID;
  const csec = process.env.GOOGLE_CLIENT_SECRET;
  if (!cid || !csec) return fail('not_configured');

  const redirectUri = new URL('/api/auth/google/callback', origin).toString();

  let idToken: string;
  try {
    const r = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: cid,
        client_secret: csec,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });
    const tokens = (await r.json()) as { id_token?: string; error?: string };
    if (!r.ok || !tokens.id_token) {
      return fail(tokens.error || 'token_exchange_failed');
    }
    idToken = tokens.id_token;
  } catch {
    return fail('token_exchange_failed');
  }

  let profile: { email: string; email_verified?: boolean };
  try {
    profile = await verifyGoogleIdToken(idToken, s.n);
  } catch (e: any) {
    return fail(String(e?.message ?? 'verify_failed'));
  }
  if (!profile.email || profile.email_verified === false) {
    return fail('email_unverified');
  }

  // Same address ⇒ same account across every provider (no linking step).
  const uid = uidForEmail(profile.email);
  await resolvePrefsOnSignIn(uid);
  try {
    await markAccountSeen(profile.email);
  } catch {
    /* metrics are non-critical */
  }

  const dest = new URL(s.next.startsWith('/') ? s.next : '/account', origin);
  const res = NextResponse.redirect(dest);
  const session = issueSessionCookie(profile.email, 'google');
  res.cookies.set(session.name, session.value, session.options);
  const pc = await providerPrefsCookie(uid, 'google');
  res.cookies.set(pc.name, pc.value, pc.options);
  return res;
}
