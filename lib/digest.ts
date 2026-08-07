import type { UpdateItem } from './types';
import { getCancerFeed, findBaselineItem } from './data';
import { getCancer } from './cancers';
import { getMessages, isLocale, DEFAULT_LOCALE, type Locale } from './i18n';
import type { Prefs } from './auth';
import type { Messages } from './messages/en';

/**
 * Everything the weekly digest renderer needs for one subscriber. Built
 * server-side by the cron job; the renderer (`renderWeeklyDigest`) turns it
 * into a neutral text + HTML email in the recipient's language.
 */
export interface DigestContext {
  m: Messages;
  locale: Locale;
  cancerLabels: string[];
  /** Saved records that changed within the window. */
  recordItems: UpdateItem[];
  /** New/updated public records for the followed cancer types. */
  cancerItems: UpdateItem[];
  followingUrl: string;
  generateUrl: string;
  unsubscribeUrl: string;
  siteUrl: string;
}

/**
 * Assemble the digest context for one subscriber.
 *
 *  - recordItems: saved records whose last-updated date falls in the window
 *    (only genuine changes — never the whole list).
 *  - cancerItems: new/updated public records for each followed cancer type
 *    this week, filtered to the subscriber's regions.
 *
 * Kept strictly factual: source fields only, no ranking, recommendation, or
 * interpretation of any record.
 */
export async function buildDigestContext(opts: {
  email: string;
  prefs: Prefs;
  sinceIso: string;
  siteUrl: string;
  unsubscribeBase: string;
}): Promise<DigestContext> {
  const { email, prefs, sinceIso, siteUrl, unsubscribeBase } = opts;

  const locale: Locale = isLocale(prefs.locale)
    ? (prefs.locale as Locale)
    : DEFAULT_LOCALE;
  const m = getMessages(locale);

  const cancers = Array.isArray(prefs.alertCancers) ? prefs.alertCancers : [];
  const cancerLabels = cancers.map((s) => getCancer(s)?.label ?? s);

  // Saved-record updates: only records that changed within the window.
  const recordItems: UpdateItem[] = [];
  for (const id of Array.isArray(prefs.myList) ? prefs.myList : []) {
    const item = findBaselineItem(id);
    if (!item) continue;
    if (item.date && item.date >= sinceIso) recordItems.push(item);
  }

  // Cancer-type activity: new/updated public records this week.
  const regions = Array.isArray(prefs.alertRegions) ? prefs.alertRegions : [];
  const collected: UpdateItem[] = [];
  for (const slug of cancers) {
    const { items } = await getCancerFeed(slug, { limit: 25 });
    for (const it of items) {
      if (!it.date || it.date < sinceIso) continue;
      if (regions.length && !regions.includes(it.region)) continue;
      collected.push(it);
    }
  }
  const cancerItems = Array.from(
    new Map(collected.map((i) => [i.id, i])).values()
  ).slice(0, 25);

  return {
    m,
    locale,
    cancerLabels,
    recordItems,
    cancerItems,
    followingUrl: `${siteUrl}/following`,
    generateUrl: `${siteUrl}/after-care`,
    unsubscribeUrl: `${unsubscribeBase}?email=${encodeURIComponent(email)}`,
    siteUrl,
  };
}
