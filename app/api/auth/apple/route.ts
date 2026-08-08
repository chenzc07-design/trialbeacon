import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { signState } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/apple?next=/some/path
 * Redirects to Sign in with Apple. Requires APPLE_CLIENT_ID (the Service ID),
 * APPLE_KEY_ID, APPLE_TEAM_ID and APPLE_PRIVATE_KEY. Uses response_mode=form_post
 * so the callback receives the id_token directly (no code exchange needed).
 * The same email always maps to the same account via email-derived uid.
 */
export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const cid = process.env.APPLE_CLIENT_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const teamId = process.env.APPLE_TEAM_ID;
  const key = process.env.APPLE_PRIVATE_KEY;
  if (!cid || !keyId || !teamId || !key) {
    return NextResponse.redirect(new URL('/account?apple_error=not_configured', origin));
  }
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/';
  const nonce = crypto.randomBytes(12).toString('hex');
  const state = signState({ next, n: nonce, t: Date.now() });
  const redirectUri = `${origin}/api/auth/apple/callback`;
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'name email',
    state,
    response_mode: 'form_post',
    nonce,
  });
  return NextResponse.redirect(
    `https://appleid.apple.com/auth/authorize?${params.toString()}`
  );
}
