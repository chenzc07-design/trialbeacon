import { NextResponse } from 'next/server';
import { getCurrentUser, savePrefs } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * Updates the optional non-clinical display name for the signed-in account.
 * The endpoint deliberately accepts no profile fields other than `name`.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let rawName: unknown;
  try {
    const body = (await req.json()) as { name?: unknown };
    rawName = body.name;
  } catch {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  }

  if (typeof rawName !== 'string' || rawName.length > 80) {
    return NextResponse.json({ error: 'invalid_name' }, { status: 400 });
  }

  const name = rawName.replace(/\s+/g, ' ').trim();
  const { prefs, cookie } = await savePrefs(user.id, {
    ...user,
    name: name || undefined,
  });

  const res = NextResponse.json({ ok: true, name: prefs.name ?? null });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
