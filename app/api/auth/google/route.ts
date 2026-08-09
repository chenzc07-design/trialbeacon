import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { signState } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google?next=/some/path
 *
 * Issues a server-signed `state` (carrying a one-time `nonce` + the post-login
 * destination) and returns it together with the Google `clientId`. The browser
 * hands these to Google Identity Services (GIS), which returns an `id_token`
 * directly — no token endpoint, no client_secret, no PKCE. Google's "Web
 * application" clients REQUIRE a client_secret for the code-exchange flow, so
 * GIS (credential model) is the only browser-driven path that works without
 * the server ever calling Google. The `id_token` is later verified server-side
 * against Google's public JWKS (see /api/auth/google/verify).
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
  return NextResponse.json({ state, nonce, clientId: cid });
}
