import { NextResponse } from 'next/server';
import {
  decodeJwt,
  issueSessionCookie,
  providerPrefsCookie,
  uidForEmail,
  verifyState,
  publicOrigin,
} from '@/lib/auth';
import { markAccountSeen } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

interface TokenResp {
  access_token: string;
  id_token?: string;
}

function errRedirect(origin: string, code: string) {
  return NextResponse.redirect(
    new URL(`/account?microsoft_error=${encodeURIComponent(code)}`, origin)
  );
}

async function exchangeCode(code: string, redirectUri: string): Promise<TokenResp> {
  const cid = process.env.MICROSOFT_CLIENT_ID!;
  const csec = process.env.MICROSOFT_CLIENT_SECRET!;
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
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
  if (!res.ok) throw new Error(`token_exchange_failed:${res.status}`);
  return res.json();
}

/** Microsoft Graph /me returns mail or userPrincipalName for the address. */
async function graphEmail(accessToken: string): Promise<string | null> {
  try {
    const res = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const j = await res.json();
    return j.mail || j.userPrincipalName || null;
  } catch {
    return null;
  }
}

export async function GET(req: Request) {
  const cid = process.env.MICROSOFT_CLIENT_ID;
  const csec = process.env.MICROSOFT_CLIENT_SECRET;
  const url = new URL(req.url);
  if (!cid || !csec) return errRedirect(publicOrigin(req), 'not_configured');

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const err = url.searchParams.get('error');
  if (err) return errRedirect(publicOrigin(req), err);
  if (!code || !state) return errRedirect(publicOrigin(req), 'missing_code');

  const s = verifyState(state);
  if (!s) return errRedirect(publicOrigin(req), 'bad_state');

  const redirectUri = `${publicOrigin(req)}/api/auth/microsoft/callback`;
  let tokens: TokenResp;
  try {
    tokens = await exchangeCode(code, redirectUri);
  } catch (e: any) {
    return errRedirect(publicOrigin(req), String(e?.message ?? 'oauth_failed'));
  }

  // Prefer the verified email claim from the id_token; fall back to Graph /me.
  let email: string | null = null;
  if (tokens.id_token) {
    const payload = decodeJwt(tokens.id_token);
    if (payload) {
      email =
        (typeof payload.email === 'string' && payload.email) ||
        (typeof payload.unique_name === 'string' && payload.unique_name) ||
        (typeof payload.upn === 'string' && payload.upn) ||
        null;
    }
  }
  if (!email && tokens.access_token) email = await graphEmail(tokens.access_token);
  if (!email) return errRedirect(publicOrigin(req), 'no_email');

  // Identity is derived from the address, so any provider for the same email
  // lands on the same account — no explicit linking step is needed.
  const uid = uidForEmail(email);
  // Best-effort registration tracking (first sign-in only).
  try {
    await markAccountSeen(email);
  } catch {
    /* metrics are non-critical */
  }
  const session = issueSessionCookie(email, 'microsoft');
  const dest = s.next.startsWith('/') ? s.next : '/';
  const res = NextResponse.redirect(new URL(dest, publicOrigin(req)));
  res.cookies.set(session.name, session.value, session.options);
  const pc = await providerPrefsCookie(uid, 'microsoft');
  res.cookies.set(pc.name, pc.value, pc.options);
  return res;
}
