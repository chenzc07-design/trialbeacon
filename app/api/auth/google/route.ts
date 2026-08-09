import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { publicOrigin, signState, generatePkce } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/google?next=/some/path
 *
 * Starts a PKCE authorization-code flow. Crucially we do NOT send a
 * client_secret — the code→token exchange is performed in the user's BROWSER
 * (see /api/auth/google/callback), because this sandbox cannot reach Google's
 * network. The PKCE `code_verifier` is carried inside the signed `state` so the
 * browser can complete the exchange; Google's id_token is later verified
 * server-side against Google's public JWKS (lib/google-jwks.json).
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
  const nonce = crypto.randomBytes(8).toString('hex');
  const { verifier, challenge } = generatePkce();
  const state = signState({ next, n: nonce, t: Date.now(), v: verifier });
  const origin = publicOrigin(req);
  const redirectUri = `${origin}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    nonce,
    code_challenge: challenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });
  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  );
}
