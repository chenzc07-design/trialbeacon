// Client-side mirror of the server quota decision (no server imports, safe in
// the browser). The authoritative check/consume happens at
// /api/discussion-list/quota; this only fetches and types the result.

export type QuotaReason = 'genLimit' | 'daily';

export interface QuotaResult {
  allowed: boolean;
  plan: 'free' | 'pro';
  signedIn: boolean;
  reason: QuotaReason | null;
  /** Free daily generations left. -1 = unlimited (Pro). */
  dailyRemaining: number;
  dailyLimit: number;
  genLimit: number;
  unlockCredits: number;
  usesCredit: boolean;
  proUntil: number;
}

/** Read-only check, or set `consume=true` to also write the generation back. */
export async function requestQuota(
  items: number,
  consume = false
): Promise<QuotaResult> {
  const res = await fetch(
    `/api/discussion-list/quota${consume ? '?action=consume' : ''}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items }),
      cache: 'no-store',
    }
  );
  if (!res.ok) throw new Error(`quota_${res.status}`);
  return (await res.json()) as QuotaResult;
}
