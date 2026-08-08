import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { signState } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/microsoft?next=/some/path
 * Redirects to Microsoft's Entra ID (Azure AD) OAuth consent screen.
 * Requires MICROSOFT_CLIENT_ID + MICROSOFT_CLIENT_SECRET. The "common" tenant
 * is used so any Microsoft account — personal Outlook/Hotmail/Live or a
 * work/school Entra ID — can sign in.
 */
export async function GET(req: Request) {
  const cid = process.env.MICROSOFT_CLIENT_ID;
  const csec = process.env.MICROSOFT_CLIENT_SECRET;
  const origin = new URL(req.url).origin;
  if (!cid || !csec) {
    return NextResponse.redirect(
      new URL('/account?microsoft_error=not_configured', origin)
    );
  }
  const url = new URL(req.url);
  const next = url.searchParams.get('next') || '/';
  const nonce = crypto.randomBytes(8).toString('hex');
  const state = signState({ next, n: nonce, t: Date.now() });
  const redirectUri = `${origin}/api/auth/microsoft/callback`;
  const params = new URLSearchParams({
    client_id: cid,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid profile email',
    state,
    prompt: 'select_account',
  });
  return NextResponse.redirect(
    `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`
  );
}
