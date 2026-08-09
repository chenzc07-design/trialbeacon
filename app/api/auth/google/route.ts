import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { signState, publicOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google?next=/some/path
 *
 * Kicks off the standard Google OAuth 2.0 authorization-code flow: builds the
 * Google authorize URL (with a server-signed `state` carrying a one-time
 * `nonce` + the post-login destination and the exact `redirect_uri` Google
 * expects), and 307-redirects the browser there. Google then redirects back to
 * /api/auth/google/callback?code=...&state=..., where the server exchanges the
 * code for tokens using the client_secret and verifies the id_token.
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
  const next = url.searchParams.get('next') || '/account';
  const nonce = crypto.randomBytes(12).toString('hex');
  const state = signState({ next, n: nonce, t: Date.now() });
  const redirectUri = new URL('/api/auth/google/callback', publicOrigin(req)).toString();

  const g = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  g.searchParams.set('client_id', cid);
  g.searchParams.set('redirect_uri', redirectUri);
  g.searchParams.set('response_type', 'code');
  g.searchParams.set('scope', 'openid email profile');
  g.searchParams.set('state', state);
  g.searchParams.set('nonce', nonce);
  g.searchParams.set('access_type', 'offline');
  g.searchParams.set('prompt', 'select_account');

  return NextResponse.redirect(g.toString());
}
