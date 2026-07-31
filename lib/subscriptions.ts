import { promises as fs } from 'fs';
import path from 'path';
import type { Region } from './types';

/**
 * Subscription storage adapter.
 *
 * The default implementation persists to a JSON file so the free tier works
 * out of the box on a single server. To move to a database or an email
 * service (e.g. Postgres + Resend/Postmark), implement `SubscriptionStore`
 * and swap the export at the bottom — no route or UI changes required.
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

const DATA_DIR = process.env.TRIALBEACON_DATA_DIR ?? path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'subscriptions.json');

async function readAll(): Promise<Subscription[]> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw) as Subscription[];
  } catch {
    return [];
  }
}

async function writeAll(subs: Subscription[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DATA_FILE, JSON.stringify(subs, null, 2), 'utf8');
}

class FileSubscriptionStore implements SubscriptionStore {
  async upsert(
    sub: Omit<Subscription, 'id' | 'createdAt' | 'confirmed' | 'token'>
  ): Promise<Subscription> {
    const subs = await readAll();
    const email = sub.email.toLowerCase();
    const existing = subs.find((s) => s.email === email);
    if (existing) {
      existing.cancers = sub.cancers;
      existing.regions = sub.regions;
      existing.token ||= crypto.randomUUID();
      await writeAll(subs);
      return existing;
    }
    const created: Subscription = {
      id: crypto.randomUUID(),
      email,
      cancers: sub.cancers,
      regions: sub.regions,
      createdAt: new Date().toISOString(),
      confirmed: false,
      token: crypto.randomUUID(),
    };
    subs.push(created);
    await writeAll(subs);
    return created;
  }

  async remove(email: string): Promise<boolean> {
    const subs = await readAll();
    const next = subs.filter((s) => s.email !== email.toLowerCase());
    if (next.length === subs.length) return false;
    await writeAll(next);
    return true;
  }

  async find(email: string): Promise<Subscription | null> {
    const subs = await readAll();
    return subs.find((s) => s.email === email.toLowerCase()) ?? null;
  }

  async findByToken(token: string): Promise<Subscription | null> {
    const subs = await readAll();
    return subs.find((s) => s.token === token) ?? null;
  }

  async confirm(token: string): Promise<Subscription | null> {
    const subs = await readAll();
    const found = subs.find((s) => s.token === token);
    if (!found) return null;
    found.confirmed = true;
    await writeAll(subs);
    return found;
  }

  async list(): Promise<Subscription[]> {
    return readAll();
  }

  async count(): Promise<number> {
    return (await readAll()).length;
  }
}

export const subscriptionStore: SubscriptionStore = new FileSubscriptionStore();

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const MAX_CANCERS = 3;
