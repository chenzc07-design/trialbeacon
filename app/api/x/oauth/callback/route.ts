import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { saveAuthorizedToken } from '@/lib/x-publisher';

export const dynamic = 'force-dynamic';

const STATE_COOKIE = 'tb_x_oauth_state';
const CALLBACK_PATH = '/api/x/oauth/callback';
const CANONICAL_ORIGIN = 'https://trialbeacon.cn';
const MAX_STATE_AGE_MS = 10 * 60 * 1000;

type XTokenResponse = {
  token_type?: string;
  expires_in?: number;
  access_token?: string;
  refresh_token?: string;
  scope?: string;
};

type OAuthState = {
  verifier: string;
  issuedAt: number;
  nonce: string;
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

function open(value: string): OAuthState | null {
  try {
    const [ivText, tagText, ciphertextText] = value.split('.');
    if (!ivText || !tagText || !ciphertextText) return null;
    const decipher = crypto.createDecipheriv('aes-256-gcm', getSecret(), fromBase64Url(ivText));
    decipher.setAuthTag(fromBase64Url(tagText));
    const plaintext = Buffer.concat([
      decipher.update(fromBase64Url(ciphertextText)),
      decipher.final(),
    ]).toString('utf8');
    const state = JSON.parse(plaintext) as Partial<OAuthState>;
    if (typeof state.verifier !== 'string' || typeof state.issuedAt !== 'number' || typeof state.nonce !== 'string') return null;
    return state as OAuthState;
  } catch {
    return null;
  }
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
  const stateText = url.searchParams.get('state');
  if (!code || !stateText) {
    return page('X authorization could not be verified', 'The authorization code or security state was missing. Start the connection again.', 400);
  }

  const state = open(stateText);
  if (!state || Date.now() - state.issuedAt > MAX_STATE_AGE_MS || Date.now() < state.issuedAt - 30_000) {
    return page('X authorization could not be verified', 'The security state was invalid or expired. Start the connection again in the same browser window.', 400);
  }

  const clientId = process.env.X_CLIENT_ID;
  if (!clientId) {
    return page('X authorization is not configured', 'The website is missing its X Client ID configuration.', 503);
  }

  const body = new URLSearchParams({
    code,
    grant_type: 'authorization_code',
    client_id: clientId,
    redirect_uri: `${CANONICAL_ORIGIN}${CALLBACK_PATH}`,
    code_verifier: state.verifier,
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

  const persisted = await saveAuthorizedToken(token);
  if (!persisted) {
    return page('X authorization needs server storage', 'The account was authorized, but automatic publishing is not enabled because durable server storage is not configured. No token was placed in a browser cookie.', 503);
  }
  const response = page('TrialBeacon is connected to X', 'Authorization completed successfully. The encrypted authorization token is stored on the server and is not shown in this page or URL.');
  response.cookies.set(STATE_COOKIE, '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 0, path: CALLBACK_PATH });
  return response;
}
