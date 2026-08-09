import { NextResponse } from 'next/server';
import {
  decodeJwt,
  issueSessionCookie,
  providerPrefsCookie,
  uidForEmail,
  verifyState,
} from '@/lib/auth';
import { markAccountSeen } from '@/lib/metrics';

export const dynamic = 'force-dynamic';

function errRedirect(origin: string, code: string) {
  return NextResponse.redirect(
    new URL(`/account?apple_error=${encodeURIComponent(code)}`, origin)
  );
}

/**
 * Apple POSTs the result here (response_mode=form_post). The id_token carries
 * the user's email — which may be a privaterelay.appleid.com "Hide My Email"
 * relay address; that address is still used as the account key, so the same
 * person signs back in consistently. The `user` field (display name) is only
 * present on the first authorization and is intentionally ignored: TrialBeacon
 * stores no health or identity detail beyond the email. The OAuth `state` is
 * independently verified, so id_token signature checking is out of scope here.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const origin = url.origin;

  let body: URLSearchParams;
  try {
    body = new URLSearchParams(await req.text());
  } catch {
    return errRedirect(origin, 'bad_body');
  }

  const err = body.get('error');
  if (err) return errRedirect(origin, err);

  const state = body.get('state');
  const idToken = body.get('id_token');
  const s = state ? verifyState(state) : null;
  if (!s) return errRedirect(origin, 'bad_state');
  if (!idToken) return errRedirect(origin, 'missing_token');

  const payload = decodeJwt(idToken);
  const email =
    payload && typeof payload.email === 'string' ? (payload.email as string) : null;
  if (!email) return errRedirect(origin, 'no_email');

  // Same email ⇒ same account, regardless of which provider was used.
  const uid = uidForEmail(email);
  // Best-effort registration tracking (first sign-in only).
  try {
    await markAccountSeen(email);
  } catch {
    /* metrics are non-critical */
  }
  const session = issueSessionCookie(email, 'apple');
  const dest = s.next.startsWith('/') ? s.next : '/';
  const res = NextResponse.redirect(new URL(dest, url.origin));
  res.cookies.set(session.name, session.value, session.options);
  const pc = await providerPrefsCookie(uid, 'apple');
  res.cookies.set(pc.name, pc.value, pc.options);
  return res;
}
