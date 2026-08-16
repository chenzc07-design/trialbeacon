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

function sign(payload: object): string {
  const body = b64url(Buffer.from(JSON.stringify(payload)));
  const mac = b64url(
    crypto.createHmac('sha256', SECRET).update(body).digest()
  );
  return `${body}.${mac}`;
}

/**
 * GET /api/auth/apple?next=/some/path
 * Redirects to Apple "Sign in with Apple" consent screen.
 * Requires APPLE_CLIENT_ID + APPLE_TEAM_ID + APPLE_KEY_ID + APPLE_PRIVATE_KEY;
 * otherwise returns 503 apple_not_configured.
 *
 * Note: Apple has no static client_secret. We mint a short-lived JWT from the
 * .p8 key in the callback. The start route only needs the client id.
 */
export async function GET(req: Request) {
  const cid = process.env.APPLE_CLIENT_ID;
  if (!cid) {
    return NextResponse.json(
      {
        error: 'apple_not_configured',
        message:
          'Apple sign-in is not configured on this deployment. Use the email-code method.',
      },
      { status: 503 }
    );
  }
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/';
  const nonce = crypto.randomBytes(8).toString('hex');
  const state = sign({ next, n: nonce, t: Date.now() });
  const origin = url.origin;
  const redirectUri = `${origin}/api/auth/apple/callback`;
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'name email',
    state,
    // Keep the callback a plain GET redirect so it mirrors the Google flow.
    response_mode: 'query',
  });
  return NextResponse.redirect(
    `https://appleid.apple.com/auth/authorize?${params.toString()}`
  );
}
