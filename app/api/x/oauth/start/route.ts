import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'tb_x_oauth_state';
const CALLBACK_PATH = '/api/x/oauth/callback';
const CANONICAL_ORIGIN = 'https://trialbeacon.cn';
const SCOPES = ['tweet.read', 'tweet.write', 'users.read', 'offline.access'];
const MAX_STATE_AGE_MS = 10 * 60 * 1000;

function getSecret(): Buffer {
  const secret = process.env.AUTH_SECRET;
  if (!secret && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET is not configured.');
  }
  return crypto
    .createHash('sha256')
    .update(secret || 'tb-dev-secret-do-not-use-in-prod-0000000000000000')
    .digest();
}

function base64Url(value: Buffer | string): string {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=+$/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function seal(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecret(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map(base64Url).join('.');
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

  const { challenge, verifier } = createPkce();
  const issuedAt = Date.now();
  const state = seal(JSON.stringify({ verifier, issuedAt, nonce: base64Url(crypto.randomBytes(18)) }));

  const authorize = new URL('https://x.com/i/oauth2/authorize');
  authorize.search = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: `${CANONICAL_ORIGIN}${CALLBACK_PATH}`,
    scope: SCOPES.join(' '),
    state,
    code_challenge: challenge,
    code_challenge_method: 'S256',
  }).toString();

  const response = NextResponse.redirect(authorize);
  response.cookies.set(STATE_COOKIE, '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: Math.floor(MAX_STATE_AGE_MS / 1000),
    path: CALLBACK_PATH,
  });
  return response;
}
