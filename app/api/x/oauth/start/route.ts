import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'tb_x_oauth_state';
const CALLBACK_PATH = '/api/x/oauth/callback';
const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is not configured.');
  }
  return secret || 'tb-dev-secret-do-not-use-in-prod-0000000000000000';
}

function base64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function sign(value: string): string {
  return base64Url(
    crypto.createHmac('sha256', getSecret()).update(value).digest()
  );
}

function createState(nonce: string, issuedAt: number): string {
  const payload = `${nonce}.${issuedAt}`;
  return `${payload}.${sign(payload)}`;
}

function createPkce() {
  const verifier = base64Url(crypto.randomBytes(32));
  const challenge = base64Url(
    crypto.createHash('sha256').update(verifier).digest()
  );
  return { verifier, challenge };
}

export async function GET(request: Request) {
  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      {
        error: 'x_oauth_not_configured',
        message: 'X OAuth is not configured on this deployment yet.',
      },
      { status: 503 }
    );
  }

  const url = new URL(request.url);
  const redirectUri = `${url.origin}${CALLBACK_PATH}`;
  const { verifier, challenge } = createPkce();
  const nonce = base64Url(crypto.randomBytes(18));
  const issuedAt = Date.now();
  const state = createState(nonce, issuedAt);

  const authorize = new URL('https://x.com/i/oauth2/authorize');
  authorize.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    scope: SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();

  const response = NextResponse.redirect(authorize);
  response.cookies.set(STATE_COOKIE, `${nonce}.${verifier}.${issuedAt}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: CALLBACK_PATH,
  });
  return response;
}
