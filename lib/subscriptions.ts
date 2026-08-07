import type { Region } from './types';

/**
 * Subscription storage adapter.
 *
 * The default implementation uses an in-memory Map so the free tier works
 * out of the box on serverless platforms (Vercel functions have a read-only
 * filesystem, so a JSON-on-disk store cannot persist). Data is ephemeral —
 * it is lost on every cold start — which is acceptable for an information
 * aggregator demo. To move to durable storage (Vercel KV, Postgres, etc.),
 * implement `SubscriptionStore` and swap the export at the bottom; no
 * route or UI changes required.
 */
export interface Subscription {
  id: string;
  email: string;
  cancers: string[]; // slugs, capped at MAX_CANCERS
  regions: Region[];
  createdAt: string;
  confirmed: boolean; // double opt-in flag, set by the confirmation endpoint
  /**
   * Opaque token used for one-click confirm / unsubscribe links and, later,
   * for passwordless sign-in. Keeping it on the subscription record means a
   * future user system can be layered on without a data migration.
   */
  token: string;
  /**
   * Epoch ms when the subscriber's Pro entitlement lapses (0 = none / not
   * tracked). The weekly digest job only emails subscribers whose Pro is
   * still active, so an expired plan stops receiving mail without a manual
   * unsubscribe.
   */
  proUntil: number;
}

export interface SubscriptionStore {
  upsert(
    sub: Omit<Subscription, 'id' | 'createdAt' | 'confirmed' | 'token'>
  ): Promise<Subscription>;
  remove(email: string): Promise<boolean>;
  find(email: string): Promise<Subscription | null>;
  findByToken(token: string): Promise<Subscription | null>;
  confirm(token: string): Promise<Subscription | null>;
  /** All subscribers. Used by the weekly digest job. */
  list(): Promise<Subscription[]>;
  count(): Promise<number>;
}

/*
 * Fallback store, used only when Upstash is not configured.
 *
 * It hangs off globalThis on purpose. Each route is bundled separately (and
 * on Vercel runs as its own function), so a plain module-level Map gives
 * /api/subscribe and /api/cron/digest two different Maps and the digest job
 * sees nobody. globalThis at least keeps them together inside one warm
 * process. It is still wiped on cold starts — configure
 * UPSTASH_REDIS_REST_URL / _TOKEN for anything durable.
 */
const globalForSubs = globalThis as typeof globalThis & {
  __tbSubscriptions?: Map<string, Subscription>;
};
const memory: Map<string, Subscription> =
  globalForSubs.__tbSubscriptions ?? new Map<string, Subscription>();
globalForSubs.__tbSubscriptions = memory;

function token(): string {
  // crypto is available globally in the Next.js runtime; this helper tolerates
  // any environment that exposes it differently.
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  return (
    g.crypto?.randomUUID?.() ??
    Math.random().toString(36).slice(2) + Date.now().toString(36)
  );
}

class MemorySubscriptionStore implements SubscriptionStore {
  async upsert(
    sub: Omit<Subscription, 'id' | 'createdAt' | 'confirmed' | 'token'>
  ): Promise<Subscription> {
    const email = sub.email.toLowerCase();
    const existing = memory.get(email);
    if (existing) {
      existing.cancers = sub.cancers;
      existing.regions = sub.regions;
      existing.proUntil = sub.proUntil ?? 0;
      existing.token ||= token();
      return existing;
    }
    const created: Subscription = {
      id: token(),
      email,
      cancers: sub.cancers,
      regions: sub.regions,
      createdAt: new Date().toISOString(),
      confirmed: false,
      token: token(),
      proUntil: sub.proUntil ?? 0,
    };
    memory.set(email, created);
    return created;
  }

  async remove(email: string): Promise<boolean> {
    return memory.delete(email.toLowerCase());
  }

  async find(email: string): Promise<Subscription | null> {
    return memory.get(email.toLowerCase()) ?? null;
  }

  async findByToken(t: string): Promise<Subscription | null> {
    for (const s of memory.values()) if (s.token === t) return s;
    return null;
  }

  async confirm(t: string): Promise<Subscription | null> {
    for (const s of memory.values()) if (s.token === t) {
      s.confirmed = true;
      return s;
    }
    return null;
  }

  async list(): Promise<Subscription[]> {
    return Array.from(memory.values());
  }

  async count(): Promise<number> {
    return memory.size;
  }
}

