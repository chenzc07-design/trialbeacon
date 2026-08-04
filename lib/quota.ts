// Server-authoritative quota for the neutral "doctor discussion list".
//
// One generation = one discussion-list PDF / printable export. The rules:
//   - Free, anonymous:       1 generation / day, up to 5 records / list.
//   - Free, signed-in:       3 generations / day, up to 10 records / list.
//   - Single unlock ($4.9):  one extra full list (≤10 records), no daily cap.
//   - Pro ($6.9 / month):    unlimited generations while subscribed, ≤10 records / list.
//
// State lives entirely in the signed `tb_prefs` cookie (extended), so there is
// no SQL store and nothing serverless-unsafe. Reads/writes go through the
// existing auth helpers.

import {
  getRequestPrefs,
  savePrefs,
  isProActive,
  type Prefs,
  type CookieSpec,
} from './auth';
import {
  FREE_DAILY_GENS,
  FREE_GEN_LIMIT,
  SIGNED_DAILY_GENS,
  SIGNED_GEN_LIMIT,
  PRO_GEN_LIMIT,
  SINGLE_UNLOCK_RECORDS,
  ANON_UID,
} from './auth-shared';

/** UTC 'YYYY-MM-DD' — the day bucket the free daily cap counts against. */
function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export type QuotaReason = 'genLimit' | 'daily';

export interface QuotaResult {
  allowed: boolean;
  plan: 'free' | 'pro';
  signedIn: boolean;
  /** Why a free request was denied ('genLimit' = too many records; 'daily' = out of daily generations). */
  reason: QuotaReason | null;
  /** Free daily generations left. -1 means unlimited (Pro). */
  dailyRemaining: number;
  dailyLimit: number;
  /** Max records allowed in a single list under the current plan. */
  genLimit: number;
  unlockCredits: number;
  /** True when this generation is being paid for with a single-unlock credit. */
  usesCredit: boolean;
  proUntil: number;
}

function evaluate(uid: string, prefs: Prefs, items: number): QuotaResult {
  const signedIn = uid !== ANON_UID;
  const pro = isProActive(prefs);
  const dailyLimit = signedIn ? SIGNED_DAILY_GENS : FREE_DAILY_GENS;
  const genLimit = signedIn ? SIGNED_GEN_LIMIT : FREE_GEN_LIMIT;
  const today = todayStr();
  const countToday = prefs.genDate === today ? prefs.genCount || 0 : 0;
  const dailyRemaining = dailyLimit - countToday;
  const credits = prefs.unlockCredits || 0;

  const base: QuotaResult = {
    allowed: false,
    plan: pro ? 'pro' : 'free',
    signedIn,
    reason: null,
    dailyRemaining,
    dailyLimit,
    genLimit,
    unlockCredits: credits,
    usesCredit: false,
    proUntil: pro ? prefs.proUntil : 0,
  };

  if (pro) {
    // Pro: unlimited generations while subscribed; still a per-list record cap.
    return {
      ...base,
      allowed: items <= PRO_GEN_LIMIT,
      dailyRemaining: -1,
      reason: items <= PRO_GEN_LIMIT ? null : 'genLimit',
    };
  }

  // Free plan.
  if (items > genLimit) {
    return { ...base, allowed: false, reason: 'genLimit' };
  }
  if (dailyRemaining > 0) {
    return { ...base, allowed: true, dailyRemaining };
  }
  // Daily free generations exhausted — fall back to a single-unlock credit.
  if (credits > 0) {
    return { ...base, allowed: true, dailyRemaining: 0, usesCredit: true };
  }
  return { ...base, allowed: false, reason: 'daily' };
}

/** Read-only check: can the current request generate a list of `items` records? */
export async function checkQuota(items: number): Promise<QuotaResult> {
  const { uid, prefs } = await getRequestPrefs();
  return evaluate(uid, prefs, items);
}

export interface ConsumeResult extends QuotaResult {
  /** Set only when a cookie must be written back to the response. */
  cookie?: CookieSpec;
}

/**
 * Check AND consume a generation. Returns the quota decision plus, when a
 * write is needed, the signed cookie the caller must attach to the response.
 */
export async function consumeQuota(items: number): Promise<ConsumeResult> {
  const { uid, prefs } = await getRequestPrefs();
  const res = evaluate(uid, prefs, items);
  if (!res.allowed) return res;

  const today = todayStr();
  const countToday = prefs.genDate === today ? prefs.genCount || 0 : 0;
  const next: Prefs = { ...prefs };
  next.genDate = today;
  next.genCount = countToday + 1;
  if (res.usesCredit) {
    next.unlockCredits = Math.max(0, (prefs.unlockCredits || 0) - 1);
  }

  const { cookie } = await savePrefs(uid, next);
  const out: ConsumeResult = { ...res, cookie };
  out.unlockCredits = next.unlockCredits;
  // Reflect the actual remaining count after this generation was written.
  out.dailyRemaining =
    res.plan === 'pro' ? -1 : Math.max(0, res.dailyLimit - next.genCount);
  return out;
}

/** Per-list record cap for a single-unlock credit (used by the entitlement layer). */
export const SINGLE_UNLOCK_CAP = SINGLE_UNLOCK_RECORDS;
