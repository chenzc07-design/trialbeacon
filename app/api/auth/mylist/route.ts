import { NextResponse } from 'next/server';
import {
  getCurrentUser,
  savePrefs,
  checkIpRate,
  clientIp,
  MY_LIST_MAX,
} from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/mylist { op: 'add' | 'remove' | 'set' | 'clear', id?, myList? }
 *
 * Writes the follow list to the sync store when configured and always to the
 * signed prefs cookie, so the list survives a cold start either way.
 */
export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const ip = await clientIp();
  if (!checkIpRate(`ml:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'bad_json' }, { status: 400 });
  }

  const current = u.myList;
  let next: string[];

  switch (body?.op) {
    case 'add': {
      if (typeof body.id !== 'string' || !body.id)
        return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
      next = Array.from(new Set([...current, body.id])).slice(0, MY_LIST_MAX);
      break;
    }
    case 'remove': {
      if (typeof body.id !== 'string' || !body.id)
        return NextResponse.json({ error: 'invalid_id' }, { status: 400 });
      next = current.filter((x) => x !== body.id);
      break;
    }
    case 'set': {
      if (!Array.isArray(body.myList))
        return NextResponse.json({ error: 'invalid_list' }, { status: 400 });
      next = Array.from(
        new Set(body.myList.filter((x: unknown) => typeof x === 'string'))
      ).slice(0, MY_LIST_MAX) as string[];
      break;
    }
    case 'clear': {
      next = [];
      break;
    }
    default:
      return NextResponse.json({ error: 'unknown_op' }, { status: 400 });
  }

  const { prefs, cookie } = await savePrefs(u.id, { ...u, myList: next });
  const res = NextResponse.json({ ok: true, myList: prefs.myList });
  res.cookies.set(cookie.name, cookie.value, cookie.options);
  return res;
}
