import { NextResponse } from 'next/server';
import { recordEvent, STAT_EVENTS, type StatEvent } from '@/lib/stats';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let event: string | undefined;
  try {
    const b = (await req.json()) as { event?: unknown };
    event = typeof b?.event === 'string' ? b.event : undefined;
  } catch {
    /* fall through */
  }
  if (!event || !STAT_EVENTS.includes(event as StatEvent)) {
    return NextResponse.json({ error: 'bad_event' }, { status: 400 });
  }
  await recordEvent(event as StatEvent);
  return NextResponse.json({ ok: true });
}
