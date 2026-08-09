import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  issueSessionCookie,
  uidForEmail,
  resolvePrefsOnSignIn,
  providerPrefsCookie,
} from '@/lib/auth';
import { markAccountSeen } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

const SECRET =
  process.env.AUTH_SECRET ||
  'tb-dev-secret-do-not-use-in-prod-0000000000000000';

function b64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/=+$/, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}
function b64urlDecode(s: string): Buffer {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

interface OAuthState {
  next: string;
  n: string;
  t: number;
}

function verifyState(token: string): OAuthState | null {
  const [body, mac] = token.split('.');
  if (!body || !mac) return null;
  const expected = b64url(
    crypto.createHmac('sha256', SECRET).update(body).digest()
  );
  if (
    expected.length !== mac.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(mac))
  )
    return null;
  try {
    const s = JSON.parse(b64urlDecode(body).toString('utf8')) as OAuthState;
    // 10-minute replay window
    if (Date.now() - s.t > 10 * 60 * 1000) return null;
    return s;
  } catch {
    return null;
  }
}

async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; id_token?: string }> {
  const cid = process.env.GOOGLE_CLIENT_ID!;
  const csec = process.env.GOOGLE_CLIENT_SECRET!;
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: cid,
      client_secret: csec,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) {
    throw new Error(`token_exchange_failed: ${res.status}`);
  }
  return res.json();
}

async function fetchGoogleProfile(
  accessToken: string
): Promise<{ email: string; email_verified?: boolean }> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('profile_fetch_failed');
  return res.json();
}

export async function GET(req: Request) {
  const cid = process.env.GOOGLE_CLIENT_ID;
  const csec = process.env.GOOGLE_CLIENT_SECRET;
  if (!cid || !csec) {
    return NextResponse.json(
      { error: 'google_not_configured' },
      { status: 503 }
    );
  }
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');
  if (err) {
    return NextResponse.redirect(
      new URL(`/account?google_error=${encodeURIComponent(err)}`, url.origin)
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/account?google_error=missing_code', url.origin)
    );
  }
  const s = verifyState(state);
  if (!s) {
    return NextResponse.redirect(
      new URL('/account?google_error=bad_state', url.origin)
    );
  }
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  let tokens, profile;
  try {
    tokens = await exchangeCode(code, redirectUri);
    profile = await fetchGoogleProfile(tokens.access_token);
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(
        `/account?google_error=${encodeURIComponent(String(e?.message ?? 'oauth_failed'))}`,
        url.origin
      )
    );
  }
  if (!profile.email || profile.email_verified === false) {
    return NextResponse.redirect(
      new URL('/account?google_error=email_unverified', url.origin)
    );
  }
  // Identity is derived from the address, so signing in with Google lands on
  // the same account as an email code for the same address — no linking step.
  const uid = uidForEmail(profile.email);
  await resolvePrefsOnSignIn(uid);
  // Best-effort registration tracking (first sign-in only).
  try {
    await markAccountSeen(profile.email);
  } catch {
    /* metrics are non-critical */
  }

  const session = issueSessionCookie(profile.email, 'google');
  const dest = s.next.startsWith('/') ? s.next : '/';
  const res = NextResponse.redirect(new URL(dest, url.origin));
  res.cookies.set(session.name, session.value, session.options);
  const pc = await providerPrefsCookie(uid, 'google');
  res.cookies.set(pc.name, pc.value, pc.options);
  return res;
}
