// Anonymous, privacy-first usage statistics. No health information is ever
// stored — only which anonymous events happened and how often. When the
// Upstash sync store is configured we increment counters there; otherwise we
// keep per-instance in-memory counters that are hydrated from / written back
// to a local JSON file (`.tb_state/stats.json`) so they survive server
// restarts in writable environments (local dev, sandbox preview). Note in
// admin view: file persistence is per-instance, not shared across serverless
// instances — configure Upstash for a production-grade multi-instance store.
//
// Server-only.

import { kvIncr, kvGet, isSyncConfigured } from './auth';
import { loadJson, saveJson } from './persist';

export type StatEvent =
  | 'view_aftercare'
  | 'view_cancer'
  | 'view_original'
  | 'select_generate'
  | 'upgrade_click'
  | 'pro_visit'
  | 'payment_success'
  | 'payment_failure'
  | 'limit_reached'
  | 'buy_single_click'
  | 'pro_click'
  | 'alerts_subscribe'
  | 'page_view';

export const STAT_EVENTS: StatEvent[] = [
  'page_view',
  'view_cancer',
  'view_aftercare',
  'view_original',
  'select_generate',
  'upgrade_click',
  'pro_visit',
  'payment_success',
  'payment_failure',
  'limit_reached',
  'buy_single_click',
  'pro_click',
  'alerts_subscribe',
];

const PREFIX = 'tb:stat:';
const memory = new Map<string, number>();
let hydrated = false;

function key(e: StatEvent): string {
  return PREFIX + e;
}

// Lazy-hydrate the in-memory counters from the JSON file fallback. This keeps
// anonymous counters alive across server restarts in writable environments
// (local dev, sandbox preview) so the owner dashboard doesn't blank out.
async function hydrate(force = false): Promise<void> {
  if (hydrated && !force) return;
  const saved = await loadJson<Record<string, number>>('stats.json', {});
  memory.clear();
  for (const [k, v] of Object.entries(saved)) {
    if (typeof v === 'number') memory.set(k, v);
  }
  hydrated = true;
}

function persist(): void {
  const snap: Record<string, number> = {};
  for (const [k, v] of memory) snap[k] = v;
  void saveJson('stats.json', snap);
}

/** Wipe counters (used by the dev seed route to make seeding idempotent). */
export async function resetStats(): Promise<void> {
  memory.clear();
  hydrated = false;
  await saveJson('stats.json', {});
}

/** Record one occurrence of an anonymous event. Silent no-op on unknown. */
export async function recordEvent(e: StatEvent): Promise<void> {
  if (!STAT_EVENTS.includes(e)) return;
  const k = key(e);
  if (isSyncConfigured()) {
    await kvIncr(k, 1);
    return;
  }
  await hydrate();
  memory.set(k, (memory.get(k) ?? 0) + 1);
  persist();
}

/** All event counts, for the protected admin view. */
export async function readStats(): Promise<Record<StatEvent, number>> {
  const out = {} as Record<StatEvent, number>;
  if (!isSyncConfigured()) await hydrate();
  for (const e of STAT_EVENTS) {
    out[e] = isSyncConfigured() ? await kvGet(key(e)) : memory.get(key(e)) ?? 0;
  }
  return out;
}

export const STAT_STORE: 'upstash' | 'file' = isSyncConfigured() ? 'upstash' : 'file';
