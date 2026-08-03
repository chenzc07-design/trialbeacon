import { NextResponse } from 'next/server';
import {
  clearSessionCookie,
  clearPrefsCookie,
  clearChallengeCookie,
  getCurrentUser,
  erasePrefs,
} from '@/lib/auth';
import { store } from '@/lib/subscriptions';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/signout { erase?: boolean }
 *
 * A plain sign-out ends the session but leaves the preferences cookie in
 * place: it is bound to the account id, so it is unreadable to anyone who
 * signs in with a different address, and it means alert settings survive a
 * sign-out / sign-in cycle on this device even when no sync store is
 * configured. `erase` is the destructive path the account page offers —
 * it drops the preferences here and in the sync store.
 */
export async function POST(req: Request) {
  let erase = false;
  try {
    const body = await req.json();
    erase = !!body?.erase;
  } catch {
    /* no body is fine — plain sign-out */
  }

  if (erase) {
    const u = await getCurrentUser();
    if (u) {
      await erasePrefs(u.id);
      // Also drop the weekly-digest record, otherwise the emails keep coming
      // after somebody asked for everything to be deleted.
      try {
        await store.remove(u.email);
      } catch {
        /* the preferences are gone regardless */
      }
    }
  }

  const res = NextResponse.json({ ok: true, erased: erase });
  const drop = erase
    ? [clearSessionCookie(), clearPrefsCookie(), clearChallengeCookie()]
    : [clearSessionCookie(), clearChallengeCookie()];
  for (const c of drop) {
    res.cookies.set(c.name, c.value, c.options);
  }
  return res;
}
