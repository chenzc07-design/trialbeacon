import { store } from './subscriptions';
import { isProActive } from './auth';
import type { Region } from './types';

/**
 * Mirror a person's alert settings into the subscription store, which is what
 * the weekly digest job actually reads. Signing in already proved the address
 * (email code or Google), so the record is marked confirmed here rather than
 * sending a second opt-in email.
 *
 * The weekly digest email is a Pro feature: a confirmed subscriber is only
 * written when the caller is an active Pro. Free followers still keep their
 * followed-cancer list in `alertCancers` (visible in /following) but receive
 * no email.
 */
export async function syncDigestSubscription(
  email: string,
  enabled: boolean,
  cancers: string[],
  regions: Region[],
  proUntil: number
): Promise<void> {
  try {
    const wantsDigest = enabled && proUntil > Date.now() && cancers.length > 0;
    if (!wantsDigest) {
      await store.remove(email);
      return;
    }
    const sub = await store.upsert({ email, cancers, regions, proUntil });
    if (!sub.confirmed) await store.confirm(sub.token);
  } catch {
    /* preferences are saved either way; the digest can resync next save */
  }
}
