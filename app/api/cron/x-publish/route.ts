import { NextRequest, NextResponse } from 'next/server';
import {
  getXPublisherHealth,
  publishXPost,
  verifyXPublisherAuthorization,
} from '@/lib/x-publisher';
import { DEFAULT_X_POSTS } from '@/lib/x-content';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const QUEUE_KEY = 'tb:x:queue';
const LAST_PUBLISH_KEY = 'tb:x:last-publish';
const LOCK_KEY = 'tb:x:publish-lock';
const MIN_INTERVAL_MS = 72 * 60 * 60 * 1000;

type SafeCronError =
  | 'x_publisher_storage_not_configured'
  | 'x_publisher_not_configured'
  | 'x_account_not_authorized'
  | 'x_token_refresh_failed'
  | 'x_request_timeout'
  | 'x_request_failed'
  | `x_authorization_check_failed_${number}`
  | `x_publish_failed_${number}`
  | `upstash_${number}`
  | 'x_publish_cron_failed';

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

function safeErrorCode(error: unknown): SafeCronError {
  if (!(error instanceof Error)) return 'x_publish_cron_failed';
  const code = error.message;
  if (
    code === 'x_publisher_storage_not_configured'
    || code === 'x_publisher_not_configured'
    || code === 'x_account_not_authorized'
    || code === 'x_token_refresh_failed'
    || code === 'x_request_timeout'
    || code === 'x_request_failed'
    || /^x_authorization_check_failed_\d{3}$/.test(code)
    || /^x_publish_failed_\d{3}$/.test(code)
    || /^upstash_\d{3}$/.test(code)
  ) {
    return code as SafeCronError;
  }
  return 'x_publish_cron_failed';
}

function failed(stage: 'dry_run' | 'cron', error: unknown) {
  const code = safeErrorCode(error);
  console.error('[x-publish]', { stage, code });
  return NextResponse.json({ ok: false, stage, error: code }, { status: 503 });
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  if (process.env.X_AUTOPUBLISH_ENABLED !== 'true') {
    return NextResponse.json({ ok: true, paused: true, reason: 'X_AUTOPUBLISH_ENABLED is not true.' });
  }
  if (!KV_URL || !KV_TOKEN || !process.env.X_CLIENT_ID) {
    return NextResponse.json({ ok: false, error: 'x_publisher_not_configured' }, { status: 503 });
  }

  if (request.nextUrl.searchParams.get('dryRun') === '1') {
    try {
      const health = await getXPublisherHealth();
      if (!health.storageReachable) {
        return NextResponse.json({ ok: false, dryRun: true, health, error: 'x_publisher_storage_unavailable' }, { status: 503 });
      }
      if (!health.authorizationReadable) {
        return NextResponse.json({ ok: false, dryRun: true, health, error: 'x_account_not_authorized' }, { status: 503 });
      }
      await verifyXPublisherAuthorization();
      return NextResponse.json({ ok: true, dryRun: true, health });
    } catch (error) {
      return failed('dry_run', error);
    }
  }

  let lock: unknown;
  try {
    lock = (await upstash([['SET', LOCK_KEY, new Date().toISOString(), 'NX', 'EX', '120']]))[0];
  } catch (error) {
    return failed('cron', error);
  }

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
      const code = safeErrorCode(error);
      console.error('[x-publish]', { stage: 'publish', code });
      return NextResponse.json({ ok: false, error: code }, { status: 502 });
    }
  } catch (error) {
    return failed('cron', error);
  } finally {
    await upstash([['DEL', LOCK_KEY]]).catch(() => undefined);
  }
}

export const POST = GET;
