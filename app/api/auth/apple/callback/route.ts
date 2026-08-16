import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import {
  issueSessionCookie,
  prefsCookie,
  uidForEmail,
  resolvePrefsOnSignIn,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

// In production AUTH_SECRET MUST be set; a missing secret makes the OAuth
// state token forgeable, so we refuse to boot. Local dev gets a stable
// (clearly-labelled) dev secret instead — never used in production.
let SECRET: string = process.env.AUTH_SECRET || '';
if (!SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is not configured. Refusing to start in production.');
  }
  SECRET = 'tb-dev-secret-do-not-use-in-prod-0000000000000000';
}

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
    if (Date.now() - s.t > 10 * 60 * 1000) return null; // 10-min replay window
    return s;
  } catch {
    return null;
  }
}

/**
 * Apple has no static client_secret. It requires a JWT signed with the .p8
 * key (ES256), valid for at most 1 hour. We mint it per request.
 */
function appleClientSecret(): string {
  const team = process.env.APPLE_TEAM_ID!;
  const keyId = process.env.APPLE_KEY_ID!;
  const clientId = process.env.APPLE_CLIENT_ID!;
  // The .p8 file contents may be stored with literal "\n"; normalise to LF.
  const priv = (process.env.APPLE_PRIVATE_KEY || '').replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'ES256', kid: keyId };
  const payload = {
    iss: team,
    iat: now,
    exp: now + 60 * 60,
    aud: 'https://appleid.apple.com',
    sub: clientId,
  };
  const enc = (o: object) => b64url(Buffer.from(JSON.stringify(o)));
  const signingInput = `${enc(header)}.${enc(payload)}`;
  const sig = crypto.createSign('SHA256').update(signingInput).sign(priv);
  return `${signingInput}.${b64url(sig)}`;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    return JSON.parse(b64urlDecode(parts[1]).toString('utf8'));
  } catch {
    return null;
  }
}

async function exchangeCode(
  code: string,
  redirectUri: string
): Promise<{ id_token?: string }> {
  const cid = process.env.APPLE_CLIENT_ID!;
  const res = await fetch('https://appleid.apple.com/auth/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: cid,
      client_secret: appleClientSecret(),
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  if (!res.ok) throw new Error(`token_exchange_failed: ${res.status}`);
  return res.json();
}

export async function GET(req: Request) {
  const cid = process.env.APPLE_CLIENT_ID;
  const team = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const privKey = process.env.APPLE_PRIVATE_KEY;
  if (!cid || !team || !keyId || !privKey) {
    return NextResponse.json(
      { error: 'apple_not_configured' },
      { status: 503 }
    );
  }
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');
  if (err) {
    return NextResponse.redirect(
      new URL(`/account?apple_error=${encodeURIComponent(err)}`, url.origin)
    );
  }
  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/account?apple_error=missing_code', url.origin)
    );
  }
  const s = verifyState(state);
  if (!s) {
    return NextResponse.redirect(
      new URL('/account?apple_error=bad_state', url.origin)
    );
  }
  const redirectUri = `${url.origin}/api/auth/apple/callback`;
  let idToken: string | undefined;
  try {
    const tokens = await exchangeCode(code, redirectUri);
    idToken = tokens.id_token;
  } catch (e: any) {
    return NextResponse.redirect(
      new URL(
        `/account?apple_error=${encodeURIComponent(String(e?.message ?? 'oauth_failed'))}`,
        url.origin
      )
    );
  }
  // The identity lives in the id_token's `email` claim. (With response_mode=query
  // we do not receive the one-time `user` JSON, so we rely on id_token — the
  // display name is captured later via the account nickname field.)
  const claims = idToken ? decodeJwtPayload(idToken) : null;
  const email = claims?.email;
  if (!email || typeof email !== 'string' || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return NextResponse.redirect(
      new URL('/account?apple_error=email_unavailable', url.origin)
    );
  }
  // Identity is derived from the address — same account as email/Google/Microsoft.
  const uid = uidForEmail(email);
  const prefs = await resolvePrefsOnSignIn(uid);

  const session = issueSessionCookie(email, 'apple');
  const dest = s.next.startsWith('/') ? s.next : '/';
  const res = NextResponse.redirect(new URL(dest, url.origin));
  res.cookies.set(session.name, session.value, session.options);
  const pc = prefsCookie(uid, prefs);
  res.cookies.set(pc.name, pc.value, pc.options);
  return res;
}
