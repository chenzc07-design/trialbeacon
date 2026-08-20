// Central, privacy-first metrics store for the site owner:
//   • payment records (amount / currency / type / email / time) → revenue + paid-user count
//   • distinct account emails (first sign-in) → registration count
//
// Persists to Upstash Redis when UPSTASH_REDIS_REST_URL + _TOKEN are set; otherwise
// it falls back to an in-memory store that is ephemeral on serverless (same caveat
// as the stats counters). The admin dashboard is only trustworthy once Upstash is
// configured. No health information is ever stored — only payment metadata and the
// email key used for de-duplication.
//
// Server-only.

import { isSyncConfigured } from './auth';
import { loadJson, saveJson } from './persist';

const KV_URL = process.env.UPSTASH_REDIS_REST_URL;
const KV_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Upstash REST pipeline (mirrors the pattern in subscriptions.ts / auth.ts):
 * POST /pipeline with a bare array of command arrays; the response is one
 * `{ result }` object per command, in order.
 */
async function upstash(cmds: [string, ...string[]][]): Promise<unknown[]> {
  const base = (KV_URL ?? '').replace(/\/+$/, '');
  const res = await fetch(`${base}/pipeline`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${KV_TOKEN}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(cmds),
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`upstash_${res.status}`);
  const json = (await res.json()) as { result?: unknown }[] | { result?: unknown[] };
  if (Array.isArray(json)) return json.map((r) => r.result);
  return json.result ?? [];
}

export interface PaymentRecord {
  id: string;
  type: 'single' | 'subscription';
  amount: number; // numeric, already parsed
  currency: string;
  paypalId: string;
  email?: string;
  at: number; // epoch ms
}

// In-memory caches, hydrated from / written back to a local JSON file
// (`.tb_state/*.json`) when Upstash is not configured. This keeps payment
// records and the registration count alive across server restarts in writable
// environments (local dev, sandbox preview). Per-instance only — configure
// Upstash for production-grade multi-instance durability.
const memPayments: PaymentRecord[] = [];
const memAccounts = new Set<string>();
let payLoaded = false;
let acctLoaded = false;

async function hydratePayments(): Promise<void> {
  if (payLoaded) return;
  const arr = await loadJson<PaymentRecord[]>('payments.json', []);
  if (Array.isArray(arr)) memPayments.push(...arr);
  payLoaded = true;
}

async function persistPayments(): Promise<void> {
  await saveJson('payments.json', memPayments);
}

async function hydrateAccounts(): Promise<void> {
  if (acctLoaded) return;
  const arr = await loadJson<string[]>('accounts.json', []);
  if (Array.isArray(arr)) for (const e of arr) memAccounts.add(e.toLowerCase());
  acctLoaded = true;
}

async function persistAccounts(): Promise<void> {
  await saveJson('accounts.json', [...memAccounts]);
}

/** Wipe payment + account state (used by the dev seed route for idempotent seeding). */
export async function resetMetrics(): Promise<void> {
  memPayments.length = 0;
  memAccounts.clear();
  payLoaded = false;
  acctLoaded = false;
  await saveJson('payments.json', []);
  await saveJson('accounts.json', []);
}

export function metricsPersistent(): boolean {
  return isSyncConfigured();
}

export const METRICS_STORE: 'upstash' | 'file' = isSyncConfigured() ? 'upstash' : 'file';

