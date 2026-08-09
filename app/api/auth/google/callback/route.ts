import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Google sign-in now uses Google Identity Services (GIS): the browser receives
 * the `id_token` directly and posts it to /api/auth/google/verify. There is no
 * redirect-based code exchange anymore, so this endpoint simply forwards any
 * stray hit back to the account page.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const error = url.searchParams.get('error');
  const dest = new URL('/account', url.origin);
  if (error) dest.searchParams.set('google_error', error);
  return NextResponse.redirect(dest);
}
