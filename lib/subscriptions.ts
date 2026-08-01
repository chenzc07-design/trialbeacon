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
  cancers: string[]; // max 3 slugs
  regions: Region[];
  createdAt: string;
  confirmed: boolean; // double opt-in flag, set by the confirmation endpoint
  /**
   * Opaque token used for one-click confirm / unsubscribe links and, later,
   * for passwordless sign-in. Keeping it on the subscription record means a
   * future user system can be layered on without a data migration.
   */
  token: string;
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

// Module-scoped Map: persists across requests within a single warm serverless
// instance and is wiped on cold starts. Sufficient for a demo aggregator.
const memory = new Map<string, Subscription>();

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
export const MAX_CANCERS = 3;
