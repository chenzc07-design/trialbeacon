// Anonymous, privacy-first usage statistics. No health information is ever
// stored — only which anonymous events happened and how often. When the
// Upstash sync store is configured we increment counters there; otherwise we
// keep a per-instance in-memory counter and log (sandbox fallback — not
// durable across serverless instances, noted in the admin view).
//
// Server-only.

import { kvIncr, kvGet, isSyncConfigured } from './auth';

export type StatEvent =
  | 'view_aftercare'
  | 'view_cancer'
  | 'view_original'
  | 'select_generate'
  | 'upgrade_click'
  | 'pro_visit'
  | 'payment_success'
  | 'alerts_subscribe';

export const STAT_EVENTS: StatEvent[] = [
  'view_aftercare',
  'view_cancer',
  'view_original',
  'select_generate',
  'upgrade_click',
  'pro_visit',
  'payment_success',
  'alerts_subscribe',
];

const PREFIX = 'tb:stat:';
const memory = new Map<string, number>();

function key(e: StatEvent): string {
  return PREFIX + e;
}

/** Record one occurrence of an anonymous event. Silent no-op on unknown. */
export async function recordEvent(e: StatEvent): Promise<void> {
  if (!STAT_EVENTS.includes(e)) return;
  const k = key(e);
  if (isSyncConfigured()) {
    await kvIncr(k, 1);
  } else {
    memory.set(k, (memory.get(k) ?? 0) + 1);
    // eslint-disable-next-line no-console
    console.log('[stats]', e);
  }
}

/** All event counts, for the protected admin view. */
export async function readStats(): Promise<Record<StatEvent, number>> {
  const out = {} as Record<StatEvent, number>;
  for (const e of STAT_EVENTS) {
    out[e] = isSyncConfigured() ? await kvGet(key(e)) : memory.get(key(e)) ?? 0;
  }
  return out;
}

export const STAT_PERSISTENT = isSyncConfigured();