export const subscriptionStore: SubscriptionStore = new MemorySubscriptionStore();

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Free-tier follow limit. Single source of truth shared with the account UI
 * so the form and the API can never disagree about what is accepted. A paid
 * tier would raise this per subscription rather than changing the constant.
 */
export { ALERT_FREE_LIMIT as MAX_CANCERS } from './auth-shared';

/**
 * Persistent store backed by Upstash Redis over its REST API.
 *
 * Zero new dependencies — it is plain `fetch`, so it works on any serverless
 * runtime without adding an SDK. It activates automatically when both
 * `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are set; otherwise
 * the module keeps using the in-memory store. On Vercel, wire these two
 * environment variables (from an Upstash Redis instance) and subscriptions
 * survive cold starts.
 */
const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

function subKey(email: string): string {
  return `tb:sub:${email.toLowerCase()}`;
}
function tokKey(token: string): string {
  return `tb:tok:${token}`;
}
const INDEX_KEY = 'tb:subs';

/**
 * Upstash REST pipeline: POST /pipeline with a bare array of command arrays.
 * The response is one `{ result }` object per command, in order.
 */
async function upstash(commands: [string, ...string[]][]): Promise<unknown[]> {
  const base = KV_URL!.replace(/\/+$/, '');
  const res = await fetch(`${base}/pipeline`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${KV_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(commands),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`upstash_${res.status}`);
  const json = (await res.json()) as { result?: unknown }[] | { result?: unknown[] };
  if (Array.isArray(json)) return json.map((r) => r.result);
  return json.result ?? [];
}

class KvSubscriptionStore implements SubscriptionStore {
  async upsert(
    sub: Omit<Subscription, 'id' | 'createdAt' | 'confirmed' | 'token'>
  ): Promise<Subscription> {
    const email = sub.email.toLowerCase();
    const existing = await this.find(email);
    const created: Subscription = existing
      ? { ...existing, cancers: sub.cancers, regions: sub.regions, proUntil: sub.proUntil ?? 0 }
      : {
          id: token(),
          email,
          cancers: sub.cancers,
          regions: sub.regions,
          createdAt: new Date().toISOString(),
          confirmed: false,
          token: token(),
          proUntil: sub.proUntil ?? 0,
        };
    const cmds: [string, ...string[]][] = [
      ['SET', subKey(email), JSON.stringify(created)],
      ['SET', tokKey(created.token), email],
      ['SADD', INDEX_KEY, email],
    ];
    await upstash(cmds);
    return created;
  }

  async remove(email: string): Promise<boolean> {
    const e = email.toLowerCase();
    const found = await this.find(e);
    const cmds: [string, ...string[]][] = [
      ['SREM', INDEX_KEY, e],
      ['DEL', subKey(e)],
    ];
    if (found) cmds.push(['DEL', tokKey(found.token)]);
    await upstash(cmds);
    return true;
  }

  async find(email: string): Promise<Subscription | null> {
    const res = await upstash([['GET', subKey(email.toLowerCase())]]);
    const raw = res[0];
    return raw ? (JSON.parse(String(raw)) as Subscription) : null;
  }

  async findByToken(t: string): Promise<Subscription | null> {
    const res = await upstash([['GET', tokKey(t)]]);
    const email = res[0];
    if (!email) return null;
    return this.find(String(email));
  }

  async confirm(t: string): Promise<Subscription | null> {
    const sub = await this.findByToken(t);
    if (!sub) return null;
    const confirmed = { ...sub, confirmed: true };
    await upstash([
      ['SET', subKey(sub.email), JSON.stringify(confirmed)],
    ]);
    return confirmed;
  }

  async list(): Promise<Subscription[]> {
    const res = await upstash([['SMEMBERS', INDEX_KEY]]);
    const emails = (res[0] as string[]) ?? [];
    const subs: Subscription[] = [];
    for (const e of emails) {
      const s = await this.find(e);
      if (s) subs.push(s);
    }
    return subs;
  }

  async count(): Promise<number> {
    const res = await upstash([['SCARD', INDEX_KEY]]);
    return Number(res[0] ?? 0);
  }
}

// Prefer durable storage when configured; fall back to the ephemeral store.
export const store: SubscriptionStore =
  KV_URL && KV_TOKEN ? new KvSubscriptionStore() : new MemorySubscriptionStore();