/** Persist one payment. Safe to call from any payment-confirmation path. */
export async function recordPayment(
  p: Omit<PaymentRecord, 'id' | 'at'> & { id?: string; at?: number }
): Promise<void> {
  const rec: PaymentRecord = {
    id: p.id ?? `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: p.type,
    amount: Number(p.amount) || 0,
    currency: (p.currency || 'USD').toUpperCase(),
    paypalId: p.paypalId || '',
    email: p.email ? p.email.toLowerCase() : undefined,
    at: p.at ?? Date.now(),
  };
  if (!isSyncConfigured()) {
    await hydratePayments();
    memPayments.push(rec);
    await persistPayments();
    return;
  }
  await upstash([
    ['SET', `tb:pay:${rec.id}`, JSON.stringify(rec)],
    ['SADD', 'tb:pays', rec.id],
  ]);
}

/** All payment records, oldest first. */
export async function readPayments(): Promise<PaymentRecord[]> {
  if (!isSyncConfigured()) {
    await hydratePayments();
    return memPayments.slice();
  }
  const res = await upstash([['SMEMBERS', 'tb:pays']]);
  const ids = (res[0] as string[]) ?? [];
  const out: PaymentRecord[] = [];
  for (const id of ids) {
    const r = await upstash([['GET', `tb:pay:${id}`]]);
    if (r[0]) out.push(JSON.parse(String(r[0])) as PaymentRecord);
  }
  return out.sort((a, b) => a.at - b.at);
}

export interface PaymentSummary {
  revenue: number;
  currency: string;
  paymentCount: number;
  /** Distinct payer emails; falls back to payment count when no email is known. */
  paidUsers: number;
}

export function summarizePayments(payments: PaymentRecord[]): PaymentSummary {
  let revenue = 0;
  const currencies = new Set<string>();
  const users = new Set<string>();
  for (const p of payments) {
    revenue += p.amount;
    currencies.add(p.currency);
    if (p.email) users.add(p.email.toLowerCase());
  }
  return {
    revenue: Math.round(revenue * 100) / 100,
    currency: currencies.size === 1 ? [...currencies][0] : 'USD',
    paymentCount: payments.length,
    paidUsers: users.size > 0 ? users.size : payments.length,
  };
}

/**
 * Record an account email on first sign-in. Returns true only the first time a
 * given address is seen, so callers can increment the registration counter
 * exactly once per person. Identity beyond the email key is never stored.
 */
export async function markAccountSeen(email: string): Promise<boolean> {
  const e = email.toLowerCase();
  if (!isSyncConfigured()) {
    await hydrateAccounts();
    if (memAccounts.has(e)) return false;
    memAccounts.add(e);
    await persistAccounts();
    return true;
  }
  const res = await upstash([['SADD', 'tb:accts', e]]);
  // SADD returns the number of elements added (1 = new, 0 = already present).
  return Number(res[0] ?? 0) === 1;
}

/** Total distinct registered accounts. */
export async function readAccountCount(): Promise<number> {
  if (!isSyncConfigured()) {
    await hydrateAccounts();
    return memAccounts.size;
  }
  const res = await upstash([['SCARD', 'tb:accts']]);
  return Number(res[0] ?? 0);
}

/**
 * Remove the identifiable account link from owner metrics after an account
 * deletion. Aggregate payment counts and amounts remain for reconciliation,
 * while the payer email is discarded. No health information is involved.
 */
export async function anonymizeAccountMetrics(email: string): Promise<void> {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return;

  if (!isSyncConfigured()) {
    await hydrateAccounts();
    memAccounts.delete(normalized);
    await persistAccounts();

    await hydratePayments();
    let changed = false;
    for (const payment of memPayments) {
      if (payment.email?.toLowerCase() === normalized) {
        delete payment.email;
        changed = true;
      }
    }
    if (changed) await persistPayments();
    return;
  }

  const idResult = await upstash([['SMEMBERS', 'tb:pays']]);
  const ids = (idResult[0] as string[]) ?? [];
  const writes: [string, ...string[]][] = [['SREM', 'tb:accts', normalized]];

  for (const id of ids) {
    const recordResult = await upstash([['GET', `tb:pay:${id}`]]);
    if (!recordResult[0]) continue;
    const payment = JSON.parse(String(recordResult[0])) as PaymentRecord;
    if (payment.email?.toLowerCase() === normalized) {
      delete payment.email;
      writes.push(['SET', `tb:pay:${id}`, JSON.stringify(payment)]);
    }
  }

  await upstash(writes);
}
