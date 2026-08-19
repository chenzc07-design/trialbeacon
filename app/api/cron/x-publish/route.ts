import { NextRequest, NextResponse } from 'next/server';
import { publishXPost } from '@/lib/x-publisher';
import { DEFAULT_X_POSTS } from '@/lib/x-content';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const QUEUE_KEY = 'tb:x:queue';
const LAST_PUBLISH_KEY = 'tb:x:last-publish';
const LOCK_KEY = 'tb:x:publish-lock';
const MIN_INTERVAL_MS = 72 * 60 * 60 * 1000;

async function upstash(commands: [string, ...string[]][]): Promise<unknown[]> {
  if (!KV_URL || !KV_TOKEN) throw new Error('x_publisher_storage_not_configured');
  const response = await fetch(`${KV_URL.replace(/\/+$/, '')}/pipeline`, {
    method: 'POST',
    headers: { authorization: `Bearer ${KV_TOKEN}`, 'content-type': 'application/json' },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error(`upstash_${response.status}`);
  const payload = (await response.json()) as { result?: unknown }[] | { result?: unknown[] };
  return Array.isArray(payload) ? payload.map((item) => item.result) : payload.result ?? [];
}

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const provided = request.nextUrl.searchParams.get('secret') ?? request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  return provided === secret;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (process.env.X_AUTOPUBLISH_ENABLED !== 'true') {
    return NextResponse.json({ ok: true, paused: true, reason: 'X_AUTOPUBLISH_ENABLED is not true.' });
  }
  if (!KV_URL || !KV_TOKEN || !process.env.X_CLIENT_ID) {
    return NextResponse.json({ ok: false, error: 'x_publisher_not_configured' }, { status: 503 });
  }

  const lock = (await upstash([['SET', LOCK_KEY, new Date().toISOString(), 'NX', 'EX', '120']]))[0];
  if (lock !== 'OK') return NextResponse.json({ ok: true, skipped: 'lock_held' });

  try {
    const lastRaw = (await upstash([['GET', LAST_PUBLISH_KEY]]))[0];
    if (lastRaw && Date.now() - Date.parse(String(lastRaw)) < MIN_INTERVAL_MS) {
      return NextResponse.json({ ok: true, skipped: 'cooldown', lastPublishedAt: String(lastRaw) });
    }

    const queueLength = Number((await upstash([['LLEN', QUEUE_KEY]]))[0] ?? 0);
    if (queueLength === 0) {
      await upstash([
        ['RPUSH', QUEUE_KEY, ...DEFAULT_X_POSTS],
        ['EXPIRE', QUEUE_KEY, String(60 * 60 * 24 * 365)],
      ]);
    }

    const text = (await upstash([['LPOP', QUEUE_KEY]]))[0];
    if (!text) return NextResponse.json({ ok: true, skipped: 'queue_empty' });

    try {
      const result = await publishXPost(String(text));
      const publishedAt = new Date().toISOString();
      await upstash([['SET', LAST_PUBLISH_KEY, publishedAt, 'EX', String(60 * 60 * 24 * 365)]]);
      return NextResponse.json({ ok: true, published: true, id: result.id, publishedAt });
    } catch (error) {
      await upstash([['LPUSH', QUEUE_KEY, String(text)]]);
      return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : 'x_publish_failed' }, { status: 502 });
    }
  } finally {
    await upstash([['DEL', LOCK_KEY]]).catch(() => undefined);
  }
}

export const POST = GET;
