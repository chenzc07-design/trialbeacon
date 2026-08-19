import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'tb_x_oauth_state';
const TOKEN_COOKIE = 'tb_x_oauth_token';
const CALLBACK_PATH = '/api/x/oauth/callback';
const MAX_STATE_AGE_MS = 10 * 60 * 1000;

type XTokenResponse = {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
  refresh_token?: string;
  scope?: string;
};

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

function fromBase64Url(value: string): Buffer {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(normalized + '='.repeat((4 - (normalized.length % 4)) % 4), 'base64');
}

function sign(value: string): string {
  return base64Url(
    crypto.createHmac('sha256', getSecret()).update(value).digest()
  );
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function seal(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getSecret(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, ciphertext].map(base64Url).join('.');
}

function page(title: string, body: string, status = 200): NextResponse {
  return new NextResponse(
    `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head><body style="font-family:system-ui,sans-serif;max-width:42rem;margin:5rem auto;padding:0 1.25rem;color:#172033"><h1>${title}</h1><p>${body}</p><p>You can close this window and return to TrialBeacon.</p></body></html>`,
    { status, headers: { 'content-type': 'text/html; charset=utf-8' } }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get('error');
  if (error) {
    return page('X authorization was not completed', 'The X account authorization was cancelled or declined.', 400);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const stateCookie = request.headers.get('cookie')?.match(/(?:^|; )tb_x_oauth_state=([^;]+)/)?.[1];
  if (!code || !state || !stateCookie) {
    return page('X authorization could not be verified', 'The authorization code or security state was missing. Start the connection again.', 400);
  }

  const [nonce, verifier, issuedAtText] = decodeURIComponent(stateCookie).split('.');
  const issuedAt = Number(issuedAtText);
  const stateParts = state.split('.');
  const statePayload = stateParts.slice(0, 2).join('.');
  const stateSignature = stateParts[2] || '';
  if (!nonce || !verifier || !Number.isFinite(issuedAt) || stateParts.length !== 3) {
    return page('X authorization could not be verified', 'The security state was malformed. Start the connection again.', 400);
  }
  if (Date.now() - issuedAt > MAX_STATE_AGE_MS || Date.now() < issuedAt - 30_000) {
    return page('X authorization expired', 'The security state expired. Start the connection again.', 400);
  }
  if (statePayload !== `${nonce}.${issuedAtText}` || !safeEqual(stateSignature, sign(statePayload))) {
    return page('X authorization could not be verified', 'The security state did not match this browser session.', 400);
  }

  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) {
    return page('X authorization is not configured', 'The website is missing its X Client ID configuration.', 503);
  }

  const redirectUri = `${url.origin}${CALLBACK_PATH}`;
  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: redirectUri,
    code_verifier: verifier,
  });
  const tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  });
  const token = (await tokenResponse.json()) as XTokenResponse;
  if (!tokenResponse.ok || !token.access_token) {
    return page('X authorization failed', 'X did not issue an access token. Check the exact callback URL and app authentication settings, then try again.', 502);
  }

  const response = page('TrialBeacon is connected to X', 'Authorization completed successfully. The access token is stored in an encrypted, HttpOnly browser cookie and is not shown in this page or URL.');
  response.cookies.set(STATE_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: CALLBACK_PATH });
  response.cookies.set(TOKEN_COOKIE, seal(JSON.stringify({ accessToken: token.access_token, refreshToken: token.refresh_token, scope: token.scope, expiresAt: Date.now() + (token.expires_in ?? 7200) * 1000 })), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
    path: '/api/x',
  });
  return response;
}
