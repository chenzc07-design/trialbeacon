import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

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
function sign(payload: object): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const mac = b64url(
    crypto.createHmac('sha256', SECRET).update(body).digest()
  );
  return `${body}.${mac}`;
}

/**
 * GET /api/auth/google?next=/some/path
 * Redirects to Google's OAuth consent screen. Requires GOOGLE_CLIENT_ID to
 * be set; otherwise returns a 503.
 */
export async function GET(req: Request) {
  const cid = process.env.GOOGLE_CLIENT_ID;
  if (!cid) {
    return NextResponse.json(
      {
        error: 'google_not_configured',
        message:
          'Google sign-in is not configured on this deployment. Use the email-code method.',
      },
      { status: 503 }
    );
  }
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/';
  // Bounded state: encode the destination + nonce + HMAC.
  const nonce = crypto.randomBytes(8).toString('hex');
  const state = sign({ next, n: nonce, t: Date.now() });
  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
