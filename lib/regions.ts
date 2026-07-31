import type { Region } from './types';

/**
 * Country → region mapping used to derive the region tabs from the
 * recruiting locations published in an official trial record.
 *
 * Scope of each bucket (documented on the Sources & methodology page):
 *  - US: United States
 *  - EU: European Economic Area + Switzerland + United Kingdom. The label is
 *    "Europe" in the UI; the EU regulators we track (EMA, CTIS) sit inside
 *    this area, and separating post-Brexit UK into its own bucket would hide
 *    genuinely European studies from people looking for them.
 *  - CN: Chinese mainland, Hong Kong SAR, Macao SAR and Taiwan region.
 *  - OTHER: everything else. We never silently fold these into another
 *    bucket — the real country list is always shown on the record.
 *
 * Country strings are matched exactly against the values ClinicalTrials.gov
 * publishes, so this table uses their spellings.
 */

const EUROPE = new Set([
  // EU 27
  'Austria', 'Belgium', 'Bulgaria', 'Croatia', 'Cyprus', 'Czechia',
  'Czech Republic', 'Denmark', 'Estonia', 'Finland', 'France', 'Germany',
  'Greece', 'Hungary', 'Ireland', 'Italy', 'Latvia', 'Lithuania',
  'Luxembourg', 'Malta', 'Netherlands', 'Poland', 'Portugal', 'Romania',
  'Slovakia', 'Slovenia', 'Spain', 'Sweden',
  // EEA / EFTA
  'Iceland', 'Liechtenstein', 'Norway', 'Switzerland',
  // UK
  'United Kingdom',
]);

const GREATER_CHINA = new Set([
  'China',
  'Hong Kong',
  'Macau',
  'Macao',
  'Taiwan',
]);

/** Maps a single published country string to a region bucket. */
export function countryToRegion(country: string): Region {
  const c = country.trim();
  if (c === 'United States') return 'US';
  if (EUROPE.has(c)) return 'EU';
  if (GREATER_CHINA.has(c)) return 'CN';
  return 'OTHER';
}

/**
 * Derives the region buckets a record belongs to from its recruiting
 * countries. Returns them in a stable order so the UI is deterministic.
 */
export function regionsFromCountries(countries: string[]): Region[] {
  const set = new Set<Region>();
  for (const c of countries) set.add(countryToRegion(c));
  return (['US', 'EU', 'CN', 'OTHER'] as const).filter((r) => set.has(r));
}

/**
 * Picks the primary bucket for a record. Preference order follows the site's
 * three tracked jurisdictions; a study that recruits nowhere in them is
 * reported honestly as OTHER rather than being pushed into one.
 */
export function primaryRegion(regions: Region[]): Region {
  return regions[0] ?? 'OTHER';
}

/** Human-readable summary, e.g. "United States, Germany +3 more". */
export function summariseCountries(countries: string[], max = 3): string {
  if (countries.length === 0) return '';
  const head = countries.slice(0, max).join(', ');
  const rest = countries.length - max;
  return rest > 0 ? `${head} +${rest}` : head;
}